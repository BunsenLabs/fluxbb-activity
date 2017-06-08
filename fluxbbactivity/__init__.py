#!/usr/bin/env python3

from argparse import ArgumentParser
from bottle import abort, route, run, static_file
import logging
import os
import sys
from fluxbbactivity.fetcher import Fetcher

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

@route("/api/{}/<cat>/<key>".format(APIVER))
def dataroute(cat, key):
    if (cat in PUBLIC) and (key in PUBLIC[cat]):
        return { "v":PUBLIC[cat][key] }
    else:
        return dict()

@route("/api/{}/last-update".format(APIVER))
def callback():
    if "ts" in PUBLIC:
        return { "v":PUBLIC["ts"] }
    else:
        return { "v": 0 }

@route("/api/{}/history/<cat>/<key>".format(APIVER))
def callback(cat, key):
    print(cat,key)
    try:
        return { "v": PUBLIC["history"][cat][key] }
    except BaseException as err:
        return { "v": dict(), "error": err }

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
