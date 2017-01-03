SELECT      DAY(FROM_UNIXTIME(posted)) as day,
            MONTH(FROM_UNIXTIME(posted)) as month,
            YEAR(FROM_UNIXTIME(posted)) as year,
            COUNT(*)
FROM        posts
where       (UNIX_TIMESTAMP()-posted)<=10368000
GROUP BY    day, month, year
order by posted asc;
