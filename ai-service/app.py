from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib
import os
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

class CreditScoringModel:
    def __init__(self):
        self.model = None
        self.feature_names = [
            'repayment_history',
            'savings_balance', 
            'loan_balance',
            'transaction_count',
            'account_age_months',
            'default_count'
        ]
        self.load_model()
    
    def load_model(self):
        """Load the trained model"""
        try:
            model_path = os.path.join('model', 'credit_model.pkl')
            if os.path.exists(model_path):
                self.model = joblib.load(model_path)
                logger.info("Model loaded successfully")
            else:
                logger.warning("Model file not found, using default scoring")
                self.model = None
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            self.model = None
    
    def predict(self, features):
        """Predict credit score"""
        try:
            if self.model is None:
                # Fallback to rule-based scoring if model not available
                return self.rule_based_scoring(features)
            
            # Convert features to numpy array
            feature_array = np.array([[
                features.get('repayment_history', 0),
                features.get('savings_balance', 0),
                features.get('loan_balance', 0),
                features.get('transaction_count', 0),
                features.get('account_age_months', 0),
                features.get('default_count', 0)
            ]])
            
            # Make prediction
            score = self.model.predict(feature_array)[0]
            return max(0, min(1000, score))
            
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            return self.rule_based_scoring(features)
    
    def rule_based_scoring(self, features):
        """Rule-based credit scoring as fallback"""
        score = 500  # Base score
        
        # Repayment history (0-200 points)
        repayment_score = min(features.get('repayment_history', 0) * 2, 200)
        score += repayment_score
        
        # Savings balance (0-150 points)
        savings = features.get('savings_balance', 0)
        savings_score = min(np.log1p(savings) * 10, 150)
        score += savings_score
        
        # Loan balance (0-100 points, negative)
        loans = features.get('loan_balance', 0)
        loan_score = -min(np.log1p(loans) * 5, 100)
        score += loan_score
        
        # Transaction count (0-50 points)
        transactions = features.get('transaction_count', 0)
        transaction_score = min(transactions * 0.5, 50)
        score += transaction_score
        
        # Account age (0-50 points)
        account_age = features.get('account_age_months', 0)
        age_score = min(account_age * 0.5, 50)
        score += age_score
        
        # Default count (0-100 points, negative)
        defaults = features.get('default_count', 0)
        default_score = -defaults * 20
        score += default_score
        
        return max(300, min(900, score))

# Initialize model
credit_model = CreditScoringModel()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'model_loaded': credit_model.model is not None
    })

@app.route('/api/score', methods=['POST'])
def calculate_credit_score():
    """Calculate credit score based on user data"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = [
            'repayment_history',
            'savings_balance',
            'loan_balance',
            'transaction_count',
            'account_age_months',
            'default_count'
        ]
        
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing field: {field}'}), 400
        
        # Calculate credit score
        score = credit_model.predict(data)
        
        # Determine risk level
        if score >= 800:
            risk_level = 'LOW'
        elif score >= 600:
            risk_level = 'MEDIUM'
        else:
            risk_level = 'HIGH'
        
        response = {
            'credit_score': float(score),
            'risk_level': risk_level,
            'features_used': credit_model.feature_names,
            'model_type': 'ML' if credit_model.model else 'RULE_BASED',
            'timestamp': datetime.utcnow().isoformat()
        }
        
        logger.info(f"Credit score calculated: {score}, Risk: {risk_level}")
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error calculating credit score: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/features/importance', methods=['GET'])
def get_feature_importance():
    """Get feature importance from the model"""
    try:
        if credit_model.model is None or not hasattr(credit_model.model, 'feature_importances_'):
            return jsonify({'error': 'Feature importance not available'}), 404
        
        importance = dict(zip(credit_model.feature_names, credit_model.model.feature_importances_))
        return jsonify(importance)
        
    except Exception as e:
        logger.error(f"Error getting feature importance: {e}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Create model directory if it doesn't exist
    os.makedirs('model', exist_ok=True)
    
    # Start the application
    app.run(host='0.0.0.0', port=5000, debug=os.getenv('FLASK_ENV') == 'development')