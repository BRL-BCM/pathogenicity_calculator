// make the three panels
function makeBigGrid()
{
  // global
  var safeStr = new Object() ;
  var alleleGrid = getAlleleGrid();
  var reaBar = getTabToolBar() ; 
  //fields are dynamically generated . see panels.js addTabs()
  var summaryStore = new Ext.data.SimpleStore(
  {
    id: 'sstore',
    fields:[]
  }) ;
  // columns are dynamically generated see panel.js addTabs()
  var summaryGrid = new Ext.grid.GridPanel(
  {
    id: 'summaryGrid',
    title: "Evidence Summary & Display",
    border : true,
    height: 125,
    cls: 'summaryheader',
    collapsible: true,
    collapsed: false,
    useArrows: true,
    autoScroll: true,
    disableSelection: true,
    store: summaryStore,
    columns:[]
    //viewConfig : {forceFit: true}
  }) ;
  
  var tabs = Ext.create('Ext.tab.Panel', {
    id: 'multitab',
    cls: 'multitabgrid'
  });

  var tabHolder = Ext.create('Ext.panel.Panel', {
    header : false,
    id:'tabholder',
    layout: {
      type: 'vbox',
      align : 'stretch',
      pack  : 'start'
    },
    //cls: 'infPanel',
    height: 1000,
    plain: true,
    border: false,
    tbar: reaBar,
    items:[tabs]
  });

  
  Ext.create('Ext.panel.Panel', {
    header : false,
    //layout: 'fit',
    layout: {
      type: 'vbox',
      align : 'stretch'
      //pack  : 'start'
    },
    id: 'fullcalc',
    bodyStyle:'padding:0px 12px 0 12px',
    plain: true,
    //border: false,
    renderTo: 'panel',
    items:[alleleGrid, summaryGrid, tabHolder]
  });
  
  var alleleMask = getMask('alleleGrid', 'alleleMask', "Loading Allele and Gene Information  . . . ") ;
  var sumMask = getMask('summaryGrid', 'summaryMask', "Loading Evidence Summary  . . . ") ;
  var tabMask = getMask('fullcalc', 'tabMask', "Loading Guidelines and Evidence Table  . . . ") ;
  alleleMask.show() ; 
  sumMask.show() ;
  tabMask.show();
  // First fill the allele grid with the data from the allele document
  getCalcPanels() ; 
}
// Heuristic to group the assertions fill the reasoner grid
// It groups the assertions and as it groups it retains the least distance for each group
// Least distance is retained by calculating the condition distance and then the rule distance
function getReasonerTable(rules, finalCall)
{
  var ruleTable = new Object() ;
  var claimTable = new Object() ;
  var reaGrid = Ext.getCmp('reasonerGrid') ;
  var finalClaim = finalCall.value ;
  reaGrid.finalClaim = finalClaim ;
  var finalClaimText = finalCall.properties.Text.value ;
  reaGrid.finalText = finalClaimText ;
  var totalDistance ;
  for(var ii = 0; ii < rules.length; ii++)
  {
    var ruleName = rules[ii]['Rule']['value'] ;
    var tmpHash = new Object() ;
    var conditions = [] ;
    var ruleReturns = [] ;
    var assertion = rules[ii]['Rule']['properties']['Assertion']['value'] ;
    var satisfied = rules[ii]['Rule']['properties']['Satisfied']['value'] ;
    var ruleStatement = rules[ii]['Rule']['properties']['RuleStatement']['value'] ;
    conditions = rules[ii]['Rule']['properties']['Conditions']['items'] ;
    ruleReturns = getRuleDistance(conditions);
    if(assertion in ruleTable)// if the assertion is already grouped
    {
      if(satisfied == 'true' || satisfied == true) // <----- XXXXXXXXXXX satisfied is true/false not 'true' / 'false' ???
      {
        // remove the current entries if the distance is not 0 (not satisfied, presumably)
        if(ruleTable[assertion]['distance'] != 0)
        {
          for(var jj = 0; jj < ruleTable[assertion]['rules'].length; jj++)
          {
            var ru = ruleTable[assertion]['rules'][jj] ;
            delete ruleTable[assertion][ru] ;
          }
          // Now add our satisfied entry (0 distance presumably)
          ruleTable[assertion]['rules'] = [ruleStatement] ;
          ruleTable[assertion]['distance'] = 0 ;
          tmpHash = ruleReturns[1] ;
          ruleTable[assertion][ruleStatement] = tmpHash ;
       }
       else // add it to the existing assertion object
       {
         ruleTable[assertion]['distance'] = 0 ;
         ruleTable[assertion]['rules'].push(ruleStatement) ;
         tmpHash = ruleReturns[1] ;
         ruleTable[assertion][ruleStatement] = tmpHash ;
       }
      }
      else // not satisfied, need to retain the least distance
      {
        totalDistance = ruleReturns[0] ;
        tmpHash = ruleReturns[1] ;
        if(totalDistance == ruleTable[assertion]['distance'])
        {
          ruleTable[assertion]['rules'].push(ruleStatement) ;
          ruleTable[assertion][ruleStatement] = tmpHash ;
        }
        else if(totalDistance < ruleTable[assertion]['distance'] && totalDistance >= 0)
        {
          for(var jj = 0; jj < ruleTable[assertion]['rules'].length; jj++)
          {
            delete ruleTable[assertion][ruleTable[assertion]['rules'][jj]] ;
          }
          ruleTable[assertion]['rules'] = [ruleStatement] ;
          ruleTable[assertion]['distance'] = totalDistance ;
          ruleTable[assertion][ruleStatement] = tmpHash ;
        }
        else
        {}
      }
    }
    else // first time entry of the assertion object
    {
      ruleTable[assertion] = {}
      totalDistance = ruleReturns[0] ;
      tmpHash = ruleReturns[1] ;
      ruleTable[assertion]['rules'] = [ruleStatement] ;
      ruleTable[assertion]['distance'] = totalDistance ;
      ruleTable[assertion][ruleStatement] = tmpHash;
    }
    // Claim table update
    if(assertion in claimTable)
    {
      if(satisfied == 'true' || satisfied == true) // <----- XXXXXXXXXXX satisfied is true/false not 'true' / 'false' ???
      {
        claimTable[assertion] = true ;
      }
    }
    else
    {
      claimTable[assertion] = ( (satisfied == 'true' || satisfied == true) ? true : false) ;
    }
  }
  var reaRetVal = [] ;
  // Once the assertions are grouped add the data to the reasoner store
  var ruleDistance ;
  //var clickArg ;
  var keysSorted = Object.keys(ruleTable).sort(function(a,b) {
    var retVal = ruleTable[a]['distance'] - ruleTable[b]['distance'] ;
    if(retVal == 0) // resolve ties via the assertion names to get nice sorting
    {
      if(a == finalClaim) // push final claim to top to resolve tie
      {
        retVal = -1 ;
      }
      else if(b == finalClaim) // push final claim to top to resolve tie
      {
        retVal = 1 ;
      }
      else // not finalClaim, resolve using conclusion NAME (alphabetical and then ASCII)
      {
        var ua = a.toUpperCase() ;
        var ub = b.toUpperCase() ;
        retVal = ( (ua < ub ? -1 : (ua > ub ? 1 : 0)) ) ;
        if(retVal == 0) // did alphabet compare, still tied. Use case to resolve.
        {
          retVal = ( (a < b ? -1 : (a > b ? 1 : 0)) ) ;
        }
      }
    }
    return retVal ;
  }) ;

   // If final claim not one of the assertions, just put the claim on the first
   // row of the table
   
  if(!(finalClaim in ruleTable)){
     reaRetVal.push([finalClaim, 0, "", "", 'Met'])
  }
  for(var ii=0; ii <  keysSorted.length; ii++)
  {
    var ruleStatements = '' ;
    var ruleIcons = ''
    var type = 'UnMet' ;
    var key = assertion = keysSorted[ii] ;
    for(var ru=0; ru<ruleTable[key]['rules'].length; ru++)
    {
      ruleStatements = ruleStatements + ruleTable[key]['rules'][ru] ;
      ruleDistance = ruleTable[key]['distance'] ;
      clickArg = ruleTable[key][ruleTable[key]['rules'][ru]] ;
      path = "";
      count = ""
      for(var ke in clickArg)
      {
        if(clickArg.hasOwnProperty(ke))
        {
          path = path + ke + ',' ;
          count = count + clickArg[ke] + ',' ;
        }
      }
      // Do not know how to pass an object to onclick!!!
      //clickStr = JSON.stringify(clickArg) ;
      // alert(clickStr);
      //"viewGrid(\'html\', \'' + docName + '\', false )"
      var imageElId = key+ru;
      ruleStatements = ruleStatements // MOVED TO OWN COLUMN: + '<a id="'+imageElId+'" class="showHigh"  href="#" onclick="highLightCells(\'' +imageElId+'\',\'' +path+'\' ,\''+ count +'\')"></a>' ;
      ruleStatements = ruleStatements + '<br>' ;
      ruleIcons += '<span id="'+imageElId+'" class="showHigh"  href="#" onclick="highLightCells(\'' +imageElId+'\',\'' +path+'\' ,\''+ count +'\')">&nbsp;</span></br>'
    }
    if(ruleDistance == 0) {type = 'Met' ;}
    else if((ruleDistance > 0) && (ruleDistance < 1)){type = 'Met' ;}
    else {type = 'UnMet';}
    reaRetVal.push([key, ruleDistance, ruleStatements, ruleIcons, type ]) ;
  }
  // load the reasoner store
  var reaStor = Ext.getCmp('reasonerGrid').store ;
  reaStor.loadData(reaRetVal) ;
  return true
}

// highlight or disable the highlighted cells based on the image class on the rule statement column
function highLightCells(imageId, path, count)
{
  
  var elID;
  var obj;
  var extObj;
  var inner;
  var pathCount;
  var showCls = "showHigh";
  var hideCls = "hideHigh";
  var paths = path.split(",");
  var counts = count.split(",");
  // First find whether the paths are already for a satisfied rule statement
  // It has to highlight the respective cells with values in it
  // Different from the unsatisfied - shows the unpopulated cell
  var totalCount = 0;
  for(var ii=0; ii<(counts.length-1); ii++){totalCount = totalCount + parseInt(counts[ii]) ;}

  // Get evidences from the allowed tags rather than hardcoding. Values differ among grids
  var partitions = makeEmptyTable(tags, null, null, true)
  var evidences = partitions[2] ;
  var objCls = document.getElementById(imageId).className ;
  var cindex = 0;
  // Before anything, remove ALL highlighting
  var highlightedTdElems = Ext.DomQuery.select("td.highlighted") ;
  for(var ii=0; ii<highlightedTdElems.length; ii++)
  {
    extObj = Ext.get(highlightedTdElems[ii]) ;
    extObj.removeCls("highlighted") ;
    extObj.setStyle("background", "") ;
  }
  // Also reset all the icons back to default
  var iconsToReset = Ext.DomQuery.select("span.hideHigh") ;
  for(var ii=0; ii<iconsToReset.length; ii++)
  {
    extObj = Ext.get(iconsToReset[ii]) ;
    extObj.removeCls("hideHigh") ;
    extObj.addCls("showHigh") ;
  }

  if(objCls == showCls) //change it to hideCls once highlighted
  {
    for(var pp=0; pp<(paths.length-1); pp++)
    {
      pathCount = parseInt(counts[pp]) ;
      cindex = 0;
      for(var jj=0; jj<evidences.length; jj++)
      {
        elID = paths[pp]+'.'+evidences[jj] ;
        elID = elID.replace(/\s+/g, '');
        obj = document.getElementById(elID) ;
        if(obj)
        {
          extObj = Ext.get(obj) ;
          //skip highlighting if the cell is invalid
          if(obj.className == "invalid")
          {
            continue ;
          }
          else
          {
            if(elID in parColor)
            {
              if(obj.classList.contains( 'gb-dataCell-pathogenic')){obj.classList.remove('gb-dataCell-pathogenic') ; obj.classList.add("gb-dataCell-pathogenic-highlighted") ;}
              else if(obj.classList.contains('gb-dataCell-benign')){obj.classList.remove('gb-dataCell-benign') ; obj.classList.add("gb-dataCell-benign-highlighted") ;}
              else{obj.style.backgroundColor = "lightblue";}
            }
            else
            {
              parColor[elID] = obj.style.backgroundColor ;
              if(obj.classList.contains( 'gb-dataCell-pathogenic')){obj.classList.remove('gb-dataCell-pathogenic') ; obj.classList.add("gb-dataCell-pathogenic-highlighted") ;}
              else if(obj.classList.contains('gb-dataCell-benign')){obj.classList.remove('gb-dataCell-benign') ; obj.classList.add("gb-dataCell-benign-highlighted") ;}
              else{obj.style.backgroundColor = "lightblue";}
            }
            extObj.addCls("highlighted") ;
            document.getElementById(imageId).className = hideCls ;
          }

          } 
       else // The rule itself is invalid
        {
          Ext.Msg.alert('INVALID_RULE', "Rule:  '<i>" + paths[pp] + "</i>' is invalid!!." ) ;
          break;
        }
      }
    }
  }
  else if(objCls == hideCls)
  {
    for(var pp=0; pp<paths.length-1; pp++)
    {
      pathCount = parseInt(counts[pp]) ;
      cindex = 0;
      for(var jj=0; jj<evidences.length; jj++)
      {
        elID = paths[pp]+'.'+evidences[jj] ;
        elID = elID.replace(/\s+/g, '');
        obj = document.getElementById(elID) ;
        extObj = Ext.get(obj) ;
        if(obj.className != "invalid")
        {
          if(obj.classList.contains("gb-dataCell-pathogenic-highlighted")){obj.classList.remove("gb-dataCell-pathogenic-highlighted") ;obj.classList.add("gb-dataCell-pathogenic") ;}
          else if(obj.classList.contains("gb-dataCell-benign-highlighted")){obj.classList.remove("gb-dataCell-benign-highlighted") ; obj.classList.add("gb-dataCell-benign") ;}
          else {obj.style.backgroundColor = parColor[elID] ;}
          extObj.removeCls("highlighted") ;
        }
      }
    }
    document.getElementById(imageId).className = showCls;
  }
}

// calculates the rule distance from a set of conditions
function getRuleDistance(conditions)
{
  var pathHash = new Object();
  var condDistance = 0 ;
  var coName ;
  var path ;
  var sat ;
  var observed ;
  var condition ;
  var dis ;
  for(var cc = 0; cc <conditions.length; cc++)
  {
    coName = conditions[cc]['Condition']['value'] ;
    path = conditions[cc]['Condition']['properties']['PartitionPath']['value'] ;
    sat = conditions[cc]['Condition']['properties']['Satisfied']['value'] ;
    observed = conditions[cc]['Condition']['properties']['Observed']['value'] ;
    condition = conditions[cc]['Condition']['properties']['Condition']['value'] ;
    if(sat != 'true')
    {
      dis = getCondDistance(condition, observed) ;
      condDistance = condDistance + dis ;
      pathHash[path] = dis ;
    }
    else {pathHash[path] = 0;}
  }
  return [condDistance, pathHash]
}

// gets the condition distance from a single condition property
function getCondDistance(cond, observed)
{
  var distance ;
  var re = /\d+$/ ;
  var matchNeeded = cond.match(re) ;
  var observed = parseInt(observed) ;
  var needed = parseInt(matchNeeded[0]) ;
  distance = needed - observed ;
  // Negative distance and "=="
  if(distance < 0 && cond.match(/^(==)/))
  {
    distance = 0.1;
  }
  else if(distance < 0 && cond.match(/^(>=)/))
  {
    distance = 0;
  }
  return distance
}


// success function of the API request of the reasoner
function getReasonerData(result, request)
{
  // Cases where the reasoner is run after filling an empty grid the button has to enabled
  var agButton = Ext.getCmp("gvRefreshButton") ;
  agButton.enable() ;
 
  var copyTagsButton = Ext.getCmp('copyTgs') ;
  copyTagsButton.enable() ;

  var resObj  = JSON.parse(result.responseText) ;
  var reasOut = resObj['data'] ;

  // update the reasoner output with the grid and cache
  var gName = result.request.options.params.gridname ;
  grids[gName].reasonerOutput = reasOut ;

  console.log("Reasoner data received for the grid : :" + gName) ;
  grids[gName].conclusion = reasOut['Reasoner output'].properties.FinalCall.value ;
  // update the version for the grid and update both the cache
  // This is done only for private pages.
  if(isPublic == true || isPublic == 'true') {console.log("Not updating the cache. Page is public. Saving not allowed for public pages.")}
  else
  {
    getEviVersion(gName, null, true) ;
  }
   updateSummaryRow() ; 
  var reasDocName = reasOut['Reasoner output'].value ;
  var reasDoc = reasOut['Reasoner output'].properties;
  var reasonerTable = new Object();
  //var statusObj = resObj['status']
  if(result.status >= 200 && result.status && resObj)
  {
   //Input is the list of all the rules
   // reasoner Table - object with conclusion, rules needed and statements to populate
   // the reasoner Grid.
   getReasonerTable(reasDoc.Rules.items, reasDoc.FinalCall) ;
  }
  else
  {
    alert("ERROR", "API failed to get the reasoner output " + result.status + ", " + result.responseText);
  }
}


// this renders the tabs
// based on the global variable grids that is filled by now is
// used here to filter(if no evidence or has no tags tabs are hidden, if showgrids parameter is present)
// this function is called once the last document and the last item in the last document
// is fetched 
function addTabs()
{
  // merge all the grids in the order of source reg
  // evid-guidelines combination with multiple docs are already in the grids var
  // But need to get the order
  var newGrids = [] ;
  var gridsToshow = {};
  var allhidden = false ;
  console.log("Going to add tabs . . .");
  // get the default tab, when all the tabs are inactive.
  var tabcount = 0;


  for(var tabkey in grids)
  {
    if((grids[tabkey].evidence) && (grids[tabkey].hasnotags != true)){}
    else {tabcount++ ;}
  }
  // need a message grid if all the tabs are hidden
  if(tabcount == Object.keys(grids).length) {allhidden = true ;}
  if(showgrids)// filter grids as per the parameter showgrids
  {
    showgrids = showgrids.split(",") ;
    for(var ii=0; ii<showgrids.length; ii++)
    {
      gridsToshow[showgrids[ii]]  = true ;
    }
    // show the ones that are in show grids only and its multiples
    for(var ii=0; ii<gridNames.length; ii++)
    {
      if(gridNames[ii] in gridsToshow) {
        for (var jj=0; jj<gridNamesMap[gridNames[ii]].length ; jj++)
        {
         newGrids.push(gridNamesMap[gridNames[ii]][jj]) ;
         safeStr[gridNamesMap[gridNames[ii]][jj]] = gridNamesMap[gridNames[ii]][jj].replace(/\W/g, '') ;
        }
      }
    }
   
  }
  else
  {
    // all the grids and its multiples
  
    for(var ii=0; ii<gridNames.length; ii++)
    {
      for (var jj=0; jj<gridNamesMap[gridNames[ii]].length ; jj++)
      {
        safeStr[gridNamesMap[gridNames[ii]][jj]] = gridNamesMap[gridNames[ii]][jj].replace(/\W/g, '') ;
        newGrids.push(gridNamesMap[gridNames[ii]][jj]) ;
      }

    }
  }
  gridNames = [] ;
  gridNames = newGrids ;

  


  tags = new Object();
   // Populate the tab first
   var gridtab = Ext.getCmp('multitab') ;
   var activeyet = false ;
   var evTable = getTransformationTable() ;
   var reasGrid = getReasonerPanel() ;
   // grid with no Evidence content
   var hasnoEviGrid = getmessageGrid('noevidence');
   // grid with no tags content message
   var hasnomesGrid = getmessageGrid('hasnotags') ; 

   // grid displayed when all the tabs are inactive by default or in the process
   var allhiddenGrid = getmessageGrid('allhidden');
   // grid with no guideline content
   var noguidesgrid = getmessageGrid('noguide') ;
   // get the first tab content
   var firstTab = gridNames[0] ;
   var firstItems = [] ;
   var firstTab = gridNames[0];

  if((gridNames.length == 0) && (Object.keys(grids).length == 0))
  {
    Ext.Msg.alert("ERROR", "No Evidence Sources found.  None of the Evidence sources in the Source Registry is public and/or user has no access to any of the Evidence sources.") ;
  }
   if(allhidden == true)
   {
      firstItems.push(allhiddenGrid) ;
   }
   else if(grids[firstTab].hasnotags)
   {
     if(grids[firstTab].guideline){updateToHasnotagsState(firstTab, false) ;}
     getTagStore(firstTab, 'html', true) ;
     firstItems.push(hasnomesGrid) ;
     firstItems.push(evTable) ;
   }
   else if(grids[firstTab].evidence)
   {
     if(grids[firstTab].guideline)
     {
       updateToHasEvidenceState(firstTab) ;
       fillReasonerGrid(firstTab) ;
     }
     else
     {
       noguidelineState(firstTab) ;
     }
     getTagStore(firstTab, 'html', false) ;
     viewGrid('html', firstTab);
     firstItems.push(reasGrid);
     firstItems.push(evTable);
   }
   else // no evidence
   {
     updateToHasnoEvidenceState(firstTab) ;
     firstItems.push(hasnoEviGrid) ;
   }
   var tab = gridtab.add({
     title: firstTab,
     id: 'tab'+safeStr[firstTab],
     bodyPadding: 10,
     items: firstItems,
     listeners:{
               activate: function(tab){
                   tags = new Object();
                   var tabName = tab.title ;
                   updateSummaryRow() ;
                   if(grids[tabName].hasnotags)
                   {
                    if(grids[tabName].guideline){updateToHasnotagsState(tabName, false) ;}
                    else{noguidelineState(tabName) ;}
                    getTagStore(tabName, 'html', true) ;
                    tab.add([hasnomesGrid, evTable]);
                   }
                   else if(grids[tabName].evidence)
                   {
                     Ext.getCmp('reasonerGrid').getStore().removeAll() ;
                     getTagStore(tabName, 'html', false) ;
                     viewGrid('html', tabName) ;
                     if(grids[tabName].guideline)
                     {
                       updateToHasEvidenceState(tabName) ;
                       fillReasonerGrid(tabName) ;
                       tab.add([reasGrid, evTable]) ;
                     }
                     else
                     {
                       noguidelineState(tabName) ;
                       tab.add([noguidesgrid, evTable]) ;
                     }
                   }
                   else // no evidence
                   {
                     updateToHasnoEvidenceState(tabName) ;
                     tab.add([hasnoEviGrid]) ;
                   }
               }
             }
   });
   if(grids[firstTab].evidence && grids[firstTab].hasnotags == false)
   {
     gridtab.setActiveTab(tab) ;
     activeyet = true ;
   }
    for (var ii=1; ii<gridNames.length; ii++)
    {
      var tab = gridtab.add({
             title: gridNames[ii],
             id: 'tab'+safeStr[gridNames[ii]],
             bodyPadding: 10,
             items: [],
             listeners:{
               activate: function(tab){
                   tags = new Object();
                   if(tab.items.length == 0){tab.removeAll()}
                   var tabName = tab.title ;
                    updateSummaryRow() ;
                   if(grids[tabName].hasnotags)
                   {
                    if(grids[tabName].guideline){updateToHasnotagsState(tabName, false) ;}
                    else{noguidelineState(tabName) ;}
                    getTagStore(tabName, 'html', true) ;
                    tab.add([hasnomesGrid, evTable]);
                   }
                   else if(grids[tabName].evidence)
                   {
                     
                     Ext.getCmp('reasonerGrid').getStore().removeAll() ;
                     getTagStore(tabName, 'html', false) ;
                     viewGrid('html', tabName) ;
                     if(grids[tabName].guideline)
                     { 
                       updateToHasEvidenceState(tabName) ;
                       fillReasonerGrid(tabName) ;
                       tab.add([reasGrid, evTable]) ;
                     }
                     else
                     {
                       noguidelineState(tabName) ;
                       tab.add([noguidesgrid, evTable]) ;
                     } 
                   }
                   else // no evidence
                   {
                     updateToHasnoEvidenceState(tabName) ;
                     tab.add([hasnoEviGrid]) ;
                   }
               }
             }
          });
      if(grids[gridNames[ii]].evidence && activeyet == false)
      {
        gridtab.setActiveTab(tab) ;
        activeyet = true ;
      }
    }
 if(Ext.getCmp('tabMask')){ Ext.getCmp('tabMask').destroy() ;}
  // Populate the evidence summary and display grid with the two rows.
  var alStore = Ext.getCmp('summaryGrid').store ;
  var fields = alStore.model.prototype.fields ;
  var sumcols = [] ;
  var firstRow = {};
  var secondRow = {}
   fields.add(Ext.create("Ext.data.Field", {
      name: 'id'
    }));

  var tmp = {};
  var count = 0;
  var hidden = false ;
  tmp.text = "" ;
  tmp.minWidth = 150 ;
  tmp.dataIndex = "id" ;
  sumcols.push(tmp) ;
  firstRow['id'] = '<b>Final Call</b>' ;
  secondRow['id'] = '<b>Toggle Evidence</b>' ;
  // Get the rows and hide/show the tabs too here.
  for(var ii=0; ii<gridNames.length; ii++)
  {
    //if(grids[gridNames[ii]].evidence && grids[gridNames[ii]].hasnotags == true)
    if(grids[gridNames[ii]].evidence)
    {
      firstRow[safeStr[gridNames[ii]]] = grids[gridNames[ii]].conclusion ;
      secondRow[safeStr[gridNames[ii]]] = '<div id="tabicon" align="center"><span id="'+safeStr[gridNames[ii]]+'" class="tohideTab" onclick="toggletab(\'' +safeStr[gridNames[ii]]+'\')">HIDE</span></br></div>' ;
      
    }
    else // no evidence
    {
      firstRow[safeStr[gridNames[ii]]] = grids[gridNames[ii]].conclusion;
      secondRow[safeStr[gridNames[ii]]] = '<div id="tabicon" align="center"><span id="'+safeStr[gridNames[ii]]+'" class="tocreateTab" onclick="toggletab(\'' +safeStr[gridNames[ii]]+'\')">CREATE</span></br></div>' ;
      Ext.getCmp('multitab').child('#tab'+safeStr[gridNames[ii]]).tab.hide();
      count = count+1 ;
    }
    // columns dynamically generated
    tmp = {} ;
    tmp.text = gridNames[ii];
    tmp.minWidth = 100 ;
    tmp.flex = 1;
    tmp.align = 'center' ;
    tmp.dataIndex =  safeStr[gridNames[ii]];
    sumcols.push(tmp) ;


    fields.add(Ext.create("Ext.data.Field", {
      name: safeStr[gridNames[ii]]
    }));

  }
  var data = [] ;
  data.push(firstRow) ;
  data.push(secondRow) ;
  Ext.getCmp('summaryGrid').reconfigure(null, sumcols);
  alStore.loadData(data) ;
  updateSummaryRow() ;
  if(Ext.getCmp('summaryMask')){ Ext.getCmp('summaryMask').destroy() ;}
  // update all the toolbars if no tabs are active
  if(allhidden == true)
  {
    var newEvbutton = Ext.getCmp('newEvDoc') ;
        newEvbutton.disable() ;
        var viewEvbutton = Ext.getCmp('gvEvDoc') ;
        viewEvbutton.disable() ;
        var delEvbutton = Ext.getCmp('delEvDoc') ;
        delEvbutton.disable() ;
        var agButton = Ext.getCmp("gvRefreshButton") ;
        agButton.disable() ;
        var cpButton = Ext.getCmp("copyTgs") ;
        cpButton.disable() ;

  }
  // enable the allele reort once all the tab items are rendered
  trackReasonerGridAndTransTable(500) ;
}


function showCopyTagWindow()
{
  
 var copyStore = getCopyTagStore() ; 
 if(copyStore.length >0)
  {
    var copyForm = new Ext.FormPanel({
    id: 'cpTagForm',
    bodyStyle:'padding:10px 10px 0',
    frame: true,
    labelStyle: 'font-weight:bold;padding:0',
    items: [
            {
              xtype: 'combo',
              name: 'cpTags',
              fieldLabel: 'Copy Tags To ',
              labelStyle: 'font-weight:bold;padding:0',
              store: copyStore,
              width: 350,
              id: 'cpTags',
              displayField: 'value',
              typeAhead: false,
              minChars : 1,
              autoScroll: true,
              forceSelection: true,
              emptyText: 'Choose grid Name ...'
            }] 

    });


    var copyWindow = new Ext.Window({
        width: 500,
        id: 'copyWin',
        title: 'Copy Tags',
        buttonAlign:'center',
        width: 400,
        fieldDefaults: {
            msgTarget: 'side',
            labelWidth: 75
        },
        defaults: {
            anchor: '100%'
        },
        items: [copyForm],
        buttons: [{
            text: 'Copy',
            name:'copy',
            handler: prepareCopy
            },
            {
              text: 'Cancel',
              handler: function(){
                copyForm.getForm().reset(); 
                copyWindow.close(); 
              }
            },
            {
              text:'Reset',
              handler: function(){copyForm.getForm().reset();}
            }]
    });

    copyWindow.show();
   }

   else
   {
    Ext.Msg.alert("ERROR", "Failed to copy tags because of one or more of the following reasons: <ul><li>None of the grids have Evidence documents</li><li>User has no sufficient permissions to access any of the grids</li></ul>") ;

   }
}

function getCopyTagStore()
{
  var cpStore = [];
  // get the evidence and tags of the 'copy from' (active tab) grid
  var activeGrid = Ext.getCmp('multitab').getActiveTab().title ;
  for(var ii=0; ii<gridNames.length; ii++)
  {
    if(grids[gridNames[ii]].evidence && (gridNames[ii] != activeGrid)) // has evidence
    {
      // get the grp resource uri
      var grpUri = getGrpUri(grids[gridNames[ii]].evidence)
      
      //console.log(grpUri + " " +uniquegrpUris[grpUri]) ;
      if(grpUri in uniquegrpUris && (uniquegrpUris[grpUri] == 'administrator' || uniquegrpUris[grpUri] == 'author'))
      {
        cpStore.push(gridNames[ii]) ;
      }
      else
      {
         console.log('No access or permissions to write to the grid ' + gridNames[ii]) ;
      }
    }
  }
 return cpStore ;
}


function prepareCopy()
{
 var formVals = Ext.getCmp('cpTagForm').getForm().getValues();
  var activeGrid = Ext.getCmp('multitab').getActiveTab().title ;
 if(formVals.cpTags)
 {
   // tags must be compatible at both the ends
   if(grids[activeGrid].tags == grids[formVals.cpTags].tags)
   {
     copyTagsFromTo(activeGrid, formVals.cpTags) ;
   }
   else
   {
     Ext.Msg.alert("Error", "Tags failed to match between the grids " +activeGrid+ " and " +formVals.cpTags+".<br>This is not allowed, that is,  tags can be copied over only when both the tags are compatible across the grids. ") ;
   }
 }

 
}

// get roles for each of the grids before the window is displayed

function getRolesandGridstoCopy()
{
  var lastgrid = false ;
  for(var eachgrid in grids)
  {
    //alert(Object.keys(grids).indexOf(eachgrid));
    if(Object.keys(grids).indexOf(eachgrid) == Object.keys(grids).length-1)
    {lastgrid = true ;}
    if(grids[eachgrid].evidence)
    {
      var grpUri = getGrpUri(grids[eachgrid].evidence) ;
      if(!(grpUri in uniquegrpUris))
      {
        uniquegrpUris[grpUri] = null
        getRolefortheGroup(grpUri, lastgrid) ;
      }
      else if(lastgrid == true){ showCopyTagWindow(); }
    }
  }
}
