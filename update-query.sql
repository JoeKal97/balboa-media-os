-- Update Zootown Lowdown: Friday 11:00 AM, 5 articles
UPDATE publications
SET send_day_of_week = 5, send_time_local = '11:00', articles_required_per_issue = 5, updated_at = now()
WHERE name = 'Zootown Lowdown';

-- Update Save Our Doggy: Tuesday 12:00 PM, 4 articles
UPDATE publications
SET send_day_of_week = 2, send_time_local = '12:00', articles_required_per_issue = 4, updated_at = now()
WHERE name = 'Save Our Doggy';

-- Update Missoula Eats & Treats: Thursday 10:00 AM, 4 articles
UPDATE publications
SET send_day_of_week = 4, send_time_local = '10:00', articles_required_per_issue = 4, updated_at = now()
WHERE name = 'Missoula Eats & Treats';

-- Update Missoula Business Hub: Wednesday 1:00 PM, 4 articles
UPDATE publications
SET send_day_of_week = 3, send_time_local = '13:00', articles_required_per_issue = 4, updated_at = now()
WHERE name = 'Missoula Business Hub';

-- Verify updates
SELECT name, send_day_of_week, send_time_local, articles_required_per_issue FROM publications ORDER BY name;
