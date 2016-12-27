#!/usr/bin/env ruby

require 'genboreeTools'


group_pcalc_resources = 'pcalc_resources'
group_pcalc_public_cache = 'pcalc_cache'
kb_pcalc_resources = 'pcalc_resources'
kb_pcalc_cache = 'pcalc_cache'


api_delete("/REST/v1/grp/#{group_pcalc_resources}/kb/#{kb_pcalc_resources}/coll/AllowedTags/doc/ACMG2015-Caps")
api_put("/REST/v1/grp/#{group_pcalc_resources}/kb/#{kb_pcalc_resources}/coll/AllowedTags/model?unsafeForceModelUpdate=true", File.read("kb_collections/AllowedTags.model.json") )
api_put("/REST/v1/grp/#{group_pcalc_resources}/kb/#{kb_pcalc_resources}/coll/AllowedTags/doc/ACMG2015-Caps", File.read("kb_data/ACMG2015-Caps.json") )

