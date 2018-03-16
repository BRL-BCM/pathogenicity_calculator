# Common Helper module for Genboree EVB NMT plugin.

require 'brl/util/util'
require 'brl/genboree/kb/kbDoc'
require 'brl/genboree/kb/producers/abstractTemplateProducer'
require 'brl/genboree/kb/converters/nestedTabbedModelConverter'

module GenboreePathoCalcHelper
  include GenericHelpers::BeforeFiltersHelper
  include PluginHelpers::BeforeFiltersHelper
  extend  PluginHelpers::BeforeFiltersHelper  # so also available as "class" method when doing settings
  include ProjectHelpers::BeforeFiltersHelper
  include PluginHelpers::PluginSettingsHelper
  extend  PluginHelpers::PluginSettingsHelper  # so also available as "class" method when doing settings
  include KbHelpers::KbProjectHelper
  NON_CODING_VARIANT_TEXT = "Non-Coding"
  NON_ACMG_SUMMARY_TEXT = "Other - NON ACMG"
  
  def self.included(includingClass)
    includingClass.send(:include, GenericHelpers::PermHelper)
    includingClass.send(:include, GenericHelpers::CssHelpers)
  end

  def self.extended(extendingObj)
    extendingObj.send(:extend, GenericHelpers::PermHelper)
  end
  
  def this_page_nice_url()
    # Get Redmine mount
    kbMount = RedmineApp::Application.routes.default_scope[:path].to_s
    # @todo make this a setting
    calcMount = @settingsRec.urlMount
    # Replace static portion of request.fullpath wtih vbrMount
    backPath = request.fullpath.dup
    backPath.gsub!( /^#{kbMount}\/projects\/[^\/]+\/genboree_patho_calc/, calcMount)
    # Build back url
    backurl = "#{env["rack.url_scheme"]}://#{request.host}#{backPath}"
    # Remove the ca query param. The calculator page does a POST request when it first loads up which fails to verify the authenticity token if calculator page is directly opened from the login page (using back_url)
    #backurl.gsub!(/ca=CA\d+/, "")
    $stderr.debugPuts(__FILE__, __method__, 'DEBUG', "backurl: #{backurl.inspect}")
    return backurl
  end
  
  def check_access_type
    $stderr.debugPuts(__FILE__, __method__, 'DEBUG', "params: #{params.inspect}")
    #accept_api_auth :assertion_summary if(params.key?('key'))
  end
  
  def loadACMGAssertions()
    @assertions2Label = JSON.parse(File.read(Rails.root.join("plugins", "genboree_patho_calc", "config", "data_tmp", "acmg_assertions.json")))
    @assertions = @assertions2Label.keys.sort
    @assertions << "Non ACMG"
    @assertions2Label["Non ACMG"] = "Non ACMG"
  end
  
  
  PLUGIN_SETTINGS_MODEL_CLASS = GenboreePathoCalc
  PLUGIN_PROJ_SETTINGS_FIELDS = [
    :alleleRegAddress,
    :userConfHost,
    :userConfRsrcPath,
    :headerFilePath,
    :footerFilePath,
    :alleleRptDownloadEnabled,
    :alleleRptModelFile,
    :alleleRptTemplatesDir,
    :alleleRptAssetBaseDir,
    :urlMount
  ]

  # Leverage existing rails functionality for 404 in a simple way.
  # * Useful because it will also interrupt your code processing while triggering rails handling
  # * Because this raises an exception, it _interrupts_ your code/processing immediately, and
  #   activates Rails' handling. This makes it better for writing controllers and such than other
  #   404 techniques (e.g. it's better than render_404 because of this)
  def notFound()
    raise ActionController::RoutingError.new('Not Found')
  end

 
  def genboreePathoCalcSettings()
    field, @genboreePCSettings = find_settings()
  end
  
  def getCAIDSubjectUrl(caids)
    retVal = []
    alleleRegURI = ""
    if(@settingsRec.alleleRegAddress =~ /^http/)
      alleleRegURIObj = URI.parse(@settingsRec.alleleRegAddress)
      alleleRegURI = alleleRegURIObj.host
    else
      alleleRegURI = @settingsRec.alleleRegAddress
    end
    caids.each { |caid|
      # Always stored as 'http' in doc
      retVal << "http://#{alleleRegURI.chomp("/")}/allele/#{caid}"
    }
    return retVal
  end
  
  # The 2 requests (one to Evidence collection and ther other to the allele registry) in this method are done parallelly to maximize speed
  def getVariantInfo(evidenceColl, caids, evDocs=nil)
    #$stderr.debugPuts(__FILE__, __method__, "STATUS", "Received evidence coll: #{evidenceColl.inspect} and caids")
    @retrievedInfoFromEvCollAndRegistry = 0 
    @evDocs = evDocs
    evidenceCollUriObj = nil
    @errorStr = "Unknown Error"
    # Initialize the request to the Evidence collection(s) to get the variants of interest (if not provided by the calling function). Since this is going through all the evidence collections that are in a user's source registry, we may end up with multiple evidence documents for the same variant. This is fine as we want to present all interpretations for a variant.
    if(@evDocs.nil?)
      @evDocs = []
      evidenceColl = [evidenceColl] unless(evidenceColl.is_a?(Array))
      @evCounter = 0
      @reqObjs = []
      evidenceColl.each { |evColl|
        evidenceCollUriObj = URI.parse(evColl)
        apiReq = GbApi::JsonAsyncApiRequester.new(env, evidenceCollUriObj.host, nil)
        apiReq.bodyFinish { |cc|
          
          #$stderr.debugPuts(__FILE__, __method__, "STATUS", "apiReq.object_id: #{apiReq.object_id}")
          respStatus = apiReq.respStatus
          if(respStatus >= 200 and respStatus < 400)
            apiReq.respBody['data'].each { |evd|
              @evDocs << evd  
            }
            @evCounter += 1
            if(@evCounter == evidenceColl.size)
              @retrievedInfoFromEvCollAndRegistry += 1
              if(@retrievedInfoFromEvCollAndRegistry == 2)
                if(@evDocs and @alleleRegRespObj)
                  constructRespObjForVariants(caids)
                else
                  renderToClient(self, :error, 500)
                end
              end
            end
          else
            @errorStr = JSON.generate(apiReq.respBody)
            renderToClient(self, :error, @errorStr)
          end
        }
        mv = getCAIDSubjectUrl(caids)
        fieldMap = {:vf => "Allele evidence.Subject,Allele evidence.Subject.Evidence Tags.Evidence Tag.Tag,Allele evidence.Subject.FinalCall", :mp => "Allele evidence.Subject", :mv => mv.join(",")}
        $stderr.debugPuts(__FILE__, __method__, "STATUS", "Making request at #{evidenceCollUriObj.path.chomp("/")}/docs?detailed=true&viewFields={vf}&matchProp={mp}&matchValues={mv} with #{fieldMap.inspect}")
        apiReq.get("#{evidenceCollUriObj.path.chomp("/")}/docs?detailed=true&viewFields={vf}&matchProp={mp}&matchValues={mv}", fieldMap)
        @reqObjs << apiReq
      }
    else
      @retrievedInfoFromEvCollAndRegistry = 1
    end
    # Initialize the request to the Allele Registry (remote) to get the variants of interet
    apiReq2 = GbApi::SimpleAsyncApiRequester.new(env, @settingsRec.alleleRegAddress, nil)
    apiReq2.nonGbApiTargetHost = true
    @alleleRegResp = ""
    @alleleRegRespObj = nil
    apiReq2.respCallback { |array|
      begin
        array[2].each { |buff|
          @alleleRegResp << buff  
        }
      rescue => e
        $stderr.debugPuts(__FILE__, __method__, "ERROR", "ERROR - #{__method__}() => Exception! #{e.class} - #{e.message}\n#{e.backtrace.join("\n")}\n\n")
        @errorStr = e.message
      end
    }
    apiReq2.bodyFinish {
      begin
        @alleleRegRespObj = JSON.parse(@alleleRegResp)
      rescue => e
        $stderr.debugPuts(__FILE__, __method__, "ERROR", "ERROR - #{__method__}() => Exception! #{e.class} - #{e.message}\n#{e.backtrace.join("\n")}\n\n")
        @alleleRegRespObj = nil
        @errorStr = e.message
      end
      @retrievedInfoFromEvCollAndRegistry += 1
      if(@retrievedInfoFromEvCollAndRegistry == 2)
        if(@evDocs and @alleleRegRespObj)
          constructRespObjForVariants(caids)
        else
          renderToClient(self, :error, 500)
        end
      end
    }
    rsrcPath = "/alleles.json?file=CA&fields=none+@id+genomicAlleles.hgvs+transcriptAlleles.hgvs+transcriptAlleles.geneSymbol+transcriptAlleles.proteinEffect.hgvs+externalRecords"
    apiReq2.post(rsrcPath, {}, caids.join("\n"))
  end
  
  def constructRespObjForVariants(caids)
    @evLookup = {}
    @alleleRecs = []
    #$stderr.debugPuts(__FILE__, __method__, "STATUS", "@evDocs: #{@evDocs.inspect}")
    begin
      @evDocs.each { |evd|
        evDoc = BRL::Genboree::KB::KbDoc.new(evd)
        subject = evDoc.getPropVal("Allele evidence.Subject")
        ca = subject.split("/").last
        # TEST CASE (remove later!): CA has a minimum of 6 digits after CA. Even if what we stored in the Evidences collection for some reason does not have the 6 digits (which in most real cases will not be true since we will ensure the correct thing is saved), make sure it does have by adding 0s in the front since this is what the allele registry returns. For example, if we queried for CA100, we would get back CA000100 in the response
        caWithoutCA = ca.gsub(/^CA/, "")
        if(caWithoutCA.size < 6)
          extraZeros = 6 - caWithoutCA.size
          ca = "CA"+("0"*extraZeros)+caWithoutCA
        end
        if(@evLookup.key?(ca))
          @evLookup[ca] << evDoc  
        else
          @evLookup[ca] = [evDoc]
        end
      }
      #$stderr.puts "@alleleRegRespObj.size: #{@alleleRegRespObj.size}"
      idx = 0
      # The response from the allele registry is always in the same order as the input
      @alleleRegRespObj.each { |alleleInfoObj|
        if(alleleInfoObj.key?("@id"))
          #$stderr.puts "alleleInfoObj: #{alleleInfoObj.inspect}"
          id = alleleInfoObj["@id"].split("/").last
          gene = {}
          hgvs = []
          externalLinks = {}
          if(alleleInfoObj.key?("externalRecords"))
            externalLinks = alleleInfoObj["externalRecords"]
          end
          if(alleleInfoObj.key?("transcriptAlleles"))
            tas = alleleInfoObj["transcriptAlleles"]
            tas.each { |ta|
              if(ta.key?("geneSymbol"))
                gene[ta["geneSymbol"]] = nil
              end
              proEffect = nil
              if(ta.key?("proteinEffect"))
                proEffect = ta["proteinEffect"]["hgvs"]
              end
              if(ta.key?("hgvs"))
                hgvsObj = {}
                ta["hgvs"].each { |ee|
                  hgvsObj["hgvs"] = ee
                  hgvsObj["proteinEffect"] = proEffect if(proEffect)
                  hgvsObj["Type"] = "transcriptAlleles"
                  hgvs << hgvsObj
                }
              else
                next
              end
            }
          end
          if(alleleInfoObj.key?("genomicAlleles"))
            gas = alleleInfoObj["genomicAlleles"]
            gas.each { |ga|
              if(ga.key?("hgvs"))
                ga["hgvs"].each { |ee|
                  hgvs << { "hgvs" => ee, "Type" => "genomicAlleles"}
                }
              end
            }
          end
          evDocs = @evLookup[id]
          assertions = []
          if(evDocs)
            evDocs.each { |evDoc|
              assertion, tags = getAssertionAndTagsFromEvDoc(evDoc)
              assertions << { "assertion" => assertion, "tags" => tags }
            }
          else
            assertions << {"assertion" => "Undetermined", "tags" => []}
          end
          @alleleRecs << { :id => id, :externalLinks => externalLinks, :gene => gene.keys.join("/"), :hgvsDescription => hgvs, :assertions => assertions  }
        else
          ca = caids[idx]
          caWithoutCA = ca.gsub(/^CA/, "")
          if(caWithoutCA.size < 6)
            extraZeros = 6 - caWithoutCA.size
            ca = "CA"+("0"*extraZeros)+caWithoutCA
          end
          evDocs = @evLookup[ca]
          assertions = []
          if(evDocs)
            evDocs.each { |evDoc|
              assertion, tags = getAssertionAndTagsFromEvDoc(evDoc)
              assertions << { "assertion" => assertion, "tags" => tags }
            }
          else
            assertions << {"assertion" => "Undetermined", "tags" => []}
          end
          @alleleRecs << { :id => ca, :externalLinks => {}, :gene => "", :hgvsDescription => [], :assertions => assertions  }
        end
        idx += 1
      }
      renderToClient(self)
    rescue => e
      $stderr.debugPuts(__FILE__, __method__, "ERROR", "ERROR - #{__method__}() => Exception! #{e.class} - #{e.message}\n#{e.backtrace.join("\n")}\n\n")
      @alleleRegRespObj = nil
      @errorStr = e.message
      renderToClient(self, :error, 500)
    end
  end
  
  def getAssertionAndTagsFromEvDoc(evDoc)
    tags = []
    assertion = evDoc.getPropVal("Allele evidence.Subject.FinalCall")
    subjectProps = evDoc.getPropProperties("Allele evidence.Subject")
    if(subjectProps.key?("Evidence Tags"))
      tagitems = evDoc.getPropItems("Allele evidence.Subject.Evidence Tags")
      if(tagitems)
        tagitems.each { |tagitem|
          tagDoc = BRL::Genboree::KB::KbDoc.new(tagitem)
          tags << tagDoc.getPropVal("Evidence Tag.Tag") 
        }
      end
    end
    if(assertion.nil? or assertion.empty?)
      assertion = "Undetermined"
    end
    return [assertion, tags]
  end
  
  def getEvidenceCollUriFromConfig(gridDisplayName=nil, &blk)
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
              eviSources.each { |eviSource|
                eviSourceDoc = BRL::Genboree::KB::KbDoc.new(eviSource)
                @evidenceColl = eviSourceDoc.getPropVal("EvidenceSource.Evidence")
                if(gridDisplayName)
                  guidelineItems = eviSourceDoc.getPropItems("EvidenceSource.Guidelines")
                  raise "Guidelines missing!" if(guidelineItems.nil? or guidelineItems.empty?)
                  matchedGridName = false
                  guidelineItems.each { |gg|
                    guidelineDoc =  BRL::Genboree::KB::KbDoc.new(gg)
                    guidelineDisplay = guidelineDoc.getPropVal("Guideline.displayName")
                    if(guidelineDisplay == gridDisplayName)
                      matchedGridName = true
                      break
                    end
                  }
                  if(matchedGridName)
                    $stderr.debugPuts(__FILE__, __method__, "STATUS", "gridDisplayName: #{gridDisplayName} matched display name for evidence source: #{@evidenceColl}. ")
                    break
                  else
                    $stderr.debugPuts(__FILE__, __method__, "STATUS", "gridDisplayName: #{gridDisplayName} did not match display name for evidence source: #{@evidenceColl}. Trying next evidence source.")
                  end
                else
                  break
                end
              }
              URI.parse(@evidenceColl)
              blk.call(@evidenceColl)
            rescue => e
              $stderr.debugPuts(__FILE__, __method__, "ERROR", "ERROR - #{__method__}() => Exception! #{e.class} - #{e.message}\n#{e.backtrace.join("\n")}\n\n")
              @errorStr = e.message
              renderToClient(self, :error, 500)
            end
          }
          apiReq2.get("#{@evSourceCollUrlObj.path.chomp("/")}/docs?detailed=true", { })
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
  
  def getEvidenceCollsUrisFromConfig( &blk)
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
              evidenceColls = []
              eviSources.each { |eviSource|
                eviSourceDoc = BRL::Genboree::KB::KbDoc.new(eviSource)
                evidenceColls << eviSourceDoc.getPropVal("EvidenceSource.Evidence")
              }
              blk.call(evidenceColls)
            rescue => e
              $stderr.debugPuts(__FILE__, __method__, "ERROR", "ERROR - #{__method__}() => Exception! #{e.class} - #{e.message}\n#{e.backtrace.join("\n")}\n\n")
              @errorStr = e.message
              renderToClient(self, :error, 500)
            end
          }
          apiReq2.get("#{@evSourceCollUrlObj.path.chomp("/")}/docs?detailed=true", { })
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
  
  
  def getGeneSummaryCollUriFromConfig(&blk)
    apiReq = GbApi::JsonAsyncApiRequester.new(env, @settingsRec.userConfHost, nil)
    @errMsg = ""
    apiReq.bodyFinish {
      begin
        if(apiReq.respStatus >= 200 and apiReq.respStatus < 400)
          kbd = BRL::Genboree::KB::KbDoc.new(apiReq.respBody['data'])
          geneSummaryColl = kbd.getPropVal("Configuration.GeneSummary") rescue nil
          URI.parse(geneSummaryColl)
          blk.call(geneSummaryColl)
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
  
end
