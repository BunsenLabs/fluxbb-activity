select timezone,count(*)/(select count(*) from users)*100 as count from users group by timezone order by timezone asc;
