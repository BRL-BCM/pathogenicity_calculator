/**
 * All the Ajax request methods for the altas
 *
 **/




// get dynamic store for the combos, used for hgvs search combo
function getPropComboStore(propModel, mapPath)
{
  // some global
  Ext.define(propModel, {
     extend: 'Ext.data.Model',
       proxy: {
         type: 'ajax',
         url : '/java-bin/apiCaller.jsp',
         timeout : 90000,
         reader: {
           type: 'json',
           root: 'data'
         }
       },
       fields: [{ name: 'value', mapping: mapPath }],
       listeners: { 
        load: function(store) {

            var hits = {};
            store.filterBy(function(record) {
                var name = record.get('value');
                if (hits[name]) {
                    return false;
                } else {
                    hits[name] = true;
                    return true;
                }
            });
            delete store.snapshot;
        }
       }
     });
    var propStore = Ext.create('Ext.data.Store', {
       model: propModel
     });
   
  return propStore ;
}


function getHgvsStore()
{
Ext.define('HgVs', {
     extend: 'Ext.data.Model',
       proxy: {
         type: 'ajax',
         url : '/java-bin/apiCaller.jsp',
         timeout : 90000,
         reader: {
           type: 'array',
           getData: function(data) {
             dd = []
             for(var ii=0; ii<data.length; ii++) {dd.push([data[ii]]) ;}
             return dd ;
           }
         }
       },
       fields: [{ name: 'value'}],
       listeners: {
        load: function(store) {

            var hits = {};
            store.filterBy(function(record) {
                var name = record.get('value');
                if (hits[name]) {
                    return false;
                } else {
                    hits[name] = true;
                    return true;
                }
            });
            delete store.snapshot;
        }
       }
     });
    var propStore = Ext.create('Ext.data.Store', {
       model: 'HgVs'
     });

  return propStore ;

}




// gets store for gene combo
// return values are based on a genboree KB view document, gene
function getGeneComboStore()
{
  Ext.define('geneM', {
     extend: 'Ext.data.Model',
       proxy: {
         type: 'ajax',
         url : '/java-bin/apiCaller.jsp',
         timeout : 90000,
         reader: {
           type: 'json',
           root: 'data'
         }
       },
       fields: [{ name: 'sym', mapping: 'Symbol.value' }, {name: 'genesub', mapping: 'GeneSubject.value'}],
       listeners: { // remove duplicates
        load: function(store) {

            var hits = {};
            store.filterBy(function(record) {
                var name = record.get('value');
                if (hits[name]) {
                    return false;
                } else {
                    hits[name] = true;
                    return true;
                }
            });
            delete store.snapshot;
        }
       }
     });
    var geStore = Ext.create('Ext.data.Store', {
       model: 'geneM',
       sorters: [{
         property: 'sym',
         direction: 'ASC'
       }]
     });

  return geStore ;
}

// ref seq combo
function getRefSeqComboStore()
{
  Ext.define('refM', {
     extend: 'Ext.data.Model',
       proxy: {
         type: 'ajax',
         url : '/java-bin/apiCaller.jsp',
         timeout : 90000,
         reader: {
           type: 'json',
           root: 'data'
         }
       },
       fields: [{ name: 'refsub', mapping: 'ReferenceSequence.properties.Subject.value' }, {name: 'refname', mapping: 'ReferenceSequence.properties.Subject.properties.identifiers.items[0].identifier.properties.value.value'}],
       listeners: { // remove duplicates
        load: function(store) {

            var hits = {};
            store.filterBy(function(record) {
                var name = record.get('value');
                if (hits[name]) {
                    return false;
                } else {
                    hits[name] = true;
                    return true;
                }
            });
            delete store.snapshot;
        }
       }
     });
    var rStore = Ext.create('Ext.data.Store', {
       model: 'refM',
       sorters: [{
         property: 'sym',
         direction: 'ASC'
       }]
     });

  return rStore ;


}



function getAlleleFromHgVs(hgvsTerm)
{

  var allelePath = decodeURIComponent(regAddress) ;
  var simpleSubjects = [];
  Ext.Ajax.request(
  {
    url : '/java-bin/apiCaller.jsp' ,
    timeout : 150000,
    method: 'GET',
    params:
    {
      rsrcPath: allelePath+ '/allele?hgvs='+encodeURIComponent(hgvsTerm) ,
      apiMethod : 'GET'
    },
    callback: function(opts, success, response)
    {
      try
      {
        var apiRespObj  = JSON.parse(response.responseText) ;
        console.log(apiRespObj) ;
        if(response.status >= 200 && response.status < 400 && apiRespObj)
        {
          if(!('@id' in apiRespObj))
          {
            Ext.Msg.alert("ERROR", "error need a message") ;
            if(Ext.getCmp('entryMask')){Ext.getCmp('entryMask').destroy() ;}
          }
          else
          {

            caAlleles = new Object() ;
            alleleSorted  = [] ;
           if(Ext.getCmp('gvGrid')){Ext.getCmp('gvGrid').getStore().removeAll();}
             var alleleID = apiRespObj["@id"] ;
             var canonicalAlleleSub = apiRespObj["@id"] ;
             caAlleles[canonicalAlleleSub] = {} ;
             var caId = canonicalAlleleSub.split("/").pop() ;
             caAlleles[canonicalAlleleSub].CA = caId ;

            if(Ext.getCmp('gvGrid')) {Ext.getCmp('gvGrid').destroy() ;}
            alleleSorted = Object.keys(caAlleles).sort() ;
            makePanel() ;
          }
        }
        else
        {
          if(Ext.getCmp('entryMask')){Ext.getCmp('entryMask').destroy() ;}
          var displayMsg = 'The following error was encountered while retrieving documents for the search value <i>' + hgvsTerm + '</i> :<br><br>';
          Ext.Msg.alert("ERROR", displayMsg) ;
        }
      }
      catch(err)
        {
          if(Ext.getCmp('entryMask')){Ext.getCmp('entryMask').destroy() ;}
          Ext.Msg.alert("ERROR", "Bad data returned from server when retrieving documents for the property value of <i>" + hgvsTerm + "</i>. Please contact a project admin to arrange investigation and resolution.") ;
        }
    }
  }) ;


}


// Get the evidence cahce documents from a list of canonical alleles
// The list elements will always be 100, forced by using limit parameter 
// See getDocumentsFromSearchValue
function entryPageInfo()
{
  var evCachePath = decodeURIComponent(evCacheUrl) ;
  // get all the casubjects
  var casubjectList = [] ;
  // need count for these
  for (casubject in caAlleles) {casubjectList.push(casubject) ;}
  var evCachePath = evCachePath+'/docs?matchProp=EvidenceCacheID.CanonicalAllele&matchValues='+casubjectList+'&detailed=true' ;
  var statusObj ;
  var apiRespObj ;
  // caAlleles are global var at this point
  // Need to iterate through each of the evidence collection in the source registry
    Ext.Ajax.request(
      {
          url : '/java-bin/apiCaller.jsp' ,
          timeout : 90000,    method: 'GET',
          params:
          {
            rsrcPath: evCachePath, 
            apiMethod : 'GET',
          },
          callback: function(opts, success, response)
          {
            apiRespObj  = JSON.parse(response.responseText) ;
            docInfo = [] ;
            docInfo = apiRespObj['data'] ;
            statusObj   = apiRespObj['status'] ;
           if(response.status >= 200 && response.status < 400 && docInfo)
           {
             getCachecounts(docInfo, null) ;
           }
           else
           { 
             Ext.Msg.alert("ERROR", "API failed to get the cached  Evidence info from the evidence cache collection - "+evCacheUrl+ ".<br>" +statusObj.msg+ ", "  + response.status+ ', ' + response.statusText) ;
              Ext.getCmp('entryMask').hide() ;

           }
         }
     }) ;
}



// makes small or large html tables from the transformation url
// format - either 'html' or 'smallhtml'
function viewGrid(format, gridName)
{
  var trPath = grids[gridName].transform ;
  var evdocpath = grids[gridName].evidence ; 
  var gridpath = evdocpath+ '?transform='+ trPath + '&format='+ format ;
  if(format == 'html'){gridpath = gridpath + '&onClick=true' ;}
  var message = "";
  Ext.Ajax.request(
  {
    url : '/java-bin/apiCaller.jsp' ,
    timeout : 180000,
    method: 'GET',
    params:
    {
      rsrcPath: gridpath,
      apiMethod : 'GET',
      gridname: gridName,
    },
    callback: function(opts, success, response)
    {
        var gridTable = response.responseText ;
        if(response.status >= 200 && response.status < 400 && gridTable)
        {
          if(format == 'html') // update the inference panel
          {
            Ext.getCmp('htmltable').body.update(gridTable);
            var specialRows = Ext.DomQuery.select("tr.gb-special") ;
            // Sanity check. If ok, will strip special row (rather than fool with sizes and break border appearance etc etc)
            if(specialRows.length && specialRows.length == 1)
            {
              var specialRow = specialRows[0] ;
              var rowParent = specialRow.parentNode ;
              rowParent.removeChild(specialRow) ;
            }
           // render tooltips
           renderToolTipsForCells() ;
          }
        }
        else
        {
          if(gridTable)
          {
            var grObj  = JSON.parse(gridTable) ;
            var grStatusObj   = grObj['status'] ;
            message = grStatusObj.msg + "<br>" ;
          }
         if(message.match(/INVALID_RULE_OR_SOURCEDOC/))
         {
          getTagStore(response.request.options.params.gridname, 'html', true) ;
        }          
        else
        {
          message = message + "API Failed to get the grid data" + response.status + ', ' + response.statusText;
          Ext.Msg.alert("ERROR",  message) ;
        }
      }
    }
  }) ;
}




// fills the reasoner panel with the reasoner output
//Reasoner output is now a path to a file in one of the databases.
function runReasonerGrid(gridn)
{
  var toolPath = "/REST/v1/genboree/tool/reasonerV2a1/job?" ;
  var kbDocUrl = grids[gridn].evidence ;
  var trRulesDocUrl =  grids[gridn].transform ;
  var guideUrl =  grids[gridn].guideline ;
  Ext.Ajax.request(
  {
    url : '/java-bin/apiCaller.jsp' ,
    timeout : 1600000,
    params:
    {
      rsrcPath: toolPath,
      apiMethod : 'PUT',
      gridname: gridn,
      payload: Ext.JSON.encode({"inputs": [kbDocUrl,trRulesDocUrl], "outputs": [], "settings":{"rulesDoc":guideUrl}, "context":{}})
    },
    method: 'POST',
    success: getReasonerData,
    failure: displayFailureDialogReasoner
  }) ;
}

//saves evidence doc after the edits from the cell pop window.
function saveEviDoc(evDocument, changeCls, cellId, grname, hasnotagsinfo, closeWindow, refreshTableOnly)
{
  var evDocPath = grids[grname].evidence ;
  Ext.Ajax.request(
 {
    url : '/java-bin/apiCaller.jsp' ,
    timeout : 360000,
    params:
    {
      rsrcPath: evDocPath,
      apiMethod : 'PUT',
      changeCls: changeCls,
      cellId: cellId,
      grname: grname,
      refreshTableOnly: refreshTableOnly,
      tagsinfo: hasnotagsinfo,
      close: closeWindow,
      payload: Ext.JSON.encode({"data": evDocument})
    },
    method: 'POST',
    success: displaySaveDialog,
    failure: displayFailureDialogSave

  }) ;

}

function deleteEviDocReq(gridname)
{
  var evDocUrl = grids[gridname].evidence ;
  Ext.Ajax.request(
  {
    url : '/java-bin/apiCaller.jsp' ,
    timeout : 90000,
    params:
    {
      rsrcPath: evDocUrl,
      apiMethod : 'DELETE',
      gridname: gridname
    },
    method: 'GET',
    success: deleteEvDoc,
    failure: displayFailureDialogEvDocDelete
  }) ;
}



// updates conclusion cache
// gets the conclusion cache document by evidence source and guideline url
function updateCache(gname)
{
  var evidenceUrl = grids[gname].evidence ;
  var cachePath = decodeURIComponent(conCacheUrl) ; 
  
  var rsPath = cachePath+'/docs?detailed=true&matchProps=ConclusionCacheID.Guideline,ConclusionCacheID.Evidence%20Doc&matchValues='+grids[gname].guideline+','+evidenceUrl+'&matchLogicOp=and' ;
  Ext.Ajax.request(
  {
    url : '/java-bin/apiCaller.jsp' ,
    timeout : 90000,
    params:
    {
      rsrcPath: rsPath,
      apiMethod : 'GET',
      grName : gname,
    },
    method: 'GET',
    success: updateData,
    failure: displayFailureDialogCache
  }) ;

}

// updates the conclusion cache data
function updateData(result, request)
{
   var resObj  = JSON.parse(result.responseText) ;
   var resOut = resObj['data'] ;
   var payld;
   var payId = "" ;
   grName = result.request.options.params.grName ;
   console.log("Updating Data ::" + grName) ; 
   if(resOut.length >= 1)
   {
    // update the reasonerOutput
    if('ReasonerOutput' in resOut[0].ConclusionCacheID.properties)
    {
      resOut[0].ConclusionCacheID.properties.ReasonerOutput.value = grids[grName].reasonerOutput ;
      resOut[0].ConclusionCacheID.properties.FinalCall.value = grids[grName].conclusion ;
    }
    else
    {
     resOut[0].ConclusionCacheID.properties.ReasonerOutput = {} ;
     resOut[0].ConclusionCacheID.properties.ReasonerOutput.value = grids[grName].reasonerOutput ;
     resOut[0].ConclusionCacheID.properties.FinalCall.value = grids[grName].conclusion ;
    }
    // Add the version 
    resOut[0].ConclusionCacheID.properties['Evidence Doc'].properties = {};
    resOut[0].ConclusionCacheID.properties['Evidence Doc'].properties.Version = {};
    resOut[0].ConclusionCacheID.properties['Evidence Doc'].properties.Version.value = grids[grName].version ;
    payld = resOut[0] ;
    payId = resOut[0].ConclusionCacheID.value ;
   }
   else if(resOut.length == 0) // make a new document
   {
     payld =  {} ;
     payld.ConclusionCacheID = {} ;
     payld.ConclusionCacheID.value = "" ;
     payld.ConclusionCacheID.properties = {} ;
     payld.ConclusionCacheID.properties['Evidence Doc'] = {} ;
     payld.ConclusionCacheID.properties['Evidence Doc'].value = grids[grName].evidence ;
     payld.ConclusionCacheID.properties['Evidence Doc'].properties = {};
     payld.ConclusionCacheID.properties['Evidence Doc'].properties.Version = {};
     payld.ConclusionCacheID.properties['Evidence Doc'].properties.Version.value = grids[grName].version ;
     payld.ConclusionCacheID.properties['Guideline'] = {} ;
     payld.ConclusionCacheID.properties['Guideline'].value = grids[grName].guideline ;
     payld.ConclusionCacheID.properties['FinalCall'] = {} ;
     payld.ConclusionCacheID.properties['FinalCall'].value = grids[grName].conclusion ;
     if(grids[grName].reasonerOutput)
     {
       payld.ConclusionCacheID.properties['ReasonerOutput'] = {} ;
       payld.ConclusionCacheID.properties.ReasonerOutput.value = grids[grName].reasonerOutput ;
     }
     payId = "" ;
   }

   // Now save the cache doc
  var cachePath = decodeURIComponent(conCacheUrl) ;
  var rsPath = cachePath+'/doc/'+payId ;
   Ext.Ajax.request(
   {
      url : '/java-bin/apiCaller.jsp' ,
      timeout : 360000,
      params:
      {
        rsrcPath: rsPath,
        apiMethod : 'PUT',
        payload: Ext.JSON.encode({"data": payld})
      },
      method: 'POST'

  }) ;

}



function saveLinks(evDocument, parPath, selectedTag, tabname)
{

  var evdocPath = grids[tabname].evidence ;

  Ext.Ajax.request(
 {
    url : '/java-bin/apiCaller.jsp' ,
    timeout : 360000,
    params:
    {
      rsrcPath: evdocPath,
      apiMethod : 'PUT',
      parpath: parPath,
      lTag: selectedTag,
      tbname: tabname,
      payload: Ext.JSON.encode({"data": evDocument})
    },
    method: 'POST',
    success: displaySaveLinksDialog,
    failure: displayFailureDialogSave

  }) ;

}




function saveTagsToDoc(partitionPath, dataItems, cellId)
{
// 1. separate the partitions
  var pars = partitionPath.split(".") ;
  var patho = pars[0] ;
  var strength = pars[1] ;
  var evidencetype = pars[2];
  var changeClsToInvalid = false;
  var activetab = Ext.getCmp('multitab').getActiveTab().title ;
  var evdocPath = grids[activetab].evidence ; 
   // Get the evidence document
   Ext.Ajax.request(
  {
    url : '/java-bin/apiCaller.jsp' ,
    timeout : 180000,
    method: 'GET',
    params:
    {
      rsrcPath: evdocPath +'?detailed=true',
      apiMethod : 'GET',
      grname: activetab 
    },
    callback: function(opts, success, response)
    {
        var respObj  = JSON.parse(response.responseText) ;
        var respStatus   = respObj['status'] ;
        if(response.status >= 200 && response.status < 400 && response.responseText)
        {
          var evInfo = respObj['data'] ;
          console.log(evInfo) ;
          var filteredEvItems = [] ;
          var tmpItem = [];
          var tagLinks = {} ;
          // If optional properties are already present remove the tags associated with the path
          // Is to be updated
          if('Evidence Tags' in evInfo['Allele evidence']['properties']['Subject']['properties'] && 'items' in evInfo['Allele evidence']['properties']['Subject']['properties']['Evidence Tags'])
          {
            if(evInfo['Allele evidence']['properties']['Subject']['properties']['Evidence Tags']['items'].length > 0)
            {
              evitems = evInfo['Allele evidence']['properties']['Subject']['properties']['Evidence Tags']['items'] ;
              for(var ii=0; ii<evitems.length; ii++)
              {
               // handle cases where the element has only Evidence Tag and not Tag- not reqd property.
               if('Tag' in evitems[ii]['Evidence Tag']['properties']) 
               {
                 if(evitems[ii]['Evidence Tag']['properties']['Tag']['properties']['Pathogenicity']['value'] == patho && evitems[ii]['Evidence Tag']['properties']['Tag']['properties']['Strength']['value'] == strength && evitems[ii]['Evidence Tag']['properties']['Tag']['properties']['Type']['value'] == evidencetype)
                 {
                   if('Links' in evitems[ii]['Evidence Tag']['properties']['Tag']['properties'] && 'items' in evitems[ii]['Evidence Tag']['properties']['Tag']['properties']['Links'])
                   {
                     tagLinks[evitems[ii]['Evidence Tag']['value']] = evitems[ii]['Evidence Tag']['properties']['Tag']['properties']['Links']['items'] ;
                   }
                 }
                 else{filteredEvItems.push(evitems[ii]);}
               }
              }
            }
            evInfo['Allele evidence']['properties']['Subject']['properties']['Evidence Tags']['items'] = filteredEvItems ;
            console.log(evInfo) ;
          }
         // optional properties are missing
         else
         {
           if('Evidence Tags' in evInfo['Allele evidence']['properties']['Subject']['properties'])
           {
             evInfo['Allele evidence']['properties']['Subject']['properties']['Evidence Tags']['items'] = [] ;      
           }
           else
           {
             evInfo['Allele evidence']['properties']['Subject']['properties']['Evidence Tags'] = {} ;
             evInfo['Allele evidence']['properties']['Subject']['properties']['Evidence Tags']['items'] = [] ;
           }
         }

         for(var jj=0; jj<dataItems.length; jj++)
         {
           tmpItem = getEvTemplate() ;
           tmpItem['Evidence Tag']['value'] = dataItems[jj]['data']['evidencetag'];
           tmpItem['Evidence Tag']['properties']['Tag']['value'] = dataItems[jj]['data']['tag'] ;
           tmpItem['Evidence Tag']['properties']['Tag']['properties']['Summary']['value'] = dataItems[jj]['data']['summary'] ;
           tmpItem['Evidence Tag']['properties']['Tag']['properties']['Pathogenicity']['value'] = patho ;
           tmpItem['Evidence Tag']['properties']['Tag']['properties']['Type']['value'] = evidencetype ;
           tmpItem['Evidence Tag']['properties']['Tag']['properties']['Strength']['value'] = strength ;
           if(dataItems[jj]['data']['stat'] == "On" || dataItems[jj]['data']['stat'] == "Off")
           {  
             tmpItem['Evidence Tag']['properties']['Tag']['properties']['Status']['value'] = dataItems[jj]['data']['stat'] ;
           }
           // restore the links
           if(dataItems[jj]['data']['evidencetag'] in tagLinks)
           {
             tmpItem['Evidence Tag']['properties']['Tag']['properties']['Links'] = {} ;
             tmpItem['Evidence Tag']['properties']['Tag']['properties']['Links']['items'] = tagLinks[dataItems[jj]['data']['evidencetag']] ;
           }
           evInfo['Allele evidence']['properties']['Subject']['properties']['Evidence Tags']['items'].push(tmpItem) ;
           tmpItem = [];
         }
          
          console.log(evInfo) ;
         // check if the class in invalidCount and dataItems is empty
         // is yes then the class has to be changed to invalid
         var cellCls = document.getElementById(cellId).className ;  
         if(cellCls == 'invalidCount' && dataItems.length == 0){changeClsToInvalid = true;}       
         // if the length of the evidence tag items in the doc is 0 then set hasnotags =true
         if( evInfo['Allele evidence']['properties']['Subject']['properties']['Evidence Tags']['items'].length == 0) {var hasnotagsinfo = true ;}
         saveEviDoc(evInfo, changeClsToInvalid, cellId, response.request.options.params.grname, hasnotagsinfo);
        }
        else
        {
          var displayMsg = "The following error was encountered while retrieving the evidence document '<i>" + eviDoc + "</i>' :<br><br>";
          displayMsg += ( "<b>Error Code:</b> <i>" + (respStatus['statusCode'] ? respStatus['statusCode'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" ) ;
          displayMsg += ( "<b>Error Message:</b> <i>" + (respStatus['msg'] ? respStatus['msg'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" );
          displayMsg += "<br><br>Please contact a project admin to resolve this issue." ;
          Ext.Msg.alert("ERROR", displayMsg) ;
        }
    }
  }) ;
}

// The incoming data contains all the tags for a particular type
// Store data fetched from the selection model
function saveAllTagsOfType(evidenceType, dataItems, subjectsData, closeWindow)
{
  var activetab = Ext.getCmp('multitab').getActiveTab().title ;
  var evdocPath = grids[activetab].evidence ;
  var evids ;
  var patho ;
  var strength ;
  Ext.Ajax.request(
  {
    url : '/java-bin/apiCaller.jsp' ,
    timeout : 180000,
    method: 'GET',
    params:
    {
      rsrcPath: evdocPath +'?detailed=true',
      apiMethod : 'GET',
      grname: activetab
    },
    callback: function(opts, success, response)
    {
      var respObj  = JSON.parse(response.responseText) ;
      var respStatus   = respObj['status'] ;
      if(response.status >= 200 && response.status < 400 && response.responseText)
      {
        var evInfo = respObj['data'] ;
        var filteredEvItems = [] ;
        var tmpItem = [];
        // first keep everything that are not of the evidence type in the request, that should be inserted back as it is.
        if('Evidence Tags' in evInfo['Allele evidence']['properties']['Subject']['properties'] && 'items' in evInfo['Allele evidence']['properties']['Subject']['properties']['Evidence Tags'])
        {
          if(evInfo['Allele evidence']['properties']['Subject']['properties']['Evidence Tags']['items'].length > 0)
          {
            evitems = evInfo['Allele evidence']['properties']['Subject']['properties']['Evidence Tags']['items'] ;
            for(var ii=0; ii<evitems.length; ii++)
            {
              if('Tag' in evitems[ii]['Evidence Tag']['properties'])
              {
               if(evitems[ii]['Evidence Tag']['properties']['Tag']['properties']['Type']['value'] == evidenceType){}
               else{filteredEvItems.push(evitems[ii]);}
              }
            }
          }
          evInfo['Allele evidence']['properties']['Subject']['properties']['Evidence Tags']['items'] = filteredEvItems ;
        }
        // optional properties are missing
        else
        {
          if('Evidence Tags' in evInfo['Allele evidence']['properties']['Subject']['properties'])
          {
            evInfo['Allele evidence']['properties']['Subject']['properties']['Evidence Tags']['items'] = [] ;
          }
          else
          {
            evInfo['Allele evidence']['properties']['Subject']['properties']['Evidence Tags'] = {} ;
            evInfo['Allele evidence']['properties']['Subject']['properties']['Evidence Tags']['items'] = [] ;
          }
        }
        //var dataItems = Ext.getCmp('tagAndLinks').getSelectionModel().getSelection() ;
        for(var jj=0; jj<dataItems.length; jj++)
         {
             if(dataItems[jj].data.tagPresent == true) {
             tmpItem = getEvTemplate() ;
             
             // get the pathogenicity and strength
             evids = dataItems[jj].data.tagpath.split(".") ;
             patho = evids[0] ;
             strength = evids[1] ;
            
             tmpItem['Evidence Tag']['properties']['Tag']['value'] = dataItems[jj].data.tag ;
             tmpItem['Evidence Tag']['properties']['Tag']['properties']['Pathogenicity']['value'] = patho ;
             tmpItem['Evidence Tag']['properties']['Tag']['properties']['Summary']['value'] = dataItems[jj].data.tagtext ;
             tmpItem['Evidence Tag']['properties']['Tag']['properties']['Type']['value'] = evidenceType ;
             tmpItem['Evidence Tag']['properties']['Tag']['properties']['Strength']['value'] = strength ;
             // restore links if any
             if(dataItems[jj].data.tag in subjectsData && 'Tag' in subjectsData[dataItems[jj].data.tag] && 'Links' in subjectsData[dataItems[jj].data.tag].Tag['properties'])
             {
               tmpItem['Evidence Tag']['properties']['Tag']['properties']['Links'] = {} ;
               tmpItem['Evidence Tag']['properties']['Tag']['properties']['Links']['items'] = subjectsData[dataItems[jj].data.tag].Tag['properties']['Links']['items'] ;
             }
             evInfo['Allele evidence']['properties']['Subject']['properties']['Evidence Tags']['items'].push(tmpItem) ;
             tmpItem = [];
            }
         }
         if( evInfo['Allele evidence']['properties']['Subject']['properties']['Evidence Tags']['items'].length == 0) {var hasnotagsinfo = true ;}
         
         saveEviDoc(evInfo, null, null, response.request.options.params.grname, hasnotagsinfo, closeWindow);
      }
      else
      {
        var displayMsg = "The following error was encountered while retrieving the evidence document '<i>" + eviDoc + "</i>' :<br><br>";
        displayMsg += ( "<b>Error Code:</b> <i>" + (respStatus['statusCode'] ? respStatus['statusCode'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" ) ;
        displayMsg += ( "<b>Error Message:</b> <i>" + (respStatus['msg'] ? respStatus['msg'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" );
        displayMsg += "<br><br>Please contact a project admin to resolve this issue." ;
        Ext.Msg.alert("ERROR", displayMsg) ;
      }
    }
  });

}






// Gets the tag info from a static kb document
// to populate the respective tag stores
function getTagStore(gn, format, makeEmptyGrid)
{
  var level1 = "";
  var level2 = "";
  var level3 = "";
  var pa = "";
  tags = new Object(); // global
  tagDefs = new Object() ;
  tagExclusions = new Object() ;
  tagExclusions["warning"] = new Object() ;
  tagExclusions["prohibited"] = new Object() ;
  var allowedTagPath = grids[gn].tags ;
  console.log("Tags from getTabStor(): " + gn)
  console.log("Tags from getTabStor(): " + grids[gn].tags) ;
  Ext.Ajax.request(
  {
    url : '/java-bin/apiCaller.jsp' ,
    timeout : 180000,
    method: 'GET',
    params:
    {
      rsrcPath: allowedTagPath,
      apiMethod : 'GET',
      gName : gn,
    },
    callback: function(opts, success, response)
    {

        var respObj  = JSON.parse(response.responseText) ;
        var tagInfo = respObj['data'] ;
        var respStatus   = respObj['status'] ;
        if(response.status >= 200 && response.status < 400 && response.responseText)
        {
          var tagItems = tagInfo['AllowedTags']['properties']['Partitions']['items'] ;
          for(var ii=0; ii<tagItems.length; ii++)
          {
           level1 = tagItems[ii]['Partition']['properties']['Level1']['value'];
           level2 = tagItems[ii]['Partition']['properties']['Level2']['value'];
           level3 = tagItems[ii]['Partition']['properties']['Level3']['value'];
           pa = level1+"."+level2+"."+level3 ;
           var tagit = tagItems[ii]['Partition']['properties']['Tags']['items'];
           if(pa in tags)
           {
             for(var tt=0; tt<tagit.length; tt++)
             {
               tags[pa].push(tagit[tt]['Tag']['value']) ;
               if('properties' in tagit[tt]['Tag'] && 'Text' in tagit[tt]['Tag']['properties']){
                 tagDefs[tagit[tt]['Tag']['value']] = tagit[tt]['Tag']['properties']['Text']['value'] ;
               }
               else {tagDefs[tagit[tt]['Tag']['value']] = 'No Defintition' ;}
             } 
           }
           else
           {
             tags[pa] = [] ;
             for(var tt=0; tt<tagit.length; tt++)
             {
               tags[pa].push(tagit[tt]['Tag']['value']) ;
               if('properties' in tagit[tt]['Tag'] && 'Text' in tagit[tt]['Tag']['properties']){
                 tagDefs[tagit[tt]['Tag']['value']] = tagit[tt]['Tag']['properties']['Text']['value'] ;
               }
               else {tagDefs[tagit[tt]['Tag']['value']] = 'No Defintition' ;}
             }
           }
         }
         // get tag exclusions if any
         if('Exclusivities' in tagInfo['AllowedTags']['properties'] && 'items' in tagInfo['AllowedTags']['properties']['Exclusivities'] && tagInfo['AllowedTags']['properties']['Exclusivities']['items'].length > 0)
         {
           var tagExItems = tagInfo['AllowedTags']['properties']['Exclusivities']['items'] ;
           for(var jj=0; jj<tagExItems.length; jj++)
           {
            if(tagExItems[jj]['Exclusivity']['properties']['Problem Action']["value"] == "Warning")
            {
              tagExclusions.warning[tagExItems[jj]['Exclusivity']['properties']['Patterns']['value']] = tagExItems[jj]['Exclusivity']['properties'] ;
            }
            else
            {
              tagExclusions.prohibited[tagExItems[jj]['Exclusivity']['properties']['Patterns']['value']] = tagExItems[jj]['Exclusivity']['properties'] ;
            }
           }
         }
         if(makeEmptyGrid) {makeEmptyTable(tags, format, grids[response.request.options.params.gName].evidence) ;}
        }
        else
        {
          var displayMsg = "The following error was encountered while retrieving the evidence tag document '<i>" + allowedTagPath + "</i>' :<br><br>";
          displayMsg += ( "<b>Error Code:</b> <i>" + (respStatus['statusCode'] ? respStatus['statusCode'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" ) ;
          displayMsg += ( "<b>Error Message:</b> <i>" + (respStatus['msg'] ? respStatus['msg'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" );
          displayMsg += "<br><br>Please contact a project admin to resolve this issue." ;
          Ext.Msg.alert("ERROR", displayMsg) ;
        }
    }
  }) ;
}


function saveTagLinksToDoc(partitionPath, dataItems, selectedTag)
{

  var pars = partitionPath.split(".") ;
  var patho = pars[0] ;
  var strength = pars[1] ;
  var evidencetype = pars[2];
  var activetab = Ext.getCmp('multitab').getActiveTab().title ;
  var evDocPath = grids[activetab].evidence ;
   Ext.Ajax.request(
  {
    url : '/java-bin/apiCaller.jsp' ,
    timeout : 180000,
    method: 'GET',
    params:
    {
      rsrcPath: evDocPath,
      apiMethod : 'GET',
      tabname: activetab,
    },
    callback: function(opts, success, response)
    {
        var respObj  = JSON.parse(response.responseText) ;
        var respStatus   = respObj['status'] ;
        if(response.status >= 200 && response.status < 400 && response.responseText)
        {
          var evInfo = respObj['data'] ;
          var newLinkItems = [] ;
	  var tmpItem = [];
          
          if('Evidence Tags' in evInfo['Allele evidence']['properties']['Subject']['properties'] && 'items' in evInfo['Allele evidence']['properties']['Subject']['properties']['Evidence Tags'])
          {
            if(evInfo['Allele evidence']['properties']['Subject']['properties']['Evidence Tags']['items'].length > 0)
            {
              evitems = evInfo['Allele evidence']['properties']['Subject']['properties']['Evidence Tags']['items'] ;
              for(var ii=0; ii<evitems.length; ii++)
              {
               // handle cases where the element has only Evidence Tag and not Tag- not reqd property.
               if(evitems[ii]['Evidence Tag']['value'] == selectedTag) 
               {
                 if('Links' in evitems[ii]['Evidence Tag']['properties']['Tag']['properties'])
                 {
                   // Delete the existing links for the selected tag and insert new/updated ones
                   delete evitems[ii]['Evidence Tag']['properties']['Tag']['properties']['Links'] ;
                 }  
                 for(var jj=0; jj<dataItems.length; jj++)
                   {
                     tmpItem = getLinkTemplate() ; 
                     tmpItem['Link']['value'] = dataItems[jj].data.link ;
                     tmpItem['Link']['properties']['Link Code']['value'] = dataItems[jj].data.linkcode ; 
                     tmpItem['Link']['properties']['Comment']['value'] = dataItems[jj].data.comment ;
                     newLinkItems.push(tmpItem) ; 
                   }
                 evitems[ii]['Evidence Tag']['properties']['Tag']['properties']['Links'] = {"items": newLinkItems } ;                 
                 saveLinks(evInfo, partitionPath, selectedTag, response.request.options.params.tabname) ;
               }
              }
            }
            else
            {
              alert("ERROR: No matching tag found") ; 
            }
          }
         
         else
         {
           alert("ERROR: NO TAGS FOUND") ; 
         }

        }
        else
        {
          var displayMsg = "The following error was encountered while retrieving the evidence document '<i>" + eviDoc + "</i>' :<br><br>";
          displayMsg += ( "<b>Error Code:</b> <i>" + (respStatus['statusCode'] ? respStatus['statusCode'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" ) ;
          displayMsg += ( "<b>Error Message:</b> <i>" + (respStatus['msg'] ? respStatus['msg'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" );
          displayMsg += "<br><br>Please contact a project admin to resolve this issue." ;
          Ext.Msg.alert("ERROR", displayMsg) ;
          Ext.Msg.alert("ERROR", "API Failed to get the evidence document"+eviDoc+ ', ' + response.status+ ', ' + response.statusText) ;
        }
    }
  }) ;
}




function getCASourceLinks_obsolete() 
{
  // global
  var caSrcpath = decodeURIComponent(caSrcLinks) ;
  var caSrcpath = caSrcpath+'/docs?detailed=true&matchProp=AlleleSupportingData.Subject&matchValues='+caSub ;
  Ext.Ajax.request(
  {
    url : '/java-bin/apiCaller.jsp' ,
    timeout : 90000,
    method: 'GET',
    params:
    {
      rsrcPath: caSrcpath,
      apiMethod : 'GET'
    },
    callback: function(opts, success, response)
    {
      var respObj  = JSON.parse(response.responseText) ;
      var caSrcInfo = respObj['data'] ;
      var respStatus   = respObj['status'] ;
      if(response.status >= 200 && response.status < 400 && response.responseText)
      {
        if(caSrcInfo.length> 0 && 'Sources' in caSrcInfo[0].AlleleSupportingData.properties.Subject.properties && 'items' in caSrcInfo[0].AlleleSupportingData.properties.Subject.properties.Sources && caSrcInfo[0].AlleleSupportingData.properties.Subject.properties.Sources.items.length > 0)
        {
          var srcitems = caSrcInfo[0].AlleleSupportingData.properties.Subject.properties.Sources.items ;
          var alleleStr = '' ;
          for(var ii=0; ii<srcitems.length; ii++)
          {

             alleleStr += '<a class="linkbutton" href="'+srcitems[ii].Source.properties.url.value+'" target="_blank">'+srcitems[ii].Source.value+'</a>  &nbsp;&nbsp'
          }
          topPanelInfo[ca].callele = alleleStr ;
        }
        else{topPanelInfo[ca].callele = 'No Supporting Data'};
      }
      else
      {
        
        topPanelInfo.callele = "No Supporting Data" ;
        var displayMsg = "The following error was encountered while retrieving the canonical allele source links for the ca subject '<i>" + caSub + "</i>' :<br><br>"
        displayMsg += ( "<b>Error Code:</b> <i>" + (respStatus['statusCode'] ? respStatus['statusCode'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" ) ;
        displayMsg += ( "<b>Error Message:</b> <i>" + (respStatus['msg'] ? respStatus['msg'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" );
        displayMsg += "<br><br>Please contact a project admin to resolve this issue." ;
        Ext.Msg.alert("ERROR", displayMsg) ;
      }
    }
  });
}


function getEvidenceAndGridsForCA()
{
   var evpath;
   var tags ;
   var transform ;
   var quest ;
   var guides ;
   var guidelines = [] ;
   var last = false ;
   var displaynames = [];
   var evId;
   var evidencePath;
   // true when the ajax request is on the last document on the evidence source collection
   var lastdocInreg = false;
   // true when this is the last evidence source item on the last document
   var lastsourceinDoc = false;
   // global that holds the name of all the gridnames after it pawns thr the evidenc sources
   // Multiple guidelines, evidences are all considered accordingly
   gridNames = [] ;
   var gridNamesnotordered = [] ; 
   gridNamesMap = {} ; // global to map the mulipied gridnames
   // go through the source registry coll
   for (var ii=0; ii<sourceRegistry.length; ii++)
    {
      if(ii == sourceRegistry.length-1){ lastdocInreg = true ;}
      // for every evidence source entry
      evItems = sourceRegistry[ii].SourceRegistry.properties.EvidenceSources.items ;
      for(var jj=0; jj<evItems.length; jj++)
      {
        if(jj == evItems.length-1) {lastsourceinDoc = true ;}
        guidelines = [] ;
        displaynames = [];
        redminePr = [] ;
        types = [] ;
        evpath = "" ;
        evRsrc = null;
        evpath = evItems[jj].EvidenceSource.properties.Evidence.value ;
        tags = evItems[jj].EvidenceSource.properties.Tags.value ;
        transform = evItems[jj].EvidenceSource.properties.Transform.value ;
        quest = evItems[jj].EvidenceSource.properties.Questionnaire.value ;
        // When guidelines are missing
        if(('Guidelines' in evItems[jj].EvidenceSource.properties) && ('items' in evItems[jj].EvidenceSource.properties.Guidelines) && (evItems[jj].EvidenceSource.properties.Guidelines.items.length > 0))
        {
          guides = evItems[jj].EvidenceSource.properties.Guidelines.items ;
          // get the guidelines and display names for each evidence source
          for(var gg=0; gg<guides.length; gg++)
          {
            guidelines.push(guides[gg].Guideline.value) ;
            gridNames.push(guides[gg].Guideline.properties.displayName.value);
            displaynames.push(guides[gg].Guideline.properties.displayName.value);
            // redmine project is an optional property.Handle when absent
            if('redmineProject' in guides[gg].Guideline.properties)
            {
              redminePr.push(guides[gg].Guideline.properties.redmineProject.value) ;
            }
            else
            {
              redminePr.push(null);
            }
            types.push(guides[gg].Guideline.properties.type.value) ;
          }
        }
        else // no guideline
        {
          guidelines.push(null) ;
          // Display name is the name of the evidence source property of that item
          gridNames.push(evItems[jj].EvidenceSource.value) ;
          displaynames.push(evItems[jj].EvidenceSource.value) ;
          redminePr.push(null) ;
          types.push(null) ;
        }
        evRsrc = evpath ;
        // Do a request on the evidence source with all the subject list of the canonical allele
        evRsrc = evRsrc + '/docs?detailed=true&matchProp=Allele%20evidence.Subject&matchValues='+caSub ;
        Ext.Ajax.request(
          {
            url : '/java-bin/apiCaller.jsp' ,
            timeout : 90000,    
            method: 'GET',
            params:
            {
              rsrcPath: evRsrc,
              apiMethod : 'GET',
              evidenceSource: evpath ,
              tags: tags,
              transform: transform,
              quest: quest,
              guidelines: guidelines,
              redminePrs: redminePr,  
              types: types,
              displaynames: displaynames,
              lastdoc: lastdocInreg,
              lastsource: lastsourceinDoc
            },
            callback: function(opts, success, response)
            {
              apiRespObj  = JSON.parse(response.responseText) ;
              var docInfo = [] ;
              docInfo = apiRespObj['data'] ;
              statusObj   = apiRespObj['status'] ;
             if(response.status >= 200 && response.status < 400 && docInfo)
             {
                evidencePath = null ;
                if(docInfo.length == 1) // just one evidence doc
                {
                  evId = docInfo[0]['Allele evidence']['value'] ;
                  evidencePath = response.request.options.params.evidenceSource +'/doc/'+evId ;
                  if('Evidence Tags' in docInfo[0]['Allele evidence']['properties']['Subject']['properties'] && 'items' in docInfo[0]['Allele evidence']['properties']['Subject']['properties']['Evidence Tags'] && docInfo[0]['Allele evidence']['properties']['Subject']['properties']['Evidence Tags']['items'].length > 0) {var hasnotags = false}
                  else {var hasnotags = true ;}
                }
                if(docInfo.length <=1) // if the evidence doc is one or absent make the unique grid combination
                {
                  for(var ll=0; ll<response.request.options.params.guidelines.length; ll++)
                  {
                     gridName = response.request.options.params.displaynames[ll] ;
                     grids[gridName] = {} ;
                     gridNamesMap[gridName] = [gridName] ;
                     grids[gridName].evidence = evidencePath;
                     grids[gridName].tags = response.request.options.params.tags ;
                     grids[gridName].transform = response.request.options.params.transform ;
                     grids[gridName].questionnaire = response.request.options.params.quest ;
                     grids[gridName].guideline = response.request.options.params.guidelines[ll] ;
                     grids[gridName].redminePr = response.request.options.params.redminePrs[ll] ;
                     grids[gridName].type = response.request.options.params.types[ll] ;
                     grids[gridName].reasonerOutput = null;
                     grids[gridName].hasnotags = hasnotags ;
                     //mark the last document, last doc, last source and last guideline?
                     if(response.request.options.params.lastdoc == true && response.request.options.params.lastsource == true && ll+1 == response.request.options.params.guidelines.length){grids[gridName].last = true; }
                     if(grids[gridName].evidence) 
                     { 
                       getEviVersion(gridName, true, null) ;
                     }
                     else {getConclusionForGrids(gridName) ;}
                  }
                }
                else// multiple evidence docs from a single evidence coll. make additional display names for every combination
                  for(var kk=0; kk<docInfo.length; kk++)
                  {
                    evId = docInfo[kk]['Allele evidence']['value'] ;
                    evidencePath = response.request.options.params.evidenceSource +'/doc/'+evId ;
                    if('Evidence Tags' in docInfo[kk]['Allele evidence']['properties']['Subject']['properties'] && 'items' in docInfo[kk]['Allele evidence']['properties']['Subject']['properties']['Evidence Tags'] && docInfo[kk]['Allele evidence']['properties']['Subject']['properties']['Evidence Tags']['items'].length > 0) {var hasnotags = false}
                  else {var hasnotags = true}
                    for(var ll=0; ll<response.request.options.params.guidelines.length; ll++)
                    {
                      gridName = response.request.options.params.displaynames[ll]+'_'+(kk+1) ;
                      grids[gridName] = {} ;
                      if(response.request.options.params.displaynames[ll] in gridNamesMap) {gridNamesMap[response.request.options.params.displaynames[ll]].push(gridName) ;} 
                      else {gridNamesMap[response.request.options.params.displaynames[ll]] = [gridName] ;}
                      grids[gridName].evidence = evidencePath;
                     grpUri = getGrpUri(evidencePath) ;
                     // Need this only if the page is private. No user for a public page
                      grids[gridName].tags = response.request.options.params.tags ;
                      grids[gridName].transform = response.request.options.params.transform ;
                      grids[gridName].questionnaire = response.request.options.params.quest ;
                      grids[gridName].guideline = response.request.options.params.guidelines[ll] ;
                      grids[gridName].redminePr = response.request.options.params.redminePrs[ll] ;
                      grids[gridName].type = response.request.options.params.types[ll] ;
                      grids[gridName].reasonerOutput = null;
                      grids[gridName].hasnotags = hasnotags ;
                      if((response.request.options.params.lastdoc == true) && (response.request.options.params.lastsource == true) && (kk == docInfo.length-1) && (ll+1 == response.request.options.params.guidelines.length)){grids[gridName].last = true ;}
                      if(grids[gridName].evidence) {getEviVersion(gridName, true, null) ;}
                      else{getConclusionForGrids(gridName) ;}
                    }
                  }
             }
             else
             {
                for(var dd=0; dd<response.request.options.params.displaynames.length; dd++)
                {
                  for (var gg=0; gg<gridNames.length; gg++)
                  {
                    if(gridNames[gg] == response.request.options.params.displaynames[dd])
                    {
                      gridNames.splice(gg, 1) ;
                      break ;
                    }
                  }
                }
                 console.log("BAD permission : : Removing grids corresponding to the evidence source . . " + response.request.options.params.evidenceSource+ " " +response.status) ;
                if((response.request.options.params.lastdoc == true) && (response.request.options.params.lastsource == true))
                {
                  // last grid has no permissions, go ahead with making the tabs with whatever is left on grids
                  setTimeout(addTabs, 2000); 
                }
           }
         }
      }) ;
     }
  }
}


// get version of an evidence document
// getConclusion to true would then get the conclusion of the grid passed through gridname
// updateAllCaches would update both the evidence cache and conclusion cache
function getEviVersion(gName, getConclusion, updateAllCaches)
{
  var evidenceDocUrl = grids[gName].evidence ;
  var evRsPath = evidenceDocUrl+'/ver/HEAD?versionNumOnly=true' ;
  Ext.Ajax.request(

  {
    url : '/java-bin/apiCaller.jsp' ,
    timeout : 180000,
    method: 'GET',
    params:
    {
      rsrcPath: evRsPath,
      apiMethod : 'GET',
      gridname: gName,
      cache: updateAllCaches,
      getConclusion: getConclusion
    },
    callback: function(opts, success, response)
    {

        var respObj  = JSON.parse(response.responseText) ;
        var numInfo = respObj['data'] ;
        var respStatus   = respObj['status'] ;
        if(response.status >= 200 && response.status < 400 && response.responseText)
        {
          // If evidence is present get the conclusion from cache
          if(grids[response.request.options.params.gridname].evidence)
          {
            grids[response.request.options.params.gridname].version = numInfo['number'] ;
          }
          else // no evidence leave evidence as an empty string
          {
             grids[response.request.options.params.gridname].version = null ;
          }
          if(response.request.options.params.cache == true)
          {
            if(grids[response.request.options.params.gridname].guideline)
            {
              console.log("Updating Cache for the grid: " +response.request.options.params.gridname );
              updateCache(response.request.options.params.gridname) ;
              updateEvidenceCache(response.request.options.params.gridname) ;
            }
            //makeEvidenceCacheDoc() ;
            //updateEvidenceCache() ;
          }
          // send to get the conclusion even if guideline is missing, is filetered within  getConclusionForGrids
          if(response.request.options.params.getConclusion == true)
          {
            getConclusionForGrids(response.request.options.params.gridname) ;
          }
   
        }
        else
        {
          var displayMsg = "The following error was encountered while retrieving the evidence document version for the grid name'<i>" + gName + "</i>' :<br><br>"
          displayMsg += ( "<b>Error Code:</b> <i>" + (respStatus['statusCode'] ? respStatus['statusCode'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" ) ;
          displayMsg += ( "<b>Error Message:</b> <i>" + (respStatus['msg'] ? respStatus['msg'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" );
          displayMsg += "<br><br>Please contact a project admin to resolve this issue." ;
          Ext.Msg.alert("ERROR", displayMsg) ;
        }
    }
    }) ;  
}

// get the list of all canonical alleles from all the
// evidence sources (docs from evidences)
function getCAsFromAllEvidenceSources()
{
  // global
  caAlleles = new Object() ;
  alleleSorted =  [] ;
  var sourceRegPath = decodeURIComponent(evSourceUrl) ;
  sourceRegPath = sourceRegPath + '/docs?detailed=true' ;
  Ext.Ajax.request(
  {
    url : '/java-bin/apiCaller.jsp' ,
    timeout : 90000,
    method: 'GET',
    params:
    {
      rsrcPath: sourceRegPath,
      apiMethod : 'GET'
    },
    callback : function(opts, success, response)
    {
      var apiRespObj  = JSON.parse(response.responseText) ;
      if(response.status >= 200 && response.status < 400 && apiRespObj)
      {
        sourceRegistry = apiRespObj['data'] ;
        countableEvidenceSources = new Object() ;
        var evisourceItems = [] ;
        var guideitems = [];
        var guideline = [];
        var evisourcePath ;
        var lastdocInReg = false ;
        var lastSourceinDoc = false;
        caAlleles = new Object() ;
        var totalDocs =   0 ;
        for (var ii=0; ii<sourceRegistry.length; ii++)
        {
          if(ii == sourceRegistry.length-1){ lastdocInReg = true ;}
          evisourceItems = sourceRegistry[ii].SourceRegistry.properties.EvidenceSources.items ;
          for(var jj=0; jj<evisourceItems.length; jj++)
          {
            if(jj == evisourceItems.length-1) {lastSourceinDoc = true ;}
            evisourcePath =  evisourceItems[jj].EvidenceSource.properties.Evidence.value ;
            if(('Guidelines' in evisourceItems[jj].EvidenceSource.properties) && ('items' in evisourceItems[jj].EvidenceSource.properties.Guidelines) && (evisourceItems[jj].EvidenceSource.properties.Guidelines.items.length > 0))
            {
              guideitems =  evisourceItems[jj].EvidenceSource.properties.Guidelines.items ;
              guideline = [];
              for(var gg=0; gg<guideitems.length; gg++){ guideline.push(guideitems[gg].Guideline.value) ; }
            }
            Ext.Ajax.request(
            {
              url : '/java-bin/apiCaller.jsp' ,
              timeout : 90000,
              method: 'GET',
              params:
              {
                rsrcPath: evisourcePath +'/docs?detailed=true' ,
                apiMethod : 'GET' ,
                lastdoc: lastdocInReg ,
                lastsource: lastSourceinDoc,
                guideline : guideline ,
                evSrcPath: evisourcePath
              },
              callback : function(opts, success, response)
              {
                var apiRespObj  = JSON.parse(response.responseText) ;
                var collinfo = apiRespObj['data'] ;
                if(response.status >= 200 && response.status < 400 && collinfo)
                {
                  for(var cc=0; cc<collinfo.length; cc++)
                  {
                    var docid =  collinfo[cc]['Allele evidence'].value ;
                    countableEvidenceSources[response.request.options.params.evSrcPath+'/doc/'+docid] = {};
                    for (var ss=0; ss<response.request.options.params.guideline.length; ss++)
                    {
                      countableEvidenceSources[response.request.options.params.evSrcPath+'/doc/'+docid][response.request.options.params.guideline[ss]] = true ;
                    }
                    var casub = collinfo[cc]['Allele evidence']['properties']['Subject']['value'] ;
                    if(casub && casub.length != 0)
                    {
                      caAlleles[casub] = {} ;
                      caAlleles[casub].CA = casub.split("/").pop() ;
                    }
                  }
                }
                if(response.request.options.params.lastdoc == true && response.request.options.params.lastsource == true)
                {
                  setTimeout(function(){
                  console.log('has all the evidence sources') ;
                  if(Ext.getCmp('gvGrid')){Ext.getCmp('gvGrid').destroy() ;}
                  alleleSorted = Object.keys(caAlleles).sort() ;
                  makePanel() ;
                  }, 4000) ;
                }
              }
            });
          }
        }
      }
      else
      {
        displayFailureDialogSource(response) ;
      }
    }
  }) ;
}


  
// get all the evidence source registry docs
function getSourceRegistry(makeGrid)
{
  
  var sourceRegPath = decodeURIComponent(evSourceUrl) ;
  sourceRegPath = sourceRegPath + '/docs?detailed=true' ; 
  Ext.Ajax.request(
  {
    url : '/java-bin/apiCaller.jsp' ,
    timeout : 90000,
    params:
    {
      rsrcPath: sourceRegPath,
      apiMethod : 'GET',
      makeGrid: makeGrid
    },
    method: 'GET',
    success: getSourceRegData,
    failure: displayFailureDialogSource
  }) ;


}

// Source registry success failure functions

function getSourceRegData(result, request)
{
  var srcObj  = JSON.parse(result.responseText) ;
  var makeGrid = result.request.options.params.makeGrid ;
  sourceRegistry = srcObj['data'] ; // global
  // for the calculator page
  if(makeGrid == true)
    {makeBigGrid() ;}
  else // just get the list of evidence sources the user has access to
  {
  }
}







function getConclusionForGrids(gridName)
{
 if(grids[gridName].evidence && grids[gridName].guideline)
 { 
   var cachePath = decodeURIComponent(conCacheUrl) ;
   var evidenceDocUrl;
   var evidenceDocUrl = grids[gridName].evidence ;
  
   var cachePath = cachePath+'/docs?detailed=true&matchProps=ConclusionCacheID.Guideline,ConclusionCacheID.Evidence%20Doc&matchValues='+grids[gridName].guideline+','+evidenceDocUrl+'&matchLogicOp=and' ;
   Ext.Ajax.request(

   {
     url : '/java-bin/apiCaller.jsp' ,
     timeout : 180000,
     method: 'GET',
     params:
     {
       rsrcPath: cachePath,
       apiMethod : 'GET',
       gridname: gridName
     },
     callback: function(opts, success, response)
     {

       var respObj  = JSON.parse(response.responseText) ;
       var cacheInfo = respObj['data'] ;
       var respStatus   = respObj['status'] ;
       if(response.status >= 200 && response.status < 400 && response.responseText && cacheInfo)
       {
         if(cacheInfo.length == 0)
         {
           grids[response.request.options.params.gridname].conclusion = "Undetermined" ;
         }
         else
         {
          // If evidence is present get the conclusion from cache
           grids[response.request.options.params.gridname].conclusion = cacheInfo[0].ConclusionCacheID.properties.FinalCall.value ;
            //updateSummaryRow() ;    
           if('ReasonerOutput' in cacheInfo[0].ConclusionCacheID.properties && ('properties' in cacheInfo[0].ConclusionCacheID.properties['Evidence Doc']) && ('Version' in cacheInfo[0].ConclusionCacheID.properties['Evidence Doc'].properties))
           {
             var version = cacheInfo[0].ConclusionCacheID.properties['Evidence Doc'].properties.Version.value ;
             if(version == grids[response.request.options.params.gridname].version) 
             {
               console.log("Getting  the reasoneroutput from the conclusion cache document:   " + response.request.options.params.gridname) ;
               grids[response.request.options.params.gridname].reasonerOutput = cacheInfo[0].ConclusionCacheID.properties.ReasonerOutput.value ;
             }
           }
         }
         if(grids[response.request.options.params.gridname].last){
           setTimeout(addTabs, 2000);
         }
       }
       else
       {
         var displayMsg = "The following error was encountered while retrieving the canonical allele document '<i>" + ca + "</i>' :<br><br>"
         displayMsg += ( "<b>Error Code:</b> <i>" + (respStatus['statusCode'] ? respStatus['statusCode'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" ) ;
         displayMsg += ( "<b>Error Message:</b> <i>" + (respStatus['msg'] ? respStatus['msg'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" );
         displayMsg += "<br><br>Please contact a project admin to resolve this issue." ;
         Ext.Msg.alert("ERROR", displayMsg) ;
       }
      }
    }) ;
  }
  else // no evidence or guideline or both
  {
    if(grids[gridName].evidence){grids[gridName].conclusion = 'Undetermined'} //  no guidelines
    else {grids[gridName].conclusion = "" ;}
    if(grids[gridName].last){setTimeout(addTabs, 2000); }
  }
}

// updates evidence cache. Looks for evidence cache
// document corresponding to the ca url. 
// If found the document is updated with respect to
// the evidence urls. Else a fresh new document is made and inserted.
function updateEvidenceCache(gridn)
{

  //console.log("Getting the evidence cache doc wrp to the ca subject, evidence and guideline" +caSub) ;
  var docIdentifier = caSub+'|'+grids[gridn].evidence+'|'+grids[gridn].guideline ;
  // create the document identifer for the document from the string above.
  var md = forge.md.md5.create();
  md.update(docIdentifier) ;
  var docID = md.digest().toHex() ;
  var evCachepath = decodeURIComponent(evCacheUrl) ;
  // get the document with respect to the ca subject.
  evCachepath = evCachepath +'/doc/'+docID;


  Ext.Ajax.request(
  {
    url : '/java-bin/apiCaller.jsp' ,
    timeout : 180000,
    method: 'GET',
    params:
    {
      rsrcPath: evCachepath,
      apiMethod : 'GET',
      gridn: gridn
    },
    callback: function(opts, success, response)
    {

       var respObj  = JSON.parse(response.responseText) ;
       var evcacheInfo = respObj['data'] ;
       var respStatus   = respObj['status'] ;
       if(response.status >= 200 && response.status < 400 && response.responseText)
       {
         // document is laready there then, update the cache  
         updateEvcacheDoc(evcacheInfo, response.request.options.params.gridn) ;
       }
       else if(response.status == 404) // no document
       {
         makeEvidenceCacheDoc(docID, response.request.options.params.gridn) ;
       }
       else
       {
         var displayMsg = "The following error was encountered while retrieving Evidence Cache documene for the canonical allele document '<i>" + ca + "</i>' :<br><br>"
         displayMsg += ( "<b>Error Code:</b> <i>" + (respStatus['statusCode'] ? respStatus['statusCode'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" ) ;
         displayMsg += ( "<b>Error Message:</b> <i>" + (respStatus['msg'] ? respStatus['msg'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" );
         displayMsg += "<br><br>Please contact a project admin to resolve this issue." ;
         Ext.Msg.alert("ERROR", displayMsg) ;
       }

     }

  });
  
}


function updateEvcacheDoc(evCacheDoc, grName)
{
  //console.log("Evidence cache found ::::: Starting to update");
  evCacheDoc.EvidenceCacheID.properties.FinalCall.value = grids[grName].conclusion ;
  if(!('EvidenceDocVersion' in evCacheDoc.EvidenceCacheID.properties)) {evCacheDoc.EvidenceCacheID.properties.EvidenceDocVersion = {} ;}
  //console.log(evCacheDoc) ;
  evCacheDoc.EvidenceCacheID.properties.EvidenceDocVersion.value = grids[grName].version ; 
  saveEvidenceCache(evCacheDoc) ;
}

// Iterates through the grid and makes an 
// evidence cache and submits it to the evcache collection.
// Also update store record of the etnry page

function makeEvidenceCacheDoc(docID, ggname)
{
  console.log("Making new evidence cache document ....") ;
  var cacheObj = {} ;
  // make the cacheObj
  cacheObj.EvidenceCacheID = {} ;
  cacheObj.EvidenceCacheID.value = docID ;
  cacheObj.EvidenceCacheID.properties = {} ;
  

  cacheObj.EvidenceCacheID.properties.CanonicalAllele = {} ;
  cacheObj.EvidenceCacheID.properties.CanonicalAllele.value = caSub ;
  cacheObj.EvidenceCacheID.properties['Evidence Doc'] = {} ;
  cacheObj.EvidenceCacheID.properties['Evidence Doc'].value = grids[ggname].evidence ;
  
  cacheObj.EvidenceCacheID.properties.EvidenceDocVersion = {} ;
  cacheObj.EvidenceCacheID.properties.EvidenceDocVersion.value = grids[ggname].version ;

  cacheObj.EvidenceCacheID.properties.FinalCall = {} ;
  cacheObj.EvidenceCacheID.properties.FinalCall.value = grids[ggname].conclusion ;
 
  

  cacheObj.EvidenceCacheID.properties.Guideline = {} ;
  cacheObj.EvidenceCacheID.properties.Guideline.value = grids[ggname].guideline ;

  cacheObj.EvidenceCacheID.properties.Type = {} ;
  cacheObj.EvidenceCacheID.properties.Type.value = grids[ggname].type ;
  // save the updated Cacche doc
  saveEvidenceCache(cacheObj) ;

}


function saveEvidenceCache(cacheDoc)

{
  var evcachePath = decodeURIComponent(evCacheUrl) ;
  var docid = cacheDoc.EvidenceCacheID.value ;
  var rsPath = evcachePath+'/doc/'+docid ;
   Ext.Ajax.request(
   {
      url : '/java-bin/apiCaller.jsp' ,
      timeout : 90000,
      params:
      {
        rsrcPath: rsPath,
        apiMethod : 'PUT',
        payload: Ext.JSON.encode({"data": cacheDoc})
      },
      method: 'POST',
      success: evCacheSuccess
      //failure: evCacheFailed

  }) ;
}



function getRolefortheGroup(grpuri, lastgrid)
{
  var grpRolePath = grpuri+'/usr/'+user+'/role?connect=no' ;
  Ext.Ajax.request(
  {
    url : '/java-bin/apiCaller.jsp' ,
    timeout : 9000,
    method: 'GET',
    params:
    {
      rsrcPath: grpRolePath,
      apiMethod : 'GET',
      lastgrid: lastgrid
    },
    callback: function(opts, success, response)
    {
      var apiRespObj  = JSON.parse(response.responseText) ;
      var roleInfo = apiRespObj['data'] ;
      var statusObj   = apiRespObj['status'] ;
      if(response.status >= 200 && response.status < 400 && roleInfo)
      {
        uniquegrpUris[grpuri] = roleInfo['role'] ;
      }
      else if(response.status >400)
      {
        uniquegrpUris[grpuri] = 'noaccess' ;
      }
      if(response.request.options.params.lastgrid) {showCopyTagWindow();}
    }
  });


}
// copy tags from an evidence document to another document.
// user roles are verified at this point
function copyTagsFromTo(fromGrid, toGrid)
{
  // first get the tags fron fromGrid
  // then put the tags to toGrid
  var fromGridEv = grids[fromGrid].evidence ;
  var tagsTocopy ;

  Ext.Ajax.request(
  {
    url: '/java-bin/apiCaller.jsp' ,
    timeout: 9000,
    method : 'GET',
    params:
    {
      rsrcPath : fromGridEv +'?detailed=true',
      apiMethod : 'GET',
      copyto : toGrid
    },
    callback : function(opts, success, response)
    {
      var respObj  = JSON.parse(response.responseText) ;
      var respStatus   = respObj['status'] ;
      if(response.status >= 200 && response.status < 400 && response.responseText)
      {
        var evInfo = respObj['data'] ;
        tagsTocopy = evInfo['Allele evidence']['properties']['Subject'].properties['Evidence Tags']['items'] ;
        copyTags(response.request.options.params.copyto, tagsTocopy)
      }
      else
      {
        var displayMsg = "The following error was encountered while retrieving the evidence document '<i>" + fromGridEv + "</i>' :<br><br>";
        displayMsg += ( "<b>Error Code:</b> <i>" + (respStatus['statusCode'] ? respStatus['statusCode'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" ) ;
        displayMsg += ( "<b>Error Message:</b> <i>" + (respStatus['msg'] ? respStatus['msg'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" );
        displayMsg += "<br><br>Please contact a project admin to resolve this issue." ;
        Ext.Msg.alert("ERROR", displayMsg) ;
      }
    }
  });

} 


// gets the copytoGrid evidence document. On successful get a subsequent put is done on 
// it with tagsTobecopied
function copyTags(copytoGrid, tagsTobecopied)
{
  var cpToGridPath = grids[copytoGrid].evidence ;
  Ext.Ajax.request(
  {
    url: '/java-bin/apiCaller.jsp' ,
    timeout: 9000,
    method : 'GET',
    cpGrid: copytoGrid,
    params:
    {
      rsrcPath : cpToGridPath +'?detailed=true',
      apiMethod : 'GET',
      copyto : copytoGrid
    },
    callback : function(opts, success, response)
    {
      var respObj  = JSON.parse(response.responseText) ;
      var respStatus   = respObj['status'] ;
      if(response.status >= 200 && response.status < 400 && response.responseText)
      {
        var cpInfo = respObj['data'] ;
        cpInfo['Allele evidence']['properties']['Subject'].properties['Evidence Tags'] = {} ;
	cpInfo['Allele evidence']['properties']['Subject'].properties['Evidence Tags']['items']  = tagsTobecopied;
        savecopiedTags(response.request.options.params.copyto, cpInfo)
      }
      else
      {
        var displayMsg = "The following error was encountered while retrieving the evidence document '<i>" + response.request.options.params.copyto + "</i>' :<br><br>";
        displayMsg += ( "<b>Error Code:</b> <i>" + (respStatus['statusCode'] ? respStatus['statusCode'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" ) ;
        displayMsg += ( "<b>Error Message:</b> <i>" + (respStatus['msg'] ? respStatus['msg'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" );
        displayMsg += "<br><br>Please contact a project admin to resolve this issue." ;
        Ext.Msg.alert("ERROR", displayMsg) ;
      }
    }
  });
}

// copied tags document is put back here.
function savecopiedTags(copyName, tobecopiedDoc)
{
  var copyEvPath = grids[copyName].evidence ;
  Ext.Ajax.request(
  {
    url : '/java-bin/apiCaller.jsp' ,
    timeout : 9000,
    params:
    {
      rsrcPath: copyEvPath,
      apiMethod : 'PUT',
      copyn: copyName,
      payload: Ext.JSON.encode({"data": tobecopiedDoc})
    },
    method: 'POST',
    success: successcopiedTags,
    failure: displayFailurecopiedTags
  }) ;  

}

function getalleleInfoFomReg(ca, taskId, entryInnerId)
{
  var masks = ["entryMask", "hgvsMask", "alleleMask", "tabMask", "summaryMask"] ;
  var allelePath = decodeURIComponent(regAddress);
  allelePath = allelePath + '/allele/'+ ca ;
  Ext.Ajax.request(
  {
    url: '/java-bin/apiCaller.jsp',
    timeout: 9000,
    //disableCaching: false,
    method : 'GET',
    params:
    {
      rsrcPath : allelePath,
      apiMethod : 'GET'
    },
    callback : function(opts, success, response)
    {
      var respObj  = JSON.parse(response.responseText) ;
      var alleleInfo = []
      if(response.status >= 200 && response.status < 400 && respObj)
      {
        if("@id" in respObj) {
          caSub = respObj["@id"] ; 
        }
        topPanelInfo[ca] = new Object() ;
        topPanelInfo[ca].geneSubject = new Object() ;
        topPanelInfo[ca].hgvs = [] ;
        if("aminoAcidAlleles" in respObj)
        {
          alleleInfo = respObj.aminoAcidAlleles ;
          getGeneSubAndHGVSFromArray(alleleInfo, ca) ; // see helper.js
          getGeneFromRegistry(ca, taskId, entryInnerId) ;
        }
        else if("genomicAlleles" in respObj)
        {
          alleleInfo = respObj.genomicAlleles ;
          getGeneSubAndHGVSFromArray(alleleInfo, ca) ; // see helper.js
          if("transcriptAlleles" in respObj)
          {
            alleleInfo = respObj.transcriptAlleles ;
            getGeneSubAndHGVSFromArray(alleleInfo, ca) ; // see helper.js
          }
          getGeneFromRegistry(ca, taskId, entryInnerId) ;
        }
        else if("errorType" in respObj)
        {
          removeMasks() ;
          var displayMsg = "Found the following error for the allele - " + ca+"<br>" ;
          displayMsg += "<b>Error Type: </b> "+respObj.errorType+ "<br>";
          displayMsg += "<b>Message: </b>" + respObj.description ;
          Ext.Msg.alert("ERROR", displayMsg) ;
        }
        else
        {
          removeMasks() ;
          var displayMsg = "Encountered unexpected error from the registry for the allele - "+ca+ "request. <br> Contact the project admin to resolve this isssue."
          Ext.Msg.alert("ERROR", displayMsg) ;
        }
      }
      else 
      {
        if("errorType" in respObj)
        {
          removeMasks() ;
          var displayMsg = "Found the following error for the allele - <i>" + ca+" <i/><br>" ;
          displayMsg += "<b>Error Type: </b> "+respObj.errorType+ "<br>";
          displayMsg += "<b>Message: </b>" + respObj.description ;
          Ext.Msg.alert("ERROR", displayMsg) ;
        }
        else
        {
          removeMasks() ;
          var displayMsg = "The following error was encountered while retrieving the canonical allele <i>" + ca+ "</i>' from the Registry .<br><br>"
          displayMsg += ( "<b>Error Code:</b> <i>" + (response['status'] ? response['status'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" ) ;
          displayMsg += ( "<b>Error Message:</b> <i>" + (response['statusText'] ? response['statusText'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" );
          displayMsg += "<br><br>Please contact a project admin to resolve this issue." ;
          Ext.Msg.alert("ERROR", displayMsg) ;  
        }
      }
    }
  });
}


function getGeneFromRegistry(ca, taskId, entryInnerId)
{
  if(taskId == "calculator")
  {
     loadgeneStore = false ;
     getEvidenceAndGridsForCA() ;  
     topPanelInfo[ca].geneSrc = "No Supporting Data" ;
  }
  topPanelInfo[ca].gene = {} ;
  topPanelInfo[ca].gene.value = "No Data" ;
  if(Object.keys(topPanelInfo[ca].geneSubject).length > 0)
  {
    var gsubjects = Object.keys(topPanelInfo[ca].geneSubject) ;
    var genePath = gsubjects[0];
    Ext.Ajax.request(
    {
      url: '/java-bin/apiCaller.jsp' ,
      timeout: 9000,
      method : 'GET',
      params:
      {
        rsrcPath : genePath,
        apiMethod : 'GET'
      },
      callback : function(opts, success, response)
      {
        try 
        {
          var respObj  = JSON.parse(response.responseText) ;
          var alleleInfo = []
          if(response.status >= 200 && response.status < 400 && respObj)
          {
            if('externalRecords' in respObj && 'HGNC' in respObj.externalRecords && 'symbol' in respObj.externalRecords.HGNC)
            {  
              topPanelInfo[ca].gene.value = respObj.externalRecords.HGNC.symbol ; 
              topPanelInfo[ca].HGNC = respObj.externalRecords.HGNC["@id"] ; 
              if('NCBI' in respObj.externalRecords) { topPanelInfo[ca].NCBI = respObj.externalRecords.NCBI["@id"] ; }
              if(taskId == "calculator")
              { 
                 // Have gene information and all the allele associated information at this point
                 getCASourceLinks() ; // see helper.js
                 getGeneSourceLinks() ; 
                 trackData(taskId, 0) ; // see helper.js 
              }
              else
              {
                trackData(taskId, 0, entryInnerId); // see helper.js
              }
            }
          }
          else
          {
            var msg = "Error encountered in fetching gene info from the gene subject - " +topPanelInfo[caSub].geneSubject ;
            Ext.Msg.alert("ERROR", msg) ;
          }
        }
        catch(err)
        {
          console.log(err) ;
          trackData(taskId, ca, entryInnerId); // see helper.js
          if(Ext.getCmp('alleleMask')){Ext.getCmp('alleleMask').destroy() ;}
          if(Ext.getCmp('hgvsMask')){Ext.getCmp('hgvsMask').destroy() ;}
          Ext.Msg.alert("ERROR", "Bad data returned from server . Please contact a project admin to arrange investigation and resolution.") ;
        }
       }
  }) ;
 }
 else {getCASourceLinks() ; trackData(taskId, 0, entryInnerId); /* see helper.js */}
}





function getGeneInfoFromGeneSubjects(genesubjects, entryInnerId)
{
   var genPath = decodeURIComponent(geneUrl) ;
   genPath = genPath + '/docs?detailed=true&matchProp=Gene.Subject&matchValues='+genesubjects+'&matchView=gene'
   Ext.Ajax.request(
  {
    url: '/java-bin/apiCaller.jsp' ,
    timeout: 9000,
    method : 'GET',
    params:
    {
      rsrcPath : genPath,
      apiMethod : 'GET'
    },
    callback : function(opts, success, response)
    {
      var respObj  = JSON.parse(response.responseText) ;
      var respStatus   = respObj['status'] ;
      if(response.status >= 200 && response.status < 400 && response.responseText)
      {
        var genedocs = respObj['data'] ;
        if(genedocs.length > 0)
        {
          geneInfo.gene= {} ;
          // global
          geneInfo.gene.value = genedocs[0].Symbol.value ;
          geneInfo.gene.Subject = genedocs[0].GeneSubject.value ;
          geneInfo.gene.name = genedocs[0].genename.value ;
          topPanelInfo.gene = geneInfo.gene ;
        }
        else {
          if(!('gene' in topPanelInfo)){topPanelInfo.gene = "No Supporting Data" ;}
        }
        // load the entry page inner data with both gene and hgvs info
        if(entryInnerId && entryInnerId.length>0){trackData('entryInner', 0, entryInnerId); /*see helper.js */  }
      }
      else
      {
        topPanelInfo.gene = "No Supporting Data" ;
        var displayMsg = "The following error was encountered while retrieving gene documents from from the gene subjects <br>" ;
        displayMsg += ( "<b>Error Code:</b> <i>" + (respStatus['statusCode'] ? respStatus['statusCode'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" ) ;
        displayMsg += ( "<b>Error Message:</b> <i>" + (respStatus['msg'] ? respStatus['msg'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" );
        displayMsg += "<br><br>Please contact a project admin to resolve this issue." ;
        Ext.Msg.alert("ERROR", displayMsg) ;
      }
    }
  });
}




function getEntryStore()
{
  var itemsPerPage = 25;
  var entStore = new Ext.data.Store({
    storeId:'saStore',
    fields:['alleleID', 'caAlleleSubject', 'evidences', 'benign', 'likelybenign','benignsa','pathogenic','likelypathogenic','uncertaince', 'uncertainie', 'notdetermined', 'nonacmg'],
    pageSize: itemsPerPage,
    proxy: {
      type: 'ajax',
      url: '/java-bin/apiCaller.jsp',
      actionMethods: {
        read: 'POST'
       },
      reader: {
        type: 'json',
        root: 'data',
        totalProperty: function(){
          return Object.keys(caAlleles).length ;
        }
      }
    },
    listeners: {
      beforeload: function(store, operation, options){
        casubjectList = [];
        for(var ii=(operation.page-1)*operation.limit; ii<operation.limit+((operation.page-1)*operation.limit); ii++)
        {if(alleleSorted[ii]){casubjectList.push(alleleSorted[ii]) ;} else{break;}}
        if(casubjectList.length == 0) {casubjectList.push('dummydoc') ;}
        var evCachePath = decodeURIComponent(evCacheUrl) ;
        var evCachePath = evCachePath+'/docs?matchOrderBy=EvidenceCacheID.CanonicalAllele&matchProp=EvidenceCacheID.CanonicalAllele&matchValues='+casubjectList+'&detailed=true&matchMode=keyword' ;
        store.proxy.extraParams.rsrcPath = evCachePath;
        store.proxy.list = casubjectList ;
      },
      load: function(store, records, successful, operation){
      console.log('loading . . .');
      //console.log(store.proxy.reader);
       if('jsonData' in store.proxy.reader){
         docInfo = store.proxy.reader.jsonData.data ;
         getCachecounts(docInfo, store.proxy.list) ;
       }
       else
       {
         Ext.Msg.alert("ERROR","Error in getting evidence cache docs ") ;
       }
      }
    }
  });

  return entStore;
}
