#!/bin/bash

set -e  # stop on first error

rm -rf /usr/local/brl/local/rails/redmine/plugins/genboree_patho_calc
rm -rf /usr/local/brl/local/rails/redmine/project-specific/genboree_patho_calc
cp -r src/redmine/*  /usr/local/brl/local/rails/redmine/
cp -r /usr/local/brl/local/apache/htdocs/javaScripts/ext-4.2.1  /usr/local/brl/local/rails/redmine/plugins/genboree_patho_calc/assets/stylesheets/

rm -rf /usr/local/brl/local/etc/conf/pathogenicityCalculator*
cp -r src/etc_conf/* /usr/local/brl/local/etc/conf/

cd ${DIR_TARGET}/rails/redmine
RAILS_ENV=production rake db:migrate
RAILS_ENV=production rake redmine:plugins
cd -
