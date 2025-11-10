# Chemical Import from CSV

## Summary

The CSV file `PPP+Register_BFSA+27.10.2025.csv` contains **2,431 chemical entries** representing **879 unique chemical names**.

## Current Status

- ✅ CSV file parsed and cleaned
- ✅ Data normalized (dose formatting, danger types capitalized)
- ✅ Missing chemicals identified (2,431 total)
- ⏳ Adding to database (in progress)

## Data Statistics

- **Total entries**: 2,431
- **Unique chemical names**: 879
- **Primary entries**: 879 (first entry for each chemical name)
- **Secondary entries**: 1,552 (additional doses/variants)

### By Danger Type:
- Фунгицид: 1,015
- Хербицид: 725
- Инсектицид: 645
- Десикант: 603
- Акарицид: 568
- Растежен регулатор: 65
- Молюскоцид: 13
- Лимацид: 9
- Феромонов диспенсър: 8
- Нематоцид: 4
- Others: 10

## Files Generated

- `/tmp/chemicals-from-csv.json` - Raw parsed chemicals
- `/tmp/missing-chemicals.json` - Chemicals not in database
- `/tmp/cleaned-chemicals.json` - Normalized chemicals ready for import
- `/tmp/all-chemicals-to-add.json` - Final export for import
- `/tmp/batch-*.json` - Batches of 50 chemicals each (49 batches)

## Import Options

### Option 1: Manual via Admin Interface
1. Navigate to `/admin/import-chemicals`
2. Upload the CSV file (or convert to Excel first)
3. The system will process and import all chemicals

### Option 2: Programmatic via Convex
Use the `chemicals:insertChemical` mutation for individual entries or create a batch import script.

### Option 3: Convert CSV to Excel
The `importFromExcel` action can handle Excel files. Convert the CSV to Excel format and use that action.

## Next Steps

To complete the import, you can:
1. Continue adding chemicals in batches using `chemicals:insertChemical`
2. Use the admin interface to upload the CSV/Excel file
3. Create a custom import script that processes all batches

