import pandas as pd
import numpy as np
import json
import joblib
from pathlib import Path

class NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (np.integer,)): return int(obj)
        if isinstance(obj, (np.floating,)): return float(obj)
        if isinstance(obj, np.ndarray): return obj.tolist()
        return super().default(obj)

CSV_PATH = Path("public/data/xauusd-daily.csv")
MODEL_DIR = Path("ml")
OUTPUT_PATH = Path("public/data/predictions.json")

cls_model = joblib.load(MODEL_DIR / "cls_model.joblib")
reg_model = joblib.load(MODEL_DIR / "reg_model.joblib")
feature_cols = joblib.load(MODEL_DIR / "feature_cols.joblib")

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

df = df.dropna().reset_index(drop=True)
last_features = df[feature_cols].iloc[-1:].values

proba = cls_model.predict_proba(last_features)[0]
direction = "up" if proba[1] > 0.5 else "down"
direction_confidence = max(proba) * 100

predicted_return = float(reg_model.predict(last_features)[0])
current_close = float(df["close"].iloc[-1])
next_close = current_close * (1 + predicted_return)
price_change_pct = predicted_return * 100

avg_close = float(df["close"].mean())
std_close = float(df["close"].std())
z_score = (next_close - avg_close) / std_close
strength = "strong" if abs(z_score) > 1 else "moderate" if abs(z_score) > 0.5 else "weak"

last_10 = df.tail(10)
recent_direction = "up" if last_10["close"].iloc[-1] > last_10["close"].iloc[0] else "down"

feature_imp = sorted(zip(feature_cols, cls_model.feature_importances_), key=lambda x: -x[1])
top_features = [{"feature": f[0], "importance": round(f[1], 4)} for f in feature_imp[:10]]

predictions = {
    "timestamp": df["timestamp"].iloc[-1].isoformat(),
    "current_price": round(current_close, 2),
    "next_close_prediction": round(next_close, 2),
    "price_change_pct": round(price_change_pct, 2),
    "direction": direction,
    "confidence": round(direction_confidence, 1),
    "signal_strength": strength,
    "recent_trend": recent_direction,
    "top_features": top_features,
}

with open(OUTPUT_PATH, "w") as f:
    json.dump(predictions, f, indent=2, cls=NpEncoder)

print(f"Predictions saved to {OUTPUT_PATH}")
print(f"Direction: {direction.upper()} ({direction_confidence:.1f}%)")
print(f"Next close: {next_close:.2f} ({price_change_pct:+.2f}%)")
