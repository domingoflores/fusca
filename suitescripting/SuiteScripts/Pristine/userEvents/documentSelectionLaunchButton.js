/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/url', 'N/ui/serverWidget'],

	/**
	 * -----------------------------------------------------------
	 * documentSelectionLaunchButton.js
	 * ___________________________________________________________
	 * Module 
	 * 
	 * Version 1.0
	 * Author: Ken Crossman
	 * ___________________________________________________________
	 */

	function(record, search, url, serverWidget) {

		function beforeLoad(context) {
			'use strict';
			// log.debug({
			// 	title: 'Function beforeLoad:',
			// 	details: 'context: ' + JSON.stringify(context)
			// });

			// Get the event type
			var eventType = context.type;

			var newRec = '';
			switch (context.type) {
				case context.UserEventType.VIEW:
				case context.UserEventType.EDIT:
					//Define the parameters of the Suitelet that will be executed.
					newRec = context.newRecord;
					var dealEventID = newRec.getValue('id');
					
					var linkURL = url.resolveScript({
						scriptId: 'customscript_doc_selection',
						deploymentId: 'customdeploy_doc_selection',
						returnExternalUrl: false,
						params: {
							custscript_dss_deal_event: dealEventID
						}
					});

					var buttonFunction = "require(['N/https'], function(https) {" +
						"window.open('" + linkURL + "','" + "_blank" + "');" + //call suitelet
						"});";
				
					context.form.addButton({
						id: 'custpage_launch_doc_selection',
						label: 'Document Selection 2.0',
						functionName: buttonFunction
					});

					break;
				default:
					return;
			}
		}

		return {
			beforeLoad: beforeLoad
		};
	});