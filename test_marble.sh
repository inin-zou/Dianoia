#!/bin/bash

# Test 1: Single image scan
echo "=== Test 1: Single image scan ==="
curl -s -X POST 'https://api.worldlabs.ai/marble/v1/worlds:generate' \
  -H 'Content-Type: application/json' \
  -H 'WLT-Api-Key: FN0IRIO7J9FjvorUWR8wCmAZT6g9sfNj' \
  -d '{
    "display_name": "Crime Scene Room",
    "model": "Marble 0.1-mini",
    "world_prompt": {
      "type": "image",
      "image_prompt": {
        "source": "uri",
        "uri": "https://wxafzdetynntbntiywtq.supabase.co/storage/v1/object/public/rendered-views/scan/IMG_9039.jpg"
      },
      "text_prompt": "Interior room for crime scene investigation"
    }
  }'

echo ""
echo ""

# If Test 1 works, copy the operation_id and poll with:
# curl -s -H 'WLT-Api-Key: FN0IRIO7J9FjvorUWR8wCmAZT6g9sfNj' 'https://api.worldlabs.ai/marble/v1/operations/OPERATION_ID_HERE'
