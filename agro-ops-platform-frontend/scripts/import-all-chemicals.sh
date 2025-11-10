#!/bin/bash
# Script to import all chemicals from CSV using Convex CLI
# This will use the importFromExcel action which already handles batch processing

cd "$(dirname "$0")/.."

echo "Importing chemicals from CSV..."
echo "Note: This will process all 2431 chemicals from the CSV file"
echo "The importFromExcel action in Convex will handle duplicates automatically"
echo ""
echo "To import, you can use the admin interface at /admin/import-chemicals"
echo "or use the Convex dashboard to run the importFromExcel action with the CSV file"

