FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    SQLITE_PATH=/data/db.sqlite3 \
    MEDIA_ROOT=/data/media

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Snapshot the repo's database and media at build time so runtime mounts can't shadow them,
# and fail the build early if the database isn't a real SQLite file
RUN mkdir -p /seed \
    && cp db.sqlite3 /seed/db.sqlite3 \
    && cp -r media /seed/media \
    && [ "$(head -c 15 /seed/db.sqlite3)" = "SQLite format 3" ]

# /data holds the live database and uploads; mount a volume here
VOLUME /data

EXPOSE 8000

CMD ["sh", "/app/entrypoint.sh"]
