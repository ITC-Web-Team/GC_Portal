#!/bin/sh
set -e

mkdir -p "$(dirname "$SQLITE_PATH")" "$MEDIA_ROOT"

# First start on an empty volume: seed it with the database and media from the repo
if [ ! -s "$SQLITE_PATH" ]; then
    echo "Seeding $SQLITE_PATH from repo copy"
    cp /app/db.sqlite3 "$SQLITE_PATH"
fi
if [ -z "$(ls -A "$MEDIA_ROOT")" ]; then
    echo "Seeding $MEDIA_ROOT from repo copy"
    cp -r /app/media/. "$MEDIA_ROOT"/
fi

python manage.py migrate --noinput

exec gunicorn GCPortalnew.wsgi:application --bind 0.0.0.0:8000 --workers 3 --access-logfile -
