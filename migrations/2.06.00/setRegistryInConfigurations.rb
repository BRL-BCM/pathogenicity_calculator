#!/usr/bin/env ruby

require 'genboreeTools'

if ARGV.size != 1
    puts "Parameter: FQDN of registry server (without http:// prefix)"
    exit 1
end

fqdn = ARGV[0]

docs = api_get( "/REST/v1/grp/pcalc_resources/kb/pcalc_resources/coll/Configuration/docs?format=json&detailed=true" )

docs.each { |doc|
    doc["Configuration"]["properties"]["RegistryAddress"  ]["value"] = "http://#{fqdn}"
    doc["Configuration"]["properties"]["ReferenceSequence"]["value"] = "http://#{fqdn}/REST/v1/grp/Registry/kb/Registry/coll/ReferenceSequence"
    doc["Configuration"]["properties"]["Gene"             ]["value"] = "http://#{fqdn}/REST/v1/grp/Registry/kb/Registry/coll/Gene"
}

api_put( "/REST/v1/grp/pcalc_resources/kb/pcalc_resources/coll/Configuration/docs?format=json" , docs ) if docs.size > 0

