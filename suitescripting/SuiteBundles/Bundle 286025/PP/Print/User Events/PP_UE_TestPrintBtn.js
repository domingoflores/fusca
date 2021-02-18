/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       03 Jan 2013     Jay
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord customrecord_pp_printer_offsets
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function userEventBeforeLoad(type, form, request){
    if(type == 'edit'){
	    form.addButton('custpage_pp_test_print', 'Print Test', 'printTest();');
	    var jobid = form.addField('custpage_pp_test_print_jobid', 'inlinehtml');
	    jobid.setDefaultValue('<input type="hidden" id="jobid" />');
    }
}