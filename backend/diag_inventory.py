import pandas as pd
import os

def test_inventory(file_path):
    print(f"Testing {file_path}...")
    if not os.path.exists(file_path):
        print("File not found")
        return
    df = pd.read_csv(file_path)
    print(f"Columns: {df.columns.tolist()}")
    raw_dates = df['Date'].unique()[:5]
    print(f"Raw dates: {raw_dates}")
    df['Parsed Date'] = pd.to_datetime(df['Date'], errors='coerce')
    print(f"NaT count: {df['Parsed Date'].isna().sum()}")
    latest = df['Parsed Date'].max()
    print(f"Latest date: {latest}")
    latest_items = df[df['Parsed Date'] == latest]
    print(f"Items at latest date: {len(latest_items)}")
    print("-" * 30)

if __name__ == "__main__":
    test_inventory("shop_1_combined.csv")
    test_inventory("shop_2.csv")
    test_inventory("shop_3.csv")
