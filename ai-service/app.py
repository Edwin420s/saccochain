# ai-service/app.py
from flask import Flask, request, jsonify
from sklearn.ensemble import RandomForestRegressor
import pandas as pd
import joblib
import os

app = Flask(__name__)

# Load trained model
model = joblib.load('model/credit_model.pkl')

@app.route('/api/score', methods=['POST'])
def calculate_credit_score():
    try:
        data = request.json
        
        # Feature engineering
        features = [
            data.get('repayment_history', 0),
            data.get('savings_balance', 0),
            data.get('loan_balance', 0),
            data.get('transaction_count', 0),
            data.get('account_age_months', 0),
            data.get('default_count', 0)
        ]
        
        # Predict score (0-1000)
        score = model.predict([features])[0]
        score = max(0, min(1000, score))  # Clamp between 0-1000
        
        # Determine risk level
        if score >= 800:
            risk_level = 'LOW'
        elif score >= 600:
            risk_level = 'MEDIUM'
        else:
            risk_level = 'HIGH'
            
        return jsonify({
            'credit_score': float(score),
            'risk_level': risk_level,
            'features_used': len(features)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)