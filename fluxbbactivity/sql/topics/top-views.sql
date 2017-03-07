select id,subject,num_views,truncate(num_views/(select sum(num_views) from topics)*100,1) from topics order by num_views desc limit 5;
