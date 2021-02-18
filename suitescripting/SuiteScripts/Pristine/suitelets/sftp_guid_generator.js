/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define(['N/ui/serverWidget'],

/**
 * -----------------------------------------------------------
 * sftpPasswordGuid.js
 * ___________________________________________________________
 * Generate a Password GUID for use in an SFTP connection
 *
 * Version 1.0
 * Author: Peter Gail, TJ Tyrrell
 * ___________________________________________________________
 */


/**
 * Generate a Password GUID for use in
 * an SFTP connection
 * @param  {object} serverWidget NetSuite ServerWidget Module
 * @return {null}              void
 */
function(serverWidget) {

	/**
	 * Create an SFTP Password GUID
	 * @param  {Object} context NetSuite built-in context object
	 * @return {null}         void
	 */
	function createPasswordGuid(context) {
		var request = context.request;
		var response = context.response;

	/* ------- GET ------- */
		if (request.method == 'GET') {
			var form = serverWidget.createForm({
			    title : 'SFTP Guid Generator Form'
			});
			var sendButton = form.addSubmitButton({
				id: 'sftp_guidgen_button',
				label: 'Generate SFTP Password GUI'
			});

			var field = form.addCredentialField({
				id : 'custpage_passwordguid',
				label : 'Password',
				restrictToDomains: '146.20.146.9',
				// restrictToDomains: 'system.netsuite.com', ????
				restrictToScriptIds: ['customscript_pay_file_call_sched_script', 'customscript_sftp_blackline', 'customscript_sftp_blackline_scheduled']
			});

			response.writePage(form);
		}

	/* ------- POST ------- */
		else if (request.method == 'POST') {

			response.write(request.parameters.custpage_passwordguid);
			return;
		}

	} // Send

 /* ------- MODULE ------- */

    return {
    	onRequest: createPasswordGuid
    };

}); // Class