FROM python:3.10-slim

WORKDIR /app

# Create cache directory
RUN mkdir -p /tmp/huggingface_cache && \
    chmod -R 777 /tmp/huggingface_cache

# Set environment variables
ENV HF_HOME=/tmp/huggingface_cache
ENV TRANSFORMERS_CACHE=/tmp/huggingface_cache
ENV HF_DATASETS_CACHE=/tmp/huggingface_cache
ENV HUGGINGFACE_HUB_CACHE=/tmp/huggingface_cache
ENV XDG_CACHE_HOME=/tmp

# Install dependencies first
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download NLTK stopwords
RUN python -m nltk.downloader -d /usr/local/share/nltk_data stopwords
ENV NLTK_DATA=/usr/local/share/nltk_data

# Pre-download the SentenceTransformer model
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/all-mpnet-base-v2', cache_folder='/tmp/huggingface_cache')"

# Copy application files
COPY . /app/

EXPOSE 7860

ENV PYTHONUNBUFFERED=1

CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-7860}"]