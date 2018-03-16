class GenboreePathoCalcUiEntryController < ApplicationController  
  include GenboreePathoCalcHelper
  include GbMixin::AsyncRenderHelper
  unloadable
  
  before_filter :find_project, :find_settings, :genboreePathoCalcSettings, :authorize_via_perms_only
  before_filter :loadACMGAssertions
  layout 'patho_calc_main.bootstrap'

  def show()
    # Get the config doc for the logged in user
    apiReq = GbApi::JsonAsyncApiRequester.new(env, @genboreePCSettings.userConfHost, nil)
    initRackEnv( env ) 
    controller = self
    @errMsg = ""
    @showLimit = 25
    @skip = 0
    @variantShowLimit = 20
    @variantSkip = 0
    apiReq.bodyFinish {
      begin
        if(apiReq.respStatus >= 200 and apiReq.respStatus < 400)
          kbd = BRL::Genboree::KB::KbDoc.new(apiReq.respBody['data'])
          $stderr.puts "config doc:\n#{JSON.pretty_generate(kbd)}"
          @evSourceUrl = kbd.getPropVal("Configuration.EvidenceSource") rescue nil
          @conCacheUrl = kbd.getPropVal("Configuration.ConclusionCache") rescue nil
          @contAlleleUrl = kbd.getPropVal("Configuration.ContextualAllele") rescue nil
          @evCacheUrl = kbd.getPropVal("Configuration.CA2EvidenceCache") rescue nil
          @geneSummaryColl = kbd.getPropVal("Configuration.GeneSummary") rescue nil
          # Get the number of docs in the gene summary collection
          geneSummaryUriObj = URI.parse(@geneSummaryColl)
          apiReq2 = GbApi::JsonAsyncApiRequester.new(env, geneSummaryUriObj.host, nil)
          apiReq2.bodyFinish {
            @docCount = apiReq2.respBody['data']['docCount']['value']
            @evSourceUrlObj = URI.parse(@evSourceUrl)
            apiReq3 = GbApi::JsonAsyncApiRequester.new(env, @evSourceUrlObj.host, nil)
            apiReq3.bodyFinish {
              begin
                headers = apiReq3.respHeaders
                status = apiReq3.respStatus
                headers['Content-Type'] = "text/plain"
                srDoc = BRL::Genboree::KB::KbDoc.new(apiReq3.respBody['data'][0])
                eviSources = srDoc.getPropItems("SourceRegistry.EvidenceSources")
                evidenceColl = nil
                eviSources.each { |eviSource|
                  eviSourceDoc = BRL::Genboree::KB::KbDoc.new(eviSource)
                  @evidenceCollURI = eviSourceDoc.getPropVal("EvidenceSource.Evidence")
                  # @todo include all evidence sources  
                  break
                }
                renderToClient(controller)
              rescue => e
                @errMsg = e.message
                $stderr.puts "ERROR - #{__method__}() => Exception! #{e.class} - #{e.message}\n#{e.backtrace.join("\n")}\n\n"
                renderToClient(controller)
              end
            }
            apiReq3.get("#{@evSourceUrlObj.path.chomp("/")}/docs?detailed=true", {})
          }
          apiReq2.get("#{geneSummaryUriObj.path.chomp("/")}/stat/docCount?", {})
        else
          $stderr.puts "@currRmUser: #{@currRmUser.inspect}"
          @errMsg = "Configuration file missing/inaccessible for user: #{@currRmUser} (#{@currRmUser.login}). Please contact the project manager to resolve the issue."  
          renderToClient(controller)
        end
      rescue => e
        @errMsg = e.message
        $stderr.puts "ERROR - #{__method__}() => Exception! #{e.class} - #{e.message}\n#{e.backtrace.join("\n")}\n\n"
        renderToClient(controller)
      end
    }
    #$stderr.puts "#{@genboreePCSettings.userConfRsrcPath}/{doc}: #{#{@genboreePCSettings.userConfRsrcPath}/{doc}}"
    apiReq.get("#{@genboreePCSettings.userConfRsrcPath}/{doc}", {:doc => @currRmUser.login})
  end

end
