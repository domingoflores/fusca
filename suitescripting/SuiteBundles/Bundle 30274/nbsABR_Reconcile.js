/** 
 * Advanced Bank Reconciliation, Nolan Business Solutions
 * 
 * code for Reconcile Statement suitelet
 * 
 * @author C Shaw
 * @version 1.0
 */

/** buildSuitelet - entry point for Reconcile Scriptlet
*
* This function provides all the functionality for the Reconcile Bank Statement window
* 
* @param {nlobjRequest} request - the request made to the suitelet
* @param {nlobjResponse} response - the response object to write the page to
* 
* @return {void}
*/

//function buildSuitelet(request, response)
function nbsABR_ReconcileSL(request, response)
{		
	//	Reconcile Bank Statement
	var form = nlapiCreateForm('Reconcile Bank Statement');

	var pageState = request.getParameter('custpage_state');

	if ((pageState === undefined) || (pageState === null) || (pageState == ''))
		pageState = 'Init';	// first time through
	
	if (pageState == 'Init') {
		// retrieve any query parameters so they can be stored in the page to retrieve after submit...
		var acctId = request.getParameter('accountid');		
		var reconAcctId = request.getParameter('custparam_reconacctid');
		
		// retrieve session id for RESTlet call if first time through
		nbsABR_RenderPreForm(form, acctId, reconAcctId);
		response.writePage(form);
		return;
	}
	
	if (pageState == 'Preload') {
		// now use the session id to invoke the RESTlet to validate registration keys, plus validate other requirements
		var validationMsg = nbsABR_ValidatePreReqs(request.getParameter('custpage_jsid'));
		if (validationMsg != 'Okay') {
			var fld_Error = form.addField('custpage_errormessage', 'inlinehtml', 'Error');
			fld_Error.setDefaultValue(validationMsg);
			response.writePage(form);
			return;
		}
		
		pageState = 'Query';
	}
	
	var ctx = nlapiGetContext();
	// get JS object of resources
	objResources = nbsTRANSL_getResources(ctx);
	form.setTitle(objResources[NBSABRSTR.RCNCLBNKSTMT]);	//Reconcile Bank Statement
	form.setScript('customscript_nbsabr_reconcile_c');
	
	// get preferences from config record
	var cnfgSF = new nlobjSearchFilter('isinactive', null, 'is', 'F', null);
	var cnfgSC = [ new nlobjSearchColumn('custrecord_abr_config_allowpartstmntrec'), new nlobjSearchColumn('custrecord_abr_config_allowforcedunmatch') ];
	var cnfgSR = nlapiSearchRecord('customrecord_nbsabr_config', null, cnfgSF, cnfgSC);
	var b_AllowPartRecon = false;
	var b_AllowForcedUnmatch = false;
	if (cnfgSR !== null && cnfgSR.length > 0) {
		if (cnfgSR[0].getValue('custrecord_abr_config_allowpartstmntrec') == 'T') {
			b_AllowPartRecon = true;
		}
		if (cnfgSR[0].getValue('custrecord_abr_config_allowforcedunmatch') == 'T') {
			b_AllowForcedUnmatch = true;
		}
	}
	
	var subsidiaryId = '1'; // always '1' if single company
	var accountId = ''; // internalid of Account
	//var reconAcctId = ''; // internalid of Reconcile Account
	var stStatementDate = ''; // Statement Date on Reconcile Statement page 
	var Params = []; // array of values to pass to page render function
	var stFromDate = ''; // Reconcile From Date on Bank Account Setup record
	var stStartDate = '';// hidden field Start Date on Reconcile Statement page populated with stFromDate when a new account is selected
	var bRedirect = false; // redirect from status page
	var instId = '';
	var _failurePoint = '';
	
	if ( pageState == 'Query' )
	{
		if(!isStringEmpty(request.getParameter('custpage_accountid')))
		{
			bRedirect = true; //redirect from status page
			accountId = request.getParameter('custpage_accountid');
		}
		if(!isStringEmpty(request.getParameter('custpage_reconaccountid')))
		{
			bRedirect = true; //redirect from check data SL
			accountId = request.getParameter('custpage_reconaccountid');
		}
	
		//++
		// retrieve bank account setup records
		// subsidiary role restrictions handled on record type
		// cleardown process updates From Date on bank account setup - if not run, From Date could be empty
		var SFs = [new nlobjSearchFilter('isinactive',null, 'is','F')];
		if(bRedirect)
		{
			//SFs.push(new nlobjSearchFilter('custrecord_accsetup_account',null, 'anyof',accountId));
			SFs.push(new nlobjSearchFilter('internalid',null, 'is',accountId));
		}
		var SCs = [new nlobjSearchColumn('custrecord_accsetup_default'),
		           new nlobjSearchColumn('custrecord_accsetup_fromdate'),
		           //new nlobjSearchColumn('custrecord_accsetup_account'),
		           new nlobjSearchColumn('custrecord_accsetup_subsidiary')];
		SCs[0].setSort(true); // DESC - default at top
		var setupSRs = nlapiSearchRecord('customrecord_nbsabr_accountsetup',null,SFs,SCs);
	
		if( (setupSRs != null) && (setupSRs.length > 0) )
		{
			stFromDate = setupSRs[0].getValue('custrecord_accsetup_fromdate');
			//accountId = setupSRs[0].getValue('custrecord_accsetup_account');
			accountId = setupSRs[0].getId();
			if(nbsABR.CONFIG.b_SubsEnabled){
				subsidiaryId = setupSRs[0].getValue('custrecord_accsetup_subsidiary');
			}
		}
		else
		{
			var params = [];
    		params['recordtype'] = 'customrecord_nbsabr_accountsetup';
    		params['recordname'] = 'ABR Account Setup';
    		
			response.sendRedirect('SUITELET','customscript_nbsabr_reconerror','customdeploy_nbsabr_reconerror',null,params);
    		return;
		}
		Params['subsidiary'] = subsidiaryId;
		Params['account'] = accountId;
		Params['startdate'] = stFromDate; // search on and after this date
		Params['allowforcedunmatch'] = b_AllowForcedUnmatch;
		nbsABR_RenderReconcileForm(form,'New',Params,objResources,request.getParameter('custpage_jsid'));
		response.writePage(form);
	}
	else// POST
	{
		var main_action = request.getParameter('main_action');
		if (main_action === null)	main_action = '';
		var strErrorMsg = ''; // error message to user
		
		subsidiaryId = request.getParameter('custpage_subsidiary');
		accountId = request.getParameter('custpage_bankaccount');
				
		stStartDate = request.getParameter('custpage_startdate');
		
		
		stStatementDate =  request.getParameter('custpage_statementdate');
		
		Params['account'] = accountId;
		Params['startdate'] = stStartDate;
		Params['statementdate']= stStatementDate;
		Params['allowforcedunmatch'] = b_AllowForcedUnmatch;
		
		 switch (main_action.toString())
	     {
		     case 'NewAcc': // user selects new account
		    	
		    	 // retrieve account setup record to get Reconcile From date for this account
		    	 // cleardown process sets Reconcile From date, so if this is empty, cleardown process has not been run
		 		// var SFs = [new nlobjSearchFilter('custrecord_accsetup_account',null, 'is',accountId)];
		 		 var SFs = [new nlobjSearchFilter('internalid',null, 'is',accountId)];
		 		 var SCs = [new nlobjSearchColumn('custrecord_accsetup_fromdate')];
		 
		 		 var setupSRs = nlapiSearchRecord('customrecord_nbsabr_accountsetup',null,SFs,SCs);
		 		 if( (setupSRs != null) && (setupSRs.length == 1) ){
		 		 	stFromDate = setupSRs[0].getValue('custrecord_accsetup_fromdate');
		 		 }
		 		 if(isStringEmpty(stFromDate)){		 		 	
		 		 	strErrorMsg = '<font color="red"><b>'+objResources[NBSABRSTR.ERR]+'!</b><br>Unable to retrieve opening reconciliaton details.<br>'
					+'Please ensure that cleardown process is complete.</font>';
     				Params['errormsg'] = strErrorMsg;
     				nbsABR_RenderReconcileForm(form,'Refresh',Params,objResources,request.getParameter('custpage_jsid'));
    	        	response.writePage(form);
    	        	break;
		 		 }
		 		 // render form with new account selection
		 		 Params['startdate'] = stFromDate;		 		 
	        	 nbsABR_RenderReconcileForm(form,'NewAcc',Params,objResources,request.getParameter('custpage_jsid'));
	        	 response.writePage(form);
	        	 break; 
	     
	     	case 'Refresh': // user selects new start date or statement date and page refreshes
	     		
	     		Params['startdate'] = stStartDate;
	    		Params['statementdate']= stStatementDate;
	    		nlapiLogExecution('debug','refresh date',stStartDate+' - '+stStatementDate);
	     		
	     		nbsABR_RenderReconcileForm(form,'Refresh',Params,objResources,request.getParameter('custpage_jsid'));
	        	response.writePage(form);
	        	break;
	          
	         case 'Propose': // user hits Auto-match button
	        	        		
        		// validate cleardown pre-requisite
    			var SF = new nlobjSearchFilter('custrecord_sh_reconaccount',null,'is',accountId,null);
    			var SR = nlapiSearchRecord('customrecord_nbsabr_statementhistory',null,SF,null);
    			// check for reconciliation history
    			if(SR === null || SR.length === 0)
    			{
    				var stAcctName = nlapiLookupField('customrecord_nbsabr_accountsetup',accountId,'custrecord_accsetup_accountname');
	    			strErrorMsg = '<font color="red"><b>'+objResources[NBSABRSTR.ERR]+'!</b><br>'+stAcctName+' - Unable to retrieve opening reconciliaton details.<BR>'
	    							+'Please ensure that cleardown process is complete.</font>';
     				Params['errormsg'] = strErrorMsg;
     				nbsABR_RenderReconcileForm(form,'Refresh',Params,objResources,request.getParameter('custpage_jsid'));
    	        	response.writePage(form);
    	        	break;	
    			}
    			
    			// get script number - return one if multilpe script queues are not used.
	    		var intQNum = getScriptQueueNumber();
	    		
	    		// string to date, then re-encode to string using fixed format
	    		var dtStartDate = nlapiStringToDate(stStartDate);
	    		var stStartEncodedDate = ncEncodeDate(dtStartDate);
	    			
	    		// string to date, then re-encode to string using fixed format
	    		var dtStatementDate = nlapiStringToDate(stStatementDate);
	    		var stStatementEncodedDate = ncEncodeDate(dtStatementDate);
	    		        			        		
	        	// create a new instance, then set parameter to instance name and call script....
	 			var instRec = nlapiCreateRecord(ncConst.BGP_ProcessInstance);
	 	//		instRec.setFieldValue('custrecord_bgpprocstatus', '5');		// Queued - in progress if direct call??
	 			instRec.setFieldValue('custrecord_bgpprocstatus', '1');	// In Progress	
	 			instRec.setFieldValue('custrecord_bgpactivitytype', '1');	// Direct
	 			instRec.setFieldValue('custrecord_bgpfunctionname', 'nbsABR_ProposeBG');
	 			instRec.setFieldValue('custrecord_bgpprocessname', 'ABR Proposal');
	 			// retrieve and set current user id
	 	//		instRec.setFieldValue('custrecord_bgpprocuser', ctx.getUser());
	 			instRec.setFieldValue('custrecord_bgpuserid', ctx.getUser());
	 			instRec.setFieldValue('custrecord_bgpusername', ctx.getName());
	 			instRec.setFieldValue('custrecord_bgpscrptqnmbr', intQNum);// script queue number
	 			/* update process record */
	 			instRec.setFieldValue('custrecord_bgpsubsidiary', subsidiaryId);
	 			instRec.setFieldValue('custrecord_bgpreccount', '0');
	 			instRec.setFieldValue('custrecord_bgpprocmsg', '');
	 			instRec.setFieldValue('custrecord_bgpstatedefn',  'Subsidiary,Account,StartDate,StatementDate,LastId');
	 			instRec.setFieldValue('custrecord_bgpprocstate', subsidiaryId+','+accountId+','+stStartEncodedDate+','+stStatementEncodedDate+',0');
	 							
	 			instId = nlapiSubmitRecord(instRec,false);
	 			
	 			// call propose routine
	 	    	nbsABR_ProposeBG(instId, request.getURL(), request.getParameter('custpage_jsid'));
	 	   
	 	    	// redirect to status page
	 			var slParams = [];
	 			slParams['processinstanceid'] = instId;
	 			slParams['title'] = 'ABR Automatch';
	 			slParams['process'] = 'automatch';
	 			slParams['accountid'] = accountId;
	 			nlapiSetRedirectURL('SUITELET', 'customscript_nbsabr_reconcilestatus','customdeploy_nbsabr_reconcilestatus', null, slParams);
	 			break;
	 	 
	         case 'Reconcile': // Reconcile button
	       
	     			var lastbalance = request.getParameter('custpage_lastbalance');
	     			var endingbalance = request.getParameter('custpage_endingbalance');
	     			var difference = request.getParameter('custpage_difference');	
	     			//can reconcile before matching all bank records so calculate ending balance
	     			//endingbalance = ((endingbalance*100)-(difference*100))/100;
	     			endingbalance = nbsArithmetic('-', endingbalance, difference);
	     				     				
	     			// search for matched Recon State records after statement date
	     			var glSF = [new nlobjSearchFilter('custrecord_nbsabr_rs_trndate',null,'after', stStatementDate,null),
	    			            new nlobjSearchFilter('custrecord_nbsabr_rs_reconacc',null,'is', accountId,null)];
	    			
	    			_failurePoint = 'searching for Recon State';
	    			var glSRecs = nlapiSearchRecord('customrecord_nbsabr_reconciliationstate','customsearch_nbsabr_reconstate_matched',glSF,null);
	    			if(glSRecs != null && glSRecs.length != 1)
	    			{
	    				strErrorMsg = '<font color="red"><b>'+objResources[NBSABRSTR.ERR]+'!</b><br>There are matched transactions on the NetSuite side dated later than the statement date.</font>';
	     				Params['errormsg'] = strErrorMsg;
	     				nbsABR_RenderReconcileForm(form,'Refresh',Params,objResources,request.getParameter('custpage_jsid'));
	    	        	response.writePage(form);
	    	        	break;
	    			}
	    			
	    			// search for matched Bank records after statement date
	    			var bSF = [	new nlobjSearchFilter('custrecord_bsl_date',null,'after', stStatementDate,null),
	 				            new nlobjSearchFilter('custrecord_bsl_bankaccount',null,'is', accountId,null),
	 				            new nlobjSearchFilter('custrecord_bsl_matchnumber',null,'isnotempty',null ,null),
	 				            new nlobjSearchFilter('custrecord_bsl_reconciledstatement',null,'is', '@NONE@',null)];
	    			
	    			_failurePoint = 'searching for bank statement transactions';
	    			var bSRecs = nlapiSearchRecord('customrecord_nbsabr_bankstatementline','customsearch_nbsabr_bankstatementtrx',bSF,null);
	    				    			
	    			if(bSRecs != null && bSRecs.length != 1)
	    			{
	    				strErrorMsg = '<font color="red"><b>'+objResources[NBSABRSTR.ERR]+'!</b><br>There are matched transactions on the bank side dated later than the statement date.</font>';
	     				Params['errormsg'] = strErrorMsg;
	     				nbsABR_RenderReconcileForm(form,'Refresh',Params,objResources,request.getParameter('custpage_jsid'));
	    	        	response.writePage(form);
	    	        	break;
	    			}
	     			
	     			// check user has entered an ending balance	
	     			if (String(endingbalance).length == 0) 	
	     			{
	     				strErrorMsg = '<font color="red"><b>'+objResources[NBSABRSTR.ERR]+'!</b><br>'+objResources[NBSABRSTR.PLSENTRENDBLN]+'.</font>';
	     				Params['errormsg'] = strErrorMsg;
	     				nbsABR_RenderReconcileForm(form,'Refresh',Params,objResources,request.getParameter('custpage_jsid'));
	    	        	response.writePage(form);
	    	        	break;
	     			}	
	     
	     			// get "Allow Partial Reconciliation" preference from config record & check for unreconciled difference
	     			/* now retrieved above ...
	     			var cnfgSF = new nlobjSearchFilter('isinactive', null, 'is', 'F', null);
	     			var cnfgSC = [ new nlobjSearchColumn('custrecord_abr_config_allowpartstmntrec')];
	     			var cnfgSR = nlapiSearchRecord('customrecord_nbsabr_config', null, cnfgSF, cnfgSC);
	     			var b_AllowPartRecon = false;
	     			if (cnfgSR !== null && cnfgSR.length > 0) {
	     				if (cnfgSR[0].getValue('custrecord_abr_config_allowpartstmntrec') == 'T') {
	     					b_AllowPartRecon = true;
	     				}
	     			}
	     			... */
	     			// if Partial Reconciliations are NOT allowed && the difference is not zero
	     			// do not allow reconciliation
	     			if((!b_AllowPartRecon) && (parseFloat(difference) != 0))
	     			{
	     				strErrorMsg = '<font color="red"><b>'+objResources[NBSABRSTR.ERR]+'!</b><br>'+objResources[NBSABRSTR.UNRCNCLDDIFF]+' = '+difference+'</font>';
	     				Params['errormsg'] = strErrorMsg;
	     				nbsABR_RenderReconcileForm(form,'Refresh',Params,objResources,request.getParameter('custpage_jsid'));
	    	        	response.writePage(form);
	    	        	break;
	     			}
	     			
     				_failurePoint = 'Reconcile';
     				try
     				{
     					//retrieve last reconcile to get date of last statement and set as starting date on new statement
     					//search results sorted by date DESC and then Internalid DESC as they could be several reconciliations
     					//with same date if reconciled with outstanding/unmatched bank records.
     					var strLastStmntId = '';
	     				var SFs = [	new nlobjSearchFilter('custrecord_sh_reconaccount',null,'is',accountId,null)];
	     				var SRecs = nlapiSearchRecord('customrecord_nbsabr_statementhistory', 'customsearch_nbsabr_statehist_datedesc',  SFs, null);
	     				var dtStmntOpeningDate = nlapiStringToDate('1/1/2001');
	     				if(SRecs !== null && SRecs.length >0)
	     				{
	     					strLastStmntId = SRecs[0].getId();
	     					var dtLastStmntEnd = nlapiStringToDate(SRecs[0].getValue('custrecord_sh_date'));//Stmnt End Date
	     					var dtTmpStart = nlapiStringToDate(SRecs[0].getValue('custrecord_sh_startdate'));//Stmnt Start Date
	     					
	     					//if statement date is same as last statement, use same start date
	     					if(dtLastStmntEnd.getTime() == nlapiStringToDate(stStatementDate).getTime()){
	     						dtStmntOpeningDate = dtTmpStart;
	     					}
	     					else{
	     						dtStmntOpeningDate = nlapiAddDays(dtLastStmntEnd,1);
	     					}
	     				}
	     				// string to date, then re-encode to string using fixed format
	    	    		var dtStartDate = nlapiStringToDate(stStartDate);
	    	    		var stStartEncodedDate = ncEncodeDate(dtStartDate);
	    	    	
	    	    		var dtStatementDate = nlapiStringToDate(stStatementDate);
	    	    		var stStatementEncodedDate = ncEncodeDate(dtStatementDate);
	    	    		
	    	    		var stStmntOpeningEncodedDate = ncEncodeDate(dtStmntOpeningDate);
	    	    			     	    		
	     	    		// get script number - return one if multilpe script queues are not used.
	    	    		var intQNum = getScriptQueueNumber();
	     	    			  
	    	    		_failurePoint = 'Creating process instance...';
	     				// create a new process instance, then set parameter to instance name and call script....
	         			var instRec = nlapiCreateRecord(ncConst.BGP_ProcessInstance);
	         			instRec.setFieldValue('custrecord_bgpprocstatus', '1');	// In Progress	
	         			instRec.setFieldValue('custrecord_bgpactivitytype', '1');	// Direct
	         			instRec.setFieldValue('custrecord_bgpfunctionname', 'nbsABR_ReconcileBG');
	         			instRec.setFieldValue('custrecord_bgpprocessname', 'ABR Reconciliation');
	         			// retrieve and set current user id
	         			instRec.setFieldValue('custrecord_bgpuserid', ctx.getUser());
	         			instRec.setFieldValue('custrecord_bgpusername', ctx.getName());
	         			instRec.setFieldValue('custrecord_bgpscrptqnmbr', intQNum);// script queue number
	         			/* update process record */
	         			instRec.setFieldValue('custrecord_bgpsubsidiary', subsidiaryId);
	         			instRec.setFieldValue('custrecord_bgpreccount', '0');
	         			instRec.setFieldValue('custrecord_bgpprocmsg', '');
	         			instRec.setFieldValue('custrecord_bgpstatedefn',  'StatementHistoryId,StartDate,LastGLId,LastBSLId,StatementDate,AccountId,SubsidiaryId,LastBalance,EndingBalance,StmntOpeningDate,LastStmntId');
	         		//	instRec.setFieldValue('custrecord_bgpprocstate', SHId+','+stStartEncodedDate+',0,0'+stStatementEncodedDate);
	         			instRec.setFieldValue('custrecord_bgpprocstate', 'none'+','+stStartEncodedDate+',0,0,'+stStatementEncodedDate+','+accountId+','+subsidiaryId+','+lastbalance+','+endingbalance+','+stStmntOpeningEncodedDate+','+strLastStmntId);
	         				
	         			_failurePoint = 'nlapiSubmitRecord(processinstance)';
	         			instId = nlapiSubmitRecord(instRec,false);
	         			
	         			_failurePoint = 'calling nbsABR_ReconcileBG';
	     				nbsABR_ReconcileBG(instId, request.getURL(), request.getParameter('custpage_jsid'));
	     				
	     				_failurePoint = 'redirect to status page';
	         			var slParams = [];
	         			slParams['processinstanceid'] = instId;
	         			slParams['title'] = 'ABR Reconciliation Status';
	         			slParams['process'] = 'reconciliation';
	         			slParams['accountid'] = accountId;
	         			nlapiSetRedirectURL('SUITELET', 'customscript_nbsabr_reconcilestatus','customdeploy_nbsabr_reconcilestatus', null, slParams);
	         			break;
     				}
     				catch(e)
     				{
     					strErrorMsg = errText(e);
     					
     					nlapiLogExecution('Error','Unhandled Exception',strErrorMsg);
     					nlapiLogExecution('debug','Failure Point',_failurePoint);
     					
     					if(!isStringEmpty(instId))
     					{
     						var fieldNames = ['custrecord_bgpprocmsg','custrecord_bgpprocstatus'];
     						var fieldValues =[strErrorMsg,'4'];
     						nlapiSubmitField(ncConst.BGP_ProcessInstance, instId,fieldNames, fieldValues, false);
     					}
     					
	     				Params['errormsg'] = '<font color="red"><b>'+objResources[NBSABRSTR.ERR]+'!</b><br></font>'+strErrorMsg;
	     				nbsABR_RenderReconcileForm(form,'Refresh',Params,objResources,request.getParameter('custpage_jsid'));
	    	        	response.writePage(form);
	    	        	break;
     				}
	     	        	 	        
	        default:
	        	nbsABR_RenderReconcileForm(form,'New',Params,objResources,request.getParameter('custpage_jsid'));
	        	response.writePage(form);
	     }
	}
}

/** nbsABR_RenderReconcileForm - page builder for Reconcile Bank Statement SL
*
*@param (form) the current form
*@param	(string) action indicates whether action is GET, Refresh, Submit
*@param (array) params (field values) from the form
*@param (object) resources object containg string translations
*
*/
function nbsABR_RenderReconcileForm(form,action,params,resources,sessionId)
{		
	var fld_pageState = form.addField('custpage_state', 'text', 'Page State');
	fld_pageState.setDisplayType('hidden');
	fld_pageState.setDefaultValue('Submit');

	var accountId = params['account'];
	var stStartDate = params['startdate'];
	var stStatementDate = params['statementdate'];
	var displayOption = params['displayoption'];
	var strErrorMsg =  params['errormsg'];
	
	var objResources = resources;
	var lastReconBal = 0;
	var today = new Date();
			
	// field grouping
	form.addFieldGroup( 'bankdetails', objResources[NBSABRSTR.BNKDTLS]);	// 'Bank Details'
	form.addFieldGroup( 'linksetc', ' ');
	var fgFilters = form.addFieldGroup('custpage_fg_filters','Filters');
	fgFilters.setShowBorder(false);
	form.addFieldGroup( 'fg_displayopt', 'Transactions');
	form.addFieldGroup( 'myfieldgroup', '  ');	
	
	// account object
	var objAccount = nbsABR_CreateAccountObject(accountId);
	var subsidiaryId = objAccount.subsidiary;
	var subsidCurrId = objAccount.subsidiarycurrency;
	var accCurrId = objAccount.currency;
	var b_IsBaseCurr = objAccount.isBaseCurrency;
//	var arrAccts = objAccount.targetaccts;
	
	//Bank Account	
	var fld_bankaccount = form.addField('custpage_bankaccount', 'select',objResources[NBSABRSTR.BNKACCNT],null,'bankdetails');
	// 'Select the bank account you are reconciling.'
	fld_bankaccount.setHelpText(objResources[NBSABRSTR.SLCTBNKACCTRECON]);
	
	// populate list of bank accounts from list of account setup records
	var filters = [	new nlobjSearchFilter('isinactive',null,'is','F',null)];
	var cols = [new nlobjSearchColumn('custrecord_accsetup_accountname'),
	            new nlobjSearchColumn('custrecord_accsetup_accountnumber')];
	cols[0].setSort();
	
	var bankAccts = nlapiSearchRecord('customrecord_nbsabr_accountsetup', null, filters, cols);
	// populate account options list
	for(var i =0; bankAccts != null && i < bankAccts.length; ++i)
	{
		var strAccName = bankAccts[i].getValue('custrecord_accsetup_accountname');//mandatory
		var strAccNumber = bankAccts[i].getValue('custrecord_accsetup_accountnumber');//mandatory
		fld_bankaccount.addSelectOption(bankAccts[i].getId(), strAccName+' '+strAccNumber);
		
		//fld_bankaccount.addSelectOption(bankAccts[i].getId(), bankAccts[i].getValue('custrecord_accsetup_accountname'), false);
	}
		
	if(action == 'New' || action == 'NewAcc')	
	{
		/* use last statement date in preference to last transaction date ... */
		// retrieve last statement date from statement list - customsearch_nbsabr_stmt_bydate_desc
		var sfReconAcct = new nlobjSearchFilter('custrecord_bs_reconaccount',null,'is',accountId,null);
		var srStmts = nlapiSearchRecord('customrecord_nbsabr_bankstatement','customsearch_nbsabr_stmt_bydate_desc',sfReconAcct,null);
		if ((srStmts !== null) && (srStmts.length > 0)) {
			stStatementDate = srStmts[0].getValue('custrecord_bs_statementdate');
		} else {
			// fallback to previous functionality...
			// retrieve maximum date from existing bank trx and set as statement date
			var SFs = [ new nlobjSearchFilter('custrecord_bsl_reconaccount',null,'is',accountId ,null),
			            new nlobjSearchFilter('custrecord_bsl_reconciledstatement',null,'is','@NONE@' ,null)];
					
			var bsLines = nlapiSearchRecord('customrecord_nbsabr_bankstatementline','customsearch_nbsabr_bsl_orderbydate_desc',SFs,null);
			if(bsLines != null && bsLines.length >0)
			{
				stStatementDate = bsLines[0].getValue('custrecord_bsl_date');
			}
			else
			{
				stStatementDate = nlapiDateToString(today);
			}
		}
		
		//if date falls on a Friday and end of the month is at the weekend, use last day of month as statementdate
		var dtStmntDate = nlapiStringToDate(stStatementDate);
		var daysToEndOfMonth = dtStmntDate.monthDays() -  dtStmntDate.getDate();
		var dayOfWeek = dtStmntDate.getDay(); //5 = Friday
	
		if((dayOfWeek == 5) && (daysToEndOfMonth > 0) && (daysToEndOfMonth < 3)){
			dtStmntDate = nlapiAddDays(dtStmntDate,daysToEndOfMonth);
			stStatementDate = nlapiDateToString(dtStmntDate);
			
			nlapiLogExecution('debug','stStatementDate',stStatementDate);
		}
		
		//set display option to All
		displayOption = LIST_DISPLAY_UNMATCHED;	// LIST_DISPLAY_ALL;
	}
	fld_bankaccount.setDefaultValue(accountId);
	
	//Subsidiary
	var fld_subsidiary = form.addField('custpage_subsidiary', 'select',objResources[NBSABRSTR.SUBSID],'subsidiary','bankdetails');
	if(nbsABR.CONFIG.b_SubsEnabled){
		fld_subsidiary.setDisplayType('inline');
		fld_subsidiary.setDefaultValue (subsidiaryId);
		// 'This field displays the subsidiary associated with this reconcile account.'
		fld_subsidiary.setHelpText(objResources[NBSABRSTR.HLPDISPSUBSID]);
	}
	else{
		fld_subsidiary.setDisplayType('hidden');
		fld_subsidiary.setDefaultValue ('1');
	}
	
	// currency
	if(nbsABR.CONFIG.b_multiCurr){
		//Currency
		var fld_currency = form.addField('custpage_currency', 'select',objResources[NBSABRSTR.CRRNCY],'currency','bankdetails');
		fld_currency.setDisplayType('inline');
		fld_currency.setDefaultValue (accCurrId);
		// 'This field shows the base currency used for the figures on this page.'
		fld_currency.setHelpText(objResources[NBSABRSTR.HLPDISPCURR]);
	}
	
	//Statement Date
	var fld_statementdate = form.addField('custpage_statementdate', 'date',objResources[NBSABRSTR.STMTDT],null,'bankdetails');
	fld_statementdate.setDisplayType('normal');
	fld_statementdate.setMandatory(true);
	fld_statementdate.setDefaultValue(stStatementDate);
	// 'This field shows the closing date of your bank statement and defaults to the maximum date of unreconciled imported bank transactions for this account.'
	// 'If this date is a Friday and end of month falls at the following weekend, this date defaults to the end of the month.'
	// 'You can type or pick another date.'
	fld_statementdate.setHelpText(objResources[NBSABRSTR.HLPSTMTDT_LN1]+'\n\n'
			+objResources[NBSABRSTR.HLPSTMTDT_LN2]+'\n\n'
			+objResources[NBSABRSTR.HLPSTMTDT_LN3]);
	
	//start date (hidden)
//	var fld_startdate = form.addField('custpage_startdate', 'date', 'Start Date',null,'bankdetails');
	var fld_startdate = form.addField('custpage_startdate', 'date',objResources[NBSABRSTR.STRTDT],null,'bankdetails');
	fld_startdate.setDisplayType('hidden');
	fld_startdate.setMandatory(true);	
	fld_startdate.setDefaultValue(stStartDate);
	
	// account balance
//	var fld_accountbalance = form.addField('account_balance', 'currency', 'Account Balance',null,'bankdetails');
	var fld_accountbalance = form.addField('account_balance', 'currency',objResources[NBSABRSTR.ACCNTBLN],null,'bankdetails');
	fld_accountbalance.setLayoutType('normal','startcol');
	fld_accountbalance.setDisplayType('disabled');
	// 'This field shows the balance in NetSuite for this bank account as of the statement date'
	fld_accountbalance.setHelpText(objResources[NBSABRSTR.HLPACCTBAL]);
	
//	var flBal = getAccountBalance(accountId, stStatementDate, b_IsBaseCurr,false);
//	var flBal = nbsABR_getAccountBalance(arrAccts, stStatementDate, b_IsBaseCurr,false);
	var flBal = nbsABR_getAccountBalance_RS(accountId, stStatementDate, b_IsBaseCurr,false);
	fld_accountbalance.setDefaultValue(nlapiFormatCurrency(flBal));
	
	// account matched
	var fld_ns_matched = form.addField('custpage_ns_matched','currency',objResources[NBSABRSTR.MTCHD],null,'bankdetails');	// Matched
	fld_ns_matched.setLayoutType('normal');
	fld_ns_matched.setDisplayType('disabled');
	// 'This field shows the total of matched NetSuite transactions.'
	fld_ns_matched.setHelpText(objResources[NBSABRSTR.HLPNSMATCHED]);
	
	// account outstanding
	var fld_ns_outstanding = form.addField('custpage_ns_outstanding','currency',objResources[NBSABRSTR.OTSTNDNG],null,'bankdetails');	// 'Outstanding'
	fld_ns_outstanding.setLayoutType('normal');
	fld_ns_outstanding.setDisplayType('disabled');
	// 'This field show the total of outstanding NetSuite transactions.'
	fld_ns_outstanding.setHelpText(objResources[NBSABRSTR.HLPOTSTNDNG]);
	
	// matched balance
	var fld_ns_matchedbal = form.addField('custpage_ns_matchedbal','currency',objResources[NBSABRSTR.MTCHDBAL],null,'bankdetails');	// 'Matched Balance'
	fld_ns_matchedbal.setLayoutType('normal');
	fld_ns_matchedbal.setDisplayType('disabled');
	// 'This field shows the matched balance of NetSuite transactions.<br><br>This is the Account Balance less the Outstanding transactions.'
	fld_ns_matchedbal.setHelpText(objResources[NBSABRSTR.HLPMTCHDBAL]);
	
	// difference
	var fld_ns_diff = form.addField('custpage_ns_difference','currency',objResources[NBSABRSTR.DIFF],null,'bankdetails');	// 'Difference'
	fld_ns_diff.setLayoutType('normal');
	fld_ns_diff.setDisplayType('disabled');
	// 'This field shows the difference between the Matched Balance and the Statement Ending Balance (SEB - Matched).'
	fld_ns_diff.setHelpText(objResources[NBSABRSTR.HLPDIFF]);

	// statement opening balance (not hidden)
//	var fld_lastreconciledbalance = form.addField('custpage_lastbalance', 'currency', 'Statement Opening Balance',null,'bankdetails');
	var fld_lastreconciledbalance = form.addField('custpage_lastbalance', 'currency',objResources[NBSABRSTR.STMNTOPNBLN],null,'bankdetails');
	fld_lastreconciledbalance.setLayoutType('normal','startcol');
	fld_lastreconciledbalance.setDisplayType('disabled');	// ('hidden');
	// 'This field shows the last reconciled statement balance for this bank'
	fld_lastreconciledbalance.setHelpText(objResources[NBSABRSTR.HLPSTMNTOPNBLN]);
	
	// retrieve last reconciliation statement
	var shSF = [new nlobjSearchFilter('custrecord_sh_reconaccount',null,'is',  accountId,null)];
	var lastStatementSR = nlapiSearchRecord('customrecord_nbsabr_statementhistory','customsearch_nbsabr_statehist_datedesc',shSF,null);
	if(lastStatementSR != null && lastStatementSR.length > 0)
	{
		lastReconBal = lastStatementSR[0].getValue('custrecord_sh_endingbalance');
		fld_lastreconciledbalance.setDefaultValue(nlapiFormatCurrency(lastReconBal));
	}
	
	//Reconciled This Statement
	var fld_reconciledthis = form.addField('custpage_reconciledthis', 'currency',objResources[NBSABRSTR.MTCHD],null,'bankdetails');	// 'Matched'
	fld_reconciledthis.setDisplayType('disabled');
	// 'This field shows the total of matched Statement transactions.'
	fld_reconciledthis.setHelpText(objResources[NBSABRSTR.HLPSTMTMATCHED]);

	//Difference
	var fld_difference = form.addField('custpage_difference', 'currency',objResources[NBSABRSTR.OTSTNDNG],null,'bankdetails');	// 'Outstanding'
	fld_difference.setDisplayType('disabled');
	// 'This field show the total of outstanding Statement transactions.'
	fld_difference.setHelpText(objResources[NBSABRSTR.HLPSTMTOTSTNDNG]);
	
	//Statement Ending Balance
	var fld_endingstatementbalance = form.addField('custpage_endingbalance', 'currency',objResources[NBSABRSTR.STMTENDBLN],null,'bankdetails');
	fld_endingstatementbalance.setDisplayType('disabled');	// 'normal'
	fld_endingstatementbalance.setLayoutType('normal');	// ,'startcol');
	// 'This field shows the ending balance of the statement.'
	fld_endingstatementbalance.setHelpText(objResources[NBSABRSTR.HLPSTMTENDBLN]);
	// fld_endingstatementbalance.setMandatory(true);
	
	// spacer
	var fld_spacer = form.addField('custpage_spacer','inlinehtml','',null,'bankdetails');
	fld_spacer.setLayoutType('normal','startcol');
	
	//Current Reconciliation Report link
	var fld_reportLink = form.addField('reportlink','inlinehtml','',null,'linksetc');
	//var linkURL = nlapiResolveURL('SUITELET', 'customscript_nbsabr_currentreconrprt','customdeploy_nbsabr_currentreconrprt', null) + 
	var linkURL = nlapiResolveURL('SUITELET', 'customscript_nbsabr_currentreconrprt_new','customdeploy_nbsabr_currentreconrprt_new', null) + 
									'&accId='+accountId+'&statementDate='+stStatementDate+'&accBal='+flBal+'&openBal='+lastReconBal;
	fld_reportLink.setDefaultValue('<B><A target="_blank" HREF=" ' + linkURL +' ">'+objResources[NBSABRSTR.CRRNTRCNCLTNRPRT]+'</A></B>');
	

	//Display
	var fld_displayoption = form.addField('displayoption', 'select',objResources[NBSABRSTR.DSPLY],null,'fg_displayopt');	// ,null,'bankdetails');
	// fld_displayoption.setLayoutType('outsideabove','startrow');	// ('normal','startcol');
	fld_displayoption.addSelectOption('1',objResources[NBSABRSTR.ALL], false);//All
	fld_displayoption.addSelectOption('2',objResources[NBSABRSTR.MTCHD], false);//Matched
	fld_displayoption.addSelectOption('3',objResources[NBSABRSTR.UNMTCHD], false);//Unmatched
	fld_displayoption.setDefaultValue(displayOption);
	// 'Select a display option for the transactions listed below.'
	fld_displayoption.setHelpText(objResources[NBSABRSTR.HLPDSPLY]);
	// spacers
	var fld_spacer2 = form.addField('custpage_spacer2','inlinehtml','',null,'fg_displayopt');
	fld_spacer2.setLayoutType('normal','startcol');
	var fld_spacer3 = form.addField('custpage_spacer3','inlinehtml','',null,'fg_displayopt');
	fld_spacer3.setLayoutType('normal','startcol');
	var fld_spacer4 = form.addField('custpage_spacer4','inlinehtml','',null,'fg_displayopt');
	fld_spacer4.setLayoutType('normal','startcol');
	
	// error message field
	var fld_error = form.addField('error', 'inlinehtml', '',null,'linksetc');  
	fld_error.setLayoutType('normal','startcol');
	if(!isStringEmpty(strErrorMsg))
		fld_error.setDefaultValue(strErrorMsg);
	else
		fld_error.setDefaultValue('');
	
	var fld_Branding = form.addField('moduletitle','inlinehtml','',null,'linksetc');
	//Advanced Bank Reconciliation, by Nolan Business Solutions Plc
	fld_Branding.setDefaultValue('<font color="navy"><B>'+objResources[NBSABRSTR.ABR]+'</B>, '+objResources[NBSABRSTR.BYNBS]+'</font>');
	fld_Branding.setLayoutType('normal','startcol');
				
	// *** hidden fields ***
	var jsidField = form.addField('custpage_jsid', 'text', 'JSESSIONID:');
	jsidField.setDisplayType('hidden');
	jsidField.setDefaultValue(sessionId);

	// action
	form.addField('main_action','text','Action(hidden)',null,'bankdetails').setDisplayType('hidden');
	
	// allowforcedunmatch option
	var fld_allowforcedunmatch = form.addField('allowforcedunmatch','checkbox','',null,'bankdetails').setDisplayType('hidden');
	fld_allowforcedunmatch.setDefaultValue( (params['allowforcedunmatch']) ? 'T' : 'F' );
	
	// GL selected total
	var fld_matchvalue_gl = form.addField('matchvalue_gl','float','GL Selected Total',null,'bankdetails').setDisplayType('hidden');
	fld_matchvalue_gl.setDefaultValue(0);
		
	// Bank selected total
	var fld_matchvalue_bk = form.addField('matchvalue_bk','float','Bank Selected Total',null,'bankdetails').setDisplayType('hidden');
	fld_matchvalue_bk.setDefaultValue(0);
		
	// isBaseCurrency
	var fld_isbasecurrency = form.addField('isbasecurrency','checkbox','isBaseCurrency',null).setDisplayType('hidden');
	var stIsBaseCurr = (b_IsBaseCurr) ? 'T' : 'F';
	fld_isbasecurrency.setDefaultValue(stIsBaseCurr);
	nlapiLogExecution('debug','stIsBaseCurr',stIsBaseCurr);
	
	// iframe state
	var fld_frameState_A = form.addField('custpage_framestate_a','text','A').setDisplayType('hidden');
	fld_frameState_A.setDefaultValue('ready');
	var fld_frameState_B = form.addField('custpage_framestate_b','text','B').setDisplayType('hidden');
	fld_frameState_B.setDefaultValue('ready');
	// *** end ***
	
	// iFrame fields
	var glParams = '&gl_subsidiary='+subsidiaryId+'&gl_account='+accountId+'&gl_startdate='+stStartDate+'&gl_enddate='+stStatementDate+'&gl_isbasecurrency='+stIsBaseCurr;
	var bsParams = '&bs_subsidiary='+subsidiaryId+'&bs_account='+accountId+'&bs_startdate='+stStartDate+'&bs_enddate='+stStatementDate+'&bs_sub_currid='+subsidCurrId+'&bs_acc_currid='+accCurrId;
	var url = nlapiResolveURL('SUITELET', 'customscript_gl_transactions','customdeploy_gl_transactions')+glParams;
	var url_bank = nlapiResolveURL('SUITELET', 'customscript_banktransactions','customdeploy_banktransactions')+bsParams;
	
	var content_gl = '<iframe id=GL src='+url+' align="center" style="width: 700px; height:1000px; margin:0; border:0; padding:0"></iframe>';
	var content_bank = '<iframe id=BK src='+url_bank+' align="center" style="width: 700px; height:1000px; margin:0; border:0; padding:0"></iframe>';
	
	// NetSuite transactions
	var iFrame_GL = form.addField('custpage_frame_1', 'inlinehtml', 'NetSuite',null, 'myfieldgroup');
	iFrame_GL.setDefaultValue (content_gl);
	iFrame_GL.setLayoutType('startrow','none');

	// Bank transactions
	var iFrame_BK = form.addField('custpage_frame_2', 'inlinehtml', 'Bank',null, 'myfieldgroup');
	iFrame_BK.setDefaultValue (content_bank);
	iFrame_BK.setLayoutType('normal', 'startcol');

	fgFilters.setShowBorder(true);
	// fgFilters.setCollapsible(true, true);	// not supported on nlobjForm objects, only on nlobjAssistant
	
	/*** filter fields for NetSuite side ***/
	var fld_gl_dateFilter = form.addField('custpage_gl_datefilter','date','Date',null,'custpage_fg_filters');
	fld_gl_dateFilter.setLayoutType('normal');
	fld_gl_dateFilter.setHelpText('Select a date to filter for transactions on that date only.');
	var fld_gl_typeFilter = form.addField('custpage_gl_typefilter','select','Type',null,'custpage_fg_filters');
	fld_gl_typeFilter.setHelpText('Select a transaction type to filter for transactions of that type only.');
	// add select options to transaction type select list
	fld_gl_typeFilter.addSelectOption('', '');
	fld_gl_typeFilter.addSelectOption('5', objResources[NBSABRSTR.CSHSL]);		// 'Cash Sale');
	fld_gl_typeFilter.addSelectOption('29', objResources[NBSABRSTR.CSHRFND]);	// 'Cash Refund');
	fld_gl_typeFilter.addSelectOption('3', objResources[NBSABRSTR.CHQ]);		// 'Check');
	fld_gl_typeFilter.addSelectOption('40', objResources[NBSABRSTR.CSTDPST]);	// 'Customer Deposit');
	fld_gl_typeFilter.addSelectOption('30', objResources[NBSABRSTR.CSTRFND]);	// 'Customer Refund');
	fld_gl_typeFilter.addSelectOption('4', objResources[NBSABRSTR.DPST]);		// 'Deposit');
	fld_gl_typeFilter.addSelectOption('1', objResources[NBSABRSTR.JRN]);		// 'Journal');
	fld_gl_typeFilter.addSelectOption('9', objResources[NBSABRSTR.PYMNT]);		// 'Payment');
	fld_gl_typeFilter.addSelectOption('2', objResources[NBSABRSTR.XFER]);		// 'Transfer');
	fld_gl_typeFilter.addSelectOption('18', objResources[NBSABRSTR.BLLPYMNT]);	// 'Bill Payment');
	var fld_gl_entityNameFilter = form.addField('custpage_gl_entityfilter','text','Name',null,'custpage_fg_filters');
	fld_gl_entityNameFilter.setLayoutType('normal');
	fld_gl_entityNameFilter.setHelpText('Enter text to filter for transactions containing that text within the entity name.');

	var fld_gl_tranIdFilter = form.addField('custpage_gl_tranidfilter','text','Tran No',null,'custpage_fg_filters');
	fld_gl_tranIdFilter.setLayoutType('normal','startcol');
	fld_gl_tranIdFilter.setHelpText('Enter a transaction id to filter for transactions with that exact id only.');
	var fld_gl_memoFilter = form.addField('custpage_gl_memofilter','text','Memo',null,'custpage_fg_filters');
	fld_gl_memoFilter.setLayoutType('normal');
	fld_gl_memoFilter.setHelpText('Enter text to filter for transactions containing that text within the memo.');
	var fld_gl_amountFilter = form.addField('custpage_gl_amountfilter','currency','Amount',null,'custpage_fg_filters');
	fld_gl_amountFilter.setLayoutType('normal');
	fld_gl_amountFilter.setHelpText('Enter a value to filter for transactions of that exact value only.');

	/*** filter fields for Bank side ***/
	var fld_bk_dateFilter = form.addField('custpage_bk_datefilter','date','Date',null,'custpage_fg_filters');
	fld_bk_dateFilter.setLayoutType('normal','startcol');
	fld_bk_dateFilter.setHelpText('Select a date to filter for statement entries on that date only.');
	var fld_bk_typeFilter = form.addField('custpage_bk_typefilter','text','Type',null,'custpage_fg_filters');
	fld_bk_typeFilter.setLayoutType('normal');
	fld_bk_typeFilter.setHelpText('Enter text to filter for statement entries containing that text within the type.');

	var fld_bk_tranIdFilter = form.addField('custpage_bk_tranidfilter','text','Tran No',null,'custpage_fg_filters');
	fld_bk_tranIdFilter.setLayoutType('normal','startcol');
	fld_bk_tranIdFilter.setHelpText('Enter a transaction number to filter for statement entries with that exact number only.');
	var fld_bk_memoFilter = form.addField('custpage_bk_memofilter','text','Memo',null,'custpage_fg_filters');
	fld_bk_memoFilter.setLayoutType('normal');
	fld_bk_memoFilter.setHelpText('Enter text to filter for statement entries containing that text within the memo.');
	var fld_bk_amountFilter = form.addField('custpage_bk_amountfilter','currency','Amount',null,'custpage_fg_filters');
	fld_bk_amountFilter.setLayoutType('normal');
	fld_bk_amountFilter.setHelpText('Enter a value to filter for statement entries of that exact value only.');
}

/** glTransactionsSL - entry point for NetSuite Transaction Scriptlet
*
* This function provides all the functionality for the NetSuite Transaction sub-window
* 
* @param {nlobjRequest} request - the request made to the suitelet
* @param {nlobjResponse} response - the response object to write the page to
* 
* @return {void}
*/

function glTransactionsSL(request,response)
{
    var _failurePoint = 'NetSuite Trx SL';    
    var accountId = '';      
    var form;
    var rsId='';//internalid of Recon State rec
    var strTrnType='';//transaction type for error message
    var stMatchNumber = '';
    var bMatching = false;

    try{
	    var stAction = request.getParameter('gl_action');
		if (stAction === null)	stAction = '';
	    accountId = request.getParameter('gl_account');
	    stMatchNumber = request.getParameter('matchnum_gl');//match number
	    
        switch(stAction.toString())
        {
            case 'Match':   
            	_failurePoint = 'match NS transactions';
            	bMatching = true;
                        	
            	for(var i=1; i <=request.getLineItemCount('gl_list'); i+=1)
    			{     
    				if( (request.getLineItemValue('gl_list','gl_match',i) == 'T') )//&& (isStringEmpty(request.getLineItemValue('gl_list','custrecord_nbsabr_rs_matchnumber',i))) )
    				{	
    					rsId = request.getLineItemValue('gl_list','internalid',i); 
    					strTrnType = request.getLineItemValue('gl_list','custrecord_nbsabr_rs_trantype_display',i); 
    					try{
    						var fNames = ['custrecord_nbsabr_rs_matchnumber','custrecord_nbsabr_rs_status'];
    						var fValues = [stMatchNumber.toString(),nbsABR.CL.STATUS.MATCHED];
    						nlapiSubmitField('customrecord_nbsabr_reconciliationstate', rsId, fNames, fValues, false);
    					}
    					catch(e){
    						var stErrMsg = errText(e);
    						throw stErrMsg;
    						//var errObj = nlapiCreateError('ABR_MTCHERROR',stErrMsg,true);
							//throw(errObj);
    					}    					
    				}
    			}
                form = nbsABR_RenderExtractsForm(request,response);
                break;
               
            case 'Unmatch':
                // need some validation here 
            	_failurePoint = 'Unmatch NS transactions';
            	bMatching = false;
            	for(var i=1; i <=request.getLineItemCount('gl_list'); i+=1)
    			{  
            		var l_MN =  request.getLineItemValue('gl_list','custrecord_nbsabr_rs_matchnumber',i);          		
    				if( (request.getLineItemValue('gl_list','gl_match',i) == 'T') && (l_MN != '')){		
    					rsId = request.getLineItemValue('gl_list','internalid',i); 
    					try{
    						var fNames = ['custrecord_nbsabr_rs_matchnumber','custrecord_nbsabr_rs_status'];
    						var fValues = ['',nbsABR.CL.STATUS.UNMATCHED];
    						nlapiSubmitField('customrecord_nbsabr_reconciliationstate', rsId, fNames, fValues, false);
    					}
    					catch(e){
    						var stErrMsg = errText(e);
    						throw stErrMsg;
    						//var errObj = nlapiCreateError('ABR_MTCHERROR',stErrMsg,true);
							//throw(errObj);
    					}    	
    				}
    			}
                form = nbsABR_RenderExtractsForm(request,response);
                break;
     
            default:
                form = nbsABR_RenderExtractsForm(request,response);
         }
        response.writePage(form);
    }
    catch (GE){
    	var msg='';
    	if ( GE instanceof nlobjError )
			msg = GE.getCode() + '\n' + GE.getDetails();
		else
			msg = GE.toString();

		nlapiLogExecution('Error','Unhandled Exception',msg);
		nlapiLogExecution('Debug','Failure Point',_failurePoint);
		
		var stText = 'Error encountered matching transaction<br>'+strTrnType+' (internal id: '+rsId+')<br><br>'+msg;
		response.writeLine(stText);
		
		// if Matching - reset match number on bank trx to ''
		// if Unmatching - can't handle here - move all control to parent suitelet!!
		if(bMatching){
			var SF = [   new nlobjSearchFilter('custrecord_bsl_bankaccount',null,'anyof', [accountId],null),
				         new nlobjSearchFilter('custrecord_bsl_matchnumber',null,'equalto', stMatchNumber,null),
				         new nlobjSearchFilter('isinactive',null,'is', 'F',null)];
			
			var bankRecs = nlapiSearchRecord('customrecord_nbsabr_bankstatementline',null,SF,null);
		
			// could have multiple bank trx with same match number, so reset all
			for(var i=0; bankRecs != null && i < bankRecs.length; i+=1)
			{
				var id = bankRecs[i].getId();
				nlapiSubmitField('customrecord_nbsabr_bankstatementline',id, 'custrecord_bsl_matchnumber', '', false);
			}
			// roll back all Recon State records with same match number
			// assume it won't fail...as they matched they should unmatch
			var SFs = [new nlobjSearchFilter('custrecord_nbsabr_rs_matchnumber',null,'equalto', stMatchNumber,null),
			            new nlobjSearchFilter('custrecord_nbsabr_rs_reconacc',null,'anyof', [accountId],null)];
			
			var SR = nlapiSearchRecord('customrecord_nbsabr_reconciliationstate',null,SFs,null);
			
			for(var i=0; SR != null && i < SR.length; i+=1)
			{  
				nlapiSubmitField('customrecord_nbsabr_reconciliationstate', SR[i].getId(), 'custrecord_nbsabr_rs_matchnumber', '', false);
			}
		}
    }
}

/** nbsABR_RenderExtractsForm - page builder for NetSuite Extracts child window (iframe)
*
* @param {nlobjRequest} request - the request made to the suitelet
* @param {nlobjResponse} response - the response object to write the page to
* 
* @return {void}
*
*/

//function glPage_Init(request, response)
function nbsABR_RenderExtractsForm(request, response)
{  
	var ctx = nlapiGetContext();
	
	// get JS object of resources
	var objResources = nbsTRANSL_getResources(ctx);
	
	var form = nlapiCreateForm('GL',true);
	form.addFieldGroup('custpage_fg_gl_totals','totals').setShowBorder(false);
	form.addFieldGroup('custpage_fg_gl_filters','filters').setShowBorder(false);
	
	form.setScript('customscript_nbsabr_iframegl_c');	
	
	var subsidiaryId = request.getParameter('gl_subsidiary');
	var accountId = request.getParameter('gl_account');
	var stStartDate = request.getParameter('gl_startdate');
	var stEndDate = request.getParameter('gl_enddate');
	var stIsBaseCurr = request.getParameter('gl_isbasecurrency');
	var displayOption;
	
	var sfUserFilters = [];
		
	/*** filter fields for NetSuite side ***/
	var fld_gl_dateFilter = form.addField('gl_datefilter','date','Date',null,'custpage_fg_gl_filters');
	fld_gl_dateFilter.setDisplayType('hidden');
	var gl_dateFilter = request.getParameter('gl_datefilter');
	if (gl_dateFilter !== null && gl_dateFilter != '') {
		fld_gl_dateFilter.setDefaultValue(gl_dateFilter);
		sfUserFilters.push(new nlobjSearchFilter('custrecord_nbsabr_rs_trndate',null,'on', gl_dateFilter));
	}
	var fld_gl_typeFilter = form.addField('gl_typefilter','text','Type',null,'custpage_fg_gl_filters');
	fld_gl_typeFilter.setDisplayType('hidden');
	var gl_typeFilter = request.getParameter('gl_typefilter');
	if (gl_typeFilter !== null && gl_typeFilter != '') {
		fld_gl_typeFilter.setDefaultValue(gl_typeFilter);
		sfUserFilters.push(new nlobjSearchFilter('custrecord_nbsabr_rs_trantype',null,'anyof',[gl_typeFilter]));
	}
	var fld_gl_entityNameFilter = form.addField('gl_entityfilter','text','Name',null,'custpage_fg_gl_filters');
	fld_gl_entityNameFilter.setDisplayType('hidden');
	var gl_entityNameFilter = request.getParameter('gl_entityfilter');
	if (gl_entityNameFilter !== null && gl_entityNameFilter != '') {
		fld_gl_entityNameFilter.setDefaultValue(gl_entityNameFilter);
		sfUserFilters.push(new nlobjSearchFilter('custrecord_nbsabr_rs_entityname',null,'contains',gl_entityNameFilter));
	}
	var fld_gl_tranIdFilter = form.addField('gl_tranidfilter','text','Tran No',null,'custpage_fg_gl_filters');
	fld_gl_tranIdFilter.setDisplayType('hidden');
	var gl_tranIdFilter = request.getParameter('gl_tranidfilter');
	if (gl_tranIdFilter !== null && gl_tranIdFilter != '') {
		fld_gl_tranIdFilter.setDefaultValue(gl_tranIdFilter);
		sfUserFilters.push(new nlobjSearchFilter('custrecord_nbsabr_rs_tranid',null,'is',gl_tranIdFilter));
	}
	var fld_gl_memoFilter = form.addField('gl_memofilter','text','Memo',null,'custpage_fg_gl_filters');
	fld_gl_memoFilter.setDisplayType('hidden');
	var gl_memoFilter = request.getParameter('gl_memofilter');
	if (gl_memoFilter !== null && gl_memoFilter != '') {
		fld_gl_memoFilter.setDefaultValue(gl_memoFilter);
		sfUserFilters.push(new nlobjSearchFilter('custrecord_nbsabr_rs_memo',null,'contains',gl_memoFilter));
	}
	var fld_gl_amountFilter = form.addField('gl_amountfilter','currency','Amount',null,'custpage_fg_gl_filters');
	fld_gl_amountFilter.setDisplayType('hidden');
	var gl_amountFilter = request.getParameter('gl_amountfilter');
	if (gl_amountFilter !== null && gl_amountFilter != '') {
		fld_gl_amountFilter.setDefaultValue(gl_amountFilter);
		sfUserFilters.push(new nlobjSearchFilter('custrecord_nbsabr_rs_amount',null,'equalto',gl_amountFilter));
	}
	
	// hidden field to track amount field name (for client script)
	//var fld_amountFieldName = form.addField('custpage_amt_fldname','text','Amount Field Name').setDisplayType('hidden');
	//fld_amountFieldName.setDefaultValue(amountFldId);
	
	// disabled field: Total Matched
//	var fld_totalmatched = form.addField('custrecord_gltotalmarked','currency','Total Matched').setDisplayType('disabled');
	var fld_totalmatched = form.addField('custrecord_gltotalmarked','currency',objResources[NBSABRSTR.TTLMTCHD],null,'custpage_fg_gl_totals').setDisplayType('disabled');
	fld_totalmatched.setDisplaySize(25, 1);
	// 'This field is updated as you match/unmatch transactions.'
	fld_totalmatched.setHelpText(objResources[NBSABRSTR.HLPTTLMTCHD]);
	
	// disabled field: Total  Selected
//	var fld_glselected = form.addField('gl_selected','currency','Total Selected',null).setDisplayType('disabled');
	var fld_glselected = form.addField('gl_selected','currency',objResources[NBSABRSTR.TTLSLCTD],null,'custpage_fg_gl_totals').setDisplayType('disabled');
	fld_glselected.setDefaultValue('0.00');
	fld_glselected.setDisplaySize(25, 1);
	// 'This field is updated as you mark/unmark transactions.'
	fld_glselected.setHelpText(objResources[NBSABRSTR.HLPTTLSLCTD]);
	
	// Match button hidden by client script
	form.addButton('match_gl','Match',"if (window.isinited && window.isvalid && save_record(true)){main_form.submit();}");
	
	// *** hidden fields ***
	// action
	form.addField('gl_action','text','').setDisplayType('hidden');
			
	// subsidiary
	if(nbsABR.CONFIG.b_SubsEnabled){
		var fld_glsubsidiary = form.addField('gl_subsidiary','select','Subsidiary','subsidiary').setDisplayType('hidden');
		fld_glsubsidiary.setDefaultValue(subsidiaryId);
	}
	
	// tran lines total = sum of all reconciliation state lines for the bank within date range, i.e. matched + unmatched
	var fld_gllinetotal = form.addField('gl_linetotal','currency','Line Total').setDisplayType('hidden');

	// account
	var fld_glaccount = form.addField('gl_account','select','Account','account').setDisplayType('hidden');
	fld_glaccount.setDefaultValue(accountId);
	
	// start date
	var fld_glstartdate = form.addField('gl_startdate','date','Start Date').setDisplayType('hidden');
	fld_glstartdate.setDefaultValue(stStartDate);
	
	// end date
	var fld_glenddate = form.addField('gl_enddate','date','End Date').setDisplayType('hidden');
	fld_glenddate.setDefaultValue(stEndDate);
			
	// display option
	var fld_displayoption = form.addField('gl_displayoption','integer','Display',null).setDisplayType('hidden');
	
	// display option
	var fld_isbasecurrency = form.addField('gl_isbasecurrency','checkbox','isBaseCurrency',null).setDisplayType('hidden');
	fld_isbasecurrency.setDefaultValue(stIsBaseCurr);
	// ***
			
	if ( request.getMethod() == 'GET' ){	
		displayOption = LIST_DISPLAY_UNMATCHED;	// LIST_DISPLAY_ALL;
	}
	else{//POST
		displayOption = request.getParameter('gl_displayoption');
	}
	fld_displayoption.setDefaultValue(displayOption);
		
	// hidden field : Match Number
	form.addField('matchnum_gl','integer','Match Number').setDisplayType('hidden');
	
	// new sublist of Reconciliation State records
	var nsList = form.addSubList('gl_list','list',objResources[NBSABRSTR.NSTRNS]); // make type 'editor' if want to use field changed client script on sublist change  - inline to disabled
	nsList.addButton('gl_markall',objResources[NBSABRSTR.MRKLL], 'nbsGLMarkAll()');//Mark All
	nsList.addButton('gl_unmarkall',objResources[NBSABRSTR.UMRKLL], 'nbsGLUnmarkAll()');//Unmark All
	nsList.addField('custrecord_nbsabr_rs_trndate','date',objResources[NBSABRSTR.DT]).setDisplayType('inline');// Date
	nsList.addField('custrecord_nbsabr_rs_trantype_display','text',objResources[NBSABRSTR.TYP]).setDisplayType('inline'); //Type
	nsList.addField('formulatext_1','url',objResources[NBSABRSTR.VW],true).setLinkText(objResources[NBSABRSTR.VW]);//View 
	nsList.addField('custrecord_nbsabr_rs_entityname','text',objResources[NBSABRSTR.NM]).setDisplayType('inline');//Name
	nsList.addField('custrecord_nbsabr_rs_tranid','text',objResources[NBSABRSTR.TRNNO]).setDisplayType('inline');// TranId
	nsList.addField('custrecord_nbsabr_rs_memo','textarea',objResources[NBSABRSTR.MM]).setDisplayType('inline');// Memo
	nsList.addField('custrecord_nbsabr_rs_amount','currency',objResources[NBSABRSTR.AMT]).setDisplayType('inline');// Amount
	nsList.addField('gl_match','checkbox',objResources[NBSABRSTR.MTCH]); // Select
	nsList.addField('custrecord_nbsabr_rs_matchnumber','integer','ID').setDisplayType('inline');	// Match Number formulanumeric?
	// hidden fields
	nsList.addField('internalid','text','ID').setDisplayType('hidden');
	nsList.addField('custrecord_nbsabr_rs_linenumber','integer','Line').setDisplayType('hidden');//line number for journal
	nsList.addField('custrecord_nbsabr_rs_trantype','text','TrxType').setDisplayType('hidden');// internal id of transaction type
	
	// define search filter
	var rsSFs = [ new nlobjSearchFilter('custrecord_nbsabr_rs_reconacc',null,'is', accountId,null),
	              new nlobjSearchFilter('custrecord_nbsabr_rs_trndate',null,'onorbefore', stEndDate)];
	            // new nlobjSearchFilter('custrecord_nbsabr_rs_trndate',null,'within', stStartDate,stEndDate)];
	
	for (var filterIdx = 0; filterIdx < sfUserFilters.length; ++filterIdx) {
		rsSFs.push(sfUserFilters[filterIdx]);
	}

	/*
	// calculate matched total
	var results = nlapiSearchRecord('customrecord_nbsabr_reconciliationstate','customsearchnbsabr_reconstate_matchedsum',rsSFs,null);	
	matchedTotal = results[0].getValue('custrecord_nbsabr_rs_amount', null,'sum');
	fld_totalmatched.setDefaultValue(nlapiFormatCurrency(matchedTotal));
	*/
	
	// use summary search to get totals directly
	var statusIndex = rsSFs.length;
	// rsSFs.push(new nlobjSearchFilter('custrecord_nbsabr_rs_status',null,'anyOf',[nbsABR.CL.STATUS.UNMATCHED,nbsABR.CL.STATUS.MATCHED],null));
	rsSFs.push(new nlobjSearchFilter('custrecord_nbsabr_rs_status',null,'noneof',nbsABR.CL.STATUS.RECONCILED,null));	// may be quicker
	var glTrnSum = nlapiSearchRecord('customrecord_nbsabr_reconciliationstate','customsearch_nbsabr_allsum',rsSFs,null);
	var glTotal = 0.0;
	var matchedTotal = 0.0;
	if ((glTrnSum !== null) && (glTrnSum.length > 0)) {
		var cols = glTrnSum[0].getAllColumns();
		for (var j=0; j<cols.length; ++j) {
			if (cols[j].getLabel() == 'TOTAL AMT SUM')
				glTotal = ncParseFloatNV(glTrnSum[0].getValue(cols[j]),0);
			if (cols[j].getLabel() == 'TOTAL MATCH')
				matchedTotal = ncParseFloatNV(glTrnSum[0].getValue(cols[j]),0);
		}
	}
	fld_gllinetotal.setDefaultValue(nlapiFormatCurrency(glTotal));
	fld_totalmatched.setDefaultValue(nlapiFormatCurrency(matchedTotal));
	
//	nlapiLogExecution('debug','total match (sum) ', nlapiFormatCurrency(matchedTotal));      
		
	var templateURL = /*getBaseURL() +*/ nlapiResolveURL('RECORD','customrecord_nbsabr_reconciliationstate','-1');
	templateURL = templateURL.replace('-1','');
	var scURL = new nlobjSearchColumn('formulatext_1');
	scURL.setLabel('View');
	scURL.setFormula("'"+templateURL+"'||{internalid}");
	
	// search transactions filtered by display option
	if(displayOption == LIST_DISPLAY_MATCHED){	
		rsSFs[statusIndex] = new nlobjSearchFilter('custrecord_nbsabr_rs_status',null,'anyof',nbsABR.CL.STATUS.MATCHED,null);
	}
	else if(displayOption == LIST_DISPLAY_UNMATCHED){		
		rsSFs[statusIndex] = new nlobjSearchFilter('custrecord_nbsabr_rs_status',null,'anyof',nbsABR.CL.STATUS.UNMATCHED,null);
	}
	else{
		rsSFs[statusIndex] = new nlobjSearchFilter('custrecord_nbsabr_rs_status',null,'noneof',nbsABR.CL.STATUS.RECONCILED,null);
	}
	
	var reconStateRecs = nlapiSearchRecord('customrecord_nbsabr_reconciliationstate','customsearch_nbsabr_reconstate_unrecon',rsSFs,scURL);
	nsList.setLineItemValues(reconStateRecs);
		
	return form;
}

/** bankTransactionsSuitelet - entry point for Bank Transactions Scriptlet
*
* This function provides all the functionality for the Reconcile Bank Statement window
* 
* @param {nlobjRequest} request - the request made to the suitelet
* @param {nlobjResponse} response - the response object to write the page to
* 
* @return {void}
*/

function bankTransactionsSuitelet(request, response)
{
	try{
		var form;
        var stAction = request.getParameter('bs_action');
		if (stAction === null)	stAction = '';

        switch(stAction.toString())
        {
            case 'Match':    
            	var stMatchNumber = request.getParameter('matchnum_bs');
            	 
            	for(var i=1; i <=request.getLineItemCount('bs_list'); i+=1)
    			{
    				if( (request.getLineItemValue('bs_list','bs_match',i) == 'T') && (isStringEmpty(request.getLineItemValue('bs_list','custrecord_bsl_matchnumber',i))) )
    				{	
    					var txId = request.getLineItemValue('bs_list','internalid',i);    
    					nlapiSubmitField('customrecord_nbsabr_bankstatementline', txId, 'custrecord_bsl_matchnumber', stMatchNumber, false);    				
    				}
    			}
                form = bsPage_Init(request,response);
                break;
                
            case 'Unmatch':
            	for(var i=1; i <=request.getLineItemCount('bs_list'); i+=1)
    			{
    				if( (request.getLineItemValue('bs_list','bs_match',i) == 'T') && (!isStringEmpty(request.getLineItemValue('bs_list','custrecord_bsl_matchnumber',i))) )
    				{	
    					var txId = request.getLineItemValue('bs_list','internalid',i);    
    					nlapiSubmitField('customrecord_nbsabr_bankstatementline', txId, 'custrecord_bsl_matchnumber', '', false);
    				}
    			}
                form = bsPage_Init(request,response);
                break;
                
            case 'Reconcile':            	
            	for(var i=1; i <=request.getLineItemCount('bs_list'); i+=1)
    			{     
            		var gl_matchid =  request.getLineItemValue('bs_list','custrecord_bsl_matchnumber',i);
    				if(!isStringEmpty(gl_matchid))
    				{	
    					var trxId = request.getLineItemValue('bs_list','internalid',i);   	
    					nlapiSubmitField('customrecord_nbsabr_bankstatementline', trxId, 'custrecord_bsl_reconciledstatement', SHid, false);
    				}
    			}
                form = nbsABR_RenderExtractsForm(request,response);
                break;
                
            case 'Submitted':
                form = bsPage_Submit(request,response);
                break;
                
            default:
                form = bsPage_Init(request,response);
        }
        response.writePage(form);
    }
    catch(GE){
    	var msg='';
    	if ( GE instanceof nlobjError )
			msg = GE.getCode() + '\n' + GE.getDetails();
		else
			msg = GE.toString();

		nlapiLogExecution('Error','Unhandled Exception',msg);
		var stText = 'Error encountered matching/unmatching bank transaction<br><br>'+msg;
		response.writeLine(stText);
    }
}

/** bsPage_Init - page builder for Bank Transactions sub-window
*
* @param {nlobjRequest} request - the request made to the suitelet
* @param {nlobjResponse} response - the response object to write the page to
* 
* @return {void}
*
*/
function bsPage_Init(request,response)
{	
	var ctx = nlapiGetContext();	
	// get JS object of resources
	var objResources = nbsTRANSL_getResources(ctx);
	
	var form = nlapiCreateForm('Bank',true);
	form.setScript('customscript_nbsabr_iframebs_c');
	form.addFieldGroup('custpage_fg_bk_totals','totals').setShowBorder(false);
	form.addFieldGroup('custpage_fg_bk_filters','filters').setShowBorder(false);
	
	var subsidiaryId = 1;
	if(nbsABR.CONFIG.b_SubsEnabled){
		subsidiaryId = request.getParameter('bs_subsidiary');
	}
	var accountId = request.getParameter('bs_account');
//	var b_IsBaseCurr = nbsABR_IsBaseCurrency(accountId);
	var stStartDate = request.getParameter('bs_startdate');
	var stEndDate = request.getParameter('bs_enddate');
	var subsidCurrId = request.getParameter('bs_sub_currid');
	var accCurrId = request.getParameter('bs_acc_currid');
	var displayOption;

	var sfUserFilters = [];
		
	/*** filter fields for Bank Statement side ***/
	var fld_bk_dateFilter = form.addField('bk_datefilter','date','Date',null,'custpage_fg_bk_filters');
	fld_bk_dateFilter.setDisplayType('hidden');
	var bk_dateFilter = request.getParameter('bk_datefilter');
	if (bk_dateFilter !== null && bk_dateFilter != '') {
		fld_bk_dateFilter.setDefaultValue(bk_dateFilter);
		sfUserFilters.push(new nlobjSearchFilter('custrecord_bsl_date',null,'on', bk_dateFilter));
	}
	var fld_bk_typeFilter = form.addField('bk_typefilter','text','Type',null,'custpage_fg_bk_filters');
	fld_bk_typeFilter.setDisplayType('hidden');
	var bk_typeFilter = request.getParameter('bk_typefilter');
	if (bk_typeFilter !== null && bk_typeFilter != '') {
		fld_bk_typeFilter.setDefaultValue(bk_typeFilter);
		sfUserFilters.push(new nlobjSearchFilter('custrecord_bsl_type',null,'contains',bk_typeFilter));
	}
	var fld_bk_tranIdFilter = form.addField('bk_tranidfilter','text','Tran No',null,'custpage_fg_bk_filters');
	fld_bk_tranIdFilter.setDisplayType('hidden');
	var bk_tranIdFilter = request.getParameter('bk_tranidfilter');
	if (bk_tranIdFilter !== null && bk_tranIdFilter != '') {
		fld_bk_tranIdFilter.setDefaultValue(bk_tranIdFilter);
		sfUserFilters.push(new nlobjSearchFilter('custrecord_bsl_checknumber',null,'is',bk_tranIdFilter));
	}
	var fld_bk_memoFilter = form.addField('bk_memofilter','text','Reference',null,'custpage_fg_bk_filters');
	fld_bk_memoFilter.setDisplayType('hidden');
	var bk_memoFilter = request.getParameter('bk_memofilter');
	if (bk_memoFilter !== null && bk_memoFilter != '') {
		fld_bk_memoFilter.setDefaultValue(bk_memoFilter);
		sfUserFilters.push(new nlobjSearchFilter('custrecord_bsl_reference',null,'contains',bk_memoFilter));
	}
	var fld_bk_amountFilter = form.addField('bk_amountfilter','currency','Amount',null,'custpage_fg_bk_filters');
	fld_bk_amountFilter.setDisplayType('hidden');
	var bk_amountFilter = request.getParameter('bk_amountfilter');
	if (bk_amountFilter !== null && bk_amountFilter != '') {
		fld_bk_amountFilter.setDefaultValue(bk_amountFilter);
		sfUserFilters.push(new nlobjSearchFilter('custrecord_bsl_amount',null,'equalto',bk_amountFilter));
	}
	

	// disabled field: Total amount matched
//	var fld_totalmatched = form.addField('custrecord_bstotalmarked','currency','Matched').setDisplayType('disabled');
	var fld_totalmatched = form.addField('custrecord_bstotalmarked','currency',objResources[NBSABRSTR.TTLMTCHD],null,'custpage_fg_bk_totals').setDisplayType('disabled');
	fld_totalmatched.setDisplaySize(15, 1);
	fld_totalmatched.setHelpText(objResources[NBSABRSTR.HLPTTLMTCHD]);
	
	// disabled field: Total  Selected
//	var fld_bkselected = form.addField('bk_selected','currency','Selected',null).setDisplayType('disabled');
	var fld_bkselected = form.addField('bk_selected','currency',objResources[NBSABRSTR.TTLSLCTD],null,'custpage_fg_bk_totals').setDisplayType('disabled');
	fld_bkselected.setDefaultValue('0.00');
	fld_bkselected.setDisplaySize(15, 1);
	fld_bkselected.setLayoutType('normal', 'startcol');
	fld_bkselected.setHelpText(objResources[NBSABRSTR.HLPTTLSLCTD]);
		
	// button hidden by client script	
	form.addButton('match_bs','Match',"if (window.isinited && window.isvalid && save_record(true)){main_form.submit();}");
	
	// *** hidden fields
	// action
	form.addField('bs_action','text','').setDisplayType('hidden');
		
	// subsidiary
	if(nbsABR.CONFIG.b_SubsEnabled){
		var fld_bssubsidiary = form.addField('bs_subsidiary','select','Subsidiary','subsidiary').setDisplayType('hidden');
		fld_bssubsidiary.setDefaultValue(subsidiaryId);
	}
	
	// reconcile account
	var fld_bkaccount = form.addField('bs_account','select','Account','customrecord_nbsabr_accountsetup').setDisplayType('hidden');
	fld_bkaccount.setDefaultValue(accountId);
	
	// currency fields required for Create GL button
	// subsidiary/company currency
	var fld_bksubCurr = form.addField('bs_sub_currid','select','Sub Currency','currency').setDisplayType('hidden');
	fld_bksubCurr.setDefaultValue(subsidCurrId);
	
	// account currency
	var fld_bkaccCurr = form.addField('bs_acc_currid','select','Acc Currency','currency').setDisplayType('hidden');
	fld_bkaccCurr.setDefaultValue(accCurrId);
	
	// start date
	var fld_bkstartdate = form.addField('bs_startdate','date','Start Date',null).setDisplayType('hidden');
	fld_bkstartdate.setDefaultValue(stStartDate);
	
	// end date
	var fld_bkenddate = form.addField('bs_enddate','date','End Date',null).setDisplayType('hidden');
	fld_bkenddate.setDefaultValue(stEndDate);
	
	// bank total
	var fld_bktotal = form.addField('bk_total','currency','BK Total',null).setDisplayType('hidden');
	
	// display option
	var fld_displayoption = form.addField('bk_displayoption','integer','Display',null).setDisplayType('hidden');
		
	// match number
	form.addField('matchnum_bs','integer','Match Number').setDisplayType('hidden');
	// ***
		
	if ( request.getMethod() == 'GET' ){
		displayOption = LIST_DISPLAY_UNMATCHED;	// LIST_DISPLAY_ALL;
	}
	else{//POST		
		displayOption = request.getParameter('bk_displayoption');
	}
	fld_displayoption.setDefaultValue(displayOption);
				
	var bs_List = form.addSubList('bs_list','list',objResources[NBSABRSTR.BNKSTMTTRNS]); //Bank Statement Transactions
	// buttons
	bs_List.addButton('bs_markall',objResources[NBSABRSTR.MRKLL], 'nbsBankMarkAll()');//Mark All
	bs_List.addButton('bs_unmarkall',objResources[NBSABRSTR.UMRKLL], 'nbsBankUnmarkAll()');//Unmark All
	bs_List.addButton('create_gl_trx',objResources[NBSABRSTR.CRTGLTRN], 'nbsCreateGLTrx()');//Create GL Transaction
	// fields
	bs_List.addField('custrecord_bsl_date','date',objResources[NBSABRSTR.DT]).setDisplayType('inline');//Date
	bs_List.addField('custrecord_bsl_type','text',objResources[NBSABRSTR.TYP]).setDisplayType('inline');//Type
	bs_List.addField('formulatext','url',objResources[NBSABRSTR.VW],true).setLinkText(objResources[NBSABRSTR.VW]);//View
	bs_List.addField('custrecord_bsl_reference','text',objResources[NBSABRSTR.REF]).setDisplayType('inline');//Reference
	bs_List.addField('custrecord_bsl_checknumber','text',objResources[NBSABRSTR.TRNNO]).setDisplayType('inline');//Tranid
	bs_List.addField('custrecord_bsl_amount','currency',objResources[NBSABRSTR.AMT]).setDisplayType('inline');	//Amount
	bs_List.addField('bs_match','checkbox',objResources[NBSABRSTR.MTCH]);//MAtch
	bs_List.addField('custrecord_bsl_matchnumber','integer','ID').setDisplayType('inline');//ID
	bs_List.addField('internalid','text','Id').setDisplayType('hidden');//Internalid
			
	var bslSF = [//new nlobjSearchFilter('custrecord_bsl_bankaccount',null,'is', accountId,null),
	             new nlobjSearchFilter('custrecord_bsl_reconaccount',null,'is', accountId,null),
	             new nlobjSearchFilter('custrecord_bsl_date',null,'within', stStartDate, stEndDate),
	             new nlobjSearchFilter('custrecord_bsl_reconciledstatement',null,'anyof','@NONE@' ,null)];

	for (var filterIdx = 0; filterIdx < sfUserFilters.length; ++filterIdx) {
		bslSF.push(sfUserFilters[filterIdx]);
	}

	/*
	var bsTransactions = nlapiSearchRecord('customrecord_nbsabr_bankstatementline','customsearch_nbsabr_bankstatementtrx',bslSF,null);
	// calculate total amount
	var bkTotal = 0;
	var matchedTotal = 0;
	for(var i = 0; bsTransactions != null && i < bsTransactions.length; i++){
		bkAmt = bsTransactions[i].getValue('custrecord_bsl_amount');
		bkTotal += ncParseFloatNV(bkAmt,0)*100;
		
		var matchNum = bsTransactions[i].getValue('custrecord_bsl_matchnumber');
	//	var matchNum = bsTransactions[i].getValue('custrecord_bsl_reconref');
		if(matchNum != null && matchNum.length != 0)
		{
			matchedTotal += ncParseFloatNV(bkAmt,0)*100;
		}
	}
	fld_bktotal.setDefaultValue(nlapiFormatCurrency(bkTotal/100));
	fld_totalmatched.setDefaultValue(nlapiFormatCurrency(matchedTotal/100));
	*/
	// use summary search to get totals directly
	var bsTrnSum = nlapiSearchRecord('customrecord_nbsabr_bankstatementline','customsearch_nbsabr_banktotals',bslSF,null);
	var bkTotal = 0.0;
	var matchedTotal = 0.0;
	if ((bsTrnSum !== null) && (bsTrnSum.length > 0)) {
		var cols = bsTrnSum[0].getAllColumns();
		for (var j=0; j<cols.length; ++j) {
			if (cols[j].getLabel() == 'TOTAL AMT SUM')
				bkTotal = ncParseFloatNV(bsTrnSum[0].getValue(cols[j]),0);
			if (cols[j].getLabel() == 'TOTAL MATCH')
				matchedTotal = ncParseFloatNV(bsTrnSum[0].getValue(cols[j]),0);
		}
	}
	fld_bktotal.setDefaultValue(nlapiFormatCurrency(bkTotal));
	fld_totalmatched.setDefaultValue(nlapiFormatCurrency(matchedTotal));
//	var label = nlapiFormatCurrency(matchedTotal/100).toString();
//	bs_List.setLabel(label);
	// search & dispaly transactions filtered by radio button options
	if(displayOption == LIST_DISPLAY_MATCHED){
		bslSF.push(new nlobjSearchFilter('custrecord_bsl_matchnumber',null,'isnotempty', null,null));
	}
	else if(displayOption == LIST_DISPLAY_UNMATCHED){
		bslSF.push(new nlobjSearchFilter('custrecord_bsl_matchnumber',null,'isempty', null,null));
	}

	var templateURL = /*getBaseURL() +*/ nlapiResolveURL('RECORD','customrecord_nbsabr_bankstatementline','-1');
	templateURL = templateURL.replace('-1','');
	var scURL = new nlobjSearchColumn('formulatext');
	scURL.setLabel('View');
	scURL.setFormula("'"+templateURL+"'||{internalid}");
	
	var bsTransactions = nlapiSearchRecord('customrecord_nbsabr_bankstatementline','customsearch_nbsabr_bankstatementtrx',bslSF,scURL);
	bs_List.setLineItemValues(bsTransactions);
	
	return form;
}

function nbsABR_RenderPreForm(form, acctId, reconAcctId) {
	form.setScript('customscript_nbsabr_reconcile_pre_c');

	// display message
	var displayMsg = form.addField('custpage_display_msg','inlinehtml','');
	displayMsg.setDefaultValue('Retrieving system configuration and validating prerequisites . . .');

	// hidden fields
	var jsidField = form.addField('custpage_jsid', 'text', 'JSESSIONID:');
	jsidField.setDisplayType('hidden');
	
	var fld_pageState = form.addField('custpage_state', 'text', 'Page State');
	fld_pageState.setDisplayType('hidden');
	fld_pageState.setDefaultValue('Preload');

	// hidden fields to hold original URL query parameters
	var fld_acct = form.addField('custpage_accountid', 'text', 'Account Id');
	fld_acct.setDisplayType('hidden');
	if ((acctId !== undefined) && (acctId !== null) && (acctId !== ''))
		fld_acct.setDefaultValue(acctId);
	
	var fld_reconAcct = form.addField('custpage_reconaccountid', 'text', 'Reconcile Account Id');
	fld_reconAcct.setDisplayType('hidden');
	if ((reconAcctId !== undefined) && (reconAcctId !== null) && (reconAcctId !== ''))
		fld_reconAcct.setDefaultValue(reconAcctId);
}

function nbsABR_ValidatePreReqs(sessionId) {
	var errMsg = '';
	// validate Multi-Language bundle is installed
	var objResources = null;
	try {
		// attempt to retrieve resources record
		nlapiSearchRecord(nbsTRANSL_RT_Resources.ScriptId,null,null,null);
		
		var ctx = nlapiGetContext();
		// get JS object of resources
		objResources = nbsTRANSL_getResources(ctx);
	} catch (X)	{
		errMsg += '<BR><b>Unable to retrieve translation details.<BR><BR>Please install bundle - Multi-Language (id: 21459)</b><BR><BR>Error:'+X.toString();
	}

	//start reg test
	try {
		// N.B. this always returns INTERNAL url, even if EXTERNAL is requested ... use internal form so not breaking if this changes in future!
		// var RKcheckURL = nlapiResolveURL('RESTLET', 'customscript_ncrk_regkeyvalidate_rl', 'customdeploy_ncrk_regkeyvalidate_rl');
		var RKcheckURL = nlapiResolveURL('SUITELET', 'customscript_ncrk_regkeyvalidate', 'customdeploy_ncrk_regkeyvalidate');

		// Get base URL
		var re = new RegExp('^(?:f|ht)tp(?:s)?\://([^/]+)', 'im');
		var baseURL = request.getURL().match(re)[0].toString();

		var headers = [];
		headers['Host'] = baseURL;
		headers['Cookie'] = sessionId;
		// headers['Content-Type'] = 'application/json';

		// RKcheckURL += '&productid=' + nbsABR.CONFIG.productId; // internal product id, i.e. ABR = 327676
		headers['productid'] = nbsABR.CONFIG.productId; // internal product id, i.e. ABR = 327676
		var configResp = nlapiRequestURL(baseURL+RKcheckURL, null, headers);
		
		var respText; 
		if (configResp.getBody !== undefined)
			respText = configResp.getBody();
		else
			respText = configResp;
		
		// var respObj = JSON.parse(respText);
		var respArr = respText.split(':',2);
		if (respArr.length < 2) {
			// ensure minimum 2 elements
			respArr.push(null);
			respArr.push(null);
		}
		var respObj = { keyStatus: respArr[0], statusDescription: respArr[1] };
		if ((respObj !== null) && (respObj.keyStatus !== undefined) && (respObj.keyStatus !== null)) {
			// validate keyStatus, use statusDescription in error message
			if (respObj.keyStatus != '0') {
				if (objResources !== null)
					errMsg += '<BR><b>'+objResources[NBSABRSTR.ERRVLDTNGPRDCTRGSTRTNKY]+'.<BR><BR>'+respObj.statusDescription+'</b>';
				else
					errMsg += '<BR><b>Error validating product registration key.<BR><BR>'+respObj.statusDescription+'</b>';
			}
		} else {
			var errObj = nlapiCreateError('BAD_RESPONSE','Unexpected response from RESTlet - '+respText,true);
			throw errObj;
		}
	} catch (X) {
		//Unable to validate registration keys
		//Please ensure the pre-requisite bundle is installed - Product Registration (id: 1768)
		if (objResources !== null)
			errMsg += '<BR><b>'+objResources[NBSABRSTR.UNABLEVLDTRGSTRTNKYS]+'.<BR><BR>'
					+ objResources[NBSABRSTR.PLSNSRPRRQSTBNDLNSTLLD]+' - Product Registration (id: 1768)</b><BR><BR>'
					+ objResources[NBSABRSTR.ERRTXT]+':'+X.toString();
		else
			errMsg += '<BR><b>Unable to validate registration keys.<BR><BR>'
					+ 'Please ensure the pre-requisite bundle is installed - Product Registration (id: 1768)</b><BR><BR>'
					+ 'Error:'+X.toString();
	}

	// validate other pre-requisites (e.g. Background Processing bundle)
	try {
		// attempt to retrieve process definition record
		nlapiSearchRecord('customrecord_ncbgp_procinstance',null,null,null);
	} catch (X){
		//Please ensure the pre-requisite bundle is installed - Background Processing (id: 8459)
		if (objResources !== null)
			errMsg += '<BR><b>'+objResources[NBSABRSTR.UNBLRTRVBCKGRDPRCSSDTLS]+'.<BR><BR>'
					+ objResources[NBSABRSTR.PLSNSRPRRQSTBNDLNSTLLD]+' - '+objResources[NBSABRSTR.BCKGRDPRCSSNG]+' (id: 8459)</b><BR><BR>'
					+ objResources[NBSABRSTR.ERRTXT]+':'+X.toString();
		else
			errMsg += '<BR><b>Unable to retrieve Background Processing objects.<BR><BR>'
					+ 'Please ensure the pre-requisite bundle is installed - Background Processing (id: 8459)</b><BR><BR>'
					+ 'Error:'+X.toString();
	}
	
	if (errMsg != '')
		return errMsg;
	else
		return 'Okay';
}
