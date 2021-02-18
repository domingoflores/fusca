/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 
 * -----------------------------------------------------------
 * changeButtonColor.js
 * ___________________________________________________________
 * 
 * 
 * Version 1.0  Alana Thomas
 * ___________________________________________________________
 */

define(['N/ui/serverWidget', 'N/file'],
	function(serverWidget, file) {

		function beforeLoad(context) {
			var cssFile = file.load({
				id: 10926702
			}).getContents();

			myForm = context.form;
			var buttonHTML = myForm.addField({
				id: 'custpage_buttonhtml',
				label: 'Button HTML',
				type: serverWidget.FieldType.INLINEHTML
			});

			buttonHTML.defaultValue = "<style>" + cssFile + "</style>";
		}

		return {
			beforeLoad: beforeLoad
		};
	}
);