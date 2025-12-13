#!/bin/bash

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/backup_$TIMESTAMP.sql"

mkdir -p $BACKUP_DIR

echo "💾 Backing up Database..."

docker exec -t finanzas-postgres pg_dumpall -c -U finanzas > $FILENAME

# gzip it
gzip $FILENAME

echo "✅ Backup saved to $FILENAME.gz"

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
