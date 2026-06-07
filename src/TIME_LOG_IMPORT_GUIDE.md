# Time Log Import Guide

## CSV Format

Upload a CSV file with the following columns (header row required):

```
volunteer_id,volunteer_name,position_id,position_title,sign_in_time,sign_out_time,total_hours,date,notes,status
```

## Column Details

| Column | Required | Format | Example |
|--------|----------|--------|---------|
| volunteer_id | Yes | String (existing volunteer ID) | `vol_123abc` |
| volunteer_name | Yes | String | `John Smith` |
| position_id | No | String | `pos_456def` |
| position_title | No | String | `Food Bank Helper` |
| sign_in_time | No | ISO datetime | `2024-01-15T09:00:00Z` |
| sign_out_time | No | ISO datetime | `2024-01-15T13:00:00Z` |
| total_hours | No | Number (float) | `4.5` |
| date | No | YYYY-MM-DD | `2024-01-15` |
| notes | No | String | `Helped with sorting` |
| status | No | Enum | `completed` |

## Status Values

- `signed_in` - Currently active session
- `completed` - Finished session (default)
- `adjusted` - Manually adjusted hours

## Important Notes

1. **volunteer_id must match existing volunteers** - Rows with invalid IDs will be skipped
2. **Automatic total recalculation** - After import, all volunteer total_hours are automatically recalculated
3. **Duplicate prevention** - The system will create new time log records for each valid row
4. **Error reporting** - You'll see a summary: "Imported X time logs, skipped Y rows"

## Example CSV

```csv
volunteer_id,volunteer_name,position_id,position_title,sign_in_time,sign_out_time,total_hours,date,notes,status
vol_abc123,Jane Doe,pos_001,Community Lunch Helper,2024-01-15T09:00:00Z,2024-01-15T13:00:00Z,4,2024-01-15,Served meals,completed
vol_def456,Bob Smith,pos_002,Food Bank Depot,2024-01-15T10:00:00Z,2024-01-15T14:00:00Z,4,2024-01-15,Sorted donations,completed
```

## How to Import

1. Go to **Volunteer Manager → Time Logs**
2. Click **Import Time Logs** button
3. Select your CSV file
4. Click **Import**
5. View the summary of imported records

## Automatic Updates

Three automations keep volunteer hours synchronized:
- ✅ On TimeLog Create → Updates volunteer total_hours
- ✅ On TimeLog Update → Recalculates volunteer total_hours
- ✅ On TimeLog Delete → Recalculates volunteer total_hours