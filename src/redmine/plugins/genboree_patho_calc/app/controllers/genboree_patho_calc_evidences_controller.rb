class GenboreePathoCalcEvidencesController < ApplicationController  
  include GenboreePathoCalcHelper
  include GbMixin::AsyncRenderHelper
  unloadable

  before_filter :find_project, :find_settings, :genboreePathoCalcSettings
  respond_to :json

  def all()
    evidenceDocsRsrcPath = params['rsrcPath']
    evidenceDocsRsrcPathObj = URI.parse(evidenceDocsRsrcPath)
    apiReq = GbApi::JsonAsyncApiRequester.new(env, evidenceDocsRsrcPathObj.host, nil)
    initRackEnv( env ) 
    controller = self
    apiReq.bodyFinish {
      headers = apiReq.respHeaders
      status = apiReq.respStatus
      headers['Content-Type'] = "text/plain"
      begin
        $stderr.puts "apiReq.respBody (#{evidenceDocsRsrcPath.inspect}):\n\n#{apiReq.respBody.inspect}"
        respBody = JSON.generate(apiReq.respBody)
        
        apiReq.sendToClient(status, headers, respBody)
      rescue => e
        apiReq.sendToClient(status, headers, e.message)
      end
    }
    apiReq.get("#{evidenceDocsRsrcPathObj.path}?#{evidenceDocsRsrcPathObj.query}", {})
  end
  
  def delete
    evidenceDocsRsrcPath = params['rsrcPath']
    evidenceDocsRsrcPathObj = URI.parse(evidenceDocsRsrcPath)
    apiReq = GbApi::JsonAsyncApiRequester.new(env, evidenceDocsRsrcPathObj.host, nil)
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
    apiReq.delete("#{evidenceDocsRsrcPathObj.path}?#{evidenceDocsRsrcPathObj.query}", {})
  end
  
  def transform
    evidenceDocsRsrcPath = params['rsrcPath']
    evidenceDocsRsrcPathObj = URI.parse(evidenceDocsRsrcPath)
    apiReq = GbApi::SimpleAsyncApiRequester.new(env, evidenceDocsRsrcPathObj.host, nil)
    initRackEnv( env ) 
    controller = self
    @resp = ""
    @status = nil
    @headers = {}
    apiReq.respCallback { |array|
      begin
        @status = array[0]
        @headers = array[1]
        @headers['Content-type'] = "text/plain"
        array[2].each { |chunk|
          @resp << chunk  
        }
      rescue => e
        @headers['Content-type'] = "text/plain"
        apiReq.sendToClient(500, @headers, e.message)
      end
    }
    apiReq.bodyFinish {
      apiReq.sendToClient(@status, @headers, @resp)
    }
    apiReq.get("#{evidenceDocsRsrcPathObj.path}?#{evidenceDocsRsrcPathObj.query}", {})
  end
  
  def save
    evidenceDocRsrcPath = params['rsrcPath']
    payload = JSON.parse(params['payload'])
    evidenceDocRsrcPathObj = URI.parse(evidenceDocRsrcPath)
    apiReq = GbApi::JsonAsyncApiRequester.new(env, evidenceDocRsrcPathObj.host, nil)
    initRackEnv( env ) 
    controller = self
    apiReq.bodyFinish {
      headers = apiReq.respHeaders
      status = apiReq.respStatus
      headers['Content-Type'] = "text/plain"
      respBody = JSON.generate(apiReq.respBody)
      apiReq.sendToClient(status, headers, respBody)
    }
    apiReq.put("#{evidenceDocRsrcPathObj.path}?", {}, JSON.generate(payload['data']))
  end
  
  def find_by_ca
    caid = params['caid']
    apiReq = GbApi::JsonAsyncApiRequester.new(env, @settingsRec.userConfHost, nil)
    initRackEnv( env ) 
    controller = self
    @errMsg = ""
    apiReq.bodyFinish {
      begin
        kbd = BRL::Genboree::KB::KbDoc.new(apiReq.respBody['data'])
        @evSourceUrl = kbd.getPropVal("Configuration.EvidenceSource") rescue nil
        evSourceUrlObj = URI.parse(@evSourceUrl)
        apiReq2 = GbApi::JsonAsyncApiRequester.new(env, evSourceUrlObj.host, nil)
        apiReq2.bodyFinish {
          headers = apiReq2.respHeaders
          status = apiReq2.respStatus
          headers['Content-Type'] = "text/plain"
          begin
            srDoc = BRL::Genboree::KB::KbDoc.new(apiReq2.respBody['data'][0])
            evSources = srDoc.getPropItems("SourceRegistry.EvidenceSources")
            evidenceUrl = nil
            evSources.each { |evSource|
              evKbd =  BRL::Genboree::KB::KbDoc.new(evSource)
              evidenceUrl = evKbd.getPropVal("EvidenceSource.Evidence")
              # @todo include all evidence sources
              break
              
            }
            if(evidenceUrl)
              evidenceUrlObj = URI.parse(evidenceUrl)
              apiReq3 = GbApi::JsonAsyncApiRequester.new(env, evidenceUrlObj.host, nil)
              apiReq3.bodyFinish {
                headers = apiReq2.respHeaders
                status = apiReq2.respStatus
                headers['Content-Type'] = "text/plain"
                apiReq3.sendToClient(status, headers, JSON.generate(apiReq3.respBody))
              }
              apiReq3.get("#{evidenceUrlObj.path}/doc/{doc}?detailed=true", {:doc => caid})
            else
              apiReq.sendToClient(500, headers, "Could not find EvidenceSource for user: #{@currRmUser.login}")
            end
          rescue => e
            apiReq.sendToClient(500, headers, e.message)
          end
          
        }
        apiReq2.get("#{evSourceUrlObj.path.chomp("/")}/docs?", {})
      rescue => e
        headers = apiReq.respHeaders
        status = apiReq.respStatus
        headers['Content-Type'] = "text/plain"
        apiReq.sendToClient(500, headers, e.message)
      end
    }
    #$stderr.puts "#{@genboreePCSettings.userConfRsrcPath}/{doc}: #{#{@genboreePCSettings.userConfRsrcPath}/{doc}}"
    apiReq.get("#{@genboreePCSettings.userConfRsrcPath}/{doc}", {:doc => @currRmUser.login})
  end
  
  def save_answer
    qpathRsrcPath = params['qpath']
    payload = params['payload']
    qpathRsrcPathObj = URI.parse(qpathRsrcPath)
    apiReq = GbApi::JsonAsyncApiRequester.new(env, qpathRsrcPathObj.host, nil)
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
    apiReq.put("#{qpathRsrcPathObj.path.chomp("/")}/answer/", {}, payload)
  end

end
