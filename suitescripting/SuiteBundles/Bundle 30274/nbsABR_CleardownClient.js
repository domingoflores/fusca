/** *************************************************
 * Advanced Bank reconciliation, � 2012 Nolan Business Solutions Plc
 *
 * Account Initialisation client scripts
 *
 */

/*
var objResources = [];

function nbsABR_Cleardown_PageInit() {
	var userId = nlapiGetUser();
	var xlateURL = '/app/site/hosting/restlet.nl?script=customscript_nbsabr_translate_rl&deploy=1&userId='+userId;
	var reqHdr = new Object();
	reqHdr['Content-Type'] = 'application/json';
	var resp = nlapiRequestURL(xlateURL, null, reqHdr, null, 'GET');
	objResources = JSON.parse(resp.getBody());
}
*/

function nbsABR_Cleardown_PageInit() {
	if (document.cookie.toString() != '') {
		var JSESSIONID = document.cookie.match(/JSESSIONID=[^;]+/);
		//var sessionId = 'NS_VER=2013.1.0; ' + JSESSIONID + ';';
		var sessionId = 'NS_VER='+ nlapiGetContext().getVersion()+'.0; ' + JSESSIONID + ';';

		nlapiSetFieldValue('custpage_jsid', sessionId);
	}
}

//Save Record - not in use
/** @deprecated */
function nbsABR_AcctInitSvRcrd(type, field)
{	
	var answer = confirm('Are you sure you want to cleardown transactions to '+nlapiGetFieldValue('uptodate')+ '?');	
	if (answer)
		return true;
	else
		return false;
}
// Field Changed
function nbsABR_AcctInitFldChngd(type, field)
{	
	try{	
		var line=0;
		var isChecked='F';
		var flAmt = 0;
		var flTotal = 0;
		var flBal = 0;
	
		if(type == 'gl_list' && field == 'mark'){	
			// var amtField = nlapiGetFieldValue('custpage_amt_fldname');// amount or fxamount
			line = nlapiGetCurrentLineItemIndex('gl_list');
			isChecked = nlapiGetLineItemValue('gl_list','mark',line);
			flTotal = ncParseFloatNV(nlapiGetFieldValue('totalunrecon'),0)*100;
			flBal = ncParseFloatNV(nlapiGetFieldValue('accountbalance'),0)*100;	
			// flAmt = ncParseFloatNV(nlapiGetLineItemValue('gl_list',amtField,line),0)*100;
			flAmt = ncParseFloatNV(nlapiGetLineItemValue('gl_list','formulacurrency',line),0)*100;
					
			if(isChecked == 'F'){
				flTotal += flAmt;
			}
			if(isChecked == 'T'){
				flTotal = (flTotal - flAmt);
			}	
			nlapiSetFieldValue('totalunrecon', nlapiFormatCurrency(flTotal/100));
			nlapiSetFieldValue('endingbalance', nlapiFormatCurrency((flBal-flTotal)/100));
		}
		//user selects a reconcile account 
		if(field == 'reconaccount'){
			//var reconAccId = nlapiGetFieldValue('reconaccount');
			// populate list of associated NetSuite accounts
			var reconAccId = nlapiGetFieldValue('reconaccount');
			var filters = [	new nlobjSearchFilter('isinactive',null, 'is','F'),
			               	new nlobjSearchFilter('custrecord_nbsabr_ta_reconacc',null, 'anyof',nlapiGetFieldValue('reconaccount'))];
			var columns = [	new nlobjSearchColumn('custrecord_nbsabr_ta_accountnumber'),
			               	new nlobjSearchColumn('custrecord_nbsabr_ta_accountname')];
	 		var recs = nlapiSearchRecord('customrecord_nbsabr_targetaccount',null,filters,columns);
	 	
	 		var arrIds=[];
	 		var arrNames=[];
	 		for (var i = 0; recs != null && i < recs.length; i += 1){
	 			arrIds[i] = recs[i].getId();
	 			//arrIds[i] = recs[i].getValue('custrecord_nbsabr_ta_accountname');	
	 			var strAccNum = recs[i].getValue('custrecord_nbsabr_ta_accountnumber');
	 			var strAccName = recs[i].getText('custrecord_nbsabr_ta_accountname');
	 			if(strAccNum===null || strAccNum==='')
	 				arrNames[i] = strAccName;
	 			else
	 				arrNames[i] = strAccNum+' '+ strAccName;
	 		}
	 		nlapiRemoveSelectOption('custpage_targetaccount', null);
	 		for(var j=0; arrIds !== null && j<arrIds.length;j+=1){
	 			nlapiInsertSelectOption('custpage_targetaccount', arrIds[j], arrNames[j]);
	 		}
	 		// retrieve existing acct inits
	 		var SF = [	new nlobjSearchFilter('isinactive',null, 'is','F'),
			            new nlobjSearchFilter('custrecord_sh_accntinit',null, 'is','T'),
			            new nlobjSearchFilter('custrecord_sh_reconaccount',null, 'is',reconAccId)];
			var SC = [	new nlobjSearchColumn('custrecord_sh_date'),
			            new nlobjSearchColumn('custrecord_sh_startdate')];
	 		var SR = nlapiSearchRecord('customrecord_nbsabr_statementhistory',null,SF,SC);
	 		if(SR !== null){
	 			nlapiSetFieldValue('fromdate',SR[0].getValue('custrecord_sh_startdate'));
	 			nlapiSetFieldValue('todate',SR[0].getValue('custrecord_sh_date'));
	 			nlapiSetFieldValue('fromdate_hidden',SR[0].getValue('custrecord_sh_startdate'));
	 			nlapiSetFieldValue('todate_hidden',SR[0].getValue('custrecord_sh_date'));
	 			
	 			nlapiDisableField('fromdate',true);
	 			nlapiDisableField('todate',true);
	 		}
	 		else{
	 			nlapiSetFieldValue('fromdate','');
	 			nlapiSetFieldValue('todate','');
	 			nlapiSetFieldValue('fromdate_hidden','');
	 			nlapiSetFieldValue('todate_hidden','');
	 			
	 			nlapiDisableField('fromdate',false);
	 			nlapiDisableField('todate',false);
	 		}
		} 
		if(field == 'fromdate'){
			nlapiSetFieldValue('fromdate_hidden',nlapiGetFieldValue('fromdate'));
		}
		if(field == 'todate'){
			nlapiSetFieldValue('todate_hidden',nlapiGetFieldValue('todate'));
		}
	}
	catch(except){
		alert("Error!: "+except.description);
		return;
	}
}
// Refresh button
function refresh_button()
{
	try
	{
		if (window.isinited && window.isvalid)
		{
			setWindowChanged(window, false);
			main_form['nbsaction'].value = 'Refresh';
			main_form.submit();
		}	
	}
	catch(Ex)
	{
		alert("Error encountered on page refresh: "+Ex.toString());
		return;
	}
}
/** nbsABR_Help - script for Help button
*/
function nbsABR_Help() {
	var linkURL = 'http://docs.nolanbusinesssolutions.com/abr/abr_account_init.html';
	window.open( linkURL,"abrhelp",'width=1200px,height=900px,resizable=yes,scrollbars=yes');
}

function ncParseFloatNV(S,F)
{
	if( (S===null) || (S.length==0)|| S===undefined )
		return F;

	return parseFloat(S);
}

/** nbsABR_MarkAll - mark or unmark all rows and recalculate totals 
 *
 * @param {Boolean} state - indicates whether to mark (true) or unmark (false) all lines
 */
function nbsABR_MarkAll(state) {
	var numLines = nlapiGetLineItemCount('gl_list');
	// var amtField = nlapiGetFieldValue('custpage_amt_fldname');// amount or fxamount
	var lineTotal = 0.0;
	for (var i=1; i<=numLines; ++i) {
		nlapiSelectLineItem('gl_list',i);
		nlapiSetCurrentLineItemValue('gl_list','mark',(state ? 'T' : 'F'),false,false);	// don't trigger field change event - we will sum independently
		// lineTotal += ncParseFloatNV(nlapiGetLineItemValue('gl_list',amtField,i),0);
		lineTotal += ncParseFloatNV(nlapiGetLineItemValue('gl_list','formulacurrency',i),0);
		nlapiCommitLineItem('gl_list');
	}
	
	var flBal = ncParseFloatNV(nlapiGetFieldValue('accountbalance'),0)*100;
	var flTotal = 0;
	if (!state)
		flTotal = lineTotal*100;
	nlapiSetFieldValue('totalunrecon', nlapiFormatCurrency(flTotal/100));
	nlapiSetFieldValue('endingbalance', nlapiFormatCurrency((flBal-flTotal)/100));
}

function nbsABR_ExportCSV() {
	if (window.isinited && window.isvalid)
	{
		setWindowChanged(window, false);
		main_form['nbsaction'].value = 'ExportCSV';
		main_form.submit();
	}	
}