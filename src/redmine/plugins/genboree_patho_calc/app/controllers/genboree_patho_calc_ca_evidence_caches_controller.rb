class GenboreePathoCalcCaEvidenceCachesController < ApplicationController  
  include GenboreePathoCalcHelper
  unloadable
  before_filter :find_project, :find_settings, :genboreePathoCalcSettings
  respond_to :json

  def show()
    # Get the config doc for the logged in user
    casubjectList = JSON.parse(params['casubjectList'])
    @errMsg = ""
    apiReq = GbApi::JsonAsyncApiRequester.new(env, @settingsRec.userConfHost, nil)
    apiReq.bodyFinish {
      begin
        kbd = BRL::Genboree::KB::KbDoc.new(apiReq.respBody['data'])
        @evCacheUrl = kbd.getPropVal("Configuration.CA2EvidenceCache") rescue nil
        evCacheUrlObj = URI.parse(@evCacheUrl)
        apiReq2 = GbApi::JsonAsyncApiRequester.new(env, evCacheUrlObj.host, nil)
        apiReq2.bodyFinish {
          headers = apiReq2.respHeaders
          status = apiReq2.respStatus
          headers['Content-Type'] = "text/plain"
          apiReq2.sendToClient(status, headers, JSON.generate(apiReq2.respBody))
        }
        rsrcPath = "#{evCacheUrlObj.path.chomp("/")}/docs?"
        rsrcPath << "?matchOrderBy=EvidenceCacheID.CanonicalAllele&matchProp=EvidenceCacheID.CanonicalAllele&matchValues={casubjectList}&detailed=true&matchMode=keyword"
        apiReq2.get(rsrcPath, {:casubjectList => casubjectList.join(",")})
      rescue => e
        $stderr.debugPuts(__FILE__, __method__, "ERROR", "ERROR - #{__method__}() => Exception! #{e.class} - #{e.message}\n#{e.backtrace.join("\n")}\n\n")
        headers = apiReq.respHeaders
        status = apiReq.respStatus
        headers['Content-Type'] = "text/plain"
        apiReq.sendToClient(status, headers, e.message)
      end
    }
    apiReq.get("#{@settingsRec.userConfRsrcPath}/{doc}", {:doc => @currRmUser.login})
  end
  
  def find_by_id
    @errMsg = ""
    docId = params['doc']
    apiReq = GbApi::JsonAsyncApiRequester.new(env, @settingsRec.userConfHost, nil)
    apiReq.bodyFinish {
      begin
        kbd = BRL::Genboree::KB::KbDoc.new(apiReq.respBody['data'])
        @evCacheUrl = kbd.getPropVal("Configuration.CA2EvidenceCache") rescue nil
        evCacheUrlObj = URI.parse(@evCacheUrl)
        apiReq2 = GbApi::JsonAsyncApiRequester.new(env, evCacheUrlObj.host, nil)
        apiReq2.bodyFinish {
          headers = apiReq2.respHeaders
          status = apiReq2.respStatus
          headers['Content-Type'] = "text/plain"
          apiReq2.sendToClient(status, headers, JSON.generate(apiReq2.respBody))
        }
        rsrcPath = "#{evCacheUrlObj.path.chomp("/")}/doc/{doc}?"
        apiReq2.get(rsrcPath, {:doc => docId})
      rescue => e
        $stderr.debugPuts(__FILE__, __method__, "ERROR", "ERROR - #{__method__}() => Exception! #{e.class} - #{e.message}\n#{e.backtrace.join("\n")}\n\n")
        headers = apiReq.respHeaders
        status = apiReq.respStatus
        headers['Content-Type'] = "text/plain"
        apiReq.sendToClient(status, headers, e.message)
      end
    }
    apiReq.get("#{@settingsRec.userConfRsrcPath}/{doc}", {:doc => @currRmUser.login})
  end
  
  def save
    @errMsg = ""
    docId = params['doc']
    payload = params['payload']
    apiReq = GbApi::JsonAsyncApiRequester.new(env, @settingsRec.userConfHost, nil)
    apiReq.bodyFinish {
      begin
        kbd = BRL::Genboree::KB::KbDoc.new(apiReq.respBody['data'])
        @evCacheUrl = kbd.getPropVal("Configuration.CA2EvidenceCache") rescue nil
        evCacheUrlObj = URI.parse(@evCacheUrl)
        apiReq2 = GbApi::JsonAsyncApiRequester.new(env, evCacheUrlObj.host, nil)
        apiReq2.bodyFinish {
          headers = apiReq2.respHeaders
          status = apiReq2.respStatus
          headers['Content-Type'] = "text/plain"
          apiReq2.sendToClient(status, headers, JSON.generate(apiReq2.respBody))
        }
        rsrcPath = "#{evCacheUrlObj.path.chomp("/")}/doc/{doc}?"
        apiReq2.put(rsrcPath, {:doc => docId}, payload)
      rescue => e
        $stderr.debugPuts(__FILE__, __method__, "ERROR", "ERROR - #{__method__}() => Exception! #{e.class} - #{e.message}\n#{e.backtrace.join("\n")}\n\n")
        headers = apiReq.respHeaders
        status = apiReq.respStatus
        headers['Content-Type'] = "text/plain"
        apiReq.sendToClient(status, headers, e.message)
      end
    }
    apiReq.get("#{@settingsRec.userConfRsrcPath}/{doc}", {:doc => @currRmUser.login})
  end

end
