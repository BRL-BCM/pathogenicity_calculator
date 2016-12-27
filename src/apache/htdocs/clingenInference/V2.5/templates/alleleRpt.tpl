
<%
  tags = @__kbDoc.getPropItems("Allele Registry ID.Evidence")
  tags ||= []
  assertAndReasonSubDoc = @__kbDoc.getPropValueObj("Allele Registry ID.Assertion and Reasoning")
  assertAndReasonSubDoc = nil if(assertAndReasonSubDoc.acts_as?(Hash) and assertAndReasonSubDoc.empty?)
  otherCalls = @__kbDoc.getPropItems("Allele Registry ID.Assertion and Reasoning.Other Assertions Reached")
  otherCalls ||= []
  finalCallRules = @__kbDoc.getPropItems("Allele Registry ID.Assertion and Reasoning.Final Call.Rules Met")
  finalCallRules ||= []
%>
<div class="attribution">
  <span>&curren; Report generated dynamically by BCM's <code>ClinGen Pathogenicity Calculator</code>.</span>
  <span>&curren; Powered by <a href="http://genboree.org" target="_blank">Genboree</a>.</span>
</div>

<!-- ALLELE INFORMATION -->
<span class="lvl1 title">Allele Information</span>
  <!-- ALLELE REGISTRY ID -->
  <div id="alleleRegID" class="section">
    <span class="lvl2 title">Allele Registry ID</span>
    <span class="value"><%= @allele_registry_id %></span>
  </div>
  
  <!-- HGVSes -->  
  <div id="hgvs" class="section">
    <span class="lvl3 title">HGVS</span>
    <span class="value"><%= @allele_registry_idAllele_informationHgvs %></span>
  </div>
  
  <!-- GENE -->  
  <div id="gene" class="section">
    <span class="lvl2 title">Gene</span>
    <span class="value"><%= @allele_registry_idAllele_informationGene or "<span class=\"missing\">(None available)</span>" %></span>
  </div>
  
  <!-- PHENOTYPE -->  
  <div id="phenotype" class="section">
    <span class="lvl2 title">Phenotype</span>
    <span class="value"><%= @allele_registry_idPhenotype or "<span class=\"missing\">(None available)</span>" %></span>
  </div>
  
  <!-- INHERITANCE -->  
  <div id="inheritance" class="section">
    <span class="lvl2 title">Mode of Inheritance</span>
    <span class="value"><%= @allele_registry_idMode_of_inheritance or "<span class=\"missing\">(Not available due to no evidence present)</span>"%></span>
  </div>
  
<!-- EVIDENCE -->
<span class="lvl1 title">Evidence</span>
  
  <!-- TAGS & INFO -->
  <% if(tags.empty?) %>
      <span class="missing">(No evidence present)</span>
  <% else %>
    <%= @__producer.render_each( "Allele Registry ID.Evidence", :tag) %>
  <% end %>
  
<!-- ASSERTION / REASONING -->
<span class="lvl1 title">Assertions and Reasoning</span>
  <% if(assertAndReasonSubDoc) %>
    <!-- Final Call & Relevant Rules -->
    <div id="finalCall" class="section">
      <span class="lvl3 title">Final Call : <span class="value"><%= @allele_registry_idAssertion_and_reasoningFinal_call %></span></span>
      <% unless(finalCallRules.empty?) %>
        <div class="attrs">
          <div class="attr"><span class="name">Rules Passed :</span>
            <ul class="values attr list">
              <%= @__producer.render_each(
                    "Allele Registry ID.Assertion and Reasoning.Final Call.Rules Met",
                    %q^<li class="value item"><!%= @rule %!></li>^) %>
            </ul>
          </div>
        </div>
      <% end %>
    </div>  
  
    <!-- Other Assertions -->
    <div id="otherAssertions" class="section">
      <% unless(otherCalls.empty?) %>
          <span class="lvl3 title">Other Assertions Reached :</span>
            <%= @__producer.render_each( "Allele Registry ID.Assertion and Reasoning.Other Assertions Reached", :otherCall ) %>
      <% else %>
        <span class="missing">(No other assertions made)</span>        
      <% end %>
    </div>
  <% else %>
      <span class="missing">(No assertions due to no evidence present)</span>    
  <% end %>
