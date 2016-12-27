function updateSubjectsData(linkstore, subjectsData, tag)
{
  var linksObjs = {} ;
  linksObjs["items"] = [] ;
  linksObjs.value = 0 ;
  var linkObj;
  for(var ii=0; ii<linkstore.length; ii++)
  {
    linkObj = getLinkTemplate() ;
    linkObj["Link"]["value"] = linkstore[ii].data.link ;
    linkObj["Link"]["properties"]["Link Code"]["value"] = linkstore[ii].data.linkcode ;
    linkObj["Link"]["properties"]["Comment"]["value"] = linkstore[ii].data.comment ;
    linksObjs["items"].push(linkObj) ;
  }
  linksObjs.value = linksObjs["items"].length ;
  if(tag in subjectsData) 
  {
    subjectsData[tag].Tag.properties.Links = linksObjs ;
    subjectsData[tag].Tag.properties.Links.value = linksObjs.items.length ;
  }
  else
  {
    subjectsData[tag] = {
      "Tag" : {
        "properties" : {
         "Links" : linksObjs
        
        }
      }
    };
  }
  return subjectsData 
}



// partition click and fill tag form associated methods
// On clicking a partition (Evidence Type) a form/grid with all the associated tags are
// displayed with features for all adding links to the tag.
function clickPartition(id, partitionName, path, metadata)
{
  getAllTagsinHtmlTable() ;
  // global
  subjectsData = new Object() ;
  tagExclusionsOfInterest = new Object() ;
  var partitionEl = document.getElementById(id) ;
  // Do not show tag and links window if the the partition header is the first partition
  // Currently window to be displayed only for the last partition
  if((partitionEl.classList.contains("gb-part3-header")))
  {
    // close all the previously opened windows
    closeAllWindows() ;
    var partitionData = getPartitionData(partitionName) ;
    subjectsData =  partitionData[1] ;
    popTagAndLinkWindow(partitionName, partitionData[0]) ;
  }
  
} 

function getPartitionData(pname)
{
 var pstore = [] ;
 var tagPresent ;
 var tagSummary  ;
 var tagData = {} ;
 var normalCode = [] ;
 var upgradedCode = [] ;
 var tagsTostoreData = {} ;
 subjectsData = new Object() ; // global
 var numLinks ; 
   for (var tagcode in tags)
   {
     var lastname = tagcode.split(".")
     // get the tags wrp to the evidence type selected
     if(lastname[lastname.length-1] == pname) {
       for(var ii=0; ii<tags[tagcode].length; ii++)
       {
         // get the normal and upgraded codes separately to sort later
         if(tags[tagcode][ii].match(/-/)){upgradedCode.push(tags[tagcode][ii]) ;} 
         else{normalCode.push(tags[tagcode][ii]); }
         tagPresent = false ;
         tagSummary = null ;
         numLinks = 0;
         var objid = tagcode.replace(/\s+/g, '') ;
         var tdElem = document.getElementById ( objid);
         if(tdElem) {
           var tdText = tdElem.innerText | tdElem.textContent;
           if(tdText > 0) { 
             var onclickParams = tdElem.getAttribute('onclick') ;
             var res = onclickParams.match(/{EvidenceTags.*}|{Tags.*}|{Stat.*}|{Summary.*}|{subjects.*}/) ;
             if(res && res[0]) { var evObj = eval ("(" + res[0] + ")") ; }
             for(var jj=0; jj<evObj.Tags.length; jj++)
             {
               if(tags[tagcode][ii] == evObj.Tags[jj])
               {
                 tagData[tags[tagcode][ii]] = evObj.subjects[jj] ;
                 if('Summary' in evObj.subjects[jj]['Tag']['properties'] && evObj.subjects[jj]['Tag']['properties']['Summary']['value'].length)
                 {
                   tagSummary = evObj.subjects[jj]['Tag']['properties']['Summary']['value'] ;
                 }
                 tagPresent = true ;
                 // get the links number for the tag
                 if('Links' in evObj.subjects[jj]['Tag']['properties']) {numLinks = evObj.subjects[jj]['Tag']['properties']['Links']['value'] ;}
                 break ;
               }
             }
           }
         }
         if(!(tagSummary)) {tagSummary = tagDefs[tags[tagcode][ii]] ;}
         // get the data for the store
         tagsTostoreData[tags[tagcode][ii]] = [ tagSummary, tagPresent, tags[tagcode][ii], tagcode, numLinks] ; 
       }
     }
   }
   pstore = [] ;
   // sort the normal and upgraded code and enter them to the store resp
   normalCode = normalCode.sort() ;
   upgradedCode = upgradedCode.sort()
   for(var ii=0; ii<normalCode.length; ii++) {pstore.push(tagsTostoreData[normalCode[ii]]) ;}
   for(var ii=0; ii<upgradedCode.length; ii++) {pstore.push(tagsTostoreData[upgradedCode[ii]]) ;}
  return [pstore, tagData]
}


function popTagAndLinkWindow(pname, tagstore)
{
   
 Ext.define('TagLinks', {
    extend: 'Ext.data.Model',
    fields:[{name:'tagtext'}, {name: 'tagPresent'}, {name: 'tag'}, {name: 'tagpath'}, {name: 'numLinks'}]
  });

    
   var tagTextStore = Ext.create('Ext.data.SimpleStore', {
     autoDestroy: true,
     model: 'TagLinks',
     data: tagstore
   });

    var rowEditing = Ext.create('Ext.grid.plugin.RowEditing', {
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




   Ext.define('tagAndLinksGrid', {
    extend: 'Ext.grid.GridPanel',
    id: 'tagAndLinks',
    height: 150,
    xtype: 'row-expander-grid',
    region:'center',
    border: false,
    //selModel: selMode,
    store: tagTextStore,
    viewConfig: {markDirty:false},
    //hideHeaders:true,
    plugins: [{
        ptype: 'rowexpander',
        rowBodyTpl: [
                '<div id="linksData{tag}" class="linksData">',
                '</div>'
            ],
        expandOnDblClick : false,
        selectRowOnExpand: false,
        expandOnEnter : false,
        collapseOnEnter: false,
        collapseOnClick: false,
        }, rowEditing],
    columns: [
      {
        text: 'Add/Remove <br>Tags',
        xtype: 'checkcolumn',
        flex: 0.5,
        tooltip: 'Use the checkboxes to turn on or off the tag for a given variant and condition' ,
        dataIndex: 'tagPresent',
        scope: this,
        listeners:  {
         /*'checkchange' : function(a, b, c) {*/
         'checkchange' : function(cmp, rowIndex, checked, e) {
             var maingrid = Ext.getCmp('tagAndLinks') ;
             var record = maingrid.store.getAt(rowIndex) ;
             // unchecking a tag is equivalent to removing the tag, so update the tag exclusions
             if(checked == false)
             {
               if(record.data.tag in alltagsinTable)
               {
                 delete alltagsinTable[record.data.tag] ;
                 delete tagExclusionsOfInterest[record.data.tag] ;
                 // update the status of all the tags in store
                 updateTagExclusionStatus() ;
               }
             }
             // checking(adding) a tag. confirm the exclusion tag info and then proceed
             else
             {
               console.log(record) ;
               var selectedTag = record.data.tag ;
               if(selectedTag in tagExclusionsOfInterest && tagExclusionsOfInterest[selectedTag]["Problem Action"]["value"] == "Warning") {displayTagWarning(tagExclusionsOfInterest[selectedTag]["Description"]["value"], null, record) ;}
               else if (selectedTag in tagExclusionsOfInterest && tagExclusionsOfInterest[selectedTag]["Problem Action"]["value"] == "Strictly Prohibited") {displayTagError(tagExclusionsOfInterest[selectedTag]["Description"]["value"], selectedTag) ; record.set('checked', false); record.set('tagPresent', false) ;}
               else if(!(selectedTag in  alltagsinTable))
               {
                 alltagsinTable[record.data.tag] = true ;
                 updateTagExclusionStatus() ;
               }

             }
             // fix when the row is expanded and clicking the check box automatically collapses the
             // row!!!! This fix below may not be the right solution and could be a temporary one.
             var rowNode = maingrid.getView().getNode(rowIndex);
             var row = Ext.fly(rowNode, '_rowExpander');
             var isCollapsed = row.hasCls(maingrid.plugins[0].rowCollapsedCls);
             if(isCollapsed == false)
               { Ext.getCmp('tagAndLinks').plugins[0].toggleRow(rowIndex, record); Ext.getCmp('tagAndLinks').plugins[0].toggleRow(rowIndex, record); }
          }
        }     
      },
      {
        text: 'Tag', 
        align: 'left', 
        flex:1,
        tooltip: 'Evidence tag with the number of available links to the external sources are shown to the right',
        renderer: function(value, meta, rec, rowIndex, colIndex, store) {
          //meta.style = 'white-space: normal;';
          var tagexcls = null ;
          tagexcls = bkgetTagExclusionCls(rec.data.tag) ;
          if((!(tagexcls)) || rec.data.tagPresent) {tagexcls = 'tagcode' ;}
          
          value = Ext.String.format(
        //'<div class ="numLinks"> <i class="fa fa-link linkicon" aria-hidden="true"><div data-qtip="Number of links available for the tag" class="numLinksText">'+rec.data.numLinks+'</div></i></div>' +
        '<div data-qtip="Number of links available for the tag" class="numLinksText">'+rec.data.numLinks+'</div>' +
        '<div class="tagAndLinksRow"><span id="'+'tagcode'+rec.data.tag+'" class="'+tagexcls+'">'+rec.data.tag+'</span></div>');
          return value;
        }
      },
      {
        dataIndex: 'tagtext',
        align: 'left',
        flex: 2,
        text: 'Summary',
        tooltip: 'Double click on the summary to edit default summary (From ACMG guidelines).',
        editor: {
          xtype: 'textfield',
          allowBlank: true,
          regex: /^((?!")(?!').)*$/,
          regexText: "Cannot have single or double quotes . . .<br>",
          emptyText: "Provide optional summary/comment text..."
        },
        renderer: function(value, meta, rec, rowIndex, colIndex, store) {
          meta.style = 'white-space: normal;';
          return value;
        }
      }
    ],
    tbar: [
     {
        text:'Save Edits',
        iconCls: 'saveTag',
        tooltip: "After adding or removing tags this button can be used to save your changes to the underlying Evidence doc.<br>Use \"+\" before the tag after turning on the tag to manage links.<br><span class='gb-tip-footnote'>(Changes are not saved until you click this.)</span>",
        handler: function() {
          //var selections = Ext.getCmp('tagAndLinks').getSelectionModel().getSelection() ;
          var dataItems = Ext.getCmp('tagAndLinks').store.data.items ;
          saveAllTagsOfType(pname, dataItems, subjectsData, false); 
       }
     },

     {
       text: 'Help',
       tooltip: "To add and/or remove tags: <br> <ul class='gb-tip'><li>Use the checkboxes to <u>turn on or off</u> the tag for a given variant and condition.</li><li>Double click on the summary to <u>edit default summary</u> (From ACMG guidelines).</li><li>Click on [Save Edit] button on the top-left to <u>save</u> the edited tags.</li><li>Use <q>+</q> before the tag after turning on the tag to <u>manage links</u>.</li></ul>",
       iconCls: 'taghelp'
     }
    ],
     initComponent: function () {
        var me = this;

        this.callParent(arguments);

        me.getView().on('expandBody', me.onExpandNestedGrid,me);
        me.getView().on('collapsebody', me.onCollapseNestedGrid,me);
    },

    onExpandNestedGrid : function (rowNode, record, expandRow, eOpts) {
      var tagOnExpandedRow = record.data.tag ;

      var detailData = Ext.DomQuery.select("div.linksData", expandRow);      
      Ext.define('linkModel', {
            extend: 'Ext.data.Model',
            fields: [
                { name: 'link'},
                { name : 'linkcode'},
                { name: 'comment'}
            ]
        });
        var dataForInnerGrid = getLinkDataFromSubs(subjectsData, record.data.tag, record.data.tagPresent) ;
        var insideGridStore = Ext.create('Ext.data.SimpleStore', {
            model: 'linkModel',
            data: dataForInnerGrid
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
         validateedit: function(editor, context, opts) {
           phantomRec = context.record.raw ;
           phantomRec.isNewRow = false ;
         }
        }
      });
   var innerGrid = Ext.create('Ext.grid.Panel', {
            store: insideGridStore,
            id: 'linkinnerGrid'+record.data.tag,
            renderTo: detailData[0],
            useArrows: true,
            minHeight : 120,
            frame : true,
            closeFull: true,
            autoScroll: true,
            selRowIdx: null,
            stripeRows: true,
            selModel: 'rowselection', 
            viewConfig: { selectedItemCls : 'selectedClassForRow'},
            plugins: [linksrowEditing] , 
            tbar: [
            {
              text:'Add Link',
              iconCls: 'addLink',
              disabled: !record.data.tagPresent,
              tooltip: "Add a new link to the selected evidence tag of the Evidence document. You will provide:<ul class='gb-tip'><li>A <u>link</u> supporting the evidence</li><li>The appropriate link code</li><li>An optional comment about the link and how it supports/disputes the evidence.</li></ul><br><span class='gb-tip-footnote'>(Changes are not saved until you click <code>Save Edits</code>)</span>",
             handler: function() {
               var empty = false ; 
                 var newRow = {
                   link: '',
                   linkcode: 'Supports',
                   comment: ''
                 };
               newRow.isNewRow = true ;
               insideGridStore.each(function (rec, idx){
                 if(rec.raw.isNewRow == true){ empty = true;}
               }) ;
               if(empty != true)
               {
                 insideGridStore.insert(0, newRow) ;
                 linksrowEditing.startEdit(0, 0) ;
               }
             }
           },
           {
             itemId : 'deleteLink',
             text:'Delete Link',
             tooltip: "Deletes the selected link, the supporting link code and comment from the underlying Evidence doc.<br><span class='gb-tip-footnote'>(Changes are not saved until you click <code>Save Edits</code>)</span>",
             iconCls: 'deleteLink',
             disabled: insideGridStore.getCount() == 0 || !record.data.tagPresent,
              handler: function() {
		var sm = innerGrid.getSelectionModel();
		linksrowEditing.cancelEdit();
                insideGridStore.remove(sm.getSelection());
                if(insideGridStore.getCount() > 0){ sm.select(0); }
             }
           },
           {
             text:'Save Edits',
             iconCls: 'saveLinks',
             disabled: !record.data.tagPresent,
             tooltip: "After adding or removing links, this button can be used to save your changes to the underlying Evidence doc.<br><span class='gb-tip-footnote'>(Changes are not saved until you click this.)</span>",
             handler: function() {
               var linkdataItems = innerGrid.getStore().data.items ;
               subjectsData = updateSubjectsData(linkdataItems, subjectsData, tagOnExpandedRow) ;
               var tagdataItems = Ext.getCmp('tagAndLinks').store.data.items ;
               // set the numLinks 
               //record.set('numLinks', linkdataItems.length) ;
               saveAllTagsOfType(pname, tagdataItems, subjectsData, false);
             }
           },

           {
             text: 'Help',
             tooltip: "To add and/or remove links: <br> <ul class='gb-tip'><li><u>Add links</u> to external sources which either support or disputes a given tag (e.g. PubMed article for functional, segregation, and, de Novo data; allele frequency from ExAC; Other data, databases, etc.) </li><li><u>Click on Add links button</u> to add a row</li><li>Add a URL </u> (e.g.  <a href=\"http://www.ncbi.nlm.nih.gov/pubmed/26070511\">http://www.ncbi.nlm.nih.gov/pubmed/26070511</a>) in the <i>Link</i> column and <u>optional summary</u> in the last column. Summary describes what does the external data suggest.</li></ul>",
             iconCls: 'taghelp'
           }

         ],
         columns:
            [
              {
                xtype: 'actioncolumn',
                flex: 0.5,
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
                text: 'Link',
                dataIndex: 'link',
                flex:2,
                sortable: true,
                editor: {
                  xtype: 'textfield',
                  allowBlank: false,
                  regex: /\S/,
                  regexText: "Cannot be empty or whitespace-only.",
                  emptyText: "Enter new Link/URL",
                  vtype: 'url',
                  vtypeText: 'Not a valid URL',
                  validator: function(fieldValue, arg2) {
                    var retVal = true ;
                    if(fieldValue != "")
                    {
                      var grid = innerGrid ;
                      var store = grid.getStore() ;
                      var count = 0 ;
                      var handleNewRow = null ; // This will tell us how to interpret count when done examining store.
                      store.each( function(rec, idx) {
                        if(rec.raw.isNewRow != true)
                        {
                          var dataIndexVal = rec.data['link'] ;
                          if(dataIndexVal == fieldValue)
                          {
                            if(grid.selRowIdx != idx)
                            {
                              count += 1;
                            }
                          }
                        }
                        else
                        {
                          handleNewRow = true ; 
                        }
                        return count ;
                      }) ;
                      if( (handleNewRow && count > 0) || (!handleNewRow && count > 0) )
                      {
                        retVal = "Not Unique. The Link must be unique amongst the records listed here. Perhaps you meant to edit an existing record with that link?"
                      }
                   }
                   return retVal ;
                 },
                 listeners: {
                   validityChange: function(field, isValid, opts) {
                     var actualEditor = linksrowEditing.editor ;
                     var enableUpdate = ( (isValid == true) && (typeof actualEditor.form.isValid() != "undefined") && actualEditor.form.isValid() ) ; // check our new valid status AND status of other for fields
                     actualEditor.updateButton(enableUpdate) ;
                   }
                 }
               }
             },
             {
               text: 'Link Code',
               tooltip: "Evidence code/tag for this evidence claim. Only certain codes/tags are valid for a given cell; the list of tags in this drop list are the valids ones.<br><span class='gb-tip-footnote'>(Click arrow on the right to sort via this column.)</span>",
               dataIndex: 'linkcode',
               flex: 1,
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
                 var grid = innerGrid;
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
              
                  var actualEditor = linksrowEditing.editor ;
                  var enableUpdate = ( (isValid == true) && (typeof actualEditor.form.isValid() != "undefined") && actualEditor.form.isValid() ) ;
                  actualEditor.updateButton(enableUpdate) ;
                }
               }
              }
            },
            {
              text: 'Comment',
              tooltip: "Summary or comments associated with this evidence claim. Used to describe/summarize why this Evidence tag was added.<br><span class='gb-tip-footnote'>(Click arrow on the right to sort via this column.)</span>",
              dataIndex: 'comment',
              flex: 2,
              sortable: true,
              editor: {
                xtype: 'textfield',
                regex: /^((?!")(?!').)*$/,
                regexText: "Cannot have single or double quotes . . .<br>",
                allowBlank: true,
                emptyText: "Provide optional summary/comment text..."
              },
               renderer: function(value, metadata) {
                metadata.style = 'white-space: normal;';
               return value;
             }
           }
           ],
            listeners: {
            'selectionchange': function(view, records) {
               innerGrid.down('#deleteLink').setDisabled(!records.length);
               //innerGrid.down('#saveLinks').setDisabled(!records.length && record.data.tagPresent == false);
               for(var ii=0; ii<records.length; ii++)
               {
                 innerGrid.selRowIdx = records[ii].index ;
               }
            }
          }
        });
        innerGrid.getEl().swallowEvent(['mousedown', 'click', 'dblclick', 'onRowFocus']) ;

    },
    onCollapseNestedGrid: function (rowNode, record, expandRow, eOpts) {
      var detailData = Ext.DomQuery.select("div.linksData", expandRow);
        var parent = detailData[0];
        var child = parent.firstChild;

        while (child) {
            child.parentNode.removeChild(child);
            child = child.nextSibling;
        }

    },
     flex:1,
     autoScroll: true
  });

 var tagDefinitions = Ext.create('tagAndLinksGrid') ;
 var win = Ext.create('widget.window', {
    closable: true,
    width: 700,
    height: 400,
    padding: "0px 0px 0px 0px",
    id: 'tagLinkWindow',
    layout: 'border',
    title: '<div class="tagLinksWindow">Edit Evidence Tags for : <i>' +pname + '</i></div>',
    tip: "<b>Edit Evidence Tags</b><ul class='gb-tip'><li>Use the checkboxes to turn on or off the tag for a given variant and condition</li><li>Double click on the summary to edit default summary (From ACMG guidelines)</li><li>Click on [Save Edit] button on the top-left to save the edited tags</li><li>Use &quot;+&quot; before the tag after turning on the tag to manage links</li></ul>",

    listeners: {
          afterrender: function(cmp, listeners) {
            Ext.tip.QuickTipManager.register({ target : cmp.header.id, text: cmp.tip, dismissDelay: 15000, width: 350 })
          }
      },
    items: [tagDefinitions]
  });
  win.show() ;
  // hide the +/- column
  //Ext.getCmp('tagAndLinks').getView().getHeaderAtIndex(1).hide() ;
}

function closeAllWindows()
{
  var allWindows = []
  var tagLinkWindows = Ext.ComponentQuery.query('window[id="tagLinkWindow"]') ;
  var cellWindows = Ext.ComponentQuery.query('window[id="cellWindow"]')
  var linkWindows = Ext.ComponentQuery.query('window[id="linkWindow"]')
  allWindows.push(tagLinkWindows);
  allWindows.push(cellWindows);
  allWindows.push(linkWindows);
  for(ii=0; ii< allWindows.length; ii++)
  {
     if(allWindows[ii].length) {allWindows[ii][0].destroy() ;}
  }
}


function getLinkDataFromSubs(subjectsData, tagOfInterest, tagPresent)
{
  
  var linkstore = [] ;
  var link ;
  var linkcode;
  var linkComment ;
  if(tagPresent) {
    if(tagOfInterest in subjectsData && 'Tag' in subjectsData[tagOfInterest] && 'properties' in subjectsData[tagOfInterest]['Tag'] && 'Links' in subjectsData[tagOfInterest]['Tag']['properties'] && 'items' in subjectsData[tagOfInterest]['Tag']['properties']['Links'] && subjectsData[tagOfInterest]['Tag']['properties']['Links']['items'].length > 0)
    {
      var linkItems = subjectsData[tagOfInterest]['Tag']['properties']['Links']['items'] ;
      for(var ii=0; ii<linkItems.length; ii++)
      {
        if('Link' in linkItems[ii]) { link = linkItems[ii]['Link']['value'] ;}
        else{link = null ;}
        if('properties' in linkItems[ii]['Link'] && 'Link Code' in linkItems[ii]['Link']['properties']) {linkcode = linkItems[ii]['Link']['properties']['Link Code']['value'] ;}
        else {linkcode = null ; }
        if('properties' in linkItems[ii]['Link'] && 'Comment' in linkItems[ii]['Link']['properties']) {linkComment = linkItems[ii]['Link']['properties']['Comment']['value'] ;}
        else {linkComment = null ;}
        linkstore.push([link, linkcode, linkComment]) ;
      }  
    }
  }
  return linkstore ;

}


function updateTagExclusionStatus()
{
  var maingrid = Ext.getCmp('tagAndLinks') ;
  var store = maingrid.store ;
  var tagexcls;
  tagExclusionsOfInterest = new Object() ; 
  store.each(function(rec){
    var cellObj = document.getElementById('tagcode'+rec.data.tag) ;
    tagexcls = bkgetTagExclusionCls(rec.data.tag) ;
    if((!(tagexcls)) || rec.data.tagPresent) { tagexcls = 'tagcode' ;}
    cellObj.classList.remove(cellObj.classList[0]) ;
    cellObj.classList.add(tagexcls) ;
    
  });   

}
