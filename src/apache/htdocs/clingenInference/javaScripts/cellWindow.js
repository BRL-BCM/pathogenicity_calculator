// enables cell clicks and performs the following:
// if the cell is invalid it throws an error window
// else it shows window with tag properties
function clickCell(cellElId, partitionPath, eviName, metaObj)
{
  var cellCls = document.getElementById(cellElId).className ;
  var existingDialogCellGrid = Ext.get("cellGrid");

  if(cellCls != "invalid" && existingDialogCellGrid == null)
  {
    var gridStoreData = [] ;
    if(metaObj && metaObj.Tags)
    {
      gridStoreData.push([metaObj.EvidenceTags[ii], metaObj.Tags[ii], metaObj.Summary[ii]]);
    }
    makeCellWindow(partitionPath, gridStoreData) ;
  }
}

// makes the pop up grid for each of the cell
function makeCellWindow(parPath, gridStoreData)
{
  var cellStore = new Ext.data.SimpleStore(
    {
      fields:
      [
        { name : 'evidencetag'},
        { name : 'tag' },
        { name : 'summary' }
      ]
    }) ;

  // panel for the cell, with evidence tag and summary information
  var cellGrid = new Ext.grid.GridPanel(
    {
      id: 'cellGrid',
      title: 'Evidence Tags for the rule: <i>' + parPath + '</i>',
      tip: 'Contains tags and summary for each of the evidence.<br>',
      listeners: {
              render: function(c) {
                Ext.create('Ext.tip.ToolTip', {
                  target: c.getEl(),
                  html: c.tip
                });
              }
      },
      viewConfig: { forceFit: true },
      height: 155,
      width: 600,
      useArrows: true,
      autoScroll: true,
      store: cellStore,
      columns:
      [
       {
          id: 'evidencetag',
          text: 'Evidence Tag',
          tip: "<b>Tag</b><br>Tag name associated with each of the evidence.<br>",
          listeners: {
              render: function(c) {
                Ext.create('Ext.tip.ToolTip', {
                  target: c.getEl(),
                  html: c.tip
                });
              }
          },
          dataIndex: 'evidencetag',
          width: 150,
          sortable: true
        },



        {
          id: 'tag',
          text: 'Tag',
          tip: "<b>Tag</b><br>Tag associated with each of the evidence.<br>",
          listeners: {
              render: function(c) {
                Ext.create('Ext.tip.ToolTip', {
                  target: c.getEl(),
                  html: c.tip
                });
              }
          },
          dataIndex: 'tag',
          width: 150,
          sortable: true
        },
        {
          id: 'summary',
          text: 'Summary',
          //tip: "<b>Summary</b><br>Summary associated with each of the evidence.<br>",
          tip: "<b>Summary</b><br>The summary associated with each of the tag. Use the arrow on the corner to sort this column.<br>",
          listeners: {
              render: function(c) {
                Ext.create('Ext.tip.ToolTip', {
                  target: c.getEl(),
                  html: c.tip
                });
              }
          },
          dataIndex: 'summary',
          width: 300,
          sortable: true
        }
      ],
      stripeRows: true
    }) ;

  // load the store
  var cellStor = Ext.getCmp('cellGrid').store ;
    cellStor.loadData(gridStoreData) ;

  // create and show the window.
  Ext.create('Ext.window.Window', {
    height: 200,
    width: 600,
    layout: 'fit',
    items:[cellGrid]
  }).show();

}
