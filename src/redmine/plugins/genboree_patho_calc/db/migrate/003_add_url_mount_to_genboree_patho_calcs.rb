class AddUrlMountToGenboreePathoCalcs < ActiveRecord::Migration
  def change
    add_column :genboree_patho_calcs, :urlMount, :string
  end
end
