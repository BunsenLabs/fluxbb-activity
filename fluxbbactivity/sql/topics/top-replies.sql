select id,subject,num_replies,round(num_replies/(select sum(num_replies) from topics)*100,2) from topics order by num_replies desc limit 5;
