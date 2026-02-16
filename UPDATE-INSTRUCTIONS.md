# Update Publications Schedule & Articles

This file documents the changes needed to update your publications' schedules and article requirements.

## Changes to Apply

### Publication Schedule Updates
- **Zootown Lowdown**: Friday 11:00 AM, 5 articles per issue
- **Save Our Doggy**: Tuesday 12:00 PM, 4 articles per issue
- **Missoula Eats & Treats**: Thursday 10:00 AM, 4 articles per issue
- **Missoula Business Hub**: Wednesday 1:00 PM, 4 articles per issue

### Code Changes
✅ **Default Publication**: Zootown Lowdown is now the default (set in `app/page.tsx`)

## How to Apply Database Updates

You have two options:

### Option 1: Run the Migration Script (Recommended)

```bash
cd balboa-media-os
node update-publications.js <SUPABASE_URL> <SUPABASE_KEY>
```

Replace with your actual Supabase credentials from:
1. Go to https://app.supabase.com
2. Select your project
3. Click Settings → API
4. Copy `Project URL` and `anon public` key

### Option 2: Manual Update in Supabase Dashboard

1. Go to https://app.supabase.com
2. Open your project
3. Go to SQL Editor
4. Run this query:

```sql
-- Update Zootown Lowdown
UPDATE publications
SET send_day_of_week = 5, send_time_local = '11:00', articles_required_per_issue = 5, updated_at = now()
WHERE name = 'Zootown Lowdown';

-- Update Save Our Doggy
UPDATE publications
SET send_day_of_week = 2, send_time_local = '12:00', articles_required_per_issue = 4, updated_at = now()
WHERE name = 'Save Our Doggy';

-- Update Missoula Eats & Treats
UPDATE publications
SET send_day_of_week = 4, send_time_local = '10:00', articles_required_per_issue = 4, updated_at = now()
WHERE name = 'Missoula Eats & Treats';

-- Update Missoula Business Hub
UPDATE publications
SET send_day_of_week = 3, send_time_local = '13:00', articles_required_per_issue = 4, updated_at = now()
WHERE name = 'Missoula Business Hub';
```

## Day of Week Reference
- 0 = Sunday
- 1 = Monday
- 2 = Tuesday
- 3 = Wednesday
- 4 = Thursday
- 5 = Friday
- 6 = Saturday

## After Update

Once the database is updated:
1. Refresh https://balboa-media-os.vercel.app
2. Zootown Lowdown should load as the default
3. You should see 5 article slots instead of 3
4. Each publication will show the correct send times and article requirements

## Questions?

Let me know if you need any clarification or run into issues!
