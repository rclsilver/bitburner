#!/bin/sh

if [ ! -d node_modules ]; then
    npm install
fi

if [ ! -f NetscriptDefinitions.d.ts ]; then
    npm run defs
fi

exec $@
