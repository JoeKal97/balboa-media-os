-- Migration: Rename send_datetime_local to send_datetime_utc
-- This clarifies that the timestamp is in UTC (the actual moment to send)
-- Frontend will convert UTC to local timezone using date-fns-tz

ALTER TABLE issues 
RENAME COLUMN send_datetime_local TO send_datetime_utc;

-- Update the column comment to reflect the new semantics
COMMENT ON COLUMN issues.send_datetime_utc IS 'UTC timestamp representing the moment the issue should be sent. Frontend converts to local timezone for display.';
