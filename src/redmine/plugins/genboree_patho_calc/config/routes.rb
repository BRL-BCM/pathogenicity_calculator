# Plugin's routes
# See: http://guides.rubyonrails.org/routing.html
RedmineApp::Application.routes.draw do
  ## Entry page
  get '/projects/:id/genboree_patho_calc', :to => "genboree_patho_calc_ui_entry#show", :as => :genboree_patho_calc_ui_entry_show
  # Summary grid for variants categorized by Gene
  get '/projects/:id/genboree_patho_calc/genes/assertion-summary(.:format)', :to => "genboree_patho_calc_genes#assertion_summary", :as => :genboree_patho_calc_genes_assertion_summary
  # List of variants that fall under a specific assertion for a gene
  get '/projects/:id/genboree_patho_calc/gene/:gene/assertion/:assertion/variants(.:format)', :to => "genboree_patho_calc_genes#variants_for_gene_and_assertion", :as => :genboree_patho_calc_genes_variants_for_gene_and_assertion
  # Search Allele Registry  by CAID (follows allele registry convention)
  get '/projects/:id/genboree_patho_calc/allele-registry/allele/:allele(.:format)', :to => "genboree_patho_calc_allele_registry#allele", :as => :genboree_patho_calc_allele_registry_allele
  # Search Allele Registry  by hgvs (follows allele registry convention)
  get '/projects/:id/genboree_patho_calc/allele-registry/allele(.:format)', :to => "genboree_patho_calc_allele_registry#allele", :as => :genboree_patho_calc_allele_registry_allele
  # Search User collection  by CAID (follows allele registry convention)
  get '/projects/:id/genboree_patho_calc/allele/:allele(.:format)', :to => "genboree_patho_calc_alleles#allele", :as => :genboree_patho_calc_alleles_allele
  # Search User collection  by hgvs (follows allele registry convention)
  get '/projects/:id/genboree_patho_calc/allele(.:format)', :to => "genboree_patho_calc_alleles#allele", :as => :genboree_patho_calc_alleles_allele
  # Gets last N edited variants
  get '/projects/:id/genboree_patho_calc/alleles/recent-activity(.:format)', :to => "genboree_patho_calc_alleles#recent_activity", :as => :genboree_patho_calc_alleles_recent_activity
  
  
  ## External Ontologies
  # Scigraph
  get '/projects/:id/genboree_patho_calc/external-ontologies/scigraph/:term', :to => "genboree_patho_calc_external_ontologies#scigraph", :as => :genboree_patho_calc_external_ontologies_scigraph
  
  ## Calculator page routes
  get '/projects/:id/genboree_patho_calc/calculator', :to => "genboree_patho_calc_ui_calculator#show", :as => :genboree_patho_calc_ui_calculator_show
  # Save summary assertion for an allele/variant 
  post '/projects/:id/genboree_patho_calc/allele/:allele/assertion-summary/update', :to => "genboree_patho_calc_alleles#update_assertion_summary", :as => :genboree_patho_calc_alleles_update_assertion_summary
  # Save assertion for an evidence doc
  post '/projects/:id/genboree_patho_calc/allele/:allele/evidence/assertion/update', :to => "genboree_patho_calc_alleles#update_evidence_assertion", :as => :genboree_patho_calc_alleles_update_evidence_assertion
  
  get '/projects/:id/genboree_patho_calc/source_registry/all', :to => "genboree_patho_calc_source_registry#all", :as => :genboree_patho_calc_source_registry_all
  get '/projects/:id/genboree_patho_calc/source_registry/tags', :to => "genboree_patho_calc_source_registry#tags", :as => :genboree_patho_calc_source_registry_tags
  get '/projects/:id/genboree_patho_calc/evidences/all', :to => "genboree_patho_calc_evidences#all", :as => :genboree_patho_calc_evidences_all
  post '/projects/:id/genboree_patho_calc/evidences/save_answer', :to => "genboree_patho_calc_evidences#save_answer", :as => :genboree_patho_calc_evidences_save_answer
  post '/projects/:id/genboree_patho_calc/evidences/delete', :to => "genboree_patho_calc_evidences#delete", :as => :genboree_patho_calc_evidences_delete
  
  get '/projects/:id/genboree_patho_calc/evidences/transform', :to => "genboree_patho_calc_evidences#transform", :as => :genboree_patho_calc_evidences_transform
  
  get '/projects/:id/genboree_patho_calc/evidences/find_by_ca', :to => "genboree_patho_calc_evidences#find_by_ca", :as => :genboree_patho_calc_evidences_find_by_ca
  post '/projects/:id/genboree_patho_calc/evidences/save', :to => "genboree_patho_calc_evidences#save", :as => :genboree_patho_calc_evidences_save
  get '/projects/:id/genboree_patho_calc/reasoner/run', :to => "genboree_patho_calc_reasoner#run", :as => :genboree_patho_calc_reasoner_run
  get '/projects/:id/genboree_patho_calc/ca_evidence_caches', :to => "genboree_patho_calc_ca_evidence_caches#show", :as => :genboree_patho_calc_ca_evidences_caches_show
  
  get '/projects/:id/genboree_patho_calc/ca_evidence_caches/find_by_id', :to => "genboree_patho_calc_ca_evidence_caches#find_by_id", :as => :genboree_patho_calc_ca_evidences_caches_find_by_id
  
  get '/projects/:id/genboree_patho_calc/user_info/role', :to => "genboree_patho_calc_user_info#role", :as => :genboree_patho_calc_user_info_role
  
  post '/projects/:id/genboree_patho_calc/ca_evidence_caches/save', :to => "genboree_patho_calc_ca_evidence_caches#save", :as => :genboree_patho_calc_ca_evidences_caches_save
  
  get '/projects/:id/genboree_patho_calc/conclusion_cache', :to => "genboree_patho_calc_conclusion_cache#show", :as => :genboree_patho_calc_conclusion_cache_show
  post '/projects/:id/genboree_patho_calc/conclusion_cache/update', :to => "genboree_patho_calc_conclusion_cache#update", :as => :genboree_patho_calc_conclusion_cache_update
  get '/projects/:id/genboree_patho_calc/allele_registry/find_by_prefix', :to => "genboree_patho_calc_allele_registry#find_by_prefix", :as => :genboree_patho_calc_allele_registry_find_by_prefix
  get '/projects/:id/genboree_patho_calc/allele_registry/find_by_id', :to => "genboree_patho_calc_allele_registry#find_by_id", :as => :genboree_patho_calc_allele_registry_find_by_id
  get '/projects/:id/genboree_patho_calc/allele_registry/find_by_gene', :to => "genboree_patho_calc_allele_registry#find_by_gene", :as => :genboree_patho_calc_allele_registry_find_by_gene

  post '/projects/:id/genboree_patho_calc/ui/report', :to => "genboree_patho_calc_ui_report#show", :as => :genboree_patho_calc_ui_report_show
  
  post '/projects/:id/settings/genboree_patho_calc/update', :to => "genboree_patho_calc_settings#update", :as => :genboree_patho_calc_settings_update
  
  
  
  
end
