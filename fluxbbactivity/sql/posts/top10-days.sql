SELECT      DAY(FROM_UNIXTIME(posted)) as day,
            MONTH(FROM_UNIXTIME(posted)) as month,
            YEAR(FROM_UNIXTIME(posted)) as year,
            COUNT(*) as count
FROM        posts
GROUP BY    day, month, year
order by count desc limit 10;
