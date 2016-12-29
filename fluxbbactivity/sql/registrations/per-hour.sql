SELECT    HOUR(FROM_UNIXTIME(registered)),
          COUNT(*)
FROM      users
WHERE     id > 1
GROUP BY  HOUR(FROM_UNIXTIME(registered));
