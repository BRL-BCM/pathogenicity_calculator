class GenboreePathoCalcAlleleRegistryController < ApplicationController  
  include GenboreePathoCalcHelper
  include GbMixin::AsyncRenderHelper
  unloadable
  layout false
  before_filter :find_project, :find_settings
  respond_to :json, :html
  
  accept_api_auth :allele

  def allele
    hgvs = (params.key?("hgvs") ? params["hgvs"] : nil )
    apiReq = GbApi::SimpleAsyncApiRequester.new(env, @settingsRec.alleleRegAddress, nil)
    apiReq.nonGbApiTargetHost = true
    @resp = ""
    @headers = nil
    initRackEnv( env )
    @status = nil
    @errorStr = ""
    apiReq.respCallback { |array|
      begin
        @headers = array[1]
        @status = array[0]
        @headers['Content-Type'] = "text/plain"
        array[2].each { |buff|
          @resp << buff  
        }
      rescue => e
        @errorStr = e.message
        $stderr.debugPuts(__FILE__, __method__, "ERROR", "ERROR - #{__method__}() => Exception! #{e.class} - #{e.message}\n#{e.backtrace.join("\n")}\n\n")
      end
    }
    apiReq.bodyFinish {
      # Scan the response to see if an allele exists in the reigstry. It should have a well constructed canonical allele URI for the value @id
      if(@resp != "" and @status == 200  )
        begin
          respObj = JSON.parse(@resp)
          if(respObj["@id"] == "_:CA" or respObj["@id"].split("/").last =~ /^PA/)
            @errorStr = @resp
            $stderr.debugPuts(__FILE__, __method__, "ERROR", "#{@errorStr}")
            renderToClient(controller, :error, 404)
          else
            # We have found the allele in the registry
            # Check if the user has any evidences for this allele
            @alleleRegRespObj = [respObj]
            @caid = respObj["@id"].split("/").last
            getEvidenceCollsUrisFromConfig(){ |evidenceColls|
              
              caids = [@caid]
              # TEST CASE (remove later!): CAIDs have a minimum of 6 digits after CA. Although we will store the correct CAID in our evidence collection (with all 6 digits), it is possible in certain test cases, we did not and so we must make the query with and without the leading 0s
              caidWithoutCA = @caid.gsub(/^CA/, "")
              if(caidWithoutCA =~ /^0/)
                caids << "CA#{caidWithoutCA.to_i}"
              end
              getVariantInfo(evidenceColls, caids)
            }
          end
        rescue => err
          @errorStr = err.message
          renderToClient(self, :error, 500)  
        end
      else
        @errorStr = ( @errorStr != "" ? @errorStr : JSON.generate({ "msg" => "Not Found" }) )
        renderToClient(self, :error, 404)
      end
    }
    rsrcPath = "/allele"
    fieldMap = {}
    if(hgvs)
      rsrcPath << "?hgvs={term}"
      fieldMap[:term] = hgvs
    else
      rsrcPath << "/{term}"
      fieldMap[:term] = params["allele"]
    end
    apiReq.get(rsrcPath, fieldMap)
  end


  def find_by_prefix()
    # Get the config doc for the logged in user
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
      end
    }
    apiReq.bodyFinish {
      apiReq.sendToClient(@status, @headers, @resp)
    }
    #$stderr.puts "#{@settingsRec.userConfRsrcPath}/{doc}: #{#{@settingsRec.userConfRsrcPath}/{doc}}"
    apiReq.get("/alleles?namePrefix=#{params['namePrefix']}&limit=#{params['limit']}", { :usr => @currRmUser.login})
  end
  
  def find_by_id
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
      end
    }
    apiReq.bodyFinish {
      # Scan the response to see if an allele exists in the reigstry. It should have a well constructed canonical allele URI for the value @id
      $stderr.debugPuts(__FILE__, __method__, "DEBUG", "sending to client")
      if(@resp != "" )
        begin
          respObj = JSON.parse(@resp)
          if(respObj["@id"] == "_:CA")
            apiReq.sendToClient(404, @headers, "")  
          else
            apiReq.sendToClient(@status, @headers, @resp)  
          end
        rescue => err
          apiReq.sendToClient(404, @headers, "")  
        end
      else
        apiReq.sendToClient(404, @headers, "")  
      end
    }
    #$stderr.puts "#{@settingsRec.userConfRsrcPath}/{doc}: #{#{@settingsRec.userConfRsrcPath}/{doc}}"
    rsrcPath = "/allele"
    term = params['term']
    if(params.key?('hgvs'))
      rsrcPath << "?hgvs={term}"
    else
      rsrcPath << "/{term}"
    end
    apiReq.get(rsrcPath, { :term => term })
  end
  
  def find_by_gene
    apiReq = GbApi::JsonAsyncApiRequester.new(env, @settingsRec.alleleRegAddress, nil)
    apiReq.nonGbApiTargetHost = true
    @resp = ""
    @headers = nil
    @status = nil
    apiReq.bodyFinish {
      begin
        status = apiReq.respStatus
        headers = apiReq.respHeaders
        resp = apiReq.respBody
        apiReq.sendToClient(status, headers, JSON.generate(resp))
      rescue => err
        apiReq.sendToClient(500, apiReq.respHeaders, JSON.generate({}))
      end
    }
    gene = params['gene']
    rsrcPath = nil 
    if(gene =~ /GN\d+/)
      rsrcPath = "/gene/{gene}"
    else
      rsrcPath = "/gene?HGNC.symbol={gene}"
    end
    $stderr.debugPuts(__FILE__, __method__, "DEBUG", "#{rsrcPath} with #{gene}")
    apiReq.get(rsrcPath, { :gene => gene })
  end

end

