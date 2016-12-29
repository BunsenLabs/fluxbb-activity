SELECT    HOUR(FROM_UNIXTIME(posted)),
          COUNT(*)
FROM      posts
GROUP BY  HOUR(FROM_UNIXTIME(posted));
