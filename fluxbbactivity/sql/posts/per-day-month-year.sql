SELECT      DAY(FROM_UNIXTIME(posted)),
            MONTH(FROM_UNIXTIME(posted)),
            YEAR(FROM_UNIXTIME(posted)),
            COUNT(*)
FROM        posts
GROUP BY    DAY(FROM_UNIXTIME(posted)),
            MONTH(FROM_UNIXTIME(posted)), 
            YEAR(FROM_UNIXTIME(posted));
