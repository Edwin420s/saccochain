import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import json

class CreditScoreModel:
    def __init__(self):
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
    
    def generate_training_data(self, num_samples=10000):
        """Generate synthetic training data for credit scoring"""
        np.random.seed(42)
        
        data = {
            'repayment_history': np.random.randint(0, 100, num_samples),
            'savings_balance': np.random.exponential(50000, num_samples),
            'loan_balance': np.random.exponential(20000, num_samples),
            'transaction_count': np.random.poisson(50, num_samples),
            'account_age_months': np.random.randint(1, 120, num_samples),
            'default_count': np.random.poisson(0.5, num_samples)
        }
        
        df = pd.DataFrame(data)
        
        # Calculate synthetic credit score (0-1000)
        df['credit_score'] = self.calculate_synthetic_score(df)
        
        return df
    
    def calculate_synthetic_score(self, df):
        """Calculate synthetic credit score based on features"""
        score = (
            df['repayment_history'] * 2 +
            np.log1p(df['savings_balance']) * 50 -
            np.log1p(df['loan_balance']) * 30 +
            df['transaction_count'] * 0.5 -
            df['default_count'] * 100 +
            df['account_age_months'] * 2
        )
        
        # Normalize to 0-1000 range
        score = (score - score.min()) / (score.max() - score.min()) * 1000
        return np.clip(score, 0, 1000)
    
    def train(self, df):
        """Train the model"""
        X = df.drop('credit_score', axis=1)
        y = df['credit_score']
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        self.model.fit(X_train, y_train)
        
        # Evaluate model
        y_pred = self.model.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        print(f"Model trained successfully!")
        print(f"Mean Absolute Error: {mae:.2f}")
        print(f"R² Score: {r2:.2f}")
        
        return mae, r2
    
    def save_model(self, filepath):
        """Save trained model to file"""
        joblib.dump(self.model, filepath)
        print(f"Model saved to {filepath}")

if __name__ == "__main__":
    # Train and save the model
    credit_model = CreditScoreModel()
    
    # Generate training data
    print("Generating training data...")
    training_data = credit_model.generate_training_data()
    
    # Train model
    print("Training model...")
    mae, r2 = credit_model.train(training_data)
    
    # Save model
    credit_model.save_model('model/credit_model.pkl')
    
    # Save feature importance
    feature_importance = dict(zip(
        training_data.drop('credit_score', axis=1).columns,
        credit_model.model.feature_importances_
    ))
    
    with open('model/feature_importance.json', 'w') as f:
        json.dump(feature_importance, f, indent=2)
    
    print("Model training completed!")