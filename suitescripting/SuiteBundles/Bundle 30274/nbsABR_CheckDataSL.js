/** nbsABR_CheckDataSL - entry point for Check Data Scriptlet
*
* This function provides all the functionality for the Check Data window.
* Accessed via the menu link ABR > Reconcile > Reconcile Bank Statement.
* 
* 
* @param {nlobjRequest} request - the request made to the suitelet
* @param {nlobjResponse} response - the response object to write the page to
* 
* @return {void}
*/
function nbsABR_CheckDataSL(request, response)
{
	// validate pre-requisites (e.g. Translate bundle)
	try {
		// attempt to retrieve resources record
		nlapiSearchRecord(nbsTRANSL_RT_Resources.ScriptId,null,null,null);
		
	} catch (X){
		var form = nlapiCreateForm('Check Data');
		var errMsg = form.addField('custpage_errormessage', 'inlinehtml', 'Error');
		errMsg.setDefaultValue('<BR><b>Unable to retrieve translation details.<BR><BR>Please install bundle - Multi-Language (id: 21459)</b><BR><BR>Error:'+X.toString());
		response.writePage(form);
		return;
	}

	var ctx = nlapiGetContext();
	var objResources = nbsTRANSL_getResources(ctx);		// get JS object of resources

	var form = nlapiCreateForm(objResources[NBSABRSTR.CHKDATA], false);	// 'Check Data'
	form.setScript('customscript_nbsabr_checkdata_c');
	//var reconAcctId = ''; // internalid of Account
	
	if (request.getMethod() == 'GET') {
		var fld_msg = form.addField('msg', 'inlinehtml');
		// 'Before you reconcile a bank account, please ensure all transactions are extracted into ABR.'
		// 'Select an account to extract transactions or to reconcile an account.'
		var stMsg = '<font style="font-size:10pt;"><BR>'+objResources[NBSABRSTR.BEFORERECONEXTRACTALL]+'<BR>'
				+objResources[NBSABRSTR.SELECTACCTEXTRACTRECON]+'</font>';
		fld_msg.setDefaultValue(stMsg);
		
		var fld_reconacct = form.addField('custpage_reconacct', 'select',objResources[NBSABRSTR.BNKACCNT],null,'bankdetails');
		fld_reconacct.setMandatory(true);
		fld_reconacct.setHelpText(objResources[NBSABRSTR.SELECTRECONACCT]);	// ('Select a reconcile account.');
		
		// populate list of bank accounts from list of account setup records
		var filters = [	new nlobjSearchFilter('isinactive',null,'is','F',null)];
		
		var cols = [new nlobjSearchColumn('custrecord_accsetup_accountname'),
		            new nlobjSearchColumn('custrecord_accsetup_accountnumber')];
		cols[0].setSort();	// accountname
		
		var bankAccts = nlapiSearchRecord('customrecord_nbsabr_accountsetup', null, filters, cols);
		
		// populate account options list
		fld_reconacct.addSelectOption('', '');
		for(var i =0; bankAccts != null && i < bankAccts.length; ++i)
		{
			var strAccName = bankAccts[i].getValue('custrecord_accsetup_accountname');//mandatory
			var strAccNumber = bankAccts[i].getValue('custrecord_accsetup_accountnumber');//mandatory
			var id = bankAccts[i].getId();
			fld_reconacct.addSelectOption(id, strAccName+' '+strAccNumber);
			
			//fld_bankaccount.addSelectOption(bankAccts[i].getId(), bankAccts[i].getValue('custrecord_accsetup_accountname'), false);
		}
		
		// hidden field for POST calls
		form.addField('ncactionid','text','Action(hidden)',null,'bankdetails').setDisplayType('hidden');
		
		//Branding
		var fld_Branding = form.addField('moduletitle','inlinehtml');
		// <B>Advanced Bank Reconciliation</B> by Nolan Business Solutions Plc
		fld_Branding.setDefaultValue('<font color="navy"><BR><B>'+objResources[NBSABRSTR.ABR]+'</B> '+objResources[NBSABRSTR.BYNBS]+'</font>');
		
		// Extract button
		form.addButton('yes',objResources[NBSABRSTR.EXTRACT],"if (window.isinited && window.isvalid && save_record(true)){main_form.ncactionid.value='yes';main_form.submit();}");
		// Reconcile button
		form.addButton('no',objResources[NBSABRSTR.RCNL],"if (window.isinited && window.isvalid && save_record(true)){main_form.ncactionid.value='no';main_form.submit();}");
		
		try {
			response.writePage(form);			

		} catch (e) {
			var msg = '';
			if (e instanceof nlobjError) {
				msg = e.getCode() + '\n' + e.getDetails();
			} else {
				msg = 'Error:' + e.toString();
			}
			response.write(msg);
		}
	} else // POST
	{
		var strAction = request.getParameter('ncactionid');
		var slParams = [];
		slParams['custparam_reconacctid'] =  request.getParameter('custpage_reconacct');
	
		if(strAction == 'yes'){// click Yes to redirect to Extract window
			nlapiSetRedirectURL('SUITELET', 'customscript_nbsabr_preparerecon','customdeploy_nbsabr_preparerecon', null, slParams);
		}
		else{// click No to redirect to Reconcile window
			nlapiSetRedirectURL('SUITELET', 'customscript_nbsabr_reconcile','customdeploy_nbsabr_reconcile', null, slParams);
		}
	}
}