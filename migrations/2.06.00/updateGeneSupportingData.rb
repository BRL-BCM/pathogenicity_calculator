#!/usr/bin/env ruby

require 'genboreeTools'

docs = api_get( "/REST/v1/grp/pcalc_resources/kb/pcalc_resources/coll/GeneSupportingData/docs?format=json&detailed=true" )

docs.each { |doc|
    t = doc["GeneSupportingData"]["properties"]["Subject"]["value"].split('/')
    gn = "GN"
    id = t[-1].to_i
    gn << "0" if id < 100000
    gn << "0" if id < 10000
    gn << "0" if id < 1000
    gn << "0" if id < 100
    gn << "0" if id < 10
    gn << id.to_s
    t[-1] = gn
    doc["GeneSupportingData"]["properties"]["Subject"]["value"] = t.join('/')
}

api_put( "/REST/v1/grp/pcalc_resources/kb/pcalc_resources/coll/GeneSupportingData/docs?format=json" , docs ) if docs.size > 0

