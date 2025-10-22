FROM python:3.9-slim
WORKDIR /app

# Copy application code
COPY ./src /app/src
COPY ./backend /app

# OS packages: networking tools + dos2unix to normalize line endings
RUN apt-get update \
    && apt-get install -y --no-install-recommends iproute2 can-utils kmod dos2unix \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Normalize and prepare startup script
RUN dos2unix /app/startup.sh && chmod +x /app/startup.sh

# Launch
CMD ["/app/startup.sh"]
