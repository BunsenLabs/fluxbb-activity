SELECT HOUR(FROM_UNIXTIME(registered)) hour, COUNT(*) FROM users WHERE id > 1 GROUP BY hour;
