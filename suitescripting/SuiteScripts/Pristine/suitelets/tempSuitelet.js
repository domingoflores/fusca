/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */

 /* 
  * Blank Suitelet to test SuiteScript Logic
  */

define(['N/ui/serverWidget', 'N/search', 'N/task', 'N/file', 'N/url', 'N/record', 'N/format', 'N/runtime', 'N/redirect', '/SuiteScripts/Pristine/libraries/searchResultsLibrary'], 
function(serverWidget, search, task, file, url, record, format, runtime, redirect, searchResultsLibrary) {
    function onRequest(context) {
        // GET AND POST REQUESTS
        if (context.request.method === 'GET') {
            var form = serverWidget.createForm({
                title: 'Alana Testing Suitelet'
            });

var attachedExRecsStr = '"651692","651693","651694","651695","651696","651697","651698","651699","651792","651793","651794"';
attachedExRecsStr = attachedExRecsStr.replace(/\"/g, "");
log.error(attachedExRecsStr);


            var submitButton = form.addSubmitButton({
                label: 'Submit'
            });

            context.response.writePage(form);

        } else { // context.request.method === 'POST'
            var form = serverWidget.createForm({
                title: 'Alana Testing Suitelet'
            });

            context.response.writePage(form);   
            log.debug('hey');
        }
        // END GET AND POST REQUESTS

    }

    return {
        onRequest: onRequest
    };
});