#!/bin/sh
# What the campus server package runs when it starts. Each step must
# succeed before the next one runs.
set -e

node_modules/.bin/tsx src/campus/start-check-command.ts
node_modules/.bin/tsx src/campus/database-command.ts

# Takes the place of this script, so stopping the package stops the app.
exec node_modules/.bin/next start
