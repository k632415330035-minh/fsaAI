#!/usr/bin/env bash
# exit on error
set -o errexit

echo "==> Building Frontend..."
npm --prefix Frontend install
npm --prefix Frontend run build

echo "==> Installing Python Backend dependencies..."
pip install -r backend_fsa/requirements.txt

echo "==> Build complete!"
