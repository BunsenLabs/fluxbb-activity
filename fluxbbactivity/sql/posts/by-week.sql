select yearweek(from_unixtime(posted)) as week, count(*) as count from posts group by week order by posted asc;
