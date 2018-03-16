

# set configuration of genboree_patho_calc project
def redmine_configure_project_genboree_patho_calc(project_identifier, allele_registry_fqdn)
  # find project id
  resp = redmine_api_get("/projects/#{project_identifier}.json")
  id = resp["project"]["id"]
  raise "Cannot find project with identifier: #{project_identifier}" if id.nil?
  # set record's fields
  fields = Hash.new
  fields['project_id'] = id
  fields['alleleRegAddress'] = allele_registry_fqdn
  fields['userConfHost'] = 'localhost'
  fields['userConfRsrcPath'] = '/REST/v1/grp/pcalc_resources/kb/pcalc_resources/coll/Configuration/doc'
  fields['headerFilePath'] = '/usr/local/brl/local/rails/remine/project-specific/genboree_patho_calc/header.incl'
  fields['footerFilePath'] = '/usr/local/brl/local/rails/remine/project-specific/genboree_patho_calc/footer.html'
  fields['alleleRptDownloadEnabled'] = 0
  fields['alleleRptModelFile'] = '/usr/local/brl/local/rails/redmine/project-specific/genboree_patho_calc/alleleRpt.model.txt'
  fields['alleleRptTemplatesDir'] = nil
  fields['alleleRptAssetBaseDir'] = nil
  fields['urlMount'] = '/redmine/projects/pathogenicity_calculator/genboree_patho_calc/'
  # check if the record exists and run insert or update
  sql = "SELECT COUNT(1) AS count FROM genboree_patho_calcs WHERE project_id=#{id}"
  if runSqlStatement_redmine(sql).first['count'].to_i == 0
    sql = sql_insert('genboree_patho_calcs', fields)
  else
    sql = sql_update('genboree_patho_calcs', fields) + " WHERE project_id=#{id}"
  end
  runSqlStatement_redmine(sql)
end
