function reas()
{
 //'/REST/v1/grp/'+ gridGrp +'/kb/'+ gridKb +'/coll/' + gridAllelesColl + '/doc/' + subject + '?detailed=true';
  var toolPath = "/REST/v1/genboree/tool/reasonerV2/job?" ;
  var kbDocUrl = "http://"+ location.host +"/REST/v1/grp/"+ gridGrp +"/kb/"+ gridKb +"/coll/"+ gridEviColl +"/doc/CGV001"
  var trRulesDocUrl =  "http://"+ location.host +"/REST/v1/grp/"+ gridGrp +"/kb/"+ gridKb +"/trRulesDoc/"+ trRulesDoc ;
  var guideUrl =  "http://"+ location.host +"/REST/v1/grp/"+ gridGrp +"/kb/"+ gridKb +"/coll/"+ guideColl +"/doc/" + guideDoc ;
  console.log(kbDocUrl);
  console.log(trRulesDocUrl);
  console.log(guideUrl);
  jobConf = new Object();
  jobConf['inputs'] = [];
  jobConf['inputs'].push(kbDocUrl);
  jobConf['inputs'].push(trRulesDocUrl);
  jobConf['outputs'] = [];
  jobConf['settings'] = {};
  jobConf['settings']['rulesDoc'] =  guideUrl ;
  jobConf['context'] = {};
  var job = JSON.stringify(jobConf)
  console.log(jobConf);
  console.log(job);


//{ "inputs" => [kbDoc, trRules], "outputs" => [], "settings" => { "rulesDoc" => guide }, "context" => {} }
  Ext.Ajax.request(
  {
    url : '/java-bin/apiCaller.jsp' ,
    timeout : 90000,
    params:
    {
      rsrcPath: toolPath,
      apiMethod : 'PUT',
      payload: Ext.JSON.encode(jobConf)
    },
    method: 'POST'
  }) ;
}


function testput1()
{
  name = "score:Track" ;
  desc = "testingdecription" ;
  var meme = [name, desc] ;
  alert(meme);
  Ext.Ajax.request(
  {
    url : '/java-bin/apiCaller.jsp' ,
    timeout : 90000,
    params:
    {
      rsrcPath: '/REST/v1/grp/neethus_group/db/hg18NS/trk/'+fullEscape(name)+'/description',
      apiMethod : 'PUT',
      payload: Ext.JSON.encode({"data":{"text":desc}})
    },
    method: 'POST',
    success: saveValueSuccessDialog,
    failure: displayFailureDialog

  }) ;

}

///REST/v1/genboree/tool/reasonerV2/job?
//
function testput()
{
  name = "score:Track" ;
  desc = "testingdecription" ;
  var meme = [name, desc] ;
  var toolPath = "/REST/v1/genboree/tool/reasonerV2/job?" ;
  var kbDocUrl = "http://"+ location.host +"/REST/v1/grp/"+ gridGrp +"/kb/"+ gridKb +"/coll/"+ gridEviColl +"/doc/CGV001"
  var trRulesDocUrl =  "http://"+ location.host +"/REST/v1/grp/"+ gridGrp +"/kb/"+ gridKb +"/trRulesDoc/"+ trRulesDoc ;
  var guideUrl =  "http://"+ location.host +"/REST/v1/grp/"+ gridGrp +"/kb/"+ gridKb +"/coll/"+ guideColl +"/doc/" + guideDoc ;

  Ext.Ajax.request(
  {
    url : '/java-bin/apiCaller.jsp' ,
    timeout : 360000,
    params:
    {
      rsrcPath: '/REST/v1/genboree/tool/reasonerV2/job?',
      apiMethod : 'PUT',
      payload: Ext.JSON.encode({"inputs": [kbDocUrl,trRulesDocUrl], "outputs": [], "settings":{"rulesDoc":guideUrl}, "context":{}})
    },
    method: 'POST',
    success: getReasonerData,
    failure: displayFailureDialog

  }) ;

}

function saveValueSuccessDialog(result, request)
{
  var jsonData = Ext.JSON.decode(result.responseText);
  if(jsonData.status.statusCode == "Accepted")
  {
    alert("Save successful");
  }
  else
  {
    alert(jsonData.status.msg);
  }
}


function displayFailureDialog(result, request) {
  var message;
  windowTitle = 'An error has occurred.';
  resultText = (result.responseText) ? result.responseText : "No response from server.";
  message = '<div class="wbDialog"><div class="wbDialogFeedback wbDialogFail">' + '  <div class="wbDialogFeedbackTitle">There has been an error.<br>' + resultText + '<br>' + '  Please try again later.<br>' + '</div></div>';
  alert(result.responseText);
}
