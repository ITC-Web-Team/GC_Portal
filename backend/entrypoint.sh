#!/bin/sh
set -e

SEED_DIR="${SEED_DIR:-/seed}"

is_sqlite() {
    [ "$(head -c 15 "$1" 2>/dev/null)" = "SQLite format 3" ]
}

mkdir -p "$(dirname "$SQLITE_PATH")" "$MEDIA_ROOT"

# Move aside a database file that isn't SQLite (e.g. left by an old file mount) instead of crashing
if [ -s "$SQLITE_PATH" ] && ! is_sqlite "$SQLITE_PATH"; then
    BAD="$SQLITE_PATH.corrupt-$(date +%Y%m%d%H%M%S)"
    echo "WARNING: $SQLITE_PATH is not a SQLite database, moving it to $BAD"
    mv "$SQLITE_PATH" "$BAD"
fi

# First start on an empty volume: seed it with the database and media from the image
if [ ! -s "$SQLITE_PATH" ]; then
    echo "Seeding $SQLITE_PATH from $SEED_DIR"
    cp "$SEED_DIR/db.sqlite3" "$SQLITE_PATH"
fi
if [ -z "$(ls -A "$MEDIA_ROOT")" ]; then
    echo "Seeding $MEDIA_ROOT from $SEED_DIR"
    cp -r "$SEED_DIR/media/." "$MEDIA_ROOT"/
fi

python manage.py migrate --noinput

exec gunicorn GCPortalnew.wsgi:application --bind 0.0.0.0:8000 --workers 3 --access-logfile -
