FROM python:3.11-slim
WORKDIR /sync
# Copy all sources first (requirements may live at repo root or in project)
COPY . .
# Install Python requirements if present
RUN if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; fi
# Run the sync script from the scripts/ directory
CMD ["python3", "scripts/sync.py"]