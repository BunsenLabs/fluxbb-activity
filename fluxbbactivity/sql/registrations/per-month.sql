SELECT      MONTH(FROM_UNIXTIME(registered)),
            COUNT(*)
FROM        users
WHERE       id > 1
GROUP BY    MONTH(FROM_UNIXTIME(registered));
