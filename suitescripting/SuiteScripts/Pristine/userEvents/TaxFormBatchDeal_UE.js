/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(["N/runtime"
        ,"/SuiteScripts/Pristine/libraries/TaxForm_Library.js"
	],

    function(runtime
    	,tfLibrary
    ) {

        var scriptFileName = "TaxFormBatchDeal_UE.js";

        function beforeLoad(context) 
        {
        	log.debug("before load");
        	if (runtime.executionContext === "USERINTERFACE"
        		|| runtime.executionContext === "CSVIMPORT") 
        	{
        		log.debug("context.type " + context.type );
        		log.debug("tfLibrary.userIsAdmin()", tfLibrary.userIsAdmin());
	    		if ((!tfLibrary.userIsAdmin()) && context.type === "view") 
	    		{
	    			
					context.form.removeButton("makecopy");
					context.form.removeButton("new");
					context.form.removeButton("edit");
				}
	    		
	    		if ((!tfLibrary.userIsAdmin()) && (context.type === "edit" || context.type === "create" || context.type === "copy")) 
	    		{
	    			throw "Only Administrator role can modify Tax Form Batch Deal records.";
				}
        	}
        }
        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        return { 
                 beforeLoad: beforeLoad
        };

    });