require 'redmine'
require_dependency 'genboree_patho_calc/hooks'
Redmine::Plugin.register :genboree_patho_calc do
  name 'Genboree Patho Calc plugin'
  author 'Sameer Paithankar'
  description 'This is a redmine plugin for the Pathogencity Calculator'
  version '0.0.1'
  url 'http://example.com/path/to/plugin'
  author_url 'http://example.com/about'
  
  # Add plugin-specific settings accessible through Setting.plugin_genboree_evb_hub (per Plugin.register above)
  #   or via the "settings" local variable
  settings  :partial => 'settings/genboree_patho_calc',
    :default => {
      'menu' => 'Pathogenicity Calculator'
    }

  # Add module to list of admin-enabled project modules
  project_module(:genboree_patho_calc) {
    permission :genboree_patho_calc_read_access, {
      
      
    }
    permission :genboree_patho_calc_write_access, {
      :genboree_patho_calc_ui_entry => [ :show ],
      :genboree_patho_calc_genes => [ :assertion_summary ],
      :genboree_patho_calc_ui_report => [ :show ],
      :genboree_patho_calc_ui_calculator => [ :show ],
    }
  }

  # For projects with Genboree Pathogencity Calculator module enabled, add a tab to the menu bar
  menu :project_menu,
    :genboree_patho_calc,
    {
      :controller => "genboree_patho_calc_ui_entry",
      :action => "show"
    },
    :caption => Proc.new { Setting.plugin_genboree_patho_calc['menu'] },
    :if      => Proc.new { !Setting.plugin_genboree_patho_calc['menu'].blank? }
  
  
end
