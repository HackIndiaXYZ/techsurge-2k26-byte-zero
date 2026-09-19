import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import finalstore1
import finalstore2
import finalstore3
import futuredemand
import os

def get_weekly_forecasts(product_name, shop_filter='all'):
    shops = {
        'Shop_A': {'module': finalstore1, 'files': ["shop_1_combined.csv"]},
        'Shop_B': {'module': finalstore2, 'files': ["shop_2.csv"]},
        'Shop_C': {'module': finalstore3, 'files': ["shop_3.csv"]}
    }
    
    target_shops = {}
    if str(shop_filter).strip().lower() == 'all':
        target_shops = shops
    else:
        filter_clean = str(shop_filter).strip().lower()
        store_map = {
            'a': 'Shop_A', '1': 'Shop_A', 'shop1': 'Shop_A', 'shop_a': 'Shop_A',
            'b': 'Shop_B', '2': 'Shop_B', 'shop2': 'Shop_B', 'shop_b': 'Shop_B',
            'c': 'Shop_C', '3': 'Shop_C', 'shop3': 'Shop_C', 'shop_c': 'Shop_C',
        }
        key = store_map.get(filter_clean, f"Shop_{filter_clean.upper()}")
        if key in shops:
            target_shops = {key: shops[key]}
        else:
            target_shops = shops

    weekly_data = []
    
    try:
        anomalies_df = pd.read_csv('demand_anomalies.csv')
    except:
        anomalies_df = pd.DataFrame()

    for shop_name, config in target_shops.items():
        try:
            reorder_date, qty, predictions, profit_pct, total_demand, final_vis, final_inv = config['module'].demand_forecasting_main(config['files'], product_name)
            
            if not predictions:
                continue
                
            weeks = []
            for i in range(0, 28, 7):
                week_sum = sum(predictions[i:i+7])
                weeks.append(week_sum)
            
            coef_var = np.std(predictions) / np.mean(predictions) if np.mean(predictions) > 0 else 0
            anomaly_count = 0
            if not anomalies_df.empty and 'Shop_ID' in anomalies_df.columns and 'Product_Name' in anomalies_df.columns:
                anomaly_count = len(anomalies_df[(anomalies_df['Shop_ID'] == shop_name) & (anomalies_df['Product_Name'] == product_name)])
            
            confidence = max(10.0, min(98.0, 95.0 - (coef_var * 20.0) - (anomaly_count * 5.0)))
            
            future_info = futuredemand.get_predictions_for_api(shop_name, product_name)
            reason = future_info[0]['Reason'] if future_info else "Market Trends"
            shift = future_info[0]['Demand_Shift_Pct'] if future_info else 0
            start_date = future_info[0]['Demand_Start_Date'] if future_info else (datetime.now().date())
            end_date = future_info[0]['Demand_End_Date'] if future_info else (datetime.now().date() + timedelta(days=30))
            
            conf_factors = []
            if anomaly_count > 0: conf_factors.append("Historical anomalies")
            if coef_var > 0.4: conf_factors.append("High volatility")
            if abs(shift) > 25: conf_factors.append("Major market shift")
            if not conf_factors: conf_factors.append("Stable patterns")
            conf_reason = " & ".join(conf_factors)

            review_required = False
            review_reason = "Normal"
            if confidence < 70:
                review_required = True
                review_reason = "High Uncertainty"
            if anomaly_count > 0:
                review_required = True
                review_reason = "Historical Anomaly Detected"
            if abs(shift) > 30:
                review_required = True
                review_reason = f"Significant Demand Shift ({shift}%)"

            weekly_data.append({
                'SKU': product_name,
                'Store': shop_name,
                'Weekly_Forecasts': {
                    'Week_1': weeks[0],
                    'Week_2': weeks[1],
                    'Week_3': weeks[2],
                    'Week_4': weeks[3]
                },
                'Daily_Demand_Array': predictions,
                'Total_Demand': total_demand,
                'Predicted_Visible_Stock': final_vis,
                'Predicted_Inventory': final_inv,
                'Profit_Margin_Pct': profit_pct,
                'Confidence_Score': round(confidence, 1),
                'Confidence_Factors': conf_reason,
                'Primary_Drivers': reason,
                'Demand_Shift_Pct': shift,
                'Forecast_Range': {
                    'Start': str(start_date),
                    'End': str(end_date)
                },
                'Review_Recommendation': {
                    'Required': review_required,
                    'Reason': review_reason
                }
            })
        except Exception as e:
            print(f"Error processing {shop_name} for {product_name}: {e}")
            
    return weekly_data

if __name__ == "__main__":
    print("--- UNIFIED FORECASTING ENGINE ---")
    product = input("Enter SKU/Product Name: ").strip()
    shop = input("Enter Store (A, B, C or 'all'): ").strip()
    
    if product:
        results = get_weekly_forecasts(product, shop)
        if not results:
            print(f"No results found for {product} in {shop}.")
        for res in results:
            print(f"\nSTORE: {res['Store']}")
            print(f"Weekly Targets: {res['Weekly_Forecasts']}")
            print(f"Confidence: {res['Confidence_Score']}")
            print(f"Drivers: {res['Primary_Drivers']}")
            if res['Review_Recommendation']['Required']:
                print(f"[!] REVIEW RECOMMENDED: {res['Review_Recommendation']['Reason']}")
            else:
                print("[✓] Auto-verified")
