class GenboreePathoCalcUiReportController < ApplicationController  
  include GenboreePathoCalcHelper
  include GbMixin::AsyncRenderHelper
  unloadable
  before_filter :find_project, :find_settings, :genboreePathoCalcSettings
  layout 'report'

  def show()
    @doc = JSON.parse(params['data'])
    modelFile = @genboreePCSettings.alleleRptModelFile
    mconv = BRL::Genboree::KB::Converters::NestedTabbedModelConverter.new()
    @rptModel = File.open(modelFile) { |fh| mconv.parse(fh) }
    render :show
  end

end
