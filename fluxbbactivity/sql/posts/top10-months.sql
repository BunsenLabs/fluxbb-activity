SELECT MONTH(FROM_UNIXTIME(posted)) as month, YEAR(FROM_UNIXTIME(posted)) as year, COUNT(*) as count FROM posts GROUP BY month, year ORDER BY count desc limit 10;
