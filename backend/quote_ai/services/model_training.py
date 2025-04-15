import os
import logging
from typing import List, Dict, Any, Tuple
import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import mean_squared_error, r2_score
import joblib
from datetime import datetime
from quote_ai.utils.config import Settings

class ModelTrainingService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.logger = logging.getLogger(__name__)
        self.model_path = settings.model_path
        self.training_data_path = "data/training_data.csv"
        self.model = None

    def prepare_training_data(self, quotes: List[Dict[str, Any]]) -> pd.DataFrame:
        """Prepare training data from historical quotes"""
        try:
            data = []
            for quote in quotes:
                for spec in quote.get('product_specs', []):
                    row = {
                        'weight_per_meter': spec.get('weight_per_meter'),
                        'total_length': spec.get('total_length'),
                        'machining_complexity': self._encode_complexity(spec.get('machining_complexity')),
                        'surface_treatment': spec.get('surface_treatment'),
                        'alloy': spec.get('alloy'),
                        'price': quote.get('final_price') or quote.get('predicted_price')
                    }
                    if all(v is not None for v in row.values()):
                        data.append(row)

            df = pd.DataFrame(data)
            os.makedirs(os.path.dirname(self.training_data_path), exist_ok=True)
            df.to_csv(self.training_data_path, index=False)
            return df
        except Exception as e:
            self.logger.error(f"Error preparing training data: {str(e)}")
            raise

    def train_model(self, df: pd.DataFrame = None) -> Dict[str, float]:
        """Train the price prediction model"""
        try:
            if df is None:
                df = pd.read_csv(self.training_data_path)

            # Feature engineering
            X = pd.get_dummies(df[['weight_per_meter', 'total_length', 'machining_complexity',
                                 'surface_treatment', 'alloy']])
            y = df['price']

            # Split data
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

            # Hyperparameter tuning
            param_grid = {
                'n_estimators': [50, 100, 200],
                'learning_rate': [0.01, 0.1, 0.2],
                'max_depth': [3, 4, 5]
            }

            grid_search = GridSearchCV(
                GradientBoostingRegressor(),
                param_grid,
                cv=5,
                scoring='neg_mean_squared_error',
                n_jobs=-1
            )

            grid_search.fit(X_train, y_train)
            self.model = grid_search.best_estimator_

            # Evaluate model
            y_pred = self.model.predict(X_test)
            mse = mean_squared_error(y_test, y_pred)
            r2 = r2_score(y_test, y_pred)

            # Save model
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            joblib.dump(self.model, self.model_path)

            return {
                "mse": mse,
                "r2": r2,
                "best_params": grid_search.best_params_
            }
        except Exception as e:
            self.logger.error(f"Error training model: {str(e)}")
            raise

    def evaluate_model(self, test_data: pd.DataFrame = None) -> Dict[str, float]:
        """Evaluate the model's performance"""
        try:
            if test_data is None:
                test_data = pd.read_csv(self.training_data_path)

            X = pd.get_dummies(test_data[['weight_per_meter', 'total_length', 'machining_complexity',
                                        'surface_treatment', 'alloy']])
            y = test_data['price']

            y_pred = self.model.predict(X)
            mse = mean_squared_error(y, y_pred)
            r2 = r2_score(y, y_pred)

            return {
                "mse": mse,
                "r2": r2,
                "rmse": np.sqrt(mse),
                "mae": np.mean(np.abs(y - y_pred))
            }
        except Exception as e:
            self.logger.error(f"Error evaluating model: {str(e)}")
            raise

    def _encode_complexity(self, complexity: str) -> int:
        """Encode machining complexity into numerical values"""
        complexity_map = {
            'low': 1,
            'medium': 2,
            'high': 3
        }
        return complexity_map.get(complexity.lower(), 2)

    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the current model"""
        try:
            if self.model is None:
                self.model = joblib.load(self.model_path)

            return {
                "model_type": type(self.model).__name__,
                "n_features": self.model.n_features_in_ if hasattr(self.model, 'n_features_in_') else None,
                "n_estimators": self.model.n_estimators if hasattr(self.model, 'n_estimators') else None,
                "last_trained": datetime.fromtimestamp(os.path.getmtime(self.model_path)).isoformat(),
                "model_path": self.model_path
            }
        except Exception as e:
            self.logger.error(f"Error getting model info: {str(e)}")
            raise 