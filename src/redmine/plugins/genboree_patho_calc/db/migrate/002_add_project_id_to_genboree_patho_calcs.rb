class AddProjectIdToGenboreePathoCalcs < ActiveRecord::Migration
  def change
    add_column :genboree_patho_calcs, :project_id, :string, :after => :id
  end
end
