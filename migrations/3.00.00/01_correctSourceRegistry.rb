#!/usr/bin/env ruby
require 'uri'
require 'brl/db/dbrc'
require 'brl/genboree/genboreeUtil'
require 'brl/genboree/dbUtil'
require 'brl/genboree/rest/apiCaller'
require 'brl/genboree/kb/mongoKbDatabase'
require 'brl/genboree/kb/kbDoc'
require 'brl/genboree/kb/validators/docValidator'
require 'brl/genboree/rest/helpers/kbApiUriHelper'
require 'brl/genboree/rest/helpers/groupApiUriHelper'

require 'genboreeTools'

@gbHost = 'localhost'
@gbGroup = 'pcalc_resources'
@gbKb = 'pcalc_resources'
@gbColl = 'Configuration'



apiCaller = getApiCallerForObject("/REST/v1/grp/{grp}/kb/{kb}/coll/{coll}/docs?detailed=true")
apiCaller.get({:grp => @gbGroup, :kb => @gbKb, :coll => @gbColl})
if(!apiCaller.succeeded?)
  $stderr.puts "GET request to get all user configs failed. Specifically:\n#{apiCaller.respBody.inspect}"
  exit(1)
else
  $stderr.print "Got all user config docs. Updating..."
end

users = []
configDocs = apiCaller.parseRespBody['data']
configDocs.each { |cd|
  cdoc = BRL::Genboree::KB::KbDoc.new(cd)
  user = cdoc.getPropVal("Configuration")
  users << user
}


users.each { |user|
	evSourceColl = "/REST/v1/grp/#{user}/kb/#{user}/coll/SourceRegistry"
    #$stderr.puts "Getting source registry docs from #{evSourceColl}"
    apiCaller = getApiCallerForObject("#{evSourceColl}/docs?detailed=true")
    apiCaller.get({})
    if(!apiCaller.succeeded?)
      raise "Could not get docs from source registry: #{apiCaller.respBody.inspect}"
    end
    sourceRegistryDocs = apiCaller.parseRespBody['data']
    #$stderr.puts "Got Source Registry docs for #{user}. No of docs: #{sourceRegistryDocs.size}"
    docs = []
    sourceRegistryDocs.each { |srd|
		j = srd.to_json
		next if j !~ /calculator\.clinicalgenome\.org/
		j.gsub!('calculator.clinicalgenome.org','localhost')
		docs << j
    }
    next if docs.size == 0
    apiCaller.put({},'[' + docs.join(',') + ']' )
}
