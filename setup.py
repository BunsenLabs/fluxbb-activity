#!/usr/bin/env python3

from setuptools import setup

setup(
        name = "fluxbbactivity",
        version = "0.1",
        packages = ["fluxbbactivity"],

        install_requires = [
                "bottle",
                "cherrypy",
                "MySQLdb"
        ],

        entry_points = {
                "console_scripts": [
                        "fluxbbactivity=fluxbbactivity:main"
                ]
        },

        author = "Jens John",
        author_email = "jjohn@2ion.de",
        description = "Activity dashboard for FluxBB",
        license = "GPL3",
        keywords = "fluxbb dashboard",
        url = "https://github.com/2ion/gien"
)

