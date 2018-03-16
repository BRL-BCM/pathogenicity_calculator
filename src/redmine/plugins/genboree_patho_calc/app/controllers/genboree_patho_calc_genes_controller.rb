class GenboreePathoCalcGenesController < ApplicationController  
  include GenboreePathoCalcHelper
  include GbMixin::AsyncRenderHelper
  unloadable
  layout false
  
  before_filter :find_project, :find_settings, :genboreePathoCalcSettings
  respond_to :json, :html
  
  accept_api_auth :assertion_summary, :variants_for_gene_and_assertion

  def assertion_summary()
    # If Gene Summary URI (UI) has been provided, we can quickly get it. Otherwise (say in a API request), we get the config doc for the user and extract Gene Summary URI from there
    @skip = (params.key?('skip') ? params['skip'].to_i : 0 )
    @limit = (params.key?('limit') ? params['limit'].to_i : 10 )
    initRackEnv( env )
    controller = self
    if( params.key?("geneSummaryURI") )
      geneSummaryUriObj = URI.parse(params["geneSummaryURI"])
      apiReq2 = GbApi::JsonAsyncApiRequester.new(env, geneSummaryUriObj.host, nil)
      apiReq2.bodyFinish {
        headers = apiReq2.respHeaders
        status = apiReq2.respStatus
        headers['Content-Type'] = "text/plain"
        @geneAsserSummary = JSON.generate(apiReq2.respBody)
        renderToClient(controller)
      }
      apiReq2.get("#{geneSummaryUriObj.path.chomp("/")}/docs?detailed=true&skip={skip}&limit={lim}&viewFields={vf}", {:vf => "Gene.ReasonerCalls.ReasonerCall.Type, Gene.ReasonerCalls.ReasonerCall.CAIDs,Gene.ReasonerCalls.ReasonerCall,Gene", :skip => @skip, :lim => @limit})
    else # Get the config doc for the  user
      apiReq = GbApi::JsonAsyncApiRequester.new(env, @settingsRec.userConfHost, nil)
      @errMsg = ""
      apiReq.bodyFinish {
        begin
          if(apiReq.respStatus >= 200 and apiReq.respStatus < 400)
            kbd = BRL::Genboree::KB::KbDoc.new(apiReq.respBody['data'])
            $stderr.puts "config doc:\n#{JSON.pretty_generate(kbd)}"
            @geneSummaryColl = kbd.getPropVal("Configuration.GeneSummary") rescue nil
            # Get the number of docs in the gene summary collection
            geneSummaryUriObj = URI.parse(@geneSummaryColl)
            apiReq2 = GbApi::JsonAsyncApiRequester.new(env, geneSummaryUriObj.host, nil)
            apiReq2.bodyFinish {
              headers = apiReq2.respHeaders
              status = apiReq2.respStatus
              headers['Content-Type'] = "text/plain"
              @geneAsserSummary = JSON.generate(apiReq2.respBody)
              renderToClient(controller)
            }
            apiReq2.get("#{geneSummaryUriObj.path.chomp("/")}/docs?detailed=true&skip={skip}&limit={lim}&viewFields={vf}", { :vf => "Gene.ReasonerCalls.ReasonerCall.Type,Gene.ReasonerCalls.ReasonerCall.CAIDs,Gene.ReasonerCalls.ReasonerCall,Gene", :skip => @skip, :lim => @limit})
          else
            @errorStr = "Configuration file missing/inaccessible for user: #{@currRmUser} (#{@currRmUser.login}). Please contact the project manager to resolve the issue."  
            renderToClient(controller, :error, 404)
          end
        rescue => e
          @errorStr = e.message
          $stderr.debugPuts(__FILE__, __method__, "ERROR", "ERROR - #{__method__}() => Exception! #{e.class} - #{e.message}\n#")
          renderToClient(controller, :error, 500)
        end
      }
      #$stderr.puts "#{@settingsRec.userConfRsrcPath}/{doc}: #{#{@settingsRec.userConfRsrcPath}/{doc}}"
      apiReq.get("#{@settingsRec.userConfRsrcPath}/{doc}", {:doc => @currRmUser.login})
    end
  end
  
  def variants_for_gene_and_assertion
    # If Gene Summary URI (UI) has been provided, we can quickly get it. Otherwise (say in a API request), we get the config doc for the user and extract Gene Summary URI from there
    @skip = (params.key?('skip') ? params['skip'].to_i : 0 )
    @limit = (params.key?('limit') ? params['limit'].to_i : 20 )
    @gene = params['gene']
    @assertion = params['assertion']
    @evidenceColls = []
    @caids = nil
    initRackEnv( env )
    controller = self
    if( params.key?("geneSummaryURI") and params.key?("evidenceCollURI") )
      geneSummaryUriObj = URI.parse(params["geneSummaryURI"])
      apiReq2 = GbApi::JsonAsyncApiRequester.new(env, geneSummaryUriObj.host, nil)
      apiReq2.bodyFinish {
        begin
          $stderr.debugPuts(__FILE__, __method__, "STATUS", "Finished request to retrieve caids")
          headers = apiReq2.respHeaders
          status = apiReq2.respStatus
          headers['Content-Type'] = "text/plain"
          caidDocs = apiReq2.respBody['data']['items']
          @caids = []
          caidDocs.each { |cadoc|
            @caids << cadoc['CAID']['value']  
          }
          getVariantInfo(params["evidenceCollURI"], @caids)
        rescue => e
          $stderr.debugPuts(__FILE__, __method__, "ERROR", "ERROR - #{__method__}() => Exception! #{e.class} - #{e.message}\n#{e.backtrace.join("\n")}\n\n")
          @alleleRegRespObj = nil
          @errorStr = e.message
          renderToClient(controller, :error, 500)
        end
      }
      apiReq2.get("#{geneSummaryUriObj.path.chomp("/")}/doc/{doc}/prop/{prop}?detailed=true&skip={skip}&limit={lim}", {  :skip => @skip, :lim => @limit, :doc => @gene, :prop => "Gene.ReasonerCalls.[].ReasonerCall.{\"#{@assertion}\"}.CAIDs"})
    else # Get the config doc for the  user
      apiReq = GbApi::JsonAsyncApiRequester.new(env, @settingsRec.userConfHost, nil)
      @errMsg = ""
      apiReq.bodyFinish {
        begin
          if(apiReq.respStatus >= 200 and apiReq.respStatus < 400)
            kbd = BRL::Genboree::KB::KbDoc.new(apiReq.respBody['data'])
            $stderr.puts "config doc:\n#{JSON.pretty_generate(kbd)}"
            @geneSummaryColl = kbd.getPropVal("Configuration.GeneSummary") rescue nil
            @evSourceColl = kbd.getPropVal("Configuration.EvidenceSource") rescue nil
            @retrievedEviCollAndGeneSummInfo = 0
            # Get the number of docs in the gene summary collection
            geneSummaryUriObj = URI.parse(@geneSummaryColl)
            apiReq2 = GbApi::JsonAsyncApiRequester.new(env, geneSummaryUriObj.host, nil)
            apiReq2.bodyFinish {
              headers = apiReq2.respHeaders
              status = apiReq2.respStatus
              headers['Content-Type'] = "text/plain"
              caidDocs = apiReq2.respBody['data']['items']
              @caids = []
              caidDocs.each { |cadoc|
                @caids << cadoc['CAID']['value']  
              }
              @retrievedEviCollAndGeneSummInfo += 1
              if(@retrievedEviCollAndGeneSummInfo == 2)
                #renderToClient(self)
                getVariantInfo(@evidenceColls, @caids)
              end
            }
            apiReq2.get("#{geneSummaryUriObj.path.chomp("/")}/doc/{doc}/prop/{prop}?detailed=true&skip={skip}&limit={lim}", {  :skip => @skip, :lim => @limit, :doc => @gene, :prop => "Gene.ReasonerCalls.[].ReasonerCall.{\"#{@assertion}\"}.CAIDs"})
            @evSourceCollUrlObj = URI.parse(@evSourceColl)
            apiReq3 = GbApi::JsonAsyncApiRequester.new(env, @evSourceCollUrlObj.host, nil)
            apiReq3.bodyFinish {
              headers = apiReq3.respHeaders
              status = apiReq3.respStatus
              headers['Content-Type'] = "text/plain"
              srDoc = BRL::Genboree::KB::KbDoc.new(apiReq3.respBody['data'][0])
              eviSources = srDoc.getPropItems("SourceRegistry.EvidenceSources")
              eviSources.each { |eviSource|
                eviSourceDoc = BRL::Genboree::KB::KbDoc.new(eviSource)
                @evidenceColls << eviSourceDoc.getPropVal("EvidenceSource.Evidence")
              }
              @retrievedEviCollAndGeneSummInfo += 1
              if(@retrievedEviCollAndGeneSummInfo == 2)
                #renderToClient(self)
                getVariantInfo(@evidenceColls, @caids)
              end
            }
            apiReq3.get("#{@evSourceCollUrlObj.path.chomp("/")}/docs?detailed=true", {  })
          else
            @errorStr = "Configuration file missing/inaccessible for user: #{@currRmUser} (#{@currRmUser.login}). Please contact the project manager to resolve the issue."  
            renderToClient(controller, :error, 404)
          end
        rescue => e
          $stderr.debugPuts(__FILE__, __method__, "ERROR", "ERROR - #{__method__}() => Exception! #{e.class} - #{e.message}\n#{e.backtrace.join("\n")}\n\n")
          @alleleRegRespObj = nil
          @errorStr = e.message
          renderToClient(self, :error, 500)
        end
      }
      #$stderr.puts "#{@settingsRec.userConfRsrcPath}/{doc}: #{#{@settingsRec.userConfRsrcPath}/{doc}}"
      apiReq.get("#{@settingsRec.userConfRsrcPath}/{doc}", {:doc => @currRmUser.login})
    end
  end

end
