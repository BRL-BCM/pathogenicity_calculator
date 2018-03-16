#!/usr/bin/env ruby

require 'genboreeTools'

if ARGV.size != 1
	puts "Parameters: Allele Registry FQDN (without http:// prefix)"
	exit 1
end

alleleRegistryFQDN = ARGV[0]

# create Redmine project
redmine_add_project("pathogenicity_calculator", "Pathogenicity Calculator", ['genboree_patho_calc'], true)
redmine_configure_project_genboree_patho_calc("pathogenicity_calculator", alleleRegistryFQDN)

