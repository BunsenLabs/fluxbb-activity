#!/usr/bin/env python3

from bottle import abort, route, run, static_file, redirect
from argparse import ArgumentParser
import MySQLdb
import sys
import threading
import logging
import os
import pathlib

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
    args = ap.parse_args()
    if not args.sql_password:
        try:
            args.sql_password = os.environ["FXBA_SQL_PASSWORD"]
        except:
            raise BaseException("No SQL password supplied via command line or environment")
    return args

class Fetcher(threading.Thread):
    def __init__(self, conn, queries):
        super().__init__()
        self.conn = conn
        self.queries = queries
        self.public = {}

    def run(self):
        self.event = threading.Event()
        self.update()
        while not self.event.wait(timeout=3600):
            self.update()

    def update(self):
        logging.info("Running Fetcher.update()")
        global PUBLIC
        PUBLIC = self.query()
        logging.info("Fetcher.update() finished.")

    def query(self):
        t = {}
        cur = self.conn.cursor()
        for cat in self.queries:
            t[cat] = {}
            for key in self.queries[cat]:
                logging.debug("Executing query {}/{}".format(cat, key))
                cur.execute(self.queries[cat][key])
                t[cat][key] = [ self.convtuple(tup) for tup in cur.fetchall() ]
        cur.close()
        return t

    def convtuple(self, tup):
        return list(tup[:-1]) + [ int(tup[-1]) ]

@route('/')
def callback():
    return redirect("/index.html")

@route('/api/<cat>/<key>')
def dataroute(cat, key):
    return { "v":PUBLIC[cat][key] }

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
    conn = MySQLdb.connect(
            db = args.sql_db,
            unix_socket = args.sql_socket,
            user = args.sql_user,
            passwd = args.sql_password)
    fetcher = Fetcher(conn, queries)
    fetcher.start()
    try:
        run(host = args.address, port = args.port, server = "cherrypy")
    except:
        run(host = args.address, port = args.port)
    return 0
