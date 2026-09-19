import pandas as pd
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import random
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from transformers import pipeline

np.random.seed(42)
torch.manual_seed(42)
random.seed(42)

class LinearRankingModel(nn.Module):
    def __init__(self, input_size):
        super(LinearRankingModel, self).__init__()
        self.linear = nn.Linear(input_size, 1) 
    
    def forward(self, x):
        return self.linear(x)

def get_advanced_sentiment(reviews_df):
    cache_path = 'shop_reviews_advanced.csv'
    if os.path.exists(cache_path):
        return pd.read_csv(cache_path, encoding='latin1')
    
    classifier = pipeline("sentiment-analysis", 
                          model="distilbert-base-uncased-finetuned-sst-2-english",
                          device=-1) 
    
    texts = reviews_df['Review Text'].fillna("Neutral feedback").tolist()
    results = classifier(texts)
    
    scores = []
    for res in results:
        label = res['label']
        conf = res['score']
        score = 0.5 + (conf * 0.5) if label == 'POSITIVE' else 0.5 - (conf * 0.5)
        scores.append(score)
    
    reviews_df['Sentiment_Num'] = scores
    reviews_df.to_csv(cache_path, index=False)
    return reviews_df

_RANKINGS_CACHE = None

def get_shop_rankings():
    global _RANKINGS_CACHE
    if _RANKINGS_CACHE is not None:
        return _RANKINGS_CACHE

    # Model/Data Paths
    model_path = 'ranking_model.pth'
    sales_file = 'shop_sale.csv'
    reviews_file = 'shop_reviews.csv'
    
    if not (os.path.exists(sales_file) and os.path.exists(reviews_file)):
        return {}
        
    sales_data = pd.read_csv(sales_file)
    reviews_raw = pd.read_csv(reviews_file, encoding='latin1')
    reviews_data = get_advanced_sentiment(reviews_raw)
    
    sales_data['Shop_ID'] = sales_data['Shop_ID'].str.replace(' ', '_').str.strip()
    reviews_data['Shop_ID'] = reviews_data['Shop_ID'].str.replace(' ', '_').str.strip()
    
    shop_stats = reviews_data.groupby('Shop_ID')['Sentiment_Num'].agg(['mean', 'count']).reset_index()
    shop_stats.columns = ['Shop_ID', 'Avg_Sentiment', 'Review_Count']
    
    merged_data = pd.merge(sales_data, shop_stats, on='Shop_ID', how='left')
    merged_data['Month_Num'] = pd.to_datetime(merged_data['Month']).dt.month
    
    X = merged_data[['Month_Num', 'Avg_Sentiment', 'Review_Count']]
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    model = LinearRankingModel(X.shape[1])
    if os.path.exists(model_path):
        model.load_state_dict(torch.load(model_path, weights_only=True))
    
    model.eval()
    with torch.no_grad():
        latest = merged_data[merged_data['Month'] == merged_data['Month'].max()]
        X_latest = scaler.transform(latest[['Month_Num', 'Avg_Sentiment', 'Review_Count']])
        X_latest_t = torch.tensor(X_latest, dtype=torch.float32)
        preds = model(X_latest_t).squeeze().tolist()
        
        results = {}
        ids = latest['Shop_ID'].tolist()
        sents = latest['Avg_Sentiment'].tolist()
        actual_sales = latest['Total_Sales_Amount'].tolist()
        
        # Ensure 'preds' is a list even if it's a single item
        if not isinstance(preds, list):
            preds = [preds]
            
        for i in range(len(preds)):
            perf_score = (preds[i] + actual_sales[i]) / 2
            sentiment_bonus = 1.0 + (sents[i] - 0.5)
            final_score = perf_score * sentiment_bonus
            results[ids[i]] = {
                'score': final_score,
                'sentiment': sents[i]
            }
        _RANKINGS_CACHE = results
    return results

if __name__ == "__main__":
    res = get_shop_rankings()
    print(res)
