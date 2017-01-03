SELECT      MONTH(FROM_UNIXTIME(registered)) month,
            COUNT(*)
FROM        users
WHERE       id > 1
GROUP BY    month;
