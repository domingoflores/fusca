
/**** architecture ****

Process Controller - scheduled script which will determine which instance to run, then call the function it uses
	... function name as parameter --> search to find queued instances for that function
	... separate deployment per process

A background script, on completion, should recall the process controller always - if nothing queued, the controller will quit
	... but if something crashes terminally, nothing to start next instance?


Because Process Controller will be invoking a function, need a Script definition which includes the script file which includes that function
	... so separate script definition per process, or per product (if functions grouped to one file, or multiple library files)
		or potentially just one with multiple library files - which is best for clarity and maintenance?

Product implements deployment of BG process, so BG script must be in our product...
... pass fn name as parameter, and drop Process Definition record entirely?  Code searches for instances for that fn name...
--> separate bundle for Process Instance and related custom lists only, no functional code?
	or new generic code for view of active and queued processes, ability to kill a queued process, etc. (review/edit of Instance recs)

****/


/* ncBGP_RunBGProcess - control script to call a background process
 *
 * This function will run a background process, based upon the process control record details
 *
 * Parameters:
 *  No parameters are passed directly.  Instead, the script function name is passed as a scheduled script parameter
 *  so we need to retrieve it from the Context info
 *
 *  	custscript_bgp_functionname	- function name used to locate process instance record, which contains status information etc.
 * Returns:
 * 	no direct return parameters - all information should be passed back by updating the process record
 */

function ncBGP_RunBGProcess()
{
	/* anything running scheduled we don't want to fail, otherwise deployment is failed and dead! */
	var _failurePoint = '';
	var procFnName = '';
	
	try {

		/* retrieve script parameters --> process id */
		_failurePoint = 'Retrieve script parameters';
		//var procId;
		var currentContext = nlapiGetContext();

		procFnName = currentContext.getSetting('SCRIPT',ncConst.BGP_FunctionNameParam);
		if( procFnName == null )
		{
			nlapiLogExecution('debug','ncBGP_RunBGProcess','Script parameter null!');
			return;
		}

		/* retrieve process record */
		_failurePoint = 'Retrieve process record';
			
		// now we need to search for all records with the function name...
		// ... and need two searches - initial search for an active instance
		// ... then if none found, secondary search for a queued instance
		var sFilters = new Array();
		var sColumns = new Array();
		sFilters[0] = new nlobjSearchFilter('custrecord_bgpfunctionname',null,'is',procFnName,null);
		sFilters[1] = new nlobjSearchFilter('custrecord_bgpprocstatus',null,'anyof','1',null);	// In Progress
		sFilters[2] = new nlobjSearchFilter('isinactive',null,'is','F',null);
		sColumns[0] = new nlobjSearchColumn('custrecord_bgpprocstatus');
		// add column for procFnName
		sColumns[1] = new nlobjSearchColumn('custrecord_bgpfunctionname');
		sColumns[2] = new nlobjSearchColumn('custrecord_bgpscrptqnmbr');
		var sResults = nlapiSearchRecord(ncConst.BGP_ProcessInstance,null,sFilters,sColumns);
		
		if( (sResults==null) || (sResults.length==0) )
		{
			sFilters[1] = new nlobjSearchFilter('custrecord_bgpprocstatus',null,'anyof','5',null);	// Queued
			sResults = nlapiSearchRecord(ncConst.BGP_ProcessInstance,null,sFilters,sColumns);
		}

		if( (sResults==null) || (sResults.length==0) )
		{
			// no running or queued instances for this function - now check for anything else pending, with nbsABR_ prefix (so this module only)
			sFilters[0] = new nlobjSearchFilter('custrecord_bgpfunctionname',null,'startswith','nbsABR_',null);
			// and Queued, not Inactive
			sResults = nlapiSearchRecord(ncConst.BGP_ProcessInstance,null,sFilters,sColumns);
		}
			
		if( (sResults==null) || (sResults.length==0) )
		{
			return;	// no running or queued instances found for any function
		}
		
		// re-read function name, as now could be a different function
		procFnName = sResults[0].getValue('custrecord_bgpfunctionname');
		nlapiLogExecution('debug','ABR Bgp procFnName',procFnName);

		/* make function call by name */
		_failurePoint = 'Read and execute function';
		var FnValid = false;
		if( procFnName in this )
			if( typeof( this[procFnName] ) == 'function' )
			{
				var instId = sResults[0].getId();
				// var intQN = sResults[0].getValue('custrecord_bgpscrptqnmbr');
				// change a queued instance to running...
				if( sResults[0].getValue('custrecord_bgpprocstatus') == '5' )
					nlapiSubmitField(ncConst.BGP_ProcessInstance, instId, 'custrecord_bgpprocstatus', '1', false);

				FnValid = true;
				nlapiLogExecution('debug','ABR Background Processing','Background process invoking function: '+procFnName);
				this[procFnName](instId);

				// if a 'redirect' defined, invoke it here? no - that must be for status page

				// what about re-calling this script, so we go again... then called function doesn't have to!
				// should we check the 'max processing' flag here?
				var scriptParams = new Array();
				scriptParams[ncConst.BGP_FunctionNameParam] = procFnName;
				//nlapiScheduleScript(ncConst.BGP_StartupScriptId,ncConst.BGP_StartupDeployId+intQN,scriptParams);
				nlapiScheduleScript(currentContext.getScriptId(),currentContext.getDeploymentId(),scriptParams);
			}

		if( !FnValid )
			nlapiLogExecution('Error','Invalid Process','Invoked for an undefined/inaccessible function: '+procFnName);

	} catch (GE)
	{
		if ( GE instanceof nlobjError )
			msg = GE.getCode() + '\n' + GE.getDetails();
		else
			msg = GE.toString();

		nlapiLogExecution('Error','Unhandled Exception',msg);
		nlapiLogExecution('debug','Failure Point - Fn:'+procFnName,_failurePoint);
	}
}

/* ncBGP_ScheduleScript_SL - suitelet that can "Run As Administrator" and so start BG scripts, to be called from non-Admin suitelets
 * 
 * To schedule a background script, Administrator role is required.
 * With Administrator role, subsidiary/role filtering on selection fields etc. does not work.
 * To allow user pages to operate within the user role, they can use nlapiRequestURL to call this page to do the scheduling
 *
 * Requires the function name parameter to be passed (custscript_bgp_functionname as above - ncConst.BGP_FunctionNameParam)
 * Returns nlapiScheduleScript status in the response body.
 */
function ncBGP_ScheduleScript_SL( request, response )
{
	if( request.getMethod() == 'GET' )
	{
		var FnName = request.getHeader(ncConst.BGP_FunctionNameParam);
		var ReconAcctId = request.getHeader('custscript_nbsabr_reconacctid');
		//var QNmbr = request.getHeader('QNmbr');				
		//var scriptParams =[];
		//scriptParams[ncConst.BGP_FunctionNameParam] = FnName;
				
		nlapiLogExecution('debug','FnName',FnName);
		// ABR BG processing
		if ((FnName != null) && (FnName != ''))
		{
			var QNmbr = request.getHeader('QNmbr');
			nlapiLogExecution('debug','ABR Background Processing..QNumber',QNmbr);
			
			var scriptParams =[];
			scriptParams[ncConst.BGP_FunctionNameParam] = FnName;
			var status = nlapiScheduleScript(ncConst.BGP_StartupScriptId,ncConst.BGP_StartupDeployId+QNmbr,scriptParams);
			nlapiLogExecution('debug','ABR Background Processing','Background process '+FnName+' schedule script status:'+status);

			if(status == null)
			{
				//response.write('null');
				var obj = { 'processStatus': 'NULL', 'statusDescription': 'Script or Deployment Id Invalid' };
				response.write(JSON.stringify(obj));
			}
			else
			{
				//response.write(status);
				var obj = {'processStatus': status, 'statusDescription': status};
				response.write(JSON.stringify(obj));
			}
		}
				
		// audit report
		if ((ReconAcctId != null) && (ReconAcctId != ''))
		{
			nlapiLogExecution('debug','request.getHeader(custscript_nbsabr_procid)',request.getHeader('custscript_nbsabr_procid'));
			var scriptParams =[];
			scriptParams['custscript_nbsabr_reconacctid'] = request.getHeader('custscript_nbsabr_reconacctid');
			scriptParams['custscript_nbsabr_reconstmntid'] = request.getHeader('custscript_nbsabr_reconstmntid');
			scriptParams['custscript_nbsabr_fromdate'] = request.getHeader('custscript_nbsabr_fromdate');
			scriptParams['custscript_nbsabr_todate'] = request.getHeader('custscript_nbsabr_todate');
			scriptParams['custscript_nbsabr_userid'] = request.getHeader('custscript_nbsabr_userid');
			scriptParams['custscript_nbsabr_procid'] = request.getHeader('custscript_nbsabr_procid');
			var status = nlapiScheduleScript('customscript_nbsabr_buildauditrpt','customdeploy_nbsabr_buildauditrpt',scriptParams);
			
			if(status == null)
			{
				//response.write('null');
				response.write(JSON.stringify({ 'processStatus': 'NULL', 'statusDescription': 'Script or Deployment Id Invalid' }));
			}
			else
			{
				//response.write(status);
				response.write(JSON.stringify({'processStatus': status, 'statusDescription': status}));
			}
		}
		
	}
	else {
		// response.write('<B>This suitelet is for internal use only!</B><br>Unexpected POST method.');
		response.write(JSON.stringify({ 'processStatus': 'NULL', 'statusDescription': 'This suitelet is for internal use only! Unexpected POST method.'}));
	}
}

// RESTlet wrapper code - replaces suitelet wrapper
function ncBGP_Startup_GET(datain)
{
    var FnName = datain.functionName;
	var QNmbr = datain.queueNumber;
	var ReconAcctId = datain.reconAccountId;
    
	if (((FnName === undefined) || (FnName === null)) && ((ReconAcctId === undefined) || (ReconAcctId === null))) {
		return { 'processStatus': 'ERROR', 'statusDescription': 'Invalid Parameters' };
	}
	
	if ((FnName !== undefined) && (FnName !== null)) {
		if ((QNmbr === undefined) || (QNmbr === null) || (QNmbr == ''))
			QNmbr = '1';

		var scriptParams =[];
		scriptParams[ncConst.BGP_FunctionNameParam] = FnName;
		
		var status = nlapiScheduleScript(ncConst.BGP_StartupScriptId,ncConst.BGP_StartupDeployId+QNmbr,scriptParams);
		nlapiLogExecution('debug','ABR Background Processing','Background process '+FnName+' schedule script status:'+status);

		if(status === null)
			return { 'processStatus': 'NULL', 'statusDescription': 'No status returned from Schedule Script call' };
		else
			return { 'processStatus': status, 'statusDescription': status };
	} else {
		// by ReconAcctId instead, i.e. called for Audit Report
		var scriptParams =[];
		scriptParams['custscript_nbsabr_reconacctid'] = ReconAcctId;
		scriptParams['custscript_nbsabr_reconstmntid'] = datain.reconStatementId; // request.getHeader('custscript_nbsabr_reconstmntid');
		scriptParams['custscript_nbsabr_fromdate'] = datain.fromDate; // request.getHeader('custscript_nbsabr_fromdate');
		scriptParams['custscript_nbsabr_todate'] = datain.toDate; // request.getHeader('custscript_nbsabr_todate');
		scriptParams['custscript_nbsabr_userid'] = datain.userId; // request.getHeader('custscript_nbsabr_userid');
		scriptParams['custscript_nbsabr_procid'] = datain.processId; // request.getHeader('custscript_nbsabr_procid');

		var status = nlapiScheduleScript('customscript_nbsabr_buildauditrpt','customdeploy_nbsabr_buildauditrpt',scriptParams);
		if(status === null)
			return { 'processStatus': 'NULL', 'statusDescription': 'Script or Deployment Id Invalid' };
		else
			return { 'processStatus': status, 'statusDescription': status };
	}
}

function nbsABR_InvokeBackgroundProcessing(requestURL, sessionId, scriptParams) {
	var _failurepoint = '';
	try {
		// N.B. this always returns INTERNAL url, even if EXTERNAL is requested ... use internal form so not breaking if this changes in future!
		// var bgpStartupURL = nlapiResolveURL('RESTLET', 'customscript_nbsabr_bgp_startup_rl', 'customdeploy_nbsabr_bgp_startup');
		_failurepoint = 'resolve startup URL';
		var bgpStartupURL = nlapiResolveURL('SUITELET','customscript_nbsabr_bgp_starter','customdeploy_nbsabr_bgp_starter',false);

		// Get base URL
		_failurepoint = 'parse calling URL';
		var re = new RegExp('^(?:f|ht)tp(?:s)?\://([^/]+)', 'im');
		var baseURL = requestURL.match(re)[0].toString();
		// nlapiLogExecution('debug','baseURL',baseURL);
		// nlapiLogExecution('debug','sessionId',sessionId);

		var headers = [];
		headers['Host'] = baseURL;
		headers['Cookie'] = sessionId;
		//headers['Content-Type'] = 'application/json';

		for (var paramName in scriptParams) {
			// bgpStartupURL += '&' + paramName + '=' + scriptParams[paramName];
			headers[paramName] = scriptParams[paramName];
		}
		_failurepoint = 'request bgp URL';
		var bgpStartupResp = nlapiRequestURL(baseURL+bgpStartupURL, null, headers);
		
		var respText; 
		if (bgpStartupResp.getBody !== undefined){
			respText = bgpStartupResp.getBody();
		}
		else{
			respText = bgpStartupResp;
		}
			

		nlapiLogExecution('debug','schedule script startup response',respText);
		_failurepoint = 'parse response';
		var respObj = JSON.parse(respText); // ERROR - unexpected token Q
		if ((respObj !== null) && (respObj.processStatus !== undefined) && (respObj.processStatus !== null)) {
			
			// validate processStatus, use statusDescription in error message
			if (respObj.processStatus == 'NULL') {
				nlapiLogExecution('debug','process status null, logging status description',respObj.statusDescription);
				return respObj.statusDescription;
			} else {
				nlapiLogExecution('debug','process status',respObj.processStatus);
				return respObj.processStatus;
			}
		} else {
			return 'Unexpected response from RESTlet - '+respText;
		}
	} catch (X) {
		nlapiLogExecution('error','Unable to invoke background processing','Exception at '+_failurepoint+':'+X.toString());
		return 'Exception at '+_failurepoint+':'+X.toString();
	}
}


function ncBGTest_SampleScript(ProcessInstanceId)
{
	var _failurePoint = '';  // local variable which can be used to capture execution points within the function
	var fNames; // used to update the process control record
	var fValues; // used to update the process control record

	try
	{
		/* retrieve script parameters --> process id */
		_failurePoint = 'Retrieve script parameters';
		var currentContext = nlapiGetContext();
		var procInstId = currentContext.getSetting('SCRIPT',ncConst.BGP_ProcInstIdParam);

		if( ProcessInstanceId != null )
			procInstId = ProcessInstanceId;	// called directly, so use direct parameter not context setting

		if( procInstId == null )
			return;	// nothing to do - no process record to determine status or log events against

		/* retrieve process record --> process parameters */
		_failurePoint = 'Retrieve process instance record';
		var rProcessInfo = nlapiLoadRecord(ncConst.BGP_ProcessInstance, procInstId);
		if( rProcessInfo.getFieldValue('custrecord_bgpprocstatus') != '1' )
			return;	// nothing to do

		/* retrieve the current record count - this will be incremented and written back when we exit */
		/* retrieve list of parameter names */
		/* retrieve list of parameter values */
		/* TO DO: here you should declare the parameters your function needs, and retrieve their values from the lists */

		/* do stuff */
		_failurePoint = 'Call dummy worker function';
		//ncBGTest_DummyFunction();

		/* write exit state */
		_failurePoint = 'Update instance and exit';
		fNames = new Array();
		fNames[0] = 'custrecord_bgpstatedefn';
		fNames[1] = 'custrecord_bgpprocstate';
		fNames[2] = 'custrecord_bgpreccount';
		fNames[3] = 'custrecord_bgpprocstatus';
		fNames[4] = 'custrecord_bgpactivitytype';
		fValues = new Array();
		fValues[0] = '';
		fValues[1] = '';
		fValues[2] = '100';
		fValues[3] = '2';	// status 2 = completed
		fValues[4] = '3';	// activity type 3 = planned schedule

		nlapiSubmitField(ncConst.BGP_ProcessInstance, procInstId, fNames, fValues, false);

	}
	catch (GE)
	{
		if ( GE instanceof nlobjError )
		{
			l_msgtext = GE.getCode() + ' - ' + GE.getDetails();
			ST = GE.getStackTrace();
			// nlobjError.getStackTrace() is documented as returning an array, but actually (sometimes?) returns a single string...
			if( (typeof(ST) != 'undefined') && (ST != null) )
			{
				if( typeof(ST) == 'string' )
					l_msgtext += '<BR>'+ST;
				else	// in case we ever do get an array...
					for( var nST=0; nST<ST.length; ++nST )
						if( ST[nST] != 'undefined' )
							l_msgtext += '<BR>'+ST[nST];
			}
		}
		else
			l_msgtext = GE.toString();

		nlapiLogExecution('Error', 'ncBGTest_SampleScript:'+_failurePoint, l_msgtext);
	}

}
