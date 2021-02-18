//function ncConst()   // dummy constructor for ncConst object
//{
//}

//ncConst.BGP_ProcessInstance = 'customrecord_ncbgp_procinstance';	/* record type for Process Instance */
//ncConst.BGP_ProcessLog = 'customrecord_ncbgp_proclog';				/* record type for Process Log */

/** nbsABR_DeleteReconciliationSL - entry point for Delete Reconciliation SL 
 *  
 *  This function provides all the functionality for the Delete LastReconciliation window.
 *  
 *  Only the most recent reconciliation may be deleted.
 *  The status Reconciliation State records associated with the statement are changed from"Reconciled" to "Matched".
 *  To unmatch records, the user must use the Reconciliation window.
 *  
 * @param request {nlobjRequest}
 * @param response {nlobjResponse}
 */

function nbsABR_DeleteReconciliationSL(request, response)
{
	var ctx = nlapiGetContext();
	// get JS object of resources
	var objResources = nbsTRANSL_getResources(ctx);
	
	// create form and attach client script
//	var form = nlapiCreateForm('Delete Reconciliation');
	var form = nlapiCreateForm(objResources[NBSABRSTR.DLTRCNCLTN]);
	form.setScript('customscript_nbsabr_deleterecon_c');
	
	if (request.getMethod() == 'GET')
	{
		nbsABR_RenderDeleteReconciliationForm(form,'GET',null,objResources);
		response.writePage(form);
	}
	else	// returning from user submit/refresh
	{
		if(request.getParameter('main_action') == 'Refresh')
		{
			var Params = [];
			Params['bankAccountId'] = request.getParameter('bankaccount');
			nbsABR_RenderDeleteReconciliationForm(form,'POST',Params,objResources);
			response.writePage(form);
		}
		else // delete button
		{
			var reconciliationId = request.getParameter('reconid');
			var reconAcctId = request.getParameter('bankaccount');
			
			// get script number - return one if multiple script queues are not used.
    		var intQNum = getScriptQueueNumber();

			// create a new instance, then set parameter to instance name and call script....
 			var instRec = nlapiCreateRecord(ncConst.BGP_ProcessInstance);
 	//		instRec.setFieldValue('custrecord_bgpprocstatus', '5');		// Queued - in progress if direct call??
 			instRec.setFieldValue('custrecord_bgpprocstatus', '1');	// In Progress
 			instRec.setFieldValue('custrecord_bgpactivitytype', '1');	// Direct
 			instRec.setFieldValue('custrecord_bgpfunctionname', 'nbsABR_DeleteReconciliationBG');
 			instRec.setFieldValue('custrecord_bgpprocessname', 'ABR DeleteReconciliation');
 			// retrieve and set current user id
			// instRec.setFieldValue('custrecord_bgpprocuser', ctx.getUser());//list/record
			instRec.setFieldValue('custrecord_bgpuserid', ctx.getUser());// user id, store as text
			instRec.setFieldValue('custrecord_bgpusername', ctx.getName());// user name
			instRec.setFieldValue('custrecord_bgpscrptqnmbr', intQNum);// script queue number
 			/* update process record */
 			instRec.setFieldValue('custrecord_bgpreccount', '0');
 			instRec.setFieldValue('custrecord_bgpprocmsg', '');
 			instRec.setFieldValue('custrecord_bgpstatedefn',  'ReconciliationId,ReconAcctId');
 			instRec.setFieldValue('custrecord_bgpprocstate', reconciliationId+','+reconAcctId);
 			var instId = nlapiSubmitRecord(instRec,false);
 			
 			// call BG function direct
 			nbsABR_DeleteReconciliationBG(instId, request.getURL(), request.getParameter('custpage_jsid'));

			// redirect to status page
 			var slParams = [];
 			slParams['processinstanceid'] = instId;
 		//	slParams['title'] = 'ABR Delete Reconciliation Status';
 			slParams['title'] = objResources[NBSABRSTR.ABRDLTRCNCLTNSTTS];
 			slParams['process'] = 'Delete Reconciliation';
 			slParams['accountid'] = request.getParameter('bankaccount');
 			nlapiSetRedirectURL('SUITELET', 'customscript_nbsabr_reconcilestatus','customdeploy_nbsabr_reconcilestatus', null, slParams);

		}
	}
}

/** nbsABR_RenderDeleteReconciliationForm - page builder for Delete Reconciliation
*
* This function builds the tabs, fields and buttons for the Delete Reconciliation window
*
*@param (form) the current form
*@param	(string) indicates whether action is GET, Refresh, Submit
*@param (array) parameters (field values) from the form
*@param (object) object containg string translations
*
*/
function nbsABR_RenderDeleteReconciliationForm(form,requesttype,parameters,resources)
{
	var bankAccountId;
//	var mainAction;
	var reconDate;
	var reconEndingBalance;
	var subsidiaryId = null;
	var objResources = resources;

	var jsidField = form.addField('custpage_jsid', 'text', 'JSESSIONID:');
	jsidField.setDisplayType('hidden');

	form.addField('main_action','text','Action(hidden)',null,null).setDisplayType('hidden');
	
	//Bank Account
	var fld_bankaccount = form.addField('bankaccount', 'select',objResources[NBSABRSTR.BNKACCNT],null,null);
	//fld_bankaccount.setLayoutType('normal','none');
	//search & populate list of bank accounts
	var sf = [	new nlobjSearchFilter('isinactive',null,'is','F',null)];
	var sc = [new nlobjSearchColumn('custrecord_accsetup_accountname'),
	          new nlobjSearchColumn('custrecord_accsetup_accountnumber')];
	sc[0].setSort();	// accountname
	sc[1].setSort();	// accountnumber
	if(nbsABR.CONFIG.b_SubsEnabled)
	{
		sc.push(new nlobjSearchColumn('custrecord_accsetup_subsidiary'));
	}
	var bankAccts = nlapiSearchRecord('customrecord_nbsabr_accountsetup', null, sf, sc);
	// populate account options list
	fld_bankaccount.addSelectOption('', '');
	for(var i =0; bankAccts != null && i < bankAccts.length; ++i)
	{
		var strAccName = bankAccts[i].getValue('custrecord_accsetup_accountname');//mandatory
		var strAccNumber = bankAccts[i].getValue('custrecord_accsetup_accountnumber');//mandatory
		fld_bankaccount.addSelectOption(bankAccts[i].getId(), strAccName+' '+strAccNumber);
	}
	
	// add field with instruction text...
	var fld_Instruction = form.addField('custpage_instructions','inlinehtml','');
	fld_Instruction.setDisplayType('inline');
	// 'The last completed reconciliation for an account can be deleted.'
	// 'Select an account and the date of the last reconciliation will be displayed.'
	fld_Instruction.setDefaultValue('<font style="font-size:10pt;">'+objResources[NBSABRSTR.LSTCMPLTRECONDLTD]+'<BR>'
			+objResources[NBSABRSTR.SLCTACCTDTLSTRECONDISP]+'</font>');
	fld_Instruction.setLayoutType('outsidebelow','startrow');
		
	if(requesttype == 'POST')
	{
		// hide instruction field
		fld_Instruction.setDisplayType('hidden');
		//subsidiary
		var fld_subsidiary = null;
		if(nbsABR.CONFIG.b_SubsEnabled)
		{
			fld_subsidiary = form.addField('subsidiary', 'select',objResources[NBSABRSTR.SUBSID],'subsidiary',null);
			fld_subsidiary.setDisplayType('inline');
		}
	
		//statement id
		var fld_reconId = form.addField('reconid', 'select', 'Id','customrecord_nbsabr_statementhistory',null);
		fld_reconId.setDisplayType('hidden');//hidden
	
		//statement date
	//	var fld_date = form.addField('date', 'date', 'Date',null,null);
		var fld_date = form.addField('date', 'date',objResources[NBSABRSTR.DT],null,null);
		fld_date.setDisplayType('inline');
	
		//Ending Balance
		var fld_endingbalance = form.addField('endingbalance', 'currency',objResources[NBSABRSTR.ENDBLN],null,null);
		fld_endingbalance.setDisplayType('inline');
		
		var fld_Branding = form.addField('moduletitle','inlinehtml','');
		//Advanced Bank Reconciliation, by Nolan Business Solutions Plc
		fld_Branding.setDefaultValue('<BR><BR><font color="navy"><B>'+objResources[NBSABRSTR.ABR]+'</B>, '+objResources[NBSABRSTR.BYNBS]+'</font>');
		fld_Branding.setLayoutType('outsidebelow','startrow');
	
		bankAccountId = parameters['bankAccountId'];
			
		var sf = [	new nlobjSearchFilter('custrecord_sh_reconaccount',null,'is',bankAccountId,null)];
		var srRecon = nlapiSearchRecord('customrecord_nbsabr_statementhistory', 'customsearch_nbsabr_statehist_iddesc', sf, null);
		if(srRecon != null && srRecon.length > 0)
		{
			reconDate = srRecon[0].getValue('custrecord_sh_date');
			reconEndingBalance = srRecon[0].getValue('custrecord_sh_endingbalance');
			if(nbsABR.CONFIG.b_SubsEnabled){
				subsidiaryId = srRecon[0].getValue('custrecord_sh_subsidiary');
			}

			fld_bankaccount.setDefaultValue (bankAccountId);
			fld_reconId.setDefaultValue (srRecon[0].getId());
			fld_date.setDefaultValue (reconDate);
			fld_endingbalance.setDefaultValue (reconEndingBalance);
			if(nbsABR.CONFIG.b_SubsEnabled){
				fld_subsidiary.setDefaultValue(subsidiaryId);
			}
		}
		//Delete button
		form.addButton('delete',objResources[NBSABRSTR.DLT],"if (window.isinited && window.isvalid && save_record(true)){window.nlapiSetFieldValue('main_action','Delete');setWindowChanged(window,false);main_form.submit();}");
	}
}