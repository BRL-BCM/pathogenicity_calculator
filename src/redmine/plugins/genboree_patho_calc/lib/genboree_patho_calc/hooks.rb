#!/usr/bin/env ruby


module GenboreePathoCalcSettingsHook
  class Hooks < Redmine::Hook::ViewListener
    def helper_projects_settings_tabs(context = {})
      context[:tabs].push({ :name    => 'genboreePathoCalc',
                          :action  => :genboree_patho_calc_settings,
                          :partial => 'projects/settings/genboree_patho_calc_settings',
                          :label   => :gbpathocalc_label_project_settings_tab })
    end
  end
end
