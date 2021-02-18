/* *************************************************
 * ABR, Nolan Business Plc
 *
 * ABR Import Status SL
 *
 * Version History
 * 		8/8/2011 	C.bbShaw		Initial version created
 */

/* nbsABR_ImportStatusSL - entry point for System Status SL */
function nbsABR_ImportStatusSL(request, response)
{
	// validate pre-requisites (e.g. Translate bundle)
	try {
		// attempt to retrieve resources record
		nlapiSearchRecord(nbsTRANSL_RT_Resources.ScriptId,null,null,null);
		
	} catch (X){
		var form = nlapiCreateForm('Import File Status');
		var errMsg = form.addField('custpage_errormessage', 'inlinehtml', 'Error');
		errMsg.setDefaultValue('<BR><b>Unable to retrieve translation details.<BR><BR>Please install bundle - Multi-Language (id: 21459)</b><BR><BR>Error:'+X.toString());
		response.writePage(form);
		return;
	}
	
	var ctx = nlapiGetContext();
	// get JS object of resources
	var objResources = nbsTRANSL_getResources(ctx);			

	var form = nlapiCreateForm(objResources[NBSABRSTR.IMPRTFLSTTS]);	// 'Import File Status'
	var ProcInstId;

	if (request.getMethod() == 'GET')
	{
		ProcInstId = request.getParameter('processinstanceid');
	}
	else	// returning from user submit/refresh
	{
		ProcInstId = request.getParameter('hidden_field');
	}
	nbsABR_RenderImportStatusForm(form,'Edit',ProcInstId, objResources);
	response.writePage(form);
}

/* ncEP_RenderStatusForm - page builder for System Status SL
 *
 * This function builds the tabs, fields and buttons for the System Status window
 *
 * Parameters:
 * 		form		- the current form
 * 		setupState	- indicates whether creating a 'New' record or doing an 'Edit'
 * 		
 */
function nbsABR_RenderImportStatusForm(form,setupState,instanceId, objResources, count)
{
	form.addFieldGroup( 'grp_status', objResources[NBSABRSTR.CRRNTSTTS]);	// 'Current Status'
	form.addFieldGroup( 'grp_next', objResources[NBSABRSTR.WHRNXT]);	// 'Where next?'
	form.addFieldGroup( 'grp_other', ' ');

	var fld_status = form.addField('procstatus','inlinehtml',objResources[NBSABRSTR.PRCSSSTTS],null,'grp_status');	// 'Process Status'
	fld_status.setDisplayType('inline');
	fld_status.setLayoutType('normal', 'none');
	
	var fld_numberprocessed = form.addField('numberprocessed','integer',objResources[NBSABRSTR.RCRDSPRCSSD],null,'grp_status');	// 'Records processed:'
	fld_numberprocessed.setDisplayType('inline');
	fld_numberprocessed.setLayoutType('outsidebelow', 'startrow');
			
/*	var fld_user = form.addField('user','text','User:',null,'grp_status');
	fld_user.setDisplayType('inline');
	fld_user.setLayoutType('startrow', 'none');
*/	
	form.addField('break','inlinehtml','',null,'grp_status').setDefaultValue('<BR><BR>');
		
	var fld_reconReqLink = form.addField('reclink','inlinehtml','',null,'grp_next');
	var reconLinkURL = nlapiResolveURL('SUITELET', 'customscript_nbsabr_reconcile', 'customdeploy_nbsabr_reconcile');
	// <BR>Click <B><A HREF=" ' + reconLinkURL +' ">here</A></B> to reconcile a bank statement<BR>
	// --> 'Click <#linkstart>here<#linkend> to reconcile a bank statement'
	var linkTxt = objResources[NBSABRSTR.LNKRECON].replace('<#linkstart>','<B><A HREF="'+reconLinkURL+'">').replace('<#linkend>','</A></B>');
	fld_reconReqLink.setDefaultValue('<BR>'+linkTxt+'<BR>');
	
	var fld_ProcLink = form.addField('proclink','inlinehtml','',null,'grp_next');
	var procLinkURL = nlapiResolveURL('RECORD', 'customrecord_ncbgp_procinstance', instanceId);
	// <BR>Click <B><A HREF=" ' + procLinkURL +' ">here</A></B> to view process logs<BR>
	// --> 'Click <#linkstart>here<#linkend> to view process logs'
	linkTxt = objResources[NBSABRSTR.LNKPROCLOG].replace('<#linkstart>','<B><A HREF="'+procLinkURL+'">').replace('<#linkend>','</A></B>');
	fld_ProcLink.setDefaultValue('<BR>'+linkTxt+'<BR>');
	
	// adding a hidden field to hold the record's ID value
	// this will be used for POST calls
	var fld_hidden = form.addField('hidden_field', 'text', 'hidden',null,'grp_other');
	fld_hidden.setDisplayType('hidden');
	fld_hidden.setDefaultValue(instanceId);
	fld_hidden.setLayoutType('startrow', 'none');

	var fld_Branding = form.addField('moduletitle','inlinehtml');
	fld_Branding.setDisplayType('inline');
	// <B>Advanced Bank Reconciliation</B> by Nolan Business Solutions Plc
	fld_Branding.setDefaultValue('<font color="navy"><BR><B>'+objResources[NBSABRSTR.ABR]+'</B> '+objResources[NBSABRSTR.BYNBS]+'</font>');
	fld_Branding.setLayoutType('normal', 'none');
	
	form.addSubmitButton(objResources[NBSABRSTR.RFRSH]);	// 'Refresh'
	
	var rProcessInfo;
	var procStatus = '';
	// var procStatusText;
	var l_RecordCount;
	// var procUser;
	// var procMsg;
	var statusMsg = '';
	
	/* from menu option */
	if( (instanceId === null) || (instanceId == '') )
	{
		var sf = [];
		sf[0] = new nlobjSearchFilter('custrecord_bgpfunctionname',null,'is', 'nbsABR_ImportFileBG',null);
		sf[1] = new nlobjSearchFilter('custrecord_bgpprocstatus',null,'is', '1',null); // in progress
		sf[2] = new nlobjSearchFilter('isinactive',null,'is','F');
		var sc = new Array();
		sc[0] = new nlobjSearchColumn('custrecord_bgpprocstatus');
		sc[1] = new nlobjSearchColumn('custrecord_bgpstatedefn');
		sc[2] = new nlobjSearchColumn('custrecord_bgpprocstate');
		sc[3] = new nlobjSearchColumn('custrecord_bgpreccount');
		sc[4] = new nlobjSearchColumn('custrecord_bgpprocuser');
		sc[5] = new nlobjSearchColumn('custrecord_bgpprocmsg');
			
		var instRec = nlapiSearchRecord('customrecord_ncbgp_procinstance',null,sf,sc);
		if(instRec == null)
		{
			fld_numberprocessed.setDisplayType('hidden');
	//		fld_user.setDisplayType('hidden');
			fld_status.setDefaultValue(objResources[NBSABRSTR.FLMPRTSCMPLT]);	// 'All file imports are complete.'
			return;
		}
		else
		{			
			instanceId = instRec[0].getId();
			rProcessInfo = instRec[0];
			procStatus = rProcessInfo.getValue('custrecord_bgpprocstatus');
			procStatusText = rProcessInfo.getText('custrecord_bgpprocstatus');
			l_RecordCount = rProcessInfo.getValue('custrecord_bgpreccount');
			procUser = rProcessInfo.getText('custrecord_bgpprocuser');
			procMsg = rProcessInfo.getValue('custrecord_bgpprocmsg');
			procDefn = rProcessInfo.getValue('custrecord_bgpstatedefn');
			procState = rProcessInfo.getValue('custrecord_bgpprocstate');
		}
	}
	else/* read process instance record directly */
	{
		rProcessInfo = nlapiLoadRecord('customrecord_ncbgp_procinstance', instanceId);
		procStatus = rProcessInfo.getFieldValue('custrecord_bgpprocstatus');
		procStatusText = rProcessInfo.getFieldText('custrecord_bgpprocstatus');
		l_RecordCount = rProcessInfo.getFieldValue('custrecord_bgpreccount');
		procUser = rProcessInfo.getFieldText('custrecord_bgpprocuser');
		procMsg = rProcessInfo.getFieldValue('custrecord_bgpprocmsg');
		procDefn = rProcessInfo.getFieldValue('custrecord_bgpstatedefn');
		procState = rProcessInfo.getFieldValue('custrecord_bgpprocstate');
	}
		
	// var updateMsg = l_RecordCount + ' record(s) processed.';
	
	switch( procStatus.toString() )
	{
		case '1':	// in progress
			statusMsg += objResources[NBSABRSTR.INPRGRSS];	// 'In progress';
			break;
		case '2':	// complete
			statusMsg += objResources[NBSABRSTR.CMPLT];	// 'Complete';
			break;
		case '3':	
			statusMsg = objResources[NBSABRSTR.CMPLTERR];	// 'Completed with errors';
			break;
		case '4':
			statusMsg = objResources[NBSABRSTR.FLD];	// 'Failed';
			break;
		case '5':	// queued
			statusMsg = objResources[NBSABRSTR.PNDNG];	// 'Pending';
			break;
		default:
			statusMsg = objResources[NBSABRSTR.NRCRDFND];	// 'No record found';
	}
	fld_status.setDefaultValue(statusMsg);
	fld_numberprocessed.setDefaultValue(l_RecordCount);
//	fld_user.setDefaultValue(procUser);		
	
}
