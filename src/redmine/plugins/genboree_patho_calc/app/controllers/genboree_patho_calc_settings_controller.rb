class GenboreePathoCalcSettingsController < ApplicationController
  include GenboreePathoCalcHelper
  unloadable
  before_filter :find_project
  def update
    @settingsFields, @settingsRec = find_settings()
    $stderr.puts "@settingsRec[PC]1: #{@settingsRec.inspect}"
    if(@settingsRec.nil?)
      # then make a new setting record
      hh = {}
      @settingsFields.each { |field|
        if(field.to_s == "alleleRptDownloadEnabled")
          hh[field] = ( params[field.to_s]['val'] == '0' ? false : true )
        else  
          hh[field] = params[field.to_s]
        end
      }
      $stderr.puts "Creating new record for Pathogenicity calculator"
      # associate these settings with a specific project
      hh[:project_id] = @project.id
      @settingsRec = GenboreePathoCalc.new(hh)
      @settingsRec.save
    else
      # then update existing settings record
      @settingsFields.each { |field|
        if(field.to_s == "alleleRptDownloadEnabled")
          fieldVal = ( params[field.to_s]['val'] == '0' ? false : true )
          @settingsRec.send("#{field}=".to_sym, fieldVal)
        else
          @settingsRec.send("#{field}=".to_sym, params[field.to_s])
        end
      }
      $stderr.puts "@settingsRec2[PC]: #{@settingsRec.inspect}"
      @settingsRec.save
    end
    flash[:notice] = "Settings updated."
    kbMount = RedmineApp::Application.routes.default_scope[:path]
    redirect_to "#{kbMount}/projects/#{@project.identifier}/settings/genboreePathoCalc" 
  end
end
