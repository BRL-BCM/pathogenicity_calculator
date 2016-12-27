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
  var hgvsStore = getPropComboStore('hgv','ContextualAllele.properties.Subject.properties.alleleNames.items[0].alleleName.value') ; 
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
      handler : function(){ getGeneWindow() ; }
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
    tooltip: "ID of Canonical Alleles that matched the search."
  },
  {
    xtype: 'actioncolumn',
    header: 'Calculator',
    id: 'views',
    minWidth: 80,
    flex: 1,
    tooltip: "Go to the Pathogenicity Calculator Page",
    align: 'center',
    items: [
    {
      icon: '/images/silk/calculator.png',
      tooltip: 'Click this icon to go to the Pathogenicity Calculator Page',
      handler: function(grid, rowIndex, colIndex){
        var rec = grid.getStore().getAt(rowIndex);
        ca = rec.get('alleleID') ;                    
        var url = document.URL.split('?')[0] ;
        url = url + '?ca='+ca ;
        if(conf) {var url = url + '&conf=' + conf ;}
        window.open(url, '_blank');
      },
    }]
  },
  {
    text: 'Evidence',
    id: 'evid',
    dataIndex: 'evidences',
    sortable: true,
    minWidth: 80,
    flex: 1 ,
    align: 'center',
    tooltip: "Total Number of evidence documents"
  },
  {
    text: 'ACMG',
    columns:[{
      text: 'Benign',
      dataIndex: 'benign',
      sortable: true,
      minWidth: 60,
      flex: 1,
      id:'acmgconclusions',
      align: 'center',
      tooltip: "ACMG based conclusions"
    },
    {
      text: 'Likely<br>Benign',
      dataIndex: 'likelybenign',
      sortable: true,
      minWidth: 60,
      flex:1,
      align: 'center',
      id: 'likelybenign',
      tooltip: "Final assertion is Likely Benign"
    },
    {
      text: 'Benign<br>Stand Alone',
      dataIndex: 'benignsa',
      sortable: true,
      minWidth: 80,
      flex: 1 ,
      id: 'benignst',
      align: 'center',
      tooltip: "Final assertion is Benign Stand Alone"
    },
    {
      text: 'Pathogenic',
      dataIndex: 'pathogenic',
      sortable: true,
      minWidth: 80,
      flex: 1,
      id: 'path',
      align: 'center',
      tooltip: "Final assertion is pathogenic"
    },
    {
      text: 'Likely<br>Pathogenic',
      dataIndex: 'likelypathogenic',
      sortable: true,
      minWidth: 80,
      flex: 1,
      id: 'likelyPatho',
      align: 'center',
      tooltip: "Final assertion is Likely Pathogenic"
    },
    {
      text: 'Conflict.<br>Evidence',
      dataIndex: 'uncertaince',
      sortable: true,
      minWidth: 80,
      flex: 1,
      id: 'conf',
      align: 'center',
      tooltip: "Two conflicting assertions are made to yield Conflicting Evidence."
    },
    {
      text: 'Insuf.<br>Evidence',
      dataIndex: 'uncertainie',
      sortable: true,
      minWidth: 80,
      flex:1 ,
      id: 'insuf',
      align: 'center',
      tooltip: "Given set of evidences are not sufficient to make any assertions"
    },
    {
      text: 'Undetermined',
      dataIndex: 'notdetermined',
      sortable: true,
      minWidth: 100,
      flex: 1,
      id: 'undetermined',
      align: 'center',
      tooltip: "Assertion not determined due to the absence of tags"
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
    tooltip: "Evidences with Non-ACMG Guildelines."
  }] ;
  return cols ;
}
