// renders the panel - with toolbar and tree panel with a
// null tree panel store.
function makePanel()
{

 // store for hgvs based search combobox
  var hgvsStore = getPropComboStore('hgv', 'SimpleAllele.properties.Subject.properties.alleleNames.items[0].alleleName.value') ; 
  //ToolBar
  //
 // search menus - hgvs and gene-based searches
 var searchMenu = new Ext.menu.Menu({
      id: 'tagMenu',
      items: [
         {
            text: 'HGVS',
            iconCls: "gvAdvanced",
            tooltip: 'Use this icon to search Allele Registry using HGVS term <br>',
            handler : function()
            {
               getAdvancedSearchWin() ;
            }
          }, 
          {
            text: 'Gene',
            disabled : true,
            iconCls: 'gvAdvanced',
            tooltip: 'Use this icon to search Allele Registry using Gene <br>',
            handler : function()
            {
               getGeneWindow() ;
            }
          }
      ]
    });
  
  var toolBar = new Ext.Toolbar({
    cls: 'gvToolBar',
    ui: 'overrideDefault', // Doesn't actually exist. But "default" (the default here) does silly IE things. This is a dummy UI config for the toolbar.
    items: [
    {
      text:'Clear Grid',
      id: "gvRefreshButton",
      tip: "Clear the grid and select new gene for a fresh view.",
      listeners: {
         afterrender: function(cmp, listeners) {
           Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip })
         }
      },
      iconCls: 'gvRefresh',
      handler: function()
      {
       Ext.getCmp('gvGrid').getStore().removeAll();
       Ext.getCmp('gvGrid').getStore().sync();
       //clear combo
      }
    },

    {
      text: 'Search',
      id: "gvAdvanced",
      iconCls: 'gvAdvanced',
      menu: searchMenu,
      tooltip: 'Use this menu button for advanced options to search Allele Registry.'
    }]
    });

  //Store for the panel
   var store = new Ext.data.Store({
    storeId:'saStore',
    fields:['alleleID', 'caAlleleSubject', 'evidences', 'benign', 'likelybenign','benignsa','pathogenic','likelypathogenic','uncertaince', 'uncertainie', 'notdetermined', 'nonacmg'],
    data:[]
  });

  //Make the Simple Allele Grid Panel
  Ext.define('entryPageGrid', {
        extend: 'Ext.grid.GridPanel',
        border: true,
        cls: 'mainPanel',
        bodyCls: 'colPanel',
        title: '',
        id: 'gvGrid',
        width: 1000,
        height: 600,
        useArrows: true,
        autoScroll: true,
        draggable: false,
        disableSelection: true,
        tbar: toolBar,
        //columnLines: true,
        store: store,
        plugins: [{
        ptype: 'rowexpander',
        rowBodyTpl: [
                '<div class="detailData">',
                '</div>'
            ]
        }],
        //collapsible: true,
        columns: [
        {
          text: 'Canonical Allele',
          dataIndex: 'alleleID',
          id: 'canonicalallele',
          width: 130,
          flex: 1,
          sortable: true,
          tip: "ID of Canonical Alleles that matched the search.",
          listeners: {
            afterrender: function(cmp, listeners) {
              Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip })
            }
          }
        },
        {
          xtype: 'actioncolumn',
          header: 'Views',
          id: 'views',
          width: 80,
          tip: "Use this icon to go to the Pathogenicity Calculator Page",
          listeners: {
            afterrender: function(cmp, listeners) {
              Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip })
            }
          },

          align: 'center',
          items: [
          /*{
          icon: '/images/silk/application_view_tile.png',
          tooltip: 'View a compact Evidence table',
          hidden: true,
        },  */ 
     
        {
          icon: '/images/silk/calculator.png',
          tooltip: 'Click this icon to go to the Pathogenicity Calculator Page',
          handler: function(grid, rowIndex, colIndex){
                    var rec = grid.getStore().getAt(rowIndex);
                    ca = rec.get('alleleID') ;
                    // go the URL of the page with the parameters.
                    // just get the URL without any parameters
                    var url = document.URL.split('?')[0] ;
                    // append the ca parameter
                    url = url + '?ca='+ca ;
                    if(conf) {var url = url + '&conf=' + conf ;}
                    window.open(url, '_blank');

                },
        }/*,
        {
          align: 'center',
          hidden: true,
          icon: '/images/silk/chart_organisation.png',
          tooltip: 'Click this icon to view the Canonical Allele Document in Genboree KB UI',
          handler: function(grid, rowIndex, colIndex) {
                    var rec = grid.getStore().getAt(rowIndex);
                    ca = rec.get('alleleID') ;
                    var caAlleleUrl = unescape(caProject) + "&doc="+ca+"&docVersion=" ;
                    window.open(caAlleleUrl, '_blank');
            }
        }*/
       ]},
        {
          text: 'Evidence',
          id: 'evid',
          dataIndex: 'evidences',
          sortable: true,
          width: 80,
          align: 'center',
          tip: "Total Number of evidence documents",
          listeners: {
            afterrender: function(cmp, listeners) {
              Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip })
            }
          }
        },
         {
          text: 'ACMG',
          columns:[{
          text: 'Benign',
          dataIndex: 'benign',
          sortable: true,
          width: 60,
          id:'acmgconclusions',
          align: 'center',
          tip: "ACMG based conclusions",
          listeners: {
            afterrender: function(cmp, listeners) {
              Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip })
            }
          }
        },
        {
          text: 'Likely<br>Benign',
          dataIndex: 'likelybenign',
          sortable: true,
          width: 60,
          align: 'center',
          id: 'likelybenign',
          tip: "Final assertion is Likely Benign",
          listeners: {
            afterrender: function(cmp, listeners) {
              Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip })
            }
          }
        },
        {
          text: 'Benign<br>Stand Alone',
          dataIndex: 'benignsa',
          sortable: true,
          width: 80,
          id: 'benignst',
          align: 'center',
          tip: "Final assertion is Benign Stand Alone",
          listeners: {
            afterrender: function(cmp, listeners) {
              Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip })
            }
          }
        },
        {
          text: 'Pathogenic',
          dataIndex: 'pathogenic',
          sortable: true,
          width: 80,
          id: 'path',
          align: 'center',
          tip: "Final assertion is pathogenic",
          listeners: {
            afterrender: function(cmp, listeners) {
              Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip })
            }
          }
        },
        {
          text: 'Likely<br>Pathogenic',
          dataIndex: 'likelypathogenic',
          sortable: true,
          width: 80,
          id: 'likelyPatho',
          align: 'center',
          tip: "Final assertion is Likely Pathogenic",
          listeners: {
            afterrender: function(cmp, listeners) {
              Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip })
            }
          }
        },
        {
          text: 'Conflict.<br>Evidence',
          dataIndex: 'uncertaince',
          sortable: true,
          width: 80,
          id: 'conf',
          align: 'center',
          tip: "Two conflicting assertions are made to yield Conflicting Evidence.",
          listeners: {
            afterrender: function(cmp, listeners) {
              Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip })
            }
          }
        },
        {
          text: 'Insuf.<br>Evidence',
          dataIndex: 'uncertainie',
          sortable: true,
          width: 80,
          id: 'insuf',
          align: 'center',
          tip: "Given set of evidences are not sufficient to make any assertions",
          listeners: {
            afterrender: function(cmp, listeners) {
              Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip })
            }
          }
        },
        {
          text: 'Undetermined',
          dataIndex: 'notdetermined',
          sortable: true,
          width: 100,
          id: 'undetermined',
          align: 'center',
          tip: "Assertion not determined due to the absence of tags",
          listeners: {
            afterrender: function(cmp, listeners) {
              Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip })
            }
          }
        }

         ]},
         {
          text: 'Non<br>ACMG',
          dataIndex: 'nonacmg',
          sortable: true,
          width: 60,
          align: 'center',
          id: 'nonac',
          tip: "Evidences with Non-ACMG Guildelines.",
           listeners: {
            afterrender: function(cmp, listeners) {
              Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip })
            }
          }

        }
        ],
        rootVisible: false,

        iconCls: 'icon-grid',
        initComponent: function () {
        var me = this;

        this.callParent(arguments);

        me.getView().on('expandBody', me.onExpandNestedGrid,me);
        me.getView().on('collapsebody', me.onCollapseNestedGrid,me);
    },

    onExpandNestedGrid : function (rowNode, record, expandRow, eOpts) {
        var detailData = Ext.DomQuery.select("div.detailData", expandRow);
        makesaGridForEntryGrid = true ;
        //Model for the inside grid store
        Ext.define('saModel', {
            extend: 'Ext.data.Model',
            fields: [
                { name: 'saId'},
                { name: 'ref'},
                { name: 'allele'},
                { name: 'start'},
                { name: 'stop'},
                { name: 'refallele' },
                { name: 'alType' },
                { name: 'amChange' }
            ]
        });
     //alleleID', 'refSeq', 'nucChange', 'subjecturl', 'canonicalAllele', 'start', 'stop', 'refAllele', 'alType', 'amChange'],
        //dummy data for the inside grid
        var dataForInsideGrid = [
        //['sa', 'ref', 'hgvs', 'start', 'stop', "T", "sub", "amino"]
        ];

        var insideGridStore = Ext.create('Ext.data.ArrayStore', {
            model: 'saModel',
            data: dataForInsideGrid
        });

        var innerGrid = Ext.create('Ext.grid.Panel', {
            store: insideGridStore,
            id: 'sainsideGrid',
            cls: 'sainside',
            columns: [
                //{ text: "SimpleAllele ID", width:150, dataIndex: 'saId'},
                { text: "Allele Name", dataIndex: 'allele', width: 300, align: 'center'},
                //{ text: "RefSeq ID", dataIndex: 'ref', align: 'center', width:250, xtype: 'templatecolumn',tpl: '<a href="{ref}" target="_blank">{ref}</a>' },
                //{ text: "Start", dataIndex: 'start', align: 'center'},
                //{ text: "Stop", dataIndex: 'stop', align: 'center'},
                //{ text: "Allele", dataIndex: 'refallele', align: 'center', width:50},
                { text: "Nucleotide Change", width:150,dataIndex: 'alType', align: 'center' },
                { text: "Simple Allele Type", width: 150, dataIndex: 'amChange', align: 'center' }
                /*   
                 {xtype: 'actioncolumn',
                   text: 'View',
                   align: 'center',
                   width: 1000,
                   icon: '/images/silk/chart_organisation.png',
                   tooltip: 'Click this icon to view the Simple Allele Document in Genboree KB UI',
                   handler: function(grid, rowIndex, colIndex) {
                    var rec = grid.getStore().getAt(rowIndex);
                    var sa = rec.get('saId') ;
                    var saAlleleUrl = unescape(saProject) + "&doc="+sa+"&docVersion=" ;
                    window.open(saAlleleUrl, '_blank');
            }}*/
            ],
            columnLines: false,
            width: 600,
            autoHeight: true,
            frame: false,
            iconCls: 'icon-grid',
            renderTo: detailData[0],
            preventHeader: true,
            enableColumnResize : false

        });
       innerGrid.getEl().swallowEvent([
                    'dblclick'
                ]);
      ca = record.get('alleleID') ;
      getallsimpleAlleles() ;
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

//Window to display the small grid
function makeSmallWindow(table, docName)
{
 // subject is a global variable
  smallGridWindow = new Ext.Window({
    id: 'smallView',
    layout: 'border',
    html: table,
    tools: [{
            type: 'right',
            id: 'goTolargehtml',
            text: 'Display Pathogenictiy Calculator',
            tip: 'Click to display Pathogenicity Calculator in a new tab.',
            listeners: {
            afterrender: function(cmp, listeners) {
              Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip })
              }
            },
            cls: 'largehtml_custom_tool',
            handler: function (evt, toolEl, owner, tool) {
              if(conf){var url = 'http://' + location.host + '/java-bin/clingenV1.7.jsp?eviDoc='+eviDoc+'&subject=' +subject+ '&conf='+conf ;}
              else {var url = 'http://' + location.host + '/java-bin/clingenV1.7.jsp?eviDoc='+eviDoc+'&subject=' +subject ;}
              window.open(url, '_blank');

            }
     }]

  });
  smallGridWindow.show();
  smallGridWindow.hide();
  smallGridWindow.center();
  smallGridWindow.show()

}

