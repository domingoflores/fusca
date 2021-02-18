/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */

define(['N/log', 'N/runtime'],
    function(log, runtime) {

		function beforeLoad(context) {

            if (context.type == 'view' && runtime.executionContext == 'USERINTERFACE') {

                var glAccountID = context.newRecord.getValue("custrecord_recon_item_gl_account");

                if (Boolean(glAccountID)){
                    context.form.addButton({		
                        id : "custpage_viewglaccount",		
                        label : "View GL Account",		
                        functionName: "window.location.href='" + "/app/accounting/account/account.nl?id="+ glAccountID + "'; console"	
                    });
                    
                    context.form.addButton({		
                        id : "custpage_viewglregister",		
                        label : "View GL Register",		
                        functionName: "window.location.href='" + "/app/reporting/reportrunner.nl?acctid="+ glAccountID + "&reload=T&reporttype=REGISTER'; console"	
                    });	
                }
            }

        }
        

		function beforeSubmit(context) {

		}

        
		return {
			beforeLoad: beforeLoad,
			beforeSubmit: beforeSubmit
		};
	}
);