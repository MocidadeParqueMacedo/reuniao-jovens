#!/bin/bash
set -e

echo "Installing pnpm..."
npm install -g pnpm

echo "Installing dependencies..."
pnpm install

echo "Building application..."
pnpm run build

echo "Build completed successfully!"
