#!/usr/bin/env python3

from argparse import ArgumentParser
from bottle import abort, route, run, static_file
import MySQLdb
import calendar
import datetime
import logging
import os
import pathlib
import sys
import threading
import time
import sqlite3
import json

APIVER = 0
PUBLIC = {}
SQLDIR = None
WWWDIR = None

def subdirpath(subdir):
    return "{}/{}".format(os.path.dirname(os.path.abspath(__file__)), subdir)

SQLDIR = subdirpath("sql")
WWWDIR = subdirpath("www")

def parse_cmdline():
    ap = ArgumentParser()
    ap.add_argument("--address", default="127.0.0.1")
    ap.add_argument("--sql-db", required=True)
    ap.add_argument("--sql-password")
    ap.add_argument("--sql-socket", default="/var/run/mysqld/mysqld.sock")
    ap.add_argument("--sql-user", required=True)
    ap.add_argument("--port", type=int, default=10000)
    ap.add_argument("--timeout", type=int, default=900)
    ap.add_argument("--journal", required=True)
    args = ap.parse_args()
    if not args.sql_password:
        try:
            args.sql_password = os.environ["FXBA_SQL_PASSWORD"]
        except:
            raise BaseException("No SQL password supplied via command line or environment")
    return args

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
        t = {}
        with MySQLdb.connect(**self.cconf) as cur:
            with Journal(self.journal) as jur:
                for cat in self.queries:
                    t[cat] = {}
                    for key in self.queries[cat]:
                        logging.debug("Executing query {}/{}".format(cat, key))
                        cur.execute(self.queries[cat][key])
                        t[cat][key] = [ self.convtuple(tup) for tup in cur.fetchall() ]
                        jur.commit("{}/{}".format(cat, key), json.dumps(t[cat][key]))
            t["ts"] = { "last_update": calendar.timegm(time.gmtime(time.time())),
                        "update_interval": self.timeout }
        return t

    def convtuple(self, tup):
        return list(tup[:-1]) + [ float(tup[-1]) ]

@route("/api/{}/<cat>/<key>".format(APIVER))
def dataroute(cat, key):
    return { "v":PUBLIC[cat][key] }

@route("/api/{}/last-update".format(APIVER))
def callback():
    return { "v":PUBLIC["ts"] }

@route('/<path:path>')
def callback(path):
    return static_file(path, root=WWWDIR)

def find_queries(query_dir):
    t = {}
    for root, dirs, files in os.walk(query_dir):
        for f in files:
            if f.endswith(".sql"):
                cat, key = root.split("/")[-1], f[:-4]
                with open("{}/{}".format(root, f), "r") as FILE:
                    data = FILE.read()
                if not cat in t:
                    t[cat] = {}
                t[cat][key] = data
    return t

def main():
    logging.basicConfig(level=logging.DEBUG, format="%(asctime)s : %(name)s : %(levelname)s : %(message)s")
    args = parse_cmdline()
    queries = find_queries(SQLDIR)
    cconf = { "db" : args.sql_db, "unix_socket" : args.sql_socket, "user" : args.sql_user, "passwd" : args.sql_password }
    fetcher = Fetcher(cconf, queries, args.timeout, args.journal)
    fetcher.start()
    try:
        run(host = args.address, port = args.port, server = "cherrypy")
    except:
        run(host = args.address, port = args.port)
    return 0
