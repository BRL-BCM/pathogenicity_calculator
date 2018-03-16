class GenboreePathoCalcUserInfoController < ApplicationController  
  include GenboreePathoCalcHelper
  include GbMixin::AsyncRenderHelper
  unloadable

  before_filter :find_project, :find_settings, :genboreePathoCalcSettings
  respond_to :json

  def role()
    grpuri = params['grpuri']
    grpuriObj = URI.parse(grpuri)
    apiReq = GbApi::JsonAsyncApiRequester.new(env, grpuriObj.host, nil)
    initRackEnv( env ) 
    controller = self
    apiReq.bodyFinish {
      headers = apiReq.respHeaders
      status = apiReq.respStatus
      headers['Content-Type'] = "text/plain"
      begin
        respBody = JSON.generate(apiReq.respBody)
        apiReq.sendToClient(status, headers, respBody)
      rescue => e
        apiReq.sendToClient(status, headers, e.message)
      end
    }
    apiReq.get("#{grpuriObj.path}/usr/{usr}/role?connect=no", {:usr => @currRmUser.login})
  end
  
  

end
