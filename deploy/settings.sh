#!/bin/sh
# Writes /settings when the container starts. The secret is never written: only whether it was read.
{
  cat /usr/share/nginx/html/settings.build
  echo "setting=${TRIAL_SETTING:-none}"
  if [ -n "$TRIAL_SECRET" ]; then echo "secret=read, ${#TRIAL_SECRET} characters"; else echo "secret=none"; fi
} > /usr/share/nginx/html/settings
# The trial of the watch: with TRIAL_BREAK_AFTER set, the home page stops answering that many seconds after
# the container starts. A release like that passes its check, then fails with the visitors on it.
if [ -n "${TRIAL_BREAK_AFTER:-}" ]; then (sleep "$TRIAL_BREAK_AFTER"; rm -f /usr/share/nginx/html/index.html) & fi
