SELECT      DAY(FROM_UNIXTIME(registered)),
            MONTH(FROM_UNIXTIME(registered)),
            YEAR(FROM_UNIXTIME(registered)),
            COUNT(*)
FROM        users
WHERE       id > 1
GROUP BY    DAY(FROM_UNIXTIME(registered)),
            MONTH(FROM_UNIXTIME(registered)), 
            YEAR(FROM_UNIXTIME(registered));
