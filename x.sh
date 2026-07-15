#!/bin/sh
if [ -f ./target/release/ty-jk ]; then
  exec ./target/release/ty-jk "$@"
fi
# CI fallback: ty-jk not built, use nx directly
exec npx nx run "$@"
