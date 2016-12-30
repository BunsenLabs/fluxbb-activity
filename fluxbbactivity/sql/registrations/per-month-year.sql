SELECT      MONTH(FROM_UNIXTIME(registered)),
            YEAR(FROM_UNIXTIME(registered)),
            COUNT(*)
FROM        users
WHERE       id > 1
GROUP BY    MONTH(FROM_UNIXTIME(registered)), 
            YEAR(FROM_UNIXTIME(registered))
order by registered asc;
