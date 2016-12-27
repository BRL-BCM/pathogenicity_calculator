#!/bin/bash

set -e  # stop on first error

rm -rf /usr/local/brl/local/apache/htdocs/clingenInference

cp -r ./src/* /usr/local/brl/local/
