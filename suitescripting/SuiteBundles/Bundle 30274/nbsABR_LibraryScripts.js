/*function ncConst()   // dummy constructor for ncConst object
{
}*/

//ncConst.BGP_ProcessInstance = 'customrecord_ncbgp_procinstance';	/* record type for Process Instance */
//ncConst.BGP_ProcessLog = 'customrecord_ncbgp_proclog';				/* record type for Process Log */
//ncConst.BGP_ProcInstIdParam = 'custscript_bgp_procinstid';			/* parameter name for Process Instance Id on scheduled script deployments */
//ncConst.BGP_FunctionNameParam = 'custscript_nbsabr_bgp_processfunction';	/* parameter name for Function Name on scheduled script deployments */
//ncConst.BGP_StartupScriptId = 'customscript_nbsabr_bgp_startup';		/* script id for background execution startup */
//ncConst.BGP_StartupDeployId = 'customdeploy_nbsabr_bgp_startup_sd1';	/* deployment id for background execution startup */
//ncConst.BGP_StartupDeployId = 'customdeploy_nbsabr_bgp_startup_sd';	/* deployment id for background execution startup */

var nbsCONFIG = {
	reversalvoiding: 'F',
	companyname: '',
	basecurrency: '',
	initialised: false,
	getCurrentSettings: function() {
		var tmpConfigRec = nlapiCreateRecord('customrecord_nbsabr_config');
		this.reversalvoiding = tmpConfigRec.getFieldValue('custrecord_abr_config_accpref_revvoid');
		this.companyname = tmpConfigRec.getFieldValue('custrecord_abr_config_coyinfo_name');
		this.basecurrency = tmpConfigRec.getFieldValue('custrecord_abr_config_coyinfo_currency');
		
		this.initialised = true;
	},
	getAccPref: function() {
		/*
		var slURL = nlapiResolveURL('SUITELET','customscript_nbsabr_lookupaccpref','customdeploy_nbsabr_lookupaccpref',true);					
		var slResp = nlapiRequestURL(slURL);
		this.reversalvoiding = slResp.getBody();
		*/
		if (!this.initialised)
			this.getCurrentSettings();
	},
	getCompanyInfo: function() {
		/*
		var slURL = nlapiResolveURL('SUITELET','customscript_nbsabr_lookupcompanyinfo','customdeploy_nbsabr_lookupcompanyinfo',true);					
		var slResp = nlapiRequestURL(slURL);
		var arrValues = slResp.getBody().split(',');
		this.companyname = arrValues[0];
		this.basecurrency = arrValues[1];
		*/
		if (!this.initialised)
			this.getCurrentSettings();
	}
};
//nbsCONFIG.getCompanyInfo();
//nlapiLogExecution('debug','nbsCONFIG.companyname',nbsCONFIG.companyname);
//nlapiLogExecution('debug','nbsCONFIG.basecurrency',nbsCONFIG.basecurrency);
	
var LIST_FILEFORMAT_COMMA = '1';
var LIST_FILEFORMAT_TAB = '2';
var LIST_FILEFORMAT_FIXED = '3';
var LIST_FILEFORMAT_BAI = '4';
var LIST_FILEFORMAT_MT940 = '5';

var LIST_DESTNATION_FIELD_DATE = 1;
var LIST_DESTNATION_FIELD_AMT = 2;
var LIST_DESTNATION_FIELD_CHECK = 3;
var LIST_DESTNATION_FIELD_CODE = 4;
var LIST_DESTNATION_FIELD_REF = 5;
var LIST_DESTNATION_FIELD_ACCNUM = 6;
var LIST_DESTNATION_FIELD_CREDITAMT = 7;
var LIST_DESTNATION_FIELD_DEBITAMT = 8;
var LIST_DESTNATION_FIELD_DC = 9;
var LIST_DESTNATION_FIELD_TYPE = 10;

var LIST_DISPLAY_ALL = '1';
var LIST_DISPLAY_MATCHED = '2';
var LIST_DISPLAY_UNMATCHED = '3';

var LIST_DEBIT_INDICATOR = '1';
var LIST_CREDIT_INDICATOR = '2';

// [VendPymt,CashSale,Check,CustDep,CustRfnd,Deposit,Journal,CustPymt]

/** ncEncode - Encodes the passed string and returns the encoded value
*
* @param strValue {string}	string to be encoded
*  
* @return {string} encoded value
*/
function ncEncode(strValue)
{
	if((strValue === null) || (strValue === ''))
		return '';
	
	var retValue = '';
	var cCode;
	for(var i = 0; i < strValue.length; ++i)
	{
		cCode = strValue.charCodeAt(i);
		cCode ^= 127;

		if(cCode < 16)
			retValue += '0';
		retValue += cCode.toString(16);
	}
	
	return retValue;
}

/** ncDecode - Decodes the passed code value and returns the original string
*
* @param strCode {string} string to be decoded
*  
* @return {string} decoded value
*/
function ncDecode(strCode)
{
	if((strCode === null) || (strCode === ''))
		return '';
	
	var retValue = '';
	var cCode;
	for(var i=0; i < strCode.length; i+=2)
	{
		cCode = parseInt(strCode.substring(i,i+2),16);
		retValue += String.fromCharCode(cCode^127);
	}
	
	return retValue;
}

/* IndexOfArray - Helper function: returns the first index position of a value in an Array.
 * Otherwise it returns -1. */
 function IndexOfArray(array, val)
 {
	 for(var i=0; array != null && i < array.length; i++)
	 	if(val == array[i])
	 		return i;
	 return -1;
 }
 
 function toBankStatementFieldId(val)
 {
     switch (val)
     {
         case '1':
             return 'custrecord_bsl_date';
         case '2':
        	 return 'custrecord_bsl_amount';
         case '3':
        	 return 'custrecord_bsl_checknumber';
         case '4':
        	 return 'custrecord_bsl_bankcode';
         case '5':
        	 return 'custrecord_bsl_reference';
         case '6':
        	 return 'custrecord_bsl_accountnumber';
         case '7':
        	 return 'custrecord_bsl_creditamt';
         case '8':
        	 return 'custrecord_bsl_debitamt';
         case '9':
        	 return 'custrecord_bsl_dcindicator';
         case '10':
        	 return 'custrecord_bsl_type';
        default:
        	return '';
     }
 }

 /** 
  * Gets base URL of current enviroment - production, sandbox, beta
  *
  * @return base URL
  * @type string
  */
function getBaseURL()
{
	var baseURL = 'https://system.netsuite.com';
	var ctx = nlapiGetContext();
	if( ctx.getEnvironment().toUpperCase() == 'SANDBOX' )
		baseURL = 'https://system.sandbox.netsuite.com';
	else if( ctx.getEnvironment().toUpperCase() == 'BETA' )
		baseURL = 'https://system.beta.netsuite.com'; 
	return baseURL;
}

/** ncParseIntNV - utility function to parse a string to an integer, with default value for null/empty string
*
* Parameters:
* 		S			- the string value to be parsed
* 		I			- the numeric (integer) value to use as a default
* Returns:
* 		default or parsed value (which may still be NaN)
*/
function ncParseIntNV(S,I)
{
	if( (S==null) || (S.length==0) )
		return I;

	return parseInt(S,10);
}

/** ncParseFloatNV - utility function to parse a string to a float, with default value for null/empty string
*
* Parameters:
* 		S			- the string value to be parsed
* 		F			- the numeric (float) value to use as a default
* Returns:
* 		default or parsed value (which may still be NaN)
*/
function ncParseFloatNV(S,F)
{
	if( (S===undefined) || (S===null) || (S.length==0) ) // || isNaN(S) )
		return F;

	return parseFloat(S);
}

/** Determines if a string variable is empty or not.  An empty string variable 
 * is one which is null, undefined or has a length of zero.
 * 
 * @param (string) variable to be tested
 * @return (boolean)true if the variable is empty, false if otherwise
 */
function isStringEmpty(S)
{
    if (S === null)
    {
        return true;
    }
    
    if (S === undefined)
    {
        return true;
    }  
    
    if (S.length == 0)
    {
     		return true;
    }
    
    return false;
}

/** 
 * If the value of the first parameter is an empty string, null or undefined then the second parameter 
 * is returned.  Otherwise, the first parameter is returned.
 *
 * @param (string) S the parameter being tested
 * @param (string) D the parameter returned if the first is null or undefined
 * @return the source, but if null, the destination
 * @type string
 */
function ifStringEmpty(S,D)
{
    if (isStringEmpty(S))
    {
          return D;
    }
    return S;
}

/**
 * Utility method to get list value of transaction type
 * Can't set text value as transaction type may have been renamed
 *
 * @param (string) stTranType  internal id of transaction type
 * @return (string) list value in Transaction Type list
 */
function nbsToTranTypeListValue(stTranType)
{     
    switch (stTranType)
    {
    	case 'journalentry':
    	case 'intercompanyjournalentry':
            return '1';
        case 'check':
            return '3';
        case 'cashsale':
            return '5';
        case 'customerpayment':
            return '9'; 
        case 'vendorpayment':
            return '18';
        case 'cashrefund':
            return '29';
        case 'customerdeposit':
            return '40';  
        case 'customerrefund':
            return '30';  
        case 'deposit':
            return '4';
        case 'transfer':
            return '2';
        case 'invoice':
        	return '7';
        case 'liabpymt':
        	return '25';
        default:
            return '0 : '+stTranType;	// return stTranType too for easier debugging of this case
    }
}

/**
 * Utility method to determine transaction record name from internal Id
 * used to display transaction type name in UI
 *
 * @param (string) stInternalId  internal Id of transaction
 * @param (object) resources JS object of string translations
 * @return (string) transaction name
 */
function nbsToTransactionType(stInternalId,resources)
{     
    switch (stInternalId)
    {
    	case 'cashrefund':
        //    return 'Cash Refund';  
            return resources[NBSABRSTR.CSHRFND];
        case 'cashsale':
       //     return 'Cash Sale';
            return resources[NBSABRSTR.CSHSL];
        case 'check':
         //   return 'Check';
            return resources[NBSABRSTR.CHQ];
        case 'customerdeposit':
            //   return 'Customer Deposit';
               return resources[NBSABRSTR.CSTDPST];
        case 'customerpayment':
        //    return 'Payment';
            return resources[NBSABRSTR.PYMNT];
        case 'deposit':
       //     return 'Deposit';
            return resources[NBSABRSTR.DPST];
        case 'journalentry':
        case 'intercompanyjournalentry':
        //    return 'Journal';
            return resources[NBSABRSTR.JRN];
        case 'vendorpayment':
        //    return 'Bill Payment'; 
            return resources[NBSABRSTR.BLLPYMNT];
        case 'customerrefund':
        //    return 'Customer Refund';  
            return resources[NBSABRSTR.CSTRFND];
        case 'transfer':
            return resources[NBSABRSTR.XFER];
        case 'invoice':
        	return 'Invoice';	// TODO provide translation
        case 'liabpymt':
        	return 'Liability Payment';	// TODO provide translation
        default:
            return stInternalId;
    }
}

/**
 * Utility method to determine transaction text from transaction type
 *
 * @param (string) stTrxType transaction type ID
 * @return (string) transaction text
 */
function nbsTrxTypeIdToText(stTrxType)
{     
	// TODO - replace with language translations of type ids?
    switch (stTrxType)
    {
    	case 'CashRfnd':
    		return 'Cash Refund';
        case 'CashSale':
            return 'Cash Sale';
        case 'Check':
            return 'Check';
        case 'CustPymt':
            return 'Payment';
        case 'CustDep':
            return 'Customer Deposit';
        case 'Deposit':
            return 'Deposit';
        case 'Journal':	// covers Intercompany Journals too
            return 'Journal';
        case 'VendPymt':
            return 'Bill Payment';  
        case 'CustRfnd':
            return 'Customer Refund'; 
        case 'Transfer':
        	return 'Transfer';
        case 'CustInvc':
        	return 'Invoice';
        case 'LiabPymt':
        	return 'Liability Payment';
        default:
            return stTrxType;
    }
}

/** 
 * Utility method to determine internal id of transaction doc/check number field id from transaction type
 *
 * @param (string) stTrxType the transaction type
 * @return (string) stInternalId internal id of transaction doc/check number field
 */
function nbsToTransactionId(stTrxType)
{        
    switch (stTrxType)
    {
    	case 'cashrefund':
            return 'otherrefnum';
        case 'cashsale':
            return 'otherrefnum';
        case 'check':
            return 'tranid';
        case 'customerpayment':
            return 'checknum';
        case 'customerdeposit':
            return 'checknum';
        case 'deposit':
        	return 'tranid';
        case 'journalentry':
        case 'intercompanyjournalentry':
            return 'tranid';
        case 'vendorpayment':
            return 'tranid'; 
        case 'customerrefund':
            return 'tranid';
        case 'transfer':
        	return 'tranid';
        case 'invoice':
        	return 'tranid';
        case 'liabpymt':
        	return 'tranid';
        default:
            return 'tranid';	// default catch-all, should be defined for all transaction types
    }   
}

/** 
 * Returns true if value in array, false if not
 *
 * @param (string) val the value being searched 
 * @param (array) arr the array where the value is being searched
 * @return (boolean)true if the value is found, false if otherwise.
 */
function inArray(val, arr)
{	
    var bIsValueFound = false;	
    
    for(var i = 0; i < arr.length; i++)
    {
        if(val == arr[i])
        {
            bIsValueFound = true;        
            break;	  
        }
    }
    return bIsValueFound;
}
/** ncEncodeDate - utility function to convert a date to a string in a fixed format rather than based upon user preference
 * 
 * Parameters:
 *   	D			- the date value to encode
 * Returns:
 *   	encoded date (as a string, YYYYMMDD format)
 */
function ncEncodeDate(D)
{
	if(D === null || D === undefined)
    {
		throw nlapiCreateError('10000', 'ncEncodeDate should be passed a non empty date parameter'); 
    }
	var YYYY = D.getUTCFullYear();
	var MM = D.getUTCMonth() + 1;	// because dates use zero-based month index
	var DD = D.getUTCDate();	// getDay() gives day of week, getDate() is day of month
	
	var sYYYY = YYYY.toString();
	var sMM = MM.toString();
	if (sMM.length == 1)
		sMM = '0' + sMM;
	var sDD = DD.toString();
	if (sDD.length == 1)
		sDD = '0' + sDD;
	
	return sYYYY+sMM+sDD;
}

/** ncDecodeDate - utility function to convert a date string to a date, based upon a fixed format rather than user preference
*
* Parameters:
*   	S		- the date string to decode, in YYYYMMDD format
* Returns:
*   	D decoded date object
*/
function ncDecodeDate(S)
{
	if(isStringEmpty(S))
    {
		throw nlapiCreateError('10001', 'ncDecodeDate should be passed a non empty string parameter'); 
    }
	var sYYYY = S.substring(0,4);
	var sMM = S.substring(4,6);
	var sDD = S.substring(6,8);

	var YYYY = parseInt(sYYYY,10);
	var MM = parseInt(sMM,10) - 1; // because dates use zero-based month index
	var DD = parseInt(sDD,10);

	return new Date(YYYY,MM,DD,0,0,0,0);
}

/** Adds/subtracts a number of days to or from a Date string
*
* @param (string)	stDate Date string
* @param (int)	days Number of days being added to the date
* @return (string) 	Date corresponding to date that was passed in, plus the days added or subtracted
*/
function nbsAddDays(stDate, days)
{
	var d = nlapiStringToDate(stDate);
	var n = ncParseIntNV(days,0);
	d = nlapiAddDays(d,n);
	
	return nlapiDateToString(d);

}


/**
 * Function to check to see if a generated error is an instance of nlobjError object
 * @param {Object} _e
 * @return formatted error text
 */
function errText(_e) {
	var txt='';
	if (_e instanceof nlobjError) {
		//this is netsuite specific error
		txt = 'NLAPI Error: '+_e.getCode()+' :: '+_e.getDetails();
	} else {
		//this is generic javascript error
		txt = 'JavaScript/Other Error: '+_e.toString();
	}
	return txt;
}

/** nbsABR_GetMatchNumber - function to retrieve next match number for a reconcile account
 * Gets last match number for a bank account and increments by 1.
 * 
 * @param {string} strReconAcctId the internal id of reconcile account.
 * @return (integer) intMatchNumber integer of last match number used
 */
function nbsABR_GetNextMatchNumber(strReconAcctId) {
	var intMatchNumber = 0;
	var SF = [ new nlobjSearchFilter('isinactive', null, 'is', 'F', null),
	           new nlobjSearchFilter('custrecord_nbsabr_lmn_reconacct', null, 'is', strReconAcctId, null) ];
	
	var SC = [ new nlobjSearchColumn('custrecord_lmn_matchnumber') ];
	
	var SR = nlapiSearchRecord('customrecord_nbsabr_lastmatchnumber', null, SF, SC);
	if (SR !== null && SR.length > 0) // should only be one!!
	{
		intMatchNumber = ncParseIntNV(SR[0].getValue('custrecord_lmn_matchnumber'),0)+1;
		nlapiLogExecution('debug','SR[0].getId()',SR[0].getId());
		nlapiSubmitField('customrecord_nbsabr_lastmatchnumber',SR[0].getId(),'custrecord_lmn_matchnumber',intMatchNumber);
	
		return intMatchNumber;
		
	} else {
		// throw nlapiCreateError('ABR_NUM_REC_MISSING', 'Setup incomplete - last number record not found');
		// don't throw exception, instead create default record the same as Reconcile window and Propose function
		var recMatchNum = nlapiCreateRecord('customrecord_nbsabr_lastmatchnumber',null);
		recMatchNum.setFieldValue('custrecord_nbsabr_lmn_reconacct',strReconAcctId);
		recMatchNum.setFieldValue('customrecord_lmn_lastmatchnumber',1);
		stMatchNumId = nlapiSubmitRecord(recMatchNum, false, true);
		
		return 1;
	}
}

/** Function to calculate account opening balance for a given date.
*
* @param (string)	stAccountId the account internal id
* @param (string)	stDate date of opening balance
* @param (boolean)  bFX true:return balance as foreign currency value
* @param (boolean)  bOpenBal true:return opening balance for date, false: return closing balance for date
* 
* @return (float) 	account balance
*/
//return closing balance for date -1
//date = statement start date
//function calculateAccountBalance(stAccountId, stDate,bFX,bOpenBal)
function getAccountOpeningBalance(stAccountId, stDate,bFX,bOpenBal)
{
	var stSrchOp = 'onorafter';
	if(!bOpenBal)
	{
		stSrchOp = 'after';
	}
	
	var flCurrBalance = ncParseFloatNV(nlapiLookupField('account',stAccountId,'balance'),0);// returns foreign curr balance
	
	nlapiLogExecution('debug','getAccOpenBal - current balance',flCurrBalance);
	
	var flTrxTotal = 0;
	var stLabel = 'AMT SUM';
	if(bFX)
	{
		stLabel = 'FX AMT SUM';
	}
	
	var SFs = [ new nlobjSearchFilter('account',null,'is',stAccountId ,null),
	       //     new nlobjSearchFilter('trandate',null,'onorafter',stDate ,null)];
				new nlobjSearchFilter('trandate',null,stSrchOp,stDate ,null)];
	if(nbsCONFIG.reversalvoiding == 'F')
	{
		SFs.push(new nlobjSearchFilter('voided',null,'is', 'F',null));
	}
//	nlapiLogExecution('debug','stDate',stDate);
	var Recs = nlapiSearchRecord('transaction','customsearch_nbsabr_accounttotals',SFs,null);
	if(Recs != null && Recs.length > 0)
	{			
		var result = Recs[0];
	//    var column = null;
	    var columns = result.getAllColumns();
	    for (var j = 0; j < columns.length; j++)
	    {
	    	
	        if (columns[j].getLabel() == stLabel)
	        {
	        	flTrxTotal = ncParseFloatNV(Recs[0].getValue(columns[j]),0);
	        //	nlapiLogExecution('debug','Trx Total',flTrxTotal);
	       //    column = columns[j];
	            break;
	        }
	   	}
	}
//	nlapiLogExecution('debug','Acc Bal',((flCurrBalance * 100) - (flTrxTotal * 100))/100);
	return ((flCurrBalance * 100) - (flTrxTotal * 100))/100;
}

// account constructor
function Account()
{
	this.internalid  = '';
	this.name = '';
	this.number = '';
	this.subsidiary = '';
	this.currency = '1';
	this.balance = '';
	this.subsidiarycurrency = '';
	this.isBaseCurrency = '';
	this.targetaccts = null;
}

// statement constructor
function Statement()
{
	this.internalid = 0;
	this.nsbalance = 0;
	this.nslastbalance = 0;
	this.nsadjbalance = 0;
	this.nsall = 0;
	this.nsunreconciled = 0;
	this.nsreconciled = 0;
	this.bkbalance = 0;
	this.bklastbalance = 0;
	this.bkadjbalance = 0;
	this.bkall = 0;
	this.bkunreconciled = 0;
	this.bkreconciled = 0;
	this.statementdate = '';
	this.startdate = '';
		
}

/** Function to create account object that encapsulates account name, account number, NetSuite target accounts, subsidiary, 
 * and currency for a Reconcile Account. 
 *
 * @param (string)	strReconAcctid internalid of Reconcile Account
 * @return (object)  objAccount
 */
function nbsABR_CreateAccountObject(strReconAcctid)
{
	nlapiLogExecution('debug','nbsABR_CreateAccountObject',strReconAcctid);
	
	var l_id = strReconAcctid;
	var l_subsidiary;
	var l_currency;	
	var arrTrgtAccIds = [];
	var recReconAcct = nlapiLoadRecord('customrecord_nbsabr_accountsetup',l_id);
	
	//search for all target accounts
	var SFs = [	new nlobjSearchFilter('isinactive',null,'is','F',null),
	           	new nlobjSearchFilter('custrecord_nbsabr_ta_reconacc',null,'anyof',l_id,null)];
	var SCs = [new nlobjSearchColumn('custrecord_nbsabr_ta_accountname')];
	
	var trgtAccts = nlapiSearchRecord('customrecord_nbsabr_targetaccount', null, SFs, SCs);
	for(var i =0; trgtAccts != null && i < trgtAccts.length; ++i){
		arrTrgtAccIds.push(trgtAccts[i].getValue('custrecord_nbsabr_ta_accountname'));
	}
	
	//var objAccount = new Account();
	var objAccount = {};
	objAccount.internalid = l_id;
	objAccount.name = recReconAcct.getFieldValue('custrecord_accsetup_accountname');
	objAccount.number = recReconAcct.getFieldValue('custrecord_accsetup_accountnumber');
	objAccount.setupdate = recReconAcct.getFieldValue('custrecord_accsetup_fromdate');
	
	l_subsidiary = recReconAcct.getFieldValue('custrecord_accsetup_subsidiary'); // returns 1 if single company
	l_subsidName = recReconAcct.getFieldText('custrecord_accsetup_subsidiary');
	objAccount.subsidiary = (l_subsidiary !== null) ? l_subsidiary : '1' ;
	objAccount.subsidiaryname = (nbsABR.CONFIG.b_SubsEnabled) ? l_subsidName : '';
	if(nbsABR.CONFIG.b_SubsEnabled){
		// lookup currency of subsid
		objAccount.subsidiarycurrency = (l_subsidiary !== null) ? nlapiLookupField('subsidiary',l_subsidiary,'currency') : '1' ;
	}
	else if(nbsABR.CONFIG.b_multiCurr){// single company, multicurrency
		// lookup currency of company
		/*
		var companyInfo = nlapiLoadConfiguration( 'companyinformation' );
		objAccount.subsidiarycurrency = companyInfo.getFieldValue('basecurrency');
		*/
		objAccount.subsidiarycurrency = nbsABR.CONFIG.basecurrency;
		nlapiLogExecution('debug','nbsABR_CreateAccountObject basecurrency',objAccount.subsidiarycurrency);
	}
	else{// single company, single currency
		objAccount.subsidiarycurrency = '1';  
	}
	
	l_currency = recReconAcct.getFieldValue('custrecord_nbsabr_accsetup_acctcurrency'); // return null if single currency
	objAccount.currency = (l_currency !== null) ? l_currency : '1' ;
	objAccount.currencyname = recReconAcct.getFieldText('custrecord_nbsabr_accsetup_acctcurrency');
	objAccount.isBaseCurrency = (objAccount.currency == objAccount.subsidiarycurrency) ? true : false;
	objAccount.targetaccts = arrTrgtAccIds;
			
	return objAccount;
	
}

/** Function to calculate reconcile account balance for a date. 
 * A Reconcile Account maybe associated with multiple NetSuite accounts 
 * and account balance is calculated as sum of all accounts. 
 *
 * @param {Array}	arrAccts array of account ids
 * @param {String}	stDate date of balance
 * @param {Boolean}  bIsBaseCurrency if true, return balance in base currency of subsidiary; if false, return balance as foreign currency amount
 * @param {Boolean}  bOpeningBalance if true, return opening balance for date, if false return closing balance for date
 * 
 * @return {Number} 	flTotal recon account balance
 */

function nbsABR_getAccountBalance(arrAccts, stDate,bIsBaseCurrency,bOpeningBalance)
{
	var stSrchOp = 'onorbefore';
	if(bOpeningBalance){
		stSrchOp = 'before';
	}
	var flTotal = 0.00;
	var stLabel = 'AMT SUM';
	if(!bIsBaseCurrency){
		stLabel = 'FX AMT SUM';
	}
	nlapiLogExecution('debug','arrAccts - stDate',arrAccts+' - '+stDate);
	var SFs = [ new nlobjSearchFilter('account',null,'anyof',arrAccts,null),
				new nlobjSearchFilter('trandate',null,stSrchOp,stDate ,null)];
	if(nbsABR.CONFIG.reversalvoiding == 'F'){
		SFs.push(new nlobjSearchFilter('voided',null,'is', 'F',null));
	}
//	nlapiLogExecution('debug','stDate',stDate);
	var Recs = nlapiSearchRecord('transaction','customsearch_nbsabr_reconaccttotals',SFs,null);
	if(Recs !== null && Recs.length > 0){			
		var result = Recs[0];
	    var columns = result.getAllColumns();
	    for (var j = 0; j < columns.length; j++){
	    	
	        if (columns[j].getLabel() == stLabel){
	        	flTotal = ncParseFloatNV(Recs[0].getValue(columns[j]),0);
	            break;
	        }
	   	}
	}
	nlapiLogExecution('debug','nbsABR_getAccountBalance',flTotal);
	
	// and need to deduct any Opening Position entries which fall after (onorafter) the statement date,
	// as there are no NS detail transactions for these so always included in NS balance
	var opSrchOp = 'after';
	if (bOpeningBalance)
		opSrchOp = 'onorafter';
	var flOpTotal = 0.0;
	var sfAccts = new nlobjSearchFilter('custrecord_nbsabr_rs_targetacc',null,'anyOf',arrAccts,null);
	var sfTypeIsOpeningPostn = new nlobjSearchFilter('custrecord_nbsabr_rs_recordtype',null,'anyOf',nbsABR.CL.RECTYPE.OPENPOSTN,null);
	var sfTrnDate = new nlobjSearchFilter('custrecord_nbsabr_rs_trndate',null,opSrchOp,stDate,null);
	var scAmt = new nlobjSearchColumn('custrecord_nbsabr_rs_amount',null,'sum');
	var srOpenPos = nlapiSearchRecord('customrecord_nbsabr_reconciliationstate','customsearch_nbsabr_allsum',[sfAccts,sfTypeIsOpeningPostn,sfTrnDate],scAmt);
	if ((srOpenPos !== null) && (srOpenPos.length > 0)) {
		flOpTotal = ncParseFloatNV(srOpenPos[0].getValue(scAmt),0.0);
	}
	
	return (flTotal - flOpTotal);
}

/** Function to calculate reconcile account balance for a date, based upon the ReconciliationState records.
 *
 * @param {String}	reconcile account id
 * @param {String}	stDate date of balance
 * @param {Boolean}  bIsBaseCurrency if true, return balance in base currency of subsidiary; if false, return balance as foreign currency amount
 * @param {Boolean}  bOpeningBalance if true, return opening balance for date, if false return closing balance for date
 * 
 * @return {Number} 	flTotal recon account balance
 */

function nbsABR_getAccountBalance_RS(accountId, stDate,bIsBaseCurrency,bOpeningBalance)
{
	var stSrchOp = 'onorbefore';
	if(bOpeningBalance){
		stSrchOp = 'before';
	}
	var flTotal = 0.00;

	var SFs = [ new nlobjSearchFilter('custrecord_nbsabr_rs_reconacc',null,'anyof',accountId,null),
				new nlobjSearchFilter('custrecord_nbsabr_rs_trndate',null,stSrchOp,stDate,null)];
	var scAmt = new nlobjSearchColumn('custrecord_nbsabr_rs_amount',null,'sum');

	var Recs = nlapiSearchRecord('customrecord_nbsabr_reconciliationstate','customsearch_nbsabr_allsum',SFs,scAmt);
	if(Recs !== null && Recs.length > 0){			
       	flTotal = ncParseFloatNV(Recs[0].getValue(scAmt),0);
	}
	
	return flTotal;
}

function nbsReplaceAt(S,I,C) 
{ 
    return S.substr(0, I) + C + S.substr(I+C.length); 
}
/** nbsABR_LookupAccountName - function to return a reconcile account name given the record internalid. 
 *
 * @param {string} strReconAcctId internalid of reconcile account
 * 
 * @return {string} strAcctName account number(if any) and name
 */
function nbsABR_LookupAccountName(strReconAcctId)
{
	var fNames = ['custrecord_accsetup_accountnumber','custrecord_accsetup_accountname'];
	var fValues = nlapiLookupField('customrecord_nbsabr_accountsetup',strReconAcctId,fNames);
	var strAccName = fValues['custrecord_accsetup_accountname'];
	var strAccNumber = fValues['custrecord_accsetup_accountnumber'];
	
	if(isStringEmpty(strAccNumber)){
		return strAccName;
	}
	else{
		return strAccNumber+' '+strAccName;
	}
}


/** nbsFormatReportCurrency - Formats a float value by adding commas
*
* @param (float) flValue the value to be formatted
* @return the float value formatted
*/
function nbsFormatReportCurrency(flValue) 
{
    var flNumber = ncParseFloatNV(flValue,0);
    var sign = '';  
 
    if(!(flNumber == (flNumber = Math.abs(flNumber))))
    {
    	sign = '-';    	
    }
    
    flNumber = Math.floor(flNumber * 100 + 0.50000000001);
    
    var intDecimal = flNumber % 100;
    
    flNumber = Math.floor(flNumber / 100).toString();
    
    if (intDecimal < 10)
    {
        intDecimal = '0' + intDecimal;    
    }
    
    for (var i = 0; i < Math.floor((flNumber.length - (1 + i)) / 3); i++)
    {
        flNumber = flNumber.substring(0, flNumber.length - (4 * i + 3)) + ',' 
            + flNumber.substring(flNumber.length - (4 * i + 3));        
    }
    
    return sign + flNumber + '.' + intDecimal;
   
}
/** ncLogException - utility function to log an exception, retrieving detail where available (provides consistent logging)
*
* @param except {exception|string} the exception object to be logged, or a string message to be logged
* @param logType {string} the type (debug,audit,error) to be used for the log entry
* @param logTitle {string} the title to be used for the log entry
* 
* @return {void}
*/
function ncLogException(except, logType, logTitle)
{
	var msg = '';
	if (((except instanceof nlobjError) || (typeof(except) == 'object')) && (except.getStackTrace !== undefined) && (typeof(except.getStackTrace) == 'function'))
    {
		msg = except.getCode() + ' - ' + except.getDetails();
		if (except.getCode().indexOf('UNEXPECTED_ERROR') > -1)
			msg += '. Error Id:'+except.getId();
		var ST = except.getStackTrace();
		// nlobjError.getStackTrace() is documented as returning an array, but always seems to return a single string...
		if ((typeof(ST) !== 'undefined') && (ST !== null))
		{
			if (typeof(ST) == 'string')
				msg += '<BR>at '+ST;
			else	// in case we ever do get an array...
				for (var nST = 0; nST < ST.length; ++nST)
					if (ST[nST] !== undefined)
						msg += '<BR>at '+ST[nST];
		}
	}
    else
        msg = except.toString();

	errMsg = 'Exception: '+msg;
	NBS_LogMessage(logType, logTitle, errMsg);
}

/* NBS_LogMessage - wrapper for nlapiLogExecution that will use alert() instead if client side
 * 
 */
function NBS_LogMessage(msgType, msgTitle, message)
{	
	// just try both!
	try { alert(msgType + ':\r\n' + msgTitle + '\r\n' + message.replace(/<br>|<BR>/g,'\r\n')); } catch(e) { }
	try { nlapiLogExecution(msgType, msgTitle, message); } catch(e) { }
}

/** 
 * nbs_GetChildRecordsFieldValue - Get child records field value given the parent record and internal ID value.
 *
 * @param (string) stParentRecordTypeId The internal ID of the parent table whose children are to be retrieved.
 * @param (string) stChildRecordTypeId The internal ID of the child table
 * @param (string) stParentRecordId The internal ID of actual parent record
 *
 * @return (array) arrChildRecordIds Array of child record internal IDs
 */
function nbs_GetChildRecordsFieldValue(stParentRecordTypeId, stChildRecordTypeId, stParentRecordId,stSearchColumn,stSearchJoin)
{
	var arrChildRecordIds = [];
    var columns = [];
    if(stSearchJoin === null){
    	columns.push( new nlobjSearchColumn(stSearchColumn));
    }
    else{
    	columns.push( new nlobjSearchColumn(stSearchColumn,stSearchJoin)) ;
    }
    var filters = [ new nlobjSearchFilter(stParentRecordTypeId, null, 'anyof', stParentRecordId) ];
    
    var results = nlapiSearchRecord(stChildRecordTypeId, null, filters, columns);
    
    for (var i = 0; results !== null && i < results.length; i++){
    	 if(isStringEmpty(stSearchJoin)){
    		 arrChildRecordIds.push(results[i].getValue(stSearchColumn));
    	    }
    	    else{
    	    	 arrChildRecordIds.push(results[i].getValue(stSearchColumn,stSearchJoin));
    	    }
    }  
    return arrChildRecordIds;
}
/**monthDays() - utility function to return last day in month
 * 
 * @returns {Number}
 */

Date.prototype.monthDays=function()
{
	var d=new Date(this.getFullYear(),this.getMonth(),32);
	return 32- d.getDate();
};
/**nbsArithmetic() - utility function to perform arithmatic on floating point numbers
 * 
 * @param {string} op the operator
 * @param {Number} x first number
 * @param {Number} y second number
 * @returns {Number}
 */
function nbsArithmetic(op, x, y) {
    var n = {
            '*': x * y,
            '-': x - y,
            '+': x + y,
            '/': x / y
        }[op];        

    return Math.round(n * 100)/100;
};
