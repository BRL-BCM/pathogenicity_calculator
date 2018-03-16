function getGrpUri(rsPath)
{
  var grpuri ;
  var firstsplit ;
  if (rsPath.match(/REST/))
  {
          firstsplit = rsPath.split("/REST/v1/grp/") ;
          groupname = firstsplit[1].split("/")[0] ;
          grpuri = firstsplit[0]+'/REST/v1/grp/'+groupname;

  }
  else
    {
       grpuri = null ;
       Ext.Msg.alert("ERROR", "The resource path is not a valid Genboree REST resource path, for the URL: " + rsPath) ; 
    }
  return grpuri;

}


// Source registry success failure functions

function getSourceRegData(result, request)
{
  var srcObj  = JSON.parse(result.responseText) ;
  var makeGrid = result.request.options.params.makeGrid ;
  sourceRegistry = srcObj['data'] ; // global
  // for the calculator page
  if(makeGrid == true){
    makeBigGrid() ;
  }
  else // just get the list of evidence sources the user has access to
  {
//    // global
//    var casubjects = [];
//    for (var csubject in caAlleles){casubjects.push(csubject)};
//    countableEvidenceSources = new Object() ;
//    var evisourceItems = [] ;
//    var guideitems = [];
//    var guideline = [];
//    var evisourcePath ;
//    var lastdocInReg = false ;
//    var lastSourceinDoc = false;
//    // The request is going to be long with respect to the number of canonical allele subjects
//    // from the search. This is for the entry page cache and need specific evidence document id
//    // wrp to the evidence source and guidelines and ca sujects to count
//    for (var ii=0; ii<sourceRegistry.length; ii++)
//    {
//      if(ii == sourceRegistry.length-1){ lastdocInReg = true ;}
//      evisourceItems = sourceRegistry[ii].SourceRegistry.properties.EvidenceSources.items ;
//      for(var jj=0; jj<evisourceItems.length; jj++)
//      {
//      
//        if(jj == evisourceItems.length-1) {lastSourceinDoc = true ;}
//        evisourcePath =  evisourceItems[jj].EvidenceSource.properties.Evidence.value ;
//
//        // get the guidelines associated with the source
//        if(('Guidelines' in evisourceItems[jj].EvidenceSource.properties) && ('items' in evisourceItems[jj].EvidenceSource.properties.Guidelines) && (evisourceItems[jj].EvidenceSource.properties.Guidelines.items.length > 0))
//        {
//          guideitems =  evisourceItems[jj].EvidenceSource.properties.Guidelines.items ;
//          guideline = [];
//          for(var gg=0; gg<guideitems.length; gg++)
//          {
//            guideline.push(guideitems[gg].Guideline.value) ;
//          }
//          
//        }
//        Ext.Ajax.request(
//        {
//           url : '/java-bin/apiCaller.jsp' ,
//            timeout : 90000,
//            method: 'GET',
//            params:
//            {
//              //'/docs?detailed=true&matchProp=Allele%20evidence.Subject&matchValues='+caSub
//              rsrcPath: evisourcePath +'/docs?detailed=false&matchProp=Allele%20evidence.Subject&matchValues='+casubjects,
//              apiMethod : 'GET',
//              lastdoc: lastdocInReg ,
//              lastsource: lastSourceinDoc,
//              guideline : guideline,
//              evSrcPath: evisourcePath
//            },
//            callback : function(opts, success, response)
//            {
//              var apiRespObj  = JSON.parse(response.responseText) ;
//              var collinfo = apiRespObj['data'] ;
//              if(response.status >= 200 && response.status < 400 && collinfo)
//              {
//                for(var cc=0; cc<collinfo.length; cc++)
//                {
//                  var docid =  collinfo[cc]['Allele evidence'].value ;
//	          countableEvidenceSources[response.request.options.params.evSrcPath+'/doc/'+docid] = {};
//                  for (var ss=0; ss<response.request.options.params.guideline.length; ss++)
//                  {
//                    countableEvidenceSources[response.request.options.params.evSrcPath+'/doc/'+docid][response.request.options.params.guideline[ss]] = true ;
//                  }
//                }
//              }
//              // iterates through all the sources
//              if(response.request.options.params.lastdoc == true && response.request.options.params.lastsource == true)
//              {
//                 entryPageInfo(); 
//              }
//            }
//          });
//      }
//    }
  }
}


function displayFailureDialogSource(result, request)
{
  var resObj  = JSON.parse(result.responseText) ;
  var alleleDoc = resObj['data'];
  var statusObj = resObj['status']
  var message = statusObj.msg ;
  var statusCode = statusObj.statusCode ;
  Ext.Msg.alert("ERROR", "Error in getting the source registry documents: " + message+ ", "+ result.status + ", " + result.statusText + " " + statusCode) ;

}



function displayFailureDialogCache(result, request)
{
  var resObj  = JSON.parse(result.responseText) ;
  var alleleDoc = resObj['data'];
  var statusObj = resObj['status']
  var message = statusObj.msg ;
  var statusCode = statusObj.statusCode ;
  Ext.Msg.alert("ERROR", "Error in getting/saving the Conclusion Cache documents: " + message+ ", "+ result.status + ", " + result.statusText + " " + statusCode) ;

}




function updateSummaryRow()
{

  var sumStor = Ext.getCmp('summaryGrid').store ;
  var data = [] ;
  var firstRow = {};
  firstRow['id'] = '<b>Final Call</b>' ;
  for(var ii=0; ii<gridNames.length; ii++)
  {
    if(grids[gridNames[ii]].evidence)
    {
      firstRow[safeStr[gridNames[ii]]] = grids[gridNames[ii]].conclusion ;

    }
    else // no evidence
    {
      firstRow[safeStr[gridNames[ii]]] = grids[gridNames[ii]].conclusion;
    }
  }
  sumStor.removeAt(0) ;
  sumStor.insert(0, firstRow) ;

}




// Get the reasoner output from the cache or else run the resoner job
function fillReasonerGrid(gridName)
{
  // do anything to the reasoner output, run or fill preexising only if guideline is present
  if(grids[gridName].guideline)
  {
    console.log("Should fill or run reasoner for the grid " + gridName) ;
    if((grids[gridName].reasonerOutput) && ('Reasoner output' in grids[gridName].reasonerOutput))
    {
      var reasDoc = grids[gridName].reasonerOutput['Reasoner output'].properties; 
      getReasonerTable(reasDoc.Rules.items, reasDoc.FinalCall) ;
    }
    else 
    {
      console.log(gridName + " About to run the reasoner . . . .");
      runReasonerGrid(gridName) ;

    }
  }
}

function toggletab(gridEl)
{
  var iconCell = document.getElementById(safeStr[gridEl]);
  if(iconCell.classList.contains('toshowTab') || iconCell.classList.contains('tocreateTab'))
  {
    if(iconCell.classList.contains('toshowTab')){iconCell.classList.remove('toshowTab') ;}
    if(iconCell.classList.contains('tocreateTab'))
    {
      iconCell.classList.remove('tocreateTab') ;
      // show the add condition/inheritance function
      var questUrl = grids[gridEl].questionnaire ;
      createNewEvidence(questUrl, caSub) ;    
    }
    Ext.getCmp('multitab').child('#tab'+safeStr[gridEl]).tab.show();
    Ext.getCmp('multitab').setActiveTab('tab'+safeStr[gridEl]) ;
    iconCell.classList.add("tohideTab") ;
    iconCell.innerHTML = "HIDE" ;
    if(safeStr[gridEl] == safeStr[gridNames[0]])
     {
       var ftab = Ext.getCmp('tab'+safeStr[gridEl]) ;
       if(ftab.items.length >=1)
       {
         if(ftab.items.keys[0] == 'allhidden'){ftab.remove(Ext.getCmp('allhidden'), false) ;}
       }
       if(grids[gridNames[0]].hasnotags)
       {
         if(grids[gridNames[0]].guideline){updateToHasnotagsState(gridNames[0], false) ;}
         getTagStore(gridNames[0], 'html', true) ;
         ftab.add([Ext.getCmp('hasnomes'), Ext.getCmp('htmltable')]) ;
       }
       else if(grids[gridNames[0]].evidence)
       {

         if(grids[gridNames[0]].guideline)
         {
           updateToHasEvidenceState(gridNames[0]) ;
           fillReasonerGrid(gridNames[0]) ;
         }
        else
        {
         noguidelineState(gridNames[0]) ;
        }
        getTagStore(gridNames[0], 'html', false) ;
        viewGrid('html', gridNames[0]);
        ftab.add([Ext.getCmp('reasonerGrid'), Ext.getCmp('htmltable')]) ;
       }
       else // no evidence
       {
         updateToHasnoEvidenceState(gridNames[0]) ;
         ftab.add([Ext.getCmp('noevimes')]) ;
       }
     }
  }
  else if(iconCell.classList.contains('tohideTab'))
  {
    iconCell.classList.remove('tohideTab') ;
    Ext.getCmp('multitab').child('#tab'+safeStr[gridEl]).tab.hide();
    // add the right tab class - either show or create
      var tabOfInt;
     for(var key in safeStr){ if(safeStr[gridEl] == safeStr[key]){tabOfInt = key ;} }

     if( grids[tabOfInt].evidence)
     {
       iconCell.classList.add("toshowTab") ;
       iconCell.innerHTML = "SHOW" ;
     }
     else
     {
       iconCell.classList.add("tocreateTab") ;
       iconCell.innerHTML = "CREATE" ;

     }
   // Once the current tab is hidden set the active tab to be the next one 
   for(var ii=0; ii<gridNames.length; ii++)
     {
      cell = document.getElementById(safeStr[gridNames[ii]]);
      if(cell.classList.contains('tohideTab')){Ext.getCmp('multitab').setActiveTab('tab'+safeStr[gridNames[ii]]) ; break}
     }
   // if all the tabs are inactive show the one to be with hidden message
   var cell ;
   count = 0;
   for(var ii=0; ii<gridNames.length; ii++)
   {
    cell = document.getElementById(safeStr[gridNames[ii]]);
    if(cell.classList.contains('toshowTab') || cell.classList.contains('tocreateTab')){count = count+1}

   }
   if(count == gridNames.length)
   {
     if(count == gridNames.length){Ext.getCmp('multitab').setActiveTab('tab'+safeStr[gridNames[0]])}
     var newEvbutton = Ext.getCmp('newEvDoc') ;
     newEvbutton.disable() ;
     var editEvbutton = Ext.getCmp('editEvDoc') ;
     editEvbutton.disable() ;
     var viewEvbutton = Ext.getCmp('gvEvDoc') ;
     viewEvbutton.disable() ;
     var delEvbutton = Ext.getCmp('delEvDoc') ;
     delEvbutton.disable() ;
     var agButton = Ext.getCmp("gvRefreshButton") ;
     agButton.disable() ;
     var cpButton = Ext.getCmp("copyTgs") ;
     cpButton.disable() ;
     var ftab = Ext.getCmp('tab'+safeStr[gridNames[0]]) ;
     console.log(ftab) ;
     if(grids[gridNames[0]].hasnotags)
     {
       ftab.remove(Ext.getCmp('hasnomes'), false);
       ftab.remove(Ext.getCmp('htmltable'), false);
       ftab.add([Ext.getCmp('allhidden')]);
     }
     else if(grids[gridNames[0]].evidence)
     {
       ftab.remove(Ext.getCmp('reasonerGrid'), false);
       ftab.remove(Ext.getCmp('htmltable'), false);
       ftab.add([Ext.getCmp('allhidden')]);

     }
     else
     {
        ftab.remove(Ext.getCmp('noevimes'), false);
       ftab.add([Ext.getCmp('allhidden')]);

     }
   }
  }

}


function evCacheSuccess(result, request)
{
  //Ext.Msg.alert("SUCCESS", "Evidence cache saved for the canonical subject, <u>" +ca+ "</u>.") ;
}



function evCacheFailed(result, request)
{

  var resObj  = JSON.parse(result.responseText) ;
  var alleleDoc = resObj['data'];
  var statusObj = resObj['status']
  var message = statusObj.msg ;
  var statusCode = statusObj.statusCode ;
  Ext.Msg.alert("ERROR", "Error in saving the Evidence Cache documents: " + message+ ", "+ result.status + ", " + result.statusText + " " + statusCode) ;

}



function displayFailureDialogAllele(result, request)
{
  var resObj  = JSON.parse(result.responseText) ;
  var alleleDoc = resObj['data'];
  var statusObj = resObj['status']
  var message = statusObj.msg ;
  var statusCode = statusObj.statusCode ;
  Ext.Msg.alert("ERROR", "Error in getting the allele document: " + message+ ", "+ result.status + ", " + result.statusText + " " + statusCode) ;
}

function displayFailureDialogSave(result, request)
{
  var resObj  = JSON.parse(result.responseText) ;
  var alleleDoc = resObj['data'];
  var statusObj = resObj['status']
  var message = statusObj.msg ;
  var statusCode = statusObj.statusCode ;
  Ext.Msg.alert("ERROR", "Error in saving the evidence document: " + message+ ", "+ result.status + ", " + result.statusText + " " + statusCode) ;
}

function displayFailureDialogReasoner(result, request)
{

  var resObj  = JSON.parse(result.responseText) ;
  var alleleDoc = resObj['data'];
  var statusObj = resObj['status']
  var message = statusObj.msg ;
  var statusCode = statusObj.statusCode ;
  var diagMsg ;
  if(message.match(/INSUFFICIENT DATA/))
  {
    // update the tab to hasnotags state
    var activetab = Ext.getCmp('multitab').getActiveTab().title ;
    updateToHasnotagsState(activetab, true) ;
    diagMsg = "There is a problem with the Evidence doc for this allele:<ul class=\"gbDialogList\"><li>It does not have ANY evidence tag properties.</li><li>Therefore, the Pathogenicity Evidence table cannot be created. </li><li>In turn that table cannot be fed to the Guidelines Reasoner.</li><ul><br>&nbsp;<br> This interface currently displays an empty grid and can be used to add evidences to your Evidence doc.<br>&nbsp;<br>You may wish to use the <code>View Evidence Doc</code> button to review the underlying Evidence doc."
  }
  else
  {
    diagMsg = "Error in running the reasoner. API returned &quot;" + status + " " + result.statusCode + "&quot; the following detailed error message as explanation:<br>&nbsp;<br>" + message ;
  }
  Ext.Msg.alert("ERROR", diagMsg) ;
}

// Function after saving tags to an evidence document

function displaySaveDialog(result, request)
{
  var change = result.request.options.params.changeCls ;
  var cellId = result.request.options.params.cellId ;
  var grname = result.request.options.params.grname ;
  var refreshTableOnly = result.request.options.params.refreshTableOnly ;
  if(refreshTableOnly)
  {
    if(Ext.getCmp('eviWin')){
      Ext.getCmp('eviWin').close();
    }
    var curttab = Ext.getCmp('tab'+safeStr[grname]) ;
    curttab.add(getTagsLabelTable()) ;
    viewGrid('html', grname);
    Ext.Msg.alert("SUCCESS", "Edits to the Evidences are successfuly saved.") ;
  }
  else
  {
    var reaGrid = Ext.getCmp('reasonerGrid') ;
    var evTable = Ext.getCmp('htmltable') ;
    var hasnoGrid = Ext.getCmp('hasnomes');
    // if the document is saved after deletion of al the tags
    // need a param to record the hasnotags
    var hasnotagsInfo = result.request.options.params.tagsinfo ;
    if(change){
      var cellObj =  document.getElementById(cellId) ;
      cellObj.classList.remove("gb-dataCell-invalidCount") ;
      cellObj.classList.add("gb-dataCell-invalid") ;
    }
    if(Ext.getCmp('cellWindow')){Ext.getCmp('cellWindow').close(); }
    if(Ext.getCmp('tagLinkWindow') && result.request.options.params.close){Ext.getCmp('tagLinkWindow').close(); }
    // Need to update the links count in the existing grid.
    // Set the new record only if the document save is successful
    if(Ext.getCmp('tagAndLinks')){
      data = [] ;
      Ext.getCmp('tagAndLinks').store.each(function(rec)
      {
         var tag = rec.get('tag') ;
         var tagPresent =  rec.get('tagPresent') ;
         console.log(tag) ;
         if(tagPresent && tag in subjectsData && 'Links' in subjectsData[tag]['Tag']['properties']) {
           console.log(tag) ;
           console.log(subjectsData[tag]) ;
           { rec.set('numLinks', subjectsData[rec.get('tag')]['Tag']['properties']['Links']['value'] ) ;}
         }
         else if(tag in subjectsData)
         {
           delete subjectsData[tag] ;
           rec.set('numLinks', 0); 
         }
      }) ;
      Ext.getCmp('tagAndLinks').getView().refresh();
     } ;
    // update the grid variable
    // deactivate the grid hasnotags
    if(hasnotagsInfo)
    {
      grids[grname].hasnotags = true ;
      grids[grname].conclusion = 'Undetermined' ;
      var curttab = Ext.getCmp('tab'+safeStr[grname]) ;
      if(curttab.items.keys[0] == 'reasonerGrid')
      {
        curttab.remove(Ext.getCmp('reasonerGrid'), false) ;
      }
      getTagStore(grname, 'html', true) ;
      curttab.add([hasnoGrid, evTable]);
      updateSummaryRow() ; 
      getEviVersion(grname, null, true) ;
    }
    else // has tags
    {
      Ext.getCmp('reasonerGrid').getStore().removeAll() ;
      grids[grname].hasnotags = false ;
      var curttab = Ext.getCmp('tab'+safeStr[grname]) ;
      // remove the hasnotags message item from the tab 
      if(curttab.items.keys[0] == 'hasnomes')
      {
        curttab.remove(Ext.getCmp('hasnomes'), false) ;
      }
      viewGrid('html', grname);  
      if(grids[grname].guideline) 
      {
        // run reasoner only if it has tags and guideline
        // conclusion will be updated after the reaoner is run
        runReasonerGrid(grname) ;
        curttab.add([reaGrid, evTable, getTagsLabelTable()]) ;
      }
      else
      {
        var noguideGrid = getmessageGrid('noguide') ;
        curttab.add([noguideGrid, evTable, getTagsLabelTable()]) ;
      }
      updateTagsLabelTable() ;
    }
    Ext.Msg.alert("SUCCESS", "Evidence saved") ;
  }
  
}


function successcopiedTags(result, request)
{
  var copiedtab = result.request.options.params.copyn ;
  Ext.getCmp('copyWin').close() ;
  grids[copiedtab].hasnotags = false ;
  viewGrid('html', copiedtab);
  runReasonerGrid(copiedtab) ;
  Ext.getCmp('multitab').setActiveTab('tab'+safeStr[copiedtab]) ;
  Ext.Msg.alert("SUCCESS", "Tags are successfully copied to the grid "+copiedtab) ;
}
function displayFailurecopiedTags(result, request)
{
  Ext.getCmp('copyWin').close() ;
  var resObj  = JSON.parse(result.responseText) ;
  var statusObj = resObj['status']
  var message = statusObj.msg ;
  var copiedtab = result.request.options.params.copyn
  Ext.Msg.alert("ERROR", "Error in saving the evidence document: "+grids[copiedtab].evidence+'. <br> DETAILS:' + message+ ", "+ result.status + ", " + result.statusText) ;
}


function deleteEvDoc(result, request)
{
  var resObj  = JSON.parse(result.responseText) ;
  var gridname = result.request.options.params.gridname ;
  grids[gridname].evidence = null ;
  grids[gridname].conclusion = "" ;
  grids[gridname].hasnotags = undefined ;
  gridEl = safeStr[gridname] ; 
  var ftab = Ext.getCmp('tab'+gridEl) ;
  if(ftab.items.keys[0] == 'hasnomes'){ftab.remove(Ext.getCmp('hasnomes'), false) ;}
  else if (ftab.items.keys[0] == 'reasonerGrid'){ftab.remove(Ext.getCmp('reasonerGrid'), false) ; }
  ftab.remove(Ext.getCmp('htmltable'), false) ;
  ftab.add([Ext.getCmp('noevimes')]) ;
  updateToHasnoEvidenceState(gridname) ;
  ftab.remove(Ext.getCmp("tagsLabelTable"), false) ;
  ftab.remove(Ext.getCmp("phenoAndMOITable"), false) ;
  Ext.Msg.alert("SUCCESS", "Evidence Document: is successfully deleted" );

}


function  displayFailureDialogEvDocDelete(result, request)
{
 var resObj  = JSON.parse(result.responseText) ;
 var statusObj = resObj['status']
  var message = statusObj.msg ;
  Ext.Msg.alert("ERROR", "Error in deleting the evidence document. <br> DETAILS: "+ message+ ", "+ result.status + ", " + result.statusText) ;

}

function displaySaveLinksDialog(result, request)
{
  var path = result.request.options.params.parpath ;
  var selTag = result.request.options.params.lTag ;
  var tbname = result.request.options.params.tbname ;
  Ext.getCmp('linkWindow').close();
  updateSummaryRow() ;
  viewGrid('html', tbname) ;
  // get the new version of the evidence document and update the cache(both - conclusion and evidence cache)
  getEviVersion(tbname, null, true) ;
  Ext.Msg.alert("SUCCESS", "Links saved for the tag, <u>" +selTag+ "</u>.") ;
}





function makeEvobj()
{
  var evObj = {}
        evObj['Evidence Doc'] =  {} ;
        evObj['Evidence Doc'].value =  null;
        evObj['Evidence Doc'].properties = {} ;
        evObj['Evidence Doc'].properties.FinalCalls = {} ;
        evObj['Evidence Doc'].properties.FinalCalls.value = null ;
        evObj['Evidence Doc'].properties.FinalCalls.items = [] ;
  return evObj ;

}


function makeGuidelineObj()
{
        gObj = {}
        gObj.Guideline= {}
        gObj.Guideline.value = null ;
        gObj.Guideline.properties = {}
        gObj.Guideline.properties.type = {}
        gObj.Guideline.properties.type.value = null ;
        gObj.Guideline.properties.FinalCall = {}
        gObj.Guideline.properties.FinalCall.value = null ;
        gObj.Guideline.properties.Version = {}
        gObj.Guideline.properties.Version.value = null ;
  return gObj ;
}

// updates all the states and cache documents when
// there are no tags for the evidence document
// Tags may not be there a) when a new evidence document is created b) when all existing tags are removed
// gridID is the name of the active tab (active grid) key of the global variable grids
function updateToHasnotagsState(gridID, updatecache)
{
  // set has no tags to true
  grids[gridID].hasnotags = true ;

  // conclusion is undetermined - no tags
  grids[gridID].conclusion = 'Undetermined' ;

  // update the rasoner output, tags amy have been removed
  grids[gridID].reasonerOutput = {} ;

  updateSummaryRow() ; 
  // update the summary row

  // update the version of the grid[gridID].version by fetching the version and
  // then, update both the conclusion and evidence cache
  if(updatecache)
  {
    getEviVersion(gridID, null, true) ;
  }
  else
  {
   getEviVersion(gridID, null, null) ;
  }
   updateSummaryRow() ;  

  // update the toolbars button
  // cannot run the reasoner
  var agButton = Ext.getCmp("gvRefreshButton") ;
  agButton.disable() ;
 
  var cpButton = Ext.getCmp("copyTgs") ;
  cpButton.disable() ;

  // need to make a new doc? may be not
  var newEvButton = Ext.getCmp("newEvDoc") ;
  newEvButton.disable() ;

  var editEvButton = Ext.getCmp("editEvDoc") ;
  editEvButton.enable() ;

  var viewEvbutton = Ext.getCmp('gvEvDoc') ;
  viewEvbutton.enable() ;

  var delEvbutton = Ext.getCmp('delEvDoc') ;
  delEvbutton.enable() ;
}

function updateToHasnoEvidenceState(gridID)
{

  // conclusion is an emptyString - evidence
  grids[gridID].conclusion = '' ;

  updateSummaryRow() ;

  
  // update the toolbars button
  // cannot run the reasoner
  var agButton = Ext.getCmp("gvRefreshButton") ;
  agButton.disable() ;

  var cpButton = Ext.getCmp("copyTgs") ;
  cpButton.disable() ;

  // cannot view the evidence doc
  var viewEvbutton = Ext.getCmp('gvEvDoc') ;
  viewEvbutton.disable() ;

  var delEvbutton = Ext.getCmp('delEvDoc') ;
  delEvbutton.disable() ;
   var evButton = Ext.getCmp('editEvDoc') ;
  evButton.disable() ;
  // Create new evidence is activated
  var crButton = Ext.getCmp('newEvDoc') ;
  if(isPublic == true || isPublic == 'true')
  { crButton.disable() ;} 
  else
  {crButton.enable() ;}

}

function updateToHasEvidenceState(gridID)
{
  // update the rows
  updateSummaryRow() ;
  var agButton = Ext.getCmp("gvRefreshButton") ;
  agButton.enable() ;

  var cpButton = Ext.getCmp("copyTgs") ;
  cpButton.enable() ;


  // enable view document
  var viewEvbutton = Ext.getCmp('gvEvDoc') ;
  viewEvbutton.enable() ;

  var delEvbutton = Ext.getCmp('delEvDoc') ;
  delEvbutton.enable() ;

 // disable create button
  var crButton = Ext.getCmp('newEvDoc') ;
  crButton.disable() ;
  
  var evButton = Ext.getCmp('editEvDoc') ;
  evButton.enable() ;


}

function getmessageGrid(type)
{
  var mesGrid ;
  var mes;
  var collap = false ;
  // make specific messages based on the states - has no tags or no evidence doc
  if(type == 'hasnotags')
  {
   //Add evidence tags in the "Pathogenicity Evidence" table below. Most cells in the table below is click-able. Also, the row headers in left most column (e.g. Population data) is click-able. When clicked it will show all possible tags in the row.
   //Once tags are added, this message will go away and show assertion generated by calculator.
    mes = '<div class="message"><span>Add evidence tags in the &quot;Pathogenicity Evidence&quot; table below.<br> Most cells in the table below is click-able. Also, the row headers in left most column (e.g. Population data) is click-able. When clicked it will show all possible tags in the row.<br> </span></div>' ;
   title = 'No Tags' ;
   iid = 'hasnomes' ;
  }
  else if(type == 'noevidence')
  {
    mes = '<div class="message"><span>No Evidence for the tab.<br> Use the <b>Add Condition/Inheritance</b> button to make new evidence document.<br> Creating new evidence document will activate the "Guidelines - Conclusions" table.</span></div>' ;
   title = 'No Evidence';
   iid = 'noevimes';
  }
  else if(type == 'noguide')
  {
    mes = '<div class="message"><span>No GuideLine for the tab.<br> Hence, no conclusions can be derived from the Evidence</span></div>' ;
    title = 'No Guideline' ;
    iid = 'noguidelines' ;
    collap = false ;
  }
  else if(type == 'allhidden')
  {
    mes = '<div class="message"><span>No tabs are currenlty active.<br>Click the <b>Toggle Evidence</b> icon on <u>Evidence Summary & Display</u> Panel to activate a tab.</span></div>' ;
    title = 'No Active Tabs';
    iid = 'allhidden';
    mesGrid = new Ext.panel.Panel(
    {
      height: 290,
      id : iid,
      //width: 890,
      forceFit: true,
      html: mes,
      border: false
    });
  }
  if(type == 'hasnotags' || type == 'noevidence' || type == 'noguide') 
    {
       mesGrid = new Ext.panel.Panel(
       {
        height: 290,
        id : iid,
        title:  title,
        //width: 890,
        forceFit: true,
        html: mes, 
        border: false,
        collapsible: true,
       collapsed: collap
      });
    }
    

  return mesGrid ;

}



function noguidelineState(gridID)
{
  grids[gridID].conclusion = 'Undetermined' ;
  grids[gridID].reasonerOutput = {} ;

  if(grids[gridID].hasnotags == true)
  {
    updateToHasnotagsState(gridID) ;
  }
  else if(grids[gridID].evidence)
  {
    updateToHasEvidenceState(gridID); 
  }
  else // no evidence
  {
    updateToHasnoEvidenceState(gridID)
  }
  var agButton = Ext.getCmp("gvRefreshButton") ;
  agButton.disable() ;
  Ext.getCmp('reasonerGrid').getStore().removeAll() ;
}



function getCachecounts(docInfo, calist)

{
  var subcalleles = new Object() ;
  if(calist)
  {for(var jj=0; jj<calist.length; jj++)
  {
    subcalleles[calist[jj]] = caAlleles[calist[jj]] ;
  }}
  var totalcas = Object.keys(caAlleles).length ;
  var matchedSubs = new Object () ;
  var acmgConclusions = ['Benign', 'Likely Benign', 'Benign - Stand Alone','Pathogenic','Likely Pathogenic','Uncertain Significance - Conflicting Evidence','Uncertain Significance - Insufficient Evidence','Undetermined'] ;
  var acmgcon  =  {} ;
  for(var ii=0; ii < acmgConclusions.length; ii++){ acmgcon[acmgConclusions[ii]] = 0 ;}
  var entrypageStore  = [] ;
  var entryHash = {};
  if(registerAllele && registerAllele == "true")
  {
    var csubject = alleleSorted[0] ;
    entryHash[csubject] = {} ;
    entryHash[csubject].alleleID = csubject.split("/").pop() ;
    entryHash[csubject].numDocs = 0 ;
    entryHash[csubject].totalDoc = 0 ;
    entryHash[csubject].nonacmg = 0;
    for(var ii=0; ii < acmgConclusions.length; ii++){ entryHash[csubject][acmgConclusions[ii]] = 0 ;}
    matchedSubs[csubject] = true ;
  }
  else
  {  
    for(var dd=0; dd<docInfo.length; dd++)
    {
      var csubject = docInfo[dd].EvidenceCacheID.properties.CanonicalAllele.value ;
      if(csubject in entryHash) {}
      else
      {
        entryHash[csubject] = {} ;
        entryHash[csubject].alleleID = csubject.split("/").pop() ;
        entryHash[csubject].numDocs = 0 ;
        entryHash[csubject].totalDoc = 0 ;
        entryHash[csubject].nonacmg = 0;
        for(var ii=0; ii < acmgConclusions.length; ii++){ entryHash[csubject][acmgConclusions[ii]] = 0 ;}
        matchedSubs[csubject] = true ;
        // skip the cache docs!! revisit subject already present with that hgvs reggistered
      }
      var evidencepath = docInfo[dd].EvidenceCacheID.properties['Evidence Doc'].value ;
      var guidelinePath = docInfo[dd].EvidenceCacheID.properties.Guideline.value ;
      var finalcall = docInfo[dd].EvidenceCacheID.properties.FinalCall.value ;
      if('Type' in docInfo[dd].EvidenceCacheID.properties) {var type = docInfo[dd].EvidenceCacheID.properties.Type.value ;}
      else {var type = 'Other' ;}
      if(evidencepath in countableEvidenceSources )
      {
        if(guidelinePath in countableEvidenceSources[evidencepath])
        {
           // If the guideline is not ACMG AND if the conclusion not in predefined ACMG conclusions, then the conclusion is counted as non acmg.
           if((type == 'ACMG') && (finalcall in acmgcon)){ entryHash[csubject][finalcall]++ ;}
           else { entryHash[csubject].nonacmg++ ;}
           entryHash[csubject].totalDoc++;
        }
        else if(Object.keys(countableEvidenceSources[evidencepath]).length == 0) // no guideline
        {
          entryHash[csubject].nonacmg++ ;
          entryHash[csubject].totalDoc++ ;
        }
      }
    }
   }
   for(var cckey in entryHash)
   {
     var rowdata = [] ;
     rowdata.push(entryHash[cckey].alleleID) ;
    rowdata.push(cckey) ;
    if(entryHash[cckey].totalDoc > 0 ){rowdata.push(entryHash[cckey].totalDoc); }
    else{ rowdata.push(null) ;}
    for(var rr=0; rr<acmgConclusions.length; rr++) {
      if(entryHash[cckey][acmgConclusions[rr]] > 0) rowdata.push(entryHash[cckey][acmgConclusions[rr]]) ;
      else rowdata.push(null) ;
    }
    if(entryHash[cckey].nonacmg > 0)rowdata.push(entryHash[cckey].nonacmg) ;
    else rowdata.push(null) ;
    entrypageStore.push(rowdata) ;
  }
  var checkalleles ;
  if(subcalleles){checkalleles = subcalleles;}
  else{checkalleles = caAlleles ;}
  for(var cakey in checkalleles)
  {
    if(!(cakey in matchedSubs) && (cakey != 'dummydoc')) {entrypageStore.push([caAlleles[cakey].CA, cakey, null, null, null, null, null, null, null, null, null, null])}
  }
  // sort
  entrypageStore  = entrypageStore.sort(function(a, b) {
    return a[0].localeCompare(b[0]);
})
  var entryStore = Ext.getCmp('gvGrid').store ;
  entryStore.loadData(entrypageStore) ;
  if(Ext.getCmp('entryMask')){Ext.getCmp('entryMask').destroy() ;}
  if(entrypageStore.length == 0) {
  var displayText = '<div class="grid-data-empty"><p>No Records to display on the dashboard. It is likely that the user logged in for the first time or no record matched your search.</p><p>The best way to start is to go through the <a class="usecase" href="https://docs.google.com/presentation/d/1icluFBNmv2pXZZRurt3k7QnqdtUrMQC9bc8Zx2k75Co/edit#slide=id.g11f1d3f755_0_75" target="_blank">usecase</a>.<br>Otherwise, select <i>HGVS</i> from the <u>Search</u> option in the menu and search for &quot;NC_000009.12:g.99128694T>G&quot;.<br>Once you see results in the dashboard click on the <i>calculator</i> icon in the second column</p></div>' ;
    Ext.getCmp('gvGrid').getView().emptyText = displayText ;
    //setting height in div class not working
    Ext.getCmp('gvGrid').setHeight(500) ;
    Ext.getCmp('gvGrid').getView().refresh();
  }

}


function getReasonerPanel()
{
  // store for the reasoner grid
  var reasonerStore = new Ext.data.SimpleStore(
    {
      fields:
      [
        { name : 'conclusion' },
        { name : 'rulesNeeded' },
        { name : 'ruleStatement' },
        { name : 'ruleHighlight' },
        { name : 'type'}
      ],
      groupField: 'type'
    }) ;


  var grouping = Ext.create('Ext.grid.feature.Grouping',{
    startCollapsed: false,
    //groupHeaderTpl: '{name} Conditions ({rows.length} Item{[values.rows.length > 1 ? "s" : ""]})'
    groupHeaderTpl: [
            '<div>{name:this.formatName}</div>',
               {
                formatName: function(name) {
                       if(name == "UnMet"){var ne = "Assertion(s) Requiring Additional Evidence" ;}
                       else{var ne = "Assertion(s) Reached" ;}
                       return ne;
                   }
                }
      ]

  });
  var reasonerGrid = new Ext.grid.GridPanel(
    {
      finalClaim: null,
      finalText: null,
      id: 'reasonerGrid',
      title : 'Guidelines - Conclusions',
      tip: "Summarizes the results of applying the Guidelines to the current version of the Evidence doc.<ul class='gb-tip'><li>Guideline rules which are met will be <span class='gb-text-ruleHilite'>highlighted</span>.</li><li>UNmet guideline rules will indicate the minimum amount of additional evidence needed to satisfy.</li><li>If <i>no</i> rules are met, the conclusion is uncertain.</li></ul>",
      listeners: {
          afterrender: function(cmp, listeners) {
            Ext.tip.QuickTipManager.register({ target : cmp.header.id, title: cmp.title, text: cmp.tip, dismissDelay: 15000, width: 350 })
          }
      },
      height: 300,
      //width: 890,
      margin: "0 0 15px 0",
      collapsible: true,
      collapsed: false,
      useArrows: true,
      autoScroll: true,
      features: [grouping],
      store: reasonerStore,
      columns:
      [
        {
          id: 'conclusion',
          text: 'Conclusion',
          tip: "Conclusion indicated by the Guidelines <i>if at least one rule</i> for that conclusion is met.<br><span class='gb-tip-footnote'>(Click arrow on the right to sort this column.)</span>",
          listeners: {
            afterrender: function(cmp, listeners) {
              Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip, dismissDelay: 10000, width: 250 })
            }
          },
          dataIndex: 'conclusion',
          
          renderer: function(value, meta, rec, rowIndex, colIndex, store)
          {
            if(value == reasonerGrid.finalClaim)
            {
              meta.tdAttr = 'data-qwidth="300" data-qtip="<b>'+value+'</b><br><br>'+reasonerGrid.finalText+'"' ;
             //rec.set('conclusion', '<span class="gb-final-claim">'+value+'</span>') ;
              //rec.commit() ;
             return '<span class="gb-final-claim">'+value+'</span>' ;
            }
           else {return value ; }
         },

          minWidth: 310,
          flex: 4,
          sortable: true,
          tdCls: 'x-change-cell gb-cell-conclusion'
        },
        {
          id: 'rulesNeeded',
          text: 'Conditions',
          tip: "Minimum number of additional conditions needing to be satisfied in order to reach the conclusion to the left.<br>&nbsp;<br>Note that there may be <u>many</u> rules for this conclusions&mdash;ones needing a larger number of satsified conditions are not shown.<br>&nbsp;<br> &quot;<span class='gb-cond-unmet'>*</span>&quot; indicates <i>too much evidence</i> and <i>unmet</i> conditions are present to correctly satisfy the conditions of the rule.<br>&nbsp;<br> &quot;<span class='gb-cond-over-met'>0<sup>+</sup></span>&quot; indicates too much evidence is present and only partial evidence is used to correctly satisfy the rule.<br>&nbsp;<br><span class='gb-tip-footnote'>(Click arrow on the right to sort this column.)</span>",
          listeners: {
            afterrender: function(cmp, listeners) {
              Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip, dismissDelay: 10000, width: 350 })
            }
          },
          dataIndex: 'rulesNeeded',
          renderer: function(value, meta, rec, rowIndex, colIndex, store)
          {
            var cellvalue = rec.get('rulesNeeded');
            var cString = cellvalue.toString();
            if(value == 0)
            {
              meta.tdAttr = 'data-qwidth="300" data-qtip="&quot;0&quot; indicates <i> exact evidence</i> is present to correctly satisfy the rule"' ;
              return '<span class="gb-cond-met">0</span>'
            }
            else if(cString.match(/^[0-9]+\.[0-9]+$/) && value > 1)
            {
             meta.tdAttr = 'data-qwidth="300" data-qtip="&quot;*&quot; indicates <i>too much evidence</i> and <i>unmet</i> conditions are present to correctly satisfy the rule"' ;
             return '<span class="gb-cond-over-unmet">*</span>' ;
            }
           else if(cString.match(/^[0-9]+\.[0-9]+$/))
           {
             meta.tdAttr = 'data-qwidth="300" data-qtip="&quot;0<sup>+</sup>&quot; indicates too much evidence is present and only partial evidence is used to correctly satisfy the rule"' ;
             return '<span class="gb-cond-met">0<sup>+</sup></span>' ;
           }
           else
           {
             meta.tdAttr = 'data-qwidth="300" data-qtip= "&quot;'+value+'&quot; indicates the rule needs '+value+' <i>more evidence</i> to be satisfied"' ;
             return '<span class="gb-cond-unmet">'+value+'</span>' ;
           }
         },
         align: 'center',
         minWidth: 110,
         flex: 2,
         sortable: false,
         tdCls: 'x-change-cell'
        },
        {
          id: 'ruleStatement',
          text: 'Rules',
          tip: "To reach the conclusion on the left, <i>at least one of its rules</i> must be met. Conclusions can have <u>many</u> rules.<br>&nbsp;<br>Listed here (1 per line) are all the rules having the <i>minimum number of unmet conditions</i>.<br><span class='gb-tip-footnote'>(Click arrow on the right to sort this column.)</span>",
          listeners: {
            afterrender: function(cmp, listeners) {
              Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip, dismissDelay: 10000, width: 350 })
            }
          },
          dataIndex: 'ruleStatement',
          minWidth: 420,
          flex: 6,
          sortable: true,
          tdCls: 'x-change-cell'
        },
        {
          id: 'ruleHighlight',
          tipTitle: "Highlight Examined Cells",
          tip: "Click the icon to highlight cells in the Pathogenicity Evidence table which can be used to satisfy the conditions of the rule.<br><span class='gb-tip-footnote'>(Click arrow on the right to sort this column.)</span>",
          listeners: {
            afterrender: function(cmp, listeners) {
              Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.tipTitle, text: cmp.tip, dismissDelay: 10000, width: 250 })
            }
          },
          dataIndex: 'ruleHighlight',
          minWidth: 40,
          flex:1,
          sortable: false,
          resizable: false,
          align: "center",
          tdCls: 'x-change-cell gb-icon-col'
        }
      ],
      disableSelection: true,
      viewConfig: {
        forceFit: true,
        overItemCls: '',
        getRowClass: function(record, index) {
          var c = record.get('rulesNeeded');
          var retVal = '' ;
            if(reasonerGrid.finalClaim != null)
            {
              var conclusion = record.get('conclusion') ;
              if((conclusion != "Insufficient Metarules") && (reasonerGrid.finalClaim == conclusion))
              {
                retVal = 'rulesZero' ;
              }
            }
          return retVal ;
        },
        stripeRows : false,
        enableTextSelection: true
      }
    }) ;
  return reasonerGrid ;
}


function getTabToolBar()
{
  var tagMenu = new Ext.menu.Menu({
      id: 'tagMenu',
      items: [
        {
          text: 'Copy/Replace',
          id: 'copyTgs',
          iconCls: "gvcopyTags",
          tooltip: "Copy evidence tags from an active tab to a user chosen tab. Using this option would <i>replace</i> the tags with the new tags.",
          //handler: showCopyTagWindow
          handler: getRolesandGridstoCopy
        }
      ]
    });
  var alleleReportMenu = Ext.menu.Menu({
    id: 'allelemenu',
    items: [
      {
        text: 'View',
        handler: viewDocRender,
        iconCls: "viewreport",
        tooltip : 'View allele report in a new tab'
      },
      {
        text: 'Download',
        hidden: true,
        handler : downloadDocRenderAsPdf,
        iconCls: "downloadreport",
        tooltip : 'Download allele report in pdf format.',
        disabled: alleleRptDownloadEnabled == 'false' || alleleRptDownloadEnabled == false
      }]
  }) ; 
  var evDocMenu = new Ext.menu.Menu({
    id: 'evDocMenu',
    items: [
      {
        text: 'View Evidence Doc',
        id: "gvEvDoc",
        hidden: true,
        tooltip: "View the entire Evidence document in the GenboreeKB UI.<br><span class='gb-tip-footnote'>(Opens in a new browser tab.)</span>",
        iconCls: 'gvEvDoc',
        handler: function() {
          var activeGrid = Ext.getCmp('multitab').getActiveTab().title ;

          var evUrl = grids[activeGrid].evidence ;
          var eviDoc = evUrl.split("/").pop() ;
          var redmineUrl = grids[activeGrid].redminePr ;
          if(redmineUrl)
          {
            if(eviDoc) {redmineUrl =  redmineUrl+ "&doc="+eviDoc+"&docVersion=" ;}
            window.open(redmineUrl, '_blank');
          }
          else
          {
            Ext.Msg.alert("ERROR", 'Cannot view evidence document in the Genboree KB UI as no <i>redmine project</i> property is configured for this tab, '+ activeGrid);
          }

      }
    },
      {
        text: 'Add Condition/Inheritance',
        id: 'newEvDoc',
        tooltip: "Create a new Evidence document by answering a few questions.<br><br> This feature is disabled for a Public page.",
        iconCls: 'newEvDoc',
        handler: function() {
          var activeGrid = Ext.getCmp('multitab').getActiveTab().title ;
          var questUrl = grids[activeGrid].questionnaire ;
          createNewEvidence(questUrl, caSub) ;
        }
      },
      {
        text: 'Edit Condition/Inheritance',
        id: 'editEvDoc',
        tooltip: "Edit the Evidence document by editing the following fields.<br><br> This feature is disabled for a Public page.",
        iconCls: 'newEvDoc',
        handler: function() {
          editEvidence() ;
        }
      },
      {
        text: 'Delete Evidence Doc',
        id: 'delEvDoc',
        tooltip: "Delete an Evidence document.",
        iconCls: 'deleteEvDoc',
        handler: function() {
          Ext.Msg.show({
            title:'Delete Evidence document',
            msg: 'Are you sure you want to delete the evidence document for this allele?',
            buttons: Ext.Msg.YESNOCANCEL,
            icon: Ext.Msg.QUESTION,
            fn: function(buttonId){
              if(buttonId == 'yes'){
                var activeGrid = Ext.getCmp('multitab').getActiveTab().title ;
                deleteEviDocReq(activeGrid) ;
              }
            }
          });
          
        }
      },
      
    ]
  });
  var reaBar = new Ext.Toolbar({
    cls: 'gvToolBar',
    ui: 'overrideDefault', 
    items:[
    {
      text:'Apply Guidelines',
      id: "gvRefreshButton",
      tip: "[Re-]Apply the Guidelines to the stored Evidence doc.<br>&nbsp;<br>Useful if the doc has been updated outside of this interface, or to just verify these are the latest conclusions that can be made.",
      iconCls: 'gvRefresh',
      handler: function(){
          var activeGrid = Ext.getCmp('multitab').getActiveTab().title ;        
          if(grids[activeGrid].guideline){runReasonerGrid(activeGrid) ;} 
          viewGrid('html', activeGrid);
      },
      listeners: {
        afterrender: function(cmp, listeners) {
          Ext.tip.QuickTipManager.register({ target : cmp.id, text: cmp.tip, dismissDelay: 10000, width: 350 })
        }
      }
    },
    {
      text: 'Manage Evidence Doc',
      tooltip: "Create/Delete/View Evidence documents",
      iconCls: 'gvEvDoc',
      menu : evDocMenu 
    },
    
    {

      text:'Copy Tags',
      tooltip: 'Copy Tags across grids. This feature is disabled on a Public Page.',
      menu: tagMenu,
      hidden: true,
      iconCls: "gvcopyTags",
      disabled : !(isPublic != true && isPublic != 'true')
    },
    {
      text: 'Generate Report',
      tooltip: "View/Download allele, evidence and assertion information.",
      iconCls: 'alleleReport',
      hidden: false,
      id: 'allelereport',
      disabled : true,
      menu : alleleReportMenu 
    },
    {
      text: 'ACMG Table',
      tooltip: 'Evidence Tag Help',
      iconCls: 'taghelp',
      handler : function(){
        window.open('http://calculator.clinicalgenome.org/site/cg-grid-guide') ;
      }
    },
     {
      text: 'ClinVar Submission',
      tooltip: 'Make submissions to Clivar Submission Portal',
      iconCls: 'clinvarSubmission',
      handler : function(){
        window.open('https://submit.ncbi.nlm.nih.gov/clinvar/') ;
      }
     }
    ]
  });

  return reaBar ;

}


function getTransformationTable()
{
  var transformedTable = new Ext.panel.Panel(
  {
    id: 'htmltable',
    height: 450,
    //autoHeight: true,
    //width: 890,
    html: '',
    scrollable: true,
    border: false,
    title: 'Pathogenicity Evidence <span class="glyphicon glyphicon-envelope"></span>',
    tip: "Table summarizing the category, strength, and <span class='gb-text-nowrap'>pathogencity-vs-benign</span> Evidence.<ul class='gb-tip'><li><span class='gb-text-invalid'>Grayed cells</span> indicate invalid combinations where evidence <i>should not</i> appear.</li><li>Clicking a white (valid) cell will pop up a dialog showing the evidence tags falling within (if any).</li><li>In the pop-up dialog, you can add or remove tags, and then save the updates to the underlying Evidence doc.</li></ul>",
    listeners: {
      afterrender: function(cmp, listeners) {
        Ext.tip.QuickTipManager.register({ target : cmp.header.id, title: cmp.title, text: cmp.tip, dismissDelay: 15000, width: 350 }) ;
      }
    },
    collapsible: true,
  });
  return transformedTable ;
}

function getPhenoAndMOITable(){
  var phenoAndMOITable ;
  if(Ext.getCmp("phenoAndMOITable")){
    phenoAndMOITable = Ext.getCmp("phenoAndMOITable") ;
  }
  else{
    phenoAndMOITable = new Ext.panel.Panel({
      id: 'phenoAndMOITable',
      height: 50,
      //autoHeight: true,
      //width: 890,
      html: '',
      //hidden: true,
      scrollable: true,
      border: false,
      title: false,
      header: false,
      collapsible: true,
      listeners: {
        afterrender: function(){
          //debugger ;
        }
      }
    });
  }
  return phenoAndMOITable ;
}

function updatePhenoAndMOITable(evdocPath){
  // Get the evidence document
  Ext.Ajax.request(
  {
    url : appPath+'/evidences/all' ,
    timeout : 180000,
    method: "GET",
    params: {
      rsrcPath: evdocPath +'?detailed=true'
    },
    callback: function(opts, success, response)
     {
       var respObj  = JSON.parse(response.responseText) ;
       var respStatus   = respObj['status'] ;
       if(response.status >= 200 && response.status < 400 && response.responseText)
       {
          var evidoc = respObj.data ;
          var moi = evidoc['Allele evidence']['properties']['Subject']['properties']["Mode of inheritance"]["value"] ; 
          var pheno = evidoc['Allele evidence']['properties']['Subject']['properties']["Phenotype"]["value"] ;
          updatePenoAndMOIValue(pheno, moi) ;
       }
       else
       {
         var displayMsg = "The following error was encountered while retrieving the evidence document <br><br>";
         displayMsg += ( "<b>Error Code:</b> <i>" + (respStatus['statusCode'] ? respStatus['statusCode'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" ) ;
         displayMsg += ( "<b>Error Message:</b> <i>" + (respStatus['msg'] ? respStatus['msg'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" );
         displayMsg += "<br><br>Please contact a project admin to resolve this issue." ;
         Ext.Msg.alert("ERROR", displayMsg) ;
       }
     }
  });
}


function updatePenoAndMOIValue(pheno, moi){
  var markup = "<div class=\"current-tags\"><strong>Condition</strong>:" ;
  markup += "<span class=\"label label-info\">" ;
  markup += pheno ;
  markup += "</span>" ;
  markup += "<strong class=\"second\">Mode of Inheritance:</strong>" ;
  markup += "<span class=\"label label-info\">" ;
  markup += moi ;
  markup += "</span>" ;
  markup += "</div>" ;
  Ext.getCmp("phenoAndMOITable").update(markup) ; 
}

function updateTagsLabelTable(){
  // Render the currently used tags
  var currentTags = getAllTagsinHtmlTable() ;
  if(Object.keys(currentTags).length > 0) {
    var markup = "<div class=\"current-tags\"><strong>Tags Applied</strong>:" ;
    var currentTagsList = Object.keys(currentTags) ;
    for(var ii=0; ii<currentTagsList.length; ii++){
      var tag = currentTagsList[ii] ;
      markup += "<span class=\"label label-info\">" ;
      markup += tag ;
      markup += "</span>" ;
    }
    markup += "</div>" ;
    Ext.getCmp("tagsLabelTable").update(markup) ;
    Ext.getCmp("tagsLabelTable").show() ;
  }
}

function getTagsLabelTable(){
  var tagsLabelTable ;
  if(Ext.getCmp("tagsLabelTable")){
    tagsLabelTable = Ext.getCmp("tagsLabelTable") ;
  }
  else{
    tagsLabelTable = new Ext.panel.Panel({
      id: 'tagsLabelTable',
      height: 50,
      //autoHeight: true,
      //width: 890,
      html: '',
      hidden: true,
      scrollable: true,
      border: false,
      title: false,
      header: false,
      collapsible: true,
    });
  }
  return tagsLabelTable ;
}



function getMask(forComp, maskId, maskMsg)
{
  var loadMask;
  loadMask = new Ext.LoadMask(Ext.getCmp(forComp),
            {
              msg: maskMsg,
              id: maskId
            });


  return loadMask ;
}


function getAlleleGrid()
{
  var alleleGrid;
  var alleleStore = new Ext.data.SimpleStore({
    fields:
    [
      { name : 'property' },
      { name : 'value' }
    ]
  }) ;

  // Define the grid for the Allele Registry information
  // using rowexpander as plugin for ca-sa grouping

  Ext.define('allGrid', {
    extend: 'Ext.grid.GridPanel',
    id: 'alleleGrid',
    title: "Allele & Gene Information",
    tip: "Selected information about this allele and gene from the ALLELE REGISTRY doc.",
    listeners:
    {
      afterrender: function(cmp, listeners) {
        Ext.tip.QuickTipManager.register({ target : cmp.header.id, text: cmp.tip, dismissDelay: 6000, width: 250 })
      }
    },
    border : true,
    height: 200,
    //minWidth: 920,
    margin: "0 0 15px 0",
    collapsible: true,
    collapsed: false,
    useArrows: true,
    autoScroll: true,
    disableSelection: true,
    store: alleleStore,
    hideHeaders: true,
    columns:
    [
      {
        id: 'property',
        text: 'Property',
        dataIndex: 'property',
        minWidth: 200,
        flex:1,
        sortable: true,
      },
      {
        id: 'value',
        text: 'Value',
        dataIndex: 'value',
        minWidth: 500,
        flex:5 ,
        sortable: true,
        renderer: function(value, metadata) {
          metadata.style = 'white-space: normal;';
          return value;
       }
      }
    ],
    viewConfig : {
      forceFit: true,
      stripeRows: true,
      enableTextSelection: true
    }
  }) ;
  alleleGrid = Ext.create('allGrid') ;
  return alleleGrid ;

}


function makeEntryGrid(store)
{
  var searchMenu = getsearchMenu() ;
  var etbar =  getEntryToolbar(searchMenu) ;
  Ext.define('entryPageGrid', {
        extend: 'Ext.grid.GridPanel',
        border: true,
        cls: 'mainPanel',
        bodyCls: 'colPanel',
        title: '',
        id: 'gvGrid',
        useArrows: true,
        //autoScroll: true,
        draggable: false,
        disableSelection: true,
        tbar: etbar,
        store:store,
        plugins: [{
        ptype: 'rowexpander',
        rowBodyTpl: [
                '<div id="insidetest{alleleID}" class="detailData">',
                '</div>'
            ]
        }],
        columns: getEntryCols(),
        rootVisible: false,
        iconCls: 'icon-grid',
        dockedItems: [{
           xtype: 'pagingtoolbar',
           store: store,
           cls: 'mainPaging',
           dock: 'bottom',
           displayInfo: true,
           displayMsg: 'Displaying alleles {0} - {1} of {2}'
       }],
       /*viewConfig:{
        preserveScrollOnRefresh: true,
        deferEmptyText         : true,
        emptyText              : '<div class="grid-data-empty"><div>No Records to display. </div>There may be no records in the database or your evidence collections.</div>'
       },

       */
       viewConfig: {
         getRowClass: function(record, index) {
           if(index==0) { return 'firstRow' ;}
         }
       },
       initComponent: function () {
        var me = this;

        this.callParent(arguments);

        me.getView().on('expandBody', me.onExpandNestedGrid,me);
        me.getView().on('collapsebody', me.onCollapseNestedGrid,me);
    },
    onExpandNestedGrid : function (rowNode, record, expandRow, eOpts) {
         // global
         ca = record.get('alleleID') ;
         caSub = record.get('caAlleleSubject') ;
         var hgvsMask = getMask('gvGrid', 'hgvsMask', "Loading . . . . ") ;
         hgvsMask.show();
         // get the gene and HGVS
         //getGeneAndHGVS(true, ["insidetest"+ca], caSub) ;
         if(ca in topPanelInfo)
         {
           trackData('entryInner', 0, ["insidetest"+ca]);
         }
         else
         {
           getalleleInfoFomReg(ca, 'entryInner', ["insidetest"+ca]) ;
         }

    },
    onCollapseNestedGrid : function (rowNode, record, expandRow, eOpts) {
        var detailData = Ext.DomQuery.select("div.detailData", expandRow);
        var parent = detailData[0];

        var child = parent.firstChild;

        while (child) {
            child.parentNode.removeChild(child);
            child = child.nextSibling;
        }
    }
    });


  Ext.create('entryPageGrid', {renderTo: 'panel'}) ;


}

function viewDocRender() {
  downloadDocRender('view') ;
}

function downloadDocRenderAsPdf() {
  downloadDocRender('download') ;
}


function downloadDocRender(action) {
  console.log('Going to generate the document that is to be posted for download') ;
  var docTem = getDocRenderTemplate() ;
  // Add the allele information first
  if('hgvs' in topPanelInfo[ca]) { docTem["Allele Registry ID"].properties["Allele Information"].properties.HGVS.value = topPanelInfo[ca].hgvs.join(", ") ;}
  if('gene' in topPanelInfo[ca] && 'value' in topPanelInfo[ca].gene) {
    docTem["Allele Registry ID"].properties["Allele Information"].properties["Gene"] = {"value" : topPanelInfo[ca].gene.value} ;
  }


  // Get phenotype and mode of inheritance IF available from the transformation output
  var phenotype = null ;
  var phenoEl = document.getElementsByClassName('gb-context-rank1') ;
  if(phenoEl && phenoEl.length > 0) {
   if(phenoEl[0].title){ phenotype = phenoEl[0].title.split(":")[1] ;}
   else { phenotype = phenoEl[0].innerHTML.split(":")[1]; }
  }
  if(phenotype){docTem["Allele Registry ID"].properties["Phenotype"] = {"value" : phenotype } }


  var modeOin = null;
  var modeEl = document.getElementsByClassName('gb-context-rank2') ;
  if(modeEl && modeEl.length > 0) {
   if(modeEl[0].title){ modeOin = modeEl[0].title.split(":")[1] ;}
   else { modeOin = modeEl[0].innerHTML.split(":")[1] ; }
  }
  if(modeOin){docTem["Allele Registry ID"].properties["Mode of Inheritance"] = {"value" : modeOin } }
  
  // get the evidence tag items
  var tagItems =  [] ;
  var tagID = 0 ;
  for(var tagpath in tags) {
    var objid = tagpath.replace(/\s+/g, '') ;
    var tdElem = document.getElementById ( objid);
    if(tdElem) {
      var tdText = tdElem.innerText | tdElem.textContent;
      if(tdText > 0) {
        var onclickParams = tdElem.getAttribute('onclick');
        var res = onclickParams.match(/{EvidenceTags.*}|{Tags.*}|{Stat.*}|{Summary.*}|{subjects.*}/);
        if(res && res[0]) { var evObj = eval ("(" + res[0] + ")") ;}
        if(evObj && evObj.subjects) {
          for(var ii=0; ii<evObj.subjects.length; ii++)
          {
            tagID++ ;
            tagItems.push(mergeTagFromEvidence(evObj.subjects[ii], tagID));
          }
        }
      }
    }
  }
  if(tagItems.length > 0)
  {
    docTem["Allele Registry ID"].properties.Evidence = {"items" : tagItems} ;
  }
  if(Ext.getCmp('multitab') && Ext.getCmp('multitab').getActiveTab() && Ext.getCmp('multitab').getActiveTab().title ) {
    var activeGrid = Ext.getCmp('multitab').getActiveTab().title ;
    var gridEl = safeStr[activeGrid] ;
    var finalCall = grids[activeGrid].conclusion ;
    docTem["Allele Registry ID"].properties["Assertion and Reasoning"] = {"properties" :{"Final Call": {"value" : finalCall}}} ;
  }

  // reasoner
  // get the active tab components. Get the rules, etc only if the first item is the reasoner Grid
  var ftab = null ;
  if(gridEl) {   ftab = Ext.getCmp('tab'+gridEl) ; }

  // now get the data from the grid if it exists
  if(ftab && ftab.items.keys[0] == 'reasonerGrid' && Ext.getCmp('reasonerGrid')) {
    var res = Ext.getCmp('reasonerGrid') ;
    var store = res.store ;
    var others = [] ;
    store.each( function(record, id) {
      var rules = [] ;
      if(record.get('type') == 'Met') {
        if(record.get('conclusion') == finalCall){
          var ruleItems = [] ;
          rules = record.get('ruleStatement').split('<br>') ;
          for(var rr=0; rr<rules.length-1; rr++) {ruleItems.push({"Rule": {"value": rules[rr]} } ) }
          docTem["Allele Registry ID"].properties["Assertion and Reasoning"].properties["Final Call"].properties = {"Rules Met" : {"items": ruleItems }} ;
        }
        // Other Assertions reached
        else {
          rules = [] ;
          var ruleItems = [] ;
          var call = record.get('conclusion') ;
          var otherObj = {"Call": {"properties": {}, "value" : call} }
          rules = record.get("ruleStatement").split("<br>") ;
          for(var rr=0; rr<rules.length-1; rr++) {ruleItems.push({'Rule': {'value': rules[rr]} } ) }
          otherObj.Call.properties["Rules Met"] = {"items" : ruleItems} ;
          others.push(otherObj) ;
        }
      } //Met
    }) ;
    if(others.length > 0) {
      docTem["Allele Registry ID"].properties["Assertion and Reasoning"].properties["Other Assertions Reached"] = {"items" : others} ;
    }
  }
  // final doc
  console.log(docTem) ;
  //tmpPost(docTem) ;
  postAsJson(action, docTem)
}



function mergeTagFromEvidence(tagObj, tagid) {
  var retVal = {"TagID" :{ "properties":{}, "value" : tagid.toString() } } ;
  var type = tagObj.Tag.properties.Type.value ;
  delete tagObj.Tag.properties.Type ;
  var strength = tagObj.Tag.properties.Strength.value ;
  delete tagObj.Tag.properties.Strength ;
  var patho = tagObj.Tag.properties.Pathogenicity.value ;
  delete tagObj.Tag.properties.Pathogenicity ;
  delete tagObj.Tag.properties["Status"] ;
  // handle links
  if('Links' in tagObj.Tag.properties && 'items' in tagObj.Tag.properties.Links && tagObj.Tag.properties.Links.items.length > 0) {
    var linkItems = tagObj.Tag.properties.Links.items ;
    for(var ll=0 ; ll<linkItems.length ; ll++) {
      delete tagObj.Tag.properties.Links.items[ll].Link.properties['Link Code'] ;
    }
  }
  // now add new props
  tagObj.Tag.properties["Standard text"] = {"value" : tagDefs[tagObj.Tag.value] } ;
  tagObj.Tag.properties["Category"] = {"value" : patho +" >> "+strength+" >> "+type } ;
  retVal.TagID.properties = tagObj ;
  return retVal
}

//function tmpPost(docToRender) {
//  Ext.Ajax.request(
//   {
//    url : '/java-bin/apiCaller.jsp' ,
//    timeout : 90000,
//    params:
//    {
//      rsrcPath: '/REST/v1/grp/Registries/kb/PathCalculator2.5/coll/DocRender3/doc/'+encodeURIComponent(caSub),
//      apiMethod : 'PUT',
//      payload: Ext.JSON.encode({"data": docToRender})
//    },
//    method: 'POST'
//
//  }) ;
//
//}



function getDocRenderTemplate()
{
  var docObj = {
    "Allele Registry ID": {
      "properties": {
        "Allele Information": {
          "properties": {
            "HGVS": {
              "value": ""
            }
          },
          "value": null
        },
        "Date": {
          "value": Date() 
        }
      },
      "value": caSub
    }
  } ;
  return docObj ;
}




function postAsJson(action , data) {

  var calcForm = document.createElement("form");
  calcForm.method = "post";
  //calcForm.action = "/clingenInference/V2.5/docRender.rhtml";
  calcForm.action = appPath+'/ui/report?' ;
  calcForm.target = "_blank"
  formAppend(calcForm, document.createElement("input") ,"action", action);
  formAppend(calcForm, document.createElement("input") ,"data", JSON.stringify(data));
  formAppend(calcForm, document.createElement("input") ,csrf_param, csrf_token);
  document.body.appendChild(calcForm);
  calcForm.submit();
  document.body.removeChild(calcForm);
}


function formAppend(myForm, myInput, inputName, inputValue)
{
  myInput.setAttribute("name", inputName); 
  myInput.setAttribute("value", inputValue);
  myForm.appendChild(myInput);
}


function trackReasonerGridAndTransTable(time)
{
  var reasonerGridRendered = false ;
  var htmlTableRendered = false ;
  if(Ext.getCmp('multitab').getActiveTab()) {
    var activeGrid = Ext.getCmp('multitab').getActiveTab().title ;
    var gridEl = safeStr[activeGrid] ;
    var ftab = Ext.getCmp('tab'+gridEl) ;
  }
  
  if(ftab && ftab.items.keys[0] == 'reasonerGrid')
  {
    if(Ext.getCmp('reasonerGrid') && Ext.getCmp('reasonerGrid').store.data.items.length > 0) {reasonerGridRendered = true ;}
  }
  else {reasonerGridRendered = true ;}
  if(ftab && ftab.items.keys[1] == 'htmltable')
  {
    if(document.getElementById('Benign')) {htmlTableRendered = true ;}
  }
  else {htmlTableRendered = true }
  if(htmlTableRendered && reasonerGridRendered) {Ext.getCmp('allelereport').enable() ;}
  else {setTimeout(function(){console.log("waiting for the tab items to be rendered - "+time) ; trackReasonerGridAndTransTable(500) ;} , time) ;}
}


function callLogout(){
  logout(kbMount, csrf_token) ;
}

function getAllTagsinHtmlTable()
{
  alltagsinTable = new Object() ;

  for(var tagpath in tags) {
    var objid = tagpath.replace(/\s+/g, '') ;
    var tdElem = document.getElementById ( objid);
    if(tdElem) {
      var tdText = tdElem.innerText | tdElem.textContent;
      if(tdText > 0) {
        var onclickParams = tdElem.getAttribute('onclick');
        var res = onclickParams.match(/{EvidenceTags.*}|{Tags.*}|{Stat.*}|{Summary.*}|{subjects.*}/);
        if(res && res[0]) { var evObj = eval ("(" + res[0] + ")") ;}
        console.log(evObj) ;
        if(evObj && evObj.Tags) {
          for(var ii=0; ii<evObj.Tags.length; ii++)
          {
            alltagsinTable[evObj.Tags[ii]] = true ;
          }
        }
      }
    }
  }
  console.log(alltagsinTable) ;
  return alltagsinTable ;
}

function renderToolTipsForCells()
{
  getAllTagsinHtmlTable() ;
  var tagcodes = [] ;
  for(var tagpath in tags){
    var objid = tagpath.replace(/\s+/g, '') ;
    var tdElem = document.getElementById ( objid);
    content = '<div class="cell-tag-tip">Evidence Codes:<br><ul class="gb-tip">'
    tagcodes = tags[tagpath] ;
    for(var ii=0; ii<tagcodes.length; ii++)
    {
      if(tagcodes[ii] in  alltagsinTable) {tagCls = "gb-tip-tagon" ;}
      else {tagCls = "" ;}
      
      content += "<li class='"+tagCls+"'><b>"+tagcodes[ii] +"</b></li>" ;
    }
    content += "</ul></div>"
    tdElem.setAttribute("data-qtip", content) ;
  }
}


function bkgetTagExclusionCls(tagcode)
{
  var tagCls = null ;
  var found = null ;
  // first check the prohibited exclusions
  for(var tt in tagExclusions.prohibited)
  {
    var re = new RegExp(tt, 'g') ;

    if(tagcode.match(re))
    {
      for(var tag in alltagsinTable)
      {
        if(tag.match(re)) 
        {
          found = true ;
          tagCls = 'tag_prohibit' ;
          tagExclusionsOfInterest[tagcode] = tagExclusions.prohibited[tt] ;
          tagExclusionsOfInterest[tagcode].tagCls = tagCls ;
          break ;
        }
      }
    }
     if(found) break ;
  }
  // if tag cls not found among prohibited exclusions check in wawrnings
  // this helps override prohibited with warnings
  if(!(found))
  {
    for(var tt in tagExclusions.warning)
    {
      // handle escaped comas
      var ttre = tt.replace(/\\,/g, "\v" ) ;
      var patternarray = ttre.split(",") ;
      ttre =  patternarray.join("|") ;
      ttre = ttre.replace(/\v/g, "," )
      var re = new RegExp(ttre, 'g') ;
      var match = tagcode.match(re) ;
      if(match)
      {
        // get the unmatched tag pattern, if that is already present then the matched tagcode needs a warning
        var arindex = patternarray.indexOf(match[0]) ;
        var redunpattern = (arindex == 0) ? patternarray[1] : patternarray[0] ;
        var redunre = new RegExp(redunpattern, 'g') ;
        for(var tag in alltagsinTable)
        {
          if(tag.match(redunre))
          {
            found = true ;
            tagCls = 'tag_warning' ;
            tagExclusionsOfInterest[tagcode] = tagExclusions.warning[tt] ;
            tagExclusionsOfInterest[tagcode].tagCls = tagCls ;
            break ;
          }
        }
      }
      if(found) break ;
    }
  }
  return tagCls
}

function displayTagWarning(msg, combo, record)
{
  var title ;
  if(combo) {title = combo.getValue()+' : Redundant Tag' ;}
  else{title = record.data.tag+': Redundant Tag' ; } 
  Ext.Msg.show({
    cls: 'tagWarning',
    id: 'tagWarning',
    title : title,
    msg : msg,
    width : 600,
    height : 110,
    buttons : Ext.Msg.YESNO,
    buttonText :
    {
      yes : 'Continue',
      no: 'Cancel'
    },
    multiline : false,
    fn : function(buttonValue, inputText, showConfig){
     if(buttonValue == 'no')
     {
       if(combo) combo.clearValue() ;
       else if(record) {
         record.set('checked', false) ;
         record.set('tagPresent', false) ;
       }
     }
     if(buttonValue == 'yes')
     {
       // if record, need to update the tag exclusion status of the rest of the tags
       if(record)
       {
         alltagsinTable[record.data.tag] = true ;
         updateTagExclusionStatus() ; 
       }
     }
     }
   });


}


function displayTagError(msg, tag)
{
  Ext.Msg.show({
    cls: 'tagWarning',
    id: 'tagWarning',
    title : tag+' : Tag Error',
    msg : msg,
    width : 600,
    height : 110,
    buttons : Ext.Msg.OK,
    buttonText :
    {
      ok: 'OK'
    },
    multiline : false,
    fn : function(buttonValue, inputText, showConfig){
     if(buttonValue == 'ok')
     {
       
     }
     }
   });

}

function removeMasks(masks)
{
  var masks = ["entryMask", "hgvsMask", "alleleMask", "tabMask", "summaryMask"] ;
  for(var ii=0; ii<masks.length; ii++)
  {
    if(Ext.getCmp(masks[ii])){
      Ext.getCmp(masks[ii]).destroy() ;
    }
  } 
}


function goToCalculatorPage(alleleid)
{
  var url = document.URL.split('?')[0] ;
  url = url + '?ca='+alleleid ;
  if(conf) {var url = url + '&conf=' + conf ; }
  window.open(url, '_blank');
}


function getAppLink()
{
  var rlink ;
  rlink = window.location.protocol+"//"+window.location.host+"/java-bin/clingen"+version+".jsp" ;
  return rlink 

}


function getGeneSubAndHGVSFromArray(infoArray, ca)
{
  for(var ii=0; ii<infoArray.length; ii++)
  {
    if('hgvs' in infoArray[ii])
    {
      // Add the proteinVariation in the hgvs
      if('proteinEffect' in infoArray[ii])
      {
        for(hh=0; hh<infoArray[ii].hgvs.length; hh++) {
          topPanelInfo[ca].hgvsWithProteinVariation.push(infoArray[ii].hgvs[hh] + " ("+infoArray[ii].proteinEffect.hgvs.split(":")[1]+") ") ;
        }
      }
      else
      {

        for(hh=0; hh<infoArray[ii].hgvs.length; hh++) {topPanelInfo[ca].hgvsWithProteinVariation.push(infoArray[ii].hgvs[hh]) ; }

      }

      // Just HGVS (without protein variation)
      for(hh=0; hh<infoArray[ii].hgvs.length; hh++) {topPanelInfo[ca].hgvs.push(infoArray[ii].hgvs[hh]) ; } 
    }
    if('gene' in infoArray[ii])
    {
      topPanelInfo[ca].geneSubject[infoArray[ii].gene] = true ;
    }
    // check the reference genome and get the supporting info
    if('referenceGenome' in infoArray[ii] && (infoArray[ii].referenceGenome == 'GRCh37' || infoArray[ii].referenceGenome == 'GRCh38') && !(infoArray[ii].referenceGenome in topPanelInfo[ca]))
    {
      topPanelInfo[ca][infoArray[ii].referenceGenome] = {} ;
      topPanelInfo[ca][infoArray[ii].referenceGenome].chromosome = infoArray[ii].chromosome ;
      for(var hh = 0; hh<topPanelInfo[ca].hgvs.length; hh++) { if(topPanelInfo[ca].hgvs[hh].match(/^NC/)) {topPanelInfo[ca][infoArray[ii].referenceGenome].genomeSpecificHGVS = topPanelInfo[ca].hgvs[hh]} ;} 
      for(var key in infoArray[ii].coordinates[0]) {topPanelInfo[ca][infoArray[ii].referenceGenome][key] = infoArray[ii].coordinates[0][key] ;}
    }
  }
}




function getCalcPanels()
{
  getalleleInfoFomReg(ca, "calculator", null) ;
}




// get the individual allele links and add it to the 'alleleLinks' property of topPanelInfo
function getCASourceLinks()
{

  var alleleStr = '';
  var generatedLink ;
  var linkSources = ['ClinVar', 'ExAC', 'gnomAD', 'Beacons', 'MyVariant', 'Google Scholar', 'Google', 'PubMed', 'dbSNP', 'COSMIC', 'Varsome'];
  var alleleRegLinks = ['ClinVar', 'ExAC', 'gnomAD', 'dbSNP', 'COSMIC', 'MyVariant'] ;
  var otherLinks = ['Google Scholar', 'Google',  'Beacons', 'Varsome'] ;
  
  var ii ;
  /* Generate links taken from Allele Registry */
  alleleStr += '<div class="">' ;
  for(ii=0; ii<alleleRegLinks.length; ii++){
    generatedLink = null;
    generatedLink = generateAlleleLinkFor(alleleRegLinks[ii]) ;
    if(generatedLink) {
      if(alleleRegLinks[ii].match(/MyVariant/)){
        generatedLink += "?format=html" ;
      }
      alleleStr += '<a class="linkbutton" href="'+generatedLink+'" target="_blank">'+alleleRegLinks[ii]+'</a>  &nbsp;&nbsp' ;
    }
  }
  alleleStr += '</div>' ;
  /* Generate links taken from Other sources */
  alleleStr += '<div class="ca-source-links-section">' ;
  for(ii=0; ii<otherLinks.length; ii++){
    generatedLink = null;
    generatedLink = generateAlleleLinkFor(otherLinks[ii]) ;
    if(generatedLink) {
      
      alleleStr += '<a class="linkbutton" href="'+generatedLink+'" target="_blank">'+otherLinks[ii]+'</a>  &nbsp;&nbsp' ;
    }
  }
  alleleStr += '</div>' ;
  // Final section for predictorscore(s)
  if(topPanelInfo[ca].GRCh37 && topPanelInfo[ca].GRCh37.chromosome && topPanelInfo[ca].GRCh37.genomeSpecificHGVS)
  {
    var predictorscore = '<a class="predict-score-button" onclick="loadPredictorChart(\''+topPanelInfo[ca].GRCh37.genomeSpecificHGVS+'\')">Predictor Scores</a>' ;
    alleleStr += '<div class="ca-source-links-section">' ;
    alleleStr += predictorscore ;
    alleleStr += '<a data-qtip=\"Click to view allele frequency by race\" class="fa fa-bar-chart predict-score-button af-high-chart" onclick="loadHighChartForAF(\''+topPanelInfo[ca].GRCh37.genomeSpecificHGVS+'\')">Allele Frequency</a>' ;
    alleleStr += '</div>' ;
    
  }
  topPanelInfo[ca].alleleLinks = alleleStr ;
}


function getGeneSourceLinks()
{
  var geneStr = '';
  var generatedLink ;
  var linkSources = ['UCSC', 'HGNC', 'NCBI', 'ExAC', 'gnomAD', 'GTR', 'OMIM']
  for(var ll=0; ll<linkSources.length; ll++)
  {
    generatedLink = null;
    generatedLink = generateGeneLinkFor(linkSources[ll]) ;
    if(generatedLink) {geneStr += '<a class="linkbutton" href="'+generatedLink+'" target="_blank">'+linkSources[ll]+'</a>  &nbsp;&nbsp' ; }
  }
  topPanelInfo[ca].geneSrc = geneStr ;
}



function generateGeneLinkFor(source)
{
  var retVal = null ;
  var link ;

  if(source == "UCSC")
  {
    link = "http://genome.ucsc.edu/cgi-bin/hgGene?org=human&db=hg38&hgg_gene=" ;
    if(topPanelInfo[ca].gene.value != 'No Data')
    {
      retVal = link + topPanelInfo[ca].gene.value ;
    }
  }
  if(source == 'HGNC')
  {
    if('HGNC' in topPanelInfo[ca]) {retVal = topPanelInfo[ca].HGNC ;}
  }

  if(source == 'NCBI')
  {
    if('NCBI' in topPanelInfo[ca]) {retVal = topPanelInfo[ca].NCBI ;}
  }
  if(source == 'ExAC')
  {
    link = "http://exac.broadinstitute.org/awesome?query=" ;
    if(topPanelInfo[ca].gene.value != 'No Data')
    {
      retVal = link + topPanelInfo[ca].gene.value ;
    }
  }
  if(source == 'gnomAD')
  {
    link = "http://gnomad.broadinstitute.org/awesome?query=" ; 
    if(topPanelInfo[ca].gene.value != 'No Data')
    {
      retVal = link + topPanelInfo[ca].gene.value ;
    }
  }
  if(source == 'GTR')
  {
    link = "https://www.ncbi.nlm.nih.gov/gtr/all/genes/?term=" ; 
    if(topPanelInfo[ca].gene.value != 'No Data')
    {
      retVal = link + topPanelInfo[ca].gene.value ;
    }
  }
  if(source == 'OMIM')
  {
    link = "http://www.omim.org/search/?search=gene_name=" ; 
    if(topPanelInfo[ca].gene.value != 'No Data')
    {
      retVal = link + topPanelInfo[ca].gene.value ;
    }
  }
  return retVal
}


function generateAlleleLinkFor(source)
{
  var retVal = null ;
  var link ;
  var linkProtocol = window.location.protocol ;
  if(source == 'ClinVar')
  {
    var gterms = [] ;
    link = "https://www.ncbi.nlm.nih.gov/clinvar/" ;
    for(var ii=0; ii<topPanelInfo[ca].hgvs.length; ii++)
    {
     if(topPanelInfo[ca].hgvs[ii].match(/^NC/))
     {
       gterms.push(topPanelInfo[ca].hgvs[ii].split(":")[1]) ; 
     }
    }
    if(gterms.length > 0) {retVal = link +"?term="+gterms.join('+OR+') ;}
  }
  else if(source == 'ExAC')
  {
    link = linkProtocol+"//exac.broadinstitute.org/variant/" ;
    if(topPanelInfo[ca].GRCh37 && topPanelInfo[ca].GRCh37.chromosome && topPanelInfo[ca].GRCh37.end && topPanelInfo[ca].GRCh37.allele && topPanelInfo[ca].GRCh37.referenceAllele)
    {
      retVal = link + topPanelInfo[ca].GRCh37.chromosome+ "-" +topPanelInfo[ca].GRCh37.end+ "-" +topPanelInfo[ca].GRCh37.referenceAllele+ "-" + topPanelInfo[ca].GRCh37.allele ;
    }
  }
  else if(source == 'Varsome')
  {
    link = "https://varsome.com/variant/hg19/" ;
    if(topPanelInfo[ca].GRCh37 && topPanelInfo[ca].GRCh37.chromosome && topPanelInfo[ca].GRCh37.end && topPanelInfo[ca].GRCh37.allele && topPanelInfo[ca].GRCh37.referenceAllele)
    {
      retVal = link + topPanelInfo[ca].GRCh37.chromosome+ "-" +topPanelInfo[ca].GRCh37.end+ "-" +topPanelInfo[ca].GRCh37.referenceAllele+ "-" + topPanelInfo[ca].GRCh37.allele ;
    }

  }
  else if(source == 'gnomAD')
  {
    link = linkProtocol+"//gnomad.broadinstitute.org/variant/" ;
    if(topPanelInfo[ca].GRCh37 && topPanelInfo[ca].GRCh37.chromosome && topPanelInfo[ca].GRCh37.end && topPanelInfo[ca].GRCh37.allele && topPanelInfo[ca].GRCh37.referenceAllele)
    {
      retVal = link + topPanelInfo[ca].GRCh37.chromosome+ "-" +topPanelInfo[ca].GRCh37.end+ "-" +topPanelInfo[ca].GRCh37.referenceAllele+ "-" + topPanelInfo[ca].GRCh37.allele ;
    }
  }
  else if(source == 'Beacons')
  {
    link = "https://beacon-network.org//#/search?" ; 
    if(topPanelInfo[ca].GRCh37 && topPanelInfo[ca].GRCh37.chromosome && topPanelInfo[ca].GRCh37.end && topPanelInfo[ca].GRCh37.allele && topPanelInfo[ca].GRCh37.referenceAllele)
    {
      retVal = link + "pos=" +topPanelInfo[ca].GRCh37.end+ "&chrom=" +topPanelInfo[ca].GRCh37.chromosome+ "&allele=" +topPanelInfo[ca].GRCh37.allele+ "&ref=" + topPanelInfo[ca].GRCh37.referenceAllele +"&rs=GRCh37" ;
       
    }
    
  }
  else if(source == 'MyVariant')
  {
    link = linkProtocol+"//myvariant.info/v1/variant/" ;
    // Note need genome specific hgvs with NC. Present in genomeSpecificHGVS
    if(topPanelInfo[ca].GRCh37 && topPanelInfo[ca].GRCh37.chromosome && topPanelInfo[ca].GRCh37.genomeSpecificHGVS)
    {
      var gterm = topPanelInfo[ca].GRCh37.genomeSpecificHGVS.split(":")[1];
      
      retVal = link + "chr" +topPanelInfo[ca].GRCh37.chromosome+ ":" +gterm ; 
    }

  }
  else if(source == 'Google')
  {
    link = "https://www.google.com/#q=" ;
    var ctermsHash = new Object() ;
    for(var cc=0; cc<topPanelInfo[ca].hgvs.length; cc++)
    {
      term = topPanelInfo[ca].hgvs[cc].split(":")[1] ;
      if(term.match(/^c./)) { ctermsHash[term] = "";}
    }
    if(Object.keys(ctermsHash).length > 0 && topPanelInfo[ca].gene.value != 'No Data')
    {
       var ctermstr = [] ;
       for(var cc=0; cc<Object.keys(ctermsHash).length; cc++){ ctermstr.push(encodeURIComponent('"'+Object.keys(ctermsHash)[cc]+'"')); }
       var ctermstring  = ctermstr.join("+OR+") ;
       retVal = link + topPanelInfo[ca].gene.value+'+AND+'+ctermstring ;
    }

  }
  else if(source == 'PubMed')
  { 
    link = "https://www.ncbi.nlm.nih.gov/pubmed/?term=" ;
    var ctermsHash = new Object() ;
    for(var cc=0; cc<topPanelInfo[ca].hgvs.length; cc++)
    {
      term = topPanelInfo[ca].hgvs[cc].split(":")[1] ;
      if(term.match(/^c./)) { ctermsHash[term] = "";}
    }
    if(Object.keys(ctermsHash).length > 0 && topPanelInfo[ca].gene.value != 'No Data')
    {
       var ctermstr = [] ;
       for(var cc=0; cc<Object.keys(ctermsHash).length; cc++){ ctermstr.push(encodeURIComponent(Object.keys(ctermsHash)[cc])); }
       var ctermstring  = ctermstr.join("+OR+") ;
       retVal = link + topPanelInfo[ca].gene.value + encodeURIComponent("[Title/Abstract]") + "+AND+" + ctermstring ;
    }
  }
  else if(source == 'dbSNP')
  {
    link = "https://www.ncbi.nlm.nih.gov/snp/?term=" ;
    if(topPanelInfo[ca].GRCh38 && topPanelInfo[ca].GRCh38.chromosome && topPanelInfo[ca].GRCh38.end)
    {
      retVal = link + topPanelInfo[ca].GRCh38.chromosome+encodeURIComponent("[Chromosome]")+ "+AND+" + topPanelInfo[ca].GRCh38.end + encodeURIComponent("[Base Position]") + '+AND+homo+sapiens+'+encodeURIComponent("[Organism]") ;
    }
  }
  
  else if(source == "COSMIC")
  {
    link = linkProtocol+"//cancer.sanger.ac.uk/cosmic/search?q=" ;
    // get the cterms
    var ctermsHash = new Object() ;
    for(var cc=0; cc<topPanelInfo[ca].hgvs.length; cc++)
    {
      term = topPanelInfo[ca].hgvs[cc].split(":")[1] ;
      if(term.match(/^c./)) { ctermsHash[term] = "";} 
    }
    console.log(Object.keys(ctermsHash).length) ;
    if(topPanelInfo[ca].gene.value != 'No Data' && Object.keys(ctermsHash).length > 0)
    {
      retVal = link + encodeURIComponent(Object.keys(ctermsHash)[0]) + "+and+"+topPanelInfo[ca].gene.value ;
    }

  }

  return retVal
}




function trackData(trackId, total, opts)
{
  // 10 secs
  var totalWt = 10000 ;
  if(trackId == 'calculator')
  {
    var alleleLinksStr = "";
    if(ca in topPanelInfo && 'alleleLinks' in topPanelInfo[ca] && 'gene' in topPanelInfo[ca] && 'geneSrc' in topPanelInfo[ca] && 'hgvs' in topPanelInfo[ca])
    {
      var allStore = Ext.getCmp('alleleGrid').store ;
      var data = [] ;
      var caAlleleLink = '<a class="linkbutton" href="http://reg.genome.network/allele/'+ca+'.html" target="_blank">'+ca+'</a>' ;
      if(topPanelInfo[ca].alleleLinks && topPanelInfo[ca].alleleLinks.length > 0)
      {
        alleleLinksStr = topPanelInfo[ca].alleleLinks + makeExtenalNoteLink() ;
      }
      data.push(['<b>Allele: '+caAlleleLink+'</b>', alleleLinksStr ]) ;
      data.push(['<b>HGVS</b>', topPanelInfo[ca].hgvsWithProteinVariation.join(",  ")]) ;
      data.push(['<b>Gene: '+topPanelInfo[ca].gene.value+'</b>', topPanelInfo[ca].geneSrc]) ;
      allStore.loadData(data) ;
      Ext.getCmp('alleleMask').destroy() ;
    }
    else if(total > totalWt){Ext.getCmp('alleleMask').destroy() ; Ext.Msg.alert("ERROR", "Failed to load allele information panel");}
    else
    {
      setTimeout( function(){console.log('Waiting for top panel data. . .') ; total+= 500; trackData(trackId, total)}, 500) ;

    }
  }
  else if(trackId == 'entryInner')
  {
    console.log("total for getting inner htm data for the entry" +total) ;
    if('gene' in topPanelInfo[ca] && 'hgvs' in topPanelInfo[ca])
    {
          var innerContent = document.getElementById(opts[0]);
          var innerstr = '';
          innerstr = '<b>Gene: </b>' +topPanelInfo[ca].gene.value+'<br>' ;
          innerstr += '<b>HGVS: </b> '+topPanelInfo[ca].hgvsWithProteinVariation.join(", ") ;
          innerContent.innerHTML = innerstr;
          if(Ext.getCmp('hgvsMask')){Ext.getCmp('hgvsMask').destroy() ;}
          Ext.getCmp('gvGrid').doLayout() ;

    }
    else if(total > totalWt){Ext.getCmp('hgvsMask').destroy() ;Ext.Msg.alert("ERROR", "Failed to load gene and HGVS information");}
    else
    {
      setTimeout( function(){console.log('Waiting for top panel data. . .') ; total+= 500; trackData(trackId, total, opts)}, 500) ;

    }

  }
}



function goToDashboardPage()
{
  var dashLink = getAppLink() ;
  if(conf) {dashLink = dashLink + "?conf=" +encodeURIComponent(conf) ;}
  window.open(urlMount, '_self') ;
}


function makeExtenalNoteLink()
{
  var retVal = '<div class="link-note"><span> Note: The external links are generated automatically using nomenclature provided by the Allele Registry. Thus, they may not necessarily provide meaningful results. </span> </div>' ;
 return retVal ;
}
