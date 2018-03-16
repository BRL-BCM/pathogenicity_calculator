#!/usr/bin/env ruby


if ARGV.size != 1
	puts "Parameters: Allele Registry FQDN (without http:// prefix)"
	exit 1
end

alleleRegistryFQDN = ARGV[0]

# copy dedicated files to correct locations
`./install_app.sh` 

require 'genboreeTools'

group_pcalc_resources = 'pcalc_resources'
group_pcalc_public_cache = 'pcalc_cache'
kb_pcalc_resources = 'pcalc_resources'
kb_pcalc_cache = 'pcalc_cache'

# genboree groups
api_put("/REST/v1/grp/#{group_pcalc_resources}")
api_put("/REST/v1/grp/#{group_pcalc_public_cache}")

# access for system users
api_put("/REST/v1/grp/#{group_pcalc_resources}/usr/gbPublicToolUser/role", {"role"=>"subscriber", "permissionBits"=>""})
api_put("/REST/v1/grp/#{group_pcalc_resources}/usr/gbCacheUser/role"     , {"role"=>"subscriber", "permissionBits"=>""})
api_put("/REST/v1/grp/#{group_pcalc_public_cache}/usr/gbPublicToolUser/role", {"role"=>"author", "permissionBits"=>""})
api_put("/REST/v1/grp/#{group_pcalc_public_cache}/usr/gbCacheUser/role"     , {"role"=>"author", "permissionBits"=>""})

# create KBs
api_put("/REST/v1/grp/#{group_pcalc_resources}/kb/#{kb_pcalc_resources}")
api_put("/REST/v1/grp/#{group_pcalc_public_cache}/kb/#{kb_pcalc_cache}")

# set KBs as public
genboree_set_kb_public(group_pcalc_resources, kb_pcalc_resources)
genboree_set_kb_public(group_pcalc_public_cache, kb_pcalc_cache)

# create collections for public cache
api_put("/REST/v1/grp/#{group_pcalc_public_cache}/kb/#{kb_pcalc_cache}/coll/ConclusionCache/model", File.read("kb_collections/ConclusionCache.model.json") )
api_put("/REST/v1/grp/#{group_pcalc_public_cache}/kb/#{kb_pcalc_cache}/coll/EvidenceCache/model"  , File.read("kb_collections/EvidenceCache.model.json") )

# create collections with resources
api_put("/REST/v1/grp/#{group_pcalc_resources}/kb/#{kb_pcalc_resources}/coll/AllowedTags/model"            , File.read("kb_collections/AllowedTags.model.json") )
api_put("/REST/v1/grp/#{group_pcalc_resources}/kb/#{kb_pcalc_resources}/coll/GuidelineRulesMetaRules/model", File.read("kb_collections/GuidelineRulesMetaRules.model.json"))
api_put("/REST/v1/grp/#{group_pcalc_resources}/kb/#{kb_pcalc_resources}/coll/Configuration/model"          , File.read("kb_collections/Configuration.model.json"))
api_put("/REST/v1/grp/#{group_pcalc_resources}/kb/#{kb_pcalc_resources}/coll/AlleleSupportingData/model"   , File.read("kb_collections/AlleleSupportingData.model.json"))
api_put("/REST/v1/grp/#{group_pcalc_resources}/kb/#{kb_pcalc_resources}/coll/GeneSupportingData/model"     , File.read("kb_collections/GeneSupportingData.model.json"))

# load tags, Guideline, transform
api_put("/REST/v1/grp/#{group_pcalc_resources}/kb/#{kb_pcalc_resources}/coll/AllowedTags/doc/ACMG2015-Caps"                  , File.read("kb_data/ACMG2015-Caps.json") )
api_put("/REST/v1/grp/#{group_pcalc_resources}/kb/#{kb_pcalc_resources}/coll/GuidelineRulesMetaRules/doc/ACMG2015-Guidelines", File.read("kb_data/ACMG2015-Guidelines.json"))
api_put("/REST/v1/grp/#{group_pcalc_resources}/kb/#{kb_pcalc_resources}/trRulesDoc/acmgTransform"                            , File.read("kb_others/acmgTransform.json"))

# create Redmine project
redmine_add_project("pathogenicity_calculator", "Pathogenicity Calculator", ['genboree_patho_calc'], true)
redmine_configure_project_genboree_patho_calc("pathogenicity_calculator", alleleRegistryFQDN)

