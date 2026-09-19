import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
import os

# Configuration
STORE_FILES = {
    "Store_1": "shop_1_combined.csv",
    "Store_2": "shop2_combined.csv",
    "Store_3": "shop_3.csv"
}

def aggregate_weekly_data():
    """
    Combines daily store data into SKU-Week-Store granularity.
    """
    all_data = []
    for store_id, file_path in STORE_FILES.items():
        if os.path.exists(file_path):
            df = pd.read_csv(file_path, encoding='latin1')
            df['Date'] = pd.to_datetime(df['Date'], dayfirst=True, errors='coerce')
            df['Store'] = store_id
            all_data.append(df)
    
    full_df = pd.concat(all_data, ignore_index=True)
    full_df.dropna(subset=['Date', 'Product Name', 'Amount Sold'], inplace=True)
    
    full_df['Week'] = full_df['Date'].dt.isocalendar().week
    full_df['Year'] = full_df['Date'].dt.year
    
    weekly_agg = full_df.groupby(['Store', 'Product Name', 'Year', 'Week']).agg({
        'Amount Sold': 'sum',
        'Visible Stock': 'last',
        'Inventory': 'last'
    }).reset_index()
    
    return weekly_agg, full_df

def prepare_features(weekly_df, full_daily_df):
    """
    Feature engineering for the forecasting engine.
    Since we have limited history, we use SKU properties and daily variance as features.
    """
    daily_stats = full_daily_df.groupby(['Store', 'Product Name']).agg({
        'Amount Sold': ['mean', 'std']
    }).reset_index()
    daily_stats.columns = ['Store', 'Product Name', 'Daily_Mean', 'Daily_Std']
    daily_stats['Volatility'] = daily_stats['Daily_Std'] / (daily_stats['Daily_Mean'] + 1e-6)
    
    features_df = weekly_df.merge(daily_stats, on=['Store', 'Product Name'], how='left')
    
    
    cat_map = full_daily_df[['Product Name', 'Category']].drop_duplicates() if 'Category' in full_daily_df.columns else pd.DataFrame()
    if not cat_map.empty:
        features_df = features_df.merge(cat_map, on='Product Name', how='left')
    
    features_df['Store_Enc'] = features_df['Store'].astype('category').cat.codes
    features_df['Product_Enc'] = features_df['Product Name'].astype('category').cat.codes
    if 'Category' in features_df.columns:
        features_df['Category_Enc'] = features_df['Category'].astype('category').cat.codes
    else:
        features_df['Category_Enc'] = 0

    return features_df

def train_quantile_models(X, y):
    """
    Trains XGBoost models for different quantiles to provide uncertainty.
    """
    X_train = X[['Store_Enc', 'Product_Enc', 'Category_Enc', 'Visible Stock', 'Inventory', 'Volatility']]
    

    
    models = {}
    for quantile in [0.1, 0.5, 0.9]:
        reg = xgb.XGBRegressor(
            objective='reg:quantileerror',
            quantile_alpha=quantile,
            n_estimators=100,
            max_depth=4,
            learning_rate=0.1
        )
        reg.fit(X_train, y)
        models[quantile] = reg
        
    return models, X_train

def generate_forecast_report(weekly_df, models, X_train):
    """
    Generates point forecasts, uncertainty bounds, and explainability reasons.
    """
    p10 = models[0.1].predict(X_train)
    p50 = models[0.5].predict(X_train)
    p90 = models[0.9].predict(X_train)
    
    importance = models[0.5].get_booster().get_score(importance_type='gain')
    total_gain = sum(importance.values())
    factors = {k: v/total_gain for k,v in importance.items()}
    
    feature_names = {
        'Store_Enc': 'Store Location Trend',
        'Product_Enc': 'Product Popularity',
        'Category_Enc': 'Category Seasonality',
        'Visible Stock': 'Shelf Availability',
        'Inventory': 'Backstock Level',
        'Volatility': 'Daily Sales Rhythm'
    }
    
    sorted_factors = sorted(factors.items(), key=lambda x: x[1], reverse=True)
    top_factors = ", ".join([f"{feature_names.get(k, k)} ({v*100:.1f}%)" for k,v in sorted_factors[:2]])

    results = weekly_df.copy()
    results['Point_Forecast'] = np.round(p50).astype(int)
    results['Lower_Bound'] = np.round(p10).astype(int)
    results['Upper_Bound'] = np.round(p90).astype(int)
    results['Uncertainty_Range'] = results['Upper_Bound'] - results['Lower_Bound']
    results['Confidence_Score'] = 1 - (results['Uncertainty_Range'] / (results['Point_Forecast'] + 1))
    results['Confidence_Score'] = results['Confidence_Score'].clip(0, 1)
    results['Driving_Factors'] = top_factors
    
    def get_review_reason(row):
        if row['Confidence_Score'] < 0.6:
            return "High Uncertainty: High sales volatility detected."
        if row['Point_Forecast'] > (row['Visible Stock'] + row['Inventory']):
            return "Critical: Forecasted demand exceeds total stock."
        if row['Point_Forecast'] == 0 and row['Volatility'] > 0.5:
            return "Review: Signal mismatch - high volatility but zero forecast."
        return "Normal"

    results['Review_Status'] = results.apply(lambda r: "Review Recommended" if get_review_reason(r) != "Normal" else "Auto-Approved", axis=1)
    results['Review_Reason'] = results.apply(get_review_reason, axis=1)
    
    return results

def main():
    print("[Forecasting Engine] Aggregating SKU-Week-Store data...")
    weekly_agg, full_daily = aggregate_weekly_data()
    
    print("[Forecasting Engine] Engineering features & volatility metrics...")
    features_df = prepare_features(weekly_agg, full_daily)
    
    print("[Forecasting Engine] Training Quantile Regression (XGBoost)...")
    y = features_df['Amount Sold']
    models, X_train = train_quantile_models(features_df, y)
    
    print("[Forecasting Engine] Generating Intelligence Report...")
    report = generate_forecast_report(features_df, models, X_train)
    
    final_cols = ['Store', 'Product Name', 'Point_Forecast', 'Lower_Bound', 'Upper_Bound', 'Confidence_Score', 'Driving_Factors', 'Review_Status', 'Review_Reason']
    report[final_cols].to_csv('weekly_forecast_report.csv', index=False)
    print(f"[Success] Report generated: weekly_forecast_report.csv")
    print(f"[Success] Processed {len(report)} SKU-Store combinations.")

if __name__ == "__main__":
    main()
