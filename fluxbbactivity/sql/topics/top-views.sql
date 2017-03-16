select id,subject,num_views,round(num_views/(select sum(num_views) from topics)*100,2) from topics order by num_views desc limit 5;
