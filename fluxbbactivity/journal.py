import sqlite3
import datetime

class Journal:
    def __init__(self, path):
        self.path = path

    def __enter__(self):
        self.conn = sqlite3.connect(self.path)
        cur = self.conn.cursor()
        cur.execute(""" select name from sqlite_master where type='table' and name='journal'; """)
        if not cur.fetchone():
            cur.execute(""" create table journal (date TEXT, apiversion INTEGER, query TEXT, value TEXT ); """)
        self.conn.commit()
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        self.conn.close()

    def commit(self, query, value):
        cur = self.conn.cursor()
        cur.execute(""" INSERT INTO journal VALUES ( ?, ?, ?, ? ) """,
                (str(datetime.datetime.utcnow().isoformat()), APIVER, query, value,))
        self.conn.commit()

    def history(self, key):
        cur = self.conn.cursor()
        cur.execute(""" SELECT date,value
                        FROM journal
                        WHERE query = ? AND apiversion = ?""",
                (key, APIVER,));
        rows = list(map(lambda v: [ v[0], json.loads(v[1]) ], cur.fetchall()))
        self.conn.commit()
        return rows

    def __history_views(self):
        pass

