SELECT d.poster,
       COUNT(*) AS score
FROM
  (SELECT a.topic_id,
          b.post_id
   FROM
     (SELECT id AS topic_id,
             first_post_id
      FROM topics
      WHERE first_post_id<>0) AS a
   INNER JOIN
     (SELECT id AS post_id,
             topic_id
      FROM posts) AS b ON a.topic_id = b.topic_id
   AND b.post_id>a.first_post_id
   GROUP BY topic_id
   ORDER BY post_id) AS c
INNER JOIN posts AS d ON c.post_id=d.id
GROUP BY d.poster
ORDER BY score DESC
LIMIT 20;
