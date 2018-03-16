class GenboreePathoCalcSourceRegistryController < ApplicationController  
  include GenboreePathoCalcHelper
  unloadable

  before_filter :find_project, :find_settings, :genboreePathoCalcSettings
  respond_to :json

  def all()
    # Get the config doc for the logged in user
    apiReq = GbApi::JsonAsyncApiRequester.new(env, @genboreePCSettings.userConfHost, nil)
    @errMsg = ""
    apiReq.bodyFinish {
      begin
        $stderr.debugPuts(__FILE__, __method__, "STATUS", "Got config file")
        kbd = BRL::Genboree::KB::KbDoc.new(apiReq.respBody['data'])
        @evSourceUrl = kbd.getPropVal("Configuration.EvidenceSource") rescue nil
        evSourceUrlObj = URI.parse(@evSourceUrl)
        apiReq2 = GbApi::JsonAsyncApiRequester.new(env, evSourceUrlObj.host, nil)
        apiReq2.bodyFinish {
          headers = apiReq2.respHeaders
          status = apiReq2.respStatus
          headers['Content-Type'] = "text/plain"
          respBody = JSON.generate(apiReq2.respBody)
          apiReq2.sendToClient(status, headers, respBody)
        }
        $stderr.puts "source regis path: #{evSourceUrlObj.path}/docs?detailed=true"
        apiReq2.get("#{evSourceUrlObj.path}/docs?detailed=true", {})
      rescue => e
        $stderr.debugPuts(__FILE__, __method__, "ERROR", "ERROR - #{__method__}() => Exception! #{e.class} - #{e.message}\n#{e.backtrace.join("\n")}\n\n")
        headers = apiReq.respHeaders
        status = apiReq.respStatus
        headers['Content-Type'] = "text/plain"
        apiReq.sendToClient(status, headers, e.message)
      end
    }
    #$stderr.puts "#{@genboreePCSettings.userConfRsrcPath}/{doc}: #{#{@genboreePCSettings.userConfRsrcPath}/{doc}}"
    apiReq.get("#{@genboreePCSettings.userConfRsrcPath}/{doc}", {:doc => @currRmUser.login})
  end
  
  def tags
    evSourceUrl = params['evSourceUrl']
    evSourceUrlObj = URI.parse(evSourceUrl)
    apiReq = GbApi::JsonAsyncApiRequester.new(env, evSourceUrlObj.host, nil)
    @errMsg = ""
    apiReq.bodyFinish {
      begin
        kbd = BRL::Genboree::KB::KbDoc.new(apiReq.respBody['data'][0])
        # Should be the one item for the user ??
        evSource = BRL::Genboree::KB::KbDoc.new(kbd.getPropItems("SourceRegistry.EvidenceSources")[0])
        tagsUrl = evSource.getPropVal("EvidenceSource.Tags")
        tagsUrlObj = URI.parse(tagsUrl)
        apiReq2 = GbApi::JsonAsyncApiRequester.new(env, tagsUrlObj.host, nil)
        apiReq2.bodyFinish {
          headers = apiReq2.respHeaders
          status = apiReq2.respStatus
          headers['Content-Type'] = "text/plain"
          respBody = JSON.generate(apiReq2.respBody)
          apiReq2.sendToClient(status, headers, respBody)
        }
        apiReq2.get("#{tagsUrlObj.path}?detailed=true", {})
      rescue => e
        $stderr.debugPuts(__FILE__, __method__, "ERROR", "ERROR - #{__method__}() => Exception! #{e.class} - #{e.message}\n#{e.backtrace.join("\n")}\n\n")
        headers = apiReq.respHeaders
        status = apiReq.respStatus
        headers['Content-Type'] = "text/plain"
        apiReq.sendToClient(status, headers, e.message)
      end
    }
    apiReq.get("#{evSourceUrlObj.path}/docs?detailed=true", {})
  end

end

