
import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"
import numpy as np
import pandas as pd
import tensorflow as tf
import random
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
from keras.models import Sequential, load_model
from keras.layers import LSTM, Dense, Dropout
from keras.callbacks import EarlyStopping

tf.get_logger().setLevel('ERROR')
np.random.seed(42)
tf.random.set_seed(42)
random.seed(42)

ReorderThresholds = {
    "Sofa": 15, "Television": 2, "Bed": 2, "Toaster": 2, "Coffee Maker": 2, "T-Shirt": 10,
    "Laptop": 2, "Dining Table": 1, "Refrigerator": 1, "Chair": 4, "Blender": 3, "Jeans": 10,
    "Smartphone": 6, "Nightstand": 3, "Microwave": 2, "Shirt": 10, "Tablet": 5,
    "Desk Lamp": 5, "Vacuum Cleaner": 1, "Couch": 5
}

ProductPrices = {
    "Sofa": 350, "Television": 800, "Bed": 450, "Toaster": 30, "Coffee Maker": 60, "T-Shirt": 20,
    "Laptop": 1200, "Dining Table": 500, "Refrigerator": 900, "Chair": 120, "Blender": 45, "Jeans": 50,
    "Smartphone": 700, "Nightstand": 100, "Microwave": 150, "Shirt": 30, "Tablet": 350,
    "Desk Lamp": 40, "Vacuum Cleaner": 200, "Couch": 400
}

ProductCosts = {
    "Sofa": 210, "Television": 560, "Bed": 300, "Toaster": 15, "Coffee Maker": 35, "T-Shirt": 10,
    "Laptop": 840, "Dining Table": 300, "Refrigerator": 600, "Chair": 72, "Blender": 25, "Jeans": 25,
    "Smartphone": 420, "Nightstand": 60, "Microwave": 90, "Shirt": 15, "Tablet": 210,
    "Desk Lamp": 24, "Vacuum Cleaner": 120, "Couch": 240
}

move_to_visible_threshold = 2

def load_and_preprocess_data(file_names):
    combine_df = pd.concat([pd.read_csv(file, encoding='latin1') for file in file_names], ignore_index=True)
    combine_df.dropna(inplace=True)
    return combine_df

def preprocessing_data(df):
    scaler_demand = MinMaxScaler(feature_range=(0, 1))
    scaler_stock = MinMaxScaler(feature_range=(0, 1))
    df['Scaled Demand'] = scaler_demand.fit_transform(df[['Amount Sold']])
    df['Scaled Visible Stock'] = scaler_stock.fit_transform(df[['Visible Stock']])
    df['Scaled Inventory Stock'] = scaler_stock.fit_transform(df[['Inventory']])
    return df, scaler_demand, scaler_stock

def create_lstm_model(sequence_length):
    model = Sequential([
        LSTM(units=128, return_sequences=True, input_shape=(sequence_length, 3)),
        Dropout(0.2),
        LSTM(units=64),
        Dense(units=1)
    ])
    model.compile(optimizer='adam', loss='mse')
    return model

def train_model(model, X_train, y_train, X_val, y_val):
    early_stopping = EarlyStopping(monitor='val_loss', patience=3, restore_best_weights=True)
    model.fit(X_train, y_train, epochs=50, batch_size=16, validation_data=(X_val, y_val), callbacks=[early_stopping], verbose=0)

def make_predictions(model, product_data, scaler_demand, sequence_length, future_days=7):
    predictions = []
    for i in range(future_days):
        if len(product_data) < sequence_length:
            print("Insufficient data for making predictions.")
            break
        last_sequence = product_data[['Scaled Demand', 'Scaled Visible Stock', 'Scaled Inventory Stock']].iloc[-sequence_length:].values
        if last_sequence.shape == (sequence_length, 3):
            prediction = model.predict(last_sequence.reshape(1, sequence_length, 3), verbose=0).flatten()[0]
        else:
            continue
        scaled_prediction = prediction * 5.0 
        
        import math, random
        seasonal_offset = math.sin(i * (2 * math.pi / 7)) 
        random_noise = random.uniform(-0.5, 0.5)
        
        clamped_pred = max(0, min(5, round(scaled_prediction + seasonal_offset + random_noise)))
        predictions.append(clamped_pred)

        new_row = pd.DataFrame({
            'Scaled Demand': [prediction],
            'Scaled Visible Stock': [product_data['Scaled Visible Stock'].iloc[-1] - prediction],
            'Scaled Inventory Stock': [product_data['Scaled Inventory Stock'].iloc[-1] - prediction]
        }, index=[len(product_data)])
        product_data = pd.concat([product_data, new_row])

        visible_stock_change = clamped_pred
        inventory_stock_change = clamped_pred
        product_data.at[len(product_data) - 1, 'Visible Stock'] = product_data['Visible Stock'].iloc[-2] - visible_stock_change
        product_data.at[len(product_data) - 1, 'Inventory'] = product_data['Inventory'].iloc[-2] - inventory_stock_change

    return predictions

def check_reorder_and_print(product_data, product_name, predictions):
    reorder_thresh = ReorderThresholds[product_name]
    
    original_last_row = product_data.iloc[-1]
    current_visible_stock = original_last_row['Visible Stock']
    current_inventory_stock = original_last_row['Inventory']
    total_stock = current_visible_stock + current_inventory_stock
    
    max_date = pd.to_datetime(product_data['Date'].dropna().max())
    cumulative_demand = 0
    
    for i, prediction in enumerate(predictions, start=1):
        cumulative_demand += max(0, prediction)
        future_stock = total_stock - cumulative_demand
        
        if future_stock < reorder_thresh:
            future_date = max_date + pd.Timedelta(days=i)
            print(f"Stock level is low for {product_name} on {future_date.date()}")
            return True, future_date.date()
            
    return False, None

def move_to_visible(product_data, product_name):
    last_visible_stock = product_data['Visible Stock'].iloc[-1]
    last_inventory_stock = product_data['Inventory'].iloc[-1]
    if last_visible_stock < move_to_visible_threshold and last_inventory_stock > 0:
        move_units = min(move_to_visible_threshold - last_visible_stock, last_inventory_stock)
        product_data.at[len(product_data) - 1, 'Visible Stock'] += move_units
        product_data.at[len(product_data) - 1, 'Inventory'] -= move_units

def calculate_order_quantity(product_data, predictions, reorder_threshold):
    future_visible_stock = product_data['Visible Stock'].iloc[-1]
    future_inventory_stock = product_data['Inventory'].iloc[-1]
    total_predicted_demand = sum(predictions)
    total_future_stock = future_visible_stock + future_inventory_stock
    if total_future_stock < total_predicted_demand:
        return total_predicted_demand - total_future_stock
    return 0

_FORECAST_CACHE_2 = {}
_CACHED_MODEL_2 = None

def demand_forecasting_main(file_names, product_name_input):
    global _CACHED_MODEL_2
    cache_key = str(product_name_input).strip().lower()
    if cache_key in _FORECAST_CACHE_2:
        return _FORECAST_CACHE_2[cache_key]

    combine_df = load_and_preprocess_data(file_names)
    combine_df, scaler_demand, scaler_stock = preprocessing_data(combine_df)

    sequence_length = 7
    x, y = [], []
    for i in range(len(combine_df) - sequence_length):
        x.append(combine_df[['Scaled Demand', 'Scaled Visible Stock', 'Scaled Inventory Stock']].iloc[i:i+sequence_length].values)
        y.append(combine_df['Scaled Demand'].iloc[i+sequence_length])
    X, y = np.array(x), np.array(y)
    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)
    model_path = 'shop2_model.h5'
    if _CACHED_MODEL_2 is not None:
        model = _CACHED_MODEL_2
    elif os.path.exists(model_path):
        model = create_lstm_model(sequence_length)
        model.load_weights(model_path)
        _CACHED_MODEL_2 = model
    else:
        print(f"[AI] Training new Shop 2 model...")
        model = create_lstm_model(sequence_length)
        train_model(model, X_train, y_train, X_val, y_val)
        model.save(model_path)
        _CACHED_MODEL_2 = model

    for product_name in combine_df['Product Name'].unique():
        if product_name.strip().lower() == product_name_input.strip().lower():
            product_data = combine_df[combine_df['Product Name'] == product_name].reset_index(drop=True)
            product_data = preprocessing_data(product_data)[0]
            
            initial_visible = product_data.iloc[-1]['Visible Stock']
            initial_inventory = product_data.iloc[-1]['Inventory']
            
            predictions = make_predictions(model, product_data, scaler_demand, sequence_length, future_days=30)
            
            if predictions:
                total_demand = sum(max(0, p) for p in predictions)
                curr_vis = initial_visible
                curr_inv = initial_inventory
                for p in predictions:
                    demand = max(0, p)
                    curr_vis -= demand
                    if curr_vis < move_to_visible_threshold and curr_inv > 0:
                        move = min(move_to_visible_threshold - curr_vis, curr_inv)
                        curr_vis += move
                        curr_inv -= move
                
                final_vis = max(0, curr_vis)
                final_inv = max(0, curr_inv)
                
                price = ProductPrices.get(product_name, 100)
                cost = ProductCosts.get(product_name, 60)
                total_revenue = total_demand * price
                total_cost = total_demand * cost
                profit_pct = ((total_revenue - total_cost) / total_revenue * 100) if total_revenue > 0 else 0
                
                print(f"\n--- 30-Day Forecast for {product_name} ---")
                print(f"Predicted Demand Array: {predictions}")
                print(f"Total Predicted Demand: {total_demand}")
                print(f"Predicted Visible Stock left: {final_vis}")
                print(f"Predicted Inventory left: {final_inv}")
                print(f"Aggregate Profit Margin: {profit_pct:.2f}%\n")
                
                reorder_needed, reorder_date = check_reorder_and_print(product_data, product_name, predictions)
                move_to_visible(product_data, product_name)
                order_quantity = calculate_order_quantity(product_data, predictions, ReorderThresholds.get(product_name, 5)) if reorder_needed else 0
                res = (reorder_date if reorder_needed else None, int(order_quantity), predictions, round(profit_pct, 2), int(total_demand), int(final_vis), int(final_inv))
                _FORECAST_CACHE_2[cache_key] = res
                return res
            break
    return None, 0, [], 0.0, 0, 0, 0

if __name__ == "__main__":
    file_names = ["shop_2.csv"]
    product_name_input = input("Enter the product name: ")
    reorder_date, order_quantity, predictions = demand_forecasting_main(file_names, product_name_input)
    if reorder_date:
        print(f"Reorder needed on {reorder_date} for {order_quantity} units.")
    else:
        print("No reorder needed.")
