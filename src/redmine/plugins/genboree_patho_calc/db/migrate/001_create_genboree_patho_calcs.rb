class CreateGenboreePathoCalcs < ActiveRecord::Migration
  def change
    create_table :genboree_patho_calcs do |t|
      t.string :alleleRegAddress
      t.string :userConfHost
      t.string :userConfRsrcPath
      t.string :headerFilePath
      t.string :footerFilePath
      t.boolean :alleleRptDownloadEnabled
      t.string :alleleRptModelFile
      t.string :alleleRptTemplatesDir
      t.string :alleleRptAssetBaseDir
    end
  end
end
