#!/usr/bin/env ruby

require 'genboreeTools'

def replace_constants(text,username=nil)
  text.gsub!('__USERNAME__' , username) if not username.nil?
  return text
end

if ARGV.size != 4
  puts "Parameters: login firstname lastname email"
  exit 1
end

username=ARGV[0]
firstname=ARGV[1]
lastname=ARGV[2]
email=ARGV[3]

group_pcalc_resources = 'pcalc_resources'
kb_pcalc_resources = 'pcalc_resources'
kb_pcalc_cache = 'pcalc_cache'

# create a genboree user
genboree_add_user(username,'ashg1961',email,firstname,lastname)

# - WORKAROUND for problem with access to public KB with authentication
# give user access to group Registry if exists 
if genboree_group_exists('Registry')
  api_put("/REST/v1/grp/Registry/usr/#{username}/role", {"role"=>"subscriber", "permissionBits"=>""})
end
if genboree_group_exists('pcalc_cache')
  api_put("/REST/v1/grp/pcalc_cache/usr/#{username}/role", {"role"=>"author", "permissionBits"=>""})
end

# Create a user group in genboree
api_put("/REST/v1/grp/#{username}")
api_put("/REST/v1/grp/#{username}/usr/#{username}/role", {"role"=>"author", "permissionBits"=>""})

# give full access to user directory for system users like gbPublicToolUser and gbCacheUser
api_put("/REST/v1/grp/#{username}/usr/gbPublicToolUser/role", {"role"=>"author", "permissionBits"=>""})
api_put("/REST/v1/grp/#{username}/usr/gbCacheUser/role"     , {"role"=>"author", "permissionBits"=>""})

# Give the new user subscriber access to guidelines, transformation collections
api_put("/REST/v1/grp/#{group_pcalc_resources}/usr/#{username}/role", {"role"=>"subscriber", "permissionBits"=>""})

# Create a kbs in user group
api_put("/REST/v1/grp/#{username}/kb/#{username}")

# create collections in user KB
api_put("/REST/v1/grp/#{username}/kb/#{username}/coll/SourceRegistry/model", File.read("kb_collections/SourceRegistry.model.json") )
api_put("/REST/v1/grp/#{username}/kb/#{username}/coll/Evidence/model"      , File.read("kb_collections/Evidence.model.json") )

# Upload quest & template in user evidence collection in user KB
api_put("/REST/v1/grp/#{username}/kb/#{username}/coll/Evidence/template/newEviTempEvidence1Evidence", File.read("kb_others/template.json") )
api_put("/REST/v1/grp/#{username}/kb/#{username}/coll/Evidence/quest/newEviEvidence1Evidence"       , File.read("kb_others/questionnair.json") )

# create user_registry document
api_put("/REST/v1/grp/#{username}/kb/#{username}/coll/SourceRegistry/doc/user_registry", replace_constants(File.read("kb_data/SourceRegistry.docs.json"),username) )

# Create configuration
api_put("/REST/v1/grp/#{group_pcalc_resources}/kb/#{kb_pcalc_resources}/coll/Configuration/doc/#{username}", replace_constants(File.read("kb_data/Configuration.docs.json"),username))
