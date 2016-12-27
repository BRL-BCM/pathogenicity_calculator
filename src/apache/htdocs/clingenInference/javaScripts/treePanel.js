// renders the panel - with toolbar and tree panel with a
// null tree panel store.
function makePanel()
{

  //get the store for the comboBox
  var generalStore = ['genomic','transcript', 'amino acid', 'deletion', 'insertion','inversion','translocation','indel','substitution','exon', 'intron'] ;
  //ToolBar
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
       Ext.getCmp('gvTree').getStore().removeAll();
       Ext.getCmp('gvTree').getStore().sync();
       //clear combo
       Ext.getCmp('geneCombo').clearValue();
      }
    },

    {
      text: 'Advanced Allele Search',
      id: "gvAdvanced",
      iconCls: 'gvAdvanced',
      tip: "Search allele registry using advanced search options.",
      listeners: {
            afterrender: function(cmp, listeners) {
              Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip })
            }
       },
      handler : function()
      {
       getAdvancedSearchWin() ;
      }
    },

      '->',
     {
      xtype: 'combo',
      width: 200,
      id: 'geneCombo',
      width: 200,
      emptyText: 'Select a general term...',
      store: generalStore, 
      listeners: {
         select: function(combo, selection) {
            var post = selection[0];
            if (post) {
              var searchValue = combo.getValue();
              getDocumentsFromSearchValue(searchValue)  ;
            }
         }
      }
     }
    ]
    });

  //Store for the panel
   var store = new Ext.data.Store({
    storeId:'saStore',
    fields:['alleleID', 'refSeq', 'nucChange', 'subjecturl', 'start', 'stop', 'refAllele', 'alType', 'amChange'],
    data:[
    ]
  });

  //Make the Simple Allele Grid Panel
  var simpleAlleleGrid = new Ext.grid.GridPanel({
        border: true,
        cls: 'mainPanel',
        bodyCls: 'colPanel',
        title: 'GENE VARIANT CLINICAL CLASSIFICATION SUITE',
        id: 'gvTree',
        width: 900,
        height: 450,
        useArrows: true,
        autoScroll: true,
        draggable: false,
        disableSelection: true,
        tbar: toolBar,
        store: store,
        columns: [
        {
          text: 'Allele ID',
          dataIndex: 'alleleID',
          flex: 1,
          width: 100,
          sortable: true,
          tip: "ID of alleles that matched the search.",
          listeners: {
            afterrender: function(cmp, listeners) {
              Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip })
            }
          }
        },
        {
          xtype: 'actioncolumn',
          header: 'Evidence Table',
          dataIndex: 'subjecturl',
          width: 50,
          align: 'center',
          icon: '/images/silk/application_view_tile.png',
          handler: function(grid, rowIndex, colIndex) {
                    var rec = grid.getStore().getAt(rowIndex);
                    subject = rec.get('alleleID') ;
                    var subjectUrl = rec.get('subjecturl') ;
                    getSubjectList(subjectUrl, true, 'smallhtml', null) ;
                },
          tip: "Compact view of the evidence table.<br> Click on the arrow to the top right of this view to take you to the pathogenicity calculator page.",
          listeners: {
            afterrender: function(cmp, listeners) {
              Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip })
            }
          },
	},
        {
          xtype: 'actioncolumn',
          header: 'Calculator',
          width: 50,
          align: 'center',
          icon: '/images/silk/calculator.png',
          handler: function(grid, rowIndex, colIndex) {
                    var rec = grid.getStore().getAt(rowIndex);
                    subject = rec.get('name') ;
                    var url = 'http://' + location.host + '/java-bin/clingenInference.jsp?subject=' +subject ;
                    if(conf) {var url = url + '&conf=' + conf ;}
                    window.open(url, '_blank');

                },
          tip: "Click this icon to go to the Pathogenicity Calculator.",
          listeners: {
            afterrender: function(cmp, listeners) {
              Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip })
            }
          },
        },
         {
          xtype: 'actioncolumn',
          header: 'View KB Document',
          width: 50,
          align: 'center',
          icon: '/images/silk/chart_organisation.png',
          handler: function(grid, rowIndex, colIndex) {
                    var rec = grid.getStore().getAt(rowIndex);
                    subject = rec.get('name') ;
                    var simpleAlleleUrl = genboreeKBUrl + "/genboree_kbs?project_id="+gbProject+"&coll="+alleleColl ;
                    simpleAlleleUrl = simpleAlleleUrl + "&doc="+subject+"&docVersion=" ;
                    window.open(simpleAlleleUrl, '_blank');
            },
          tip: "Tree view of the Simple Allele Document.",
          listeners: {
            afterrender: function(cmp, listeners) {
              Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip })
            }
          },
        },
        {
          text: 'RefSeq',
          dataIndex: 'refSeq',
          sortable: true,
          width: 100,
          align: 'center',
          tip: "Reference Sequence ID of the allele",
          listeners: {
            afterrender: function(cmp, listeners) {
              Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip })
            }
          }
        },
         {
          text: 'Start',
          dataIndex: 'start',
          sortable: true,
          width: 100,
          align: 'center',
          tip: "Start coordinate of the allele",
          listeners: {
            afterrender: function(cmp, listeners) {
              Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip })
            }
          }
        },
        {
          text: 'Stop',
          dataIndex: 'stop',
          sortable: true,
          width: 100,
          align: 'center',
          tip: "End coordinate of the allele",
          listeners: {
            afterrender: function(cmp, listeners) {
              Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip })
            }
          }
        },
        {
          text: 'Ref Allele',
          dataIndex: 'refAllele',
          sortable: true,
          width: 100,
          align: 'center',
          tip: "Allele Type - A/T/C/G",
          listeners: {
            afterrender: function(cmp, listeners) {
              Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip })
            }
          }
        },
        {
          text: 'Allele Type',
          dataIndex: 'alType',
          sortable: true,
          width: 100,
          align: 'center',
          tip: "Type of the Allele.",
          listeners: {
            afterrender: function(cmp, listeners) {
              Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip })
            }
          }
        },
         {
          text: 'Nucleotide Change',
          dataIndex: 'nucChange',
          sortable: true,
          width: 100,
          align: 'center',
          tip: "Nucleotide change of the Allele.",
          listeners: {
            afterrender: function(cmp, listeners) {
              Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip })
            }
          }
        },
         {
          text: 'Amino Acid Change',
          dataIndex: 'amChange',
          sortable: true,
          width: 100,
          align: 'center',
          tip: "Amino Acid change of the Allele.",
          listeners: {
            afterrender: function(cmp, listeners) {
              Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip })
            }
          }
        }
        ],
        rootVisible: false,
        renderTo: 'panel'
    });
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
               var url = 'http://' + location.host + '/java-bin/clingenInference.jsp?eviDoc='+eviDoc+'&subject=' +subject+ '&conf='+conf ;
               window.open(url, '_blank');

            }
     }]

  });
  smallGridWindow.show();
  smallGridWindow.hide();
  smallGridWindow.center();
  smallGridWindow.show()

}

