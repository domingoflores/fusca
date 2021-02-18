//------------------------------------------------------------------
// Copyright 2017, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------

/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

//------------------------------------------------------------------
//Script: 		PRI_RSM_UE_Record_UI.js
//Description: 	The User Event scripts to render the UI and run the Prolecto Record State Manager   	
//Developer: 	Boban
//Date: 		Feb 2017
//------------------------------------------------------------------

define(['N/ui/serverWidget','N/task','N/url','N/log','N/record','N/search','N/runtime','N/error', './PRI_RSM_Engine','./PRI_RSM_Constants'],

    function(serverWidget,task,url,log,record,search,runtime,error, rsmEngine, rsmConstants) {
		
		var scriptName = "PRI_RSM_UE_Record_UI.";
		
    	/* ======================================================================================================================================== */

		function beforeLoad(context){
			
	    	var funcName = scriptName + "beforeLoad " + context.type + " " + context.newRecord.type + " " + context.newRecord.id + " via " + runtime.executionContext;
	    				
             if(context.type != context.UserEventType.VIEW)
                 return;


             try {

    			 var REC = context.newRecord;
    			 
                 // var hold = record.getValue({'fieldId': 'custbody_pri_tran_hold_reasons'});


    	    	 var rsm = rsmEngine.createRecordStateManager(REC);      

    	    	 if (!rsm)
    	    		 return; 
    	    	 
    	    	 if (!rsm.showRuleSummary) 
    	    		 return;

    	    	 
    	    	 var rules = rsm.rules;
    	    	 var ruleInstances = rsm.ruleInstances;
    	    	 	    	 
    	    	 var form = context.form;
                 
                 generateSummaryHTML(context.form, rsm); 
                                  
                 var buttonCount = rsm.overridableRulesCount();
                 
                 log.debug(funcName, "there are " + buttonCount + " overridable rules; we allow a max of " + rsm.maxNbrOfButtons + " buttons");
                     	    	 
                 for (var r = 0; r < ruleInstances.length; r++) {
                	 var ruleInstance = ruleInstances[r];
                	 var rule = rules[ruleInstance.ruleId];
                	 
                	 if (ruleInstance.id) {
        	    		 // log.debug(funcName, "evaluating rule: " + JSON.stringify(rule));
                         var btnlbl = rule.buttonLabel;
                         var ruleid = rule.id;

                         if(btnlbl == '' || btnlbl == null)
                        	 continue;

                    	 var suffix = "";

                    	 if (rule.ruleType == rsmConstants.RULE_TYPE.AD_HOC)
                    		 suffix = " " + ruleInstance.ruleName; 
                    	
                         if (rsm.ruleInstanceFailed(ruleInstance) && buttonCount <= rsm.maxNbrOfButtons && rsm.userCanOverrideRule(rule)) {
                             var urlLoc = url.resolveScript({
                                 'scriptId':'customscript_pri_rsm_sl_override',
                                 'deploymentId':'customdeploy_pri_rsm_sl_override',
                                 'params':{ruleInstanceId: ruleInstance.id, recType: REC.type, recId: REC.id}
                             });
                              
                             context.form.addButton({
                                 id : 'custpage_rsm_rulebtn_'+ruleInstance.id,
                                 label : btnlbl+suffix,
                                 functionName:"eval(window.location='"+urlLoc+"')"
                             });

                         } // show rule
                		 
                	 } // if the instance has an ID
                     
                 }	// rule loop

                 
                 if (buttonCount > rsm.maxNbrOfButtons) {
                     var urlLoc = url.resolveScript({
                         'scriptId':'customscript_pri_rsm_sl_override_rules',
                         'deploymentId':'customdeploy_pri_rsm_sl_override_rules',
                         'params':{custpage_rectype: REC.type, custpage_recid: REC.id}
                     });
                      
                     context.form.addButton({
                         id : 'custpage_rsm_override_rules', 
                         label : (rsm.overrideRulesSuiteletLabel || "Override Rules"), 
                         functionName:"window.open('" + urlLoc + "', '_blank');"
                     });                	 
                 }
                 
                 if (rsm.overridableRulesCount() > 0)
                	 showInlineOverrideRulesSuitelet(context, rsm);
                 

                 if (rsm.userCanAddOptionalRules()) {
                     var urlLoc = url.resolveScript({
                         'scriptId':'customscript_pri_rsm_sl_add_opt_rules',
                         'deploymentId':'customdeploy_pri_rsm_sl_add_opt_rules',
                         'params':{custpage_rectype: REC.type, custpage_recid: REC.id}
                     });
                      
                     context.form.addButton({
                         id : 'custpage_rsm_add_rules', 
                         label : (rsm.addRulesSuiteletLabel || "Add Rules"), 
                         functionName:"window.open('" + urlLoc + "', '_blank');"
                     });    
                     
                 }
                 

             } catch (e) {
         		log.error(funcName, e);
             }
                          
	    };
	    
	    
    	/* ======================================================================================================================================== */

	    function generateSummaryHTML(form, rsm) {
	    	var funcName = scriptName + "generateSummaryHTML"; 
	    	
	    	log.debug(funcName, "Starting"); 
	    	
	    	if (!rsm.showRuleSummary) 
	    		return;

	    	 
	    	var rules = rsm.rules;
	    	var ruleInstances = rsm.ruleInstances;
	    	 	    	 
	    	var showRuleCount = 0;
                                      
             var table = '<style>' + rsm.summaryTableCSS + '</style><table cellspacing="0" id="custpage_rsm_summary"><thead><tr><th>' + rsm.ruleNameSingular.toUpperCase() + '</th>';
             
//             if (!rsm.showOnlyFailedRules) 
                 table += "<th>STATUS</th>";
            	 
             table += "<th>EXPLANATION</th></tr></thead><tbody>{data}</tbody></table>";
             	    	 
             var d = [];
             d.push("<br>");
             
             for (var r = 0; r < ruleInstances.length; r++) {
            	 var ruleInstance = ruleInstances[r];
            	 var rule = rules[ruleInstance.ruleId];
            	 
            	 if (ruleInstance.id) {
    	    		 // log.debug(funcName, "evaluating rule: " + JSON.stringify(rule));
                     var btnlbl = rule.buttonLabel;
                     var ruleid = rule.id;

                     var showRule = rsm.showRuleOnSummaryTable(ruleInstance); 
                     
                     if (showRule) {
                    	 showRuleCount++;
                         
                    	 var rowClass = "rsm_" + ruleInstance.statusName.toString().toLowerCase().replace(/ /g,"");
                    	 
                         /** Create rows for failure **/
                         d.push('<tr class="' + rowClass + '">');
                         d.push('<td class="' + rowClass + ' rsm_ruleName">' + ruleInstance.ruleName + '</td>');
                         
//                         if (!rsm.showOnlyFailedRules)
                             d.push('<td class="' + rowClass + ' rsm_statusName ">' + ruleInstance.statusName + '</td>');
                        	 
                         d.push('<td class="' + rowClass + ' rsm_statusMessage">' + ruleInstance.failureDetails + '</td>');
                         d.push('</tr>');

                     } // show rule
            		 
            	 } // if the instance has an ID

             }	// rule loop

             
             if (showRuleCount > 0) {
                 table = table.replace('{data}', d.join(''));

                 if (rsm.ruleSummaryPlacement) {
                	 
                	 log.debug(funcName, "Placing field before " + rsm.ruleSummaryPlacement); 
                	 
                     var html = form.addField({
                          'id':'custpage_status_hold',
                          'label':rsm.summaryTitle,
                          'type': serverWidget.FieldType.INLINEHTML,
                     });
                     html.defaultValue = table;
                     
                     form.insertField({field: html, nextfield: rsm.ruleSummaryPlacement}); 
            		 
            	 } else {
            		 
            		 log.debug(funcName, "Placing field into its own group"); 
            		 
                     form.addFieldGroup({'id':'custpage_pri_rsm_summary_grp',label: rsm.summaryTitle});
                     
                     table = table.replace('{data}', d.join(''));
                     var html = form.addField({
                          'id':'custpage_status_hold',
                          'label':rsm.summaryTitle,
                          'type': serverWidget.FieldType.INLINEHTML,
                          'container': 'custpage_pri_rsm_summary_grp'
                     });
                     html.defaultValue = table;
            	 }                     
             }
             
	    } // generateSummaryHTML
	    	    
    	/* ======================================================================================================================================== */
	    
	    function showInlineOverrideRulesSuitelet(context, rsm) {
	    	var funcName = scriptName + "showInlineOverrideRulesSuitelet"; 
	    	
			var form = context.form;
			var newTabId = "custpage_tab_clear_rules"; 
			
			// if we don't know on which tab to put this, then exit
			if (!rsm.overrideRulesTab)
				return; 
						
			var subTab = form.getTab(rsm.overrideRulesTab);
			
			// if we can't find that tab, get out
			if (!subTab) 
				return;

			var clearTab = form.addSubtab({id : newTabId, label : rsm.overrideTabLabel, tab: rsm.overrideRulesTab});

			var scriptURL = url.resolveScript({
                'scriptId':'customscript_pri_rsm_sl_override_rules',
                'deploymentId':'customdeploy_pri_rsm_sl_override_rules',
                'params':{custpage_rectype: context.newRecord.type, custpage_recid: context.newRecord.id}
			});
			
			var fld = form.addField({
				id : 'custpage_clear_rules',
				label : 'HTML IFRAME Container',
				type : serverWidget.FieldType.INLINEHTML,
				container : newTabId
			});
						
			fld.defaultValue = '<iframe name="custpage_iframe_suiteletinput" '
					+ 'src="'
					+ scriptURL
					+ '&custparam_hidenavbar=T&ifrmcntnr=T'
					+ '" '
					+ 'width="100%" height="600" '
					+ 'frameborder="0" '
					+ 'longdesc="Clear Rules"></iframe>';		    		

	    }
	    
	    
    	/* ======================================================================================================================================== */
	    
		function afterSubmit(context){
			
	    	var funcName = scriptName + "afterSubmit " + context.type + " " + context.newRecord.type + " " + context.newRecord.id + " via " + runtime.executionContext;
	    	
	    	// if the record is being changed by the RSM bundle itself, then ignore the change
	    	var ERR = error.create({name: "dummy", message: "dummy"});
	    	
	    	if (ERR.stack) 
	    		for (var i = 0; i < ERR.stack.length; i++) {
	    			var scriptName = ERR.stack[i];
	    			if (scriptName.indexOf("PRI_RSM_SC_EvaluateRecord.js") >= 0 || scriptName.indexOf("PRI_RSM_MR_EvaluateRecord.js") >= 0)
	    				return;
	    		}
	    	
	    	
	    	// in an XEDIT (inline edit) context, we don't want to fire if we are in a SCHEDULED script, because that's how RSM changes status fields; 
	    	//		if we did fire, we would loop again and cause RSM to execute recurisvely a 2nd time; 
	    	//		that shouldn't cause an ENDLESS loop because the 2nd instance should not cause any further changes, but still, it is unnecessary
//            if (!(context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT || context.type == context.UserEventType.APPROVE || (context.type == context.UserEventType.XEDIT && runtime.executionContext != runtime.ContextType.SCHEDULED)))
//            	return;            	
            
             try {

            	 var REC = record.load({type: context.newRecord.type, id: context.newRecord.id});
            	 
            	 // process the record; if it needs to be scheduled in the background, the engine will schedule it
            	 
    	    	 var rsm = rsmEngine.createRecordStateManager(REC);      
  	    	 
    	    	 if (!rsm)
    	    		 return; 
    	    	 
    	    	 if (context.type == context.UserEventType.CREATE)
    	    		 rsm.evaluateRecord(rsmConstants.RULE_STATUS_CHECK_TYPE.RECORD_CREATE);
            	 else
            		 rsm.evaluateRecord(rsmConstants.RULE_STATUS_CHECK_TYPE.RECORD_EDIT);
            	             	 
             } catch (e) {
         		log.error(funcName, e);
             }
                          
	    };

    	/* ======================================================================================================================================== */
    	/* ======================================================================================================================================== */
    	/* ======================================================================================================================================== */

        return {
        	beforeLoad: beforeLoad,
        	afterSubmit: afterSubmit
        };
    }
);