// get dynamic store for the combos
function getPropComboStore(prop, propModel)
{
   var searchPath = '/REST/v1/grp/'+ alleleGrp +'/kb/'+ alleleKB +'/coll/' + alleleColl + '/docs?matchView='+gridView ;
   Ext.define(propModel, {
     extend: 'Ext.data.Model',
       proxy: {
         type: 'ajax',
         url : '/java-bin/apiCaller.jsp?',
         timeout : 90000,
         reader: {
           type: 'json',
           root: 'data',
           record: prop,
           idProperty: 'value'
         },
         extraParams :{
           rsrcPath : searchPath
         }
       },
       fields: [ {name: 'value'}],
     });

     propStore = Ext.create('Ext.data.Store', {
       model: propModel,
       sorters: [{
         property: 'value',
         direction: 'ASC'
       }],
       listeners: {
         // remove [No Value] from the combo store
         load: function(store) {
          var hits = {};
          store.filterBy(function(record) {
            var name = record.get('value');
             if(name != '[No Value]'){
               hits[name] = true;
               return true;
             }
           });
           delete store.snapshot;
         }
       }
     });
  return propStore ;
}



// get documents without using the query
// Can go away later, once the query libraries are fully established
function getDocumentsFromSearchValue(searchValue)
{
  var props = ['id.Subject.simpleAlleleType', 'id.Subject.primaryNucleotideChangeType', 'id.Subject.referenceCoordinate.primaryTranscriptRegionType'] ; 
  Ext.Ajax.request(
  {
    url : '/java-bin/apiCaller.jsp' ,
    timeout : 150000,
    method: 'GET',
    params:
    {
      rsrcPath: '/REST/v1/grp/' + alleleGrp+ '/kb/' + alleleKB + '/coll/' +alleleColl+ '/docs?matchProps='+props+'&matchValue=' + escape(searchValue) + '&matchMode=keyword&matchView='+ gridView ,
      apiMethod : 'GET'
    },
    callback: function(opts, success, response)
    {
      try
      {
        var apiRespObj  = JSON.parse(response.responseText) ;
        var documentInfo = apiRespObj['data'] ;
        var statusObj   = apiRespObj['status'] ;
        if(response.status >= 200 && response.status < 400 && documentInfo)
        {
          if(documentInfo.length == 0)
          {
            var displayMsg = "NOT_FOUND: The collection has no documents for the search value '<i>" + searchValue + "</i>' :<br><br>";
            Ext.Msg.alert("ERROR", displayMsg) ;

          }
          else
          {
            var newRootChildren = [] ;
            var docname ;

            for(var ii=0; ii<documentInfo.length; ii++)
            {
             var alleleID = documentInfo[ii].id.value ;
             var subjectID = documentInfo[ii].Subject.value ;
             var nuc = documentInfo[ii].NucChange.value ;
             var refSeq = documentInfo[ii].RefSeq.value ;
             var start =  documentInfo[ii].start.value ;
             var stop =  documentInfo[ii].stop.value ;
             var refAllele =  documentInfo[ii].refAllele.value ;
             var alType =  documentInfo[ii].alType.value ;
             var amChange =  documentInfo[ii].AmChange.value ;
             newRootChildren.push([alleleID, refSeq, nuc, subjectID, start, stop, refAllele, alType, amChange]);
            }
            var allStor = Ext.getCmp('gvTree').store ;
            allStor.loadData(newRootChildren) ;

          }
        }
        else
        {
          var displayMsg = 'The following error was encountered while retrieving documents for the search value <i>' + searchValue + '</i> :<br><br>';
          displayMsg += ( "<b>Error Code:</b> <i>" + (statusObj['statusCode'] ? statusObj['statusCode'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" ) ;
          displayMsg += ( "<b>Error Message:</b> <i>" + (statusObj['msg'] ? statusObj['msg'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" );
          displayMsg += "<br><br>Please contact a project admin to resolve this issue." ;
          Ext.Msg.alert("ERROR", displayMsg) ;
        }
      }
      catch(err)
        {
          Ext.Msg.alert("ERROR", "Bad data returned from server when retrieving documents for the property value of <i>" + searchValue + "</i>. Please contact a project admin to arrange investigation and resolution.") ;
        }
    }
  }) ;
}

// gets the documents from the gene selected from the gene combo store
// and updates the main tree panel
function doQuery(qrName, paths, vals)
{
  var propPaths = paths.join();
  var propValues = vals.join();
  Ext.Ajax.request(
  {
    url : '/java-bin/apiCaller.jsp' ,
    timeout : 600000,
    method: 'GET',
    params:
    {
      //rsrcPath: '/REST/v1/grp/' + alleleGrp+ '/kb/' + alleleKB + '/coll/' +alleleColl+ '/docs?matchQuery=' + qrName + '&propPaths=' +propPaths+ '&propValues=' +propValues+'&matchView='+gridView,
      rsrcPath: '/REST/v1/grp/' + alleleGrp+ '/kb/' + alleleKB + '/coll/' +alleleColl+ '/docs?matchQuery=' + qrName + '&propPaths=' +propPaths+ '&propValues=' +propValues+'&matchView='+gridView ,
      apiMethod : 'GET'
    },
    callback: function(opts, success, response)
    {
      try
      {
        var apiRespObj  = JSON.parse(response.responseText) ;
        var documentInfo = apiRespObj['data'] ;
        var statusObj   = apiRespObj['status'] ;
        if(response.status >= 200 && response.status < 400 && documentInfo)
        {
          if(documentInfo.length == 0)
          {
            var displayMsg = "NOT_FOUND: The collection has no documents for this query <br><br>";
            Ext.Msg.alert("ERROR", displayMsg) ;

          }
          else
          {
            var newRootChildren = [] ;
            var docname ;

            for(var ii=0; ii<documentInfo.length; ii++)
            {
              var alleleID = documentInfo[ii].id.value ;
              var subjectID = documentInfo[ii].Subject.value ;
              var nuc = documentInfo[ii].NucChange.value ;
              var refSeq = documentInfo[ii].RefSeq.value ;
              var start =  documentInfo[ii].start.value ;
              var stop =  documentInfo[ii].stop.value ;
              var refAllele =  documentInfo[ii].refAllele.value ;
              var alType =  documentInfo[ii].alType.value ;
              var amChange =  documentInfo[ii].AmChange.value ;
              newRootChildren.push([alleleID, refSeq, nuc, subjectID, start, stop, refAllele, alType, amChange]);

            }
            var allStor = Ext.getCmp('gvTree').store ;
            allStor.loadData(newRootChildren) ;

          }
        }
        else
        {
          var displayMsg = "The following error was encountered while retrieving documents.<br>";
          displayMsg += ( "<b>Error Code:</b> <i>" + (statusObj['statusCode'] ? statusObj['statusCode'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" ) ;
          displayMsg += ( "<b>Error Message:</b> <i>" + (statusObj['msg'] ? statusObj['msg'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" );
          displayMsg += "<br><br>Please contact a project admin to resolve this issue." ;
          Ext.Msg.alert("ERROR", displayMsg) ;
        }
      }
      catch(err)
        {
          Ext.Msg.alert('ERROR', "Bad data returned from server when retrieving allele documents.<br><br>Please contact a project admin to arrange investigation and resolution." ) ;
        }
    }
  }) ;
}


// Get the evidence document from the subject id of a allele
// The document is retrieved based on the subject url actually
function getEvidenceDoc(subjectList, transform, format, reasoner)
{
  //var subjectUrl = makeSubjectUrl(subject) ;
  Ext.Ajax.request(
  {
    url : '/java-bin/apiCaller.jsp' ,
    timeout : 90000,    method: 'GET',
    params:
    {
      rsrcPath: '/REST/v1/grp/'+ eviGrp +'/kb/'+ eviKB +'/coll/' + eviColl + '/docs?detailed=true&matchProp=Allele%20evidence.Subject&matchValues='+subjectList ,
      apiMethod : 'GET'
    },
    callback: function(opts, success, response)
    {
      var apiRespObj  = JSON.parse(response.responseText) ;
      var docInfo = apiRespObj['data'] ;
      var statusObj   = apiRespObj['status'] ;

     if(response.status >= 200 && response.status < 400 && docInfo)
        {
         if(docInfo.length == 1)
         {
           eviDoc = docInfo[0]['Allele evidence']['value'] ;
           if(transform) {viewGrid(format, eviDoc) ;}
           if(reasoner) {fillReasonerGrid(eviDoc) ;}
         }
         else if(docInfo.length >= 1)
         {
           //Ext.Msg.alert('INVALID_NUM_DOCS', "Number of documents is '<i>" + docInfo.length + "</i>' for the subject '<i>" + subject + "</i>'.It should be exactly 1.<br><br>Please contact a project admin to arrange investigation and resolution.");
          chooseEviDocWindow(docInfo, transform, format, reasoner) ;
          
         }
         else{Ext.Msg.alert('NO_DOCS', "No documents found in the evidence collection, '<i>" + eviColl + "</i>' corresponding to the subject, '<i>" + subject + "</i>'"); }
        }
     else
       {
         Ext.Msg.alert("ERROR", "API Failed to get the Evidence document. " +statusObj.msg+ ", "  + response.status+ ', ' + response.statusText) ;
       }
     }
  }) ;
}

// makes small or large html tables from the transformation url
// format - either 'html' or 'smallhtml'
function viewGrid(format, documentName)
{
  var trPath = 'http://' +trHost+ '/REST/v1/grp/' +trGrp+ '/kb/'+trKB+ '/trRulesDoc/'+ trDoc ;
  var gridpath = '/REST/v1/grp/'+ eviGrp +'/kb/'+ eviKB +'/coll/' + eviColl + '/doc/' +escape(documentName)+ '?transform='+ trPath + '&format='+ format ;
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
      apiMethod : 'GET'
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
              // @todo Restore this removal, once have option to SHOW invalid data in cells (with class set etc of course)
              // @todo Regardless, the text in this row should change and the the actual VALUE should be indicated as well
              // @todo Finally, in the HTML version of this row, rather than .-delimited path, try delimiting with " &rarr; "
              rowParent.removeChild(specialRow) ;
            }
          }
          else // small html, now shown on a Extjs window
          {
            makeSmallWindow(gridTable, documentName) ;
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
          //var emptygrid = getEmptyGrid(format) ;
          getEmptyGridFromTag(tags, format, documentName) ;
         
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










// as the name suggests this fills the panel of the main inference panel with allele
// registry information
// on success fills the allele panel store with the document data
function fillAlleleGrid()
{
  var alleleDocPath = '/REST/v1/grp/'+ alleleGrp +'/kb/'+ alleleKB +'/coll/' + alleleColl + '/doc/' + subject + '?detailed=true';
  Ext.Ajax.request(
  {
    url : '/java-bin/apiCaller.jsp' ,
    timeout : 90000,
    params:
    {
      rsrcPath: alleleDocPath,
      apiMethod : 'GET'
    },
    method: 'GET',
    success: getAlleleData,
    failure: displayFailureDialogAllele
  }) ;

}

// fills the reasoner panel with the reasoner output
//Reasoner output is now a path to a file in one of the databases.
function fillReasonerGrid(eviDoc)
{
  var toolPath = "/REST/v1/genboree/tool/reasonerV2a1/job?" ;
  var kbDocUrl = "http://"+ eviHost +"/REST/v1/grp/"+ eviGrp +"/kb/"+ eviKB +"/coll/"+ eviColl +"/doc/"+ eviDoc ;
  var trRulesDocUrl =  "http://"+ trHost +"/REST/v1/grp/"+ trGrp +"/kb/"+ trKB +"/trRulesDoc/"+ trDoc ;
  var guideUrl =  "http://"+ trHost+"/REST/v1/grp/"+ guideGrp +"/kb/"+ guideKB +"/coll/"+ guideColl +"/doc/" + guideDoc ;

  Ext.Ajax.request(
  {
    url : '/java-bin/apiCaller.jsp' ,
    timeout : 1600000,
    params:
    {
      rsrcPath: toolPath,
      apiMethod : 'PUT',
      payload: Ext.JSON.encode({"inputs": [kbDocUrl,trRulesDocUrl], "outputs": [], "settings":{"rulesDoc":guideUrl}, "context":{}})
    },
    method: 'POST',
    success: getReasonerData,
    failure: displayFailureDialogReasoner
  }) ;
}

//saves evidence doc after the edits from the cell pop window.
function saveEviDoc(evDocument, changeCls, cellId)
{
  var evDocPath = "http://"+ eviHost +"/REST/v1/grp/"+ eviGrp +"/kb/"+ eviKB +"/coll/"+ eviColl +"/doc/"+ eviDoc ;

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
      payload: Ext.JSON.encode({"data": evDocument})
    },
    method: 'POST',
    success: displaySaveDialog,
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

   // Get the evidence document
   Ext.Ajax.request(
  {
    url : '/java-bin/apiCaller.jsp' ,
    timeout : 180000,
    method: 'GET',
    params:
    {
      rsrcPath: '/REST/v1/grp/'+ eviGrp +'/kb/'+ eviKB +'/coll/' + eviColl + '/doc/' + eviDoc +'?detailed=true',
      apiMethod : 'GET'
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
          // If optional properties are already present remove the tags associated with the path
          // Is to be updated
          if('Evidence Tags' in evInfo['Allele evidence']['properties'] && 'items' in evInfo['Allele evidence']['properties']['Evidence Tags'])
          {
            if(evInfo['Allele evidence']['properties']['Evidence Tags']['items'].length > 0)
            {
              evitems = evInfo['Allele evidence']['properties']['Evidence Tags']['items'] ;
              for(var ii=0; ii<evitems.length; ii++)
              {
               // handle cases where the element has only Evidence Tag and not Tag- not reqd property.
               if('Tag' in evitems[ii]['Evidence Tag']['properties']) 
               {
                 if(evitems[ii]['Evidence Tag']['properties']['Tag']['properties']['Pathogenicity']['value'] == patho && evitems[ii]['Evidence Tag']['properties']['Tag']['properties']['Strength']['value'] == strength && evitems[ii]['Evidence Tag']['properties']['Tag']['properties']['Type']['value'] == evidencetype){}
                 else{filteredEvItems.push(evitems[ii]);}
               }
              }
            }
            evInfo['Allele evidence']['properties']['Evidence Tags']['items'] = filteredEvItems ;
            console.log(evInfo);
          }
         // optional properties are missing
         else
         {
           if('Evidence Tags' in evInfo['Allele evidence']['properties'])
           {
             evInfo['Allele evidence']['properties']['Evidence Tags']['items'] = [] ;      
           }
           else
           {
             evInfo['Allele evidence']['properties']['Evidence Tags'] = {} ;
             evInfo['Allele evidence']['properties']['Evidence Tags']['items'] = [] ;
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
           console.log(tmpItem);
           evInfo['Allele evidence']['properties']['Evidence Tags']['items'].push(tmpItem) ;
           tmpItem = [];
           console.log(evInfo);
         }
         // check if the class in invalidCount and dataItems is empty
         // is yes then the class has to be changed to invalid
         var cellCls = document.getElementById(cellId).className ;  
         if(cellCls == 'invalidCount' && dataItems.length == 0){changeClsToInvalid = true;}       
         saveEviDoc(evInfo, changeClsToInvalid, cellId);
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


// Gets the tag info from a static kb document
// to populate the respective tag stores
function getTagStore(makeEmptyGrid, format, evDoc)
{
  var level1 = "";
  var level2 = "";
  var level3 = "";
  var pa = "";
  tags = new Object();
  var allowedTagPath = '/REST/v1/grp/'+ tagGrp +'/kb/'+ tagKB +'/coll/' + tagColl + '/doc/' + tagDoc +'?detailed=true' ;
  Ext.Ajax.request(
  {
    url : '/java-bin/apiCaller.jsp' ,
    timeout : 180000,
    method: 'GET',
    params:
    {
      rsrcPath: allowedTagPath,
      apiMethod : 'GET'
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
             {tags[pa].push(tagit[tt]['Tag']['value']) ;}
           }
           else
           {
             tags[pa] = [] ;
             for(var tt=0; tt<tagit.length; tt++)
             {tags[pa].push(tagit[tt]['Tag']['value']) ;}
           }
          }
          if(makeEmptyGrid) {makeEmptyTable(tags, format, evDoc) ;}
        }
        else
        {
          var displayMsg = "The following error was encountered while retrieving the evidence tag document '<i>" + tagDoc + "</i>' :<br><br>";
          displayMsg += ( "<b>Error Code:</b> <i>" + (respStatus['statusCode'] ? respStatus['statusCode'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" ) ;
          displayMsg += ( "<b>Error Message:</b> <i>" + (respStatus['msg'] ? respStatus['msg'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" );
          displayMsg += "<br><br>Please contact a project admin to resolve this issue." ;
          Ext.Msg.alert("ERROR", displayMsg) ;
        }
    }
  }) ;
}
