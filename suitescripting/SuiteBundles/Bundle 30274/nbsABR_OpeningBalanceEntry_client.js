/** *************************************************
 * Advanced Bank Reconciliation, � 2012 Nolan Business Solutions Plc
 *
 * Opening Balance Entry client scripts
 *
 * Version History
 * 		14/08/2012	C.Shaw		Initial version created
 */

// user selects a reconcile account and this function populates the list of target accounts
function nbsABR_OpenBalEntry_FC(type, field)
{	
	try{
		//user selects a reconcile account
		//--> populate list of associated NS target accounts
		if(field == 'reconaccount'){
			var reconAccId = nlapiGetFieldValue('reconaccount');
			var filters = [	new nlobjSearchFilter('isinactive',null, 'is','F'),
			               	new nlobjSearchFilter('custrecord_nbsabr_ta_reconacc',null, 'anyof',reconAccId)];
			var columns = [	new nlobjSearchColumn('custrecord_nbsabr_ta_accountnumber'),
			               	new nlobjSearchColumn('custrecord_nbsabr_ta_accountname')];
	 		var recs = nlapiSearchRecord('customrecord_nbsabr_targetaccount',null,filters,columns);
	 	
	 		var arrIds=[];
	 		var arrNames=[];
	 		for (var i = 0; recs != null && i < recs.length; i += 1){
	 			//arrIds[i] = recs[i].getId();
	 			arrIds[i] = recs[i].getValue('custrecord_nbsabr_ta_accountname');
	 			
	 			var strAccNum = recs[i].getValue('custrecord_nbsabr_ta_accountnumber');
	 			var strAccName = recs[i].getText('custrecord_nbsabr_ta_accountname');
	 			if(strAccNum===null || strAccNum==='')
	 				arrNames[i] = strAccName;
	 			else
	 				arrNames[i] = strAccNum+' '+ strAccName;
	 		}
	 		nlapiRemoveSelectOption('custpage_targetaccount', null);
	 		for(var j=0; arrIds !== null && j<arrIds.length;j+=1){
	 			var b_selected = true;
	 			if(j>0)
	 				b_selected = false;
	 			nlapiInsertSelectOption('custpage_targetaccount', arrIds[j], arrNames[j], b_selected);
	 		}
		}
	}
	catch(except)
	{
		alert("Error: "+except.description);
		return;
	}
}

//Recalculate total amount as a line line is added/edited
function nbsABR_OpenBalEntry_RC(type)
{
	if(type == 'openbalancelist'){
		var flTotal=0.00;
		for(var i=1; i<=nlapiGetLineItemCount('openbalancelist'); ++i)
		{
			flTotal += ncParseFloatNV(nlapiGetLineItemValue('openbalancelist','amount',i),0)*100;
		}
		nlapiSetFieldValue('totalamount', nlapiFormatCurrency(flTotal/100));	
	}
}
/** nbsABR_OpenBalEntry_VL - validate line
 * @deprecated 
 */
function nbsABR_OpenBalEntry_VL(type)
{
	if(type == 'openbalancelist'){
		var type = nlapiGetCurrentLineItemValue( 'openbalancelist','trantype');
		var amt = parseFloat(nlapiGetCurrentLineItemValue( 'openbalancelist','amount'));
		var arrTypeDebitIds = ['29','3','30','18'];//cash refund, check, customer refund, vendor payment
		if( (inArray(type, arrTypeDebitIds)) && (amt > 0) ){
			alert('You must enter a negative amount for transaction types  Cash Refund, Check, Customer Refund and Bill Payment');
			return false;
		}
		return true;
	}
}
/** nbsABR_OpenBalEntry_VldtFld - validate field
*/
function nbsABR_OpenBalEntry_VldtFld(type,name,linenum)
{
	//try{
		if(type == 'openbalancelist' && name == 'trandate'){
			//--> populate date with statement date if any acct init reconciliations found
			var raId = nlapiGetFieldValue('reconaccount');
			var dtStmntDate = null;
	 		var SF = [	new nlobjSearchFilter('isinactive',null, 'is','F'),
			            new nlobjSearchFilter('custrecord_sh_accntinit',null, 'is','T'),
			            new nlobjSearchFilter('custrecord_sh_reconaccount',null, 'is',raId)];
			var SC = [	new nlobjSearchColumn('custrecord_sh_date')];
	 		var SR = nlapiSearchRecord('customrecord_nbsabr_statementhistory',null,SF,SC);
	 		if(SR !== null){
	 			dtStmntDate = nlapiStringToDate(SR[0].getValue('custrecord_sh_date'));
	 		}
			var dtTrnDate = nlapiStringToDate(nlapiGetCurrentLineItemValue('openbalancelist','trandate'));
			
			if( (dtStmntDate!==null) && (dtTrnDate > dtStmntDate)){
				alert(objResources[NBSABRSTR.TRNDTNOTAFTRLASTRECDT]);	// 'Transaction date cannot be after last reconciliation date.'
				return false;
			}
		}
		if(type == 'openbalancelist' && name == 'amount'){
			//--> populate date with statement date if any acct init reconciliations found
			var type = nlapiGetCurrentLineItemValue( 'openbalancelist','trantype');
			var flAmt = parseFloat(nlapiGetCurrentLineItemValue( 'openbalancelist','amount'));
			
			var arrTypeDbts = ['29','3','30','18'];//cash refund, check, customer refund, vendor payment
			if( (inArray(type, arrTypeDbts)) && (flAmt >= 0) ){
				// 'You must enter a negative amount for transaction types: Cash Refund, Check, Customer Refund, Vendor Payment'
				alert(objResources[NBSABRSTR.NEGAMTFORTRNTYPES]);
				return false;
			}
			var arrTypeCrdts = ['5','40','9','4'];// Cash Sale, Customer Deposit, Payment, Deposit
			if( (inArray(type, arrTypeCrdts)) && (flAmt <= 0) ){
				// 'You must enter a positive amount for transaction types: Cash Sale, Customer Deposit, Payment, Deposit'
				alert(objResources[NBSABRSTR.POSAMTFORTRNTYPES]);
				return false;
			}
		}
		return true;
	//}catch(except){
	//	alert("Error: "+except.description);
	//}
}

function inArray(val, arr)
{	
    var bIsValueFound = false;	
    for(var i = 0; i < arr.length; i++){
        if(val == arr[i]){
            bIsValueFound = true;        
            break;	  
        }
    }
    return bIsValueFound;
}

/** nbsABR_Help - script for Help button
*/
function nbsABR_Help() {
	var linkURL = 'http://docs.nolanbusinesssolutions.com/abr/abr_obal_entry.html';
	window.open( linkURL,"abrhelp",'width=1200px,height=900px,resizable=yes,scrollbars=yes');
}
function ncParseFloatNV(S,F)
{
	if( (S==null) || (S.length==0) )
		return F;

	return parseFloat(S);
}

var objResources = [];

/** nbsABR_OpenBal_PageInit - populate objResources with language resources */
function nbsABR_OpenBal_PageInit() {
	var userId = nlapiGetUser();
	var xlateURL = '/app/site/hosting/restlet.nl?script=customscript_nbsabr_translate_rl&deploy=1&userId='+userId;
	var reqHdr = new Object();
	reqHdr['Content-Type'] = 'application/json';
	var resp = nlapiRequestURL(xlateURL, null, reqHdr, null, 'GET');
	objResources = JSON.parse(resp.getBody());
}