//Methods used for searches - gene, hgvs window
// Get the HGVS form
function getAdvancedSearchWin()
{
  var hgvsStore = getHgvsStore() ;
  var searchForm = new Ext.FormPanel({
    id: 'searchForm',
    bodyStyle:'padding:10px 10px 0',
    frame: true,
    labelStyle: 'font-weight:bold;padding:0',
    items: [
      {
        xtype: 'textfield',
        name: 'hgv',
        fieldLabel: 'HGVS Term',
        labelStyle: 'font-weight:bold;padding:0',
        store: [],
        width: 350,
        id: 'hgvsCombo',
        displayField: 'value',
        typeAhead: false,
        minChars : 1,
        autoScroll: true,
        emptyText: 'Type HGVS term ...',
      },
      {
        xtype: 'panel',
        cls: 'hgvs-examples',
        html: "<b>Examples</b>: NM_002496.3:c.64C>T, ENST00000413465.6:c.637C>T"
      }
    ]
  });


  var searchWindow = new Ext.Window({
    width: 500,
    id: 'searchWin',
    title: 'Search Using HGVS expression',
    buttonAlign:'center',
    fieldDefaults: {
      msgTarget: 'side',
      labelWidth: 75
    },
    defaults: {
      anchor: '100%'
    },
    items: [
      searchForm
      
    ],
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


function initAlleleRegistry(parTerm){
  Ext.Msg.show({
    title: 'Register Allele',
    msg: 'This allele does not exist in the registry. Do you want to register it?',
    buttons: Ext.Msg.YESNOCANCEL,
    id: 'registerAlleleLaunchWindow',
    icon: Ext.Msg.QUESTION,
    fn: function(buttonId){
      if(buttonId == 'yes'){
        var protocol = window.location.protocol ;
        var regAlleleLink = protocol+"//"+unescape(regAddress)+"/redmine/projects/registry/genboree_registry/create?hgvs="+encodeURIComponent(parTerm) ;
        window.open(regAlleleLink, "alleleRegistry") ;
        Ext.getCmp("registerAlleleLaunchWindow").close() ;
        Ext.getCmp("searchWin").close() ;
        Ext.Msg.alert("Load Allele", "Please load the newly registered allele by entering its CA identfier in the 'Search with CA identifier' dialog.") ;
      }
    }
  });
}

// function once the search button is clicked
// makes the query using the gene selected, by using the gene subject
function makeQuery()
{
  var formVals = Ext.getCmp('searchForm').getForm().getValues();
  if(formVals.hgv) {
    var loadMask = getMask('gvGrid', 'entryMask', "Loading Canonical Alleles  . . . " ) ;
    loadMask.show();
    Ext.getCmp('searchWin').close() ;
    getAlleleFromHgVs(formVals.hgv) ;
  }
  else{
    Ext.Msg.alert("ERROR", 'Enter a value and then submit to search the Allele Registry.') ; 
  }
}

function getCAidWindow()
{
  var caStore =  getCaStore() ;
  var searchForm = new Ext.FormPanel({
    id: 'searchForm',
    bodyStyle:'padding:10px 10px 0',
    frame: true,
    labelStyle: 'font-weight:bold;padding:0',
    items: [
      {
        xtype: 'textfield',
        name: 'caid',
        fieldLabel: 'CA Identifier',
        labelStyle: 'font-weight:bold;padding:0',
        store: [],
        //data: [],
        width: 350,
        id: 'caCombo',
        displayField: 'value',
        typeAhead: false,
        minChars : 1,
        autoScroll: true,
        //forceSelection: true,
        emptyText: 'Type Canonical Allele Identifier ...'
      },
      {
        xtype: 'panel',
        cls: 'hgvs-examples',
        html: "<b>Examples</b>: CA321211"
      }
    ]
  });


  var searchWindow = new Ext.Window({
    width: 500,
    id: 'searchWin',
    title: 'Search Using Canonical Allele ID',
    buttonAlign:'center',
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
      handler : makeQueryWithCA
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


function makeQueryWithCA()
{
  var formVals = Ext.getCmp('searchForm').getForm().getValues();
  if(formVals.caid)
  {
    // mask the grid
    var loadMask = getMask('gvGrid', 'entryMask', "Loading Canonical Alleles  . . . " ) ;
    loadMask.show();
    // clear the store
    Ext.getCmp('gvGrid').getStore().removeAll();
    // make the query
    getAlleleFromReg(formVals.caid) ;
    Ext.getCmp('searchWin').close() ;
  }
  else
  {
    Ext.Msg.alert("ERROR", 'Enter a value and then submit to search the Allele Registry.') ;
  }

}





// Window for advanced allele options using gene, refseq and mutation type
function getGeneWindow()
{
  // get the genes from the gene collection
  var geneStore = getGeneComboStore() ;
  var geneForm = new Ext.FormPanel({
    id: 'genForm',
    bodyStyle:'padding:10px 10px 0',
    frame: true,
    labelStyle: 'font-weight:bold;padding:0',
    items: [
    {
      xtype: 'combo',
      name: 'gen',
      fieldLabel: 'Gene',
      labelStyle: 'font-weight:bold;padding:0',
      store: geneStore,
      width: 350,
      id: 'geneCombo',
      displayField: 'sym',
      typeAhead: false,
      minChars : 1,
      autoScroll: true,
      forceSelection: true,
      emptyText: 'Type a gene . . .',
      queryMode   : 'remote',
      listConfig: {
        loadingText: 'Searching . . .',
        emptyText: ' ',
        getInnerTpl: function() {return '{sym}' ; }
      },
      // set the resource path
      listeners: {
        // using view gene. Should be present in the same kb as the geneUrl
        beforequery: function(queryEvent, eOpts) {
          var genePath = decodeURIComponent(geneUrl) ;
          // if empty get some arbitrary genes from the coll
          if(queryEvent.combo.rawValue.match(/^\s*$/))// if empty do a default search just on the coll with a limit
          {
            genePath = genePath + '/docs?detailed=true&matchView=gene&limit=25' ;
          }
          else
          // have a typed value, use that for the search
          {
            genePath = genePath + '/docs?detailed=true&matchProps=Gene.Subject.symbol&matchValue='+encodeURIComponent(queryEvent.combo.rawValue)+'&matchMode=prefix&matchView=gene&limit=25' ;
          }
          queryEvent.combo.store.proxy.extraParams = {rsrcPath: genePath}
        },
        select: function(combo, rec, index) {
          var geneSelected = rec[0];
          if (geneSelected) {
            var gene = combo.getValue();
            var genesub = rec[0].get('genesub') ;
            Ext.getCmp('geneCombo').genesub = genesub ;
          }
        }
      }
    },{html:'<div class="genewarning" >As the gene-based search is performed on a large database of alleles (~ 1 million documents) . The retrieval of alleles especially with gene symbols may take up to 10-20 seconds.</div>'}]
  });
  var geneWindow = new Ext.Window({
    width: 500,
    id: 'geneWin',
    title: 'Search using HGNC Gene Symbol',
    buttonAlign:'center',
    fieldDefaults: {
      msgTarget: 'side',
      labelWidth: 75
    },
    defaults: {anchor: '100%'},
    items: [geneForm],
      buttons: [{
        text: 'Search',
        name:'Save',
        handler : makeComplexQuery
      },
      {
        text: 'Cancel',
        handler: function(){
          geneForm.getForm().reset();
          geneWindow.close();
        }
      },
      {
        text:'Reset',
        handler: function(){geneForm.getForm().reset();}
      }
    ]
  });
  geneWindow.show();
}

// function searches based on the item values of the gene form
function makeComplexQuery()
{
  var formVals = Ext.getCmp('genForm').getForm().getValues();
  if(formVals.gen)
  {
    var loadMask = getMask('gvGrid', 'entryMask', "Loading Canonical Alleles  . . . " ) ;
    loadMask.show();
    alert("To be implemented")
    Ext.getCmp('geneWin').close() ;
  }
  else
  {
    Ext.Msg.alert("ERROR", 'Must choose/select all the three items  and then submit to search the Allele Registry.') ;
  }
}


function postToRegister() {


 var calcForm = document.createElement("form");
  calcForm.method = "post";
  //calcForm.action = "/clingenInference/V2.5/docRender.rhtml";
  //calcForm.action = "http://reg.test.genome.network/allele?hgvs=NC_000010.11%3Ag.87961100del&useHost=reg.test.genome.network&gbLogin=Registry&gbTime=1457559792&gbToken=0f0cca15a324a2a118f59491d7c6dbece0be93c9"
  calcForm.action = "http://reg.test.genome.network/allele?hgvs=NC_000010.11%3Ag.87961100del&&gbLogin=Registry&gbTime=1457560764&gbToken=79ec8c54b9cf9811e16b031640f8bd4c6dbe552f"
  document.body.appendChild(calcForm);
  calcForm.submit();
  document.body.removeChild(calcForm);
}


//function postAjax() {
//
//
//  Ext.Ajax.request(
// {
//    url : '/java-bin/apiCaller.jsp' ,
//    timeout : 90000,
//    params:
//    {
//      rsrcPath: "http://reg.test.genome.network/allele?hgvs=NC_000010.11%3Ag.87961100del&useHost=reg.test.genome.network&gbLogin=Registry&gbTime=1457559792&gbToken=0f0cca15a324a2a118f59491d7c6dbece0be93c9",
//      apiMethod : 'PUT',
//    },
//    method: 'POST'
//  }) ;
//
//}
