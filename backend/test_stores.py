import requests
import json

BASE_URL = "http://localhost:8008"

def test_store_data(store):
    print(f"--- TESTING STORE {store} ---")
    
    # Inventory
    url_inv = f"{BASE_URL}/inventory/{store}"
    print(f"GET {url_inv}")
    resp_inv = requests.get(url_inv)
    print(f"Status: {resp_inv.status_code}")
    print(f"Items: {len(resp_inv.json()) if resp_inv.status_code == 200 else 'Error'}")
    if resp_inv.status_code == 200 and len(resp_inv.json()) > 0:
        print(f"First item: {resp_inv.json()[0]}")
    
    # Reviews
    url_rev = f"{BASE_URL}/reviews/{store}"
    print(f"GET {url_rev}")
    resp_rev = requests.get(url_rev)
    print(f"Status: {resp_rev.status_code}")
    print(f"Reviews: {len(resp_rev.json()) if resp_rev.status_code == 200 else 'Error'}")
    
    print("-" * 30)

if __name__ == "__main__":
    for s in ["A", "B", "C"]:
        test_store_data(s)
