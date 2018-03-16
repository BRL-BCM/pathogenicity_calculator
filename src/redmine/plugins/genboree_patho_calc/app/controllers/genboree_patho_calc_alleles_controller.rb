class GenboreePathoCalcAllelesController < ApplicationController  
  include GenboreePathoCalcHelper
  include GbMixin::AsyncRenderHelper
  unloadable
  layout false
  
  before_filter :find_project, :find_settings
  respond_to :json, :html
  
  accept_api_auth :recent_activity, :allele, :update_evidence_assertion

  def allele
    initRackEnv( env )
    @caid = params["allele"]
    # Specifically search
    getEvidenceCollsUrisFromConfig(){ |evidenceColls|
      @evidenceCollsWithAllele = []
      @evidenceCollsQueried = 0
      evDocs = []
      evidenceColls.each { |evidenceColl|
        @evidenceCollUriObj = URI.parse(evidenceColl)
        apiReq2 = GbApi::JsonAsyncApiRequester.new(env, @evidenceCollUriObj.host, nil)
        
        apiReq2.bodyFinish {
          begin
            headers = apiReq2.respHeaders
            status = apiReq2.respStatus
            headers['Content-Type'] = "text/plain"
            @evidenceCollsQueried += 1
            if(!apiReq2.respBody['data'].empty?)
              $stderr.debugPuts(__FILE__, __method__, "DEBUG", "apiReq2.object_id: #{apiReq2.object_id}")
              apiReq2.respBody['data'].each { |evd|
                evDocs << evd  
              }
              #$stderr.debugPuts(__FILE__, __method__, "DEBUG", "@evDocs: #{@evDocs.inspect}")
              @evidenceCollsWithAllele << evidenceColl
              #getVariantInfo(evidenceColl, [@caid], evDocs)
            end
            if(@evidenceCollsQueried == evidenceColls.size)
              if(@evidenceCollsWithAllele.empty?)
                @errorStr = "No doc found with id: #{@caid.inspect}"
                renderToClient(self, :error, 404)
              else
                getVariantInfo(@evidenceCollsWithAllele, [@caid], evDocs)
              end
            end
          rescue => e
            $stderr.debugPuts(__FILE__, __method__, "ERROR", "ERROR - #{__method__}() => Exception! #{e.class} - #{e.message}\n#{e.backtrace.join("\n")}\n\n")
            @errorStr = e.message
            renderToClient(self, :error, 500)
          end
        }
        caids = [@caid]
        subjUrls = getCAIDSubjectUrl(caids)
        $stderr.debugPuts(__FILE__, __method__, "DEBUG", "#{@evidenceCollUriObj.path.chomp("/")}/docs?detailed=true&matchValues={mv}&matchProp={mp} with #{subjUrls.join(",")} and Allele evidence.Subject")
        apiReq2.get("#{@evidenceCollUriObj.path.chomp("/")}/docs?detailed=true&matchValues={mv}&matchProp={mp}", {:mv => subjUrls.join(","), :mp => "Allele evidence.Subject" })
      }
    }
  end
  
  

  def recent_activity()
    initRackEnv( env )
    controller = self
    @alleleRecs = []
    @ndocs = (params.key?("ndocs") ? params["ndocs"] : 3 )
    
    apiReq = GbApi::JsonAsyncApiRequester.new(env, @settingsRec.userConfHost, nil)
    @errMsg = ""
    apiReq.bodyFinish {
      begin
        if(apiReq.respStatus >= 200 and apiReq.respStatus < 400)
          kbd = BRL::Genboree::KB::KbDoc.new(apiReq.respBody['data'])
          @evSourceColl = kbd.getPropVal("Configuration.EvidenceSource") rescue nil
          @evSourceCollUrlObj = URI.parse(@evSourceColl)
          apiReq2 = GbApi::JsonAsyncApiRequester.new(env, @evSourceCollUrlObj.host, nil)
          apiReq2.bodyFinish {
            begin
              headers = apiReq2.respHeaders
              status = apiReq2.respStatus
              headers['Content-Type'] = "text/plain"
              srDoc = BRL::Genboree::KB::KbDoc.new(apiReq2.respBody['data'][0])
              eviSources = srDoc.getPropItems("SourceRegistry.EvidenceSources")
              evidenceColl = nil
              @evidenceColls = []
              # @todo go through all evidence sources. Not just the first one
              eviSources.each { |eviSource|
                eviSourceDoc = BRL::Genboree::KB::KbDoc.new(eviSource)
                @evidenceColls << eviSourceDoc.getPropVal("EvidenceSource.Evidence")
              }
              # Get the last edited variants from the user's collection
              @evidenceCollUriObj = URI.parse(@evidenceColls[0])
              apiReq3 = GbApi::JsonAsyncApiRequester.new(env, @evidenceCollUriObj.host, nil)
              apiReq3.bodyFinish {
                begin
                  headers = apiReq3.respHeaders
                  status = apiReq3.respStatus
                  headers['Content-Type'] = "text/plain"
                  respObj = apiReq3.respBody
                  if(respObj.key?("data") and respObj["data"].key?("lastNEditedDocs") and respObj["data"]["lastNEditedDocs"]["value"].size > 0)
                    docIds = []
                    respObj["data"]["lastNEditedDocs"]["value"].each { |docObj|
                      docIds << docObj["docId"]  
                    }
                    apiReq4 = GbApi::JsonAsyncApiRequester.new(env, @evidenceCollUriObj.host, nil)
                    apiReq4.bodyFinish {
                      begin
                        headers = apiReq4.respHeaders
                        status = apiReq4.respStatus
                        headers['Content-Type'] = "text/plain"
                        evDocs = apiReq4.respBody['data']
                        caids = []
                        $stderr.debugPuts(__FILE__, __method__, "DEBUG", "evDocs:\n#{evDocs.inspect}")
                        evDocs.each { |evDoc|
                          kbEvDoc = BRL::Genboree::KB::KbDoc.new(evDoc)
                          caids << kbEvDoc.getPropVal("Allele evidence.Subject").split("/").last
                        }
                        getVariantInfo(@evidenceColls, caids)
                      rescue => e
                        $stderr.debugPuts(__FILE__, __method__, "ERROR", "ERROR - #{__method__}() => Exception! #{e.class} - #{e.message}\n#{e.backtrace.join("\n")}\n\n")
                        @errorStr = e.message
                        renderToClient(self, :error, 500)
                      end
                    }
                    $stderr.debugPuts(__FILE__, __method__, "DEBUG", "Making request to #{@evidenceCollUriObj.path.chomp("/")}/docs?detailed=true&matchValues={mv} with #{docIds.join(",")}")
                    apiReq4.get("#{@evidenceCollUriObj.path.chomp("/")}/docs?detailed=true&matchValues={mv}", {:mv => docIds.join(",") })
                  else
                    renderToClient(controller)
                  end
                rescue => e
                  $stderr.debugPuts(__FILE__, __method__, "ERROR", "ERROR - #{__method__}() => Exception! #{e.class} - #{e.message}\n#{e.backtrace.join("\n")}\n\n")
                  @errorStr = e.message
                  renderToClient(self, :error, 500)
                end
              }
              $stderr.debugPuts(__FILE__, __method__, "DEBUG", "Making request to #{@evidenceCollUriObj.path.chomp("/")}/stat/lastNEditedDocs?ndocs={ndocs} with ndocs=#{@ndocs}")
              apiReq3.get("#{@evidenceCollUriObj.path.chomp("/")}/stat/lastNEditedDocs?ndocs={ndocs}", {:ndocs => @ndocs})
            rescue => e
              $stderr.debugPuts(__FILE__, __method__, "ERROR", "ERROR - #{__method__}() => Exception! #{e.class} - #{e.message}\n#{e.backtrace.join("\n")}\n\n")
              @errorStr = e.message
              renderToClient(self, :error, 500)
            end
          }
          apiReq2.get("#{@evSourceCollUrlObj.path.chomp("/")}/docs?detailed=true", {  })
        else
          @errorStr = "Configuration file missing/inaccessible for user: #{@currRmUser} (#{@currRmUser.login}). Please contact the project manager to resolve the issue."  
          renderToClient(controller, :error, 404)
        end
      rescue => e
        $stderr.debugPuts(__FILE__, __method__, "ERROR", "ERROR - #{__method__}() => Exception! #{e.class} - #{e.message}\n#{e.backtrace.join("\n")}\n\n")
        @errorStr = e.message
        renderToClient(self, :error, 500)
      end
    }
    apiReq.get("#{@settingsRec.userConfRsrcPath}/{doc}", {:doc => @currRmUser.login})
  end
  
  # @todo should parallely update multiple summary categories
  def update_assertion_summary()
    @caid = params['allele']
    @assertion = params['assertion']
    @asserType = params['type']
    initRackEnv( env )
    apiReq = GbApi::SimpleAsyncApiRequester.new(env, @settingsRec.alleleRegAddress, nil)
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
        $stderr.debugPuts(__FILE__, __method__, "ERROR", "ERROR - #{__method__}() => Exception! #{e.class} - #{e.message}\n#{e.backtrace.join("\n")}\n\n")
        @errorStr = e.message
        renderToClient(self, :error, 500)
      end
    }
    apiReq.bodyFinish {
      # Scan the response to see if an allele exists in the reigstry. It should have a well constructed canonical allele URI for the value @id
      if(@resp != "" )
        begin
          respObj = JSON.parse(@resp)
          if(respObj["@id"] == "_:CA")
            @errorStr = @resp
            renderToClient(self, :error, 404)  
          else
            #apiReq.sendToClient(@status, @headers, @resp)
            gene = {}
            if(respObj.key?("transcriptAlleles"))
              tas = respObj["transcriptAlleles"]
              tas.each { |ta|
                if(ta.key?("geneSymbol"))
                  gene[ta["geneSymbol"]] = nil
                end
              }
            end
            # check if doc exists in gene-summary
            # For variants with multiple genes, always save with gene names sorted
            @gsDocId = NON_CODING_VARIANT_TEXT
            if(gene.keys.size > 0)
              @gsDocId = gene.keys.sort.join("/")
            end
            @currentAssertion = "Absent"
            @currentAssertionType = "ACMG"
            @retrievedCurrAssertionAndGsDoc = 0
            getEvidenceCollUriFromConfig(){ |evidenceColl|
              evidenceCollUriObj = URI.parse(evidenceColl)
              apiReq3 = GbApi::JsonAsyncApiRequester.new(env, evidenceCollUriObj.host, nil)
              apiReq3.bodyFinish {
                begin
                  respStatus = apiReq3.respStatus
                  if(respStatus >= 200 and respStatus < 400)
                    evDoc = BRL::Genboree::KB::KbDoc.new(apiReq3.respBody["data"][0])
                    $stderr.debugPuts(__FILE__, __method__, "DEBUG", "evDoc: #{evDoc.inspect}")
                    evDocProps = evDoc.getPropProperties("Allele evidence.Subject")
                    if(evDocProps.key?("FinalCall"))
                      @currentAssertion = evDoc.getPropVal("Allele evidence.Subject.FinalCall")
                    end
                    if(evDocProps.key?("Type"))
                      @currentAssertionType = evDoc.getPropVal("Allele evidence.Subject.Type")
                    end
                  end
                  @retrievedCurrAssertionAndGsDoc += 1
                  if(@retrievedCurrAssertionAndGsDoc == 2)
                    update_asser_for_variant_under_gene()  
                  end
                rescue => e
                  $stderr.debugPuts(__FILE__, __method__, "ERROR", "ERROR - #{__method__}() => Exception! #{e.class} - #{e.message}\n#{e.backtrace.join("\n")}\n\n")
                  @errorStr = e.message
                  renderToClient(self, :error, 500) 
                end
              }
              caids = [@caid]
              # @todo remove this hack after testing
              # The test database stores incorrect CAIDs. All CAIDs have at least 6 digits after 'CA'
              if(@caid.gsub(/^CA/, "") =~ /^0/)
                caids << "CA#{@caid.gsub(/^CA/, "").to_i}"
              end
              subjects = getCAIDSubjectUrl(caids)
              fm = {:mp => "Allele evidence.Subject", :mv => subjects.join(",")}
              $stderr.debugPuts(__FILE__, __method__, "DEBUG", "Making reqest at #{evidenceCollUriObj.path.chomp("/")}/docs?detailed=true&matchValues={mv}&matchProp={mp} with #{fm.inspect}")
              apiReq3.get("#{evidenceCollUriObj.path.chomp("/")}/docs?detailed=true&matchValues={mv}&matchProp={mp}", fm)
            }
            getGeneSummaryCollUriFromConfig() { |geneSummaryColl|
              geneSummaryUriObj = URI.parse(geneSummaryColl)
              @geneSummaryUriObj = geneSummaryUriObj
              apiReq2 = GbApi::JsonAsyncApiRequester.new(env, geneSummaryUriObj.host, nil)
              apiReq2.bodyFinish {
                begin
                  headers = apiReq2.respHeaders
                  status = apiReq2.respStatus
                  headers['Content-Type'] = "text/plain"
                  docs = apiReq2.respBody['data']
                  @doc = (docs.empty? ? nil : BRL::Genboree::KB::KbDoc.new(docs[0]))
                  @retrievedCurrAssertionAndGsDoc += 1
                  if(@retrievedCurrAssertionAndGsDoc == 2)
                    update_asser_for_variant_under_gene()  
                  end
                rescue => e
                  $stderr.debugPuts(__FILE__, __method__, "ERROR", "ERROR - #{__method__}() => Exception! #{e.class} - #{e.message}\n#{e.backtrace.join("\n")}\n\n")
                  @errorStr = e.message
                  renderToClient(self, :error, 500) 
                end
              }
              vf = "Gene.ReasonerCalls.ReasonerCall,Gene"
              apiReq2.get("#{geneSummaryUriObj.path.chomp("/")}/docs?detailed=true&matchValues={mv}", { :mv => @gsDocId })
            }
          end
        rescue => e
          $stderr.debugPuts(__FILE__, __method__, "ERROR", "ERROR - #{__method__}() => Exception! #{e.class} - #{e.message}\n#{e.backtrace.join("\n")}\n\n")
          @errorStr = e.message
          renderToClient(self, :error, 500) 
        end
      else
        @errorStr = "Response from allele registry is empty"
        renderToClient(self, :error, 404)  
      end
    }
    #$stderr.puts "#{@settingsRec.userConfRsrcPath}/{doc}: #{#{@settingsRec.userConfRsrcPath}/{doc}}"
    rsrcPath = "/allele/{allele}"
    apiReq.get(rsrcPath, { :allele => @caid })
  end
  
  
  def update_evidence_assertion()
    @caid = params['allele']
    @assertion = params['assertion']
    @assertionType = params['type']
    @gridDisplayName = params['gridDisplayName']
    initRackEnv( env )
    getEvidenceCollUriFromConfig(@gridDisplayName) { |evidenceColl|
      evidenceCollUriObj = URI.parse(evidenceColl)
      apiReq3 = GbApi::JsonAsyncApiRequester.new(env, evidenceCollUriObj.host, nil)
      apiReq3.bodyFinish {
        begin
          respStatus = apiReq3.respStatus
          evDoc = BRL::Genboree::KB::KbDoc.new(apiReq3.respBody["data"][0])
          evDocProps = evDoc.getPropProperties("Allele evidence.Subject")
          evDocProps["FinalCall"] = { "value" => @assertion }
          asserTypeText = (@assertionType == "ACMG" ? "ACMG" : NON_ACMG_SUMMARY_TEXT)
          evDocProps["Type"] = { "value" => asserTypeText }
          apiReq4 = GbApi::JsonAsyncApiRequester.new(env, evidenceCollUriObj.host, nil)
          apiReq4.bodyFinish {
            respStatus = apiReq4.respStatus
            if(respStatus >= 200 and respStatus < 400)
              renderToClient(self)
            else
              @errorStr = JSON.generate(apiReq.respBody)
              renderToClient(self, :error, respStatus) 
            end
          }
          docId = evDoc.getPropVal("Allele evidence")
          apiReq4.put("#{evidenceCollUriObj.path.chomp("/")}/doc/{doc}", {:doc => docId}, evDoc.to_json)
        rescue => e
          $stderr.debugPuts(__FILE__, __method__, "ERROR", "ERROR - #{__method__}() => Exception! #{e.class} - #{e.message}\n#{e.backtrace.join("\n")}\n\n")
          @errorStr = e.message
          renderToClient(self, :error, 500) 
        end
      }
      caids = [@caid]
      # @todo remove this hack after testing
      # The test database stores incorrect CAIDs. All CAIDs have at least 6 digits after 'CA'
      if(@caid.gsub(/^CA/, "") =~ /^0/)
        caids << "CA#{@caid.gsub(/^CA/, "").to_i}"
      end
      subjects = getCAIDSubjectUrl(caids)
      $stderr.debugPuts(__FILE__, __method__, "DEBUG", "Making request at #{evidenceCollUriObj.path.chomp("/")}/docs?detailed=true&matchValues={mv} with #{subjects.join(",")}")
      
      apiReq3.get("#{evidenceCollUriObj.path.chomp("/")}/docs?detailed=true&matchValues={mv}&matchProp={mp}", {:mv => subjects.join(","), :mp => "Allele evidence.Subject" })  
    }
  end
  
  # Helpers
  def update_asser_for_variant_under_gene()
    if(@doc) # Gene Summary doc is present. 
      if((@currentAssertionType == NON_ACMG_SUMMARY_TEXT and @asserType == NON_ACMG_SUMMARY_TEXT))
        # If the variant is previously under 'Non ACMG', and the  newer assertion is also under NON ACMG, then there is no need to update the summary since we group all NON ACMG assertions under one category
        renderToClient(self)
      else
        add_variant_to_new_assertion()
      end
    else # Doc does not exist. Create new
      gsDoc = {
        "Gene" => {
          "value" => @gsDocId,
          "properties" => {
            "ReasonerCalls" => {
              "items" => [
                {
                  "ReasonerCall" => {
                    "value" => @assertion,
                    "properties" => {
                      "Type" => { "value" => @asserType },
                      "CAIDs" => {
                        "value" => 1,
                        "items" => [
                          {
                            "CAID" => { "value" => @caid }  
                          }
                        ]
                      }
                    }
                  }
                }
              ]
            }
          }
        }
      }
      apiReq3 = GbApi::JsonAsyncApiRequester.new(env, @geneSummaryUriObj.host, nil)
      apiReq3.bodyFinish {
        begin
          respStatus = apiReq3.respStatus
          if(respStatus >= 200 and respStatus < 400)
            @respObj = apiReq3.respBody
            renderToClient(self, :update_assertion_summary)
          else
            @errorStr = JSON.generate(apiReq.respBody)
            renderToClient(self, :error, respStatus) 
          end
        rescue => e
          $stderr.debugPuts(__FILE__, __method__, "ERROR", "ERROR - #{__method__}() => Exception! #{e.class} - #{e.message}\n#{e.backtrace.join("\n")}\n\n")
          @errorStr = e.message
          renderToClient(self, :error, 500) 
        end
      }
      apiReq3.put("#{@geneSummaryUriObj.path.chomp("/")}/doc/{doc}", {:doc => @gsDocId}, JSON.generate(gsDoc))
    end
  end
  
  
  def add_variant_to_new_assertion()
    # Is the assertion present for some other variant?
    rcalls = @doc.getPropItems("Gene.ReasonerCalls")
    #$stderr.debugPuts(__FILE__, __method__, "DEBUG", "@doc: #{JSON.pretty_generate(@doc)}")
    assertionPresent = false
    asserText = (@asserType == "ACMG" ? @assertion : NON_ACMG_SUMMARY_TEXT )
    currAsserText = (@currentAssertionType == "ACMG" ? @currentAssertion : NON_ACMG_SUMMARY_TEXT )
    if(@asserType == "ACMG" and @currentAssertionType == "ACMG" and asserText == currAsserText)
      @respObj = { "data" => {}, "status" => {"statusCode" => 200, "msg" => "OK"} }
      renderToClient(self, :update_assertion_summary)
    else
      numCAIDsUnderAssertion = 0
      rcalls.each { |rcall|
        rcallDoc = BRL::Genboree::KB::KbDoc.new(rcall)
        if(rcallDoc.getPropVal("ReasonerCall") == asserText)
          assertionPresent = true
          numCAIDsUnderAssertion = rcallDoc.getPropVal("ReasonerCall.CAIDs")
        end
      }
      varPropPath = "Gene.ReasonerCalls.[].ReasonerCall.{\"#{currAsserText}\"}.CAIDs.[].CAID.{\"#{@caid}\"}"
      # Delete the variant from the 'current' assertion
      apiReq3 = GbApi::JsonAsyncApiRequester.new(env, @geneSummaryUriObj.host, nil)
      apiReq3.bodyFinish {
        #$stderr.debugPuts(__FILE__, __method__, "DEBUG", "Response: #{apiReq3.respBody.inspect}")
        # Finally add the variant under the new assertion
        asserTypeText = (@asserType == "ACMG" ? "ACMG" : NON_ACMG_SUMMARY_TEXT)
        propPath = nil
        payload = nil
        if(assertionPresent)
          $stderr.debugPuts(__FILE__, __method__, "DEBUG", "Assertion present")
          if(numCAIDsUnderAssertion > 0)
            payload = { "value" => @caid }
            propPath = "Gene.ReasonerCalls.[].ReasonerCall.{\"#{asserText}\"}.CAIDs.[].CAID.{\"#{@caid}\"}"
          else
            payload = { "items" => [ "CAID" => { "value" => @caid } ], "value" => 0 }
            propPath = "Gene.ReasonerCalls.[].ReasonerCall.{\"#{asserText}\"}.CAIDs"
          end
        else
          $stderr.debugPuts(__FILE__, __method__, "DEBUG", "Assertion absent")
          propPath = "Gene.ReasonerCalls.[LAST]"
          payload =  { "ReasonerCall" => { "value" => asserText, "properties" => { "Type" => {"value" => asserTypeText }, "CAIDs" => { "items" => [ {"CAID" => { "value" => @caid } } ] } } } }
        end
        apiReq4 = GbApi::JsonAsyncApiRequester.new(env, @geneSummaryUriObj.host, nil)
        apiReq4.bodyFinish {
          begin
            respStatus = apiReq4.respStatus
            if(respStatus >= 200 and respStatus < 400)
              @respObj = apiReq4.respBody
              renderToClient(self, :update_assertion_summary)
            else
              @errorStr = JSON.generate(apiReq4.respBody)
              renderToClient(self, :error, respStatus) 
            end
          rescue => e
            $stderr.debugPuts(__FILE__, __method__, "ERROR", "ERROR - #{__method__}() => Exception! #{e.class} - #{e.message}\n#{e.backtrace.join("\n")}\n\n")
            @errorStr = e.message
            renderToClient(self, :error, 500) 
          end
        }
        apiReq4.put("#{@geneSummaryUriObj.path.chomp("/")}/doc/{doc}/prop/{prop}", {:doc => @gsDocId, :prop => propPath }, JSON.generate(payload))
      }
      $stderr.debugPuts(__FILE__, __method__, "DEBUG", "Deleting #{@geneSummaryUriObj.path.chomp("/")}/doc/{doc}/prop/{prop} with #{@gsDocId} and #{varPropPath}")
      apiReq3.delete("#{@geneSummaryUriObj.path.chomp("/")}/doc/{doc}/prop/{prop}", {:doc => @gsDocId, :prop => varPropPath })
      
      payload = nil
    end
    
    
  end
  

end
