FROM python:3.9-slim

WORKDIR /app

# Install Python dependencies
COPY api/python/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Python files
COPY api/python /app/api/python/

# Set Python path
ENV PYTHONPATH=/app 