<%@ page import="javax.servlet.http.*, java.util.*, java.sql.*,java.io.*, java.net.*" %>
<%@ page import="org.genboree.util.*, org.genboree.dbaccess.*, org.genboree.dbaccess.util.*, org.genboree.message.*, org.genboree.manager.tracks.*" %>
<%@ page import="org.genboree.util.helpers.*" %>
<%@ include file="include/fwdurl.incl" %>
<%@ include file="include/group.incl" %>
<%@ include file="include/sessionGrp.incl" %>
<%
  // Constants
  final String underlyingPage = "/clingenInference/V2.6/clingen.rhtml";
  String pageTitle = "ClinGenGrid" ;

            // Key variables:
   String urlStr = null ;
   boolean doHtmlStripping = true ;
   String contentUrl = null ; // String to store the entire content of an URL using getContentOfUrl(urlStr )
   String refSeqId = null ; // Not needed here, but staticContent.incl expects the variable
   String currPageURI = request.getRequestURI() ;
   String groupAllowed = null ;
   // REBUILD the request params we will pass to RHTML side (via a POST)
   Map paramMap = request.getParameterMap() ; // "key"=>String[]
   StringBuffer postContentBuff = new StringBuffer() ;
   // 1.a Send the userId, whether on form or not
   postContentBuff.append("userId=").append(Util.urlEncode(userInfo[2])) ;
   // Need to send the group_id when it's not post'd
   postContentBuff.append("&group_id=").append(Util.urlEncode(groupId)) ;
   postContentBuff.append("&refseq_id=").append(Util.urlEncode(rseq_id)) ;


   postContentBuff.append("&userEmail=").append(URLEncoder.encode(myself.getEmail(), "UTF-8")) ;
   postContentBuff.append("&userLogin=").append(URLEncoder.encode(userInfo[0], "UTF-8")) ;
   postContentBuff.append("&passwd=").append(URLEncoder.encode(userInfo[1], "UTF-8")) ;
   String userPwdDigest = RESTapiUtil.SHA1(userInfo[0] + userInfo[1]) ;
   if(userPwdDigest != null)
   {
     postContentBuff.append("&userPwdDigest=").append(URLEncoder.encode(userPwdDigest, "UTF-8")) ;
   }

   postContentBuff.append("&userPwdDigest=").append(Util.urlEncode(userPwdDigest)) ;
   

   // 1.b Loop over request key-value pairs, append them to rhtml request:
   Iterator paramIter = paramMap.entrySet().iterator() ;
   while(paramIter.hasNext())
   {
     Map.Entry paramPair = (Map.Entry) paramIter.next() ;
     String pName = Util.urlEncode((String) paramPair.getKey()) ;
     String[] pValues = (String[]) paramPair.getValue() ; // <-- Array!
     if(pValues != null)
     { // then there is 1+ actual values
       for(int ii = 0; ii < pValues.length; ii++)
       { // Add all of the values to the POST
         postContentBuff.append("&").append(pName).append("=").append(URLEncoder.encode(pValues[ii], "UTF-8")) ;
         System.out.println(pValues[ii]);
       }
     }
     else // no value, just a key? ok...
     {
       postContentBuff.append("&").append(pName).append("=") ;
     }
   }
   //Target specific params
   postContentBuff.append("&genbSession=true");
   // 1.c Get the string we will post IF that's what we will be doing
   String postContentStr = postContentBuff.toString() ;

   String uriPath = request.getRequestURI().replaceAll("/[^/]+\\.jsp.*$", "") ;
   urlStr = myBase + underlyingPage ;



%>
<%
    if(urlStr != null)
    {
      HashMap hdrsMap = new HashMap() ;
      // Do as a POST
      contentUrl = GenboreeUtils.postToURL(urlStr, postContentStr, doHtmlStripping, hdrsMap, mys ) ;
      // Update group/database if correct X-HEADERS are found:
      GenboreeUtils.updateSessionFromXHeaders(hdrsMap, mys) ;
      // Write out content of other page
      out.write(contentUrl) ;
    }
%>
