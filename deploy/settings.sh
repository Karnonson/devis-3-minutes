#!/bin/sh
# Writes /settings when the container starts. The secret is never written: only whether it was read.
{
  cat /usr/share/nginx/html/settings.build
  echo "setting=${TRIAL_SETTING:-none}"
  if [ -n "$TRIAL_SECRET" ]; then echo "secret=read, ${#TRIAL_SECRET} characters"; else echo "secret=none"; fi
} > /usr/share/nginx/html/settings
