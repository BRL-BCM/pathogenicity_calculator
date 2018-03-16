/* Global variables */
linkNameMap = {
  "ClinVarVariations": "ClinVar (Variation)",
  "ClinVarAllele": "ClinVar (Allele)",
  "MyVariantInfo_hg38": "MyVariant.info (hg38)",
  "MyVariantInfo_hg19": "MyVariant.info (hg19)"
}

/* Initializes the various bits within the entry page including the summary grid */
function initEntryPage(){
  if(docCount > 0) {
    loadSummaryGridInfo() ;
    loadRecentActivity() ;
    $(".variant-search-in-coll").removeClass("disabled") ;
  }
  else{
    // @todo
    $(".no-variants-container").removeClass("hide") ;
    $('[data-toggle="tooltip"]').tooltip(); 
  }
}

function searchAlleleInCollection(){
  var searchStr = $("#search_string_for_coll").val().trim() ;
  var targetURL = appPath+"/allele" ;
	var params = {} ;
  targetURL += ("/"+searchStr) ;
	$.ajax(targetURL, {
		method: 'GET',
		data: params,
		beforeSend: function(){
      $('#spinningModal').modal('show') ;
      $("#variantSearchInCollModal .not-found-message").empty() ;
    },
		success : function(data){
      $('#variantSearchInCollModal').modal('hide') ;
			$('#spinningModal').modal('hide') ;
      $(".variant-row").remove() ;
      $(".variant-listing-container").removeClass("hide") ;
      $(".show-more-variants-btn").addClass('hide') ;
      renderVariantGrid([JSON.parse(data)]) ;
      $(".showing-variant-records-num").text("Showing 1 of 1 variant") ;
      $('[data-toggle="tooltip"]').tooltip();
      $('html, body').animate({ scrollTop:  $(".variant-listing-container").offset().top - 50 }, 'slow');
		},
		error: function(reqObj, status, err){
			$('#spinningModal').modal('hide') ;
      var msg = "The variant/allele you searched for could not be found in your collection. Please ensure that you have entered the correct CAID." ;
      addAlertBox(msg, "#variantSearchInCollModal .not-found-message")  ;
    }
	}) ;
}

function registerVariant(){
  var protocol = window.location.protocol ;
  var regAlleleLink = protocol+"//"+unescape(regAddress)+"/redmine/projects/registry/genboree_registry/create?hgvs="+encodeURIComponent(hgvsTerm) ;
  window.open(regAlleleLink, "alleleRegistry") ;
  $("#registerVariantModal").modal("hide") ;
  $("#postVariantRegistrationModal").modal("show") ;
}

function searchAlleleRegistry(){
	var searchStr = $("#search_string_for_registry").val().trim() ;
  var targetURL = appPath+"/allele-registry/allele" ;
	var params = {} ;
  hgvsTerm = false ;
	if(!searchStr.match(/^CA/)){
		params.hgvs = searchStr ;
    hgvsTerm = searchStr ;
	}
  else{
    targetURL += ("/"+searchStr) ;
  }
	$.ajax(targetURL, {
		method: 'GET',
		data: params,
		beforeSend: function(){
			$('#variantSearchInRegistryModal').modal('hide') ;
      $('#spinningModal').modal('show') ;
    },
		success : function(data){
			$('#spinningModal').modal('hide') ;
      $(".variant-row").remove() ;
      $(".variant-listing-container").removeClass("hide") ;
      $(".show-more-variants-btn").addClass('hide') ;
      renderVariantGrid([JSON.parse(data)]) ;
      $(".showing-variant-records-num").text("Showing 1 of 1 variant") ;
      $('[data-toggle="tooltip"]').tooltip();
      $('html, body').animate({ scrollTop:  $(".variant-listing-container").offset().top - 50 }, 'slow');
		},
		error: function(reqObj, status, err){
			$('#spinningModal').modal('hide') ;
      // Present the user with an option to register the new allele if an hgvs term was used
      if(hgvsTerm){
        $("#registerVariantModal").modal("show") ;
      }
      else{
        $("#variantNotFoundModal").modal("show") ;
      }
			// @todo
		}
	}) ;
}

function loadSummaryGridInfo(){
  // Start off with the genes summary grid.
  // Later on we may have the option of summarizing the variant info by some other category
  var targetURL = appPath+"/genes/assertion-summary" ;
  $.ajax(targetURL, {
    method: 'GET',
    data: {
      geneSummaryURI: geneSummaryURI,
      limit: showLimit
    },
    beforeSend: function(){
    },
    success : function(data){
      //debugger ;
      skip += showLimit ;
      var recs = JSON.parse(data).data ;
      $(".summary-grid-container.recent-activity-container").removeClass("hide") ;
      renderSummaryGrid(recs, 'Gene') ;
      showingSummaryRecs += recs.length ;
      $(".showing-records-num").text("Showing 1-"+showingSummaryRecs+" of "+docCount+" genes") ;
    },
    error: function(data){
      // @todo
    }
  }) ;
}

function loadRecentActivity(){
  
  var targetURL = appPath+"/alleles/recent-activity?" ;
  $.ajax(targetURL, {
    method: 'GET',
    data: {
      //evidenceCollURI: evidenceCollURI
    },
    beforeSend: function(){
    },
    success : function(data){
      $(".panel.recent-activity").removeClass("hide") ;
      renderRecentActivityInfo(JSON.parse(data)) ;
    },
    error: function(data){
      // @todo
    }
  }) ;
}

function renderRecentActivityInfo(data){
  var markup = "" ;
  for(var ii=0; ii<data.length; ii++){
    var rec = data[ii] ;
    markup += "<div class=\"allele row\">" ;
    markup += ("<div class=\"col-xs-12 col-sm-12 col-md-12\">"+(ii+1)+". "+rec.id +"<a  data-toggle=\"tooltip\" title=\"Go to calculator page\" class=\"calc-link fa fa-calculator\" href=\""+appPath+"/calculator?ca="+rec.id+"\"></a>"+"</div>") ;
    var descText = "" ;
    var description = rec.hgvsDescription ;
    if(description.length > 0){
      for(jj=0; jj<description.length; jj++){
        if(description[jj].hgvs && description[jj].hgvs.match(/^NM/)){
          descText = description[jj].hgvs ;
					if(description[jj].proteinEffect){
						descText += (" (" + description[jj].proteinEffect.split(":")[1]+")") ;
					}
          break ;
        }
      }
    }
    if(descText === "" && description.length > 0){
      descText = description[0].hgvs ;
			if(description[jj].proteinEffect){
				descText += (" (" + description[jj].proteinEffect.split(":")[1]+")") ;
			}
    }
    markup += ("<div class=\"col-xs-12 col-sm-12 col-md-12\">" + descText + "</div>") ;
		if(rec.gene) {
			markup += "<div class=\"col-xs-12 col-sm-12 col-md-12\">" + rec.gene + "</div>" ;
		}
    var assertions = rec.assertions ;
    for(jj=0; jj<assertions.length; jj++){
      markup += ("<div class=\"col-xs-12 col-sm-12 col-md-12 tag\"><span class=\"label label-warning\">" + assertions[jj].assertion + "</span></div>") ;  
    }
    markup += "</div>" ;
  }
  $(".recent-activity .activity").append(markup) ;
  $('[data-toggle="tooltip"]').tooltip(); 
}

function renderSummaryGrid(data, identifierProp) {
  var ii, jj ;
  var markup = "" ;
  var allAssertions = {} ;
  for(ii=0; ii<assertions.length; ii++){
    allAssertions[assertions[ii]] = true ;
  }
  for(ii=0; ii<data.length; ii++){
    var asserLookup = {} ;
    markup += "<tr class=\"summary-row\">" ;
    var gs = data[ii] ;
    var calls = gs[identifierProp].properties.ReasonerCalls.items ;
    for(jj=0; jj<calls.length; jj++ ){
      var call = calls[jj] ;
      var assertion = call.ReasonerCall.value ;
      var variants = call.ReasonerCall.properties.CAIDs.value ;
      // ACMG assertions will be present in allAssertions
      if(allAssertions[assertion]) {
        asserLookup[assertion] = variants ;
      }
      else{ // Group all non ACMG assertions under one header
        if(asserLookup["Non ACMG"] === null || asserLookup["Non ACMG"] === undefined || asserLookup["Non ACMG"] === false){
          asserLookup["Non ACMG"] = variants ;
        }
        else{
          asserLookup["Non ACMG"] += variants ;
        }
      }
    }
    var identifier = gs[identifierProp].value ;
    markup += ("<td class=\"summary-cell identifier\">"+identifier+"</td>") ;
    for(jj=0; jj<assertions.length; jj++){
      var asser = assertions[jj] ;
      if(asserLookup[asser]){
        markup += ("<td  class=\"summary-cell with-link\"><span data-toggle=\"tooltip\" onclick=\"showMoreVariants(this)\" data-assertion=\""+asser+"\" data-placement=\"top\" title=\"Click to see variant details\">"+asserLookup[asser]+"</span></td>") ;
      }
      else{
        markup += ("<td class=\"summary-cell\">0</td>") ;
      }
    }
    markup += "</tr>" ;
  }
  $(".summary.panel .table").append(markup) ;
  $('[data-toggle="tooltip"]').tooltip(); 
}

function renderVariantGrid(data){
  var markup = "" ;
  var jj ;
  for(var ii=0; ii<data.length; ii++){
    markup += "<tr class=\"variant-row\">" ;
    var rec = data[ii] ;
    markup += "<td class=\"variant-cell id\">"+rec.id+"</td>" ;
    markup += "<td class=\"variant-cell gene\">"+rec.gene+"</td>" ;
    var description = [] ;
    //hgvsMarkupObj = [] ;
    for(jj=0; jj<rec.hgvsDescription.length; jj++){
      //description[jj] = rec.hgvsDescription[jj].split(":")[1] ;
      var hgvsObj = rec.hgvsDescription[jj] ;
      var hgvsStr = hgvsObj["hgvs"].split(":")[1] ;
      if(hgvsObj.proteinEffect){
        hgvsStr += (" (" + hgvsObj.proteinEffect.split(":")[1]+")") ;
      }
      description.push(hgvsStr) ;
    }
    markup += "<td class=\"variant-cell description\">" ;
    if(description.length > 7){
      markup += description.slice(0, 7).join("<br>") ;
    }
    else{
      markup += description.join("<br>") ;
    }
    markup += "</td>" ;
    var assertions = rec.assertions ;
    
    var tags = [] ;
    markup += "<td class=\"variant-cell \">" ;
    for(jj=0; jj<assertions.length; jj++){
      var assertion = assertions[jj].assertion ;
      //tags.push(assertions[jj].tags.join(", ")) ;
      if(jj !== 0){
        markup += "<hr>" ; 
      }
      markup += "<div class=\"assertion\"><span class=\"label label-warning assertion\">"+assertion+"</span><a data-toggle=\"tooltip\" title=\"Go to calculator page\" class=\"calc-link fa fa-calculator\" href=\""+appPath+"/calculator?ca="+rec.id+"\"></a>" ;
      markup += "<span class=\"tags\">"+assertions[jj].tags.join(", ")+"</span></div>" ;
      
    }
    markup += "</td>" ;
    var externalLinks = rec.externalLinks ;
    var externalLinksList = Object.keys(externalLinks) ;
    markup += "<td>" ;
    for(jj=0; jj<externalLinksList.length; jj++){
      var linkname = externalLinksList[jj] ;
      var link = externalLinks[linkname][0]["@id"] ;
      if(linkname.match(/MyVariant/)){
        link += "&format=html" ;
      }
      markup += "<a href=\""+link+"\"><span class=\"badge e-link\">"+(linkNameMap[linkname] ? linkNameMap[linkname] : linkname)+"</span></a>" ;
    }
    markup += "<td>" ;
    markup += "</tr>" ;
  }
  $(".variant.panel .table").append(markup) ;
  $(".no-variants-container").addClass("hide") ;
}

function showMore(){
  if(skip < docCount){
    var targetURL = appPath+"/genes/assertion-summary" ;
    $.ajax(targetURL, {
      method: 'GET',
      data: {
        geneSummaryURI: geneSummaryURI,
        limit: showLimit,
        skip: skip
      },
      beforeSend: function(){
      },
      success : function(data){
        skip += showLimit ;
        var recs = JSON.parse(data).data ;
        renderSummaryGrid(recs, 'Gene') ;
        showingSummaryRecs += recs.length ;
        if(skip >= docCount){
          $(".show-more-btn").addClass('disabled') ;
        }
        $(".showing-records-num").text("Showing 1-"+showingSummaryRecs+" of "+docCount+" genes") ;
      },
      error: function(data){
        // @todo
      }
    }) ;
  }
  else{
    return false ;
  }
}

function showMoreVariants(thisObj){
  var endReached = false ;
  if(thisObj) {
    currentCellVariantCount = parseInt($(thisObj).text().trim()) ;
    currentAssertion = thisObj.getAttribute('data-assertion') ;
    $(".variant-row").remove() ;
    $(".variant-listing-container").removeClass("hide") ;
    if(currentCellVariantCount <= variantShowLimit) {
      $(".show-more-variants-btn").addClass('hide') ;
    }
    else{
      $(".show-more-variants-btn").removeClass('hide') ;
    }
    variantSkip = 0 ;
    showingVariantRecs = 0 ;
    summaryIdentifier = $(thisObj).closest("tr").find(".identifier").text().trim() ;
  }
  else{
    if(variantSkip >= currentCellVariantCount){
      endReached = true ;
    }
  }
  if(endReached === false){
    var targetUrl = appPath+"/gene/"+encodeURIComponent(summaryIdentifier)+"/assertion/"+escape(currentAssertion)+"/variants" ;
    $.ajax(targetUrl, {
      method: 'GET',
      data: {
        //geneSummaryURI: geneSummaryURI,
        //evidenceCollURI: evidenceCollURI,
        limit: variantShowLimit,
        skip: variantSkip
      },
      beforeSend: function(){
        $('#spinningModal').modal('show') ;
      },
      success : function(data){
        $('#spinningModal').modal('hide') ;
        if(thisObj){
          $('html, body').animate({ scrollTop:  $(".variant-listing-container").offset().top - 50 }, 'slow');
        }
        variantSkip += variantShowLimit ;
        var recs = JSON.parse(data) ;
        renderVariantGrid(recs) ;
        showingVariantRecs += recs.length ;
        if(variantSkip >= currentCellVariantCount){
          $(".show-more-variants-btn").addClass('disabled') ;
        }
        else{
          $(".show-more-variants-btn").removeClass('disabled') ;
        }
        $(".showing-variant-records-num").text("Showing 1-"+showingVariantRecs+" of "+currentCellVariantCount+" variants") ;
        $('[data-toggle="tooltip"]').tooltip(); 
      },
      error: function(data){
        $('#spinningModal').modal('hide') ;
        // @todo
      }
    }) ;
  }
  else{
    return false ;
  }
}