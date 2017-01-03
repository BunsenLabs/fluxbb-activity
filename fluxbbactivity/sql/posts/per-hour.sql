SELECT    HOUR(FROM_UNIXTIME(posted)) as hour,
          COUNT(*)
FROM      posts
GROUP BY  hour;
