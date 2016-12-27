function getAdvancedSearchWin()
{
  var refStore = getPropComboStore('RefSeq', 'refBox') ;
  var nucStore = getPropComboStore('NucChange', 'nucBox') ;
  
  var searchForm = new Ext.FormPanel({
    id: 'searchForm',
    bodyStyle:'padding:10px 10px 0',
    frame: true,
    labelStyle: 'font-weight:bold;padding:0',
            items: [{
            xtype:'fieldset',
            collapsible:true,
            title: 'Reference Seq ID and Position',
            defaultType: 'textfield',
            layout: 'anchor',
            defaults: {
                anchor: '100%'
            },
            items :[

            {
              xtype: 'combo',
              name: 'ref',
              fieldLabel: 'RefSeq ID',
              labelStyle: 'font-weight:bold;padding:0',
              store: refStore,
              id: 'refCombo',
              displayField: 'value',
              typeAhead: false,
              hideTrigger:true,
              minChars : 1,
              autoScroll: true,
              forceSelection: true,
              emptyText: 'Type RefSeq ID ...',
              queryMode   : 'remote',
              listConfig: {
              loadingText: 'Searching...',
              emptyText: 'Search Document',
              getInnerTpl: function() {
                return '<div class="search-item">' +
                '<span>{value}</span>' +
                 '</div>';
                }
              },
              valueNotFoundText : '(No matching docs)',
            },

            {
              xtype: 'fieldcontainer',
              fieldLabel: 'Position',
              name: 'pos',
              labelStyle: 'font-weight:bold;padding:0',
              layout: 'anchor',
              defaultType: 'textfield',
              items: [
                 {
                   flex: 1,
                   name: 'st',
                   fieldLabel: 'Start',
                   allowBlank: false
                 },
                 {
                   flex: 1,
                   name: 'sp',
                   fieldLabel: 'Stop',
                   allowBlank: false
                 }]
              }]
        },{
            xtype:'fieldset',
            title: 'Reference Seq ID and Nucleotide Type Change',
            collapsible: true,
            collapsed: true,
            defaultType: 'textfield',
            layout: 'anchor',
            defaults: {
                anchor: '100%'
            },
            items :[
            
                        {
              xtype: 'combo',
              name: 'ref1',
              fieldLabel: 'RefSeq ID',
              labelStyle: 'font-weight:bold;padding:0',
              store: refStore,
              id: 'refCombo1',
              displayField: 'value',
              typeAhead: false,
              hideTrigger:true,
              minChars : 1,
              autoScroll: true,
              forceSelection: true,
              emptyText: 'Type RefSeq ID ...',
              queryMode   : 'remote',
              listConfig: {
              loadingText: 'Searching...',
              emptyText: 'Search Document',
              getInnerTpl: function() {
                return '<div class="search-item">' +
                '<span>{value}</span>' +
                 '</div>';
                }
              },
              valueNotFoundText : '(No matching docs)',
            },

                                     {
              xtype: 'combo',
              name: 'nuc',
              fieldLabel: 'Nucleotide Change Type',
              labelStyle: 'font-weight:bold;padding:0',
              store: nucStore,
              id: 'nucCombo',
              displayField: 'value',
              typeAhead: false,
              hideTrigger:true,
              minChars : 1,
              autoScroll: true,
              forceSelection: true,
              emptyText: 'Type Nucleotide Change ...',
              queryMode   : 'remote',
              listConfig: {
              loadingText: 'Searching...',
              emptyText: 'Search Document',
              getInnerTpl: function() {
                return '<div class="search-item">' +
                '<span>{value}</span>' +
                 '</div>';
                }
              },
              valueNotFoundText : '(No matching docs)',
            },

            
            ]
        }]

    });


    var searchWindow = new Ext.Window({
        width: 400,
        id: 'searchWin',
        title: 'Advanced Allele Search Options',
        //bodyStyle:'padding:0px 0px 0px 0px;',
        buttonAlign:'center',
        //frame:true,
        //bodyStyle:'padding:10px 10px 0',
 
        width: 400,
        fieldDefaults: {
            msgTarget: 'side',
            labelWidth: 75
        },
        defaults: {
            anchor: '100%'
        },
        items: [searchForm],
        buttons: [{
            text: 'Search',
            name:'Save',
            handler : makeQuery
            },
            {
              text: 'Cancel',
              handler: function(){
                searchForm.getForm().reset(); 
                searchWindow.close(); 
              }
            },
            {
              text:'Reset',
              handler: function(){searchForm.getForm().reset();}
            }]
    });

    searchWindow.show();

}

function makeQuery()
{
var name2props = {
  ref: 'id.Subject.referenceCoordinate.referenceSequence',
  st: 'id.Subject.referenceCoordinate.end',
  sp: 'id.Subject.referenceCoordinate.start',
  nuc: 'id.Subject.primaryNucleotideChangeType',
  ref1: 'id.Subject.referenceCoordinate.referenceSequence'
 };
var propPaths = [];
var propValues = [];
var isValid = true ;
var subitems = [];
var forms = Ext.getCmp('searchForm').getForm();
//var formItems = Ext.getCmp('searchForm').getForm().items;
var formItems = ['ref', 'st', 'sp', 'ref1', 'nuc'];
var formVals = Ext.getCmp('searchForm').getForm().getValues();
console.log(formVals);
var fname ;
var fvalue ;
var subname;
var queryName = "";
// first validate the form values
// 1. Check start and stop are mutually inclusive
// 2. If present then check that both are integers
if((formVals.st && !formVals.sp) || (formVals.sp && !formVals.st))
{
  isValid = false;
  Ext.Msg.alert('INVALID SEARCH INPUT', "Both <i>Start</i> and <i>Stop</i> are mutually inclusive for the query to be valid!") ; 
}

if(formVals.st && formVals.sp)
{
  if(isInt(formVals.st) && isInt(formVals.sp)){}
  else
  {
    isValid = false;
    Ext.Msg.alert('INVALID SEARCH INPUT', "Both <i>Start</i> and <i>Stop</i> fields must be integers for the query to be valid!") ;
  }
}

  //2. Check at least one of the form values are present to trigger the search
  for(var ii=0; ii<formItems.length; ii++)
  {
    fname = formItems[ii] ;
    if(fname in formVals && formVals[fname]) 
    {
      propPaths.push(escape(name2props[fname]));
      propValues.push(escape(formVals[fname]));
      if(fname == 'ref1') fname = 'ref' ;
      queryName = queryName + fname ;
      console.log(queryName);
      console.log(propPaths) ;
      console.log(propValues) ;
    }
  }
  if(propPaths.length < 1) 
  {
    isValid = false;
    Ext.Msg.alert('INVALID SEARCH INPUT', "No search options available to make the query!. Choose at least one option to proceed with the advanced search options.") ;
  }
  else if(propPaths.length != propValues.length)
  {
    isValid = false;
    Ext.Msg.alert('UNKNOWN ERROR', "Somethign went wrong in form submission, size of the form values seems to be not equal to the size of form fields.") ;
  }

  if(isValid)
  {
    Ext.getCmp('searchForm').getForm().reset();
    Ext.getCmp('searchWin').close() ;
    doQuery(queryName, propPaths, propValues);
  }
}

// Check if integer
function isInt(value) {
  return !isNaN(value) && parseInt(Number(value)) == value && !isNaN(parseInt(value, 10));
}

// get all the list of subjects(canonical alleles corresponding to a given subjectUrl)
// From the canonical allele document gets all the list of inactive canonical alleles.
// Use the list of canonical alleles to get the evidence document(s)
function getSubjectList(subjectUrl, transform, format, reasoner)
{
  var subjectList = [subjectUrl] ;
  // Get the resource path from the subject url
  var ind = subjectUrl.indexOf("/REST") ;
  var subPath = subjectUrl.substring(ind);
  var canPath = subPath.replace('/Subject', '');
  var targetUrl;
  var inactiveCAs = [] ;
  Ext.Ajax.request(
  {
    url : '/java-bin/apiCaller.jsp' ,
    timeout : 90000,    method: 'GET',
    params:
    {
      rsrcPath: canPath,
      apiMethod : 'GET'
    },
    callback: function(opts, success, response)
    {
      var apiRespObj  = JSON.parse(response.responseText) ;
      var docInfo = apiRespObj['data'] ;
      var statusObj   = apiRespObj['status'] ;

     if(response.status >= 200 && response.status < 400 && docInfo)
     {
       if(('properties' in docInfo['id']['properties']['Subject']) && ('replacements' in docInfo['id']['properties']['Subject']['properties']) && ('items' in docInfo['id']['properties']['Subject']['properties']['replacements']) && (docInfo['id']['properties']['Subject']['properties']['replacements']['items'].length > 0))
         {
           inactiveCAs = docInfo['id']['properties']['Subject']['properties']['replacements']['items'] ;
           for(var ii=0; ii<inactiveCAs.length; ii++)
           {
             if('target' in inactiveCAs[ii]['replacement']['properties'])
               {
                 targetUrl = inactiveCAs[ii]['replacement']['properties']['target']['value'] ;
                 subjectList.push(targetUrl + '/Subject') ;
               }
           }
        }
        console.log(subjectList) ;
        getEvidenceDoc(subjectList, transform, format, reasoner)
     }
     else
       {
         Ext.Msg.alert("ERROR", "API Failed to get the Canonical Allele document. " +statusObj.msg+ ", "  + response.status+ ', ' + response.statusText) ;
       }
     }
  }) ;
}


// Displays a window with check columns for all the evidence documents that matched
// the search. Note that this is displayed only when there is more than a single
// Evidence document.
function chooseEviDocWindow(eviDocs, transform, format, reasoner)
{
  var evStore = new Ext.data.SimpleStore(
    {
      fields:
      [
        { name : 'docID' },
        { name : 'eviSubject' },
        { name : 'chooseDoc'}
      ]
    }) ;
  // get the data for the Evidence grid stored
  // Columns displayed are - document id as a link, subject of the evidence document and check box.
  var retVal = [] ;
  var docId ;
  var eviSub ;
  var eviUrl ;
  for(var ii=0; ii<eviDocs.length; ii++)
  {
    docId = eviDocs[ii]['Allele evidence']['value'] ;
    eviSub = eviDocs[ii]['Allele evidence']['properties']['Subject']['value'] ;
    evUrl = '<a href="'+genboreeKBUrl+'/genboree_kbs?project_id='+gbProject+'&coll='+eviColl+'&doc='+docId+'&docVersion=" target="_blank">'+docId+'</a>'
    retVal.push([evUrl, eviSub, false]) ;
  } 
  // Define the grid for the Allele Registry information
  var alleleGrid = new Ext.grid.GridPanel(
    {
      id: 'evGrid',
      border : true,
      height: 155,
      width: 800,
      margin: "0 0 15px 0",
      autoScroll: true,
      // disableSelection: true,
      store: evStore,
      columns:
      [
        {
          id: 'docID',
          text: 'Evidence Document',
          tip: "Name of the Evidence Document.<br><span class='gb-tip-footnote'>(Click arrow on right to sort this column.)</span>",
          listeners: {
            afterrender: function(cmp, listeners) {
              Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip, dismissDelay: 6000, width: 300 })
            }
          },
          dataIndex: 'docID',
          width: 150,
          sortable: true,
        },
        {
          id: 'eviSubject',
          text: 'Subject',
          tip: "Subject of the Evidence Document - a unique canonical allele URL.<br><span class='gb-tip-footnote'>(Click arrow on the right to sort this column.)</span>",
          listeners: {
            afterrender: function(cmp, listeners) {
              Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip, dismissDelay: 6000, width: 250 })
            }
          },
          dataIndex: 'eviSubject',
          width: 500,
          sortable: true
        },
        {
          id: 'chooseDoc',
          xtype: 'checkcolumn',
          text: 'Select Doc',
          tip: "Select the document of interest (one to be displayed in the Pathogenicity Calculator) by clicking the checkbox. Only one checkbox is allowed to be selected.",
          listeners:
          {
            afterrender: function(cmp, listeners) {
              Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip, dismissDelay: 6000, width: 250 })
            }
          },
          dataIndex: 'chooseDoc',
          sortable: true
        }

      ],
      viewConfig : {
        forceFit: true,
        stripeRows: true,
        enableTextSelection: true
      }
    }) ;

   var evStor = Ext.getCmp('evGrid').store ;
   evStor.loadData(retVal) ;

    var evWindow = new Ext.Window({
        width: 800,
        height:200,
        id: 'chooseEviWin',
        title: 'Choose Evidence Document',
        tip: "Muliple Evidence documents are matched for the simple allele of your choice. To proceed with the calculator choose any one Evidence document of interest.",
        listeners:
        { 
          afterrender: function(cmp, listeners) {
            Ext.tip.QuickTipManager.register({ target : cmp.header.id, title: cmp.title, text: cmp.tip, dismissDelay: 6000, width: 250 })
          }
        },

        bodyStyle:'padding:0px 0px 0px 0px;',
        buttonAlign:'center',
        items: [alleleGrid],
        buttons: [{
            text: 'Save',
            name:'Save',
            handler : function(){
              var records = alleleGrid.getStore().queryBy(function(record) {
                return record.get('chooseDoc') === true;
              });
              if(records.length != 1){Ext.Msg.alert('ERROR', "INVALID_SELECTION: MUST select exactly one Evidence document for Pathogenicity Calculator.") ;}
              // Collect ids of those records
              else
              {
                var eviDocs = [];
                records.each(function(record) {
                  eviDocs.push(record.get('docID'));
                });
                console.log(eviDocs);
                var docString = eviDocs[0];
                // eviDoc is a global variable
                eviDoc = docString.match(/<a[^\b>]+>(.+)[\<]\/a>/)[1];
                evWindow.close() ;
                if(transform) {viewGrid(format, eviDoc) ;}
                if(reasoner) {fillReasonerGrid(eviDoc) ;}
              }
              }
            },
            {
              text: 'Cancel',
               handler: function(){
                 evWindow.close();
               }
            }]
    });
    evWindow.show();
}
