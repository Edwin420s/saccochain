#!/usr/bin/env python3
"""
SACCOChain Credit Scoring Model Training Script
Trains machine learning models for credit risk assessment
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler
import joblib
import json
import os
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('training.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class CreditScoringModelTrainer:
    def __init__(self):
        self.models = {}
        self.scaler = StandardScaler()
        self.feature_names = [
            'repayment_history',
            'savings_balance', 
            'loan_balance',
            'transaction_count',
            'account_age_months',
            'default_count',
            'savings_loan_ratio',
            'monthly_activity'
        ]
        
    def generate_realistic_training_data(self, num_samples=50000):
        """Generate realistic training data based on SACCO member behavior patterns"""
        logger.info(f"Generating {num_samples} realistic training samples...")
        
        np.random.seed(42)
        
        # Realistic parameter ranges based on SACCO member behavior
        data = {
            'repayment_history': np.random.poisson(45, num_samples),  # 0-100 repayments
            'savings_balance': np.random.exponential(50000, num_samples),  # Mostly small savers
            'loan_balance': np.random.exponential(20000, num_samples),  # Loan amounts
            'transaction_count': np.random.poisson(60, num_samples),  # Transaction frequency
            'account_age_months': np.random.randint(1, 120, num_samples),  # 1 month to 10 years
            'default_count': np.random.poisson(0.3, num_samples),  # Mostly no defaults
        }
        
        df = pd.DataFrame(data)
        
        # Derived features
        df['savings_loan_ratio'] = np.where(
            df['loan_balance'] > 0,
            df['savings_balance'] / df['loan_balance'],
            10  # High ratio for no loans
        )
        df['monthly_activity'] = df['transaction_count'] / np.maximum(df['account_age_months'], 1)
        
        # Generate realistic credit scores with clear patterns
        df['credit_score'] = self._calculate_realistic_scores(df)
        
        logger.info(f"Generated dataset with {len(df)} samples")
        return df
    
    def _calculate_realistic_scores(self, df):
        """Calculate realistic credit scores based on feature patterns"""
        # Base score
        score = 600
        
        # Positive factors
        score += df['repayment_history'] * 1.5  # Timely repayments
        score += np.log1p(df['savings_balance']) * 8  # Savings behavior
        score += df['account_age_months'] * 0.8  # Account longevity
        score += df['monthly_activity'] * 2  # Regular activity
        
        # Negative factors
        score -= np.log1p(df['loan_balance']) * 6  # High loan burden
        score -= df['default_count'] * 50  # Defaults heavily penalized
        
        # Ratio-based adjustments
        score += np.where(
            df['savings_loan_ratio'] > 2,
            30,  # Good savings-to-loan ratio
            -20   # Poor ratio
        )
        
        # Add some noise
        noise = np.random.normal(0, 20, len(df))
        score += noise
        
        # Ensure scores are within 300-900 range (realistic FICO-like range)
        score = np.clip(score, 300, 900)
        
        return score
    
    def prepare_features(self, df):
        """Prepare features for training"""
        X = df[self.feature_names]
        y = df['credit_score']
        
        # Handle infinite values
        X = X.replace([np.inf, -np.inf], np.nan)
        X = X.fillna(0)
        
        return X, y
    
    def train_models(self, df):
        """Train multiple models and select the best one"""
        logger.info("Starting model training...")
        
        X, y = self.prepare_features(df)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=pd.cut(y, bins=5)
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Define models to try
        models = {
            'random_forest': RandomForestRegressor(
                n_estimators=200,
                max_depth=15,
                min_samples_split=10,
                min_samples_leaf=5,
                random_state=42
            ),
            'gradient_boosting': GradientBoostingRegressor(
                n_estimators=200,
                max_depth=8,
                learning_rate=0.1,
                random_state=42
            )
        }
        
        # Train and evaluate models
        best_score = -np.inf
        best_model = None
        best_model_name = None
        
        for name, model in models.items():
            logger.info(f"Training {name}...")
            
            # Train model
            model.fit(X_train_scaled, y_train)
            
            # Predict and evaluate
            y_pred = model.predict(X_test_scaled)
            
            mae = mean_absolute_error(y_test, y_pred)
            rmse = np.sqrt(mean_squared_error(y_test, y_pred))
            r2 = r2_score(y_test, y_pred)
            
            # Cross-validation
            cv_scores = cross_val_score(model, X_train_scaled, y_train, 
                                      cv=5, scoring='r2')
            
            logger.info(f"{name} - MAE: {mae:.2f}, RMSE: {rmse:.2f}, R²: {r2:.3f}")
            logger.info(f"{name} - CV R²: {cv_scores.mean():.3f} (+/- {cv_scores.std() * 2:.3f})")
            
            self.models[name] = {
                'model': model,
                'metrics': {
                    'mae': mae,
                    'rmse': rmse,
                    'r2': r2,
                    'cv_mean': cv_scores.mean(),
                    'cv_std': cv_scores.std()
                }
            }
            
            # Track best model
            if r2 > best_score:
                best_score = r2
                best_model = model
                best_model_name = name
        
        # Set best model as primary
        self.primary_model = best_model
        self.primary_model_name = best_model_name
        
        logger.info(f"Best model: {best_model_name} with R²: {best_score:.3f}")
        
        return best_model_name, best_score
    
    def hyperparameter_tuning(self, X, y):
        """Perform hyperparameter tuning for the best model"""
        logger.info("Performing hyperparameter tuning...")
        
        X_scaled = self.scaler.fit_transform(X)
        
        param_grid = {
            'n_estimators': [100, 200, 300],
            'max_depth': [10, 15, 20],
            'min_samples_split': [5, 10, 15],
            'min_samples_leaf': [2, 5, 10]
        }
        
        grid_search = GridSearchCV(
            RandomForestRegressor(random_state=42),
            param_grid,
            cv=5,
            scoring='r2',
            n_jobs=-1,
            verbose=1
        )
        
        grid_search.fit(X_scaled, y)
        
        logger.info(f"Best parameters: {grid_search.best_params_}")
        logger.info(f"Best cross-validation score: {grid_search.best_score_:.3f}")
        
        return grid_search.best_estimator_
    
    def save_model(self, filepath='model/credit_model.pkl'):
        """Save the trained model and metadata"""
        os.makedirs('model', exist_ok=True)
        
        # Save the primary model
        model_data = {
            'model': self.primary_model,
            'scaler': self.scaler,
            'feature_names': self.feature_names,
            'training_date': datetime.now().isoformat(),
            'model_name': self.primary_model_name,
            'metrics': self.models[self.primary_model_name]['metrics']
        }
        
        joblib.dump(model_data, filepath)
        
        # Save feature importance
        if hasattr(self.primary_model, 'feature_importances_'):
            feature_importance = dict(zip(
                self.feature_names,
                self.primary_model.feature_importances_
            ))
            
            with open('model/feature_importance.json', 'w') as f:
                json.dump(feature_importance, f, indent=2, sort_keys=True)
        
        # Save training report
        report = {
            'training_date': datetime.now().isoformat(),
            'models_trained': list(self.models.keys()),
            'best_model': self.primary_model_name,
            'model_performance': {
                name: data['metrics'] for name, data in self.models.items()
            },
            'feature_names': self.feature_names
        }
        
        with open('model/training_report.json', 'w') as f:
            json.dump(report, f, indent=2)
        
        logger.info(f"Model saved to {filepath}")
        logger.info("Training artifacts saved to model/ directory")
    
    def load_model(self, filepath='model/credit_model.pkl'):
        """Load a trained model"""
        if os.path.exists(filepath):
            model_data = joblib.load(filepath)
            self.primary_model = model_data['model']
            self.scaler = model_data['scaler']
            self.feature_names = model_data['feature_names']
            logger.info("Model loaded successfully")
            return True
        else:
            logger.warning("Model file not found")
            return False

def main():
    """Main training function"""
    logger.info("Starting SACCOChain Credit Model Training")
    
    # Initialize trainer
    trainer = CreditScoringModelTrainer()
    
    try:
        # Generate training data
        training_data = trainer.generate_realistic_training_data(50000)
        
        # Train models
        best_model, best_score = trainer.train_models(training_data)
        
        # Save model
        trainer.save_model()
        
        # Print summary
        logger.info("🎉 Training completed successfully!")
        logger.info(f"📊 Best Model: {best_model}")
        logger.info(f"🏆 Best R² Score: {best_score:.3f}")
        
        # Feature importance
        if hasattr(trainer.primary_model, 'feature_importances_'):
            importance = dict(zip(
                trainer.feature_names,
                trainer.primary_model.feature_importances_
            ))
            logger.info("🔍 Feature Importance:")
            for feature, imp in sorted(importance.items(), key=lambda x: x[1], reverse=True):
                logger.info(f"   {feature}: {imp:.3f}")
                
    except Exception as e:
        logger.error(f"Training failed: {e}")
        raise

if __name__ == "__main__":
    main()