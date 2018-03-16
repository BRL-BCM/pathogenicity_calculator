
// Makes empty grid from allowed tags
// evDoc is required to pass argument to make samll html window
// format is html of small html
function makeEmptyTable(allowedTags, format, evDoc, returnPartitions)
{
  var partitions = new Object() ;
  var parts = [];
  for(var key in allowedTags)
  {
    parts = key.split('.') ;
    for(var ii=0; ii<=parts.length; ii++)
    {
      if(ii in partitions)
      {
        if((!partitions[ii].contains(parts[ii]))) { partitions[ii].push(parts[ii]) ;}
      }
      else
      {
        partitions[ii] = [];
        partitions[ii].push(parts[ii]) ;
      }
    }
  }
  partitions = filterPartitons(partitions) ;
  if(returnPartitions == true){return partitions ;}
  else 
  {
    var totalParts = parts.length ;
    var emptyTable ;
    var valueCls;
    var id ; 
    var path ;
    // Different table based on the format
    // main difference for 'html' is that it has onclick function 
    if(format == 'smallhtml')
    {
      emptyTable = '<div class="gb-transformedTable">';
      emptyTable += '<table class="gb-grid-small"><tr>';
      emptyTable += '<th class="gb-context" rowspan="'+ (totalParts-1) +'"></th>';
      // First row
      for(var ii=0; ii<partitions[0].length; ii++)
      {
        emptyTable += '<th class="gb-part1-header gb-part1-header-'+(ii+1)+'" colspan="'+partitions[1][ii].length+'">'+partitions[0][ii]+'</th>';
      }
      emptyTable += '</tr>';

      // Second row Assuming that the number of partitions are always 3.!! CAUTION
      emptyTable += '<tr>';

      totalheader2 = 0 ;
      for(var ii=0; ii<partitions[1].length; ii++)
      {
        for(var jj=0; jj<partitions[1][ii].length; jj++)
        {
          totalheader2 = totalheader2 + 1 ;
          emptyTable += '<th class="gb-part2-header gb-part2-header-'+totalheader2+'">'+partitions[1][ii][jj]+ '</th>' ;
        }
      } 

      emptyTable += '</tr>';
       // Each of the data cells
      for(var ii=0; ii<partitions[2].length; ii++)
      {
        emptyTable += '<tr>' ;
        emptyTable += '<th class="gb-part3-header gb-part3-header-'+(ii+1)+'">' +partitions[2][ii]+'</th>' ;
        for(var jj=0; jj<partitions[0].length; jj++)
        {
          for(var kk=0; kk<partitions[1][jj].length; kk++)
          {
            path = partitions[0][jj]+'.'+partitions[1][jj][kk]+'.'+partitions[2][ii] ;
            if(path in tags){valueCls = "gb-dataCell-plain" ;}
            else {valueCls = "gb-dataCell-invalid" ;}

            path = path.replace(/\s+/g, "")  ;
            emptyTable += '<td id='+path+' class="gb-dataCell '+valueCls+'"></td>' ;
          }
        }
        emptyTable += '</tr>' ;
      }

      emptyTable += '</div>';
      //makeSmallWindow(emptyTable, evDoc) ;
      }
      else if(format == 'html')
      {
        emptyTable = '<div class="gb-transformedTable">';
        emptyTable += '<table class="gb-grid-large"><tr>';
        emptyTable += '<th class="gb-context" rowspan="'+ (totalParts-1) +'"></th>';
        // First row
        for(var ii=0; ii<partitions[0].length; ii++)
        {
          id = partitions[0][ii].replace(/\s+/g, "")  ;
          emptyTable += '<th id=' +id+ ' class="gb-part1-header gb-part1-header-'+(ii+1)+'" onclick="clickPartition(\''+id+'\', \'' +partitions[0][ii]+ '\', \'' +partitions[0][ii]+ '\', null)"colspan="' +partitions[1][ii].length+ '">' +partitions[0][ii]+ '</th>';
        }
        emptyTable += '</tr>';
        // Second row
        emptyTable += '<tr>';

        totalheader2 = 0 ;
        for(var ii=0; ii<partitions[1].length; ii++)
        {
          for(var jj=0; jj<partitions[1][ii].length; jj++)
          {
            totalheader2 = totalheader2 + 1 ;
            path = partitions[0][ii]+'.'+partitions[1][ii][jj] ;
            id = path.replace(/\s+/g, "") ;
            emptyTable += '<th id=' +id+ ' class="gb-part2-header gb-part2-header-'+totalheader2+'" onclick="clickPartition(\''+id+'\', \''+path+'\', \''+partitions[1][ii][jj]+'\' , null)" >'+partitions[1][ii][jj]+ '</th>' ;
          }
        }
        emptyTable += '</tr>';

        for(var ii=0; ii<partitions[2].length; ii++)
        {
          emptyTable += '<tr>' ;
          id = partitions[2][ii].replace(/\s+/g, "") ;      
          emptyTable += '<th id='+id+' class="gb-part3-header gb-part3-headertemp gb-part3-header-'+(ii+1)+'"  onclick="clickPartition(\''+id+'\', \''+partitions[2][ii]+'\', \''+partitions[2][ii]+'\', null)" >' +partitions[2][ii]+'</th>' ;
          for(var jj=0; jj<partitions[0].length; jj++)
          {
            for(var kk=0; kk<partitions[1][jj].length; kk++)
            {
              path = partitions[0][jj]+'.'+partitions[1][jj][kk]+'.'+partitions[2][ii] ;
              if(path in tags){valueCls = "gb-dataCell-plain" ;}
              else {valueCls = "gb-dataCell-invalid" ;}

              id = path.replace(/\s+/g, "")  ;
              emptyTable += '<td id='+id+' class="gb-dataCell '+valueCls+'" onclick="clickCell(\''+id+'\', \''+path+'\', \''+partitions[2][ii]+'\',  null)" ></td>' ;
            }
          }
          emptyTable += '</tr>' ;
         } 
    
          emptyTable += '</div>';
          Ext.getCmp('htmltable').body.update(emptyTable) ;
          renderToolTipsForCells() ;
        }
        return emptyTable;
      }
   }



///////////////////////////////////////////////////////
// HELPER METHODS
///////////////////////////////////////////////////////
function isEmpty(myObject) {
    for(var key in myObject) {
        if (myObject.hasOwnProperty(key)) {
            return false;
        }
    }
    return true;
}
Array.prototype.contains = function(v) {
    for(var i = 0; i < this.length; i++) {
        if(this[i] === v) return true;
    }
    return false;
};


// Filter the parititions. If all the cells are invalid for a column
// then do not need to display. 
function filterPartitons(partitions)
{
  var newPartition = [] ;
  var subpart = [] ; 
  var count = 0; 
  for(var ii=0; ii<partitions[0].length; ii++)
  {

    subpart = [];
    for(var jj=0; jj<partitions[1].length; jj++)
    {
      count = 0 ;
      for(var kk=0; kk<partitions[2].length; kk++)
      {
        if((partitions[0][ii]+'.'+partitions[1][jj]+'.'+partitions[2][kk]) in tags){}
        else
        {
          count = count + 1;
        }
      } 
      if(count == partitions[2].length){ }    
      else{subpart.push(partitions[1][jj]); }
    }
    newPartition.push(subpart) ;
  }
  partitions[1] = newPartition ;
  return partitions ;
}
