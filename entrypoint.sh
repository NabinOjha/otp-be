#!/bin/sh

echo "Starting app in $NODE_ENV mode..."

if [ "$NODE_ENV" = "production" ]; then
  node dist/index.js
else
  npm run dev
fi
