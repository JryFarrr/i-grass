from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from pydantic import BaseModel, Field, conlist
from typing import List, Dict, Any
import joblib
from sentence_transformers import SentenceTransformer
import re
import numpy as np
import os
import csv
import io

# Env & Globals
os.environ.setdefault("HF_HOME", "/home/user/huggingface")


# Stopwords
try:
    from nltk.corpus import stopwords
    _stop_words = set(stopwords.words("english"))
    print('Succesed load stopwords from nltk')
except Exception:
    print('failed load stopwords from nltk')
    _stop_words = {
        "a","an","the","and","or","but","if","then","so","of","in","on","at","to",
        "for","from","by","with","as","is","are","was","were","be","been","being",
        "it","its","that","this","these","those","he","she","they","we","you","i"
    }


# Text Preprocessing
def preprocess_text(text: str) -> str:
    if not isinstance(text, str) or text.strip() == "":
        return ""
    text = text.lower()
    text = re.sub(r"\r\n|\n|\t", " ", text)           # normalisasi baris
    text = re.sub(r"[^a-z\s]", "", text)              # keep letters & spaces
    tokens = [w for w in text.split() if w not in _stop_words]
    return " ".join(tokens)

def preprocess_batch(texts: List[str]) -> List[str]:
    return [preprocess_text(t) for t in texts]


# Model Loading (once)
print("Loading SentenceTransformer...")
st_model = SentenceTransformer("sentence-transformers/all-mpnet-base-v2")
st_model.half()  # hemat RAM (~setengah) untuk free tier 512MB

print("Loading XGBoost models...")
# Expecting a dict: { "task_achievement": xgb_model, "coherence": xgb_model, ... }
models: Dict[str, Any] = joblib.load("xgb_models_all.joblib")

model_names = list(models.keys())

# Inference helpers
def _build_features(clean_texts: List[str], raw_texts: List[str]) -> np.ndarray:
    # Batch embedding (convert_to_numpy=True agar langsung ndarray)
    vecs = st_model.encode(
        clean_texts,
        batch_size=8,
        normalize_embeddings=True,
        convert_to_numpy=True,
        show_progress_bar=False,
    )  # shape: (N, D)

    # Essay length (bisa pilih chars atau tokens; di sini pakai char count konsisten dgn versi single)
    lengths = np.array([len(t) for t in raw_texts], dtype=np.float32).reshape(-1, 1)

    # Concatenate features: [embedding dengan  essay_length]
    X = np.concatenate([vecs, lengths], axis=1)  # shape: (N, D+1)
    return X

def predict_per_essay(texts: List[str]) -> List[Dict[str, float]]:
    if len(texts) == 0:
        return []
    clean_texts = preprocess_batch(texts)
    X = _build_features(clean_texts, texts)

    # Predict for each head -> vector (N,)
    preds_by_head = {}
    for head, model in models.items():
        y = model.predict(X)  # expecting shape (N,)
        preds_by_head[head] = y.astype(float)

    # Repack to per-essay dicts
    N = len(texts)
    per_essay = []
    for i in range(N):
        row = {head: float(preds_by_head[head][i]) for head in model_names}
        per_essay.append(row)
    return per_essay

def predict_average(texts: List[str]) -> Dict[str, float]:
    per_essay = predict_per_essay(texts)
    if not per_essay:
        return {head: float("nan") for head in model_names}
    # mean over essays
    sums = {head: 0.0 for head in model_names}
    for row in per_essay:
        for head, val in row.items():
            sums[head] += float(val)
    avg = {head: (sums[head] / len(per_essay)) for head in model_names}
    return avg

# FastAPI App & Schemas
app = FastAPI(title="Essay Scoring API", version="2.0.0")

class BatchInput(BaseModel):
    texts: List[str] = Field(...)

class PerEssayResponse(BaseModel):
    predictions: List[Dict[str, float]]

class AverageResponse(BaseModel):
    average: Dict[str, float]

class BothResponse(BaseModel):
    average: Dict[str, float]
    predictions: List[Dict[str, float]]

@app.get("/")
def health():
    return {"status": "ok", "heads": model_names}


#  JSON INPUT ENDPOINTS (array teks)
@app.post("/predict/essay", response_model=PerEssayResponse)
def predict_essay_json(payload: BatchInput):
    per_essay = predict_per_essay(payload.texts)
    return {"predictions": per_essay}

@app.post("/predict/avg", response_model=AverageResponse)
def predict_avg_json(payload: BatchInput):
    average = predict_average(payload.texts)
    return {"average": average}

@app.post("/predict/both", response_model=BothResponse)
def predict_both_json(payload: BatchInput):
    per_essay = predict_per_essay(payload.texts)
    average = predict_average(payload.texts)
    return {"average": average, "predictions": per_essay}


#  CSV INPUT ENDPOINTS (multipart/form-data)
#  - Default kolom: "text", bisa diubah via query ?text_column=
def _read_csv_texts(upload: UploadFile, text_column: str) -> List[str]:
    if upload.content_type not in ("text/csv", "application/vnd.ms-excel", "application/csv", "application/octet-stream"):
        raise HTTPException(status_code=415, detail="File must be a CSV")

    try:
        content = upload.file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Empty file")
        # decode with fallback
        try:
            decoded = content.decode("utf-8")
        except UnicodeDecodeError:
            decoded = content.decode("latin-1")

        reader = csv.DictReader(io.StringIO(decoded))
        if text_column not in reader.fieldnames:
            raise HTTPException(
                status_code=400,
                detail=f"CSV missing required column '{text_column}'. Found columns: {reader.fieldnames}"
            )

        texts: List[str] = []
        for i, row in enumerate(reader):
            val = row.get(text_column, "")
            if val is None:
                val = ""
            texts.append(str(val))
        if len(texts) == 0:
            raise HTTPException(status_code=400, detail="No rows found in CSV")
        return texts
    finally:
        upload.file.close()

@app.post("/predict/essay/csv", response_model=PerEssayResponse)
def predict_essay_csv(
    file: UploadFile = File(..., description="CSV file with a 'text' column"),
    text_column: str = Query("text", description="Name of the CSV column containing essay text")
):
    texts = _read_csv_texts(file, text_column=text_column)
    per_essay = predict_per_essay(texts)
    return {"predictions": per_essay}

@app.post("/predict/avg/csv", response_model=AverageResponse)
def predict_avg_csv(
    file: UploadFile = File(...),
    text_column: str = Query("text")
):
    texts = _read_csv_texts(file, text_column=text_column)
    average = predict_average(texts)
    return {"average": average}

@app.post("/predict/both/csv", response_model=BothResponse)
def predict_both_csv(
    file: UploadFile = File(...),
    text_column: str = Query("text")
):
    texts = _read_csv_texts(file, text_column=text_column)
    per_essay = predict_per_essay(texts)
    average = predict_average(texts)
    return {"average": average, "predictions": per_essay}
