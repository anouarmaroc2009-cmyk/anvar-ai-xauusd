import pandas as pd
import numpy as np
import json
from pathlib import Path
from xgboost import XGBClassifier, XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import joblib

class NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (np.integer,)): return int(obj)
        if isinstance(obj, (np.floating,)): return float(obj)
        if isinstance(obj, np.ndarray): return obj.tolist()
        return super().default(obj)

CSV_PATH = Path("public/data/xauusd-daily.csv")
MODEL_DIR = Path("ml")
MODEL_DIR.mkdir(exist_ok=True)

df = pd.read_csv(CSV_PATH, parse_dates=["Date"])
df = df.sort_values("Date").reset_index(drop=True)
df.columns = [c.strip().lower() for c in df.columns]

df = df.rename(columns={"date": "timestamp"})
df["volume"] = 0

df["body"] = abs(df["close"] - df["open"])
df["wick_upper"] = df["high"] - df[["open", "close"]].max(axis=1)
df["wick_lower"] = df[["open", "close"]].min(axis=1) - df["low"]
df["range"] = df["high"] - df["low"]
df["return_1d"] = df["close"].pct_change()
df["gap"] = df["open"] - df["close"].shift(1)
df["atr"] = df["range"].rolling(14).mean()

for lag in [1, 2, 3, 5, 10, 21]:
    df[f"close_lag_{lag}"] = df["close"].shift(lag)
    df[f"return_lag_{lag}"] = df["return_1d"].shift(lag)

for period in [5, 10, 21]:
    df[f"sma_{period}"] = df["close"].rolling(period).mean()
    df[f"ema_{period}"] = df["close"].ewm(span=period).mean()
    df[f"high_{period}"] = df["high"].rolling(period).max()
    df[f"low_{period}"] = df["low"].rolling(period).min()
    df[f"std_{period}"] = df["close"].rolling(period).std()

df["close_pct"] = (df["close"] - df["close"].rolling(21).min()) / (df["close"].rolling(21).max() - df["close"].rolling(21).min() + 1e-8)
df["range_pct"] = (df["range"] - df["range"].rolling(21).min()) / (df["range"].rolling(21).max() - df["range"].rolling(21).min() + 1e-8)

df["target_cls"] = (df["close"].shift(-1) > df["close"]).astype(int)
df["target_reg"] = df["close"].shift(-1) / df["close"] - 1

feature_cols = [c for c in df.columns if c not in (
    "timestamp", "open", "high", "low", "close", "volume",
    "target_cls", "target_reg"
)]
df = df.dropna().reset_index(drop=True)

X = df[feature_cols].values
y_cls = df["target_cls"].values
y_reg = df["target_reg"].values

split = int(len(X) * 0.8)
X_train, X_test = X[:split], X[split:]
y_cls_train, y_cls_test = y_cls[:split], y_cls[split:]
y_reg_train, y_reg_test = y_reg[:split], y_reg[split:]

cls_model = XGBClassifier(
    n_estimators=300, max_depth=6, learning_rate=0.05,
    subsample=0.8, colsample_bytree=0.8,
    random_state=42, eval_metric="logloss"
)
cls_model.fit(X_train, y_cls_train)
cls_acc = accuracy_score(y_cls_test, cls_model.predict(X_test))

reg_model = XGBRegressor(
    n_estimators=300, max_depth=6, learning_rate=0.05,
    subsample=0.8, colsample_bytree=0.8,
    random_state=42
)
reg_model.fit(X_train, y_reg_train)
reg_score = reg_model.score(X_test, y_reg_test)

joblib.dump(cls_model, MODEL_DIR / "cls_model.joblib")
joblib.dump(reg_model, MODEL_DIR / "reg_model.joblib")
joblib.dump(feature_cols, MODEL_DIR / "feature_cols.joblib")

feature_importance = sorted(zip(feature_cols, cls_model.feature_importances_), key=lambda x: -x[1])

print(f"Classifier accuracy: {cls_acc:.4f}")
print(f"Regressor R2 score: {reg_score:.4f}")
print(f"Top features: {[f[0] for f in feature_importance[:10]]}")

with open(MODEL_DIR / "metrics.json", "w") as f:
    json.dump({"accuracy": round(cls_acc, 4), "r2": round(reg_score, 4)}, f, cls=NpEncoder)
