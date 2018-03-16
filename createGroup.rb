#!/usr/bin/env ruby

require 'genboreeTools'


def generateSourceRegistryDocument(host, users)
    prefix = '{
      "SourceRegistry": {
        "value": "user_registry",
        "properties": {
          "EvidenceSources": {
            "value": 1,
            "items": ['
    suffix = '] } } } }'
    item_schema = '{
            "EvidenceSource": {
              "value": "__USERNAME__",
              "properties": {
                "Evidence": {
                  "value": "http://__CALC_HOST__/REST/v1/grp/__USERNAME__/kb/__USERNAME__/coll/Evidence"
                },
                "Tags": {
                  "value": "http://__CALC_HOST__/REST/v1/grp/pcalc_resources/kb/pcalc_resources/coll/AllowedTags/doc/ACMG2015-Caps"
                },
                "Transform": {
                  "value": "http://__CALC_HOST__/REST/v1/grp/pcalc_resources/kb/pcalc_resources/trRulesDoc/acmgTransform"
                },
                "Questionnaire": {
                  "value": "http://__CALC_HOST__/REST/v1/grp/__USERNAME__/kb/__USERNAME__/coll/Evidence/quest/newEviEvidence1Evidence"
                },
                "Guidelines": {
                  "value": 1,
                  "items": [
                    {
                      "Guideline": {
                        "value": "http://__CALC_HOST__/REST/v1/grp/pcalc_resources/kb/pcalc_resources/coll/GuidelineRulesMetaRules/doc/ACMG2015-Guidelines",
                        "properties": {
                          "type": {
                            "value": "ACMG"
                          },
                          "displayName": {
                            "value": "__USERNAME__"
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }'
    items = []
    users.each { |user|
        items << item_schema.gsub('__CALC_HOST__',host).gsub('__USERNAME__',user)
    }
    return (prefix + items.join(',') + suffix)
end


if ARGV.size < 1
  puts "Parameters: login1 login2 login3 ..."
  exit 1
end

users = ARGV

group_pcalc_resources = 'pcalc_resources'
kb_pcalc_resources = 'pcalc_resources'
kb_pcalc_cache = 'pcalc_cache'


# Create permissions to access another users groups 
users.each { |group|
    users.each { |user|
        next if group == user # full access - already set
        api_put("/REST/v1/grp/#{group}/usr/#{user}/role", {"role"=>"subscriber", "permissionBits"=>""})
    }
}

# overwrite user_registry document
users.each { |user|
    logins = users.clone
    logins.delete(user)
    logins = [user] + logins
    api_put("/REST/v1/grp/#{user}/kb/#{user}/coll/SourceRegistry/doc/user_registry", generateSourceRegistryDocument('localhost',logins) ) 
}

