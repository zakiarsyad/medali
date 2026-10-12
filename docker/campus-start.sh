#!/bin/sh
# What the campus server package runs when it starts.
set -e

# Takes the place of this script, so stopping the package stops the app.
exec node_modules/.bin/next start
