#!/usr/bin/env bash
# Contramarea — arranca el juego en local.
# Uso: ./run.sh   (luego abre http://127.0.0.1:8080/src/index.html)
set -e
cd "$(dirname "$0")"
PORT="${PORT:-8080}"
echo "Contramarea — servidor local en http://127.0.0.1:${PORT}/src/index.html"
node tools/serve.js "$PORT"
