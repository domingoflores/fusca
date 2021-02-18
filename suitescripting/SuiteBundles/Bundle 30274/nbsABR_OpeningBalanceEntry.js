/** *************************************************
 * ABR, � 2012 Nolan Business Solutions Plc
 *
 * Opening Balance Entry Suitelet
 *
 * Version History
 * 		14/08/2012	C.Shaw		Initial version created
 */

/* nbaABR_OpeningBalanceEntry - entry point for Opening Balance Entry Scriptlet
 *
 * This function provides all the functionality for the ABR Opening Balance Entry window
 */

function nbaABR_OpeningBalanceEntry(request, response)
{	
	var form = nlapiCreateForm('Opening Balance Entry',false);
	form.setScript('customscript_nbsabr_openbalentry_c');
	var l_RecordCount = 0;
	var msg = ''; // confirmation message
		
	// validate pre-requisites (e.g. Translate bundle)
	try {
		// attempt to retrieve resources record
		nlapiSearchRecord(nbsTRANSL_RT_Resources.ScriptId,null,null,null);
		
	} catch (X)
	{
		var errMsg = form.addField('custpage_errormessage', 'inlinehtml','Error');
		errMsg.setDefaultValue('<BR><b>Unable to retrieve translation details.<BR><BR>Please install bundle - Multi-Language (Nolan) (id: 21459)</b><BR><BR>Error:'+X.toString());
		response.writePage(form);
		return;
	}
	
	// get JS object of resources for translations
	var ctx = nlapiGetContext();
	var objResources = nbsTRANSL_getResources(ctx);
	form.setTitle(objResources[NBSABRSTR.OPNGBALENTRY]);	// 'Opening Balance Entry'
		
	if(request.getMethod() == 'GET'){	// entry page display
	
		// Reconcile Account  select field
//		var fld_bankaccount = form.addField('reconaccount', 'select', 'Account',null,null);
		var fld_reconaccount = form.addField('reconaccount', 'select',objResources[NBSABRSTR.BNKACCNT],null,null);
		fld_reconaccount.setMandatory(true);
		fld_reconaccount.setHelpText(objResources[NBSABRSTR.SELECTRECONACCT]);	// 'Select a Reconcile Account.'

		// populate select list from active reconcile account records
		var filters = [	new nlobjSearchFilter('isinactive',null,'is','F',null)];
		var cols = [new nlobjSearchColumn('custrecord_accsetup_accountnumber'),
		            new nlobjSearchColumn('custrecord_accsetup_accountname')];
		cols[1].setSort(); // sort by account name
		var bankAccts = nlapiSearchRecord('customrecord_nbsabr_accountsetup', null, filters, cols);
		// populate options list
		fld_reconaccount.addSelectOption('0', '');
		for(var i =0; bankAccts != null && i < bankAccts.length; ++i)
		{
			var strAccName = bankAccts[i].getValue('custrecord_accsetup_accountname');//mandatory
			var strAccNumber = bankAccts[i].getValue('custrecord_accsetup_accountnumber');//mandatory
			
			fld_reconaccount.addSelectOption(bankAccts[i].getId(), strAccName+' '+strAccNumber);
		}
		
		// Target Account select field - list is populated by client script
		// must use custpage_ prefix or client function InsertSelectOption gives error!
		var fld_targetaccount = form.addField('custpage_targetaccount', 'select',objResources[NBSABRSTR.NSACCT],null,null);	// 'NetSuite Account'
		fld_targetaccount.setMandatory(true);
		// 'Select an account to associate with these opening balance transactions.'
		fld_targetaccount.setHelpText(objResources[NBSABRSTR.SLCTACCTASSOCOPENBAL]);
		
		var fld_totalamount = form.addField('totalamount', 'currency', objResources[NBSABRSTR.AMT]);	// 'Amount'
		fld_totalamount.setLayoutType('normal', 'none');
		fld_totalamount.setDisplayType('disabled');
		fld_totalamount.setDefaultValue('0.00');
		// 'NetSuite will update this amount as you add or edit lines.'
		fld_totalamount.setHelpText(objResources[NBSABRSTR.UPDAMTONADDEDIT]);
		
		var fld_Branding = form.addField('moduletitle','inlinehtml');
		// <B>Advanced Bank Reconciliation</B> by Nolan Business Solutions Plc
		fld_Branding.setDefaultValue('<font color="navy"><BR><B>'+objResources[NBSABRSTR.ABR]+'</B> '+objResources[NBSABRSTR.BYNBS]+'</font>');
		fld_Branding.setLayoutType('normal', 'none');
		
		// adding a hidden field for POST calls
		//var hiddenAction = form.addField('hidden_action', 'text', 'hidden');
		//hiddenAction.setDisplayType('hidden');
		//hiddenAction.setDefaultValue('');
				
		var subL_OpenBalTrn = form.addSubList('openbalancelist','inlineeditor',objResources[NBSABRSTR.OPNGBALTRNS]);	// 'Opening Balance Transactions'
		subL_OpenBalTrn.addField('trandate','date',objResources[NBSABRSTR.DT]).setMandatory(true);	// 'Date'
		//var fld_tranType = subL_OpenBalTrn.addField('trantype','select','Type','transactiontype').setMandatory(true);
		var fld_tranType = subL_OpenBalTrn.addField('trantype','select',objResources[NBSABRSTR.TYP]).setMandatory(true);	// 'Type'
		
		//subL_OpenBalTrn.addField('entity','select','Name','entity');
		// you can add the entity list to a record but if you add to suitelet get blank list!!
		// workaround: retrieve list from a record - see below!
		var fld_entitylist = subL_OpenBalTrn.addField('entitylist','select',objResources[NBSABRSTR.NM]);	// 'Name'
		subL_OpenBalTrn.addField('tranid','text',objResources[NBSABRSTR.TRNNO]);	// 'Tran No'
		subL_OpenBalTrn.addField('memo','text',objResources[NBSABRSTR.REF]);	// 'Reference'
		subL_OpenBalTrn.addField('amount','currency',objResources[NBSABRSTR.AMT]).setMandatory(true);	// 'Amount'
		
		// Retrieve entity list from a calendar event record
        var eventRec = nlapiCreateRecord('calendarevent');
        var companyField = eventRec.getField('company');
        var arrEntities = companyField.getSelectOptions();
        //Load the company list into the entity select field
        fld_entitylist.addSelectOption('', '');
        for (var i in arrEntities) {
        	fld_entitylist.addSelectOption(arrEntities[i].getId(), arrEntities[i].getText());
        }
		
		// add select options to transaction type select list
		fld_tranType.addSelectOption('', '');
		fld_tranType.addSelectOption('5', objResources[NBSABRSTR.CSHSL]);		// 'Cash Sale');
		fld_tranType.addSelectOption('29', objResources[NBSABRSTR.CSHRFND]);	// 'Cash Refund');
		fld_tranType.addSelectOption('3', objResources[NBSABRSTR.CHQ]);			// 'Check');
		fld_tranType.addSelectOption('40', objResources[NBSABRSTR.CSTDPST]);	// 'Customer Deposit');
		fld_tranType.addSelectOption('30', objResources[NBSABRSTR.CSTRFND]);	// 'Customer Refund');
		fld_tranType.addSelectOption('4', objResources[NBSABRSTR.DPST]);		// 'Deposit');
		fld_tranType.addSelectOption('1', objResources[NBSABRSTR.JRN]);			// 'Journal');
		fld_tranType.addSelectOption('9', objResources[NBSABRSTR.PYMNT]);		// 'Payment');
		fld_tranType.addSelectOption('2', objResources[NBSABRSTR.XFER]);		// 'Transfer');
		fld_tranType.addSelectOption('18', objResources[NBSABRSTR.BLLPYMNT]);	// 'Bill Payment');
				
		form.addSubmitButton(objResources[NBSABRSTR.SBMT]);	// 'Submit'
		
		response.writePage(form);
		}
		else{ //submit
			nlapiLogExecution('debug','request.getMethod()',request.getMethod());
						
			var reconAcctId = request.getParameter('reconaccount');
			var targetAcctId = request.getParameter('custpage_targetaccount');
			//var nsAcctId = nlapiLookupField('customrecord_nbsabr_targetaccount',targetAcctId,'custrecord_nbsabr_ta_accountname');
			// account object
			var objAccount = nbsABR_CreateAccountObject(reconAcctId);
			var subsidId = objAccount.subsidiary;
			var b_IsBaseCurr = objAccount.isBaseCurrency;
			var arrAcctIds = objAccount.targetaccts;
			
			// need subsidiary to apply role restrictions
			var dtStmntDate = new Date(2001,0,1);
			var flTotalUnrecon = ncParseFloatNV(request.getParameter('totalamount'),0);
			
			_failurePoint = 'iterating through sublist lines';
			var len = request.getLineItemCount('openbalancelist');
			for(var i=1; i <= len; i+=1){
					 				
				var recRS = nlapiCreateRecord('customrecord_nbsabr_reconciliationstate');
				recRS.setFieldValue('custrecord_nbsabr_rs_trantype', request.getLineItemValue('openbalancelist','trantype',i));
				recRS.setFieldValue('custrecord_nbsabr_rs_status', ABR_CL.STATUS.UNMATCHED);
				recRS.setFieldValue('custrecord_nbsabr_rs_recordtype', ABR_CL.RECTYPE.OPENPOSTN); //NetSuite Transaction
				recRS.setFieldValue('custrecord_nbsabr_rs_integritystatus', ABR_CL.INTEGRITY.NEW);//New
				recRS.setFieldValue('custrecord_nbsabr_rs_reconacc', request.getParameter('reconaccount'));
				recRS.setFieldValue('custrecord_nbsabr_rs_targetacc', targetAcctId);	
				recRS.setFieldValue('custrecord_nbsabr_rs_amount', request.getLineItemValue('openbalancelist','amount',i));
				var strTranDate = request.getLineItemValue('openbalancelist','trandate',i);
				var dtTranDate = nlapiStringToDate(strTranDate);
				// make most recent date the statement date
				if( dtTranDate > dtStmntDate ){
					dtStmntDate = dtTranDate;
				}
				nlapiLogExecution('debug','dtStmntDate',dtStmntDate);
				recRS.setFieldValue('custrecord_nbsabr_rs_trndate', strTranDate);
				recRS.setFieldValue('custrecord_nbsabr_rs_linenumber', '0');
				recRS.setFieldValue('custrecord_nbsabr_rs_memo', request.getLineItemValue('openbalancelist','memo',i));
				recRS.setFieldValue('custrecord_nbsabr_rs_subsidiary', subsidId);
				recRS.setFieldValue('custrecord_nbsabr_rs_tranid', request.getLineItemValue('openbalancelist','tranid',i));
				var entityId = request.getLineItemValue('openbalancelist','entitylist',i);
				if ((entityId !== null) && (entityId != '')) {
					var entityName = nlapiLookupField('entity',entityId,'entityid');
					recRS.setFieldValue('custrecord_nbsabr_rs_entityname',entityName);
				}
				//recRS.setFieldValue('custrecord_nbsabr_rs_entity', request.getLineItemValue('openbalancelist','entitylist',i));
				//recRS.setFieldValue('custrecord_nbsabr_rs_entityname', request.getLineItemText('openbalancelist','entitylist',i));
			
				try{
					nlapiSubmitRecord(recRS,true);
					l_RecordCount +=1;
				} catch (e) {
					ncLogException(e,'Error','ABR Opening Balance Entry');
					msg = '<b>'+objResources[NBSABRSTR.CMPLTWERRCHKSCRPTLOG]+'</b><br>&nbsp;';	// Completed with errors! Check script log for further details.
				}			
			}
			_failurePoint = 'create statement history record';
			var flAcctBalance = nbsABR_getAccountBalance(arrAcctIds, nlapiDateToString(dtStmntDate),b_IsBaseCurr,false);
			
			// balance values set by UE before submit
	 		var recStatementHistory = nlapiCreateRecord('customrecord_nbsabr_statementhistory');
	 		recStatementHistory.setFieldValue('custrecord_sh_reconaccount', reconAcctId);
	 		if(nbsABR.CONFIG.b_SubsEnabled){	
	 			recStatementHistory.setFieldValue('custrecord_sh_subsidiary', subsidId);
	 		}
	 		recStatementHistory.setFieldValue('custrecord_sh_date', nlapiDateToString(dtStmntDate));
	 		//recStatementHistory.setFieldValue('custrecord_sh_startdate', stFromDate);
	 		//recStatementHistory.setFieldValue('custrecord_sh_endingbalance', stEndingBalance);
	 		// NS fields
	 		recStatementHistory.setFieldValue('custrecord_sh_ns_unreconciled', flTotalUnrecon);
	 		//var fl_balance = ((stEndingBalance*100)-(strTotalUnreconciled*100))/100;
	 		recStatementHistory.setFieldValue('custrecord_sh_ns_balance', flAcctBalance);
	 		// BK fields
	 		//recStatementHistory.setFieldValue('custrecord_sh_bk_adjbalance', stEndingBalance);
	 		recStatementHistory.setFieldValue('custrecord_sh_bk_unreconciled', '0');
	 		recStatementHistory.setFieldValue('custrecord_sh_accntinit', 'T');
	 		//recStatementHistory.setFieldValue('custrecord_sh_lastprocid',intLastProcId);
	 			
	 		try{
	 			nlapiSubmitRecord(recStatementHistory,false);
	 		} catch (e) {
				ncLogException(e,'Error','ABR Opening Balance Entry - submit statement history');
				msg = '<b>'+objResources[NBSABRSTR.CMPLTWERRCHKSCRPTLOG]+'</b><br>&nbsp;';	// Completed with errors! Check script log for further details.
			}		
			
			if(msg ===''){
				// <b>Completed! </b>'+l_RecordCount+' record(s) submitted successfully.
				msg = objResources[NBSABRSTR.CMPLTNUMRECSOK].replace('<#reccount>',l_RecordCount.toString()) +'<br>&nbsp;';
			}
			
			var form = nlapiCreateForm(objResources[NBSABRSTR.OPNGBALENTRY]);	// 'Opening Balance Entry'
			var confirmSave = form.addField('custpage_confirmsave', 'inlinehtml', 'Confirmation: ');
			confirmSave.setDisplayType('inline');
			confirmSave.setDefaultValue(msg);
			confirmSave.setLayoutType('outsideabove','startrow');
			
			response.writePage(form);	
		}				
}
