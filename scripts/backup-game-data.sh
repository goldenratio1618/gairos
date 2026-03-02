#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <destination-directory>" >&2
  exit 1
fi

DEST_ROOT="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="$DEST_ROOT/gairos-backup-$TIMESTAMP"

mkdir -p "$BACKUP_DIR"

if [[ -d "$REPO_ROOT/generated" ]]; then
  cp -a "$REPO_ROOT/generated" "$BACKUP_DIR/generated"
fi

if [[ -f "$REPO_ROOT/rules.txt" ]]; then
  cp -a "$REPO_ROOT/rules.txt" "$BACKUP_DIR/rules.txt"
fi

cat <<MSG
Backup complete.
Saved to: $BACKUP_DIR

Restore generated data with:
  cp -a "$BACKUP_DIR/generated/." "$REPO_ROOT/generated/"
MSG
