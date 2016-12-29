SELECT      MONTH(FROM_UNIXTIME(posted)),
            YEAR(FROM_UNIXTIME(posted)),
            COUNT(*)
FROM        posts
GROUP BY    MONTH(FROM_UNIXTIME(posted)), 
            YEAR(FROM_UNIXTIME(posted));
