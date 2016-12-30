SELECT      MONTH(FROM_UNIXTIME(posted)),
            YEAR(FROM_UNIXTIME(posted)),
            COUNT(*)
FROM        messages
GROUP BY    MONTH(FROM_UNIXTIME(posted)), 
            YEAR(FROM_UNIXTIME(posted))
order by posted asc;
