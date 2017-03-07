select id,subject,num_replies,truncate(num_replies/(select sum(num_replies) from topics)*100,2) from topics order by num_replies desc limit 5;
