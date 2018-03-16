
// Not used anymore
function askCreateEvidenceDialog()
{
  //Ext.Msg.alert("NO EVIDENCE DOCUMENT", "There is no Evidence document corresponding to the canonical allele - '<i>" + ca + "</i>'. <br>  Use 'Create Evidence' on the toolbar to make a new Evidence document.") ;
  Ext.Msg.alert("ERROR", "There is no Evidence document corresponding to the canonical allele - '<i>" + ca + "</i>'. <br>  Use 'Create Evidence' on the toolbar to make a new Evidence document.") ;
}



// Question form for creating a new evidence
// Form fields are created dynamically based on the questionnaire document
function createNewEvidence(questUrl, subject)
{
  var questPath = questUrl ;
  var questForm = new Ext.FormPanel({
    id: 'questionsForm',
    subj: subject,
    qPath: questPath,
    bodyStyle:'padding:10px 10px 0',
    frame: true,
    width: 400,
    fieldDefaults: {
          labelAlign: 'top',
          labelWidth: 100,
          labelStyle: 'font-weight:bold'
        },
        defaults: {
            anchor: '100%'
        }
 
  }) ;


  var questWin = new Ext.Window({
        width: 400,
        id: 'questWin',
        title: 'Create New Evidence',
        //bodyStyle:'padding:0px 0px 0px 0px;',
        buttonAlign:'center',
        //frame:true,
        //bodyStyle:'padding:10px 10px 0',
        modal:true,
        width: 400,
        items: [questForm],
        buttons: [{
            text: 'Save',
            handler: makeAnswers
            },
            {
              text: 'Cancel',
              handler: function(){
                questForm.getForm().reset();
                questWin.close();
              }
            },
            {
              text:'Reset',
              handler: function(){questForm.getForm().reset();}
            }]
    });
  getAskQuestions(questPath);
}

function createConditionStore(){
  // Remove items from existing store, if any
  if(conditionSearchStoreData && conditionSearchStoreData.removeAll)
  {
    conditionSearchStoreData.removeAll() ;
  }
  Ext.define("conditionStore", {
    extend : 'Ext.data.Model',
    fields : [ { name: 'completion', type: 'string' } ]
  }) ;
  // Create new JsonStore backed by ajax proxy
  var protocol = window.location.protocol ;
  conditionSearchStoreData = new Ext.data.JsonStore(
  {
    storeId : 'conditionSearchStore',
    model : "conditionStore",
    data: [
      { "completion": "Lynch syndrome" },
      { "completion": "Dilated Cardiomyopathies" },
      { "completion": "Hypertrophic Cardiomyopathies" },
      { "completion": "Hearing loss" },
      { "completion": "Peutz Jegher's Syndrome" },
      { "completion": "Telangiectases" },
      { "completion": "Factor V Deficiencies" },
      { "completion": "Hereditary Leiomyomatosis and Renal Cell Cancer" },
      { "completion": "Tuberous Sclerosis 1" },
      { "completion": "hereditary breast ovarian cancer" },
      { "completion": "Li Fraumeni Syndrome" },
      { "completion": "Paragangliomas" },
      { "completion": "Mitochondrial DNA Depletion Syndrome 14 (cardioencephalomyopathic Type)" }
    ],
    proxy :
    {
      type    : 'ajax',
      url     : '',
      timeout : 900000,
      reader :
      {
        type  : 'json'
      }
    },
    listeners: {
      load: function(){
      },
      beforeload: function(store){
        delete this.lastOptions.params.query ;
      }
    }
  }) ;
  return conditionSearchStoreData ;
}


function getAskQuestions(qPath)
{
  eviQuest = "newEvi" ;
  var message = "";
  Ext.Ajax.request(
  {
    url : appPath+"/evidences/all" ,
    timeout : 180000,
    method: 'GET',
    params:
    {
      rsrcPath: qPath,
      apiMethod : 'GET'
    },
    callback: function(opts, success, response)
    {
      try
      {
        var apiRespObj  = JSON.parse(response.responseText) ;
        var questDoc = apiRespObj['data'] ;
        var statusObj   = apiRespObj['status'] ;
        if(response.status >= 200 && response.status < 400 && questDoc)
        {
          console.log(questDoc) ;
          var qForm = Ext.getCmp('questionsForm') ;
          var sections = questDoc.Questionnaire.properties.Sections.items ;
          for(var ii=0; ii<sections.length; ii++)
          {
            var sec = sections[ii].SectionID.value ;
            var questions = sections[ii].SectionID.properties.Questions.items ;
            for(var jj=0; jj<questions.length; jj++)
            {
              var questionID = questions[jj].QuestionID.value ;
              var question = questions[jj].QuestionID.properties.Question.value ;
              var path = questions[jj].QuestionID.properties.Question.properties.PropPath.value ;
              var domain = questions[jj].QuestionID.properties.Question.properties.PropPath.properties.Domain.value ;
              var formField = {} ;
              if(path === "" || path == "Subject") {
                 formField.xtype = 'hiddenfield' ;
              }
              // make a combo if the domain def is an enum
              else if(domain.match(/^enum/)){
                 str = domain.match(/\((.*?)\)/) ;
                 var cStore = str[1].split(/,\s*/);
                 formField.xtype = 'combo' ;
                 formField.store = cStore;
                 formField.emptyText  = "Choose a value ..." ; 
              }
              else {
                 // This will be a combobox with an ontology based lookup 
                 //formField.xtype = 'textfield' ;
                 formField.xtype = 'combobox' ;
                 formField.store = createConditionStore() ;
                 formField.minChars = 1 ;
                 //allowBlank  : false,
                 formField.autoScroll  = true;
                 formField.autoSelect  = false;
                 formField.checkChangeBuffer = 250;
                 formField.queryDelay  = 500;
                 //hideTrigger = true;
                 //formField.matchFieldWidth = false;
                 formField.emptyText= 'Type to search...';
                 //formField.pickerAlign = 'tl-bl?';
                 formField.typeAhead   = false;
                 formField.queryMode   = 'remote';
                 formField.queryParam  = 'searchStr';
                 //onListSelectionChange=function(){
                 //  //this.picker.getSelectionModel().selectAll();
                 //  var aa ;
                 //};
                 formField.displayField = 'completion';
                 formField.valueField  = 'completion';
                 formField.listConfig  =
                 {
                   emptyText   : 'Search by doc name...',
                   loadingText : '( Searching )',
                   border      : 1,
                   loadMask: true,
                   minWidth    : 250  // Please sync this with the search box's width
                 } ;
                 //formField.tpl         = '<tpl for="."><div class=" x-boundlist-item {[xindex %2 == 0 ? "even" : "odd" ]} "> {value} </div></tpl>' ;
                 formField.valueNotFoundText = '(No matching docs)' ;
                 //pageSize    : searchPageSize, // MAY BE USEFUL TO PROVIDE THIS WHEN API QUERY ALSO SUPPORTS PAGING/INDEXES
                 formField.listeners   =
                 {
                   'specialkey': function(field, e, eOpts){
                     if(e.getKey() == e.ENTER) {
                       if(field.rawValue !== "") {
                         var val = field.rawValue ;
                         this.doQuery(val, false, true) ;
                       }
                     }
                   },
                   'beforequery': function(queryPlan, eOpts) {
                     if ( queryPlan.query !== "") {
                       // BUG FIX: Without this, the search can show WRONG RESULTS. i.e. show results for the older,
                       //   first search(es) that use only a few letters (because they return last!) and not those that
                       //   are longer and return faster. i.e. Successive queries can return FASTER than older ones because
                       //   (a) the search is more specific (more letters!), (b) relevant disk pages likely
                       //   to be in memory on server now.
                       Ext.Ajax.abort() ; // aborts last Ajax call.
                       // May need to get medieval and cancel all, for safety:
                       // Ext.Ajax.abortAll() ;
                       this.store.removeAll() ;
                       // Attach the query string to the end of the URL
                       //var url =  'scigraph-ontology.monarchinitiative.org/scigraph/vocabulary/autocomplete/'+escape(queryPlan.query)+"?limit=10" ;
                       //var finalUrl = "http://"+cacheProxyHost+":"+cacheProxyPort+"/"+encodeURI(url) ;
                       //this.store.proxy.url = "/java-bin/apiCaller.jsp?rsrcPath="+encodeURIComponent(finalUrl) ;
                      this.store.proxy.url = appPath+"/external-ontologies/scigraph/"+escape(queryPlan.query) ;
                     }
                     else{
                       queryPlan.cancel = true ;
                       queryPlan.combo.expand() ;
                     }
                     
                   }
                 } ;
              }
              formField.fieldLabel = question ;
              formField.name = sec+"::"+questionID ;
              formField.path = path ;
              formField.sec = sec ;
              formField.que = questionID ;
              qForm.add(formField) ;
            } 
          }
          qForm.doLayout() ;
          var qWin = Ext.getCmp('questWin');
          qWin.show() ;
        }
        else
        {
          var displayMsg = 'The following error was encountered while retrieving questionnaire for the Evidence collection <i>' + qPath + '</i> :<br><br>';
          displayMsg += ( "<b>Error Code:</b> <i>" + (statusObj['statusCode'] ? statusObj['statusCode'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" ) ;
          displayMsg += ( "<b>Error Message:</b> <i>" + (statusObj['msg'] ? statusObj['msg'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" );
          displayMsg += "<br><br>Please contact a project admin to resolve this issue." ;
          Ext.Msg.alert("ERROR", displayMsg) ;
        }
      }
      catch(err)
        {
          Ext.Msg.alert("ERROR", "Bad data returned from server when retrieving the questionnaire document for the collection  <i>" + qPath + "</i>. Please contact a project admin to arrange investigation and resolution.<br>Details: "+err) ;
        }
    }
  }) ;
}

// generate an answer document that get submitted
function makeAnswers()
{

 var qaForm = Ext.getCmp('questionsForm') ;
 var fItems = qaForm.items.items ;
 var secs = {} ;
 var sec ;
 var path ;
 var answer ;
 var ques ;
 var anObj;
 var secObj;
 var path = qaForm.qPath ; 
 var questName = path.split("/").pop() ;
 for(var ii=0; ii<fItems.length; ii++)
  {
    sec = fItems[ii].sec ;
    anObj = getEmptyAnswers() ;
    anObj.QuestionID.value = fItems[ii].que;
    anObj.QuestionID.properties.PropPath.value = fItems[ii].path;
    if(fItems[ii].path == "Subject") {anObj.QuestionID.properties.PropPath.properties.PropValue.value = qaForm.subj ;}
    else { anObj.QuestionID.properties.PropPath.properties.PropValue.value = fItems[ii].value; }
    if(sec in secs)
      secs[sec].SectionID.properties.Answers.items.push(anObj) ;
    else
    { 
      secObj = getEmptySec() ;
      secObj.SectionID.value = sec ;
      secObj.SectionID.properties.Answers.items.push(anObj) ;
      secs[sec] = secObj ;
   }    
  }
  console.log(secs);
  
  var answerObj = getEmptyAn(questName) ;
  for(var skey  in secs)
  {
    answerObj.Answer.properties.Sections.items.push(secs[skey]) ;
  }
 
  console.log(answerObj);
  saveAns(answerObj, path) ;
  
  var qWin = Ext.getCmp('questWin');
  qWin.close() ;
}





function saveAns(ansDoc, qPath)
{
  var an = "" ;
  var activetab = Ext.getCmp('multitab').getActiveTab().title ;
  var ansPath = qPath+"/answer/"+ an ;
  var params = {
    qpath: qPath,
    tabname: activetab,
    payload: Ext.JSON.encode(ansDoc)
  } ;
  params[csrf_param] = csrf_token ;
  Ext.Ajax.request(
  {
    url : appPath+"/evidences/save_answer" ,
    timeout : 1600000,
    params: params,
    method: 'POST',
    success: getSavedEviDocID,
    failure: displayFailureDialogAns
  }) ;
}

// success function of the API request of submitting an answer
// look here if the calculator states are not updated after
// a new document is created
function getSavedEviDocID(result, request)
{

  // A new document is freshly crested without tags at this point.
  // Update the changes
  var resObj  = JSON.parse(result.responseText) ;
  var ansOut = resObj['data'] ;
  var eviDoc = ansOut.text.value ;
  tags = {} ;
 
  var tabname = result.request.options.params.tabname ;
  var reaGrid = Ext.getCmp('reasonerGrid') ; 
  var evTable = Ext.getCmp('htmltable') ;
  var currenttab = Ext.getCmp('tab'+safeStr[tabname]) ;
  var notagGrid = Ext.getCmp('hasnomes');
  
  // remove the no evidence message grid.
  currenttab.remove(Ext.getCmp('noevimes'), false);
  currenttab.add([notagGrid, getPhenoAndMOITable(), evTable]) ;
  getTagStore(tabname, 'html', true) ;
  // get the evidence path from the questionnaire
  var questPath = grids[tabname].questionnaire ;
  qs = questPath.split("/") ;
  qs.pop() ;
  qs.pop() ;
  var evpath = qs.join("/") ;
  // Add the new evidence to the grid variable
  grids[tabname].evidence = evpath +'/doc/'+eviDoc ;

  // update to hasnotags state
  updateToHasnotagsState(tabname, true) ;
  
  // Update the Summary collection
  // @todo Needs to update all summary categories not just Genes
  updateVariantAssertionSummary(eviDoc) ;
  updatePhenoAndMOITable(grids[tabname].evidence) ;
  Ext.Msg.alert("SUCCESS", 'New Evidence document '+eviDoc+' was created successfully. Please use the \'Pathogenicity Evidence\' table to add tags.') ; 
}

function updateVariantAssertionSummary(eviDoc) {
  var params = {} ;
  params[csrf_param] = csrf_token ;
  // When creating assertion summary for first time for a variant, we can set the type as ACMG and assertion to be undertemined. This will be changed later on depending on which guideline is being used
  params.assertion = "Undetermined" ;
  params.type = "ACMG" ;
  Ext.Ajax.request(
  {
    url : appPath+"/allele/"+ca+"/assertion-summary/update" ,
    timeout : 1600000,
    params: params,
    success: function(){
      
    },
    method: 'POST'
  }) ;
}

function displayFailureDialogAns(result, request)
{
  var resObj  = JSON.parse(result.responseText) ;
  var alleleDoc = resObj['data'];
  var statusObj = resObj['status'] ;
  var message = statusObj.msg ;
  var statusCode = statusObj.statusCode ;
  Ext.Msg.alert("ERROR", "Error in saving the Evidence document: " + message+ ", "+ result.status + ", " + result.statusText + " " + statusCode) ;
}

function getEmptyAn(questName)
{
  var emAn = new Object();
  emAn = {
  "Answer": {
    "value": "",
    "properties": {
      "Questionnaire": {
        "value": questName
      },
       "Sections": {
        "value": null,
        "items": [
          ]
        }
      }
    }
  }

  return emAn ;
}

function getEmptySec()
{
  var secObj = new Object() ;
  secObj = {
    "SectionID": {
       "value": null,
         "properties": {
             "Answers": {
               "value": null,
               "items": [ ]
                }
              }
            }
      } ;

   return secObj
}


function getEmptyAnswers()
{
  var anObj = new Object();
  anObj = 
  {
    "QuestionID": 
    {
      "value": null,
      "properties": {
        "PropPath": {
          "value": null,
          "properties": {
            "PropValue": {
              "value": null
             }
           }
         }
       }
    }
  };
  return anObj ;
}

function editEvidence()
{
  var activetab = Ext.getCmp('multitab').getActiveTab().title ;
  var evdocPath = grids[activetab].evidence ;
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
         showEditEvidenceWindow(moi, pheno, evidoc) ;
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

function showEditEvidenceWindow(moi, pheno, evdocument) 
{
  var cStore = ["Autosomal Dominant", "Autosomal Recessive", "X-linked Dominant", "X-linked Recessive", "Mitochondrial", "Multifactorial", "Other", "Unknown"];
  var eviForm = new Ext.FormPanel({
    id: 'questionsForm',
    bodyStyle:'padding:10px 10px 0',
    frame: true,
    width: 400,
    fieldDefaults: {
          labelAlign: 'top',
          labelWidth: 100,
          labelStyle: 'font-weight:bold'
        },
        defaults: {
            anchor: '100%'
        },
    items: [
      {
        //xtype : 'textfield',
        fieldLabel: "Evidence will be provided for which condition?",
        name: "pheno",
        id: "editpheno",
        value: pheno,
        xtype: 'combobox',
        store: createConditionStore(),
        minChars: 1,
        //allowBlank  : false,
        autoScroll  : true,
        autoSelect  : false,
        checkChangeBuffer : 250,
        queryDelay  : 500,
        //hideTrigger : true,
        //matchFieldWidth : false,
        emptyText: 'Type to search...',
        //pickerAlign : 'tl-bl?',
        typeAhead   : false,
        queryMode   : 'remote',
        queryParam  : 'searchStr',
        
        displayField : 'completion',
        valueField  : 'completion',
        listConfig  :
        {
          emptyText   : 'Search by doc name...',
          loadingText : '( Searching )',
          border      : 1,
          loadMask: true,
          minWidth    : 250  // Please sync this with the search box's width
        } ,
        valueNotFoundText: '(No matching docs)' ,
        listeners:
        {
          'specialkey': function(field, e, eOpts){
            if(e.getKey() == e.ENTER) {
              if(field.rawValue !== "") {
                var val = field.rawValue ;
                this.doQuery(val, false, true) ;
              }
            }
          },
          'beforequery': function(queryPlan, eOpts) {
            if ( queryPlan.query !== "") {
              Ext.Ajax.abort() ; // aborts last Ajax call.
              this.store.removeAll() ;
              this.store.proxy.url = appPath+"/external-ontologies/scigraph/"+escape(queryPlan.query) ;
            }
            else{
              queryPlan.cancel = true ;
              queryPlan.combo.expand() ;
            }
          }
        } 
      },
      {
        xtype: 'combo',
        fieldLabel : "What is the Mode of Inheritance?",
        store: cStore ,
        value: moi,
        id: "editmoi",
        emptyText: "Choose a value ..."
      }
    ]
  }) ;

  var eviWin = new Ext.Window({
    id: 'eviWin',
    title: 'Edit Evidence',
    //bodyStyle:'padding:0px 0px 0px 0px;',
    buttonAlign:'center',
    //frame:true,
    //bodyStyle:'padding:10px 10px 0',
    modal:true,
    width: 400,
    items: [eviForm],
    buttons: [{
        text: 'Save',
        handler: function(){
         console.log(Ext.getCmp('editpheno')) ;
         evdocument['Allele evidence']['properties']['Subject']['properties']["Mode of inheritance"]["value"]  = Ext.getCmp('editmoi').getValue();
         evdocument['Allele evidence']['properties']['Subject']['properties']["Phenotype"]["value"] = Ext.getCmp('editpheno').getValue() ;
         var hasnotagsinfo = false ;
         if( evdocument['Allele evidence']['properties']['Subject']['properties']['Evidence Tags']['items'].length == 0) {hasnotagsinfo = true ;}
           saveEviDoc(evdocument, null, null, Ext.getCmp('multitab').getActiveTab().title, hasnotagsinfo, null, true);
         }
        },
        {
          text: 'Cancel',
          handler: function(){
            eviForm.getForm().reset();
            eviWin.close();
          }
        },
        {
          text:'Reset',
          handler: function(){eviForm.getForm().reset();}
        }]
  });
  eviWin.show() ;
}
