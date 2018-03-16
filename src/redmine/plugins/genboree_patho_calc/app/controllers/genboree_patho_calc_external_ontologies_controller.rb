class GenboreePathoCalcExternalOntologiesController < ApplicationController  
  include GenboreePathoCalcHelper
  include GbMixin::AsyncRenderHelper
  unloadable
  layout false
  before_filter :find_project, :find_settings
  respond_to :json


  def scigraph()
    # Get the config doc for the logged in user
    apiReq = GbApi::SimpleAsyncApiRequester.new(env, "scigraph-ontology.monarchinitiative.org", nil)
    apiReq.nonGbApiTargetHost = true
    @resp = ""
    @headers = nil
    @status = nil
    apiReq.respCallback { |array|
      begin
        @headers = array[1]
        @status = array[0]
        @headers['Content-Type'] = "text/plain"
        array[2].each { |buff|
          @resp << buff  
        }
      rescue => e
        apiReq.sendToClient(500, array[1], e.message)
      end
    }
    apiReq.bodyFinish {
      apiReq.sendToClient(@status, @headers, @resp)
    }
    #$stderr.puts "#{@settingsRec.userConfRsrcPath}/{doc}: #{#{@settingsRec.userConfRsrcPath}/{doc}}"
    apiReq.get("/scigraph/vocabulary/autocomplete/{query}?limit={lim}", { :query => params['term'], :lim => 10 })
  end
  
  

end

