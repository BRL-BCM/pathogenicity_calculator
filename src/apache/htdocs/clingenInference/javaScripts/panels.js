// make the three panels
function makeBigGrid()
{
  // global
  var safeStr = new Object() ;
  // store for the allele grid
  var alleleStore = new Ext.data.SimpleStore(
    {
      fields:
      [
        { name : 'property' },
        { name : 'value' }
      ]
    }) ;




  // Define the grid for the Allele Registry information
  // using rowexpander as plugin for ca-sa grouping  
  
  Ext.define('allGrid', {
      extend: 'Ext.grid.GridPanel',
      id: 'alleleGrid',
      title: "Allele Information",
      tip: "Selected information about this allele from the ALLELE REGISTRY doc, presented as Property-Value pairs.",
      listeners:
      {
        afterrender: function(cmp, listeners) {
          Ext.tip.QuickTipManager.register({ target : cmp.header.id, title: cmp.title, text: cmp.tip, dismissDelay: 6000, width: 250 })
        }
      },
      border : true,
      height: 200,
      width: 920,
      margin: "0 0 15px 0",
      collapsible: true,
      collapsed: false,
      useArrows: true,
      autoScroll: true,
      disableSelection: true,
      store: alleleStore,
      hideHeaders: true,
      plugins: [{
        ptype: 'rowexpander',
        rowBodyTpl: [
                '<div class="groupedSAData">',
                '</div>'
            ]
      }],
      columns:
      [
        {
          id: 'property',
          text: 'Property',
          tip: "Name of property from the ALLELE REGISTRY doc.<br><span class='gb-tip-footnote'>(Click arrow on right to sort this column.)</span>",
          listeners: {
            afterrender: function(cmp, listeners) {
              Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip, dismissDelay: 6000, width: 300 })
            }
          },
          dataIndex: 'property',
          width: 350,
          sortable: true,
        },
        {
          id: 'value',
          text: 'Value',
          tip: "The value of the property from the ALLELE REGISTRY doc.<br><span class='gb-tip-footnote'>(Click arrow on the right to sort this column.)</span>",
          listeners: {
            afterrender: function(cmp, listeners) {
              Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip, dismissDelay: 6000, width: 250 })
            }
          },
          dataIndex: 'value',
          width: 500,
          sortable: true
        }
      ],
      viewConfig : {
        forceFit: true,
        stripeRows: true,
        enableTextSelection: true
      },
       initComponent: function () {
        var me = this;

        this.callParent(arguments);

        me.getView().on('expandBody', me.onExpandNestedGrid,me);
        me.getView().on('collapsebody', me.onCollapseNestedGrid,me);
    },
    onExpandNestedGrid : function (rowNode, record, expandRow, eOpts) {
      var groupedData = Ext.DomQuery.select("div.groupedSAData", expandRow);
      Ext.define('sagroupedModel', {
            extend: 'Ext.data.Model',
            fields: [
                { name: 'prop'},
                { name: 'val'}
            ]
        });


     var insideGridStore = Ext.create('Ext.data.ArrayStore', {
            model: 'sagroupedModel',
            data: []
        });

    var innerGrid = Ext.create('Ext.grid.Panel', {
            store: insideGridStore,
            id: 'insideGrid',
            cls: 'inside',
            columns: [
                { text: "Property", width:350, dataIndex: 'prop'},
                { text: "Value", width: 550, dataIndex: 'val'}
            ],
            columnLines: false,
            autoWidth: true,
            autoHeight: true,
            frame: false,
            iconCls: 'icon-grid',
            renderTo: groupedData[0],
            preventHeader: true

        });
        innerGrid.getEl().swallowEvent([
                    'dblclick'
                ]);
      var simallele = record.get('value') ;
      var proper = record.get('property') ;
      // first record is canonical allele. 
      var recordIndex = alleleStore.find('value', simallele) ;
      if(recordIndex == -1) // value is null for gene info row
      {
        // if gene info not already there do the length ajax
        if(Object.keys(geneInfo).length == 0)
        {
         loadgeneStore = true ;
         getGene() ; 
        }
        else
        {
          var gstore = [] ;
          for(var gkey in geneInfo)
          {
             if(gkey != '[No value]')
             {
               gstore.push(['<b>Symbol</b>', '<a href="http://www.genenames.org/cgi-bin/gene_symbol_report?match='+gkey+'" target="_blank">'+gkey+'</a>']);
             }
             else
             {
              gstore.push(['<b>Symbol</b>', gkey])
             }
             gstore.push(['<b>Subject</b>', '<a href="'+geneInfo[gkey].Subject+'" target="_blank">'+geneInfo[gkey].Subject+'</a>']);
             gstore.push(['<b>Gene Name</b>', geneInfo[gkey].name]);
          }
          var insidStore = Ext.getCmp('insideGrid').store ;
          insidStore.loadData(gstore) ;

        }
      }
      else if(recordIndex == 1)
      {
        var canstore = [] ;
        canstore.push(['<b>Subject</b>', '<a href="'+caSub+'" target="_blank">'+caSub+'</a>']) ;
        canstore.push(['<b>Allele Type</b>', caalleletype]) ;
        var insidStore = Ext.getCmp('insideGrid').store ;
        insidStore.loadData(canstore) ;

      }
      else
      {
        getSimpleAlleFullDoc(simallele) ;
      }
    },
    onCollapseNestedGrid : function (rowNode, record, expandRow, eOpts) {

      var groupedData = Ext.DomQuery.select("div.groupedSAData", expandRow);
        var parent = groupedData[0];
        var child = parent.firstChild;

        while (child) {
            child.parentNode.removeChild(child);
            child = child.nextSibling;
        }
    }
    }) ;


   var alleleGrid = Ext.create('allGrid') ;



  // store for the reasoner grid
  var reasonerStore = new Ext.data.SimpleStore(
    {
      fields:
      [
        { name : 'conclusion' },
        { name : 'rulesNeeded' },
        { name : 'ruleStatement' },
        { name : 'ruleHighlight' },
        { name : 'type'}
      ],
      groupField: 'type'
    }) ;

  var tagMenu = new Ext.menu.Menu({
      id: 'tagMenu',
      items: [
          {
            text: 'Copy/Replace',
            id: 'copyTgs',
            iconCls: "gvcopyTags",
            tooltip: "Copy evidence tags from an active tab to a user chosen tab. Using this option would <i>replace</i> the tags with the new tags.",
            handler: showCopyTagWindow
          }
      ]
    });

  var reaBar = new Ext.Toolbar({
    cls: 'gvToolBar',
    ui: 'overrideDefault', // Doesn't actually exist. But "default" (the default here) does silly IE things. This is a dummy UI config for the toolbar.
    items:[
    {
      text:'Apply Guidelines',
      id: "gvRefreshButton",
      tip: "[Re-]Apply the Guidelines to the stored Evidence doc.<br>&nbsp;<br>Useful if the doc has been updated outside of this interface, or to just verify these are the latest conclusions that can be made.",
      iconCls: 'gvRefresh',
      handler: function(){
          var activeGrid = Ext.getCmp('multitab').getActiveTab().title ;
          // run the reasoner directly  instead of using the cache
          if(grids[activeGrid].guideline){runReasonerGrid(activeGrid) ;} 
          viewGrid('html', activeGrid);
      },
      listeners: {
        afterrender: function(cmp, listeners) {
          Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip, dismissDelay: 10000, width: 350 })
        }
      }
    },
    {
      text: 'View Evidence Doc',
      id: "gvEvDoc",
      tip: "View the entire Evidence document in the GenboreeKB UI.<br><span class='gb-tip-footnote'>(Opens in a new browser tab.)</span>",
      iconCls: 'gvEvDoc',
      handler: function() {
        var activeGrid = Ext.getCmp('multitab').getActiveTab().title ;

        var evUrl = grids[activeGrid].evidence ;
        var eviDoc = evUrl.split("/").pop() ;
        var redmineUrl = grids[activeGrid].redminePr ;
        // redmine project is optional and if missing show error
        if(redmineUrl)
        {
          if(eviDoc) {redmineUrl =  redmineUrl+ "&doc="+eviDoc+"&docVersion=" ;}
          window.open(redmineUrl, '_blank');
        }
        else
        {
          Ext.msg.alert("ERROR", 'Cannot view evidence document in the Genboree KB UI as no <i>redmine project</i> property is configured for this tab, '+ activeGrid);
        }

      },
      listeners: {
        afterrender: function(cmp, listeners) {
          Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip, dismissDelay: 6000, width: 250 })
        }
      }
    },
    {
      text: 'Create New Evidence Doc',
      id: 'newEvDoc',
      tip: "Create a new Evidence document by answering a few questions.<br><br> This feature is disabled for a Public page.",
      iconCls: 'gvEvDoc',
      handler: function() {
        var activeGrid = Ext.getCmp('multitab').getActiveTab().title ;
        var questUrl = grids[activeGrid].questionnaire ;
        createNewEvidence(questUrl, caSub) ;
      },
      listeners: {
        afterrender: function(cmp, listeners) {
          Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip, dismissDelay: 6000, width: 250 })
        }
      }
    },
    
    {

      text:'Copy Tags',
      tooltip: 'Copy Tags across grids. This feature is disabled on a Public Page.',
      menu: tagMenu,
      disabled : !(isPublic != true && isPublic != 'true')
    }
    ]
  });

  var grouping = Ext.create('Ext.grid.feature.Grouping',{
    startCollapsed: false,
    //groupHeaderTpl: '{name} Conditions ({rows.length} Item{[values.rows.length > 1 ? "s" : ""]})'
    groupHeaderTpl: [
            '<div>{name:this.formatName}</div>',
               {
                formatName: function(name) {
                       if(name == "UnMet"){var ne = "Assertion(s) Requiring Additional Evidence" ;}
                       else{var ne = "Assertion(s) Reached" ;}
                       return ne;
                   }
                }
      ]

  });
  var reasonerGrid = new Ext.grid.GridPanel(
    {
      finalClaim: null,
      finalText: null,
      id: 'reasonerGrid',
      title : 'Guidelines - Conclusions',
      tip: "Summarizes the results of applying the Guidelines to the current version of the Evidence doc.<ul class='gb-tip'><li>Guideline rules which are met will be <span class='gb-text-ruleHilite'>highlighted</span>.</li><li>UNmet guideline rules will indicate the minimum amount of additional evidence needed to satisfy.</li><li>If <i>no</i> rules are met, the conclusion is uncertain.</li></ul>",
      listeners: {
          afterrender: function(cmp, listeners) {
            Ext.tip.QuickTipManager.register({ target : cmp.header.id, title: cmp.title, text: cmp.tip, dismissDelay: 15000, width: 350 })
          }
      },
      height: 300,
      width: 890,
      margin: "0 0 15px 0",
      collapsible: true,
      collapsed: false,
      useArrows: true,
      autoScroll: true,
      //tbar: reaBar,
      features: [grouping],
      store: reasonerStore,
      columns:
      [
        {
          id: 'conclusion',
          text: 'Conclusion',
          tip: "Conclusion indicated by the Guidelines <i>if at least one rule</i> for that conclusion is met.<br><span class='gb-tip-footnote'>(Click arrow on the right to sort this column.)</span>",
          listeners: {
            afterrender: function(cmp, listeners) {
              Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip, dismissDelay: 10000, width: 250 })
            }
          },
          dataIndex: 'conclusion',
          
          renderer: function(value, meta, rec, rowIndex, colIndex, store)
          {
            if(value == reasonerGrid.finalClaim)
            {
              meta.tdAttr = 'data-qwidth="300" data-qtip="<b>'+value+'</b><br><br>'+reasonerGrid.finalText+'"' ;
             //rec.set('conclusion', '<span class="gb-final-claim">'+value+'</span>') ;
              //rec.commit() ;
             return '<span class="gb-final-claim">'+value+'</span>' ;
            }
           else {return value ; }
         },

          width: 310,
          sortable: true,
          tdCls: 'x-change-cell gb-cell-conclusion'
        },
        {
          id: 'rulesNeeded',
          text: 'Conditions',
          tip: "Minimum number of additional conditions needing to be satisfied in order to reach the conclusion to the left.<br>&nbsp;<br>Note that there may be <u>many</u> rules for this conclusions&mdash;ones needing a larger number of satsified conditions are not shown.<br>&nbsp;<br> &quot;<span class='gb-cond-unmet'>*</span>&quot; indicates <i>too much evidence</i> and <i>unmet</i> conditions are present to correctly satisfy the conditions of the rule.<br>&nbsp;<br> &quot;<span class='gb-cond-over-met'>0<sup>+</sup></span>&quot; indicates too much evidence is present and only partial evidence is used to correctly satisfy the rule.<br>&nbsp;<br><span class='gb-tip-footnote'>(Click arrow on the right to sort this column.)</span>",
          listeners: {
            afterrender: function(cmp, listeners) {
              Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip, dismissDelay: 10000, width: 350 })
            }
          },
          dataIndex: 'rulesNeeded',
          renderer: function(value, meta, rec, rowIndex, colIndex, store)
          {
            var cellvalue = rec.get('rulesNeeded');
            var cString = cellvalue.toString();
            if(value == 0)
            {
              meta.tdAttr = 'data-qwidth="300" data-qtip="&quot;0&quot; indicates <i> exact evidence</i> is present to correctly satisfy the rule"' ;
              return '<span class="gb-cond-met">0</span>'
            }
            else if(cString.match(/^[0-9]+\.[0-9]+$/) && value > 1)
            {
             meta.tdAttr = 'data-qwidth="300" data-qtip="&quot;*&quot; indicates <i>too much evidence</i> and <i>unmet</i> conditions are present to correctly satisfy the rule"' ;
             return '<span class="gb-cond-over-unmet">*</span>' ;
            }
           else if(cString.match(/^[0-9]+\.[0-9]+$/))
           {
             meta.tdAttr = 'data-qwidth="300" data-qtip="&quot;0<sup>+</sup>&quot; indicates too much evidence is present and only partial evidence is used to correctly satisfy the rule"' ;
             return '<span class="gb-cond-met">0<sup>+</sup></span>' ;
           }
           else
           {
             meta.tdAttr = 'data-qwidth="300" data-qtip= "&quot;'+value+'&quot; indicates the rule needs '+value+' <i>more evidence</i> to be satisfied"' ;
             return '<span class="gb-cond-unmet">'+value+'</span>' ;
           }
         },
         align: 'center',
         width: 110,
         sortable: false,
         tdCls: 'x-change-cell'
        },
        {
          id: 'ruleStatement',
          text: 'Rules',
          tip: "To reach the conclusion on the left, <i>at least one of its rules</i> must be met. Conclusions can have <u>many</u> rules.<br>&nbsp;<br>Listed here (1 per line) are all the rules having the <i>minimum number of unmet conditions</i>.<br><span class='gb-tip-footnote'>(Click arrow on the right to sort this column.)</span>",
          listeners: {
            afterrender: function(cmp, listeners) {
              Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.text, text: cmp.tip, dismissDelay: 10000, width: 350 })
            }
          },
          dataIndex: 'ruleStatement',
          width: 420,
          sortable: true,
          tdCls: 'x-change-cell'
        },
        {
          id: 'ruleHighlight',
          text: '<img class="highlightColHeader" src="/images/silk/calendar_add.png"></img>',
          tipTitle: "Highlight Examined Cells",
          tip: "Click the icon to highlight cells in the Pathogenicity Evidence table which can be used to satisfy the conditions of the rule.<br><span class='gb-tip-footnote'>(Click arrow on the right to sort this column.)</span>",
          listeners: {
            afterrender: function(cmp, listeners) {
              Ext.tip.QuickTipManager.register({ target : cmp.id, title: cmp.tipTitle, text: cmp.tip, dismissDelay: 10000, width: 250 })
            }
          },
          dataIndex: 'ruleHighlight',
          width: 40,
          sortable: false,
          resizable: false,
          align: "center",
          tdCls: 'x-change-cell gb-icon-col'
        }
      ],
      disableSelection: true,
      viewConfig: {
        forceFit: true,
        overItemCls: '',
        getRowClass: function(record, index) {
          var c = record.get('rulesNeeded');
          var retVal = '' ;
            if(reasonerGrid.finalClaim != null)
            {
              var conclusion = record.get('conclusion') ;
              if((conclusion != "Insufficient Metarules") && (reasonerGrid.finalClaim == conclusion))
              {
                retVal = 'rulesZero' ;
              }
            }
          return retVal ;
        },
        stripeRows : false,
        enableTextSelection: true
      }
    }) ;

  // panel for the transformed table
  var transformedTable = new Ext.panel.Panel(
  {
    id: 'htmltable',
    height: 420,
    //autoHeight: true,
    width: 890,
    html: '',
    border: false,
    title: 'Pathogenicity Evidence',
    tip: "Table summarizing the category, strength, and <span class='gb-text-nowrap'>pathogencity-vs-benign</span> Evidence.<ul class='gb-tip'><li><span class='gb-text-invalid'>Grayed cells</span> indicate invalid combinations where evidence <i>should not</i> appear.</li><li>Clicking a white (valid) cell will pop up a dialog showing the evidence tags falling within (if any).</li><li>In the pop-up dialog, you can add or remove tags, and then save the updates to the underlying Evidence doc.</li></ul>",
    listeners: {
      afterrender: function(cmp, listeners) {
        Ext.tip.QuickTipManager.register({ target : cmp.header.id, title: cmp.title, text: cmp.tip, dismissDelay: 15000, width: 350 })
      }
    },
    collapsible: true,
  });

   //fields are dynamically generated . see panels.js addTabs()
   var summaryStore = new Ext.data.SimpleStore(

    {
      id: 'sstore',
      fields:[]
    }
   ) ;
  // columns are dynamically generated see panel.js addTabs()
  var summaryGrid = new Ext.grid.GridPanel(
    {
      id: 'summaryGrid',
      title: "Evidence Summary & Display",
      border : true,
      height: 125,
      cls: 'summaryheader',
      width: 920,
      margin: "0 0 15px 0",
      collapsible: true,
      collapsed: false,
      useArrows: true,
      autoScroll: true,
      disableSelection: true,
      store: summaryStore,
      columns:[],
      viewConfig : {
        forceFit: true
      }
     }) ;


  var tabs = Ext.create('Ext.tab.Panel', {
    width: 919,
    layout: 'vbox',
    id: 'multitab',
    cls: 'multitabgrid'
  });

  var tabHolder = Ext.create('Ext.panel.Panel', {
    header : false,
    id:'tabholder',
    layout: 'vbox',
    cls: 'infPanel',
    //height: 1000,
    width: 920,
    plain: true,
    border: false,
    tbar: reaBar,
    items:[tabs]
  });
  
  Ext.create('Ext.panel.Panel', {
    header : false,
    layout: 'vbox',
    id: 'fullcalc',
    cls: 'infPanel',
    width: 1000,
    plain: true,
    border: false,
    renderTo: 'panel',
    items:[alleleGrid, summaryGrid, tabHolder]
  });

  // First fill the allele grid with the data from the allele document
  getallsimpleAlleles(false) ; 
}

// get the allele data from the Ajax response
function getAlleleData(result, request)
{

  var noDataStr = "[No Data]" ;
  var resObj  = JSON.parse(result.responseText) ;
  var alleleDoc = resObj['data'];
  var statusObj = resObj['status']
  if(result.status >= 200 && result.status < 400 && alleleDoc)
  {
      var retVal = [] ;
      alleleGrid = [] ;
      // for the first panel add the canonical allee information
      retVal.push(['<span class="catext">Gene</span>', null]) ;
      retVal.push(['<span class="catext">Canonical Allele ID</span>', '<span class="catext">'+ca+'</span>']) ;
      for(var ii=0; ii<alleleDoc.length; ii++)
      { 
        var id = alleleDoc[ii].SimpleAllele.value ;
        // object for the sa groups. A global var
        retVal.push(['<b>Simple Allele ID</b>', id]) ;

        if(makesaGridForEntryGrid)
        {

          var sub = alleleDoc[ii].SimpleAllele.properties.Subject.value ;
          if(('properties' in alleleDoc[ii].SimpleAllele.properties.Subject) && ('alleleNames' in alleleDoc[ii].SimpleAllele.properties.Subject.properties) && (alleleDoc[ii].SimpleAllele.properties.Subject.properties.alleleNames.items.length > 0))
          {
            var hgv = alleleDoc[ii].SimpleAllele.properties.Subject.properties.alleleNames.items[0].alleleName.value ;
          }
          else { var hgv = noDataStr ; }

          if('simpleAlleleType' in alleleDoc[ii].SimpleAllele.properties.Subject.properties){
            var saType = alleleDoc[ii].SimpleAllele.properties.Subject.properties.simpleAlleleType.value ;
          }
          else
          {
          }

          if('allele' in alleleDoc[ii].SimpleAllele.properties.Subject.properties){
          var allele = alleleDoc[ii].SimpleAllele.properties.Subject.properties.allele.value ;
          }
          else
          {
          }
          if('primaryNucleotideChangeType' in alleleDoc[ii].SimpleAllele.properties.Subject.properties){
          var nuc = alleleDoc[ii].SimpleAllele.properties.Subject.properties.primaryNucleotideChangeType.value ;
          }
          else
          {
          }
          if('referenceCoordinate' in alleleDoc[ii].SimpleAllele.properties.Subject.properties && 'start' in alleleDoc[ii].SimpleAllele.properties.Subject.properties.referenceCoordinate.properties){
            var start = alleleDoc[ii].SimpleAllele.properties.Subject.properties.referenceCoordinate.properties.start.value;
          }
          else
          {
            var start = noDataStr ;
          }

          if('referenceCoordinate' in alleleDoc[ii].SimpleAllele.properties.Subject.properties && 'end' in alleleDoc[ii].SimpleAllele.properties.Subject.properties.referenceCoordinate.properties){
            var stop = alleleDoc[ii].SimpleAllele.properties.Subject.properties.referenceCoordinate.properties.end.value;
          }
          else
         { 
           var stop = noDataStr ;
         }
         var position = start + ':' + stop ;

         if('referenceCoordinate' in alleleDoc[ii].SimpleAllele.properties.Subject.properties && 'referenceSequence' in alleleDoc[ii].SimpleAllele.properties.Subject.properties.referenceCoordinate.properties){
          var refSeq = alleleDoc[ii].SimpleAllele.properties.Subject.properties.referenceCoordinate.properties.referenceSequence.value;
        }
        else
        {
          var refSeq = noDataStr ;
        }
      
        alleleGrid.push([id, refSeq, hgv, start, stop, allele, nuc, saType]) ;
      }
     }
      if(makesaGridForEntryGrid)
      {
       var insaStor = Ext.getCmp('sainsideGrid').store ;
       insaStor.loadData(alleleGrid) ;
      }

      else
      {
        var allStor = Ext.getCmp('alleleGrid').store ;
        allStor.loadData(retVal) ;
      }
    
   }
  else
  {
    displayFailureDialog(result, request) ;
  }
}

// Heuristic to group the assertions fill the reasoner grid
// It groups the assertions and as it groups it retains the least distance for each group
// Least distance is retained by calculating the condition distance and then the rule distance
function getReasonerTable(rules, finalCall)
{
  var ruleTable = new Object() ;
  var claimTable = new Object() ;
  var reaGrid = Ext.getCmp('reasonerGrid') ;
  var finalClaim = finalCall.value ;
  reaGrid.finalClaim = finalClaim ;
  var finalClaimText = finalCall.properties.Text.value ;
  reaGrid.finalText = finalClaimText ;
  var totalDistance ;
  for(var ii = 0; ii < rules.length; ii++)
  {
    var ruleName = rules[ii]['Rule']['value'] ;
    var tmpHash = new Object() ;
    var conditions = [] ;
    var ruleReturns = [] ;
    var assertion = rules[ii]['Rule']['properties']['Assertion']['value'] ;
    var satisfied = rules[ii]['Rule']['properties']['Satisfied']['value'] ;
    var ruleStatement = rules[ii]['Rule']['properties']['RuleStatement']['value'] ;
    conditions = rules[ii]['Rule']['properties']['Conditions']['items'] ;
    ruleReturns = getRuleDistance(conditions);
    if(assertion in ruleTable)// if the assertion is already grouped
    {
      if(satisfied == 'true' || satisfied == true) // <----- XXXXXXXXXXX satisfied is true/false not 'true' / 'false' ???
      {
        // remove the current entries if the distance is not 0 (not satisfied, presumably)
        if(ruleTable[assertion]['distance'] != 0)
        {
          for(var jj = 0; jj < ruleTable[assertion]['rules'].length; jj++)
          {
            var ru = ruleTable[assertion]['rules'][jj] ;
            delete ruleTable[assertion][ru] ;
          }
          // Now add our satisfied entry (0 distance presumably)
          ruleTable[assertion]['rules'] = [ruleStatement] ;
          ruleTable[assertion]['distance'] = 0 ;
          tmpHash = ruleReturns[1] ;
          ruleTable[assertion][ruleStatement] = tmpHash ;
       }
       else // add it to the existing assertion object
       {
         ruleTable[assertion]['distance'] = 0 ;
         ruleTable[assertion]['rules'].push(ruleStatement) ;
         tmpHash = ruleReturns[1] ;
         ruleTable[assertion][ruleStatement] = tmpHash ;
       }
      }
      else // not satisfied, need to retain the least distance
      {
        totalDistance = ruleReturns[0] ;
        tmpHash = ruleReturns[1] ;
        if(totalDistance == ruleTable[assertion]['distance'])
        {
          ruleTable[assertion]['rules'].push(ruleStatement) ;
          ruleTable[assertion][ruleStatement] = tmpHash ;
        }
        else if(totalDistance < ruleTable[assertion]['distance'] && totalDistance >= 0)
        {
          for(var jj = 0; jj < ruleTable[assertion]['rules'].length; jj++)
          {
            delete ruleTable[assertion][ruleTable[assertion]['rules'][jj]] ;
          }
          ruleTable[assertion]['rules'] = [ruleStatement] ;
          ruleTable[assertion]['distance'] = totalDistance ;
          ruleTable[assertion][ruleStatement] = tmpHash ;
        }
        else
        {}
      }
    }
    else // first time entry of the assertion object
    {
      ruleTable[assertion] = {}
      totalDistance = ruleReturns[0] ;
      tmpHash = ruleReturns[1] ;
      ruleTable[assertion]['rules'] = [ruleStatement] ;
      ruleTable[assertion]['distance'] = totalDistance ;
      ruleTable[assertion][ruleStatement] = tmpHash;
    }
    // Claim table update
    if(assertion in claimTable)
    {
      if(satisfied == 'true' || satisfied == true) // <----- XXXXXXXXXXX satisfied is true/false not 'true' / 'false' ???
      {
        claimTable[assertion] = true ;
      }
    }
    else
    {
      claimTable[assertion] = ( (satisfied == 'true' || satisfied == true) ? true : false) ;
    }
  }


  var reaRetVal = [] ;


  // Once the assertions are grouped add the data to the reasoner store
  var ruleDistance ;
  //var clickArg ;
  var keysSorted = Object.keys(ruleTable).sort(function(a,b) {
    var retVal = ruleTable[a]['distance'] - ruleTable[b]['distance'] ;
    if(retVal == 0) // resolve ties via the assertion names to get nice sorting
    {
      if(a == finalClaim) // push final claim to top to resolve tie
      {
        retVal = -1 ;
      }
      else if(b == finalClaim) // push final claim to top to resolve tie
      {
        retVal = 1 ;
      }
      else // not finalClaim, resolve using conclusion NAME (alphabetical and then ASCII)
      {
        var ua = a.toUpperCase() ;
        var ub = b.toUpperCase() ;
        retVal = ( (ua < ub ? -1 : (ua > ub ? 1 : 0)) ) ;
        if(retVal == 0) // did alphabet compare, still tied. Use case to resolve.
        {
          retVal = ( (a < b ? -1 : (a > b ? 1 : 0)) ) ;
        }
      }
    }
    return retVal ;
  }) ;

   // If final claim not one of the assertions, just put the claim on the first
   // row of the table
   
   if(!(finalClaim in ruleTable)){
     reaRetVal.push([finalClaim, 0, "", "", 'Met'])
   }

  for(var ii=0; ii <  keysSorted.length; ii++)
  {
    var ruleStatements = '' ;
    var ruleIcons = ''
    var type = 'UnMet' ;
    var key = assertion = keysSorted[ii] ;
    for(var ru=0; ru<ruleTable[key]['rules'].length; ru++)
    {
      ruleStatements = ruleStatements + ruleTable[key]['rules'][ru] ;
      ruleDistance = ruleTable[key]['distance'] ;
      clickArg = ruleTable[key][ruleTable[key]['rules'][ru]] ;
      path = "";
      count = ""
      for(var ke in clickArg)
      {
        if(clickArg.hasOwnProperty(ke))
        {
          path = path + ke + ',' ;
          count = count + clickArg[ke] + ',' ;
        }
      }
      // Do not know how to pass an object to onclick!!!
      //clickStr = JSON.stringify(clickArg) ;
      // alert(clickStr);
      //"viewGrid(\'html\', \'' + docName + '\', false )"
      var imageElId = key+ru;
      ruleStatements = ruleStatements // MOVED TO OWN COLUMN: + '<a id="'+imageElId+'" class="showHigh"  href="#" onclick="highLightCells(\'' +imageElId+'\',\'' +path+'\' ,\''+ count +'\')"></a>' ;
      ruleStatements = ruleStatements + '<br>' ;
      ruleIcons += '<span id="'+imageElId+'" class="showHigh"  href="#" onclick="highLightCells(\'' +imageElId+'\',\'' +path+'\' ,\''+ count +'\')">&nbsp;</span></br>'
    }
    if(ruleDistance == 0) {type = 'Met' ;}
    else if((ruleDistance > 0) && (ruleDistance < 1)){type = 'Met' ;}
    else {type = 'UnMet';}
    reaRetVal.push([key, ruleDistance, ruleStatements, ruleIcons, type ]) ;
  }
  // load the reasoner store
  var reaStor = Ext.getCmp('reasonerGrid').store ;
  reaStor.loadData(reaRetVal) ;
  return true
}

// highlight or disable the highlighted cells based on the image class on the rule statement column
function highLightCells(imageId, path, count)
{
  
  var elID;
  var obj;
  var extObj;
  var inner;
  var pathCount;
  var showCls = "showHigh";
  var hideCls = "hideHigh";
  var paths = path.split(",");
  var counts = count.split(",");
  // First find whether the paths are already for a satisfied rule statement
  // It has to highlight the respective cells with values in it
  // Different from the unsatisfied - shows the unpopulated cell
  var totalCount = 0;
  for(var ii=0; ii<(counts.length-1); ii++){totalCount = totalCount + parseInt(counts[ii]) ;}

  // Get evidences from the allowed tags rather than hardcoding. Values differ among grids
  var partitions = makeEmptyTable(tags, null, null, true)
  var evidences = partitions[2] ;
  var objCls = document.getElementById(imageId).className ;
  var cindex = 0;
  // Before anything, remove ALL highlighting
  var highlightedTdElems = Ext.DomQuery.select("td.highlighted") ;
  for(var ii=0; ii<highlightedTdElems.length; ii++)
  {
    extObj = Ext.get(highlightedTdElems[ii]) ;
    extObj.removeCls("highlighted") ;
    extObj.setStyle("background", "") ;
  }
  // Also reset all the icons back to default
  var iconsToReset = Ext.DomQuery.select("span.hideHigh") ;
  for(var ii=0; ii<iconsToReset.length; ii++)
  {
    extObj = Ext.get(iconsToReset[ii]) ;
    extObj.removeCls("hideHigh") ;
    extObj.addCls("showHigh") ;
  }

  if(objCls == showCls) //change it to hideCls once highlighted
  {
    for(var pp=0; pp<(paths.length-1); pp++)
    {
      pathCount = parseInt(counts[pp]) ;
      cindex = 0;
      for(var jj=0; jj<evidences.length; jj++)
      {
        elID = paths[pp]+'.'+evidences[jj] ;
        elID = elID.replace(/\s+/g, '');
        obj = document.getElementById(elID) ;
        if(obj)
        {
          extObj = Ext.get(obj) ;
          //skip highlighting if the cell is invalid
          if(obj.className == "invalid")
          {
            continue ;
          }
          else
          {
            if(elID in parColor)
            {
              if(obj.classList.contains( 'gb-dataCell-pathogenic')){obj.classList.remove('gb-dataCell-pathogenic') ; obj.classList.add("gb-dataCell-pathogenic-highlighted") ;}
              else if(obj.classList.contains('gb-dataCell-benign')){obj.classList.remove('gb-dataCell-benign') ; obj.classList.add("gb-dataCell-benign-highlighted") ;}
              else{obj.style.backgroundColor = "lightblue";}
            }
            else
            {
              parColor[elID] = obj.style.backgroundColor ;
              if(obj.classList.contains( 'gb-dataCell-pathogenic')){obj.classList.remove('gb-dataCell-pathogenic') ; obj.classList.add("gb-dataCell-pathogenic-highlighted") ;}
              else if(obj.classList.contains('gb-dataCell-benign')){obj.classList.remove('gb-dataCell-benign') ; obj.classList.add("gb-dataCell-benign-highlighted") ;}
              else{obj.style.backgroundColor = "lightblue";}
            }
            extObj.addCls("highlighted") ;
            document.getElementById(imageId).className = hideCls ;
          }

          } 
       else // The rule itself is invalid
        {
          Ext.Msg.alert('INVALID_RULE', "Rule:  '<i>" + paths[pp] + "</i>' is invalid!!." ) ;
          break;
        }
      }
    }
  }
  else if(objCls == hideCls)
  {
    for(var pp=0; pp<paths.length-1; pp++)
    {
      pathCount = parseInt(counts[pp]) ;
      cindex = 0;
      for(var jj=0; jj<evidences.length; jj++)
      {
        elID = paths[pp]+'.'+evidences[jj] ;
        elID = elID.replace(/\s+/g, '');
        obj = document.getElementById(elID) ;
        extObj = Ext.get(obj) ;
        if(obj.className != "invalid")
        {
          if(obj.classList.contains("gb-dataCell-pathogenic-highlighted")){obj.classList.remove("gb-dataCell-pathogenic-highlighted") ;obj.classList.add("gb-dataCell-pathogenic") ;}
          else if(obj.classList.contains("gb-dataCell-benign-highlighted")){obj.classList.remove("gb-dataCell-benign-highlighted") ; obj.classList.add("gb-dataCell-benign") ;}
          else {obj.style.backgroundColor = parColor[elID] ;}
          extObj.removeCls("highlighted") ;
        }
      }
    }
    document.getElementById(imageId).className = showCls;
  }
}

// calculates the rule distance from a set of conditions
function getRuleDistance(conditions)
{
  var pathHash = new Object();
  var condDistance = 0 ;
  var coName ;
  var path ;
  var sat ;
  var observed ;
  var condition ;
  var dis ;
  for(var cc = 0; cc <conditions.length; cc++)
  {
    coName = conditions[cc]['Condition']['value'] ;
    path = conditions[cc]['Condition']['properties']['PartitionPath']['value'] ;
    sat = conditions[cc]['Condition']['properties']['Satisfied']['value'] ;
    observed = conditions[cc]['Condition']['properties']['Observed']['value'] ;
    condition = conditions[cc]['Condition']['properties']['Condition']['value'] ;
    if(sat != 'true')
    {
      dis = getCondDistance(condition, observed) ;
      condDistance = condDistance + dis ;
      pathHash[path] = dis ;
    }
    else {pathHash[path] = 0;}
  }
  return [condDistance, pathHash]
}

// gets the condition distance from a single condition property
function getCondDistance(cond, observed)
{
  var distance ;
  var re = /\d+$/ ;
  var matchNeeded = cond.match(re) ;
  var observed = parseInt(observed) ;
  var needed = parseInt(matchNeeded[0]) ;
  distance = needed - observed ;
  // Negative distance and "=="
  if(distance < 0 && cond.match(/^(==)/))
  {
    distance = 0.1;
  }
  else if(distance < 0 && cond.match(/^(>=)/))
  {
    distance = 0;
  }
  return distance
}


// success function of the API request of the reasoner
function getReasonerData(result, request)
{
  // Cases where the reasoner is run after filling an empty grid the button has to enabled
  var agButton = Ext.getCmp("gvRefreshButton") ;
  agButton.enable() ;
 
  var copyTagsButton = Ext.getCmp('copyTgs') ;
  copyTagsButton.enable() ;

  var resObj  = JSON.parse(result.responseText) ;
  var reasOut = resObj['data'] ;

  // update the reasoner output with the grid and cache
  var gName = result.request.options.params.gridname ;
  grids[gName].reasonerOutput = reasOut ;

  console.log("Reasoner data received for the grid : :" + gName) ;
  grids[gName].conclusion = reasOut['Reasoner output'].properties.FinalCall.value ;
  // update the version for the grid and update both the cache
  // This is done only for private pages.
  if(isPublic == true || isPublic == 'true') {console.log("Not updating the cache. Page is public. Saving not allowed for public pages.")}
  else
  {
    getEviVersion(gName, null, true) ;
  }
   updateSummaryRow() ; 
  var reasDocName = reasOut['Reasoner output'].value ;
  var reasDoc = reasOut['Reasoner output'].properties;
  var reasonerTable = new Object();
  //var statusObj = resObj['status']
  if(result.status >= 200 && result.status && resObj)
  {
   //Input is the list of all the rules
   // reasoner Table - object with conclusion, rules needed and statements to populate
   // the reasoner Grid.
   getReasonerTable(reasDoc.Rules.items, reasDoc.FinalCall) ;
  }
  else
  {
    alert("ERROR", "API failed to get the reasoner output " + result.status + ", " + result.responseText);
  }
}


// this renders the tabs
// based on the global variable grids that is filled by now is
// used here to filter(if no evidence or has no tags tabs are hidden, if showgrids parameter is present)
// this function is called once the last document and the last item in the last document
// is fetched 
function addTabs()
{
  // merge all the grids in the order of source reg
  // evid-guidelines combination with multiple docs are already in the grids var
  // But need to get the order
  var newGrids = [] ;
  var gridsToshow = {};
  var allhidden = false ;
  console.log("Going to add tabs . . .");
  // get the default tab, when all the tabs are inactive.
  var tabcount = 0;


  for(var tabkey in grids)
  {
    if((grids[tabkey].evidence) && (grids[tabkey].hasnotags != true)){}
    else {tabcount++ ;}
  }
  // need a message grid if all the tabs are hidden
  if(tabcount == Object.keys(grids).length) {allhidden = true ;}
  if(showgrids)// filter grids as per the parameter showgrids
  {
    showgrids = showgrids.split(",") ;
    for(var ii=0; ii<showgrids.length; ii++)
    {
      gridsToshow[showgrids[ii]]  = true ;
    }
    // show the ones that are in show grids only and its multiples
    for(var ii=0; ii<gridNames.length; ii++)
    {
      if(gridNames[ii] in gridsToshow) {
        for (var jj=0; jj<gridNamesMap[gridNames[ii]].length ; jj++)
        {
         newGrids.push(gridNamesMap[gridNames[ii]][jj]) ;
         safeStr[gridNamesMap[gridNames[ii]][jj]] = gridNamesMap[gridNames[ii]][jj].replace(/\W/g, '') ;
        }
      }
    }
   
  }
  else
  {
    // all the grids and its multiples
  
    for(var ii=0; ii<gridNames.length; ii++)
    {
      for (var jj=0; jj<gridNamesMap[gridNames[ii]].length ; jj++)
      {
        safeStr[gridNamesMap[gridNames[ii]][jj]] = gridNamesMap[gridNames[ii]][jj].replace(/\W/g, '') ;
        newGrids.push(gridNamesMap[gridNames[ii]][jj]) ;
      }

    }
  }
  console.log(newGrids) ;
  gridNames = [] ;
  gridNames = newGrids ;

  


  tags = new Object();
   // Populate the tab first
   var gridtab = Ext.getCmp('multitab') ;
   var activeyet = false ;
   var evTable = Ext.getCmp('htmltable') ;
   var reasGrid = Ext.getCmp('reasonerGrid') ;
   // grid with no Evidence content
   var hasnoEviGrid = getmessageGrid('noevidence');
   // grid with no tags content message
   var hasnomesGrid = getmessageGrid('hasnotags') ; 

   // grid displayed when all the tabs are inactive by default or in the process
   var allhiddenGrid = getmessageGrid('allhidden');
   // grid with no guideline content
   var noguidesgrid = getmessageGrid('noguide') ;
   // get the first tab content
   var firstTab = gridNames[0] ;
   var firstItems = [] ;
   var firstTab = gridNames[0];

  if((gridNames.length == 0) && (Object.keys(grids).length == 0))
  {
    Ext.Msg.alert("ERROR", "No Evidence Sources found.  None of the Evidence sources in the Source Registry is public and/or user has no access to any of the Evidence sources.") ;
  }
   if(allhidden == true)
   {
      firstItems.push(allhiddenGrid) ;
   }
   else if(grids[firstTab].hasnotags)
   {
     if(grids[firstTab].guideline){updateToHasnotagsState(firstTab, false) ;}
     getTagStore(firstTab, 'html', true) ;
     firstItems.push(hasnomesGrid) ;
     firstItems.push(evTable) ;
   }
   else if(grids[firstTab].evidence)
   {
     if(grids[firstTab].guideline)
     {
       updateToHasEvidenceState(firstTab) ;
       fillReasonerGrid(firstTab) ;
     }
     else
     {
       noguidelineState(firstTab) ;
     }
     getTagStore(firstTab, 'html', false) ;
     viewGrid('html', firstTab);
     firstItems.push(reasGrid);
     firstItems.push(evTable);
   }
   else // no evidence
   {
     updateToHasnoEvidenceState(firstTab) ;
     firstItems.push(hasnoEviGrid) ;
   }
   var tab = gridtab.add({
     title: firstTab,
     id: 'tab'+safeStr[firstTab],
     bodyPadding: 10,
     items: firstItems,
     listeners:{
               activate: function(tab){
                   tags = new Object();
                   var tabName = tab.title ;
                   updateSummaryRow() ;
                   if(grids[tabName].hasnotags)
                   {
                    if(grids[tabName].guideline){updateToHasnotagsState(tabName, false) ;}
                    else{noguidelineState(tabName) ;}
                    getTagStore(tabName, 'html', true) ;
                    tab.add([hasnomesGrid, evTable]);
                   }
                   else if(grids[tabName].evidence)
                   {
                     Ext.getCmp('reasonerGrid').getStore().removeAll() ;
                     getTagStore(tabName, 'html', false) ;
                     viewGrid('html', tabName) ;
                     if(grids[tabName].guideline)
                     {
                       updateToHasEvidenceState(tabName) ;
                       fillReasonerGrid(tabName) ;
                       tab.add([reasGrid, evTable]) ;
                     }
                     else
                     {
                       noguidelineState(tabName) ;
                       tab.add([noguidesgrid, evTable]) ;
                     }
                   }
                   else // no evidence
                   {
                     updateToHasnoEvidenceState(tabName) ;
                     tab.add([hasnoEviGrid]) ;
                   }
               }
             }
   });
   if(grids[firstTab].evidence && grids[firstTab].hasnotags == false)
   {
     gridtab.setActiveTab(tab) ;
     activeyet = true ;
   }
    for (var ii=1; ii<gridNames.length; ii++)
    {
      var tab = gridtab.add({
             title: gridNames[ii],
             id: 'tab'+safeStr[gridNames[ii]],
             bodyPadding: 10,
             items: [],
             listeners:{
               activate: function(tab){
                   tags = new Object();
                   if(tab.items.length == 0){tab.removeAll()}
                   var tabName = tab.title ;
                    updateSummaryRow() ;
                   if(grids[tabName].hasnotags)
                   {
                    if(grids[tabName].guideline){updateToHasnotagsState(tabName, false) ;}
                    else{noguidelineState(tabName) ;}
                    getTagStore(tabName, 'html', true) ;
                    tab.add([hasnomesGrid, evTable]);
                   }
                   else if(grids[tabName].evidence)
                   {
                     
                     Ext.getCmp('reasonerGrid').getStore().removeAll() ;
                     getTagStore(tabName, 'html', false) ;
                     viewGrid('html', tabName) ;
                     if(grids[tabName].guideline)
                     { 
                       updateToHasEvidenceState(tabName) ;
                       fillReasonerGrid(tabName) ;
                       tab.add([reasGrid, evTable]) ;
                     }
                     else
                     {
                       noguidelineState(tabName) ;
                       tab.add([noguidesgrid, evTable]) ;
                     } 
                   }
                   else // no evidence
                   {
                     updateToHasnoEvidenceState(tabName) ;
                     tab.add([hasnoEviGrid]) ;
                   }
               }
             }
          });
      if(grids[gridNames[ii]].evidence && grids[gridNames[ii]].hasnotags == false && activeyet == false)
      {
        gridtab.setActiveTab(tab) ;
        activeyet = true ;
      }
    }

  // Populate the evidence summary and display grid with the two rows.
  var alStore = Ext.getCmp('summaryGrid').store ;
  var fields = alStore.model.prototype.fields ;
  var sumcols = [] ;
  var firstRow = {};
  var secondRow = {}
   fields.add(Ext.create("Ext.data.Field", {
      name: 'id'
    }));

  var tmp = {};
  var count = 0;
  tmp.text = "" ;
  tmp.dataIndex = "id" ;
  sumcols.push(tmp) ;
  firstRow['id'] = '<b>Final Call</b>' ;
  secondRow['id'] = '<b>Display Tab?</b>' ;
  // Get the rows and hide/show the tabs too here.
  for(var ii=0; ii<gridNames.length; ii++)
  {
    if(grids[gridNames[ii]].evidence && grids[gridNames[ii]].hasnotags == false)
    {
      firstRow[safeStr[gridNames[ii]]] = grids[gridNames[ii]].conclusion ;
      secondRow[safeStr[gridNames[ii]]] = '<div id="tabicon" align="center"><span id="'+safeStr[gridNames[ii]]+'" class="showTab"  href="#" onclick="showtab(\'' +safeStr[gridNames[ii]]+'\')">&nbsp;</span></br></div>' ;

    }
    else // no evidence
    {
      firstRow[safeStr[gridNames[ii]]] = grids[gridNames[ii]].conclusion;
      secondRow[safeStr[gridNames[ii]]] = '<div id="tabicon" align="center"><span id="'+safeStr[gridNames[ii]]+'" class="hideTab"  href="#" onclick="showtab(\'' +safeStr[gridNames[ii]]+'\')">&nbsp;</span></br></div>' ;
      Ext.getCmp('multitab').child('#tab'+safeStr[gridNames[ii]]).tab.hide();
      count = count+1 ;
    }
    // columns dynamically generated
    tmp = {} ;
    tmp.text = gridNames[ii];
    tmp.width = 100 ;
    tmp.align = 'center' ;
    tmp.dataIndex =  safeStr[gridNames[ii]];
    sumcols.push(tmp) ;


    fields.add(Ext.create("Ext.data.Field", {
      name: safeStr[gridNames[ii]]
    }));

  }
  var data = [] ;
  data.push(firstRow) ;
  data.push(secondRow) ;
  Ext.getCmp('summaryGrid').reconfigure(null, sumcols);
  alStore.loadData(data) ;
  updateSummaryRow() ;

  // update all the toolbars if no tabs are active
  if(allhidden == true)
  {
    var newEvbutton = Ext.getCmp('newEvDoc') ;
        newEvbutton.disable() ;
        var viewEvbutton = Ext.getCmp('gvEvDoc') ;
        viewEvbutton.disable() ;
        var agButton = Ext.getCmp("gvRefreshButton") ;
        agButton.disable() ;
        var cpButton = Ext.getCmp("copyTgs") ;
        cpButton.disable() ;

  }
}


function showCopyTagWindow()
{
  
 var copyStore = getCopyTagStore() ; 
 if(copyStore.length >0)
  {
    var copyForm = new Ext.FormPanel({
    id: 'cpTagForm',
    bodyStyle:'padding:10px 10px 0',
    frame: true,
    labelStyle: 'font-weight:bold;padding:0',
    items: [
            {
              xtype: 'combo',
              name: 'cpTags',
              fieldLabel: 'Copy Tags To ',
              labelStyle: 'font-weight:bold;padding:0',
              store: copyStore,
              width: 350,
              id: 'cpTags',
              displayField: 'value',
              typeAhead: false,
              minChars : 1,
              autoScroll: true,
              forceSelection: true,
              emptyText: 'Choose grid Name ...'
            }] 

    });


    var copyWindow = new Ext.Window({
        width: 500,
        id: 'copyWin',
        title: 'Copy Tags',
        buttonAlign:'center',
        width: 400,
        fieldDefaults: {
            msgTarget: 'side',
            labelWidth: 75
        },
        defaults: {
            anchor: '100%'
        },
        items: [copyForm],
        buttons: [{
            text: 'Copy',
            name:'copy',
            handler: prepareCopy
            },
            {
              text: 'Cancel',
              handler: function(){
                copyForm.getForm().reset(); 
                copyWindow.close(); 
              }
            },
            {
              text:'Reset',
              handler: function(){copyForm.getForm().reset();}
            }]
    });

    copyWindow.show();
   }

   else
   {
    Ext.Msg.alert("ERROR", "Failed to copy tags because of one or more of the following reasons: <ul><li>None of the grids have Evidence documents</li><li>User has no sufficient permissions to access any of the grids</li></ul>") ;

   }
}

function getCopyTagStore()
{
  var cpStore = [];
  // get the evidence and tags of the 'copy from' (active tab) grid
  var activeGrid = Ext.getCmp('multitab').getActiveTab().title ;
  for(var ii=0; ii<gridNames.length; ii++)
  {
    if(grids[gridNames[ii]].evidence && (gridNames[ii] != activeGrid)) // has evidence
    {
      // get the grp resource uri
      var grpUri = getGrpUri(grids[gridNames[ii]].evidence)
      if(grpUri in uniquegrpUris && (uniquegrpUris[grpUri] == 'administrator' || uniquegrpUris[grpUri] == 'author'))
      {
        cpStore.push(gridNames[ii]) ;
      }
      else
      {
         console.log('No access or permissions to write to the grid ' + gridNames[ii]) ;
      }
    }
  }
 return cpStore ;
}


function prepareCopy()
{
 var formVals = Ext.getCmp('cpTagForm').getForm().getValues();
  var activeGrid = Ext.getCmp('multitab').getActiveTab().title ;
 if(formVals.cpTags)
 {
   // tags must be compatible at both the ends
   if(grids[activeGrid].tags == grids[formVals.cpTags].tags)
   {
     copyTagsFromTo(activeGrid, formVals.cpTags) ;
   }
   else
   {
     Ext.Msg.alert("Error", "Tags failed to match between the grids " +activeGrid+ " and " +formVals.cpTags+".<br>This is not allowed, that is,  tags can be copied over only when both the tags are compatible across the grids. ") ;
   }
 }

 
}

