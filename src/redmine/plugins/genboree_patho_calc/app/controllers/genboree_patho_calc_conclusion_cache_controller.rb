class GenboreePathoCalcConclusionCacheController < ApplicationController  
  include GenboreePathoCalcHelper
  unloadable
  before_filter :find_project, :find_settings, :genboreePathoCalcSettings
  respond_to :json

  def show()
    # Get the config doc for the logged in user
    matchValues = params['matchValues']
    @errMsg = ""
    apiReq = GbApi::JsonAsyncApiRequester.new(env, @genboreePCSettings.userConfHost, nil)
    apiReq.bodyFinish {
      begin
        kbd = BRL::Genboree::KB::KbDoc.new(apiReq.respBody['data'])
        @coCacheUrl = kbd.getPropVal("Configuration.ConclusionCache") rescue nil
        coCacheUrlObj = URI.parse(@coCacheUrl)
        apiReq2 = GbApi::JsonAsyncApiRequester.new(env, coCacheUrlObj.host, nil)
        apiReq2.bodyFinish {
          headers = apiReq2.respHeaders
          status = apiReq2.respStatus
          headers['Content-Type'] = "text/plain"
          apiReq2.sendToClient(status, headers, JSON.generate(apiReq2.respBody))
        }
        rsrcPath = "#{coCacheUrlObj.path.chomp("/")}/docs?"
        rsrcPath << "?matchProps=ConclusionCacheID.Guideline,ConclusionCacheID.Evidence%20Doc&matchValues={mv}&detailed=true&matchLogicOp=and"
        apiReq2.get(rsrcPath, {:mv => matchValues})
      rescue => e
        $stderr.debugPuts(__FILE__, __method__, "ERROR", "ERROR - #{__method__}() => Exception! #{e.class} - #{e.message}\n#{e.backtrace.join("\n")}\n\n")
        headers = apiReq.respHeaders
        status = apiReq.respStatus
        headers['Content-Type'] = "text/plain"
        apiReq.sendToClient(status, headers, e.message)
      end
    }
    apiReq.get("#{@genboreePCSettings.userConfRsrcPath}/{doc}", {:doc => @currRmUser.login})
  end
  
  def update()
    payload = params['payload']
    docId = params['doc']
    # Get the config doc for the logged in user
    @errMsg = ""
    apiReq = GbApi::JsonAsyncApiRequester.new(env, @genboreePCSettings.userConfHost, nil)
    apiReq.bodyFinish {
      begin
        kbd = BRL::Genboree::KB::KbDoc.new(apiReq.respBody['data'])
        @coCacheUrl = kbd.getPropVal("Configuration.ConclusionCache") rescue nil
        coCacheUrlObj = URI.parse(@coCacheUrl)
        apiReq2 = GbApi::JsonAsyncApiRequester.new(env, coCacheUrlObj.host, nil)
        apiReq2.bodyFinish {
          headers = apiReq2.respHeaders
          status = apiReq2.respStatus
          headers['Content-Type'] = "text/plain"
          apiReq2.sendToClient(status, headers, JSON.generate(apiReq2.respBody))
        }
        rsrcPath = "#{coCacheUrlObj.path.chomp("/")}/doc/{doc}"
        apiReq2.put(rsrcPath, {:doc => docId}, payload)
      rescue => e
        $stderr.debugPuts(__FILE__, __method__, "ERROR", "ERROR - #{__method__}() => Exception! #{e.class} - #{e.message}\n#{e.backtrace.join("\n")}\n\n")
        headers = apiReq.respHeaders
        status = apiReq.respStatus
        headers['Content-Type'] = "text/plain"
        apiReq.sendToClient(status, headers, e.message)
      end
    }
    apiReq.get("#{@genboreePCSettings.userConfRsrcPath}/{doc}", {:doc => @currRmUser.login})
  end

end
