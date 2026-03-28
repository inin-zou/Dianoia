#!/bin/bash

echo "=== Listing existing Marble worlds ==="
curl -s --max-time 15 -X POST 'https://api.worldlabs.ai/marble/v1/worlds:list' \
  -H 'Content-Type: application/json' \
  -H 'WLT-Api-Key: FN0IRIO7J9FjvorUWR8wCmAZT6g9sfNj' \
  -d '{"page_size": 10}'

echo ""
echo "=== Done ==="
