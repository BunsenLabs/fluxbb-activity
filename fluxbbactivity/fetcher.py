from fluxbbactivity.journal import Journal
import MySQLdb
import calendar
import json
import logging
import threading
import time

class Fetcher(threading.Thread):
    def __init__(self, cconf, queries, timeout, journalpath):
        super().__init__()
        self.cconf = cconf
        self.queries = queries
        self.timeout = timeout
        self.journal = journalpath
        self.public = {}

    def run(self):
        self.event = threading.Event()
        self.update()
        while not self.event.wait(timeout=self.timeout):
            self.update()

    def update(self):
        logging.info("Running Fetcher.update()")
        global PUBLIC
        PUBLIC = self.query()
        logging.info("Fetcher.update() finished.")

    def query(self):
        t = { "history": dict() }
        with MySQLdb.connect(**self.cconf) as cur:
            with Journal(self.journal) as jur:
                for cat in self.queries:
                    t[cat] = {}
                    t["history"][cat] = {}
                    for key in self.queries[cat]:
                        query_key = "{}/{}".format(cat, key)
                        logging.debug("Executing query {}".format(query_key))
                        cur.execute(self.queries[cat][key])
                        t[cat][key] = [ self.convtuple(tup) for tup in cur.fetchall() ]
                        jur.commit(query_key, json.dumps(t[cat][key]))
                        if query_key == "counts/all":
                                t["history"][cat][key] = jur.history(query_key)
            t["ts"] = { "last_update": calendar.timegm(time.gmtime(time.time())),
                        "update_interval": self.timeout }
        return t

    def convtuple(self, tup):
        return list(tup[:-1]) + [ float(tup[-1]) ]


