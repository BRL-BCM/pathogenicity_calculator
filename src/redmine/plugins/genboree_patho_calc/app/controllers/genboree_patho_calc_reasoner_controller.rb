class GenboreePathoCalcReasonerController < ApplicationController  
  include GenboreePathoCalcHelper
  unloadable
  before_filter :find_project, :find_settings, :genboreePathoCalcSettings
  respond_to :json
  
  def run()
    # Get the config doc for the logged in user
    apiReq = GbApi::JsonAsyncApiRequester.new(env, @genboreePCSettings.userConfHost, nil)
    payload = params['payload']
    @errMsg = ""
    apiReq.bodyFinish {
      headers = apiReq.respHeaders
      status = apiReq.respStatus
      headers['Content-Type'] = "text/plain"
      respBody = JSON.generate(apiReq.respBody)
      apiReq.sendToClient(status, headers, respBody)
    }
    #$stderr.puts "#{@genboreePCSettings.userConfRsrcPath}/{doc}: #{#{@genboreePCSettings.userConfRsrcPath}/{doc}}"
    apiReq.put("/REST/v1/genboree/tool/reasonerV2a1/job?", {}, payload)
  end

end
