# syntax=docker/dockerfile:1
FROM python:3.13-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DEFAULT_TIMEOUT=120 \
    PIP_RETRIES=8 \
    PIP_INDEX_URL=https://mirror-pypi.runflare.com/simple

WORKDIR /app
RUN addgroup --system app && adduser --system --ingroup app --home /app app

COPY requirements.prod.txt ./
RUN pip install --no-cache-dir --requirement requirements.prod.txt

COPY alembic.ini ./
COPY alembic ./alembic
COPY app ./app
RUN mkdir -p /app/uploads && chown -R app:app /app

USER app
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips=*"]
