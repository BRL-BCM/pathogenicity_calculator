// enables cell clicks and performs the following:
// Shows window with tag properties for the cells that are not invalid.
function clickCell(cellElId, partitionPath, eviName, metaObj)
{
  var cellObj = document.getElementById(cellElId) ;
  var existingDialogCellGrid = Ext.get("cellGrid");

  // Don't do anything when invalid cell is clicked or when a cell dialog is already open
  if(!cellObj.classList.contains('gb-dataCell-invalid') && existingDialogCellGrid == null)
  {
    var gridStoreData = [] ;
    var linkSummary = "" ;
    if(metaObj && metaObj.Tags)
    {
      for(var ii=0; ii<metaObj.Tags.length; ii++)
      {
        var sub = metaObj.subjects[ii] ;
        console.log(sub) ;
        linkSummary = getLinkSummary(sub) ;
        gridStoreData.push({evidencetag : metaObj.EvidenceTags[ii], tag: metaObj.Tags[ii], summary: metaObj.Summary[ii], stat: metaObj.Stat[ii], subj: sub, linksummary: linkSummary});
      }
    }
    makeCellWindow(partitionPath, gridStoreData, cellElId) ;
  }
}

function getLinkSummary(tagSub)
{ 
  var linkSum = "" ;
  var linkValue ;

  var linkSumhash = new Object () ;
  linkSumhash.Unknown = 0 ; 
  linkSumhash.Disputes = 0 ; 
  linkSumhash.Supports = 0 ; 
  console.log(linkSumhash) ;
  
  var linkItems = []; 
  if(('Links' in tagSub.Tag.properties) && ('items' in tagSub.Tag.properties.Links) && (tagSub.Tag.properties.Links.items.length > 0))
  {
    linkItems = tagSub.Tag.properties.Links.items ;
    for(var ii=0; ii<linkItems.length; ii++)
    {
     //Link Code if present must be controlled by the model
     // else considered as unknown
     if('Link Code' in linkItems[ii].Link.properties) 
     {
       linkValue = linkItems[ii]['Link']['properties']['Link Code']['value'] ;
       if(linkValue == 'Unknown') {linkSumhash.Unknown = linkSumhash.Unknown + 1;}
       if(linkValue == 'Disputes') {linkSumhash.Disputes = linkSumhash.Disputes + 1;}
       if(linkValue == 'Supports') {linkSumhash.Supports = linkSumhash.Supports + 1;}
     }
     else {linkSumhash.Unknown = linkSumhash.Unknown + 1 ;}
    }
  } 
  
  linkSum = '<span style="font-weight:bold;font-size:1.1em;"><span style="color: green;">' +linkSumhash.Supports+ '<span style="font-size: 1.3em; padding-right:5px;">&#8679;</span></span><span style="color: red;">'+linkSumhash.Disputes+'<span style="font-size:1.3em; padding-right:5px;">&#8681;</span></span><span style="color: blue;">'+linkSumhash.Unknown+'<span style="font-size: 1.6em; padding-right:3px;">?</span></span></span>' ;
  return linkSum ;


}



// makes the pop up grid for each of the cell
function makeCellWindow(parPath, gridStoreData, cellId)
{
  Ext.define('Tag', {
    extend: 'Ext.data.Model',
    fields: [
      { name: 'evidencetag' },
      { name: 'tag' },
      { name: 'summary' },
      { name: 'stat'},
      { name: 'subj'},
      { name: 'linksummary'}
    ]
  });

  var cellStore = Ext.create('Ext.data.Store', {
    autoDestroy: true,
    model: 'Tag',
    proxy: {
      type: 'memory'
    },
    data: gridStoreData
  });

  var rowEditing = Ext.create('Ext.grid.plugin.RowEditing', {
    clicksToMoveEditor: 1,
    errorSummary: false,
    autoCancel: true,
    listeners : {
      canceledit: function(arg1, arg2, arg3) {
        // 4.2:
        if((typeof arg2 != 'undefined') && (typeof arg2.record.raw != 'undefined'))
        {
          if(arg2.record.raw.isNewRow)
          {
            arg2.record.store.remove(arg2.record);
          }
        }
        else if(typeof arg1.record.data != 'undefined')
        {
          if(arg1.record.data.isNewRow == true) // Not an edit of existing (don't delete existing when hit cancel!)
          {
            arg1.record.store.remove(arg1.record) ;
          }
        }
        else // error can't find correct object to do removal on
        {
          console.log("ERROR [BUG]: Can't remove empty new row upon Cancel!") ;
        }
      },
      beforeedit: function(editor, context, opts) {
      },
      validateedit: function(editor, context, opts) {
        phantomRec = context.record.raw ;
        phantomRec.isNewRow = false ;
      }
    }
  });


  // panel for the cell, with evidence tag and summary information
  var cellGrid = new Ext.grid.GridPanel(
  {
    id: 'cellGrid',
    viewConfig: { forceFit: true },
    width: 800,
    useArrows: true,
    autoScroll: true,
    store: cellStore,
    selRowIdx: null,
    tbar: [
      {
        itemId : 'addTag',
        //id: 'addTag',
        text:'Add Tag',
        iconCls: 'addTag',
        disabled: true,
        tip: "Add a new evidence code to the Evidence document. You will provide:<ul class='gb-tip'><li>A <u>unique</u> Evidence Tag ID</li><li>The appropriate evidence code/tag</li><li>An optional summary/comment about why the evidence tag applies.</li><br><br>This is a Public Page and this feature is <b>disabled</b></ul><br><span class='gb-tip-footnote'>(Changes are not saved until you click <code>Save Edits</code>)</span>",
        listeners: {
          afterrender: function(cmp, listeners) {
            Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip, dismissDelay: 15000, width: 350 })
          }
        },
        handler: function() {
          var empty = false;
          var newRow = {
            evidencetag: '',
            tag: '',
            stat: 'On',
            linksummary: 'No Links',
            summary: ''
          };
          newRow.isNewRow = true ;
          // enable new tag only if previous new tags are either validated or cancelled
          // Removes the redundant/noisy empty template creation
          cellStore.each(function (rec, idx){
             if(rec.raw.isNewRow == true)
             {
                empty = true; 
             } 
          }) ;
          if(empty != true) 
          {
            cellStore.insert(0, newRow) ;
            rowEditing.startEdit(0, 0) ;
          }
        }
      },
      {
        itemId : 'deleteTag',
        text:'Delete Tag',
        disabled: true,
        tip: "Deletes the selected Evidence Tag (row) from the underlying Evidence doc.<br>This is a Public Page and this feature is <b>disabled</b><br><span class='gb-tip-footnote'>(Changes are not saved until you click <code>Save Edits</code>)</span>",
        listeners: {
          afterrender: function(cmp, listeners) {
            Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip, dismissDelay: 6000, width: 350 })
          }
        },
        iconCls: 'deleteTag',
        handler: function() {
          var sm = cellGrid.getSelectionModel();
          rowEditing.cancelEdit();
          cellStore.remove(sm.getSelection());
          if(cellStore.getCount() > 0)
          {
            sm.select(0);
          }
        }
      },
      {
        text:'Save Edits',
        iconCls: 'saveTag',
        disabled: true,
        tip: "After adding or removing evidence, this button can be used to save your changes to the underlying Evidence doc.<br><br>This is a Public Page and this feature is <b>disabled</b><br><span class='gb-tip-footnote'>(Changes are not saved until you click click this.)</span>",
        listeners: {
          afterrender: function(cmp, listeners) {
            Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip, dimissDelay: 6000, width: 250 })
          }
        },
        handler: function() {
          var dataItems = cellGrid.getStore().data.items;
          console.log(dataItems);
          saveTagsToDoc(parPath, dataItems, cellId);
        }
      },
      {
        itemId : 'addLinks',
        text:'Manage Links',
        tip: "Select a row and then click this button to add/delete/save links for the  selected Evidence Tag (row) from the underlying Evidence doc.<br><span class='gb-tip-footnote'>(Changes are not saved until you click <code>Save Links</code>)</span>",
        listeners: {
          afterrender: function(cmp, listeners) {
            Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip, dismissDelay: 6000, width: 350 })
          }
        },
        iconCls: 'addLinks',
        disabled: true,
        handler: function() {
          var sm = cellGrid.getSelectionModel();
          rowEditing.cancelEdit();

          if (cellGrid.getSelectionModel().hasSelection()) {
            var row = cellGrid.getSelectionModel().getSelection()[0];
            var selectedTag = row.get('evidencetag') ;
            var subj = row.get('subj') ;
            showAddLinksWindow(selectedTag, subj, parPath, cellId) ;
          }

          if(cellStore.getCount() > 0)
          {
            sm.select(0);
          }
        }
      }
    ],
    plugins: [rowEditing],
    listeners: {
      'selectionchange': function(view, records) {
        //cellGrid.down('#deleteTag').setDisabled(!records.length);
        cellGrid.down('#addLinks').setDisabled(!records.length);
        //cellGrid.down('#addTag').setDisabled(!tags[parPath]);
        for(var ii=0; ii<records.length; ii++) // Should only be one, but we'll note the last one's selected index
        {
          cellGrid.selRowIdx = records[ii].index ;
        }
      }
    },
    columns:
    [
      {
        id: 'evidencetag',
        text: 'Evidence Tag ID',
        tip: "A <u>unique</u> ID or name for the Evidence Tag. <i>Must</i> be unique among all rows shown.<br><span class='gb-tip-footnote'>(Click arrow on the right to sort via this column.)</span>",
        listeners: {
          afterrender: function(cmp, listeners) {
            Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip, dismissDelay: 6000, width: 250 })
          }
        },
        dataIndex: 'evidencetag',
        width: 200,
        sortable: true,
        editor: {
          xtype: 'textfield',
          allowBlank: false,
          regex: /\S/,
          regexText: "Cannot be empty or whitespace-only.",
          emptyText: "Enter new Evidence Tag text...",
          validator: function(fieldValue, arg2) {
            var retVal = true ;
            // Skip empty string (which is default and also not allowed via "allowBlank")
            if(fieldValue != "")
            {
              // How many in the store have this value for the 'evidencetag' dataIndex?
              var grid = cellGrid ;
              var store = grid.getStore() ;
              var count = 0 ;
              var handleNewRow = null ; // This will tell us how to interpret count when done examining store.
              store.each( function(rec, idx) {
                // Skip new row (empty/template) added to store by "Add Tag". No need to check that, it will be updated from the
                //   row editing widgets when all done editing.
                if(rec.raw.isNewRow != true)
                {
                  var dataIndexVal = rec.data['evidencetag'] ;
                  if(dataIndexVal == fieldValue)
                  {
                    // If rec is the currently selected (and thus edited) row, skip this count increment...we're going to replace that value)
                    if(grid.selRowIdx != idx)
                    {
                      count += 1;
                    }
                  }
                }
                else
                {
                  handleNewRow = true ; // But seeing the new row in the store tells us: add-new vs edit-existing
                }
                return count ;
              }) ;
              // If more than one, that's a problem here! IDs are unique.
              // - If a new row, then we should have found NONE with this ID value in the store.
              // - Wups, since we now skip counting the edited row in the store, same in this case too (I think)
              if( (handleNewRow && count > 0) || (!handleNewRow && count > 0) )
              {
                retVal = "Not Unique. The Evidence Tag ID must be unique amongst the records listed here. Perhaps you meant to edit an existing record with that ID value?"
              }
            }

            return retVal ;
          },
          listeners: {
            validityChange: function(field, isValid, opts) {
              // Update RowEditing Update button ourselves. ExtJs 4.2.1 is buggy here for enable/disable based on underlying
              //  form validity [which is what it is SUPPOSED to use; form.isValid()]. The 4.2.2 pay-wall patch doesn't
              //  appear to fix this properly either, just fixes the new-row-Update-is-disabled bug. Bah.
              var actualEditor = rowEditing.editor ;
              var enableUpdate = ( (isValid == true) && (typeof actualEditor.form.isValid() != "undefined") && actualEditor.form.isValid() ) ; // check our new valid status AND status of other for fields
              actualEditor.updateButton(enableUpdate) ;
            }
          }
        }
      },
      {
        id: 'tag',
        text: 'Tag',
        tip: "Evidence code/tag for this evidence claim. Only certain codes/tags are valid for a given cell; the list of tags in this drop list are the valids ones.<br><span class='gb-tip-footnote'>(Click arrow on the right to sort via this column.)</span>",
        listeners: {
          afterrender: function(cmp, listeners) {
            Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip, dismissDelay: 10000, width: 300 })
          }
        },
        dataIndex: 'tag',
        width: 120,
        sortable: true,
        editor: {
          allowBlank: false,
          xtype: 'combobox',
          id: 'tagCombo',
          emptyText: "Select tag...",
          typeAhead: true,
          triggerAction: 'all',
          selectOnTab: true,
          forceSelection : true,
          store: tags[parPath],
          validator: function(fieldValue) {
            var retVal = true ;
            // Did they select an actual tag or the generic "CHOOSE ONE" enum val from the model? Let's encourage the proper tag/code here.
            var grid = cellGrid ;
            var store = grid.getStore() ;
            fieldValue = fieldValue.toUpperCase() ;
            if((fieldValue == "" || fieldValue.indexOf("CHOOSE ONE") >= 0) || (fieldValue.indexOf("SELECT ") >= 0))
            {
              retVal = "Please select an appropriate tag/code. Current selection is not appropriate.";
            }

            return retVal ;
          },
         
          listeners: {
            validityChange: function(field, isValid, opts) {
              // Update RowEditing Update button ourselves. ExtJs 4.2.1 is buggy here for enable/disable based on underlying
              //  form validity [which is what it is SUPPOSED to use; form.isValid()]. The 4.2.2 pay-wall patch doesn't
              //  appear to fix this properly either, just fixes the new-row-Update-is-disabled bug. Bah.
              var actualEditor = rowEditing.editor ;
              var enableUpdate = ( (isValid == true) && (typeof actualEditor.form.isValid() != "undefined") && actualEditor.form.isValid() ) ; // check our new valid status AND status of other for fields
              actualEditor.updateButton(enableUpdate) ;
            }
          }
        }
      },
      {
        id: 'status',
        text: 'Status',
        tip: "Status for this evidence tag. Only certain tags are valid (<i>On</i>) for a given cell; the list of tags in this drop list are all valids ones. Setting this to <i>Off</i> status removes it from the evidence table.<br><span class='gb-tip-footnote'>(Click arrow on the right to sort via this column.)</span>",
        listeners: {
          afterrender: function(cmp, listeners) {
            Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip, dismissDelay: 10000, width: 300 })
          }
        },
        dataIndex: 'stat',
        width: 90,
        sortable: true,
        editor: {
          allowBlank: false,
          xtype: 'combobox',
          id: 'statCombo',
          emptyText: "Select Tag Status...",
          typeAhead: true,
          triggerAction: 'all',
          selectOnTab: true,
          forceSelection : true,
          mode: 'local',
          store: ['On', 'Off'],
          validator: function(fieldValue) {
            var retVal = true ;
            
            var grid = cellGrid ;
            var store = grid.getStore() ;
            fieldValue = fieldValue.toUpperCase() ;
            if((fieldValue == "" || fieldValue.indexOf("CHOOSE ONE") >= 0) || (fieldValue.indexOf("SELECT ") >= 0))
            {
              retVal = "Please select an appropriate tag/code. Current selection is not appropriate.";
            }

            return retVal ;
          },
        }
      },
      {
        id: 'linksummary',
        text: 'Link Summary',
        tip: "Summarises the links for each tag in the order of whether it supports, disputes or is unknown (<b>Supports</b>&#8679 <b>Disputes</b>&#8681 <b>Unknown</b>?). These links determine the status of a Tag to be indicative (On) or not (Off).<br><span class='gb-tip-footnote'>(Click arrow on the right to sort via this column.)</span>",
        listeners: {
          afterrender: function(cmp, listeners) {
            Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip, dismissDelay: 10000, width: 300 })
          }
        },
        dataIndex: 'linksummary',
        width: 120,
        sortable: true,
        editor: {
          xtype: 'textfield'
          },
      },
      {
        id: 'summary',
        text: 'Summary',
        tip: "Summary or comments associated with this evidence claim. Used to describe/summarize why this Evidence tag was added.<br><span class='gb-tip-footnote'>(Click arrow on the right to sort via this column.)</span>",
        listeners: {
          afterrender: function(cmp, listeners) {
            Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip, dismissDelay: 10000, width: 250 })
          }
        },
        dataIndex: 'summary',
        width: 250,
        sortable: true,
        editor: {
          xtype: 'textfield',
          allowBlank: true,
          emptyText: "Provide optional summary/comment text..."
        },
       // wrap the text
       renderer: function(value, metadata) {
        metadata.style = 'white-space: normal;';
         return value;
       }
      }
    ],
    stripeRows: true
  }) ;
  // create and show the window.
  var cellWindowCmp = Ext.create('Ext.window.Window', {
    height: 340,
    width: 800,
    padding: "0px 0px 0px 0px",
    id: 'cellWindow',
    layout: 'fit',
    title: 'Evidence Tags for the cell: <i>' + parPath.replace(/\./g, "&nbsp;&raquo;&nbsp;") + '</i>',
    items:[cellGrid]
  }) ;
  cellWindowCmp.show();
}



function showAddLinksWindow(selectedTag, subj, parPath, cellId) 
{
  linkStoreData = [] ; 
  var link ; 
  var linkCode ;
  var linkComment ;
  // Check if links are already present for the selected tag
  // If yes, then add it to the store
  if(('Links' in subj.Tag.properties) && ('items' in subj.Tag.properties.Links) && (subj.Tag.properties.Links.items.length > 0))
  {
    var linkItems = subj.Tag.properties.Links.items ;
    for(var ii=0; ii<linkItems.length; ii++)
    {
       link = linkItems[ii].Link.value ;
       if('Link Code' in linkItems[ii].Link.properties)
       {
         linkCode = linkItems[ii]['Link']['properties']['Link Code']['value'] ;
       }
       else
       {
         linkCode = "Unknown" ;
       }
       if('Comment' in linkItems[ii].Link.properties)
       {
         linkComment = linkItems[ii]['Link']['properties']['Comment']['value'] ;
       }
       else
       {
         linkComment = "" ;
       }
       linkStoreData.push({link: link, linkcode: linkCode, comment: linkComment});
    } 
    console.log(linkStoreData);
  }
  makeLinksWindow(linkStoreData, parPath, selectedTag) ;
}

function makeLinksWindow(linkStoreData, parPath, selectedTag) 
{
  // First close the tag/cell window
  Ext.getCmp('cellWindow').hide() ;

  Ext.define('TagLinks', {
    extend: 'Ext.data.Model',
    fields: [
      { name: 'link' },
      { name: 'linkcode' },
      { name: 'comment' }
    ]
  });

  var linkStore = Ext.create('Ext.data.Store', {
    autoDestroy: true,
    model: 'TagLinks',
    proxy: {
      type: 'memory'
    },
    data: linkStoreData
  });

  var linksrowEditing = Ext.create('Ext.grid.plugin.RowEditing', {
    clicksToMoveEditor: 1,
    errorSummary: false,
    autoCancel: true,
    listeners : {
      canceledit: function(arg1, arg2, arg3) {
      
        if((typeof arg2 != 'undefined') && (typeof arg2.record.raw != 'undefined'))
        {
          if(arg2.record.raw.isNewRow)
          {
            arg2.record.store.remove(arg2.record);
          }
        }
        else if(typeof arg1.record.data != 'undefined')
        {
          if(arg1.record.data.isNewRow == true) // Not an edit of existing (don't delete existing when hit cancel!)
          {
            arg1.record.store.remove(arg1.record) ;
          }
        }
        else // error can't find correct object to do removal on
        {
          console.log("ERROR [BUG]: Can't remove empty new row upon Cancel!") ;
        }
      },
      beforeedit: function(editor, context, opts) {

      },
      validateedit: function(editor, context, opts) {
        phantomRec = context.record.raw ;
        phantomRec.isNewRow = false ;
      }
    }
  });


 var linkGrid = new Ext.grid.GridPanel(
  {
    id: 'linkGrid',
    viewConfig: { forceFit: true },
    width: 680,
    useArrows: true,
    closeFull: true,
    autoScroll: true,
    store: linkStore,
    selRowIdx: null,
    tbar: [
      {
        itemId : 'addLink',
        text:'Add Link',
        iconCls: 'addLink',
        disabled: true,
        tip: "Add a new link to the selected evidence tag of the Evidence document. You will provide:<ul class='gb-tip'><li>A <u>link</u> supporting the evidence</li><li>The appropriate link code</li><li>An optional comment about the link and how it supports/disputes the evidence.</li></ul><br><br>This is a Public Page and this feature is <b>disabled<br><span class='gb-tip-footnote'>(Changes are not saved until you click <code>Save Links</code>)</span>",
        listeners: {
          afterrender: function(cmp, listeners) {
            Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip, dismissDelay: 15000, width: 350 })
          }
        },
        handler: function() {
          var empty = false ; 
          var newRow = {
            link: '',
            linkcode: '',
            comment: ''
          };
          newRow.isNewRow = true ;

          linkStore.each(function (rec, idx){
             if(rec.raw.isNewRow == true)
             {
                empty = true;
             }
          }) ;
          if(empty != true)
          {
            linkStore.insert(0, newRow) ;
            linksrowEditing.startEdit(0, 0) ;
          }
        }
      },
      {
        itemId : 'deleteLink',
        text:'Delete Link',
        tip: "Deletes the selected link, the supporting link code and comment from the underlying Evidence doc.<br><br>This is a Public Page and this feature is <b>disabled<br><span class='gb-tip-footnote'>(Changes are not saved until you click <code>Save Links</code>)</span>",
        listeners: {
          afterrender: function(cmp, listeners) {
            Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip, dismissDelay: 6000, width: 350 })
          }
        },
        iconCls: 'deleteLink',
        disabled: true,
        handler: function() {
          var sm = linkGrid.getSelectionModel();
          linksrowEditing.cancelEdit();
          linkStore.remove(sm.getSelection());
          if(linkStore.getCount() > 0)
          {
            sm.select(0);
          }
        }
      },
      {
        text:'Save Links',
        iconCls: 'saveLinks',
        disabled: true,
        tip: "After adding or removing links, this button can be used to save your changes to the underlying Evidence doc.This is a Public Page and this feature is <b>disabled<br><span class='gb-tip-footnote'>(Changes are not saved until you click this.)</span>",
        listeners: {
          afterrender: function(cmp, listeners) {
            Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip, dimissDelay: 6000, width: 250 })
          }
        },
        handler: function() {
          var linkdataItems = linkGrid.getStore().data.items ;
          saveTagLinksToDoc(parPath, linkdataItems, selectedTag) ;
        }
      },

      {
        text: 'Tag',
        id: 'goToTag',
        iconCls: 'goTag',
        tip: "This button can be used to go back to the original Tag/Evidence for the Links.<br><span class='gb-tip-footnote'>(Changes are not saved until you click this.)</span>",
        listeners: {
          afterrender: function(cmp, listeners) {
            Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip, dimissDelay: 6000, width: 250 })
          }
        },
        handler: function() {
          linkGrid.closeFull = false ;
          Ext.getCmp('linkWindow').close() ;
          Ext.getCmp('cellWindow').show() ;
        }
      }
    ],
    plugins: [linksrowEditing],
    listeners: {
      'selectionchange': function(view, records) {
        //linkGrid.down('#deleteLink').setDisabled(!records.length);
        //linkGrid.down('#addLink').setDisabled(!tags[parPath]);
        for(var ii=0; ii<records.length; ii++) // Should only be one, but we'll note the last one's selected index
        {
          linkGrid.selRowIdx = records[ii].index ;
        }
      }
    },
    columns:
    [

      {
          xtype: 'actioncolumn',
          //header: 'View KB Document',
          width: 50,
          align: 'center',
          icon: '/images/silk/application_link.png',
          handler: function(grid, rowIndex, colIndex) {
                    var rec = grid.getStore().getAt(rowIndex);
                    var lin = rec.get('link') ;
                    window.open(lin, '_blank');
            },
          tooltip: "Go to the link"
      },
      {
        id: 'link',
        text: 'Link',
        tip: "Link that provides additional information to the presence of a tag. It could either support or dispute the evidence, or may also be unknown in some cases.<br><span class='gb-tip-footnote'>(Click arrow on the right to sort via this column.)</span>",
        listeners: {
          afterrender: function(cmp, listeners) {
            Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip, dismissDelay: 6000, width: 250 })
          }
        },
        dataIndex: 'link',
        width: 200,
        sortable: true,
        editor: {
          xtype: 'textfield',
          allowBlank: false,
          regex: /\S/,
          regexText: "Cannot be empty or whitespace-only.",
          emptyText: "Enter new Link/URL",
          validator: function(fieldValue, arg2) {
            var retVal = true ;
            // Skip empty string (which is default and also not allowed via "allowBlank")
            if(fieldValue != "")
            {
              // How many in the store have this value for the 'evidencetag' dataIndex?
              var grid = linkGrid ;
              var store = grid.getStore() ;
              var count = 0 ;
              var handleNewRow = null ; // This will tell us how to interpret count when done examining store.
              store.each( function(rec, idx) {
                // Skip new row (empty/template) added to store by "Add Tag". No need to check that, it will be updated from the
                //   row editing widgets when all done editing.
                if(rec.raw.isNewRow != true)
                {
                  var dataIndexVal = rec.data['link'] ;
                  if(dataIndexVal == fieldValue)
                  {
                    // If rec is the currently selected (and thus edited) row, skip this count increment...we're going to replace that value)
                    if(grid.selRowIdx != idx)
                    {
                      count += 1;
                    }
                  }
                }
                else
                {
                  handleNewRow = true ; // But seeing the new row in the store tells us: add-new vs edit-existing
                }
                return count ;
              }) ;
              // If more than one, that's a problem here! IDs are unique.
              // - If a new row, then we should have found NONE with this ID value in the store.
              // - Wups, since we now skip counting the edited row in the store, same in this case too (I think)
              if( (handleNewRow && count > 0) || (!handleNewRow && count > 0) )
              {
                retVal = "Not Unique. The Evidence Tag ID must be unique amongst the records listed here. Perhaps you meant to edit an existing record with that ID value?"
              }
            }

            return retVal ;
          },
          listeners: {
            validityChange: function(field, isValid, opts) {
              // Update RowEditing Update button ourselves. ExtJs 4.2.1 is buggy here for enable/disable based on underlying
              //  form validity [which is what it is SUPPOSED to use; form.isValid()]. The 4.2.2 pay-wall patch doesn't
              //  appear to fix this properly either, just fixes the new-row-Update-is-disabled bug. Bah.
              var actualEditor = linksrowEditing.editor ;
              var enableUpdate = ( (isValid == true) && (typeof actualEditor.form.isValid() != "undefined") && actualEditor.form.isValid() ) ; // check our new valid status AND status of other for fields
              actualEditor.updateButton(enableUpdate) ;
            }
          }
        }
      },
      {
        id: 'linkcode',
        text: 'Link Code',
        tip: "Evidence code/tag for this evidence claim. Only certain codes/tags are valid for a given cell; the list of tags in this drop list are the valids ones.<br><span class='gb-tip-footnote'>(Click arrow on the right to sort via this column.)</span>",
        listeners: {
          afterrender: function(cmp, listeners) {
            Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip, dismissDelay: 10000, width: 300 })
          }
        },
        dataIndex: 'linkcode',
        width: 120,
        sortable: true,
        editor: {
          allowBlank: false,
          xtype: 'combobox',
          id: 'linkcodeCombo',
          emptyText: "Select link code...",
          typeAhead: true,
          triggerAction: 'all',
          selectOnTab: true,
          forceSelection : true,
          store: ['Unknown', 'Supports', 'Disputes'],
          validator: function(fieldValue) {
            var retVal = true ;
            // Did they select an actual tag or the generic "CHOOSE ONE" enum val from the model? Let's encourage the proper tag/code here.
            var grid = linkGrid ;
            var store = grid.getStore() ;
            fieldValue = fieldValue.toUpperCase() ;
            if((fieldValue == "" || fieldValue.indexOf("CHOOSE ONE") >= 0) || (fieldValue.indexOf("SELECT ") >= 0))
            {
              retVal = "Please select an appropriate tag/code. Current selection is not appropriate.";
            }

            return retVal ;
          },
          listeners: {
            validityChange: function(field, isValid, opts) {
              // Update RowEditing Update button ourselves. ExtJs 4.2.1 is buggy here for enable/disable based on underlying
              //  form validity [which is what it is SUPPOSED to use; form.isValid()]. The 4.2.2 pay-wall patch doesn't
              //  appear to fix this properly either, just fixes the new-row-Update-is-disabled bug. Bah.
              var actualEditor = linksrowEditing.editor ;
              var enableUpdate = ( (isValid == true) && (typeof actualEditor.form.isValid() != "undefined") && actualEditor.form.isValid() ) ; // check our new valid status AND status of other for fields
              actualEditor.updateButton(enableUpdate) ;
            }
          }
        }
      },
      {
        id: 'comment',
        text: 'Comment',
        tip: "Summary or comments associated with this evidence claim. Used to describe/summarize why this Evidence tag was added.<br><span class='gb-tip-footnote'>(Click arrow on the right to sort via this column.)</span>",
        listeners: {
          afterrender: function(cmp, listeners) {
            Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip, dismissDelay: 10000, width: 250 })
          }
        },
        dataIndex: 'comment',
        width: 370,
        sortable: true,
        editor: {
          xtype: 'textfield',
          allowBlank: true,
          emptyText: "Provide optional summary/comment text..."
        },
       // wrap the text
       renderer: function(value, metadata) {
        metadata.style = 'white-space: normal;';
         return value;
       }
      }
    ],
    stripeRows: true
  }) ;

  // create and show the window.
  var linkWindowCmp = Ext.create('Ext.window.Window', {
    height: 340,
    width: 690,
    padding: "0px 0px 0px 0px",
    id: 'linkWindow',
    layout: 'fit',
    title: 'Links for the Evidence Tag: <u>' + selectedTag + '</u>',
    items:[linkGrid],
    listeners: 
    {
       close: function(wnd, eOpts){
         //alert(linkGrid.closeFull) ;
         if(linkGrid.closeFull == true){ Ext.getCmp('cellWindow').close() ;}
       }
    }

  }) ;
  linkWindowCmp.show();
}




function getEvTemplate()
{
  var evObj = new Object();

  evObj = {
  "Evidence Tag": {
    "properties": {
      "Tag": {
        "properties": {
          "Pathogenicity": {"value": ""},
          "Type": {"value": ""},
          "Strength": {"value": ""},
          "Summary": {"value": ""},
          "Status" : {"value" : "On"}
        },
        "value": ""
      }
    },
    "value": ""
    }
  }
  return evObj ;
}


function getLinkTemplate()
{
  var linkObj = new Object() ;
  linkObj = {
    "Link" : {
      "properties" : {
        "Link Code" : {"value" :  ""},
        "Comment" : {"value" : ""}
       
      },
      "value" : ""
    }
  } ;
  return linkObj ;

}

function isValid(path)
{
  retVal = true ;
  if(!tags[path]) {retVal = true;}
  else{retVal = false;}
  return retVal
}


function showPublicWindow()
{

  var pubWindow = new Ext.Window({
        width: 500,
        id: 'publicWin',
        buttonAlign:'center',
        width: 400,
        title: '',
        html: '<div class="publicWin">You are viewing <b>Public</b> version of CLINGEN PATHOGENICITY CALCULATOR <br> This version has restricted use of the following features: <ul><li>Create a New Evidence</li><li>Add New Tags</li><li>Add New Links to the Tags</li><li>Copy Tags</li></ul> Use the private page to use these features</div>'
    });

    pubWindow.show();

}
