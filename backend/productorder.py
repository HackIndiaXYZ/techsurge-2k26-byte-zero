import pandas as pd
import finalstore1
import finalstore2
import finalstore3
import os

def load_orders():
    try:
        orders_df = pd.read_csv('orders.csv')
        return orders_df
    except FileNotFoundError:
        return pd.DataFrame(columns=['Product Name', 'Shop', 'Order Date', 'Order Quantity'])

def save_orders(orders_df):
    orders_df.to_csv('orders.csv', index=False)

def get_all_products():
    files = ["shop_1_combined.csv", "shop_2.csv", "shop_3.csv"]
    all_prods = set()
    for f in files:
        if os.path.exists(f):
            df = pd.read_csv(f, encoding='latin1')
            if 'Product Name' in df.columns:
                all_prods.update(df['Product Name'].unique())
    return sorted(list(all_prods))

def demand_forecasting_for_all_shops(product_name):
    shop1_files = ["shop_1_combined.csv"]
    shop2_file = ["shop_2.csv"]
    shop3_file = ["shop_3.csv"]

    reorder_results = {}
    
    # Shop 1
    try:
        reorder_results['shop1'] = finalstore1.demand_forecasting_main(shop1_files, product_name)
    except Exception as e:
        reorder_results['shop1'] = (None, 0)
    
    # Shop 2
    try:
        reorder_results['shop2'] = finalstore2.demand_forecasting_main(shop2_file, product_name)
    except Exception as e:
        reorder_results['shop2'] = (None, 0)
    
    # Shop 3
    try:
        reorder_results['shop3'] = finalstore3.demand_forecasting_main(shop3_file, product_name)
    except Exception as e:
        reorder_results['shop3'] = (None, 0)

    return reorder_results

def take_orders(product_input):
    if product_input.lower() == 'all':
        products_to_check = get_all_products()
        print(f"Starting batch order processing for {len(products_to_check)} products...")
    else:
        products_to_check = [product_input]

    orders_df = load_orders()
    total_new_orders = 0

    for product_name in products_to_check:
        print(f"\n>> Checking: {product_name}")
        reorder_results = demand_forecasting_for_all_shops(product_name)
        
        orders_df = orders_df[orders_df['Product Name'] != product_name]

        new_entries = []
        for shop, results in reorder_results.items():
            if results and len(results) >= 2:
                reorder_date = results[0]
                order_quantity = results[1]
            else:
                reorder_date, order_quantity = None, 0
                
            if reorder_date:
                new_entries.append({
                    'Product Name': product_name,
                    'Shop': shop,
                    'Order Date': reorder_date,
                    'Order Quantity': order_quantity
                })
                print(f"   [!] {shop}: Order placed for {order_quantity} units on {reorder_date}")
                total_new_orders += 1
            else:
                print(f"   [-] {shop}: Stock is healthy.")

        if new_entries:
            orders_df = pd.concat([orders_df, pd.DataFrame(new_entries)], ignore_index=True)

    save_orders(orders_df)
    print("\n" + "="*40)
    print(f"ORDERING COMPLETE. Total new orders placed: {total_new_orders}")
    print(f"Results saved to: orders.csv")
    print("="*40)

if __name__ == "__main__":
    print("Shopify Order Manager")
    print("Type a specific product name, or type 'all' to check everything.")
    product_name_input = input("Enter the product name: ").strip()
    if product_name_input:
        take_orders(product_name_input)
    else:
        print("No input provided. Exiting.")
