FROM python:3.10-slim-bookworm

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    libopenblas-dev \
    liblapack-dev \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Restrict cmake to single core to avoid high RAM spikes
ENV CMAKE_BUILD_PARALLEL_LEVEL=1

# Install pre-compiled dlib wheel and validator directly
RUN pip install --no-cache-dir dlib-bin email-validator

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Render defaults web services to port 10000
ENV PORT=10000
EXPOSE 10000

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000}
