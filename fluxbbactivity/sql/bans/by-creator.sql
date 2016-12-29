select username,count from
  (SELECT ban_creator as id, count(*) as count from bans group by ban_creator) as b
  INNER JOIN 
  (SELECT id,username from users) u
  ON b.id = u.id
ORDER BY count desc;
