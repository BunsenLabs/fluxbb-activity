SELECT      MONTH(FROM_UNIXTIME(posted)),
            YEAR(FROM_UNIXTIME(posted)),
            COUNT(*) as count
FROM        posts
GROUP BY    MONTH(FROM_UNIXTIME(posted)), 
            YEAR(FROM_UNIXTIME(posted))
ORDER BY count desc limit 10;
