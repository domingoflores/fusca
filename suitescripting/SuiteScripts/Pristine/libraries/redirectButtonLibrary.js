/**
 * addRedirectButtonToRecordForm.js
 * @NApiVersion 2.x
 * @NModuleScopt public
 */
define(['N/runtime', 'N/ui/serverWidget'],

	/**
	 * -----------------------------------------------------------
	 * addRedirectButtonToRecordForm.js
	 * ___________________________________________________________
	 * Places a button on a form that redirects to a user-provided
	 * URL. Returns the ID of the button created.
	 * 
	 * Options:
	 * context : REQUIRED, Object
	 			the context object taken from the User Event
	 *			script that calls this library
	 * linkURL : REQUIRED, string 
	 * 			the link to the Suitelet/record/saved search, etc.
	 *			the button will redirect the user to (see N/url
	 *			Module)
	 * label : REQUIRED, string
	 *			the label for the button
	 * buttonID : OPTIONAL, string
	 *			the ID for the button; this must meet NetSuite's 
	 * 			ID requirements, or one will be created out of the
	 * 			given label. DEFAULT: ID will be created using the 
	 *			given label.
	 * target : OPTIONAL, string
	 * 			Follows same format as HTML5's formtarget attribute
	 *			for buttons:
	 *				'_self' : DEFAULT. Loads in same frame.
	 *				'_blank' : Loads in new window/tab.
	 * 
	 * PLEASE NOTE: You will have to specify the context in which you want the
	 * button to appear. Meaning in your script, you will have to specify if
	 * the method should be called for context.type == 'edit' or 'create' or 
	 * 'view', etc. or use runtime.executionContext == 'USERINTERFACE'
	 *
	 * Sample: 	

	 *@NApiVersion 2.x
	 *@NScriptType UserEventScript
	 *
	define(['N/url', '/SuiteScripts/Pristine/libraries/redirectButtonLibrary.js'],
		function beforeLoad (context) {

				var linkURL = url.resolveScript({
					scriptId: 'customscript_my_script',
					deploymentId: 'customdeploy_my_script'
					// params go here
				});

				redirectButtonLibrary.addRedirectButton({
					context: context,
					linkURL: linkURL, 
					label: 'My Button Label'
				});
		}

		return {
			beforeLoad: beforeLoad
		};
	});

	**
	 *
	 * Version 1.0
	 * Author: Alana Thomas
	 * ___________________________________________________________
	 */

	function(runtime, serverWidget) {

		function addRedirectButton(options) {
			var context = options.context;
			var linkURL = options.linkURL;
			var buttonLabel = options.label;
			var buttonID = options.buttonID;
			var target = options.target;

			if(target == undefined) {
				target = '_self';
			}
			if(buttonID == undefined || checkForBadID(buttonID)) {
				buttonID = createIDFromLabel(buttonLabel);
			}

			var scr = "require(['N/https'], function(https) {"+
			 	"window.open('" + linkURL + "','" + target + "');"+ //call suitelet
			 	"});";

			context.form.addButton({
			 	id : buttonID,
			 	label : buttonLabel,
			 	functionName: scr
			});

			return buttonID;

			function checkForBadID(buttonID) {
				if(buttonID.substring(0,8) != 'custpage') {
					return true;
				}
				if(/^[a-z0-9_]*$/.test(buttonID) == false) {
					return true;
				}
				return false;
			}

			function createIDFromLabel(buttonLabel) {
				return 'custpage_' + 
							buttonLabel.replace(/(?!\w|\s)./g, '')
							.split(' ').join('_')
							.toLowerCase();

			}
		}

		return {
			addRedirectButton: addRedirectButton
		};
	});