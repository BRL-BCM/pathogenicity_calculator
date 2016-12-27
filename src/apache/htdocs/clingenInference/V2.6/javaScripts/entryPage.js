// Methods related related eo the entry page
// Some of the methods are written in helper.js
// makes just the template for the grid
function makeTemplate()
{
  // get the empty entry grid
  makeEntryGrid([]) ;
  var entryMask = getMask('gvGrid', 'entryMask', "Loading Canonical Alleles from the Evidence Source  . . . ") ;
  entryMask.show();
  // get all the ca alleles from all the evidence documents in the evidence source
  getCAsFromAllEvidenceSources() ;
}



// renders the panel - with toolbar and tree panel with a
// null tree panel store.
function makePanel()
{
  // store for hgvs based search combobox
  var hgvsStore = getHgvsStore() ; 
  //Store for the entry panel - makes the paging and gets the first page loaded
  var store = getEntryStore() ; 
  store.load() ;

  //Make the Simple Allele Grid Panel
  makeEntryGrid(store) ;
}


///////////////////////////////////////////////////////////////
// HELPER METHODS
// Methods that gets the components of the entry page
///////////////////////////////////////////////////////////////

// generates the menu for the entry page
function getsearchMenu()
{

  var searchMenu = new Ext.menu.Menu({
    id: 'tagMenu',
    items: [
    {
      text: 'HGVS',
      iconCls: "gvAdvanced",
      tooltip: 'Search Allele Registry using HGVS term.',
      handler : function(){ getAdvancedSearchWin() ;}
    },
    {
      text: 'Gene',
      iconCls: 'gvAdvanced',
      tooltip: 'Search Allele Registry using Gene name.',
      handler : function(){ 
        //getGeneWindow() ;
        // Add notice temp
        var notice = "The gene-based search is currently <i>disabled</i>, temporarily. This search functionality is currently being updated to be compatible with new <b>ClinGen allele registry services </b> (faster and way more efficient!). <br>We apologize for the inconvenience. Alternatively, users can take advantage of standalone <a href=\"http://reg.clinicalgenome.org\" target=\"_blank\"><b> registry services </b></a> to find out alleles for the gene of interest.";
        Ext.Msg.alert("SERVICE TEMPORARILY NOT AVAILABLE", notice) ; 
       }
    }]
  });
  return searchMenu ;
}

function getEntryToolbar(searchMenu)
{
  var toolBar = new Ext.Toolbar({
    cls: 'gvToolBar',
    ui: 'overrideDefault',
    items: [
    {
      text:'Clear Grid',
      id: "gvRefreshButton",
      tooltip: "Clear the grid and select new gene for a fresh view.",
      iconCls: 'gvRefresh',
      handler: function()
      {
        Ext.getCmp('gvGrid').getStore().removeAll();
        Ext.getCmp('gvGrid').getStore().sync();
      }
    },
    {
      text: 'Search',
      id: "gvAdvanced",
      iconCls: 'gvAdvanced',
      menu: searchMenu,
      tooltip: 'Options to search Allele Registry.'
    } 
  ]
  });
  return toolBar ;
}

function getEntryCols()
{
  var cols = [
  {
    text: 'Canonical Allele',
    dataIndex: 'alleleID',
    id: 'canonicalallele',
    minWidth: 130,
    flex: 1,
    sortable: true,
    tooltip: "ID of Canonical Alleles that matched the search.",
    renderer: function(value, md, rec, ri, ci, store, view){
          var retVal = "";
          if(value) {
            retVal = '<a class="allelelink" onclick="goToAllelePage(\''+value+'\')" data-qtip="'+value+'">' +value+'&nbsp;<i class="fa fa-external-link"></i> </a>' ;
          }
          return retVal;
      }
  },
  {
   text: 'Calculator',
    minWidth: 80,
    flex: 1,
    align: 'center',
    sortable: true,
    tooltip: "Go to the Pathogenicity Calculator Page",
    renderer: function(value, md, rec, ri, ci, store, view){
          var retVal = "";
          var alle = rec.get('alleleID') ; 
          retVal = '<span class="calculatorIcon" onclick="goToCalculatorPage(\''+alle+'\')" data-qtip="Go to the Calculator page">calculator</span>' ; 
          return retVal;
      }
  },
  {
    text: 'Evidence',
    id: 'evid',
    dataIndex: 'evidences',
    sortable: true,
    minWidth: 80,
    flex: 1 ,
    align: 'center',
    tooltip: "Total Number of evidence documents",
    renderer: function(value, md, rec, ri, ci, store, view){
        var retVal ;
        if(value && value > 0) {
          retVal = '<span class="numevi evidences">'+value+'</span>';
        }
        return retVal ;
      }
  },
  {
    text: 'ACMG',
    cls: 'acmg',
    columns:[{
      text: 'Benign',
      dataIndex: 'benign',
      sortable: true,
      minWidth: 60,
      flex: 1,
      id:'acm',
      align: 'center',
      tooltip: "Final assertion is Likely Benign",
      renderer: function(value, md, rec, ri, ci, store, view){
        var retVal ;
        if(value && value > 0) {
          retVal = '<span class="numevi benign">'+value+'</span>';
        }
        return retVal ;
      }
    },
    {
      text: 'Likely<br>Benign',
      dataIndex: 'likelybenign',
      sortable: true,
      minWidth: 60,
      flex:1,
      align: 'center',
      id: 'likelybenign',
      tooltip: "Final assertion is Likely Benign",
      renderer: function(value, md, rec, ri, ci, store, view){
        var retVal ;
        if(value && value > 0) {
          retVal = '<span class="numevi likelybenign">'+value+'</span>';
        }
        return retVal ;
      } 
    },
    {
      text: 'Benign<br>Stand Alone',
      dataIndex: 'benignsa',
      sortable: true,
      minWidth: 80,
      flex: 1 ,
      id: 'benignst',
      align: 'center',
      tooltip: "Final assertion is Benign Stand Alone",
      renderer: function(value, md, rec, ri, ci, store, view){
        var retVal ;
        if(value && value > 0) {
          retVal = '<span class="numevi benignst">'+value+'</span>';
        }
        return retVal ;
      }
    },
    {
      text: 'Pathogenic',
      dataIndex: 'pathogenic',
      sortable: true,
      minWidth: 80,
      flex: 1,
      id: 'path',
      align: 'center',
      tooltip: "Final assertion is pathogenic",
      renderer: function(value, md, rec, ri, ci, store, view){
        var retVal ;
        if(value && value > 0) {
          retVal = '<span class="numevi pathogenic">'+value+'</span>';
        }
        return retVal ;
      }
    },
    {
      text: 'Likely<br>Pathogenic',
      dataIndex: 'likelypathogenic',
      sortable: true,
      minWidth: 80,
      flex: 1,
      id: 'likelyPatho',
      align: 'center',
      tooltip: "Final assertion is Likely Pathogenic",
      renderer: function(value, md, rec, ri, ci, store, view){
        var retVal ;
        if(value && value > 0) {
          retVal = '<span class="numevi likelypathogenic">'+value+'</span>';
        }
        return retVal ;
      }
    },
    {
      text: 'Conflict.<br>Evidence',
      dataIndex: 'uncertaince',
      sortable: true,
      minWidth: 80,
      flex: 1,
      id: 'conf',
      align: 'center',
      tooltip: "Two conflicting assertions are made to yield Conflicting Evidence.",
      renderer: function(value, md, rec, ri, ci, store, view){
        var retVal ;
        if(value && value > 0) {
          retVal = '<span class="numevi conflictevi">'+value+'</span>';
        }
        return retVal ;
      }
    },
    {
      text: 'Insuf.<br>Evidence',
      dataIndex: 'uncertainie',
      sortable: true,
      minWidth: 80,
      flex:1 ,
      id: 'insuf',
      align: 'center',
      tooltip: "Given set of evidences are not sufficient to make any assertions",
      renderer: function(value, md, rec, ri, ci, store, view){
        var retVal ;
        if(value && value > 0) {
          retVal = '<span class="numevi insufevi">'+value+'</span>';
        }
        return retVal ;
      }
    },
    {
      text: 'Undetermined',
      dataIndex: 'notdetermined',
      sortable: true,
      minWidth: 100,
      flex: 1,
      id: 'undetermined',
      align: 'center',
      tooltip: "Assertion not determined due to the absence of tags",
      renderer: function(value, md, rec, ri, ci, store, view){
        var retVal ;
        if(value && value > 0) {
          retVal = '<span class="numevi notdeter">'+value+'</span>';
        }
        return retVal ;
      }
    }
  ]},
  {
    text: 'Non<br>ACMG',
    dataIndex: 'nonacmg',
    sortable: true,
    minWidth: 60,
    flex: 1,
    align: 'center',
    id: 'nonac',
    tooltip: "Evidences with Non-ACMG Guildelines.",
    renderer: function(value, md, rec, ri, ci, store, view){
        var retVal ;
        if(value && value > 0) {
          retVal = '<span class="numevi nonacmg">'+value+'</span>';
        }
        return retVal ;
      }
  }] ;
  return cols ;
}

function goToAllelePage(allele)
{
 window.open(decodeURIComponent(regAddress)+"/allele/"+allele+".html") ;

}
