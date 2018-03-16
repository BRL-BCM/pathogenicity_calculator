class GenboreePathoCalcUiCalculatorController < ApplicationController  
  include GenboreePathoCalcHelper
  include GbMixin::AsyncRenderHelper
  unloadable
  
  before_filter :find_project, :find_settings, :genboreePathoCalcSettings, :authorize_via_perms_only
  layout 'patho_calc_main'

  def show()
    # Get the config doc for the logged in user
      
    apiReq = GbApi::JsonAsyncApiRequester.new(env, @genboreePCSettings.userConfHost, nil)
    initRackEnv( env ) 
    controller = self
    @errMsg = ""
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
          @nonCodingVariantText = NON_CODING_VARIANT_TEXT
          renderToClient(controller)
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
