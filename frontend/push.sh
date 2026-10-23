#!/usr/bin/env bash
# usage: ./push.sh https://github.com/<user>/<repo>.git "commit message"
set -e
REMOTE="$1"; MSG="${2:-feat: new multi-theme UI}"
[ -d .git ] || git init
git add .
git commit -m "$MSG" || true
git branch -M main
git remote remove origin 2>/dev/null || true
git remote add origin "$REMOTE"
git push -u origin main
