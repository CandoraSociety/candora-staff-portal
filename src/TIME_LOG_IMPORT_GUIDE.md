# Time Log Import Guide

## CSV Format

Upload a CSV file with the following columns (in order):

```
volunteer_id,volunteer_name,position_id,position_title,sign_in_time,sign_out_time,total_hours,date,notes,status
```

## Column Details

| Column | Required | Format | Example | Notes |
|--------|----------|--------|---------|-------|
| volunteer_id | Yes* | String | `vol_123abc` | *Required OR volunteer_name for matching |
| volunteer_name | Yes* | String | `John Smith` | *Required if ID not found |
| position_id | No | String | `pos_456def` | Can be null/empty |
| position_title | No | String | `Food Bank Helper` | Defaults to "Volunteer Work" |
| sign_in_time | No | ISO 8601 datetime | `2024-01-15T09:00:00Z` | |
| sign_out_time | No | ISO 8601 datetime | `2024-01-15T13:00:00Z` | Can be null (still signed in) |
| total_hours | No | Number (float) | `4.5` | Defaults to 0 |
| date | No | YYYY-MM-DD | `2024-01-15` | Extracted from sign_in_time if missing |
| notes | No | String | `Helped with sorting` | Defaults to empty |
| status | No | Enum | `completed` | Defaults to "completed" |

## Status Values

- `signed_in` - Currently active session
- `completed` - Finished session (default for historical data)
- `adjusted` - Manually adjusted hours

## Volunteer Matching

The import function matches volunteers using this logic:

1. **Primary Match**: Uses `volunteer_id` (exact match from old system)
2. **Fallback Match**: If ID not found, tries matching `volunteer_name` (case-insensitive)
3. **Skip**: Record is skipped if no volunteer match found

## CSV Parsing Features

✅ Handles quoted fields (fields containing commas)
✅ Handles escaped quotes (`""` becomes `"`)
✅ Trims whitespace from fields
✅ Skips empty lines
✅ Continues processing even if some records fail

## Example CSV

```csv
volunteer_id,volunteer_name,position_id,position_title,sign_in_time,sign_out_time,total_hours,date,notes,status
vol_abc123,Jane Doe,pos_001,Community Lunch Helper,2024-01-15T09:00:00Z,2024-01-15T13:00:00Z,4,2024-01-15,Served meals,completed
vol_def456,Bob Smith,pos_002,Food Bank Depot,2024-01-15T10:00:00Z,2024-01-15T14:00:00Z,4,2024-01-15,Sorted donations,completed
,Carol White,pos_003,Reception Desk,2024-01-16T08:00:00Z,2024-01-16T12:00:00Z,4,2024-01-16,Answered phones,completed
```

Note: The third row has no volunteer_id, so it will match by name "Carol White".

## How to Import

1. Go to **Volunteer Manager → Time Logs**
2. Click **Import Time Logs** button
3. Select your CSV file
4. Click **Import**
5. View the summary showing:
   - Number of records imported
   - Number of records skipped
   - First 20 errors (if any)

## Performance

- Records are imported in batches of 100 for efficiency
- Volunteer lookup uses in-memory maps for fast matching
- Automatic recalculation of volunteer total_hours after import

## Error Handling

The import will:
- ✅ Continue processing even if some records fail
- ✅ Skip records with missing volunteer information
- ✅ Handle empty sign_out_time (volunteer still signed in)
- ✅ Preserve original volunteer_id for audit trail
- ❌ NOT fail the entire import on single record errors

## Automatic Updates

Three automations keep volunteer hours synchronized:
- ✅ On TimeLog Create → Updates volunteer total_hours
- ✅ On TimeLog Update → Recalculates volunteer total_hours
- ✅ On TimeLog Delete → Recalculates volunteer total_hours

## Troubleshooting

**"Volunteer not found" errors:**
- Check that volunteer_id matches existing records
- Verify volunteer_name spelling (case-insensitive matching)
- Ensure volunteers were imported before time logs

**CSV parsing errors:**
- Ensure file is saved as UTF-8 CSV
- Check for proper quote escaping (`""` for quotes within fields)
- Verify column headers match exactly