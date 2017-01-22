SELECT    'posts', SUM(num_posts)
FROM      forums
UNION
SELECT    'topics', SUM(num_topics)
FROM      forums
UNION
SELECT    'users', COUNT(*)
  FROM    users
  WHERE   group_id != 0 AND id > 1
UNION
SELECT    'pending_registrations', COUNT(*)
  FROM    users
  WHERE   group_id = 0 AND id > 1
UNION
  SELECT    'bans', COUNT(*)
  FROM bans
UNION
  SELECT 'messages',COUNT(*) FROM messages
UNION
  SELECT 'users_today',COUNT(*) FROM users where last_visit >= UNIX_TIMESTAMP(CURRENT_DATE());
