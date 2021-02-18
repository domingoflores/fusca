/** nbsABR_CreateGLTrxSL - entry point for Create GL Transaction Scriptlet
*
* This function provides all the functionality for the Transaction Entry window.
* Accessed via "Create GL Trx button on bank statement child window on Reconcile window.
* 
* @param {nlobjRequest} request - the request made to the suitelet
* @param {nlobjResponse} response - the response object to write the page to
* 
* @return {void}
*/

function nbsABR_CreateGLTrxSL(request, response)
{
	var ctx = nlapiGetContext();
	var b_LocationsEnabled = ctx.getFeature('LOCATIONS');
	var b_DepartmentsEnabled = ctx.getFeature('DEPARTMENTS');
	var b_ClassesEnabled = ctx.getFeature('CLASSES');
	
	var reconAcctId = request.getParameter('account');//reconcile account
	var subsidiaryId = request.getParameter('subsidiary');
	var stTrxDate = request.getParameter('trxdate');
	var subsidCurrId = request.getParameter('basecurrency');
	var trxCurrId = request.getParameter('trxcurrency');
	var arrNomAcctIds = [];
	
	// validate pre-requisites (e.g. Translate bundle)
	try {
		// attempt to retrieve resources record
		nlapiSearchRecord(nbsTRANSL_RT_Resources.ScriptId,null,null,null);
		
	} catch (X){
		var form = nlapiCreateForm('Transaction Entry');
		var errMsg = form.addField('custpage_errormessage', 'inlinehtml', 'Error');
		errMsg.setDefaultValue('<BR><b>Unable to retrieve translation details.<BR><BR>Please install bundle - Multi-Language (id: 21459)</b><BR><BR>Error:'+X.toString());
		response.writePage(form);
		return;
	}

	var objResources = nbsTRANSL_getResources(ctx);		// get JS object of resources

	if(request.getMethod() == 'GET')	// page display
	{
		var form = nlapiCreateForm(objResources[NBSABRSTR.TRNNTRY],true);	// 'Transaction Entry'
		form.setScript('customscript_nbsabr_creategltrx_c');
				
		//get nominal accounts associated with reconcile account
		var SFs = [	new nlobjSearchFilter('isinactive',null,'is','F',null),
		           	new nlobjSearchFilter('custrecord_nbsabr_ta_reconacc',null,'anyof',reconAcctId,null)];
		var SCs = [new nlobjSearchColumn('custrecord_nbsabr_ta_accountname')];
		
		var SR = nlapiSearchRecord('customrecord_nbsabr_targetaccount', null, SFs, SCs);
		for(var i =0; SR != null && i < SR.length; ++i){
			arrNomAcctIds.push(SR[i].getValue('custrecord_nbsabr_ta_accountname'));
		}
		
		// hidden field for post calls
		var fld_reconacct = form.addField('account', 'select', 'Reconcile Account','customrecord_nbsabr_accountsetup');
		fld_reconacct.setDisplayType('hidden');
		fld_reconacct.setDefaultValue(reconAcctId);
		
	//	var arrAmts = request.getParameter('amts').split(':');
	//	var arrRefs = request.getParameter('refs').split(':');
		var arrAmts = [];
		var arrRefs = [];
		
		var arrLines = request.getParameter('lines').split(':');// array of bank statement line ids
		if ((arrLines.length == 1) && (arrLines[0] == ''))
			arrLines = [];	// .split will return a single empty string if the source string is empty, which then breaks the search

		var sfInternalIds = [new nlobjSearchFilter('internalid',null,'anyof',arrLines,null)];
		var columns = [new nlobjSearchColumn('custrecord_bsl_amount'), new nlobjSearchColumn('custrecord_bsl_reference')];
		var srBankTrxLines = null;
		if (arrLines.length > 0)
			srBankTrxLines = nlapiSearchRecord('customrecord_nbsabr_bankstatementline',null,sfInternalIds,columns);
		
		for(var i=0; srBankTrxLines != null && i < srBankTrxLines.length; i+=1)
		{
			arrAmts.push(srBankTrxLines[i].getValue('custrecord_bsl_amount'));
			arrRefs.push(srBankTrxLines[i].getValue('custrecord_bsl_reference'));
		}
		
		var gl_arrAmts = [];
		var gl_arrRefs = [];
		
		var gl_arrLines = request.getParameter('gllines').split(':');// array of bank statement line ids
		if ((gl_arrLines.length == 1) && (gl_arrLines[0] == ''))
			gl_arrLines = [];	// .split will return a single empty string if the source string is empty, which then breaks the search

		var gl_sfInternalIds = [new nlobjSearchFilter('internalid',null,'anyof',gl_arrLines,null)];
		var gl_columns = [new nlobjSearchColumn('custrecord_nbsabr_rs_amount'), 
		                  new nlobjSearchColumn('custrecord_nbsabr_rs_memo'),
		                  new nlobjSearchColumn('custrecord_nbsabr_rs_targetacc')];
		var srGLTrxLines = null;
		if (gl_arrLines.length > 0)
			srGLTrxLines = nlapiSearchRecord('customrecord_nbsabr_reconciliationstate',null,gl_sfInternalIds,gl_columns);
		
		for(var i=0; srGLTrxLines != null && i < srGLTrxLines.length; i+=1)
		{
			gl_arrAmts.push(srGLTrxLines[i].getValue('custrecord_nbsabr_rs_amount'));
			gl_arrRefs.push(srGLTrxLines[i].getValue('custrecord_nbsabr_rs_memo'));
		}

		var fld_trxdate = form.addField('trxdate', 'date', objResources[NBSABRSTR.TRNDT]);	// 'Transaction Date'
		fld_trxdate.setDisplayType('normal');
		fld_trxdate.setDefaultValue(stTrxDate);
		
		var fld_subsidiary = form.addField('subsidiary', 'select', objResources[NBSABRSTR.SUBSID],'subsidiary');	// 'Subsidiary'
		
		//subsidiary
		if(nbsABR.CONFIG.b_SubsEnabled)
		{
			// fld_subsidiary.setDisplayType('inline');
			fld_subsidiary.setDefaultValue(subsidiaryId);
		}
		else
		{
			fld_subsidiary.setDisplayType('hidden');
			fld_subsidiary.setDefaultValue ('1');
		}
		
		// currency
		if(nbsABR.CONFIG.b_multiCurr)
		{
			var fld_currency = form.addField('trxcurrency', 'select', objResources[NBSABRSTR.CRRNCY],'currency');	// 'Currency'
			fld_currency.setDisplayType('inline');
			fld_currency.setDefaultValue (trxCurrId);
			
			var fld_exchangerate = form.addField('xrate', 'float', objResources[NBSABRSTR.XRT]);	// 'Exchange Rate'
			fld_exchangerate.setDisplayType('normal');
			var rate = nlapiExchangeRate(trxCurrId,subsidCurrId,stTrxDate);
			fld_exchangerate.setDefaultValue(rate);
		}
		
		var fld_difference = form.addField('difference', 'currency', objResources[NBSABRSTR.DIFF]);	// 'Difference'
		fld_difference.setDisplayType('disabled');
					
		var fld_Branding = form.addField('moduletitle','inlinehtml');
		// <B>Advanced Bank Reconciliation</B> by Nolan Business Solutions Plc
		fld_Branding.setDefaultValue('<font color="navy"><BR><B>'+objResources[NBSABRSTR.ABR]+'</B> '+objResources[NBSABRSTR.BYNBS]+'</font>');
		fld_Branding.setLayoutType('normal', 'none');
		
		var subList = form.addSubList('linelist','inlineeditor','Lines');
		subList.addField('account','select',objResources[NBSABRSTR.ACCNT],'account');	// 'Account'
		subList.addField('debit','currency',objResources[NBSABRSTR.DBT]);	// 'Debit'
		subList.addField('credit','currency',objResources[NBSABRSTR.CRDT]);	// 'Credit'
		//subList.addField('name','select','Name','entity');// entity list not supported in script - make own list??
		subList.addField('memo','text',objResources[NBSABRSTR.MM]);	// 'Memo'
		subList.addField('bslid','textarea','BSL Id').setDisplayType('hidden');
		subList.addField('gllid','textarea','GLL Id').setDisplayType('hidden');
		
		if(b_LocationsEnabled)
		{
			if(nbsABR.CONFIG.b_SubsEnabled)
			{
				var fld_location = subList.addField('location','select',objResources[NBSABRSTR.LCTN]);	// 'Location'
				var srLocations = nbsGetClassificationSelectOptions('location', subsidiaryId);
				fld_location.addSelectOption('', '');
				for(var i =0; srLocations != null && i < srLocations.length; ++i)
				{
					fld_location.addSelectOption(srLocations[i].getId(), srLocations[i].getValue('name'));
				}
			}
			else
			{
				subList.addField('location','select',objResources[NBSABRSTR.LCTN],'location');	// 'Location'
			}
		}
		if(b_DepartmentsEnabled)
		{
			if(nbsABR.CONFIG.b_SubsEnabled)
			{
				var fld_department = subList.addField('department','select',objResources[NBSABRSTR.DPRTMNT]);	// 'Department'
				var srDepts = nbsGetClassificationSelectOptions('department', subsidiaryId);
				fld_department.addSelectOption('', '');
				for(var i =0; srDepts != null && i < srDepts.length; ++i)
				{
					fld_department.addSelectOption(srDepts[i].getId(), srDepts[i].getValue('name'));
				}
			}
			else
			{
				subList.addField('department','select',objResources[NBSABRSTR.DPRTMNT],'department');	// 'Department'
			}
		}
		if(b_ClassesEnabled)
		{
			if(nbsABR.CONFIG.b_SubsEnabled)
			{
				var fld_class = subList.addField('classification','select',objResources[NBSABRSTR.CLSS]);	// 'Class'
				var srClasses = nbsGetClassificationSelectOptions('classification', subsidiaryId);
				fld_class.addSelectOption('', '');
				for(var i =0; srClasses != null && i < srClasses.length; ++i)
				{
					fld_class.addSelectOption(srClasses[i].getId(), srClasses[i].getValue('name'));
				}
			}
			else
			{
				subList.addField('classification','select',objResources[NBSABRSTR.CLSS],'classification');	// 'Class'
			}
		}
		
		var count = arrAmts.length;
		var gl_count = gl_arrAmts.length;
		
		if ((count > 0) && (gl_count > 0)) {
			// values on both sides, so sum(stmt)-sum(gl) and create one line for the difference
			var netAmt = 0.0;
			var memoTxt = '';
			var bs_lines = [];
			var gl_lines = [];
			for(var i=0; i<count; i+=1)
			{	
				var flAmt = ncParseFloatNV(arrAmts[i],0);
				netAmt += flAmt;
				bs_lines.push(srBankTrxLines[i].getId());
				
				if (memoTxt == '') 
					memoTxt = arrRefs[i];
			}
			for(var i=0; i<gl_count; i+=1)
			{	
				var flAmt = ncParseFloatNV(gl_arrAmts[i],0);
				netAmt -= flAmt;
				gl_lines.push(srGLTrxLines[i].getId());
				
				if (memoTxt == '') 
					memoTxt = gl_arrRefs[i];
			}

			subList.setLineItemValue('account',1,arrNomAcctIds[0]);
			subList.setLineItemValue('memo',1,memoTxt);
			subList.setLineItemValue('bslid',1,bs_lines.join(':'));
			subList.setLineItemValue('gllid',1,gl_lines.join(':'));
				
			if(netAmt > 0)
			{
				subList.setLineItemValue('debit',1,netAmt);
			}
			else
			{
				subList.setLineItemValue('credit',1,netAmt*-1);
			}
		} else {
			// values on one side only, so create detail for whichever side is present, reversing GL
			for(var i=0; i<count; i+=1)
			{	
				var flAmt = ncParseFloatNV(arrAmts[i],0);
				var stRef = arrRefs[i];
				
				subList.setLineItemValue('account',i+1,arrNomAcctIds[0]);
				subList.setLineItemValue('memo',i+1,stRef);
				subList.setLineItemValue('bslid',i+1,srBankTrxLines[i].getId());
					
				if(flAmt > 0)
				{
					subList.setLineItemValue('debit',i+1,flAmt);
				}
				else
				{
					subList.setLineItemValue('credit',i+1,flAmt*-1);
				}
			}
			for(var i=0; i<gl_count; i+=1)
			{	
				var flAmt = ncParseFloatNV(gl_arrAmts[i],0);
				var glRef = gl_arrRefs[i];
				
				subList.setLineItemValue('account',i+1,srGLTrxLines[i].getValue('custrecord_nbsabr_rs_targetacc'));
				subList.setLineItemValue('memo',i+1,glRef);
				subList.setLineItemValue('gllid',i+1,srGLTrxLines[i].getId());
					
				if(flAmt > 0)
				{
					subList.setLineItemValue('credit',i+1,flAmt);
				}
				else
				{
					subList.setLineItemValue('debit',i+1,flAmt*-1);
				}
			}
		}
		
		form.addSubmitButton(objResources[NBSABRSTR.SBMT]);	// 'Submit'
		
		response.writePage(form);
	}
	else //submit
	{
		var arrAccts = [];
		var arrDebits = [];
		var arrCredits = [];
		var arrRefs = []; 
		var arrDepts = [];
		var arrLocations = [];
		var arrClasses = [];
		var arrBSLines = [];
		var arrGLLines = [];
		
		for(var i=1; i <=request.getLineItemCount('linelist'); i+=1)
		{
			// account
			arrAccts.push(request.getLineItemValue('linelist','account',i)); 
			//debit
			var amt = request.getLineItemValue('linelist','debit',i);
			if(isStringEmpty(amt))
			{
				amt = 0;
			}
	
			arrDebits.push(amt); 
			//credit
			var amt = request.getLineItemValue('linelist','credit',i);
			if(isStringEmpty(amt))
			{
				amt = 0;
			}
			arrCredits.push(amt); 
			// ref/memo
			var ref = request.getLineItemValue('linelist','memo',i);
			if(isStringEmpty(ref))
			{
				ref = '';
			}
			arrRefs.push(ref); 
			
			if(b_LocationsEnabled)
			{
				arrLocations.push(request.getLineItemValue('linelist','location',i)); 
			}
			if(b_DepartmentsEnabled)
			{
				arrDepts.push(request.getLineItemValue('linelist','department',i)); 
			}
			if(b_ClassesEnabled)
			{
				arrClasses.push(request.getLineItemValue('linelist','classification',i)); 
			}
			// bank stmnt line ids
			var bslId = request.getLineItemValue('linelist','bslid',i);
			if(!isStringEmpty(bslId))
			{
				if (bslId.indexOf(':') >= 0)
					arrBSLines = arrBSLines.concat(bslId.split(':'));
				else
					arrBSLines.push(bslId); 
			}
			// gl line ids
			var glId = request.getLineItemValue('linelist','gllid',i);
			if(!isStringEmpty(glId))
			{
				if (glId.indexOf(':') >= 0)
					arrGLLines = arrGLLines.concat(glId.split(':'));
				else
					arrGLLines.push(glId); 
			}
			
			
		}
		
		var xRate = '';
		if(nbsABR.CONFIG.b_multiCurr)
		{
			xRate = request.getParameter('xrate');
		}
		// create NS journal
		var JrnMsg = CreateJournalEntry(stTrxDate, trxCurrId,xRate,arrAccts,arrDebits,arrCredits,arrRefs,subsidiaryId,arrClasses,arrDepts,arrLocations,objResources);
		//nlapiLogExecution('debug','JrnErrMsg',JrnErrMsg);
		if( JrnMsg.slice(0,5) == 'Error' )
		{
			var ErrMsg = 'NBSABR_JOURNALERROR - '+objResources[NBSABRSTR.UNABLECREJRN]+'\n'+JrnMsg;	// 'Unable to create journal.'
			response.write(ErrMsg);
			return;
		}
		else
		{
			// get last match number
			var intMatchNum = nbsABR_GetNextMatchNumber(reconAcctId);
			// reset number
			
			// create extract record - reconciliation state
			nbsABR_CreateReconState(JrnMsg,stTrxDate,trxCurrId,arrAccts,arrDebits,arrCredits,arrRefs,subsidiaryId,reconAcctId,intMatchNum);
			
			// set match number on bank stmnt line record
			for(var j=0; j < arrBSLines.length;j+=1){
				nlapiSubmitField('customrecord_nbsabr_bankstatementline',arrBSLines[j],'custrecord_bsl_matchnumber',intMatchNum);
			} 
			// set match number on gl line record
			for(var j=0; j < arrGLLines.length;j+=1){
				nlapiSubmitField('customrecord_nbsabr_reconciliationstate',arrGLLines[j],
						['custrecord_nbsabr_rs_matchnumber','custrecord_nbsabr_rs_status'],[intMatchNum,nbsABR.CL.STATUS.MATCHED]);
			} 
			// refresh parent window and close this pop-up.
			//var script = '<script type="text/javascript">window.opener.parent.main_form.submit();window.close();</script>';
			//var script = '<script type="text/javascript">window.opener.parent.document.getElementById("GL").contentWindow.document.getElementById("match_gl").click();window.close();</script>';	
			//var script = '<script type="text/javascript">window.opener.parent.location.reload();window.close();</script>';
			var script = '<script type="text/javascript">'
				+ 'window.opener.parent.nlapiSetFieldValue("displayoption",window.opener.parent.nlapiGetFieldValue("displayoption"));window.close();'
				+ '</script>';
			response.write(script);
		}
	}
}

/* CreateJournalEntry - will create a new journalentry record and add lines based upon the arrays of values
 * Parameters:
 *		TrnDate 	- transaction date (will determine postingperiod). Pass either as a Date or a NetSuite formatted date string.
 *		CurrCode 	- currency (as internal id)
 *		ExRate 		- exchangerate (currently not supported, only processing operating currency)
 *		Accounts 	- array of account ids
 *		DebitAmts 	- corresponding array of debit values
 *		CreditAmts 	- corresponding array of credit values
 *		References 	- corresponding array of memo text values
 *  	SubsidiaryId- subsidiary for the transaction (if feature enabled)
 *		Classes		- array of class for the transaction (if feature enabled)
 *		Depts- array of department for the transaction (if feature enabled)
 *		Locations	- array of location for the transaction (if feature enabled)
 
 * Returns:
 *  	message string containing any error messages, blank if no errors.
 */
function CreateJournalEntry(TrnDate,CurrCode,ExRate,Accounts,DebitAmts,CreditAmts,References,SubsidiaryId,Classes,Depts,Locations,objResources)
{
	var msg = '';
	//create journal
	var JE = nlapiCreateRecord('journalentry');
		
	if(nbsABR.CONFIG.b_SubsEnabled){
		JE.setFieldValue('subsidiary',SubsidiaryId);
	}

	if(TrnDate instanceof Date){
		JE.setFieldValue('trandate',nlapiDateToString(TrnDate));
	}
	else{
		JE.setFieldValue('trandate',TrnDate);	// assuming it is a valid string
	}

	if( (CurrCode != '') && (CurrCode != null) && (nbsABR.CONFIG.b_multiCurr) )
	{
		JE.setFieldValue('currency',CurrCode.toString());
		JE.setFieldValue('exchangerate',ExRate.toString());
	}

	// validate accounts
	for(var n=0; n<Accounts.length; ++n)
	{
		if( isStringEmpty(Accounts[n]))
		{
			msg = objResources[NBSABRSTR.ERR]+': '+objResources[NBSABRSTR.ONEMOREPSTGACCTSMSSNG];	// 'Error: One or more posting accounts are missing.';
			return msg;
		}
	}
	// line counter
	var j = 1;
	for(var i=0; i<Accounts.length; ++i)
	{
		if(isStringEmpty(DebitAmts[i]) && isStringEmpty(CreditAmts[i]))
		{
			//do nothing
		}
		else
		{
			JE.insertLineItem('line',j);
			JE.setLineItemValue('line','account',j,Accounts[i].toString());
			if( CurrCode != null )
			{
				JE.setLineItemValue('line','account_cur',j,CurrCode.toString());
				JE.setLineItemValue('line','account_cur_isbase',j,'T');
				JE.setLineItemValue('line','account_cur_fx',j,'F');
			}
			if(DebitAmts[i] != 0)
			{
				JE.setLineItemValue('line','debit',j,nlapiFormatCurrency(DebitAmts[i].toString()));
				JE.setLineItemValue('line','origdebit',j,nlapiFormatCurrency(DebitAmts[i].toString()));
			}
			if(CreditAmts[i] != 0)
			{
				JE.setLineItemValue('line','credit',j,nlapiFormatCurrency(CreditAmts[i].toString()));
				JE.setLineItemValue('line','origcredit',j,nlapiFormatCurrency(CreditAmts[i].toString()));
			}
			JE.setLineItemValue('line','memo',j,References[i].toString());

			// need to allow Class, Department and Location to be single value (same for all rows) or per row, i.e. string or array
			if( Classes != null )
				if( typeof(Classes) == 'string' )
					JE.setLineItemValue('line','class',j,Classes);
				else if( typeof(Classes[i]) == 'string' )
					JE.setLineItemValue('line','class',j,Classes[i]);

			if( Depts != null )
				if( typeof(Depts) == 'string' )
					JE.setLineItemValue('line','department',j,Depts);
				else if( typeof(Depts[i]) == 'string' )
					JE.setLineItemValue('line','department',j,Depts[i]);

			if( Locations != null )
				if( typeof(Locations) == 'string' )
					JE.setLineItemValue('line','location',j,Locations);
				else if( typeof(Locations[i]) == 'string' )
					JE.setLineItemValue('line','location',j,Locations[i]);			
			++j;
		}
	}

	try
	{
		msg = nlapiSubmitRecord(JE,true);
	} catch (e) {
        if ( e instanceof nlobjError )
        {
			msg = objResources[NBSABRSTR.ERR]+': '+ e.getCode() + ' - ' + e.getDetails();	// 'Error: '
			var ST = e.getStackTrace();
			// nlobjError.getStackTrace() is documented as returning an array, but actually (sometimes?) returns a single string...
			if( (typeof(ST) != 'undefined') && (ST != null) )
			{
				if( typeof(ST) == 'string' )
					msg += '<BR>'+ST;
				else	// in case we ever do get an array...
					for( var nST=0; nST<ST.length; ++nST )
						if( ST[nST] != 'undefined' )
							msg += '<BR>'+ST[nST];
			}
		}
        else
            msg = objResources[NBSABRSTR.ERR]+': '+ e.toString();	// 'Error: '
	}
	return msg;
}
/** nbsABR_CreateReconState - will create a new reconciliation state record for each journal line that is associated with a bank account
 * 
 * @param (string) JrnId internalid of new journal
 */
function nbsABR_CreateReconState(JrnId,TrnDate,CurrCode,Accounts,DebitAmts,CreditAmts,References,SubsidiaryId,ReconAcct,intMatchNumber)
{
	// nlapiLogExecution('debug','ReconAcct create',ReconAcct);
	//var j = 1;

	
	//get nominal accounts associated with reconcile account
	var arrNomAcctIds = [];
	var SFs = [	new nlobjSearchFilter('isinactive',null,'is','F',null),
	           	new nlobjSearchFilter('custrecord_nbsabr_ta_reconacc',null,'anyof',ReconAcct,null)];
	var SCs = [new nlobjSearchColumn('custrecord_nbsabr_ta_accountname')];
	
	var SR = nlapiSearchRecord('customrecord_nbsabr_targetaccount', null, SFs, SCs);
	for(var i =0; SR != null && i < SR.length; ++i){
		arrNomAcctIds.push(SR[i].getValue('custrecord_nbsabr_ta_accountname'));
	}
	
	for(var i =0; i< Accounts.length;i+=1)
	{
		// nlapiLogExecution('debug','Accounts[i] ',Accounts[i]);
		// nlapiLogExecution('debug','nlapiLookup ', nlapiLookupField('account',Accounts[i],'type'));
		//only create a record for accounts of type 'Bank'	
		/*
		if( nlapiLookupField('account',Accounts[i],'type') != 'Bank')
		{
			continue;
		}
		*/
		/* rather than only creating for type is 'Bank', we should only create if a target account of the current recon account
		 * otherwise transfers between bank accounts pick up both sides, even if the other side is on another recon account!
		 */
		if (arrNomAcctIds.indexOf(Accounts[i]) == -1)
			continue;
		
		var tranId = '';
		try { tranId = nlapiLookupField('transaction',JrnId,'tranid'); } catch(x) {}
		if (tranId === null)
			tranId = '';
	
		var recRS = nlapiCreateRecord('customrecord_nbsabr_reconciliationstate');
		recRS.setFieldValue('custrecord_nbsabr_rs_internalid', JrnId);
		recRS.setFieldValue('custrecord_nbsabr_rs_trn_internalid', JrnId);
		recRS.setFieldValue('custrecord_nbsabr_rs_trantype', '1');//journalentry
		recRS.setFieldValue('custrecord_nbsabr_rs_status', ABR_CL.STATUS.MATCHED);
		recRS.setFieldValue('custrecord_nbsabr_rs_recordtype', ABR_CL.RECTYPE.ADJSTMNT); //NetSuite Transaction
		recRS.setFieldValue('custrecord_nbsabr_rs_integritystatus', ABR_CL.INTEGRITY.NEW);//New
		recRS.setFieldValue('custrecord_nbsabr_rs_reconacc', ReconAcct);		
		recRS.setFieldValue('custrecord_nbsabr_accsetup_acctcurrency', CurrCode);
		recRS.setFieldValue('custrecord_nbsabr_rs_trndate', TrnDate);
		recRS.setFieldValue('custrecord_nbsabr_rs_tranid', tranId);
		recRS.setFieldValue('custrecord_nbsabr_rs_subsidiary', SubsidiaryId);
		recRS.setFieldValue('custrecord_nbsabr_rs_matchnumber', intMatchNumber);
		//recRS.setFieldValue('custrecord_nbsabr_rs_entity', srTrns[i].getValue('entity'));
		//recRS.setFieldValue('custrecord_nbsabr_rs_processid', procId);
		
		if(isStringEmpty(DebitAmts[i]) && isStringEmpty(CreditAmts[i]))
		{
			//do nothing
		}
		else
		{
			recRS.setFieldValue('custrecord_nbsabr_rs_linenumber', i);
			recRS.setFieldValue('custrecord_nbsabr_rs_targetacc', Accounts[i].toString());
			
			if(DebitAmts[i] != 0)
			{
				recRS.setFieldValue('custrecord_nbsabr_rs_amount', DebitAmts[i].toString());
			}
			if(CreditAmts[i] != 0)
			{
				recRS.setFieldValue('custrecord_nbsabr_rs_amount', Math.abs(CreditAmts[i]) * -1);//..toString());
			}
			recRS.setFieldValue('custrecord_nbsabr_rs_memo', References[i]);
			
			nlapiSubmitRecord(recRS,false);
			//j+=1;
		}
	}
}

/**
 * Function to get list of classification select options available to a subsidiary.
 * 
 * @param (string) stClassification The internal id of the classification.
 * @param (string) stSubsidiaryId The subsidiary id to filter list of select options.
 * @return search object of options
 */
function nbsGetClassificationSelectOptions(stClassification, stSubsidiaryId)
{
	var SF = [new nlobjSearchFilter('isinactive',null,'is','F',null),
	          new nlobjSearchFilter('subsidiary',null,'anyof',[stSubsidiaryId],null)];
	
	var SC = [new nlobjSearchColumn('name')];
	
	var SR = nlapiSearchRecord(stClassification, null, SF, SC);
	
	return SR;
}
