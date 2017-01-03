SELECT      MONTH(FROM_UNIXTIME(registered)) as month,
            YEAR(FROM_UNIXTIME(registered)) as year,
            COUNT(*)
FROM        users
WHERE       id > 1
GROUP BY    month, year
order by registered asc;
