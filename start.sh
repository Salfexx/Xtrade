#!/bin/bash
set -e

export PATH="$HOME/.cargo/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

echo "=== Building Frontend Production Assets ==="
cd frontend
npm run build
cd ..

echo "=== Starting Raxon Trading Platform (Rust Backend + UI) ==="
cargo run --release
