
// Needed for ExtJS 4.0, but should be able to remove for 4.2
// - In fact, fireEvent() args are incompatible with args used in 4.2's canceledit [where this even IS actually defined]
//   . Which coincidentally is GOOD, because else it would be an infinite loop in 4.2 (as it almost is in 4.0)
//   . Instead, in both cases, the 2nd firing of canceledit just writes exception to the console log
//     which is better than infinite loop at least.
//   . Regardless, need to use 4.2 which has this event natively!
// - Compare available events (this hacks in canceledit into 4.0):
//   . http://docs.sencha.com/extjs/4.0.0/#!/api/Ext.grid.plugin.RowEditing
//   . http://docs.sencha.com/extjs/4.2.1/#!/api/Ext.grid.plugin.RowEditing
//Ext.onReady( function() {
//  var extVerInfo = Ext.getVersion() ;
//  if(extVerInfo.major == 4 && extVerInfo.minor < 2)
//  {
//    Ext.override(Ext.grid.plugin.RowEditing, {
//      cancelEdit: function() {
//        var me = this;
//        if(me.editing)
//        {
//          me.getEditor().cancelEdit();
//          me.callParent(arguments);
//          this.fireEvent("canceledit", this.context);
//        }
//      }
//    });
//  }
//}) ;

// ExtJS 4.2.1 has a RowEditing Update button bug that is fixed in the subscription-only patch-service 4.2.2 product.
//Ext.define('Override.RowEditor', {
//    override: 'Ext.grid.RowEditor',
//    loadRecord: function(record) {
//      var me     = this,
//          form   = me.getForm(),
//          fields = form.getFields(),
//          items  = fields.items,
//          length = items.length,
//          i, displayFields,
//          isValid;
//
//      for(i = 0; i < length; i++)
//      {
//        items[i].suspendEvents();
//      }
//
//      form.loadRecord(record);
//
//      for (i = 0; i < length; i++)
//      {
//        items[i].resumeEvents();
//      }
//
//      isValid = form.isValid();
//      if(me.errorSummary)
//      {
//        if(isValid)
//        {
//          me.hideToolTip();
//        }
//        else
//        {
//          me.showToolTip();
//        }
//      }
//
//      // overcome issue with form.valid returning false on new record
//      if(record.phantom === true)
//      {
//        me.updateButton(true);
//      }
//      else
//      {
//        me.updateButton(isValid);
//      }
//
//      displayFields = me.query('>displayfield');
//      length = displayFields.length;
//
//      for(i = 0; i < length; i++)
//      {
//        me.renderColumnData(displayFields[i], record);
//      }
//    }
//
//});

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
    if(metaObj && metaObj.Tags)
    {
      for(var ii=0; ii<metaObj.Tags.length; ii++)
      {
        gridStoreData.push({evidencetag : metaObj.EvidenceTags[ii], tag: metaObj.Tags[ii], summary: metaObj.Summary[ii]});
      }
    }
    makeCellWindow(partitionPath, gridStoreData, cellElId) ;
  }
}

// makes the pop up grid for each of the cell
function makeCellWindow(parPath, gridStoreData, cellId)
{
  Ext.define('Tag', {
    extend: 'Ext.data.Model',
    fields: [
      { name: 'evidencetag' },
      { name: 'tag' },
      { name: 'summary' }
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

  // Appears to be called completely wrong in 4.0 and 4.2?
  // - Added in listeners config of this object (above)
  //rowEditing.on({
  //  scope: this,
  //  canceledit: function(pRoweditor, pChanges) {
  //    this.fireEvent('canceledit', pRoweditor, pChanges);
  //  }
  //}) ;

  // panel for the cell, with evidence tag and summary information
  var cellGrid = new Ext.grid.GridPanel(
  {
    id: 'cellGrid',
    viewConfig: { forceFit: true },
    width: 680,
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
        disabled: isValid(parPath),
        tip: "Add a new evidence code to the Evidence document. You will provide:<ul class='gb-tip'><li>A <u>unique</u> Evidence Tag ID</li><li>The appropriate evidence code/tag</li><li>An optional summary/comment about why the evidence tag applies.</li></ul><br><span class='gb-tip-footnote'>(Changes are not saved until you click <code>Save Edits</code>)</span>",
        listeners: {
          afterrender: function(cmp, listeners) {
            Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip, dismissDelay: 15000, width: 350 })
          }
        },
        handler: function() {
          var newRow = {
            evidencetag: '',
            tag: '',
            summary: ''
          };
          newRow.isNewRow = true ;
          cellStore.insert(0, newRow);
          rowEditing.startEdit(0, 0);
        }
      },
      {
        itemId : 'deleteTag',
        text:'Delete Tag',
        tip: "Deletes the selected Evidence Tag (row) from the underlying Evidence doc.<br><span class='gb-tip-footnote'>(Changes are not saved until you click <code>Save Edits</code>)</span>",
        listeners: {
          afterrender: function(cmp, listeners) {
            Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip, dismissDelay: 6000, width: 350 })
          }
        },
        iconCls: 'deleteTag',
        disabled: true,
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
        tip: "After adding or removing evidence, this button can be used to save your changes to the underlying Evidence doc.<br><span class='gb-tip-footnote'>(Changes are not saved until you click click this.)</span>",
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
      }
    ],
    plugins: [rowEditing],
    listeners: {
      'selectionchange': function(view, records) {
        cellGrid.down('#deleteTag').setDisabled(!records.length);
        cellGrid.down('#addTag').setDisabled(!tags[parPath]);
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
        id: 'summary',
        text: 'Summary',
        tip: "Summary or comments associated with this evidence claim. Used to describe/summarize why this Evidence tag was added.<br><span class='gb-tip-footnote'>(Click arrow on the right to sort via this column.)</span>",
        listeners: {
          afterrender: function(cmp, listeners) {
            Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip, dismissDelay: 10000, width: 250 })
          }
        },
        dataIndex: 'summary',
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
  var cellWindowCmp = Ext.create('Ext.window.Window', {
    height: 340,
    width: 690,
    padding: "0px 0px 0px 0px",
    id: 'cellWindow',
    layout: 'fit',
    title: 'Evidence Tags for the cell: <i>' + parPath.replace(/\./g, "&nbsp;&raquo;&nbsp;") + '</i>',
    items:[cellGrid]
  }) ;
  cellWindowCmp.show();
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
          "Summary": {"value": ""}
        },
        "value": ""
      }
    },
    "value": ""
    }
  }
  return evObj
}


function isValid(path)
{
  retVal = true ;
  if(!tags[path]) {retVal = true;}
  else{retVal = false;}
  return retVal
}
