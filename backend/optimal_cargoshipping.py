import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import rankingmodel
import productorder
import os
import sys
import contextlib

QUICK_DELIVERY_DAYS = 5
NORMAL_DELIVERY_DAYS = 10
DEFAULT_QUICK_PCT = 0.10

def get_vendor_for_product(product_name):
    try:
        vendors = pd.read_csv('vendor.csv')
        match = vendors[vendors['Product'] == product_name].copy()
        if not match.empty:
            match = match.sort_values(by=['Reliability_Rating', 'Delivery_Time'], ascending=[False, True])
            return match.iloc[0]['Vendor_Name']
    except Exception as e:
        print(f"Error loading vendors: {e}")
    return "Global Logistics"

def calculate_quick_percentage(shop_sentiment):
   
    return 0.10 + (shop_sentiment * 0.15)

def simulate_tracking(order_date, delivery_days, status_label):
    milestones = []
    total_hours = delivery_days * 24
    
    milestones.append({'Time': order_date, 'Status': f'[{status_label}] Order Processed'})
    
    ship_time = order_date + timedelta(hours=total_hours * 0.4)
    milestones.append({'Time': ship_time, 'Status': f'[{status_label}] Shipped via Vendor'})
    
    delivery_time = order_date + timedelta(days=delivery_days)
    milestones.append({'Time': delivery_time, 'Status': f'[{status_label}] Delivered'})
    
    return pd.DataFrame(milestones)

def process_shipping():
    print("\n" + "="*40)
    print("OPTIMAL CARGO SHIPPING MANAGER")
    print("="*40)

    product_query = input("Enter the Product Name: ").strip()
    shop_query = input("Enter the Shop (1, 2, 3, or all): ").strip().lower()

    if product_query:
        print(f"\n[AI] Analyzing 30-day demand for '{product_query}'...")
        with open(os.devnull, 'w') as f, contextlib.redirect_stdout(f), contextlib.redirect_stderr(f):
             productorder.take_orders(product_query)

    try:
        rankings = rankingmodel.get_shop_rankings()
    except Exception as e:
        rankings = {}

    if not os.path.exists('orders.csv'):
        print("Error: No orders.csv found. Run productorder.py first.")
        return

    orders = pd.read_csv('orders.csv')
    if orders.empty:
        print("No active orders found in orders.csv.")
        return

    if not product_query or product_query.lower() == 'all':
        products_to_check = orders['Product Name'].unique().tolist()
        print(f"Checking all {len(products_to_check)} available products...")
    else:
        products_to_check = [p.strip() for p in product_query.split(',')]

    all_filtered_orders = []
    
    for p_name in products_to_check:
        temp_orders = orders[orders['Product Name'].str.lower() == p_name.lower()]
        
        if shop_query != 'all':
            shop_key = f"shop{shop_query}" if shop_query in ['1', '2', '3'] else shop_query
            temp_orders = temp_orders[temp_orders['Shop'] == shop_key]
        
        if temp_orders.empty:
            if len(products_to_check) == 1:
                print(f"\n[!] No AI-suggested order found for '{p_name}' in Shop '{shop_query}'.")
                manual_choice = input("Place a manual order? (yes/no): ").strip().lower()
                if manual_choice == 'yes':
                    shop_target = f"shop{shop_query}" if shop_query in ['1', '2', '3'] else (shop_query if shop_query != 'all' else 'shop1')
                    all_filtered_orders.append({
                        'Product Name': p_name.capitalize(),
                        'Shop': shop_target,
                        'Order Quantity': 0,
                        'Order Date': datetime.now().strftime('%Y-%m-%d')
                    })
        else:
            all_filtered_orders.extend(temp_orders.to_dict('records'))

    if not all_filtered_orders:
        print("\n[!] No orders found to process.")
        return

    print(f"\nProcessing {len(all_filtered_orders)} matching order entry(s)...")
    
    for row in all_filtered_orders:
        product = row['Product Name']
        shop_id = row['Shop'] 
        shop_map = {'shop1': 'Shop_A', 'shop2': 'Shop_B', 'shop3': 'Shop_C'}
        mapped_id = shop_map.get(shop_id, shop_id).replace('_', ' ')
        
        ai_suggested_qty = row['Order Quantity']
        order_date_str = row['Order Date']
        try:
            order_date = pd.to_datetime(order_date_str)
        except:
            order_date = datetime.now()

        print(f"\n" + "-"*30)
        print(f"REVIEW ORDER: {product} at {mapped_id}")
        if ai_suggested_qty > 0:
            print(f"AI Suggestion: Reorder {ai_suggested_qty} units")
        else:
            print(f"Note: Manual entry (no reorder threshold hit).")
        
        confirm = input(f"Place this order? (yes/no, default 'yes'): ").strip().lower()
        if confirm == 'no':
            print(f"   [X] Order skipped.")
            continue
            
        qty_input = input(f"Enter Order Quantity (default {ai_suggested_qty if ai_suggested_qty > 0 else 10}): ").strip()
        final_qty = float(qty_input) if qty_input else (ai_suggested_qty if ai_suggested_qty > 0 else 10)
        
        perf = rankings.get(mapped_id, {'sentiment': 0.5})
        quick_pct = calculate_quick_percentage(perf['sentiment'])
        suggested_quick_qty = int(final_qty * quick_pct)

        want_quick = input(f"Quick Delivery? (yes/no, default based on shop): ").strip().lower()
        
        quick_qty = 0
        if want_quick == 'yes':
             quick_qty_input = input(f"Enter Quick Qty (default {suggested_quick_qty}): ").strip()
             quick_qty = float(quick_qty_input) if quick_qty_input else suggested_quick_qty
        elif want_quick == 'no':
             quick_qty = 0
        else:
             quick_qty = suggested_quick_qty
             print(f"   Using performance default ({quick_pct*100:.1f}%)")

        normal_qty = final_qty - quick_qty
        
        print(f"\n>> Final Shipping Dispatch for {product}:")
        print(f"   Confirmed Total: {final_qty} units")
        
        if quick_qty > 0:
            vendor = get_vendor_for_product(product)
            print(f"   [QUICK] {quick_qty} units assigned to {vendor} (ETA: 5 days)")
            track = simulate_tracking(order_date, QUICK_DELIVERY_DAYS, "QUICK")
            print(track.to_string(index=False))
            
        if normal_qty > 0:
            print(f"   [NORMAL] {normal_qty} units assigned to Standard Freight (ETA: 10 days)")
            track = simulate_tracking(order_date, NORMAL_DELIVERY_DAYS, "NORMAL")
            print(track.to_string(index=False))

    print("\n" + "="*40)
    print("SHIPPING ASSIGNMENT COMPLETE")
    print("="*40)

def generate_shipping_plan(product_name, shop_id, confirmed_qty=None, want_quick=None):
    shop_map_rev = {'Shop_A': 'shop1', 'Shop_B': 'shop2', 'Shop_C': 'shop3'}
    internal_shop_id = shop_map_rev.get(shop_id, shop_id)

    try:
        rankings = rankingmodel.get_shop_rankings()
    except:
        rankings = {}

    if confirmed_qty is None:
        if os.path.exists('orders.csv'):
            orders = pd.read_csv('orders.csv')
            match = orders[(orders['Product Name'].str.lower() == product_name.lower()) & (orders['Shop'] == internal_shop_id)]
            confirmed_qty = match.iloc[0]['Order Quantity'] if not match.empty else 10
        else:
            confirmed_qty = 10

    perf = rankings.get(shop_id, {'sentiment': 0.5})
    quick_pct = calculate_quick_percentage(perf['sentiment'])
    
    if want_quick is None:
        quick_qty = int(confirmed_qty * quick_pct)
    elif want_quick:
        quick_qty = confirmed_qty
    else:
        quick_qty = 0

    normal_qty = confirmed_qty - quick_qty
    vendor = get_vendor_for_product(product_name)
    
    plan = {
        'product': product_name,
        'shop': shop_id,
        'total_qty': confirmed_qty,
        'quick': {
            'qty': quick_qty,
            'vendor': vendor,
            'eta_days': QUICK_DELIVERY_DAYS
        },
        'normal': {
            'qty': normal_qty,
            'vendor': 'Standard Freight',
            'eta_days': NORMAL_DELIVERY_DAYS
        }
    }
    return plan

if __name__ == "__main__":
    process_shipping()
