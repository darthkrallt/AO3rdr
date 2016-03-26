#!/usr/bin/env bash

# Make sure JPM is installed
type jpm >/dev/null 2>&1 || { echo >&2 "Need Firefox dev tool 'jpm'.  Aborting."; exit 1; }

# Make sure Firefox is installed
type firefox >/dev/null 2>&1 || { echo >&2 "Need Firefox.  Aborting."; exit 1; }


# Run the firefox add on
jpm run

