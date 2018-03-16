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
@gbGroup = 'pcalc_cache'
@gbKb = 'pcalc_cache'
@gbColl = 'EvidenceCache'


apiCaller = getApiCallerForObject("/REST/v1/grp/{grp}/kb/{kb}/coll/{coll}/docs?detailed=true")
apiCaller.get({:grp => @gbGroup, :kb => @gbKb, :coll => @gbColl})
if(!apiCaller.succeeded?)
  $stderr.puts "GET request to get documents failed. Specifically:\n#{apiCaller.respBody.inspect}"
  exit(1)
else
  $stderr.print "Got all docs. Updating...\n"
end

orgDocs = apiCaller.parseRespBody['data']
puts "Found #{orgDocs.size} docs..."
docs = []
orgDocs.each { |srd|
    j = srd.to_json
    next if j !~ /calculator\.clinicalgenome\.org/
    j.gsub!('calculator.clinicalgenome.org','localhost')
    docs << j
    if docs.size >= 100
        payload = '[' + docs.join(',') + ']'
        apiCaller.put({:grp => @gbGroup, :kb => @gbKb, :coll => @gbColl}, payload)
        if(!apiCaller.succeeded?)
            $stderr.puts "PUT request to get documents failed. Specifically:\n#{apiCaller.respBody.inspect}"
            exit(1)
        end
        docs = []
    end
}

if docs.size > 0
    payload = '[' + docs.join(',') + ']'
    apiCaller.put({:grp => @gbGroup, :kb => @gbKb, :coll => @gbColl}, payload)
    if(!apiCaller.succeeded?)
        $stderr.puts "PUT request to get documents failed. Specifically:\n#{apiCaller.respBody.inspect}"
        exit(1)
    end
end

puts "Done!"
