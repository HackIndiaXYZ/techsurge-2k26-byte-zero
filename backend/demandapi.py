from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import os
import random
import traceback

from rankingmodel import get_shop_rankings
from productorder import take_orders
import os
import pandas as pd

app = Flask(__name__)

CORS(app)


@app.get("/")
def root():
    return jsonify({"status": "online", "engine": "AI-Neural-Logistics"})


@app.get("/rankings")
def get_rankings():
    try:
        from rankingmodel import get_shop_rankings
        rankings_raw = get_shop_rankings()
        
        results = []
        shop_mapping = {
            "Shop_A": {"store": "A", "name": "Shop A — Mumbai"},
            "Shop_B": {"store": "B", "name": "Shop B — Delhi"},
            "Shop_C": {"store": "C", "name": "Shop C — Chennai"}
        }
        
        for shop_id, data in rankings_raw.items():
            if shop_id in shop_mapping:
                results.append({
                    "store": shop_mapping[shop_id]["store"],
                    "name": shop_mapping[shop_id]["name"],
                    "sentimentScore": int(data['sentiment'] * 100) if pd.notnull(data['sentiment']) else 0,
                    "revenue7d": float(data['score'] * 100) if pd.notnull(data['score']) else 0.0,
                    "stockHealth": random.randint(40, 95)
                })
        return jsonify(results)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.get("/reviews/<shop_id>")
def get_reviews(shop_id):
    try:
        file_path = "shop_reviews_advanced.csv"
        if not os.path.exists(file_path):
            return jsonify([])
        
        df = pd.read_csv(file_path)
        shop_name = f"Shop {shop_id.upper()}"
        shop_reviews = df[df['Shop_ID'] == shop_name].to_dict(orient="records")
        
        formatted = []
        for r in shop_reviews:
            formatted.append({
                "name": f"User {r['Review ID']}",
                "stars": random.randint(3, 5) if r['Sentiment'] == 'Positive' else random.randint(1, 3),
                "text": r['Review Text'],
                "sentiment": r['Sentiment'].upper()
            })
        return jsonify(formatted)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.get("/inventory/<shop_id>")
def get_inventory(shop_id):
    try:
        # Explicit mapping due to inconsistent filenames
        if shop_id.lower() == "a":
            file_path = "shop_1_combined.csv"
        elif shop_id.lower() == "b":
            file_path = "shop_2.csv"
        elif shop_id.lower() == "c":
            file_path = "shop_3.csv"
        else:
            return jsonify({"error": "Shop not found"}), 404
             
        if not os.path.exists(file_path):
            return jsonify([])
            
        df = pd.read_csv(file_path)
        df['Date'] = pd.to_datetime(df['Date'], dayfirst=True, errors='coerce')
        df = df.dropna(subset=['Date'])
        
        latest_date = df['Date'].max()
        latest_items = df[df['Date'] == latest_date].to_dict(orient="records")
        
        def safe_int(val):
            try:
                if pd.isna(val): return 0
                return int(float(val))
            except:
                return 0
                
        formatted = []
        for item in latest_items:
            formatted.append({
                "product": item['Product Name'],
                "shelf": safe_int(item['Visible Stock']),
                "backroom": safe_int(item['Inventory']),
                "maxCapacity": 200
            })
        return jsonify(formatted)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.get("/status")
def get_status():
    shops = [
        {"store": "A", "name": "Shop A — Mumbai", "online": True, "activeSKUs": 142, "lastSync": "2 min ago"},
        {"store": "B", "name": "Shop B — Delhi", "online": True, "activeSKUs": 128, "lastSync": "5 min ago"},
        {"store": "C", "name": "Shop C — Chennai", "online": True, "activeSKUs": 156, "lastSync": "1 min ago"},
    ]
    return jsonify(shops)


@app.get("/forecast/<shop_id>/<product_name>")
def get_forecast(shop_id, product_name):
    try:
        from unified_forecasting_engine import get_weekly_forecasts
        
        # shop_id from URL can be 'a', 'b', 'c', or 'all'
        results = get_weekly_forecasts(product_name, shop_id)
        
        if not results:
            return jsonify({"error": "No forecast found for this product/store combo"}), 404
            
        if str(shop_id).lower() != 'all':
            res = results[0]
            daily_arr = [int(x) for x in res.get('Daily_Demand_Array', [])]
            return jsonify({
                "sku": str(res['SKU']),
                "store": str(res['Store']),
                "weekly_forecasts": res.get('Weekly_Forecasts', {}),
                "daily_demand_array": daily_arr,
                "predictions": daily_arr,
                "total_demand": int(res.get('Total_Demand', 0)),
                "predicted_visible_stock": int(res.get('Predicted_Visible_Stock', 0)),
                "predicted_inventory": int(res.get('Predicted_Inventory', 0)),
                "profit_margin_pct": float(res.get('Profit_Margin_Pct', 0)),
                "confidence_score": float(res.get('Confidence_Score', 85.0)),
                "confidence_factors": str(res.get('Confidence_Factors', 'Stable patterns')),
                "primary_drivers": str(res.get('Primary_Drivers', 'Market Trends')),
                "demand_shift_pct": float(res.get('Demand_Shift_Pct', 0)),
                "forecast_range": res.get('Forecast_Range', {}),
                "review_recommendation": res.get('Review_Recommendation', {'Required': False, 'Reason': 'Normal'})
            })
        
        return jsonify(results)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.get("/anomalies")
def get_anomalies():
    file_path = "master_demand_intelligence.csv"
    if not os.path.exists(file_path):
        return jsonify([])
    try:
        df = pd.read_csv(file_path)
        df_anomalies = df[df['Anomaly_Count'] > 0].tail(20)
        
        records = []
        store_map_inv = {"Store_A": "A", "Store_B": "B", "Store_C": "C", "Store_1": "A", "Store_2": "B", "Store_3": "C"}
        
        for i, row in df_anomalies.iterrows():
            records.append({
                "id": int(i),
                "store": store_map_inv.get(str(row['Store']), str(row['Store'])),
                "item": str(row['Product Name']),
                "spike": str(row.get('Spike_Pct', '+20%')),
                "time": str(row.get('Relative_Time', '2h ago')),
                "anomaly_count": int(row.get('Anomaly_Count', 1)),
                "status": str(row.get('Review_Status', 'Review Recommended'))
            })
        return jsonify(records)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.get("/summary")
def get_management_summary():
    file_path = "master_demand_intelligence.csv"
    try:
        if not os.path.exists(file_path):
            return jsonify({"error": "No data found"}), 404
            
        df = pd.read_csv(file_path)
        
        # Safely parse and filter stockout dates
        urgent_df = df[df['Stockout_Date'].notna() & (df['Stockout_Date'] != "No Stockout expected")].copy()
        urgent_df['Stockout_Date_DT'] = pd.to_datetime(urgent_df['Stockout_Date'], errors='coerce')
        urgent_df = urgent_df.dropna(subset=['Stockout_Date_DT'])
        urgent_sorted = urgent_df.sort_values(by='Stockout_Date_DT').head(5)
        
        urgent_clean = []
        for _, row in urgent_sorted.iterrows():
            urgent_clean.append({
                "Store": str(row['Store']),
                "Product Name": str(row['Product Name']),
                "Stockout_Date": str(row['Stockout_Date_DT'].strftime('%Y-%m-%d')),
                "Predicted_30D_Profit": float(row.get('Predicted_30D_Profit', 0) or 0),
                "Predicted_30D_Demand": float(row.get('Predicted_30D_Demand', 0) or 0),
                "Confidence_Score": float(row.get('Confidence_Score', 0) or 0),
                "Review_Status": str(row.get('Review_Status', 'Normal'))
            })
        
        profit_df = df.sort_values(by='Predicted_30D_Profit', ascending=False).head(5)
        profitable_clean = []
        for _, row in profit_df.iterrows():
            profitable_clean.append({
                "Store": str(row['Store']),
                "Product Name": str(row['Product Name']),
                "Predicted_30D_Profit": float(row.get('Predicted_30D_Profit', 0) or 0),
                "Predicted_30D_Demand": float(row.get('Predicted_30D_Demand', 0) or 0),
                "Confidence_Score": float(row.get('Confidence_Score', 0) or 0),
                "Review_Status": str(row.get('Review_Status', 'Normal'))
            })
        
        stats = {
            "total_records": int(len(df)),
            "review_recommended_count": int(len(df[df['Review_Status'] == "Review Recommended"])),
            "average_confidence": round(float(df['Confidence_Score'].fillna(0).mean()), 2),
            "total_predicted_profit": round(float(df['Predicted_30D_Profit'].fillna(0).sum()), 2)
        }
        
        return jsonify({
            "critical_stockouts": urgent_clean,
            "top_profit_drivers": profitable_clean,
            "overall_stats": stats
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.get("/orders")
def get_all_orders():
    try:
        file_path = "orders.csv"
        if not os.path.exists(file_path) or os.path.getsize(file_path) == 0:
            if os.path.exists("orders_seed.csv"):
                pd.read_csv("orders_seed.csv").to_csv(file_path, index=False)
            else:
                return jsonify([])
        
        df = pd.read_csv(file_path)
        return jsonify(df.to_dict(orient="records"))
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.post("/order/<product_name>")
def place_order(product_name):
    try:
        file_path = "orders.csv"
        if os.path.exists(file_path):
            df = pd.read_csv(file_path)
            # Fulfill product order by removing from pending queue
            df = df[df['Product Name'].str.lower() != product_name.strip().lower()]
            df.to_csv(file_path, index=False)
            
        return jsonify({
            "status": "success",
            "message": f"Order processing and freight dispatch confirmed for {product_name}."
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.post("/orders/reset")
def reset_orders():
    try:
        seed_path = "orders_seed.csv"
        if os.path.exists(seed_path):
            df = pd.read_csv(seed_path)
            df.to_csv("orders.csv", index=False)
            return jsonify({"status": "success", "message": "Orders restored from seed dataset."})
        return jsonify({"status": "error", "message": "Seed file not found"}), 404
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.get("/vendors/<product_name>")
def get_vendors(product_name):
    try:
        if not os.path.exists("vendor.csv"):
            return jsonify([])
        df = pd.read_csv("vendor.csv")
        match = df[df['Product'].str.lower() == product_name.lower()].copy()
        match = match.sort_values(by=['Reliability_Rating', 'Delivery_Time'], ascending=[False, True])
        return jsonify(match.to_dict(orient="records"))
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.get("/surges")
def get_surges():
    shop = request.args.get("shop")
    product = request.args.get("product")
    try:
        file_path = "master_demand_intelligence.csv"
        if not os.path.exists(file_path):
            return jsonify([])
            
        df = pd.read_csv(file_path)
        
        # Consistent mapping
        store_map = {"a": "Store_A", "b": "Store_B", "c": "Store_C", "shop1": "Store_A", "shop2": "Store_B", "shop3": "Store_C"}
        target_store = store_map.get(shop.lower()) if shop else None
        
        res = df.copy()
        if target_store:
            res = res[res['Store'] == target_store]
        if product:
            res = res[res['Product Name'].str.lower() == product.lower()]
            
        surges = []
        for i, row in res.iterrows():
            prev = float(row.get('Prev_Week_Sales', 0) or 0)
            f_point = float(row.get('Forecast_Point', 0) or 0)
            shift = ((f_point - prev) / (prev + 1.0)) * 100.0
            
            driving_factor = str(row.get('Driving_Factors', '')) if pd.notnull(row.get('Driving_Factors')) else 'Market Trends'
            if not driving_factor:
                driving_factor = 'Market Trends'
                
            f_min = int(float(row.get('Forecast_Min', 0) or 0))
            f_max = int(float(row.get('Forecast_Max', 0) or 0))
            
            surges.append({
                'Shop': str(row.get('Store', '')),
                'Product': str(row.get('Product Name', '')),
                'Demand_Shift_Pct': round(shift, 2),
                'Reason': driving_factor,
                'Forecast_Range': f"{f_min}-{f_max}"
            })
            
        return jsonify(surges)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.get("/shipping/plan/<product_name>/<shop_id>")
def get_shipping_plan(product_name, shop_id):
    qty = request.args.get("qty", type=float)
    quick_param = request.args.get("quick")
    quick = (quick_param.lower() == "true") if quick_param is not None else None
    try:
        from optimal_cargoshipping import generate_shipping_plan
        plan = generate_shipping_plan(product_name, shop_id, confirmed_qty=qty, want_quick=quick)
        return jsonify(plan)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8008, debug=False)
