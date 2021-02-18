/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/log','N/url','N/https','N/xml','N/currentRecord','N/format'],
function(log,url,https,xml,currentRecord,format) {

    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext) {
    	log.debug({title:'ClientScript:pageInit',details:'We made it!'});
    	return true;
    }

    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) {
    	log.debug({title:'ClientScript:fieldChanged',details:'We made it!'});
    	if(scriptContext.fieldId == 'custpage_select_page'){
    		try{
            	log.debug({title:'ClientScript:fieldChanged',details:'scriptContext.fieldId='+scriptContext.fieldId});
    
            	///* From https://netsuite.custhelp.com/app/answers/detail/a_id/63272
            	// Navigate to selected page
                var pageId = scriptContext.currentRecord.getValue({
                    fieldId : 'custpage_select_page'
                });

                pageId = parseInt(pageId.split('_')[1]);

            	var params = getParameters(pageId);
                document.location = url.resolveScript({
                    scriptId : getParameterFromURL('script'),
                    deploymentId : getParameterFromURL('deploy'),
                    params : params /*{
                        'page' : pageId
                    }*/
                });
                //*/
                      	
    			//xml.document.getElementById('submitter').click();
    			
    			/*
    			var suitletURL = url.resolveScript({
    		        scriptId: 'customscript_pp_sl_paymentlog',
    		        deploymentId: 'customdeploy_pp_sl_paymentlog',
    		        returnExternalUrl: true
    			});
    			var myBody = {'custpage_select_page':scriptContext.currentRecord.getField({fieldId:'custpage_select_page'})}
    			var response = https.post({
    		        url : suitletURL,
    		        //headers : myHeaders,
    		        body : myBody
    			});
    			//*/

    			//scriptContext.currentRecord.setField({fieldId:'custpage_select_page',value:0,ignoreFieldChange:true});
    	
    			/*
    	    	redirect.toSuitelet({
    	    	    scriptId: 31 ,
    	    	    deploymentId: 1,
    	    	    parameters: {'custparam_test':'helloWorld'} 
    	    	});
    	    	//*/
    		} catch(ex) {
    			log.error({ title: 'Error in fieldChanged', details: ex.message });
    		}
    	}
    	return true;
    }

	///* From https://netsuite.custhelp.com/app/answers/detail/a_id/63272
    function getSuiteletPage(suiteletScriptId, suiteletDeploymentId, pageId) {
    	var params = getParameters(pageId);
        document.location = url.resolveScript({
                scriptId : suiteletScriptId,
                deploymentId : suiteletDeploymentId,
                params : params 
            });
    }
    function getParameterFromURL(param) {
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split("=");
            if (pair[0] == param) {
                return decodeURIComponent(pair[1]);
            }
        }
        return (false);
    }
    //*/
    
    function getParameters(pageId){
    	try{
            var account = currentRecord.get().getValue({ fieldId : 'custpage_select_account'});
            var payee   = currentRecord.get().getValue({ fieldId : 'custpage_select_payee'  });
            var sDate   = currentRecord.get().getValue({ fieldId : 'custpage_startdate'     });
            if(sDate){
                sDate = format.format({value:sDate,type:format.Type.DATE})
            }
            var eDate   = currentRecord.get().getValue({ fieldId : 'custpage_enddate'       });
            if(eDate){
                eDate = format.format({value:eDate,type:format.Type.DATE})
            }
            var results = {
                    'page':pageId,
                    'custpage_select_account':account,
                    'custpage_select_payee':payee,
                    'custpage_startdate':sDate,
                    'custpage_enddate':eDate
            }
    		log.debug({ 
    			title: 'getParameters', 
    			details: results
    		});
            return results;
		} catch(ex) {
			log.error({ title: 'Error in getSuiteletPage', details: ex.message });
		}
    }
    
    function exportCSV(){
    	log.debug({title:'ClientScript:exportCSV',details:'We made it!'});
    	return true;
    }
    

    return {
    	pageInit: pageInit,
        fieldChanged: fieldChanged,
        getSuiteletPage : getSuiteletPage,
    	exportCSV: exportCSV
    };
    
});
