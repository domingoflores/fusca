
/** bankStatementUploadSL - entry point for Import Statement Scriptlet
*
* This function provides all the functionality for the Import StatementStatement window
* 
* @param {nlobjRequest} request - the request made to the suitelet
* @param {nlobjResponse} response - the response object to write the page to
* 
* @return {void}
*/
function bankStatementUploadSL(request, response)
{
	//	Bank Statement Upload
	var form = nlapiCreateForm('Import Statement');

	var pageState = request.getParameter('custpage_state');

	if ((pageState === undefined) || (pageState === null) || (pageState == ''))
		pageState = 'Init';	// first time through
	
	if (pageState == 'Init') {
		// retrieve session id for RESTlet call if first time through
		nbsABR_RenderPreForm(form);
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
	form.setTitle(objResources[NBSABRSTR.BNKSTMTUPLD]);
	
    var stAction = request.getParameter('main_action');
    var _failurePoint='';
    var subsidiaryId='1';
    var accountId='';
    var stError ='';
    var intCount = 0;
    var show = true;

    // attach client script
	form.setScript('customscript_nbsabr_import_c');

	if (pageState == 'Submit')
	{
		//subsidiaryId = request.getParameter('subsidiary');
		stAction = 'Import';

	    switch(stAction)
	    {
	        case 'RefreshAcc':
	        	accountId = request.getParameter('custpage_account');
	        	
	        	debugLog(show, 'refresh accountId', accountId);
	            break;

	        /*case 'RefreshSub':
	        	accountId = '';
	        	
	        	debugLog(show, 'refresh sub accId', accountId);
	            break;*/

	        case 'Import':
	        	debugLog(show, 'Import', 'Import');
	        	var objFile = request.getFile("file");
				var formatId = request.getParameter('custpage_format');
				var stEncodingType = getEncodingType(request.getParameter('encoding'));
				var fileId = null;
		
				if (objFile == null){
					// ERROR! Please select a file to import
					stError = "<font color='red'><B>"+objResources[NBSABRSTR.ERR]+"! "+objResources[NBSABRSTR.SLCTFILEIMPORT]+"<B/></font>";
					break;
				}
				else if(String(formatId).length == 0){
					// ERROR! Please select a format
					stError ="<font color='red'><B>"+objResources[NBSABRSTR.ERR]+"! "+objResources[NBSABRSTR.SLCTFILEFMT]+"</B></font>";
					break;
				}
				else{
		    		try{
		    			_failurePoint ='loading  format';
		    			accountId = request.getParameter('custpage_account');
		   
		    			_failurePoint ='validating import type';
		    			if(!importTypeOK(objFile)){
		    				// 'INVALID FILE TYPE! Please select a comma delimited (.csv), tab delimited (.txt) or other valid file for processing.'
		    				var stErrorMsg = objResources[NBSABRSTR.INVLDFILETYPE]+"! "+objResources[NBSABRSTR.SLCTCSVTXTOTHER];
		    				response.writeLine(stErrorMsg);
		    				return;
		    			}
		    			else{
		    				// search for folder
		    				_failurePoint ='retrieve ABR Import Files folder';
		    				
		    				var folderId = null;
		    			    var filters = [ new nlobjSearchFilter('name', null, 'startswith','ABR Import Files')];
		    			    var recFolder = nlapiSearchRecord('folder',null,filters,null);
		    			    if(recFolder != null && recFolder.length >0){
		    			    	folderId = recFolder[0].getId();
		    				}
		    				objFile.setFolder(folderId);
		    				var stFileName = objFile.getName();
		    		
		    				if( (objFile.getType() == 'MISCBINARY') || ((objFile.getType() == 'PLAINTEXT') && (stFileName.indexOf('.txt') == -1)))
		    				{
		    					objFile.setName(stFileName+'.txt');
		    				}   				
		    				// set encoding
		    				objFile.setEncoding(stEncodingType);
		    				// create file and upload it to the file cabinet
		    			    fileId = nlapiSubmitFile(objFile);		    		
		    			}
		    		}
		    		catch(e){
		    			var msg = '';
		    			if ( e instanceof nlobjError ){
		    				msg = e.getCode() + ' - ' + e.getDetails() + ' - ' +e.getStckTrace();
		    			}
		    			else{
		    				msg = e.toString();
		    			}
		    			nlapiLogExecution('Error','Unhandled Exception',msg);
		    			nlapiLogExecution('debug','Failure Point',_failurePoint);
		    		}
		    		// run bank statement search sorted by statement number DESC to determine last statement number
		    		// can't do this here now because might be multiple accounts!!
		    		/*var intLastStmntNum;
		    		var sfs = new Array();
		    		sfs[0] = new nlobjSearchFilter('custrecord_bs_account',null,'is',accountId);
		    		var scs = new Array();
		    		scs[0] = new nlobjSearchColumn('custrecord_bs_statementnumber');
		    		scs[1]= scs[0].setSort(true);	//true = desc
		    		var results = nlapiSearchRecord('customrecord_nbsabr_bankstatement', null, sfs,scs);
		    		if(results != null){
		    			intLastStmntNum = ncParseIntNV(results[0].getValue('custrecord_bs_statementnumber'),0);
		    		}
		    		else{
		    			intLastStmntNum = 0;
		    		}*/
		   		    		
		    		// create bank statement header record
		    		var recBankStatement = nlapiCreateRecord('customrecord_nbsabr_bankstatement');
		    		if(accountId != 'multi'){
		    			recBankStatement.setFieldValue('custrecord_bs_reconaccount',accountId);
		    		}
		    		//recBankStatement.setFieldValue('custrecord_bs_statementnumber',intLastStmntNum+1);
		    		var bankStatementId = nlapiSubmitRecord(recBankStatement,false);
		    			    			
	    			// get script number - return one if multiple script queues are not used.
		    		var intQNum = getScriptQueueNumber();
		    		debugLog(show, 'intQNum', intQNum);
		    		debugLog(show, 'accountId', accountId);
		  
	    			// create a new instance, then set parameter to instance name and call script....
	    			var instRec = nlapiCreateRecord(ncConst.BGP_ProcessInstance);
	    			instRec.setFieldValue('custrecord_bgpprocstatus', '1');	// In Progress
	    			instRec.setFieldValue('custrecord_bgpactivitytype', '1');	// Direct
	    			instRec.setFieldValue('custrecord_bgpfunctionname', 'nbsABR_ImportFileBG');
	    			instRec.setFieldValue('custrecord_bgpprocessname', 'ABR Import Bank File');
	    			// retrieve and set current user id
					instRec.setFieldValue('custrecord_bgpuserid', ctx.getUser());// user id, store as text - no permission issues!
					instRec.setFieldValue('custrecord_bgpusername', ctx.getName());// user name
					instRec.setFieldValue('custrecord_bgpscrptqnmbr', intQNum);// script queue number
					debugLog(show, 'ctx.getUser()', ctx.getUser());
					if(accountId != 'multi'){
						subsidiaryId = nlapiLookupField('customrecord_nbsabr_accountsetup',accountId,'custrecord_accsetup_subsidiary');
					}
					instRec.setFieldValue('custrecord_bgpsubsidiary', subsidiaryId);
	    			/* update process record */
	    			instRec.setFieldValue('custrecord_bgpreccount', '0');
	    			instRec.setFieldValue('custrecord_bgpprocmsg', '');
	    			instRec.setFieldValue('custrecord_bgpstatedefn',  'FileId;Format;Account;Subsidiary;Count;BSId;LastImportDate;StatementDate');
	    			instRec.setFieldValue('custrecord_bgpprocstate', fileId+';'+ formatId+';'+accountId+';'+subsidiaryId+';'+intCount+';'+bankStatementId+';0/0/0000;0/0/0000');

	    			var instId = nlapiSubmitRecord(instRec,false);
	    			// call BG function direct - no don't do this, as can fail with large and complex multi-account files
	    			// nbsABR_ImportFileBG(instId, request.getURL(), request.getParameter('custpage_jsid'));

	    			// invoke background processing
	    			var scriptParams = [];
	    			scriptParams[ncConst.BGP_FunctionNameParam] = 'nbsABR_ImportFileBG';
	    			scriptParams['QNmbr'] = intQNum;

	    			var l_msgtext = nbsABR_InvokeBackgroundProcessing(request.getURL(), request.getParameter('custpage_jsid'), scriptParams);
	    			nlapiLogExecution('debug','l_msgtext',l_msgtext);

	    			/* only administrators can run scheduled scripts.
	    				wrap schedule script function in suitelet so call to nlapiScheduleScript can be made by non-administrator */
	    			// l_msgtext = nlapiScheduleScript(ncConst.BGP_StartupScriptId,ncConst.BGP_StartupDeployId,scriptParams);
	    	/*		var BGPscriptURL = nlapiResolveURL('SUITELET','customscript_nbsabr_bgp_starter','customdeploy_nbsabr_bgp_starter',true);

	    			var BGPscriptResp = nlapiRequestURL( BGPscriptURL, null, scriptParams );	// params now passed as custom headers
	    			l_msgtext = BGPscriptResp.getBody();
	    			// ---
	    			if( l_msgtext == null )
	    				l_msgtext = 'Script or deployment invalid (inst:1)';
	    			else
	    				l_msgtext = 'Instance One: '+l_msgtext;

	    			nlapiLogExecution('debug','l_msgtext',l_msgtext);
	    		*/

	    			// redirect to status page
	    			var slParams = [];
	    			slParams['processinstanceid'] = instId;
	    			slParams['title'] = 'ABR Statement Import';
	    			slParams['process'] = 'import';
	    			slParams['accountid'] = accountId;
	    			nlapiSetRedirectURL('SUITELET', 'customscript_nbsabr_reconcilestatus','customdeploy_nbsabr_reconcilestatus', null, slParams);
	    			return;
	    			// else ... error? (no process record found)
	    //		}
				}
	            break;
	        default:// init
	        	break;
	    }
	}
 
    renderImportSL(form,stAction,accountId,stError,objResources, request.getParameter('custpage_jsid'));
}
/** page builder for Import Statement suitelet
*
* This function builds the tabs, fields and buttons for the Import Statement window
*
*@param (form) the current form
*@param	(string) action indicates whether action is GET, Refresh, Submit
*@param (string) internal id of subsidiary
*@param (string) internal id of reconcile account
*@param (object) resources object containing string translations
*/
function renderImportSL(form, action, accountId, errorMsg, resources, sessionId)
{
	var fld_pageState = form.addField('custpage_state', 'text', 'Page State');
	fld_pageState.setDisplayType('hidden');
	fld_pageState.setDefaultValue('Submit');

	var objResources = resources;
	var stInstructions = '';
	form.addFieldGroup( 'grp_instructions', ' ');
			
	// Select Format
	var fld_format = form.addField('custpage_format', 'select',objResources[NBSABRSTR.SLCTFRMT],'customrecord_nbsabr_formatdefinition');
	fld_format.setLayoutType('normal','none');
	fld_format.setMandatory(true);
	fld_format.setHelpText(objResources[NBSABRSTR.SLCTFMTFILEIMP]);	// 'Select the format for the file you are importing.'
		
	// Reconcile Account (list populated by client script)
	var fld_account = form.addField('custpage_account', 'select',objResources[NBSABRSTR.SLCTACCNT]);//Select Account
	fld_account.setLayoutType('normal','none');
	fld_account.setMandatory(true);
	fld_account.setHelpText(objResources[NBSABRSTR.SLCTRECONACCTSTMT]);	// 'Select the reconcile account for the statement you are importing.'
	if(!isStringEmpty(accountId))
	{
		fld_account.setDefaultValue(accountId);
	}
	
	// Instructions
	var fld_instructions = form.addField('instructions', 'text', '');
	fld_instructions.setDisplayType('inline');
	fld_instructions.setLayoutType('normal','startcol');
	stInstructions += '&#186; '+objResources[NBSABRSTR.CLCKBRWSLCTFL]+'.<BR>';
	//stInstructions += '&#186; '+objResources[NBSABRSTR.CHSACCNTNDFRMTFRMPRT]+'.';
	fld_instructions.setDefaultValue(stInstructions);
	
	// Select File
	var fld_file = form.addField('file', 'file',objResources[NBSABRSTR.SLCTFL]);//Select File
	fld_file.setLayoutType('normal','none');
	fld_file.setMandatory(true);
	fld_file.setHelpText(objResources[NBSABRSTR.SLCTFILEIMP]);	// 'Select the file to be imported.'
	
	// add select options to format list
	var fld_encoding = form.addField('encoding', 'select',objResources[NBSABRSTR.CHRTRNCDNG],null);
	fld_encoding.setLayoutType('normal','none');
	// 'Choose another character encoding format if you use an international or Macintosh version of Microsoft Excel, or if you typically use special characters.'
	fld_encoding.setHelpText(objResources[NBSABRSTR.CHSCHARENC]);
	fld_encoding.addSelectOption('1',objResources[NBSABRSTR.UNCDE], false);//'Unicode (UTF-8)'
	fld_encoding.addSelectOption('2',objResources[NBSABRSTR.WSTRN1252], false);//'Western (windows-1252)
	fld_encoding.addSelectOption('3',objResources[NBSABRSTR.WSTRN8859], false);//Western (ISO-8859-1)
	fld_encoding.addSelectOption('4',objResources[NBSABRSTR.CHNSMPL18030], false);//Chinese Simplified (GB18030)
	fld_encoding.addSelectOption('5',objResources[NBSABRSTR.CHNSMPL2312], false);//Chinese Simplified (GB2312)
	fld_encoding.addSelectOption('6',objResources[NBSABRSTR.JPNS], false);//Japanese (SHIFT_JIS)
	fld_encoding.addSelectOption('7',objResources[NBSABRSTR.WSTRNMR], false);//Western (MacRoman)	
	fld_encoding.setDefaultValue ('1');
			
	// error
	var fld_error = form.addField('error', 'inlinehtml', '');
	fld_error.setLayoutType('outsidebelow','none');
	fld_error.setDefaultValue(errorMsg);

	// for POST calls
	form.addField('main_action','text','').setDisplayType('hidden');// make hidden

	//form.addResetButton();
	form.addSubmitButton(objResources[NBSABRSTR.SBMT]);	// 'Submit'
	//NB remove client script button
	
	// hidden fields
	var jsidField = form.addField('custpage_jsid', 'text', 'JSESSIONID:');
	jsidField.setDisplayType('hidden');
	jsidField.setDefaultValue(sessionId);

	response.writePage(form);
}

/**
 * Returns true if import file type OK
 *
 * @param (object) file being imported
 * @return (boolean)true if the file type is CSV or PLAINTEXT; or if file extension is
 *  				.csv, .txt, .qif, .bai; false if otherwise.
 */
function importTypeOK(file)
{
	if(!file)
		return false;
	if(file.getType() == "CSV" || file.getType() == "PLAINTEXT")
	{
		return true;
	}
	if((/.*\.(csv|txt|qif|bai|sta)$/i).test(file.getName()))
		return true;
	return false;
}

function getEncodingType(val)
{
	switch(val)
	{
		case '1':
			return 'UTF-8';
		case '2':
			return 'windows-1252';
		case '3':
			return 'ISO-8859-1';
		case '4':
			return 'GB18030';
		case '5':
			return 'GB2312';
		case '6':
			return 'SHIFT_JIS';
		case '7':
			return 'MacRoman';
		default:
			return '';
	}
		
}

function nbsABR_RenderPreForm(form) {
	form.setScript('customscript_nbsabr_import_pre_c');

	// display message
	var displayMsg = form.addField('custpage_display_msg','inlinehtml','');
	displayMsg.setDefaultValue('Retrieving system configuration and validating prerequisites . . .');

	// hidden fields
	var jsidField = form.addField('custpage_jsid', 'text', 'JSESSIONID:');
	jsidField.setDisplayType('hidden');
	
	var fld_pageState = form.addField('custpage_state', 'text', 'Page State');
	fld_pageState.setDisplayType('hidden');
	fld_pageState.setDefaultValue('Preload');
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
