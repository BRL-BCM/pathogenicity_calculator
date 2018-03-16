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
# This script adds the new 'GeneSummary' collection and updates the user configuration and Evidences collections to make them compatible with Version 2.0 of the calculator.
# Also updates user data in line with the updated models.
# Requires an API user that has admin level access to the user config collection (supplied as one one of the arguments to this script) as model updates are only allowed for admins. 

require 'genboreeTools'

if ARGV.size != 1
	puts "Parameters: URL to Allele Registry server (no http:// prefix)"
	exit 1
end

registry_url = ARGV[0]
@gbHost = 'localhost'
@gbGroup = 'pcalc_resources'
@gbKb = 'pcalc_resources'
@gbColl = 'Configuration'


dbu = BRL::Genboree::DBUtil.new("DB:#{@gbHost}", nil, nil)
@dbu = dbu
dbrc = BRL::DB::DBRC.new()
genbConf = BRL::Genboree::GenboreeConfig.load()
dbrcRec = dbrc.getRecordByHost(@gbHost, :api)
mongoDbrcRec = dbrc.getRecordByHost(@gbHost, :nosql)

def getOwnerInfoForColl(coll)
  kbUriHelper =  BRL::Genboree::REST::Helpers::KbApiUriHelper.new(@dbu)
  gpUriHelper =  BRL::Genboree::REST::Helpers::GroupApiUriHelper.new(@dbu)
  kbUri = kbUriHelper.extractPureUri(coll)
  groupName = gpUriHelper.extractPureUri(kbUri).split("/").last.chomp("?")
  grpId = @dbu.selectGroupByName(groupName)[0]["groupId"]
  # Get an 'owner' user for this group.
  client = @dbu.getMysql2Client(:mainDB)
  #$stderr.puts "kbUri: #{kbUri.inspect}; groupName: #{groupName.inspect}; grpId: #{grpId.inspect}"
  rs = client.query("select * from usergroup where groupId = #{grpId}")
  ownerInfo = {}
  #$stderr.puts "rs:\n#{rs.entries.inspect}"
  rs.entries.each { |rec|
    if(rec["userGroupAccess"] == "o")
      #ownerInfo = {:usr => rec["name"], :pwd => rec["password"]}
      userId = rec["userId"]
      userRec = @dbu.selectUserById(userId)[0]
      ownerInfo = {:user => userRec["name"], :pwd => userRec["password"]}
      break
    end
  }
  return ownerInfo
end

def getMongoDbNameForColl(coll)
  kbUriHelper =  BRL::Genboree::REST::Helpers::KbApiUriHelper.new(@dbu)
  gpUriHelper =  BRL::Genboree::REST::Helpers::GroupApiUriHelper.new(@dbu)
  kbUri = kbUriHelper.extractPureUri(coll)
  kbName = kbUri.split("/").last.chomp("?")
  groupName = gpUriHelper.extractPureUri(kbUri).split("/").last.chomp("?")
  grpId = @dbu.selectGroupByName(groupName)[0]["groupId"]
  
  mongoDbName = @dbu.selectKbByNameAndGroupId(kbName, grpId)[0]["databaseName"]
  return mongoDbName
end

gsModel = {"unique"=>true, "domain"=>"string", "properties"=>[{"items"=>[{"unique"=>true, "properties"=>[{"items"=>[{"identifier"=>true, "index"=>true, "name"=>"CAID"}], "domain"=>"numItems", "name"=>"CAIDs"}, {"name"=>"Type"}], "identifier"=>true, "index"=>true, "name"=>"ReasonerCall"}], "name"=>"ReasonerCalls"}], "identifier"=>true, "name"=>"Gene"}

configModel = {"unique"=>true, "required"=>true, "domain"=>"string", "description"=>"Identifier for this document", "identifier"=>true, "index"=>true, "properties"=>[{"domain"=>"string", "description"=>"Email to be displayed in case of warning or error messages", "name"=>"Email"}, {"domain"=>"url", "description"=>"Link to canonical allele collection - Example http://genboree.org/REST/v1/grp/{grp}/kb/{kb}/coll/{coll}", "properties"=>[{"required"=>true, "domain"=>"url", "description"=>"GenboreeKB UI link", "name"=>"redmineProject"}], "name"=>"CanonicalAllele"}, {"required"=>true, "domain"=>"url", "description"=>"Link to evidence source collection - Example http://genboree.org/REST/v1/grp/{grp}/kb/{kb}/coll/{coll}. Information about guidelines, tags, transformation and project IDs are fetched from this collection", "name"=>"EvidenceSource"}, {"required"=>true, "domain"=>"url", "description"=>"Link to conclusionCache collection - Example http://genboree.org/REST/v1/grp/{grp}/kb/{kb}/coll/{coll}.", "name"=>"ConclusionCache"}, {"required"=>true, "domain"=>"url", "description"=>"Link to the EvidenceCache", "name"=>"CA2EvidenceCache"}, {"domain"=>"url", "description"=>"Link to Gene collection - Example http://genboree.org/REST/v1/grp/{grp}/kb/{kb}/coll/{coll}.", "name"=>"Gene"}, {"domain"=>"url", "description"=>"Link to ReferenceSequence collection - Example http://genboree.org/REST/v1/grp/{grp}/kb/{kb}/coll/{coll}.", "name"=>"ReferenceSequence"}, {"domain"=>"url", "description"=>"Link to the collection where the source links for the canonical allele are present. It is this information that is used in the top most panel of the calculator.", "name"=>"CASourceLinks"}, {"domain"=>"url", "description"=>"Link to the collection where the source links for the gene are present. It is this information that is used in the top most panel of the calculator.", "name"=>"GeneSourceLinks"}, {"domain"=>"url", "description"=>"Link to the Contextual Collection.", "name"=>"ContextualAllele"}, {"domain"=>"url", "description"=>"Link to the Registry Address.", "name"=>"RegistryAddress"}, {"domain"=>"url", "description"=>"URL to the gene summary collection: one of the summarization categories", "index"=>true, "name"=>"GeneSummary"}], "name"=>"Configuration"}

evidenceModel = {"name"=>"Allele evidence", "unique"=>true, "required"=>true, "identifier"=>true, "domain"=>"autoID(CLI,uniqAlphaNum,EV)", "properties"=>[{"name"=>"Subject", "unique"=>false, "required"=>true, "index"=>true, "domain"=>"url", "properties"=>[{"name"=>"Phenotype", "required"=>true, "domain"=>"string"}, {"name"=>"Mode of inheritance", "required"=>true, "domain"=>"enum(Autosomal Dominant, Autosomal Recessive, X-linked Dominant, X-linked Recessive, Mitochondrial, Multifactorial, Other, Unknown)", "default"=>"Unknown"}, {"name"=>"Evidence Tags", "items"=>[{"name"=>"Evidence Tag", "unique"=>true, "required"=>true, "index"=>true, "category"=>true, "identifier"=>true, "domain"=>"autoID(EV,uniqAlphaNum,TAG)", "properties"=>[{"name"=>"Tag", "category"=>true, "domain"=>"enum(CHOOSE_ONE,PVS1, PS1, PS2, PS3, PS4, PM1, PM2, PM3, PM4, PM5, PM6, PP1, PP2, PP3, PP4, PP5, BP1, BP2, BP3, BP4, BP5, BP6, BP7, BS1, BS2, BS3, BS4, BA1, BS1-Supporting, BS2-Supporting, BP1-Strong, BP3-Strong, BP4-Strong, BP7-Strong, BS3-Supporting, BS4-Supporting, BP2-Strong, BP6-Strong, BP5-Strong, PM2-Supporting, PS4-Supporting, PM4-Supporting, PM5-Supporting, PS1-Supporting, PVS1-Supporting, PM1-Supporting, PS3-Supporting, PM6-Supporting, PS2-Supporting, PM3-Supporting, PS4-Moderate, PP3-Moderate, PS1-Moderate, PVS1-Moderate, PP2-Moderate, PS3-Moderate, PP1-Moderate, PS2-Moderate, PP5-Moderate, PP4-Moderate, PM2-Strong, PP3-Strong, PM4-Strong, PM5-Strong, PVS1-Strong, PM1-Strong, PP2-Strong, PP1-Strong, PM6-Strong, PM3-Strong, PP5-Strong, PP4-Strong, PM2-Very Strong, PS4-Very Strong, PS1-Very Strong, PM4-Very Strong, PM5-Very Strong, PP3-Very Strong, PP2-Very Strong, PM1-Very Strong, PS3-Very Strong, PP1-Very Strong, PM6-Very Strong, PS2-Very Strong, PM3-Very Strong, PP5-Very Strong, PP4-Very Strong)", "default"=>"CHOOSE_ONE", "properties"=>[{"name"=>"Status", "required"=>true, "domain"=>"enum(On, Off)", "default"=>"On"}, {"name"=>"Summary", "domain"=>"string"}, {"name"=>"Pathogenicity", "required"=>true, "domain"=>"enum(CHOOSE_ONE, Pathogenic, Benign)", "default"=>"CHOOSE_ONE"}, {"name"=>"Strength", "required"=>true, "domain"=>"enum(CHOOSE_ONE, Strong, Very Strong, Moderate, Supporting, Stand Alone)", "default"=>"CHOOSE_ONE"}, {"name"=>"Type", "required"=>true, "domain"=>"enum(CHOOSE_ONE, Computational And Predictive Data, Functional Data, Population Data, Allelic Data, De novo Data, Segregation Data, Other Data, Other Database)", "default"=>"CHOOSE_ONE"}, {"name"=>"Links", "items"=>[{"name"=>"Link", "unique"=>true, "required"=>true, "index"=>true, "identifier"=>true, "domain"=>"url", "properties"=>[{"name"=>"Comment", "domain"=>"string"}, {"name"=>"Link Code", "domain"=>"enum(Supports, Disputes, Unknown)", "default"=>"Unknown"}]}], "domain"=>"numItems"}]}]}], "domain"=>"numItems"}, {"name"=>"FinalCall", "index"=>true, "description"=>"Final assertion/call made by the reasoner", "default"=>"Undetermined"}, {"name"=>"Type", "default"=>"ACMG"}]}]}

# First Update the config model
apiCaller = getApiCallerForObject("/REST/v1/grp/{grp}/kb/{kb}/coll/{coll}/model?unsafeForceModelUpdate=true")
apiCaller.put({:grp => @gbGroup, :kb => @gbKb, :coll => @gbColl}, configModel.to_json)
if(!apiCaller.succeeded?)
  $stderr.puts "PUT request to update user config collection failed. Specifically:\n#{apiCaller.respBody.inspect}"
  exit(1)
else
  $stderr.puts "User config model updated."
end

# Next get all the docs in the configuration collection and set the "GeneSummary" collection. This collection will reside in the same collection as the evidence docs for that user.
apiCaller.setRsrcPath("/REST/v1/grp/{grp}/kb/{kb}/coll/{coll}/docs?detailed=true")
apiCaller.get({:grp => @gbGroup, :kb => @gbKb, :coll => @gbColl})
if(!apiCaller.succeeded?)
  $stderr.puts "GET request to get all user configs failed. Specifically:\n#{apiCaller.respBody.inspect}"
  exit(1)
else
  $stderr.print "Got all user config docs. Updating..."
end

configDocs = apiCaller.parseRespBody['data']
updatedConfigDocs = []
userKb2UserInfo = {}
kbUriHelper =  BRL::Genboree::REST::Helpers::KbApiUriHelper.new(@dbu)
gpUriHelper =  BRL::Genboree::REST::Helpers::GroupApiUriHelper.new(@dbu)
config_doc = '{
  "Configuration": {
    "properties": {
      "CA2EvidenceCache": {
        "value": "http://localhost/REST/v1/grp/pcalc_cache/kb/pcalc_cache/coll/EvidenceCache"
      },
      "GeneSummary": {
        "value": "http://localhost/REST/v1/grp/_USER_NAME_/kb/_USER_NAME_/coll/GeneSummary"
      },
      "ConclusionCache": {
        "value": "http://localhost/REST/v1/grp/pcalc_cache/kb/pcalc_cache/coll/ConclusionCache"
      },
      "EvidenceSource": {
        "value": "http://localhost/REST/v1/grp/_USER_NAME_/kb/_USER_NAME_/coll/SourceRegistry"
      }
    },
    "value": "_USER_NAME_"
  }
}'
configDocs.each { |cd|
  cdoc = BRL::Genboree::KB::KbDoc.new(cd)
  user = cdoc.getPropVal("Configuration")
  kbUri = "http://localhost/REST/v1/grp/#{user}/kb/#{user}"
  userKb2UserInfo[kbUri] = getOwnerInfoForColl(kbUri)
  updatedConfigDocs << config_doc.gsub("_USER_NAME_",user)
  if(updatedConfigDocs.size == 50)
    apiCaller.put({:grp => @gbGroup, :kb => @gbKb, :coll => @gbColl}, '[' + updatedConfigDocs.join(',') + ']' )
    if(!apiCaller.succeeded?)
      $stderr.puts "PUT request to update all user configs failed. Specifically:\n#{apiCaller.respBody.inspect}"
      exit(1)
    else
      $stderr.print "\t."
    end
    updatedConfigDocs.clear
  end
}

ff = File.open("upd.txt", "w")
ff.print(userKb2UserInfo.to_json)

if(!updatedConfigDocs.empty?)
  apiCaller.put({:grp => @gbGroup, :kb => @gbKb, :coll => @gbColl}, '[' + updatedConfigDocs.join(',') + ']' )
  if(!apiCaller.succeeded?)
    $stderr.puts "PUT request to update all user configs failed. Specifically:\n#{apiCaller.respBody.inspect}"
    exit(1)
  end
end

$stderr.puts "Updated all user config docs."
$stderr.puts "Updating evidence docs..."
updateSkipped = {}
finalReport = {}
http = ::Net::HTTP.new(registry_url)
# Go over all user docs and update evidence docs
configDocs.each { |cd|
  begin
    gsHash = {}
    cdoc = BRL::Genboree::KB::KbDoc.new(cd)
    user = cdoc.getPropVal("Configuration")
    kbUri = "http://localhost/REST/v1/grp/#{user}/kb/#{user}"
    $stderr.puts "Processing user: #{user}"
    evSourceColl = "http://localhost/REST/v1/grp/#{user}/kb/#{user}/coll/SourceRegistry"
    # Download the evidence cache and maintain a hash for quick lookup
    evidenceCacheLookup = {}
    evCacheUrl = "http://localhost/REST/v1/grp/pcalc_cache/kb/pcalc_cache/coll/EvidenceCache"
    if(evCacheUrl.nil? or evCacheUrl.empty?)
      updateSkipped << user
      $stderr.puts "Skipping user: #{user}: Evidence cache coll not found!"
      next
    else
      # Use a direct mongo connection to get the evidence cache docs since there can be a lot of docs and we can benefit from mongo's cursor approach.   
      mongoDbName = getMongoDbNameForColl(evCacheUrl)
      evCacheName = evCacheUrl.split("/").last.chomp("?")
      mdb = BRL::Genboree::KB::MongoKbDatabase.new(mongoDbName, mongoDbrcRec[:driver], { :user => mongoDbrcRec[:user], :pass => mongoDbrcRec[:password]})
      dh = mdb.dataCollectionHelper(evCacheName)
      cc = dh.coll.find({})
      cc.each { |ecd|
        ecdoc = BRL::Genboree::KB::KbDoc.new(ecd)
        eviDocUrl = ecdoc.getPropVal("EvidenceCacheID.Evidence Doc")
        fcall = ecdoc.getPropVal("EvidenceCacheID.FinalCall")
        type = ecdoc.getPropVal("EvidenceCacheID.Type")
        eviDocUrlObj = URI.parse(eviDocUrl)
        guidelineUrl = ecdoc.getPropVal("EvidenceCacheID.Guideline")
        gurlObj = URI.parse(guidelineUrl)
        evidenceCacheLookup["#{eviDocUrlObj.host}#{eviDocUrlObj.path}"] = {:fcall => fcall, :type => type}
      }
    end
    evSourceCollUriObj = URI.parse(evSourceColl)
    kbUri = kbUriHelper.extractPureUri(evSourceColl)
    userInfo = userKb2UserInfo[kbUri]
    if(userInfo.empty?)
      updateSkipped << user
      $stderr.puts "Skipping user: #{user}: Admin user not found for KB: #{kbUri}"
      next
    end
    $stderr.puts "Getting source registry docs from #{evSourceColl}"
    apiCaller = BRL::Genboree::REST::ApiCaller.new(evSourceCollUriObj.host, "#{evSourceCollUriObj.path}/docs?detailed=true", userInfo[:user], userInfo[:pwd])
    apiCaller.get({})
    if(!apiCaller.succeeded?)
      raise "Could not get docs from source registry: #{apiCaller.respBody.inspect}"
    end
    sourceRegistryDocs = apiCaller.parseRespBody['data']
    $stderr.puts "Got Source Registry docs for #{user}. No of docs: #{sourceRegistryDocs.size}"
    
    sourceRegistryDocs.each { |srd|
      srdoc = BRL::Genboree::KB::KbDoc.new(srd)
      evSources = srdoc.getPropItems("SourceRegistry.EvidenceSources")
      evSources.each { |evSource|
        evSrcDoc = BRL::Genboree::KB::KbDoc.new(evSource)
        evidenceColl = evSrcDoc.getPropVal("EvidenceSource.Evidence").chomp("?")
        
        userInfo = getOwnerInfoForColl(evidenceColl)
        evidenceCollUriObj = URI.parse(evidenceColl)
        apiCaller = BRL::Genboree::REST::ApiCaller.new(evidenceCollUriObj.host, "#{evidenceCollUriObj.path}/model?unsafeForceModelUpdate=true", userInfo[:user], userInfo[:pwd])
        apiCaller.put({}, evidenceModel.to_json)
        if(!apiCaller.succeeded?)
          raise "Could not update Evidence model:\n#{apiCaller.respBody.inspect}"
        end
        apiCaller.setRsrcPath("#{evidenceCollUriObj.path}/docs?")
        mongoDbName = getMongoDbNameForColl(evidenceColl)
        evCollName = evidenceColl.split("/").last.chomp("?")
        mdb = BRL::Genboree::KB::MongoKbDatabase.new(mongoDbName, mongoDbrcRec[:driver], { :user => mongoDbrcRec[:user], :pass => mongoDbrcRec[:password]})
        dh = mdb.dataCollectionHelper(evCollName)
        cc = dh.coll.find({})
        totalEvidenceDocs = cc.count
        $stderr.puts "Going to update FinalCall and Type for evidence docs for collection: #{evidenceColl} (#{totalEvidenceDocs} docs)"
        updatedEvidenceDocs = []
        totalEvidenceDocsUpdated = 0
        nonUniqAlleles = {}
        caidHash = {}
        cc.each { |dd|
          evidenceDoc =  BRL::Genboree::KB::KbDoc.new(dd)
          docId = evidenceDoc.getPropVal("Allele evidence")
          caid = evidenceDoc.getPropVal("Allele evidence.Subject").split("/").last
          
          selfUrl = "#{evidenceColl}/doc/#{docId}"
          selfUrlObj = URI.parse(selfUrl)
          lookupKey = "#{selfUrlObj.host}#{selfUrlObj.path}"
          fcall = "Undetermined"
          type = "ACMG"
          if(evidenceCacheLookup.key?(lookupKey))
            fcall = evidenceCacheLookup[lookupKey][:fcall]
            type = evidenceCacheLookup[lookupKey][:type]
          end
          evidenceDoc.setPropVal("Allele evidence.Subject.FinalCall", fcall)
          evidenceDoc.setPropVal("Allele evidence.Subject.Type", type)
          updatedEvidenceDocs << evidenceDoc
          if(updatedEvidenceDocs.size == 100)
            apiCaller.put({}, updatedEvidenceDocs.to_json)
            updatedEvidenceDocs.clear
            totalEvidenceDocsUpdated += 100
            $stderr.puts "Uploaded #{totalEvidenceDocsUpdated}  of #{totalEvidenceDocs} docs"
          end
          
          resp = nil
          10.times { |at|
            begin
              $stderr.puts "Getting info from allele registry for CA: #{caid.inspect} (Attempt#: #{at+1})"
              resp = http.get("/allele/#{caid}?fields=none+transcriptAlleles.geneSymbol")
              break if(!resp.nil?)
            rescue Exception => err
              $stderr.puts "Failed to get info from allele registry: #{err.message}\nTRACE: #{err.backtrace.join("\n")}"
              sleep(4) 
            end
          }
            
          if(resp and resp.code.to_i == 200)
            gene = {}
            alleleInfoObj = JSON.parse(resp.body)
            if(alleleInfoObj.key?("transcriptAlleles"))
              tas = alleleInfoObj["transcriptAlleles"]
              tas.each { |ta|
                if(ta.key?("geneSymbol"))
                  gene[ta["geneSymbol"]] = nil
                end
              }
              gsym = "Non-Coding"
              gsym = gene.keys.sort.join("/") if(gene.keys.size > 0)
              if(!gsHash.key?(gsym))
                gsHash[gsym] = {:ACMG => {}, :NON_ACMG => {} }
              end
              if(type == "ACMG")
                if(!gsHash[gsym][:ACMG].key?(fcall))
                  gsHash[gsym][:ACMG][fcall] = {}
                end
                gsHash[gsym][:ACMG][fcall][caid] = nil
              else
                gsHash[gsym][:NON_ACMG][caid] = nil
              end
            end
          else
            updateSkipped[user] = nil
            $stderr.puts "Gene summary could not be updated for user: #{user} for caid: #{caid}"
          end
            
        }
        
        if(!updatedEvidenceDocs.empty?)
          apiCaller.put({}, updatedEvidenceDocs.to_json)
          totalEvidenceDocsUpdated += updatedEvidenceDocs.size
          $stderr.puts "Uploaded #{totalEvidenceDocsUpdated}  of #{totalEvidenceDocs} docs"
          updatedEvidenceDocs.clear
        end
        
        $stderr.puts "All evidence docs updated for collection: #{evidenceColl}"
      }
      
    }
    # Upload the Gene Summary model and docs
    $stderr.puts "Adding GeneSummary collection and docs"
    userInfo = userKb2UserInfo[kbUri]
    userkbUriObj = URI.parse(kbUri)
    apiCaller = BRL::Genboree::REST::ApiCaller.new(userkbUriObj.host, "#{userkbUriObj.path}/coll/GeneSummary/model?unsafeForceModelUpdate=true", userInfo[:user], userInfo[:pwd])
    apiCaller.put({}, gsModel.to_json)
    if(!apiCaller.succeeded?)
      raise "Gene Summary collection could not be created: #{apiCaller.respBody.inspect}"
    end
    $stderr.puts "GeneSummary collection created"
    apiCaller.setRsrcPath("#{userkbUriObj.path}/coll/GeneSummary/docs?")
    gsDocs = []
    gsHash.each_key { |gene|
      rcalls = []
      # Add ACMG assertions
      gsHash[gene][:ACMG].each_key { |fcall|
        caids = gsHash[gene][:ACMG][fcall].keys
        caidDocs = []
        caids.each { |caid|
          caidDocs << { "CAID" => {"value" => caid } }  
        }
        rcall = {
          "ReasonerCall" => {
            "value" => fcall,
            "properties" => {
              "Type" => {"value" => "ACMG"},
              "CAIDs" => { "items" => caidDocs }
            }
          }
        }
        rcalls << rcall
      }
      # Add non ACMG stuff
      nonAcmgCaids = []
      gsHash[gene][:NON_ACMG].each_key { |caid|
        nonAcmgCaids << { "CAID" => {"value" => caid } }  
      }
      if(!nonAcmgCaids.empty?)
        rcall = {
            "ReasonerCall" => {
              "value" => "Other - NON ACMG",
              "properties" => {
                "Type" => {"value" => "ACMG"},
                "CAIDs" => { "items" => nonAcmgCaids }
              }
            }
        }
        rcalls << rcall
      end
      next if(rcalls.size == 0)
      gsDoc = {
        "Gene" => {
          "value" => gene,
          "properties" => {
            "ReasonerCalls" => {
              "items" => rcalls
            }
          }
        }
      }
      gsDocs << gsDoc
      if(gsDocs.size == 20)
        apiCaller.put({}, gsDocs.to_json)
        gsDocs.clear
      end
    }
    if(!gsDocs.empty?)
      apiCaller.put({}, gsDocs.to_json)
    end
    $stderr.puts "Uploaded GeneSummary docs"
  rescue Exception => err
    $stderr.puts err
    $stderr.puts err.backtrace.join("\n")
    $stderr.puts "Migration for User: #{user} has failed. Proceeding to next user."
    updateSkipped[user] = nil
  end
  
}

if(!updateSkipped.empty?)
  $stdout.puts "Update failed/skipped or partially succeeded for the following users:\n#{updateSkipped.keys.join("\n")}. See stderr for details."
else
  $stdout.puts "All users updated"
end
