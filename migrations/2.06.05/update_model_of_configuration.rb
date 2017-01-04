#!/usr/bin/env ruby

require 'genboreeTools'

api_put( "/REST/v1/grp/pcalc_resources/kb/pcalc_resources/coll/Configuration/model?unsafeForceModelUpdate=true", File.read("kb_collections/Configuration.model.json") )
