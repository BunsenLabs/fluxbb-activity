select username,count from
  (select poster_id as id,count(*) as count from posts group by poster_id) as p
  inner join
  (select id,username from users) u
  on p.id = u.id
  where count > 0
  order by count desc
  limit 20;
