<%
  tagLinks = @__kbDoc.getPropItems("TagID.Tag.Links")
  tagLinks ||= []
%>
  <!-- TAG -->  
  <div class="section">
    <span class="lvl3 title"><%= @tagidTag %></span>
    <div class="attrs">
      <div class="attr"><span class="name">Category :</span> <span class="value"><%= @tagidTagCategory.gsub(/>>/, "&raquo;") %></span></div>
      <div class="attr"><span class="name">ACMG Text :</span> <span class="value"><%= @tagidTagStandard_text %></span></div>
      <div class="attr"><span class="name">User Summary :</span> <span class="value"><%= @tagidTagSummary %></span></div>
      <% unless(tagLinks.empty?) %>
        <div class="attr"><span class="name">Supporting Links :</span></div>
        <div class="subSection">
          <div class="attrs">
            <ul class="values attr list">
              <%= @__producer.render_each(
                    "TagID.Tag.Links",
                    %q^<li class="value item"><!%= @linkComment or @link %!> <span class="link">[<a href="<!%= @link %!>" target="_blank">Link</a>]</span></li>^) %>
            </ul>
          </div>      
        </div>
      <% end %>
    </div>
  </div>
