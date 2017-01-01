SELECT      DAY(FROM_UNIXTIME(posted)),
            MONTH(FROM_UNIXTIME(posted)),
            YEAR(FROM_UNIXTIME(posted)),
            COUNT(*) as count
FROM        posts
GROUP BY    DAY(FROM_UNIXTIME(posted)),
            MONTH(FROM_UNIXTIME(posted)), 
            YEAR(FROM_UNIXTIME(posted))
order by count desc limit 10;
