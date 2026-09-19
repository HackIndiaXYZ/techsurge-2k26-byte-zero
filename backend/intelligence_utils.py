import pandas as pd
import numpy as np
import os
from sklearn.ensemble import IsolationForest
from transformers import pipeline

def get_sentiment_scores(reviews_file='shop_reviews.csv'):
    """
    Extracts advanced sentiment scores using DistilBERT.
    Caches results to 'shop_reviews_advanced.csv'.
    """
    cache_path = 'shop_reviews_advanced.csv'
    if os.path.exists(cache_path):
        df = pd.read_csv(cache_path, encoding='latin1')
        return df.groupby('Shop_ID')['Sentiment_Num'].mean().to_dict()

    if not os.path.exists(reviews_file):
        return {}

    reviews_df = pd.read_csv(reviews_file, encoding='latin1')
    classifier = pipeline("sentiment-analysis", 
                          model="distilbert-base-uncased-finetuned-sst-2-english",
                          device=-1) 
    
    texts = reviews_df['Review Text'].fillna("Neutral feedback").tolist()
    results = classifier(texts)
    
    scores = []
    for res in results:
        label, conf = res['label'], res['score']
        score = 0.5 + (conf * 0.5) if label == 'POSITIVE' else 0.5 - (conf * 0.5)
        scores.append(score)
    
    reviews_df['Sentiment_Num'] = scores
    reviews_df.to_csv(cache_path, index=False)
    return reviews_df.groupby('Shop_ID')['Sentiment_Num'].mean().to_dict()

def detect_anomalies(df, features=['Amount Sold']):
    """
    Runs Isolation Forest to flag sales anomalies.
    Returns the dataframe with 'Anomaly_Score' and 'Is_Anomaly' columns.
    """
    if df.empty:
        return df
    
    # Isolation Forest prefers 2D input
    X = df[features].values.reshape(-1, 1)
    iso = IsolationForest(contamination=0.05, random_state=42)
    iso.fit(X)
    df['Anomaly_Score'] = iso.decision_function(X)
    df['Is_Anomaly'] = iso.predict(X) # -1 for anomaly, 1 for normal
    return df
