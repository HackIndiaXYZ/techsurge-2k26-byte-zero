import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import torch
import torch.nn as nn
import torch.optim as optim
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import IsolationForest
import os

date_range = pd.date_range(start='2024-01-01', end='2025-12-31', freq='D')

products = [
    'Sofa', 'Television', 'Bed', 'Toaster', 'Coffee Maker', 'T-Shirt', 'Laptop', 
    'Dining Table', 'Refrigerator', 'Chair', 'Blender', 'Jeans', 'Smartphone', 
    'Nightstand', 'Microwave', 'Shirt', 'Tablet', 'Desk Lamp', 'Vacuum Cleaner', 'Couch'
]

shops = ['Shop_A', 'Shop_B', 'Shop_C']

if os.path.exists('demand_predictions.csv'):
    predictions_df = pd.read_csv('demand_predictions.csv')
    try:
        global_anomalies = pd.read_csv('demand_anomalies.csv')
    except:
        global_anomalies = pd.DataFrame()
else:
    data = []

    for date in date_range:
        for shop_id in shops:
            for product_name in products:
                sales = np.random.poisson(20)
                season = 'Winter' if date.month in [12, 1, 2] else 'Spring' if date.month in [3, 4, 5] else 'Summer' if date.month in [6, 7, 8] else 'Fall'
                promotion = np.random.choice([0, 1])
                competitor_activity = np.random.choice([0, 1])
                sentiment = np.random.choice(['Positive', 'Neutral', 'Negative'])
                data.append([date, shop_id, product_name, sales, season, promotion, competitor_activity, sentiment])

    df = pd.DataFrame(data, columns=['Date', 'Shop_ID', 'Product_Name', 'Sales', 'Season', 'Promotion', 'Competitor_Activity', 'Review_Sentiment'])

    df = pd.get_dummies(df, columns=['Season', 'Promotion', 'Competitor_Activity', 'Review_Sentiment'])

    X = df.drop(columns=['Date', 'Shop_ID', 'Product_Name', 'Sales'])
    y = df['Sales']

    scaler = StandardScaler()
    X = scaler.fit_transform(X)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    class DemandPredictor(nn.Module):
        def __init__(self):
            super(DemandPredictor, self).__init__()
            self.fc1 = nn.Linear(X_train.shape[1], 128)
            self.fc2 = nn.Linear(128, 64)
            self.fc3 = nn.Linear(64, 1)
            self.relu = nn.ReLU()
        
        def forward(self, x):
            x = self.relu(self.fc1(x))
            x = self.relu(self.fc2(x))
            x = self.fc3(x)
            return x

    model = DemandPredictor()
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)

    model_path = 'futuredemand_model.pth'
    if os.path.exists(model_path):
        print("[AI] Fast-loading pre-trained Future Demand model...")
        model.load_state_dict(torch.load(model_path, weights_only=True))
    else:
        print("[AI] Training fresh Future Demand model (100 epochs)...")
        X_train_tensor = torch.tensor(X_train, dtype=torch.float32)
        y_train_tensor = torch.tensor(y_train.values, dtype=torch.float32).view(-1, 1)

        epochs = 100
        for epoch in range(epochs):
            model.train()
            optimizer.zero_grad()
            outputs = model(X_train_tensor)
            loss = criterion(outputs, y_train_tensor)
            loss.backward()
            optimizer.step()
        torch.save(model.state_dict(), model_path)

    def predict_demand_date_range(date):
        start_date = pd.Timestamp(date)
        end_date = start_date + pd.Timedelta(days=np.random.randint(7, 30))
        return start_date, end_date

    def run_anomaly_check(df_data):
        print("[AI] Running Anomaly Detection scan...")
        features = ['Sales', 'Promotion_1', 'Competitor_Activity_1']
        X_iso = df_data[features]
        
        iso_forest = IsolationForest(contamination=0.01, random_state=42)
        df_data['Anomaly_Flag'] = iso_forest.fit_predict(X_iso)
        
        anomalies = df_data[df_data['Anomaly_Flag'] == -1]
        anomalies.to_csv('demand_anomalies.csv', index=False)
        print(f"[AI] {len(anomalies)} anomalies detected and saved to 'demand_anomalies.csv'")
        return df_data, anomalies

    df, global_anomalies = run_anomaly_check(df)

    model.eval()
    predictions = []
    with torch.no_grad():
        for shop in shops:
            for product in products:
                sample_date = df[(df['Shop_ID'] == shop) & (df['Product_Name'] == product)]['Date'].max()
                sample_data = df[(df['Date'] == sample_date) & (df['Shop_ID'] == shop) & (df['Product_Name'] == product)].iloc[0]
                
                input_data = torch.tensor(scaler.transform(sample_data.drop(['Date', 'Shop_ID', 'Product_Name', 'Sales', 'Anomaly_Flag']).values.reshape(1, -1)), dtype=torch.float32)
                
                predicted_sales = model(input_data).item()
                start_date, end_date = predict_demand_date_range(sample_date)
        
                reasons = []
                if sample_data.get('Promotion_1', 0) == 1: reasons.append("Active Promo")
                if sample_data.get('Review_Sentiment_Positive', 0) == 1: reasons.append("Social Buzz")
                if sample_data.get('Competitor_Activity_0', 0) == 1: reasons.append("Low Competition")
                if sample_data.get('Season_Winter', 0) == 1: reasons.append("Winter Peak")
                if sample_data.get('Season_Summer', 0) == 1: reasons.append("Summer Surge")
                
                if not reasons:
                    if sample_data.get('Review_Sentiment_Negative', 0) == 1: reasons.append("Negative Sentiment")
                    if sample_data.get('Competitor_Activity_1', 0) == 1: reasons.append("High Competition")
                    if not reasons: reasons.append("Market Trends")
                
                reason = " & ".join(reasons[:2])
                demand_shift = np.random.uniform(-5, 50)
                
                predictions.append({
                    'Shop': shop,
                    'Product': product,
                    'Demand_Start_Date': start_date.date(),
                    'Demand_End_Date': end_date.date(),
                    'Demand_Shift_Pct': round(demand_shift, 2),
                    'Reason': reason
                })

    predictions_df = pd.DataFrame(predictions)
    predictions_df.to_csv('demand_predictions.csv', index=False)
    print("Predictions have been saved to 'demand_predictions.csv'")


def get_predictions_for_api(shop_filter=None, product_filter=None):
    res = predictions_df.copy()
    if shop_filter:
        res = res[res['Shop'] == shop_filter]
    if product_filter:
        res = res[res['Product'] == product_filter]
    return res.to_dict(orient='records')

import sys

if __name__ == "__main__":
    if sys.stdin.isatty():
        while True:
            print("\nAvailable shops:", ', '.join(shops))
            shop_to_display = input("Enter the shop name to display (or 'q' to quit): ").strip()
            
            if shop_to_display.lower() == 'q':
                break
            
            if shop_to_display not in shops:
                print(f"Invalid shop name '{shop_to_display}'. Please try again.")
                continue
            
            print(f"\nPredictions for {shop_to_display}:")
            shop_predictions = predictions_df[predictions_df['Shop'] == shop_to_display]
            print(shop_predictions.to_string(index=False))
            
            print("\nAvailable products:", ', '.join(products))
            product_to_display = input("Enter the product name to display (or press Enter to skip): ").strip()
            
            if product_to_display:
                if product_to_display not in products:
                    print(f"Invalid product name '{product_to_display}'. Skipping product display.")
                else:
                    print(f"\nPredictions for {product_to_display} in {shop_to_display}:")
                    product_predictions = shop_predictions[shop_predictions['Product'] == product_to_display]
                    print(product_predictions.to_string(index=False))
                    
                    product_anomalies = global_anomalies[(global_anomalies['Shop_ID'] == shop_to_display) & 
                                                        (global_anomalies['Product_Name'] == product_to_display)]
                    if not product_anomalies.empty:
                        print(f"[!] WARNING: {len(product_anomalies)} anomalies detected for {product_to_display}!")
                        print(product_anomalies[['Date', 'Sales', 'Anomaly_Flag']].head(3))
    else:
        print("Non-interactive mode detected. Skipping display loop.")
