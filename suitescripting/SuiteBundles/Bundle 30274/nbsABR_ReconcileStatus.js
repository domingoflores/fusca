
/** nbsABR_ReconcileStatusSL - entry point for Process Status Scriptlet
*
* This function provides all the functionality for the Process Status window
* 
* @param {nlobjRequest} request - the request made to the suitelet
* @param {nlobjResponse} response - the response object to write the page to
* 
* @return {void}
*/
function nbsABR_ReconcileStatusSL(request, response)
{
	var form = nlapiCreateForm('Process Status');
	
	var ProcInstId = request.getParameter('processinstanceid');
	var stTitle = request.getParameter('title');
	var stProcess = request.getParameter('process');
	var stAccId = request.getParameter('accountid');

	if(stTitle == null && stTitle == '')
		stTitle = 'ABR Process Status';
	if(stProcess == null && stProcess == '')
		stProcess = 'process';
	if(stAccId == null)
		stAccId = '';

	nbsABR_RenderReconcileStatusForm(form,'Edit',ProcInstId,stTitle, stProcess,stAccId);
	response.writePage(form);
}

/** nbsABR_RenderReconcileStatusForm - page builder for Process Status SL
*
*@param (form) the current form
*@param	(string) setupState indicates whether action is GET, Refresh, Submit
*@param (string) instanceId internalid of process instance
*@param (string) title of the process being run
*@param (string) process name of the process being run
*@param (string) accountId internalid of Reconcile Account
*
*@return(void)
*/
function nbsABR_RenderReconcileStatusForm(form,setupState,instanceId, title,process,accountId)
{
	form.setTitle(title);
	
	form.setScript('customscript_nbsabr_reconstatus_c');  

	form.addFieldGroup( 'grp_status', 'Current Status');
	form.addFieldGroup( 'grp_next', 'Where next?');
	form.addFieldGroup( 'grp_other', ' ');

	var fld_status = form.addField('procstatus','inlinehtml','Process Status',null,'grp_status');
	fld_status.setLayoutType('normal', 'none');

	var fld_numberprocessed = form.addField('numberprocessed','inlinehtml','Records processed:',null,'grp_status');
	fld_numberprocessed.setLayoutType('startrow', 'none');

	// ignore user as causes too many permission errors!!
/*	var fld_user = form.addField('user','text','User:',null,'grp_status');
	fld_user.setDisplayType('inline');
	fld_user.setLayoutType('startrow', 'none');
*/
	form.addField('break','inlinehtml','',null,'grp_status').setDefaultValue('<BR><BR>');

	// adding a hidden field to hold the record's ID value
	// this will be used for POST calls
	var fld_instid = form.addField('processinstanceid', 'text', 'hidden',null,'grp_other');
	fld_instid.setDisplayType('hidden');
	fld_instid.setDefaultValue(instanceId);

	var fld_process = form.addField('process', 'text', 'hidden',null,'grp_other');
	fld_process.setDisplayType('hidden');
	fld_process.setDefaultValue(process);

	var fld_title = form.addField('title', 'text', 'hidden',null,'grp_other');
	fld_title.setDisplayType('hidden');
	fld_title.setDefaultValue(title);

	//var fld_account = form.addField('accountid', 'select', 'AccountId','account','grp_other');
	var fld_account = form.addField('accountid', 'select', 'AccountId','customrecord_nbsabr_accountsetup','grp_other');
	fld_account.setDisplayType('hidden');
	fld_account.setDefaultValue(accountId);

	var rProcessInfo;
	var procStatus = '';
	var l_RecordCount;
	var procMsg;
	var statusMsg = '';
	var updateMsg = '';

	/* from menu option 
	 * but what about multiple script queues?*/
	if( (instanceId == null) || (instanceId == '') )
	{
		var sf = [];
		sf[0] = new nlobjSearchFilter('custrecord_bgpfunctionname',null,'startswith', 'nbsABR',null);
		sf[1] = new nlobjSearchFilter('custrecord_bgpprocstatus',null,'is', '1',null); // in progress
		sf[2] = new nlobjSearchFilter('isinactive',null,'is','F');
		var sc = new Array();
		sc[0] = new nlobjSearchColumn('custrecord_bgpprocstatus');
		sc[1] = new nlobjSearchColumn('custrecord_bgpstatedefn');
		sc[2] = new nlobjSearchColumn('custrecord_bgpprocstate');
		sc[3] = new nlobjSearchColumn('custrecord_bgpreccount');
		sc[4] = new nlobjSearchColumn('custrecord_bgpusername');
		sc[5] = new nlobjSearchColumn('custrecord_bgpprocmsg');
		sc[6] = new nlobjSearchColumn('custrecord_bgpprocessname');
		sc[7] = new nlobjSearchColumn('internalid');
		sc[7].setSort(true);// sort by internalid DESC

		var instRec = nlapiSearchRecord('customrecord_ncbgp_procinstance',null,sf,sc);
		if(instRec == null)
		{
			fld_numberprocessed.setDisplayType('hidden');
			form.setTitle('ABR Process Status');
			fld_status.setDefaultValue('There are no ABR processes running.');
			
			// what is TASKLINK list of custom record entries??
		/*	var url_proc_inst = nlapiResolveURL('TASKLINK', 'EDIT_CUST_NCBGP_PROCINSTANCE');
			var fld_piLink = form.addField('custpage_instructions','inlinehtml','').setDisplayType('inline');
			fld_piLink.setDefaultValue('<font style="font-size:9pt;"><A <B><A HREF=" '+ url_proc_inst +' ">Process Instance</A></B> List</font>');
			fld_piLink.setLayoutType('outsidebelow','startrow');*/
			return;
		}
		else
		{
			instanceId = instRec[0].getId();
			rProcessInfo = instRec[0];
			procStatus = rProcessInfo.getValue('custrecord_bgpprocstatus');
			procStatusText = rProcessInfo.getText('custrecord_bgpprocstatus');
			l_RecordCount = rProcessInfo.getValue('custrecord_bgpreccount');
			procUser = rProcessInfo.getValue('custrecord_bgpusername');
			procMsg = rProcessInfo.getValue('custrecord_bgpprocmsg');
			procDefn = rProcessInfo.getValue('custrecord_bgpstatedefn');
			procState = rProcessInfo.getValue('custrecord_bgpprocstate');
			procFnName = rProcessInfo.getValue('custrecord_bgpprocessname');
	
			switch(procFnName)
			{
				case 'ABR Reconciliation':
					process = 'reconcile';
					break;
				case 'ABR Import Bank File':
					process = 'import';
					break;
				case 'ABR DeleteReconciliation':
					process = 'delete reconciliation';
					break;
				case 'ABR Proposal':
					process = 'automatch';
					break;
				case 'ABR Prepare Reconciliation':
					process = 'extract';
					break;
				case 'ABR Cleardown':
					process = 'account initialisation';
					break;
					
				default:
					process = 'process';
			}
			form.setTitle(procFnName+' Status');
			
		}
	}
	else/* read process instance record directly */
	{
		rProcessInfo = nlapiLoadRecord('customrecord_ncbgp_procinstance', instanceId);
		procStatus = rProcessInfo.getFieldValue('custrecord_bgpprocstatus');
		procStatusText = rProcessInfo.getFieldText('custrecord_bgpprocstatus');
		l_RecordCount = rProcessInfo.getFieldValue('custrecord_bgpreccount');
		procUser = rProcessInfo.getFieldValue('custrecord_bgpusername');
		procMsg = rProcessInfo.getFieldValue('custrecord_bgpprocmsg');
		procDefn = rProcessInfo.getFieldValue('custrecord_bgpstatedefn');
		procState = rProcessInfo.getFieldValue('custrecord_bgpprocstate');
	}
	
	// get link to process instance record
	var recLinkURL = nlapiResolveURL('RECORD', 'customrecord_ncbgp_procinstance', instanceId);

	// add field with instruction text...
	var fld_Instruction = form.addField('custpage_instructions','inlinehtml','');
	fld_Instruction.setDisplayType('inline');
	fld_Instruction.setDefaultValue('<font style="font-size:9pt;"><BR>NetSuite provides a script queue for running scheduled scripts in the background including scripts used by the ABR module for reconciliation processing.<BR>'
			+'A <B><A HREF=" '+ recLinkURL +' ">Process Instance</A></B> record is created for each ABR process initiated and monitors current activity.<BR>'
			+'(Lists > Custom Records > Background Processing Status)</font>');
	fld_Instruction.setLayoutType('outsidebelow','startrow');
	
	var fld_Branding = form.addField('moduletitle','inlinehtml');
	fld_Branding.setDisplayType('inline');
	fld_Branding.setDefaultValue('<font color="navy"><BR><B>Advanced Bank Reconciliation</B>, by Nolan Business Solutions</font>');
	fld_Branding.setLayoutType('outsidebelow','startrow');
	
	//set process status
	if (procStatus === null)
		procStatus = '';
	switch( procStatus.toString() )
	{
		case '1':	// in progress
			statusMsg += 'Your '+process+' is currently <b>in progress.</b>';
			updateMsg = l_RecordCount + ' record(s) have been processed.<BR>To monitor the progress of this process, please click the refresh button';
			form.addSubmitButton('Refresh');
			break;
		case '2':	// complete
			statusMsg += 'Your '+process+' is <b>complete.</b>';
			updateMsg = l_RecordCount + ' record(s) have been processed.';

			var fld_reconReqLink = form.addField('reclink','inlinehtml','',null,'grp_next');
			var reconLinkURL = nlapiResolveURL('SUITELET', 'customscript_nbsabr_reconcile', 'customdeploy_nbsabr_reconcile')+
												'&accountid='+accountId;
			fld_reconReqLink.setDefaultValue('<BR>Click <B><A HREF=" ' + reconLinkURL +' ">here</A></B> to reconcile a bank statement<BR>');
			break;
		case '3':
			statusMsg = 'Completed with errors';
			break;
		case '4':
			statusMsg = 'Failed : '+procMsg;
			//var fld_processRecLink = form.addField('processlink','inlinehtml','',null,'grp_next');
			//var recLinkURL = nlapiResolveURL('RECORD', 'customrecord_ncbgp_procinstance', instanceId);
			//fld_processRecLink.setDefaultValue('<BR>Click <B><A HREF=" ' + recLinkURL +' ">here</A></B> to view process control record.<BR>');
			break;
		case '5':	// queued
			statusMsg = 'Your '+process+' is <b>pending.</b>';
			form.addSubmitButton('Refresh');
			break;
		default:
			statusMsg = 'No record found';
	}
	fld_status.setDefaultValue(statusMsg);
	fld_numberprocessed.setDefaultValue(updateMsg);	
}
