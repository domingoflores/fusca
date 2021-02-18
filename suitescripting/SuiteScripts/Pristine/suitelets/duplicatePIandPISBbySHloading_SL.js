/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */

 /* 
  * DupePI Loading Suitelet
  * v 1.0                   ATP-986             9/10/2019
  * 
  * Robert Bender   rbender@shareholderrep.com
  * 
  * Description:
  * Loading page for dupe holds, forwards to Suitelet that processes the PIs
  */

define(['N/url'], 
function(url) {
    function onRequest(context) {

         // GET AND POST REQUESTS
         if (context.request.method === 'GET') {

            var suitelet_auth = context.request.parameters.custscript_suitelet_auth;  //!authorizedSuitelet772390
            var SHid = context.request.parameters.custscript_shid;
            var current_id = context.request.parameters.custscript_current_id;
            var processedPIs = context.request.parameters.custscript_processedpis;
            log.debug('GET - loading suitelet entered', 'SHid='+SHid+ ', currentid='+current_id+ ', auth='+suitelet_auth+', processedPIs='+processedPIs);

            // Suitelet that does all the work
            var suiteletURL = url.resolveScript({
                scriptId: 'customscript_dupepiandpisb_sl',
                deploymentId: 'customdeploy_dupepiandpisb_sl',
                params:	{ 'custscript_suitelet_auth' : suitelet_auth, 'custscript_shid' : SHid, 'custscript_current_id' : current_id, 'custscript_processedpis' : processedPIs },
                returnExternalUrl: true
            });

            var pisProcessedForMessage = ""
            var pisProcessedArray = processedPIs.split("-");
            for (var z=0; z<pisProcessedArray.length; z++){
                var currentPIrec = url.resolveRecord({
                recordType: 'customrecord_paymt_instr',
                recordId: pisProcessedArray[z]
                });
                pisProcessedForMessage = pisProcessedForMessage + "<p align='center'><b>Payment Instruction #"+pisProcessedArray[z]+"</b> is being processed.</p>"
            }

            var scripts = "<script>"+
            "window.setTimeout(function(){" +
                "window.location.href = '"+ suiteletURL +"';"+
            "}, 4000);"+
            "</script>";

            var img = '<img style="display: block;margin: 0 auto;" src="https://772390-sb3.app.netsuite.com/core/media/media.nl?id=14506253&c=772390_SB3&h=5f2555e7662c134fe35a&fcts=20190910145258&whence=" />';

            var tagline = '<p align="center"><em style="display: block;margin: 0 auto;" >Please do not navigate away, your browser will be forwarded to Payment Instruction #'+current_id+' when completed.</em></p>'
            
            var html = '<h1 align="center">Please Wait!</h1><h2 align="center">Duplicate Payment Instruction(s) Detected</h2><p align="center"><b>Please wait</b> while the Customer\'s (id #'+ SHid +') Payment Instruction(s) are placed on <b>Duplicate Hold</b>.</p>' + pisProcessedForMessage+ img+'<br />'+ tagline + scripts ;

            context.response.write( html );

         } else { // context.request.method === 'POST'
            // no POST resposne

         } // END GET AND POST REQUESTS
 
     }
 
     return {
         onRequest: onRequest
     };
 });