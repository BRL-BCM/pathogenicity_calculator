<div class="subSection">
  <div class="attrs">
    <div class="attr">
      <span class="name">Call :</span> <span class="value"><%= @call %></span></span>
      <div class="subSection depth2">
        <div class="attrs">
          <div><span class="name">Rules Passed :</span>
          <ul class="values list">
            <%= @__producer.render_each(
                  "Call.Rules Met",
                  %q^<li class="value item"><!%= @rule %!></li>^) %>
          </ul>
        </div>      
      </div>
    </div>      
  </div>
</div>
