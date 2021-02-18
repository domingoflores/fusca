function ncConst() // dummy constructor for ncConst object
{
}

ncConst.BGP_ProcessInstance = 'customrecord_ncbgp_procinstance'; /* record type for Process Instance */
ncConst.BGP_ProcessLog = 'customrecord_ncbgp_proclog'; /* record type for Process Log */
ncConst.BGP_ProcInstIdParam = 'custscript_bgp_procinstid'; /* parameter name for Process Instance Id on scheduled script deployments */
ncConst.BGP_FunctionNameParam = 'custscript_nbsabr_bgp_processfunction'; /* parameter name for Function Name on scheduled script deployments */
ncConst.BGP_StartupScriptId = 'customscript_nbsabr_bgp_startup'; /* script id for background execution startup */
// ncConst.BGP_StartupDeployId = 'customdeploy_nbsabr_bgp_startup_sd1'; /*
// deployment id for background execution startup */
ncConst.BGP_StartupDeployId = 'customdeploy_nbsabr_bgp_startup_sd'; /* deployment id for background execution startup */

ncConstObj = new Object();
ncConstObj.BGP_ProcessInstance = 'customrecord_ncbgp_procinstance'; /* record type for Process Instance */
ncConstObj.BGP_ProcessLog = 'customrecord_ncbgp_proclog'; /* record type for Process Log */
ncConstObj.BGP_ProcInstIdParam = 'custscript_bgp_procinstid'; /* parameter name for Process Instance Id on scheduled script deployments */
ncConstObj.BGP_FunctionNameParam = 'custscript_nbsabr_bgp_processfunction'; /* parameter name for Function Name on scheduled script deployments */
ncConstObj.BGP_StartupScriptId = 'customscript_nbsabr_bgp_startup'; /* script id for background execution startup */
ncConstObj.BGP_StartupDeployId = 'customdeploy_nbsabr_bgp_startup_sd1'; /* deployment id for background execution startup */

var show=true;
/**
 * This function is a background process to import a CSV or fixed format bank statement
 * 
 * @param {String} ProcessId - internal id of current process record, allowing this script to be invoked directly.<br> 
 * 			If this parameter is null (e.g. when called from a schedule), 
 * 			the custscriptprocessid script parameter will be used
 * @param {String} requestURL - when called directly, the URL of the calling page
 * @param {String} sessionId - when called directly, the session info from the calling page
 * 
 * @return no direct return parameters - all information is passed back by updating the process instance record
 * @author C Shaw
 * @version 1.0
 */

function nbsABR_ImportFileBG(ProcessId, requestURL, sessionId) {
	var _failurePoint = '';
	// var _timestamp = (new Date()).getTime();
	var _timelimit = 600000;
	var procId = null;

	try {
		/* retrieve script parameters --> process id */
		_failurePoint = 'Retrieve script parameters';

		var currentContext = nlapiGetContext();
		procId = currentContext.getSetting('SCRIPT', ncConst.BGP_ProcInstIdParam);

		if ((ProcessId !== undefined) && (ProcessId !== null)) {
			procId = ProcessId; // called directly, so use direct parameter not context setting
			_timelimit = 60000; // because direct, only 60 seconds not 600 seconds
		}

		_timelimit -= 30000; // deduct 30 seconds to give margin of error, time to tidy up and quit, etc. (15 seconds was too short, it STILL failed sometimes)

		if (procId == null)
			return; // nothing to do - no process record to determine status or log events against

		/* retrieve process record --> process parameters */
		_failurePoint = 'Retrieve process record';

		var rProcessInfo = nlapiLoadRecord(ncConst.BGP_ProcessInstance, procId);
		if (rProcessInfo.getFieldValue('custrecord_bgpprocstatus') != '1')
			return; // nothing to do

		var l_RecordCount = ncParseIntNV(rProcessInfo.getFieldValue('custrecord_bgpreccount'), 0);
		var l_QNmbr = rProcessInfo.getFieldValue('custrecord_bgpscrptqnmbr');
		if (isStringEmpty(l_QNmbr))
			l_QNmbr = '1';

		/* retrieve file contents list for processing, and current status info */
		var tmpStr = rProcessInfo.getFieldValue('custrecord_bgpstatedefn');
		if (tmpStr == null)
			tmpStr = "";
		var pNames = tmpStr.split(';');
		tmpStr = rProcessInfo.getFieldValue('custrecord_bgpprocstate');
		if (tmpStr == null)
			tmpStr = "";
		var pValues = tmpStr.split(';');
		var arrBankStatementLines = null;
		var formatId = null;
		var fileId = null; // internal id of file in File Cabinet
		var objFile = null; // loaded file object
		var stContents = null;// file contents as string
		var accountId = null;// Reconcile Account
		var subsidiaryId = null;
		var intCount = null;
		var bankStatementId = null;
		var stDateFormat = 'yymmdd';
		var stLastImportDate = null;
		var dtLastImportDate = null; // date of last imported bank trx
		var stStmntDate = null;
		var dtStmntDate = null;
		var bDateOK = false; // is date of bank trx on or after Last Date
		// var bAccIdentifier = false; 
		// 03 record must include an account number. If Currency Code is blank, default is USD
		var stCurrCode = null;
		var show = true;// show debug logs
		var b_MultipleAccts = false;
		
		if (pNames.length == pValues.length) {
			for ( var pN = 0; pN < pNames.length; ++pN) {
				switch (pNames[pN]) {
				case 'FileId':
					fileId = pValues[pN];
					break;
				case 'Format':
					formatId = pValues[pN];
					// stFormatType = nlapiLookupField('customrecord_nbsabr_formatdefinition',formatId,'custrecord_fd_fileformat');
					break;
				case 'Account':
					accountId = pValues[pN];
					if(accountId == 'multi'){
						b_MultipleAccts = true;
					}
					debugLog(show, 'accountId (case)', accountId);
					break;
				case 'Subsidiary':
					subsidiaryId = pValues[pN];
					break;
				case 'Count':
					intCount = ncParseIntNV(pValues[pN], 0);
					break;
				case 'BSId':
					bankStatementId = pValues[pN];
					break;
				case 'LastImportDate':
					stLastImportDate = pValues[pN];
					break;
				case 'StatementDate':
					stStmntDate = pValues[pN];
					break;
				default:
					// do nothing
				}
			}
		} else {
			// all gone wrong - gracefully abort (and log values?)
			nlapiLogExecution('error', 'nbsBGP_ImportFileBGG', 'parameter values blank, aborting');

			fNames = new Array();
			fNames[0] = 'custrecord_bgpprocmsg';
			fNames[1] = 'custrecord_bgpprocstatus';
			fNames[2] = 'custrecord_bgpactivitytype';
			fValues = new Array();
			fValues[0] = 'parameter values blank, aborting';
			fValues[1] = '4'; // status 4 = failed
			fValues[2] = '3'; // activity type 3 = planned schedule

			nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, fNames, fValues, false);

			return;
		}

		_failurePoint = 'loading  format definition';
		debugLog(show, 'formatId', formatId);

		var recFormat = nlapiLoadRecord('customrecord_nbsabr_formatdefinition', formatId);
		var stFormatType = recFormat.getFieldValue('custrecord_fd_fileformat');
		var stFieldSeparator = recFormat.getFieldValue('custrecord_fd_customfldsep');
		var intStart = ncParseIntNV(recFormat.getFieldValue('custrecord_fd_skipheaderrows'), 0);
		var intStop = ncParseIntNV(recFormat.getFieldValue('custrecord_fd_skipfooterrows'), 0);
		var stInc = recFormat.getFieldValue('custrecord_fd_include');
		var stIncSt = recFormat.getFieldValue('custrecord_fd_includestring');
		
		if (stFormatType === null)
			stFormatType = '';

		_failurePoint = 'Retrieve format line records';
		
		var formatSF = [ new nlobjSearchFilter('custrecord_fdl_formatid', null, 'is', formatId, null) ];
		var formatSR = nlapiSearchRecord('customrecord_nbsabr_formatdefinitionline', 'customsearch_nbsabr_formatlines_ordered', formatSF, null);
		var arrDestFlds = [];
		for ( var i = 0; i < formatSR.length; i+=1)// field numbers start at 1
		{
			// nlapiLogExecution('debug','Fld Num + Dest Field',formatSR[i].getValue('custrecord_fdl_fieldnumber')+' : '+formatSR[i].getText('custrecord_fdl_destinationfield'));
			// build following example array using Destination field names and Field Numbers from the CSV type format:
			// arrDestFlds['Transaction Date'] = 2
			// arrDestFlds['Amount'] = 5
			var idx = formatSR[i].getText('custrecord_fdl_destinationfield');
			if (idx == 'Transaction Date') {
				stDateFormat = formatSR[i].getValue('custrecord_fdl_formatoption');
			}
			
			var DestFld = new Object();
			DestFld.fldnumber = formatSR[i].getValue('custrecord_fdl_fieldnumber');
			DestFld.start = formatSR[i].getValue('custrecord_fdl_start');
			DestFld.end = formatSR[i].getValue('custrecord_fdl_end');
			DestFld.indicator = formatSR[i].getValue('custrecord_fdl_transactiontype');
			DestFld.formatoption = formatSR[i].getValue('custrecord_fdl_formatoption').replace('&lt;', '<');
			arrDestFlds[idx] = DestFld;
			// end
		}

		_failurePoint = 'load imported file';
		objFile = nlapiLoadFile(fileId);
	
		stContents = normalize(objFile.getValue());
		var arrTmp = stContents.split('\n');

		_failurePoint = 'skip header and footer rows';
		arrBankStatementLines = arrTmp.slice(intStart, arrTmp.length - intStop); // array of file lines remove trailing blank line
		var len = arrBankStatementLines.length;
		//remove last line if empty
		if (isStringEmpty(arrBankStatementLines[len - 1])) {
			arrBankStatementLines.splice(len - 1, 1);
		}
		
		_failurePoint = 'verify statement OK';
		// if importing multiple accounts, verify that each account listed in file has an existing reconcile account
		var arrReconAccts = new Array();
		if(b_MultipleAccts){
			arrReconAccts = nbsABR_GetStatementAccounts(stFormatType,formatId,arrBankStatementLines,arrDestFlds,stFieldSeparator);
		}

		_failurePoint = 'retrieve maximum date of existing bank records';
		// .. do not create bank transactions dated before max date
		var SFs = new Array();
		if(b_MultipleAccts){
			var arrTmp = new Array();
			var idx='';
			for(idx in arrReconAccts){
				arrTmp.push(arrReconAccts[idx]);
			}
			SFs = [ new nlobjSearchFilter('custrecord_bsl_reconaccount', null, 'is', arrTmp, null) ];
			debugLog(show, 'arrTmp', arrTmp);
		}
		else{
			SFs = [ new nlobjSearchFilter('custrecord_bsl_reconaccount', null, 'is', accountId, null) ];
		}
		var bsLines = nlapiSearchRecord('customrecord_nbsabr_bankstatementline', 'customsearch_nbsabr_bsl_orderbydate_desc', SFs, null);
		if (bsLines != null && bsLines.length > 0) {
			if (stLastImportDate == '0/0/0000')// first time through
			{
				dtLastImportDate = nlapiStringToDate(bsLines[0].getValue('custrecord_bsl_date'));
				dtStmntDate = nlapiStringToDate(bsLines[0].getValue('custrecord_bsl_date'));
			} else {
				dtLastImportDate = ncDecodeDate(stLastImportDate);
				dtStmntDate = ncDecodeDate(stStmntDate);
			}
		} else {
			// first import
			dtLastImportDate = new Date('2001', '0', '1');
			dtStmntDate = new Date('2001', '0', '1');
		}
		debugLog(show, 'Statement Date', dtStmntDate);
		debugLog(show, 'Last Import Date', dtLastImportDate);

		_failurePoint = 'iterating through bank statement lines';
		var bAbort = false; // flag to indicate we need to quit (governance limits approaching)

		var k = intCount; // intCount required for rescheduling
		var uTarget = 500; // adjust this according to iteration cost
		// var uTarget = 9900; // test re-schedule
		var uRem = 0;
		var bIsTrx = true; // trx record and not a header record
		var stBegText = '';

		// fields for MT940 format ...
		var MT940_Block = 0; // 0 = none (start), 1 = header, 2 = lines, 3 = footer
		var MT940_NewLine = false; // set true on reading a :61: marking the start of a transaction line
		var MT940_Hdr = /^:20:|^:25:|^:28C:|^:NS:22|^:NS:23|^:60F:/;
		var MT940_Line = /^:61:/; // only interested in :61: which flags start of a new transaction line ... then
		// continue parsing lines until next :61: or MT940_Ftr
		var MT940_LineContd = /^:NS:19|^:86:|^<\d\d|^0\d|^[^:<]/; // continuation of line - :NS:19, :86:,
		// <nn subfields or plain text description (immediately after :61:line)
		var MT940_Subfield = /<\d\d/;
		var MT940_Ftr = /^:62F:|^:64:/;
		var MT940_NotAmt = /[^.,\d]/; // first character which is none of . , 0-9
		var MT940_spaces = '                                   '; // 35 spaces end of MT940 fields
		
		// fields for BAI format ...
		var BAI_Block = 0; // 0 = none (start), 1 = header, 2 = lines, 3 = footer
		var BAI_NewLine = false; // set true on reading a 16 marking the start of a transaction line
		var BAI_Hdr = /01|02|03|49/;
		var BAI_Line = /16/; // only interested in :16: which flags start of a new transaction line ... then
		// continue parsing lines until next 16 or BAI_Ftr
		var BAI_LineContd = /88/; // continuation of line/s - 03, 16
		var BAI_Ftr = /|98|99/;
		var BAI_CurrAccNum = '';
		
		var dcInd = null;
		// load any transaction type codes
		var arrTypeCodes = null;
		if (stFormatType.toString() == LIST_FILEFORMAT_BAI)
			arrTypeCodes = getBAITypeCodeArray();
		else {
			// load standard types
			arrTypeCodes = getTrnTypeCodeArray(formatId);
		}

		/* check governance limits - if approaching limit, set bAbort */
		uRem = currentContext.getRemainingUsage();
		if ((uRem <= uTarget) && (arrBankStatementLines != null)) {
			bAbort = true;
		}

		while ((!bAbort) && (arrBankStatementLines != null) && (k < arrBankStatementLines.length)) 
		{
			bIsTrx = true;
			dcInd = '';

			if (arrBankStatementLines[k] == '') {
				k += 1;
				continue;
			}

			// create bank statement line record
			var recBankStatementLine = nlapiCreateRecord('customrecord_nbsabr_bankstatementline');
			recBankStatementLine.setFieldValue('custrecord_bsl_bankstatementid', bankStatementId);
			recBankStatementLine.setFieldValue('custrecord_bsl_subsidiary', subsidiaryId);
			//if importing into single account, set the reconcile account here
			if(!b_MultipleAccts){
				recBankStatementLine.setFieldValue('custrecord_bsl_reconaccount', accountId);
			}
			
			switch (stFormatType.toString()) {
			case LIST_FILEFORMAT_COMMA:
			case LIST_FILEFORMAT_TAB:
				var l_sep = ',';
				if (stFormatType == LIST_FILEFORMAT_TAB)
					l_sep = '\t';
				else if ((stFieldSeparator !== null) && (stFieldSeparator != ''))
					l_sep = stFieldSeparator;
				
				var arrTmp = arrBankStatementLines[k];
				var arrBSLFields = parseCSV(arrTmp,l_sep);
				stBegText = arrBSLFields[0];

				if ((stInc == 'T') && (stIncSt != stBegText)) {
					debugLog(show, 'BegText == IncSt', stBegText + ' == ' + stIncSt);
					break;// skip line
				}

				for ( var index in arrDestFlds) {
					var intFieldNum = parseInt(arrDestFlds[index].fldnumber, 10) - 1;
					var stFldVal = (isStringEmpty(arrBSLFields[intFieldNum])) ? '' : arrBSLFields[intFieldNum];

					switch (index) {
					case 'Account Number':
						recBankStatementLine.setFieldValue('custrecord_bsl_accountnumber', stFldVal);
						//if statement includes multiple accounts, account/routing number determines which reconcile account to set
						if(b_MultipleAccts){
							recBankStatementLine.setFieldValue('custrecord_bsl_reconaccount', arrReconAccts[stFldVal]);							
						}
						break;

					case 'Amount':
						// var flAmt = ncParseFloatNV(stFldVal.replace(/\,/g,''),0);
						var flAmt = nbsABR_ImportedStringToFloat(arrDestFlds[index].formatoption, stFldVal.replace(/\,/g, '')); 
						if (flAmt > 0) {
							recBankStatementLine.setFieldValue('custrecord_bsl_creditamt', flAmt);
						}
						if (flAmt < 0) {
							recBankStatementLine.setFieldValue('custrecord_bsl_debitamt', flAmt);
						}
						recBankStatementLine.setFieldValue('custrecord_bsl_amount', flAmt);
						break;

					case 'Bank Code':
						recBankStatementLine.setFieldValue('custrecord_bsl_bankcode', stFldVal);
						break;

					case 'Check Number':
						recBankStatementLine.setFieldValue('custrecord_bsl_checknumber', stFldVal);
						break;

					case 'Credit Amount':
						// var cAmt = stFldVal.replace(/\,/g,'');
						var flAmt = nbsABR_ImportedStringToFloat(arrDestFlds[index].formatoption, stFldVal.replace(/\,/g, ''));
						if (!isStringEmpty(stFldVal) && flAmt != 0) {
							recBankStatementLine.setFieldValue('custrecord_bsl_amount', flAmt);
							recBankStatementLine.setFieldValue('custrecord_bsl_creditamt', flAmt);
							recBankStatementLine.setFieldValue('custrecord_bsl_dcindicator', '2');
						}
						break;

					case 'Debit Amount':
						
						var flAmt = nbsABR_ImportedStringToFloat(arrDestFlds[index].formatoption, stFldVal.replace(/\,/g, ''));
						if (!isStringEmpty(stFldVal) && flAmt != 0) {
							// if value not signed
							if (flAmt > 0) {
								flAmt *= -1;
							}
							recBankStatementLine.setFieldValue('custrecord_bsl_amount', flAmt);
							recBankStatementLine.setFieldValue('custrecord_bsl_debitamt', flAmt);
							recBankStatementLine.setFieldValue('custrecord_bsl_dcindicator', '1');
						}
						break;

					case 'D/C Indicator':
						//recBankStatementLine.setFieldValue('custrecord_bsl_dcindictator', stFldVal);
						//recBankStatementLine.setFieldText('custrecord_bsl_dcindictator', stFldVal); // D or C
						dcInd = stFldVal || '';
						break;

					case 'Reference':
						recBankStatementLine.setFieldValue('custrecord_bsl_reference', stFldVal);
						break;

					case 'Transaction Date':
						var dtTrxDate = nbsABR_ImportedStringToDate(stDateFormat, stFldVal);
						debugLog(show, 'dtTrxDate', dtTrxDate);

						if (dtTrxDate >= dtLastImportDate) {
							bDateOK = true;
						} else {
							bDateOK = false;
						}
						if (dtTrxDate > dtStmntDate) {
							dtStmntDate = dtTrxDate;
						}
						recBankStatementLine.setFieldValue('custrecord_bsl_date', nlapiDateToString(dtTrxDate));
						break;

					case 'Transaction Type':
						recBankStatementLine.setFieldValue('custrecord_bsl_type', stFldVal);
						if ((arrTypeCodes !== null) && (arrTypeCodes[stFldVal] !== undefined) && (arrTypeCodes[stFldVal] !== null)) {
							// set indicator
							dcInd = arrTypeCodes[stFldVal].indicator || ''; // list value ID
						}
						break;

					default:
						break;
					}
				} // end for
				if (dcInd != '') {
					// handle D/C Indicator
					var lineAmt = ncParseFloatNV(recBankStatementLine.getFieldValue('custrecord_bsl_amount'),0.00);
					if (dcInd == 'D' || dcInd == '1') {
						// debit
						if (lineAmt > 0) lineAmt *= -1;
						
						recBankStatementLine.setFieldValue('custrecord_bsl_dcindicator', 1);
						recBankStatementLine.setFieldValue('custrecord_bsl_amount', lineAmt);
						recBankStatementLine.setFieldValue('custrecord_bsl_debitamt', lineAmt);
						recBankStatementLine.setFieldValue('custrecord_bsl_creditamt', 0.00);
					} else {
						//credit
						if (lineAmt < 0) lineAmt *= -1;
						
						recBankStatementLine.setFieldValue('custrecord_bsl_dcindicator', 2);
						recBankStatementLine.setFieldValue('custrecord_bsl_amount', lineAmt);
						recBankStatementLine.setFieldValue('custrecord_bsl_debitamt', 0.00);
						recBankStatementLine.setFieldValue('custrecord_bsl_creditamt', lineAmt);
					}
				}
				break;
			case LIST_FILEFORMAT_FIXED:

				for ( var index in arrDestFlds) {
					var stLine = arrBankStatementLines[k];
					var start = ncParseIntNV(arrDestFlds[index].start, 0) - 1;
					var end = arrDestFlds[index].end;
					// var indicator = arrDestFlds[index].indicator;
					// debugLog(show, 'Line+start+end+indicator',stLine+' '+start+' '+end+' '+indicator);
					switch (index) {
					case 'Account Number':
						var stValue = stLine.slice(start, end);
						recBankStatementLine.setFieldValue('custrecord_bsl_accountnumber',stValue);
						if(b_MultipleAccts){
							recBankStatementLine.setFieldValue('custrecord_bsl_reconaccount', arrReconAccts[stValue]);		
						}
						break;

					case 'Amount':
						
						var flAmt = nbsABR_ImportedStringToFloat(arrDestFlds[index].formatoption, stLine.slice(start, end).replace(/\,/g, ''));
						if (flAmt > 0) {
							recBankStatementLine.setFieldValue('custrecord_bsl_creditamt', flAmt);
						}
						if (flAmt < 0) {
							recBankStatementLine.setFieldValue('custrecord_bsl_debitamt', flAmt);
						}

						recBankStatementLine.setFieldValue('custrecord_bsl_amount', flAmt);
						break;

					case 'Bank Code':
						recBankStatementLine.setFieldValue('custrecord_bsl_bankcode', stLine.slice(start, end));
						break;

					case 'Check Number':
						recBankStatementLine.setFieldValue('custrecord_bsl_checknumber', stLine.slice(start, end));
						break;

					case 'Credit Amount':
						
						var flAmt = nbsABR_ImportedStringToFloat(arrDestFlds[index].formatoption, stLine.slice(start, end).replace(/\,/g, ''));
						if (flAmt != 0) {
							recBankStatementLine.setFieldValue('custrecord_bsl_amount', flAmt);
							recBankStatementLine.setFieldValue('custrecord_bsl_creditamt', flAmt);
							recBankStatementLine.setFieldValue('custrecord_bsl_dcindicator', '2');
						}
						break;

					case 'Debit Amount':
						
						var flAmt = nbsABR_ImportedStringToFloat(arrDestFlds[index].formatoption, stLine.slice(start, end).replace(/\,/g, ''));
						flAmt = -Math.abs(flAmt); // ensure negative
						if (flAmt != 0) {
							recBankStatementLine.setFieldValue('custrecord_bsl_amount', flAmt);
							recBankStatementLine.setFieldValue('custrecord_bsl_debitamt', flAmt);
							recBankStatementLine.setFieldValue('custrecord_bsl_dcindicator', '1');
						}

						break;

					case 'D/C Indicator':
						var stFldVal = stLine.slice(start, end);
						//recBankStatementLine.setFieldValue('custrecord_bsl_dcindictator', stFldVal);
						//recBankStatementLine.setFieldText('custrecord_bsl_dcindictator', stFldVal);
						dcInd = stFldVal || '';
						break;

					case 'Reference':
						recBankStatementLine.setFieldValue('custrecord_bsl_reference', stLine.slice(start, end));
						break;

					case 'Transaction Date':
						var dtTrxDate = nbsABR_ImportedStringToDate(stDateFormat, stLine.slice(start, end));
						if (dtTrxDate >= dtLastImportDate) {
							bDateOK = true;
						} else {
							bDateOK = false;
						}
						if (dtTrxDate > dtStmntDate) {
							dtStmntDate = dtTrxDate;
						}
						recBankStatementLine.setFieldValue('custrecord_bsl_date', nlapiDateToString(dtTrxDate));
						break;

					case 'Transaction Type':
						var stFldVal = stLine.slice(start, end);
						recBankStatementLine.setFieldValue('custrecord_bsl_type', stFldVal);
						if ((arrTypeCodes !== null) && (arrTypeCodes[stFldVal] !== undefined) && (arrTypeCodes[stFldVal] !== null)) {
							// set indicator
							dcInd = arrTypeCodes[stFldVal].indicator || '';
						}
						break;

					default:
						break;
					}
				}

				if (dcInd != '') {
					// handle D/C Indicator
					var lineAmt = ncParseFloatNV(recBankStatementLine.getFieldValue('custrecord_bsl_amount'),0.00);
					if (dcInd == 'D' || dcInd == '1') {
						// debit
						if (lineAmt > 0) lineAmt *= -1;
						
						recBankStatementLine.setFieldValue('custrecord_bsl_dcindicator', 1);
						recBankStatementLine.setFieldValue('custrecord_bsl_amount', lineAmt);
						recBankStatementLine.setFieldValue('custrecord_bsl_debitamt', lineAmt);
						recBankStatementLine.setFieldValue('custrecord_bsl_creditamt', 0.00);
					} else {
						//credit
						if (lineAmt < 0) lineAmt *= -1;
						
						recBankStatementLine.setFieldValue('custrecord_bsl_dcindicator', 2);
						recBankStatementLine.setFieldValue('custrecord_bsl_amount', lineAmt);
						recBankStatementLine.setFieldValue('custrecord_bsl_debitamt', 0.00);
						recBankStatementLine.setFieldValue('custrecord_bsl_creditamt', lineAmt);
					}
				}
				break;
			case LIST_FILEFORMAT_BAI:
				
				var arrStmntLine = parseCSV(arrBankStatementLines[k]);
				debugLog(show, 'arrStmntLine', arrStmntLine);
				var stIndicator = null;
				var stCode = null;
				var intFieldNum = null;
				var stAmt = null;
				var dtAsOfDate = null;
				var stAsOfDate = '';
						
				switch (BAI_Block) 
				{
					case 0: // initialise - expecting to find header rows
						if (arrStmntLine[0] == '01') {
							BAI_Block = 1; // found a header
							BAI_NewLine = false;
						} else {
							// script rescheduled due to governance limit reached
							// can only be in block 2 or 3 as script does not check for script usage after continuation lines
							if (BAI_Line.test(arrStmntLine[0])) 
							{
								BAI_Block = 2; // Lines block
								BAI_NewLine = true;
							}
						}
						break;
					case 1: // header - expecting to find more headers or line or footer (no lines!)
						if (BAI_Hdr.test(arrStmntLine[0])) {
							BAI_Block = 1; // found a header		
						} 
						else if (BAI_Line.test(arrStmntLine[0])) {
							BAI_Block = 2; // Lines block
							BAI_NewLine = true;
						//	l_RecordCount = 0; // reset so we count transaction lines not file lines
						} 
						else if (BAI_Ftr.test(arrStmntLine[0])) {
							BAI_Block = 3; // Footer block
						}
						break;
					case 2: // lines - expecting to find more lines or footer
						if (BAI_Line.test(arrStmntLine[0])) {
							BAI_NewLine = true;
						} 
						else if (BAI_Hdr.test(arrStmntLine[0])) {
							BAI_Block = 1; // Footer block
						}
						else if (BAI_Ftr.test(arrStmntLine[0])) {
							BAI_Block = 3; // Footer block
						}
						break;
					case 3: // footer - never gets here because we bail out on
						// finding a footer?
						break;
					default: // should never get here
						break;
				}
				// now we know which block we are in, decide what to do...
				bIsTrx = false; // by default, don't commit this as a real line
				// ...
				if (BAI_Block == 1) {
					// 02 - get As Of Date
					 if (arrStmntLine[0] == '02') {
						 stAsOfDate = arrStmntLine[4];

						if (!isStringEmpty(stAsOfDate)) {
							dtAsOfDate = nbsABR_ImportedStringToDate('yymmdd', stAsOfDate);
							debugLog(show, 'AsOfDate', dtAsOfDate);
						}
						if (dtAsOfDate > dtStmntDate) {
							dtStmntDate = dtAsOfDate;
						}
						if (dtAsOfDate >= dtLastImportDate) {
							bDateOK = true;
						} else {
							bDateOK = false;
						}
					 } 
					 else if (arrStmntLine[0] == '03') // 03 - get Currency Code
					 {
						stCurrCode = arrStmntLine[2].slice(0, 3);
						BAI_CurrAccNum = arrStmntLine[1];
						debugLog(show, 'BAI_CurrAccNum', BAI_CurrAccNum);					
						
					 }
				}
				else if (BAI_Block == 2) {
					// line processing...
					if (BAI_NewLine) {
						bIsTrx = true; // commit this as a real line
		
						if (isStringEmpty(dtAsOfDate)) // set date to AsOfDate because of reschedule
						{
							dtAsOfDate = dtStmntDate;
							debugLog(show, 'AsOfDate', dtAsOfDate);
							if (dtAsOfDate >= dtLastImportDate)
								bDateOK = true;
						}
						recBankStatementLine.setFieldValue('custrecord_bsl_date', nlapiDateToString(dtAsOfDate));
						if(b_MultipleAccts){
							//var stAcctNum = arrStmntLine[1];
							//debugLog(show, 'stAcctNum', stAcctNum);
							recBankStatementLine.setFieldValue('custrecord_bsl_reconaccount', arrReconAccts[BAI_CurrAccNum]);	
						}
						recBankStatementLine.setFieldValue('custrecord_bsl_accountnumber', BAI_CurrAccNum);
						
						var stContdLines = '';
						// continue looping thru continuation lines until next transaction line
						// BAI lines returned as array not string
						
						while ((k + 1 < arrBankStatementLines.length) && (BAI_LineContd.test(arrBankStatementLines[k + 1].slice(0,2)))) 
						{
							stContdLines += arrBankStatementLines[k + 1].slice(3);
							++k;		
						}
						// append continuation string to end of array
						arrStmntLine.push(stContdLines);	
						var arrFrmtOptions = [];	
												
						for ( var index in arrDestFlds) 
						{
							intFieldNum = parseInt(arrDestFlds[index].fldnumber, 10) - 1;
													
							var stFormatOption = arrDestFlds[index].formatoption.replace(/\s/g, '');
							if (stFormatOption.indexOf('*') != -1)
							{
								stFormatOption = stFormatOption.slice(1);
								arrFrmtOptions = stFormatOption.split(',');
							}
							
							switch (index) 
							{
								case 'Account Number':
									recBankStatementLine.setFieldValue('custrecord_bsl_accountnumber', arrStmntLine[intFieldNum]);
									break;

								case 'Transaction Type':
									// set transaction type/code
									stTrxCode = arrStmntLine[intFieldNum];
									recBankStatementLine.setFieldValue('custrecord_bsl_type', stTrxCode);

									// set indicator
									stIndicator = arrTypeCodes[stTrxCode].indicator;
									recBankStatementLine.setFieldValue('custrecord_bsl_dcindictator', stIndicator);

									break;

								case 'Transaction Date':
									
									break;

								case 'Amount':

									stAmt = nbsABR_FormatBAI_CurrencyAmount(arrStmntLine[intFieldNum], stIndicator, stCurrCode);
									recBankStatementLine.setFieldValue('custrecord_bsl_amount', stAmt);

									// set credit
									if (stIndicator == LIST_CREDIT_INDICATOR) {
										recBankStatementLine.setFieldValue('custrecord_bsl_creditamt', stAmt);
									}

									// set debit
									if (stIndicator == LIST_DEBIT_INDICATOR) {
										recBankStatementLine.setFieldValue('custrecord_bsl_debitamt', stAmt);
									}
									break;

								case 'Reference':
									var stCustRefNum = arrStmntLine[intFieldNum];
									var idx = stCustRefNum.indexOf('/');
									if (idx != -1) 
									{
										stCustRefNum = stCustRefNum.slice(0, idx);
									}
									var stReference = stCustRefNum;
		
									// if empty, all zero or NONREF, use code description as reference
									var stTestZero = /^(?!0+$)\w{1,35}$/;
									if ((isStringEmpty(stCustRefNum)) || !stTestZero.test(stCustRefNum) || (stCustRefNum == 'NONREF')) 
									{
										// set reference to type code description
										stReference = arrTypeCodes[stTrxCode].description;
									}
									if (stTrxCode == '474' || stTrxCode == '475' || stTrxCode == '395') 
									{
										// set reference to type code description and use CRN as check number
										stReference = arrTypeCodes[stTrxCode].description;
										recBankStatementLine.setFieldValue('custrecord_bsl_checknumber', stCustRefNum);
									}
									for(var c=0; arrFrmtOptions != null && c<arrFrmtOptions.length; c+=1 )
									{
										var trxcode = arrFrmtOptions[c].slice(0,3);
										if(trxcode == stTrxCode && stContdLines != '')
										{
											//var identifier_len = arrFrmtOptions[c].length - 4;
											//var s = stContdLines.indexOf(arrFrmtOptions[c].slice(4)) + identifier_len;
											var s = stContdLines.indexOf(arrFrmtOptions[c].slice(4));//OSF want identifier (ZBA, BNF) to show
											var e = s+35; // truncate to 35 characters
											stReference = stContdLines.slice(s,e);
										}
									}
									recBankStatementLine.setFieldValue('custrecord_bsl_reference', stReference);
									break;

								case 'Check Number':
									if (stCode != '474' || stCode != '475' || stCode != '395') 
									{
										recBankStatementLine.setFieldValue('custrecord_bsl_checknumber', arrStmntLine[intFieldNum]);
									}
									break;

								default:
							}
						}		
					} 
					else 
					{
						// continuation of prior line ... shouldn't get here as we concatenate them all above
					}
				} 
				else if (BAI_Block == 3) 
				{
					k = arrBankStatementLines.length; // stop file processing,
					// reached the footer
				}
						
				break;

			case LIST_FILEFORMAT_MT940:
				/*
				 * File should begin with :20:, :25:, :28C:, :NS:22, [:NS:23,] :60F: (header fields) transaction lines are :61: + transaction description (on
				 * following line!), [:NS:19,] :86:, one or more <nn subfields of :86: ... repeat until footer :62F:, :64:, [:86:] amounts may use , as decimal
				 * separator no field separators - fixed position within each row
				 */
				var l_stmtLine = arrBankStatementLines[k].replace('\n', '').replace('\r', '');
								
				MT940_NewLine = false;
				switch (MT940_Block) {
				case 0: // initialise - expecting to find header rows
					if (l_stmtLine.substring(0, 4) == ':20:') 
					{
						MT940_Block = 1; // found a header
					} else 
					{
						// log error, bad file format! or
						// script rescheduled - should be next transaction line as script does not check for goverance after continuation lines
						if (MT940_Line.test(l_stmtLine)) 
						{
							MT940_Block = 2; // Lines block
							MT940_NewLine = true;
						}
						
					}
					break;
				case 1: // header - expecting to find more headers or line or footer (no lines!)
					if (MT940_Hdr.test(l_stmtLine)) {
						// still header, nothing to do
					} else if (MT940_Line.test(l_stmtLine)) {
						MT940_Block = 2; // Lines block
						MT940_NewLine = true;
					//	l_RecordCount = 0; // reset so we count transaction lines not file lines- only submitted lines now counted
					} else if (MT940_Ftr.test(l_stmtLine)) {
						MT940_Block = 3; // Footer block
					}
					break;
				case 2: // lines - expecting to find more lines or footer
					if (MT940_Line.test(l_stmtLine)) {
						MT940_NewLine = true;
					} else if (MT940_Ftr.test(l_stmtLine)) {
						MT940_Block = 3; // Footer block
					}
					break;
				case 3: // footer - never gets here because we bail out on
					// finding a footer?
					break;
				default: // should never get here
					break;
				}

				// now we know which block we are in, decide what to do...
				bIsTrx = false; // by default, don't commit this as a real line
				// ...
				if (MT940_Block == 1) {
					// if we need any header fields, determine which header row we have and grab any fields
					if(b_MultipleAccts){
						if (l_stmtLine.substring(0, 4) == ':25:') 
						{
							var stAcctNum = l_stmtLine.slice(4);
							recBankStatementLine.setFieldValue('custrecord_bsl_reconaccount', arrReconAccts[stAcctNum]);	
						}	
					}
					// ... we don't need any other header fields (yet)
				} else if (MT940_Block == 2) {
					// line processing...
					if (MT940_NewLine) {
						// start of new line
						bIsTrx = true; // commit this as a real line
						var stLine = l_stmtLine;
						/*
						 * *** pad for missing or short fields, to make it a fixed position format... ***
						 */
						// booking date (optional)
						if ((stLine.charAt(10) == 'D') || (stLine.charAt(10) == 'C')) {
							// booking date subfield omitted - insert 4 spaces
							stLine = stLine.slice(0, 10) + '    ' + stLine.slice(10);
						}
						// amount (variable length, 15)
						var amtFld = stLine.slice(16, 32);
						var endPos = amtFld.search(MT940_NotAmt);
						if ((endPos >= 0) && (endPos < 15)) {
							// non-numeric found before the end of the field, so pad with (15-endPos) spaces...
							stLine = stLine.slice(0, 16 + endPos) + MT940_spaces.slice(0, 15 - endPos) + stLine.slice(16 + endPos);
						} // else ... full 16 digits (15 for amount, plus one
						// in next field), so no need to pad reference (variable length, 20)
						endPos = stLine.indexOf('//');
						if ((endPos >= 0) && (endPos < 51)) {
							stLine = stLine.slice(0, endPos) + MT940_spaces.slice(0, 51 - endPos) + stLine.slice(endPos);
						}
						endPos = stLine.length;
						if (endPos < 69)
							stLine += MT940_spaces.slice(0, 69 - endPos);
						/* end of padding */
						// each :61: line should be followed by a line containing the description, so append this to the
						// prior line and treat them as one and may be followed by further lines (:NS:19 and :86:
						// and all the <nn subfields)
					
						var MT940_continuationIndex = 1;
						//while ((k + 1 < arrBankStatementLines.length) && (MT940_LineContd.test(arrBankStatementLines[k + 1]))) {
						// continue looping thru continuation lines until next transaction line
						while ((k + 1 < arrBankStatementLines.length) && (!MT940_Line.test(arrBankStatementLines[k + 1]))) {
						
							if(MT940_LineContd.test(arrBankStatementLines[k + 1]))// if continuation
							{
								l_stmtLine = arrBankStatementLines[k + 1].replace('\n', '').replace('\r', '');
								
								if (MT940_continuationIndex == 1) {
									stLine += l_stmtLine;
									// description line - variable length, 35
									endPos = l_stmtLine.length;
									if (endPos < 35)
										stLine += MT940_spaces.slice(0, 35 - endPos);
									++MT940_continuationIndex;
								} else if (MT940_continuationIndex == 2) {
									if (l_stmtLine.indexOf(':NS:19') != -1) {
										stLine += l_stmtLine;
										// found, total length should be 10
										endPos = l_stmtLine.length;
										if (endPos < 10)
											stLine += MT940_spaces.slice(0, 10 - endPos);
									} else {
										// not found, add 10 spaces
										stLine += MT940_spaces.slice(0, 10);
										stLine += l_stmtLine;
									}
									++MT940_continuationIndex;
								} else{
									
									if(':<'.indexOf(l_stmtLine[0]) == -1)
									{
										stLine += '<' + l_stmtLine;
									}
									else
									{
										stLine += l_stmtLine;
									}
								}
							}	
							++k;
						}
						for ( var index in arrDestFlds) {
							var start = ncParseIntNV(arrDestFlds[index].start, 0) - 1;
							var end = arrDestFlds[index].end;

							if (MT940_Subfield.test(arrDestFlds[index].formatoption)) {
								var subfield_pos = stLine.indexOf(arrDestFlds[index].formatoption);
								if (subfield_pos != -1) {
									subfield_pos += 3; // skip the subfield header
									start += subfield_pos;
									end += subfield_pos;
									// now look for next subfield and truncate (as each is variable length)
									endPos = stLine.slice(start, end).search(MT940_Subfield);
									if (endPos > -1)
										end = start + endPos;
								}
							}
							switch (index) {
							case 'Account Number':
								recBankStatementLine.setFieldValue('custrecord_bsl_accountnumber', stLine.slice(start, end));
								break;

							case 'Amount':
								
								var flAmt = nbsABR_ImportedStringToFloat(arrDestFlds[index].formatoption, stLine.slice(start, end).replace(/\,/g, ''));
								var stIndicator = stLine.slice(14,15);
								nlapiLogExecution('debug','stIndicator',stIndicator);
								if(stIndicator == 'D') flAmt *= -1;
								if (flAmt > 0) {
									recBankStatementLine.setFieldValue('custrecord_bsl_creditamt', flAmt);
									recBankStatementLine.setFieldValue('custrecord_bsl_dcindicator', '2');
								}
								if (flAmt < 0) {
									recBankStatementLine.setFieldValue('custrecord_bsl_debitamt', flAmt);
									recBankStatementLine.setFieldValue('custrecord_bsl_dcindicator', '1');
								}
								recBankStatementLine.setFieldValue('custrecord_bsl_amount', flAmt);
								break;

							case 'Bank Code':
								recBankStatementLine.setFieldValue('custrecord_bsl_bankcode', stLine.slice(start, end));
								break;

							case 'Check Number':
								recBankStatementLine.setFieldValue('custrecord_bsl_checknumber', stLine.slice(start, end));
								break;

							case 'Credit Amount':
								
								var flAmt = nbsABR_ImportedStringToFloat(arrDestFlds[index].formatoption, stLine.slice(start, end).replace(/\,/g, ''));
								if (flAmt != 0) {
									recBankStatementLine.setFieldValue('custrecord_bsl_amount', flAmt);
									recBankStatementLine.setFieldValue('custrecord_bsl_creditamt', flAmt);
									recBankStatementLine.setFieldValue('custrecord_bsl_dcindicator', '2');
								}
								break;

							case 'Debit Amount':
								
								var flAmt = nbsABR_ImportedStringToFloat(arrDestFlds[index].formatoption, stLine.slice(start, end).replace(/\,/g, ''));
								/*
								 * if((flAmt == (flAmt = Math.abs(flAmt)))) { flAmt *= -1; }
								 */
								flAmt = -Math.abs(flAmt); // ensure negative
								if (flAmt != 0) {
									recBankStatementLine.setFieldValue('custrecord_bsl_amount', flAmt);
									recBankStatementLine.setFieldValue('custrecord_bsl_debitamt', flAmt);
									recBankStatementLine.setFieldValue('custrecord_bsl_dcindicator', '1');
								}

								break;

							case 'D/C Indicator':
								recBankStatementLine.setFieldValue('custrecord_bsl_dcindictator', stLine.slice(start, end));
								break;

							case 'Reference':
								recBankStatementLine.setFieldValue('custrecord_bsl_reference', stLine.slice(start, end));
								break;

							case 'Transaction Date':
								var dtTrxDate = nbsABR_ImportedStringToDate(stDateFormat, stLine.slice(start, end));
								if (dtTrxDate >= dtLastImportDate) {
									bDateOK = true;
								} else {
									bDateOK = false;
								}
								if (dtTrxDate > dtStmntDate) {
									dtStmntDate = dtTrxDate;
								}
								recBankStatementLine.setFieldValue('custrecord_bsl_date', nlapiDateToString(dtTrxDate));
								break;

							case 'Transaction Type':
								recBankStatementLine.setFieldValue('custrecord_bsl_type', stLine.slice(start, end));
								break;

							default:
								break;
							}
						}
					} else {
						// continuation of prior line ... shouldn't get here as we concatenate them all above
					}
				} else if (MT940_Block == 3) {
					k = arrBankStatementLines.length; // stop file processing,
					// reached the footer
					//--l_RecordCount; // so we don't count this line - only submitted records now counted.
				}

				break; // end of MT940 format

			default:
				break;

			}

			_failurePoint = 'submit bank statement line record';
			//++l_RecordCount; // increment overall count of records
			debugLog(show, 'bIsTrx submit', bIsTrx);
			if ((bDateOK) && (bIsTrx)) 
			{	
				++l_RecordCount; // increment overall count of records
				/* var bankStatementLineId = */nlapiSubmitRecord(recBankStatementLine, false);
				nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, 'custrecord_bgpreccount', l_RecordCount, false);
			}
			// write to log if trx date is before existing records
			if ((!bDateOK) && (bIsTrx)) {
				debugLog(show, 'Date not OK', bDateOK + ' (' + bIsTrx + ')');

				ncBGP_WriteToLog(procId, '', 'Bank transaction NOT imported! ' + dtStmntDate + ' is before last import date', 'Error');
			}
			// update bank statement with statement date
			stStmntDate = nlapiDateToString(dtStmntDate);
			nlapiSubmitField('customrecord_nbsabr_bankstatement', bankStatementId, 'custrecord_bs_statementdate', stStmntDate, false);
			k += 1;

			/* check governance limits - if approaching limit, set bAbort */
			uRem = currentContext.getRemainingUsage();
			
			if ((uRem <= uTarget) && (arrBankStatementLines.slice(k) != '')) {
				bAbort = true;
			}
		}

		_failurePoint = 'Handle exit condition';
		if (bAbort) {
			/*
			 * reached here due to governance abort - update Process record with new values and resume where we left off
			 */
			var fNames = [];
			fNames[0] = 'custrecord_bgpstatedefn';
			fNames[1] = 'custrecord_bgpprocstate';
			fNames[2] = 'custrecord_bgpreccount';
			var fValues = [];
			fValues[0] = 'FileId;Format;Account;Subsidiary;Count;BSId;LastImportDate;StatementDate';
			fValues[1] = fileId + ';' + formatId + ';' + accountId + ';' + subsidiaryId + ';' + k + ';' + bankStatementId + ';'
					+ ncEncodeDate(dtLastImportDate) + ';' + ncEncodeDate(nlapiStringToDate(stStmntDate));
			fValues[2] = l_RecordCount.toString();

			var Activity = rProcessInfo.getFieldValue('custrecord_bgpactivitytype');
			if (Activity === null)
				Activity = '';
			switch (Activity.toString()) {
			case '1': // this was a direct call, so switch to custom schedule
				fNames[fNames.length] = 'custrecord_processactivitytype';
				fValues[fValues.length] = '2';
				break;
			case '2': // this was custom schedule, so revert to regular
				// scheduling
				fNames[fNames.length] = 'custrecord_processactivitytype';
				fValues[fValues.length] = '3';
				break;
			default:
				// nothing to do - remain as current
			}
			// submit process instance record
			nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, fNames, fValues, false);
			// log activity
			ncBGP_WriteToLog(procId, '', 'Processing limit reached, re-scheduling', 'Message');

			if ((requestURL !== undefined) && (requestURL !== null)) // called directly so invoke background processing to continue
			{
				var scriptParams = [];
				// scriptParams['functionName'] = 'nbsABR_ImportFileBG';
				// scriptParams['queueNumber'] = l_QNmbr;
				scriptParams[ncConst.BGP_FunctionNameParam] = 'nbsABR_ImportFileBG';
				scriptParams['QNmbr'] = l_QNmbr;

				/*
				 * only administrators can run scheduled scripts. wrap schedule script function in suitelet so call to nlapiScheduleScript can be made by
				 * non-administrator
				 */
				// l_msgtext = nlapiScheduleScript(ncConst.BGP_StartupScriptId,ncConst.BGP_StartupDeployId,scriptParams);
				/* ... use RESTlet interface instead
				var BGPscriptURL = nlapiResolveURL('SUITELET', 'customscript_nbsabr_bgp_starter', 'customdeploy_nbsabr_bgp_starter', true);

				var BGPscriptResp = nlapiRequestURL(BGPscriptURL, null, scriptParams); // params now passed as custom headers
				l_msgtext = BGPscriptResp.getBody();

				if (l_msgtext == null)
					l_msgtext = 'Script or deployment invalid (inst:1)';
				else
					l_msgtext = 'Instance One: ' + l_msgtext;
				// - - -
				... */
				
				var l_msgtext = nbsABR_InvokeBackgroundProcessing(requestURL, sessionId, scriptParams);
				nlapiLogExecution('debug', 'l_msgtext', l_msgtext);
			}
		} else {
			_failurePoint = 'Handle completion';

			_failurePoint = 'Updating records prior to completion';

			// really finished - update process control record for completion
			fNames = [];
			fNames[0] = 'custrecord_bgpstatedefn';
			fNames[1] = 'custrecord_bgpprocstate';
			fNames[2] = 'custrecord_bgpreccount';
			fNames[3] = 'custrecord_bgpprocstatus';
			fNames[4] = 'custrecord_bgpactivitytype';
			fValues = [];
			fValues[0] = '';
			fValues[1] = '';
			fValues[2] = l_RecordCount.toString();
			fValues[3] = '2'; // status 2 = completed
			fValues[4] = '3'; // activity type 3 = planned schedule

			nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, fNames, fValues, false);
			// log activity
			ncBGP_WriteToLog(procId, '', 'File import complete', 'Message'); // 30
		}

	} catch (GE) {
		if (GE instanceof nlobjError)
			msg = GE.getCode() + '\n' + GE.getDetails();
		else
			msg = GE.toString();

		nlapiLogExecution('Error', 'Unhandled Exception', msg);
		nlapiLogExecution('debug', 'Failure Point', _failurePoint);

		// failed - update process control record for error
		fNames = [];
		fNames[0] = 'custrecord_bgpprocmsg';
		fNames[1] = 'custrecord_bgpprocstatus';
		fNames[2] = 'custrecord_bgpactivitytype';
		fValues = [];
		fValues[0] = msg;
		fValues[1] = '4'; // status 4 = failed
		fValues[2] = '3'; // activity type 3 = planned schedule

		nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, fNames, fValues, false);
		// log activity
		ncBGP_WriteToLog(procId, '', 'File import failed:' + msg, 'Error');
	}
}

/**
 * nbsABR_GetStatementAccounts - function to retrieve Reconcile Accounts associated with bank statement
 * 
 * @param {String} stType format type (CSV, Fixed, BAI, etc)
 * @param {String} formatId internalid of import format
 * @param {Array} arrStmntLines array of bank statement lines
 * @param {Array} arrFormatFields array of format fields
 * 
 * @return {Array} arrReconAccts array of Reconcile Accounts associated with accounts contained in statement
 * throws nlobjError 
 */
function nbsABR_GetStatementAccounts(stType,formatId,arrStmntLines,arrFormatFields,stSeparator)
{
	var arrReconAccts = new Array();
	var stAcctNumber = '';

	for(var i =0; arrStmntLines != null && i < arrStmntLines.length; ++i)
	{
		//debugLog(show, 'arrStmntLines[i]', arrStmntLines[i]);
		//if blank line, continue
		if (arrStmntLines[i] == ''){
			//k += 1;
			continue;
		}
	
		switch (stType) {
			case LIST_FILEFORMAT_COMMA:
			case LIST_FILEFORMAT_TAB:
				// determine field separator
				var l_sep = ',';
				if (stType == LIST_FILEFORMAT_TAB)
					l_sep = '\t';
				else if ((stSeparator !== null) && (stSeparator != ''))
					l_sep = stSeparator;
				
				//for each line, get array of line values
				var arrTmp = arrStmntLines[i];
				var arrBSLFields = parseCSV(arrTmp,l_sep);
				
				// retrieve account number from line if exists
				for ( var index in arrFormatFields) {
					var intFieldNum = parseInt(arrFormatFields[index].fldnumber, 10) - 1;
					var stFieldValue = (isStringEmpty(arrBSLFields[intFieldNum])) ? '' : arrBSLFields[intFieldNum];
					
					 if(index =='Account Number'){
						 stAcctNumber = stFieldValue;
						 debugLog(show, 'stAcctNumber - getStmntAccts', stAcctNumber);
					 }
				}			
				break;
				
			case LIST_FILEFORMAT_FIXED:	
				for ( var index in arrFormatFields) {
					var stLine = arrStmntLines[i];
					var start = ncParseIntNV(arrFormatFields[index].start, 0) - 1;
					var end = arrFormatFields[index].end;
					
					 if(index =='Account Number'){
						 stAcctNumber = stLine.slice(start, end);
						 debugLog(show, 'stAcctNumber Fixed', stAcctNumber);
					 }
				}
				break;
				
			case LIST_FILEFORMAT_BAI:
				var arrStmntLine = parseCSV(arrStmntLines[i]);
				 debugLog(show, 'arrStmntLine BAI', arrStmntLine);
				 debugLog(show, 'arrStmntLine[0] BAI', arrStmntLine[0]);
		
				if (arrStmntLine[0] == '03'){
					stAcctNumber = arrStmntLine[1];
					 debugLog(show, 'stAcctNumber BAI', stAcctNumber);
				}
				break;
			
			case LIST_FILEFORMAT_MT940:	
				var l_stmtLine = arrBankStatementLines[i];
				if (l_stmtLine.substring(0, 4) == ':25:'){
					stAcctNumber = l_stmtLine.slice(4);
				}
				
			default:
				break;
		}
	
		if(!isStringEmpty(stAcctNumber)){
			if ((arrReconAccts[stAcctNumber] !== undefined) && (arrReconAccts[stAcctNumber] !== null) && (arrReconAccts[stAcctNumber] != ''))
				continue;	// we have already verified and logged this one, avoid searching on every line!

			//search for reconcile account
			stAcctNumber = stAcctNumber.replace(/\s/g, '');
			var SFs = [new nlobjSearchFilter('isinactive',null,'is','F',null),
					   new nlobjSearchFilter('custrecord_accsetup_accountnumber',null,'startswith',stAcctNumber,null)];
			//var SCs = [new nlobjSearchColumn('custrecord_nbsabr_ta_accountname')];
					
			var srReconAccts = nlapiSearchRecord('customrecord_nbsabr_accountsetup', null, SFs, null);
			if(srReconAccts !== null){
				var id = srReconAccts[0].getId();
				/*if(!inArray(id,arrReconAccts)){
					arrReconAccts.push(id);
				}*/
				
				//add to array of reconcile accounts 
				if(arrReconAccts[stAcctNumber] !== null){
					arrReconAccts[stAcctNumber] = id;
					debugLog(show, 'id', id);
				}
									
			}	
			else{
				var stMsg = 'Reconcile Account record for Account Number: '+stAcctNumber+' cannot be found.';
				throw nlapiCreateError('RCNACCT_MISSING', stMsg);
			}
		}
	}
	return arrReconAccts;
}

/**
 * Gets last match number for a bank account NOT USED
 * 
 * @param (string)
 *            accountId the internal id of the bank account.
 * @return (string)stLastNumber the last number used to match a transaction for this bank account.
 * @throws nlobjError
 *             instance of ABR - Last Match Number not found for this bank account.
 */
function getLastMatchNumber(accountId) {
	var stLastNumber;
	var SF = [ new nlobjSearchFilter('isinactive', null, 'is', 'F', null),
	// new nlobjSearchFilter('custrecord_lmn_subsidiary',null,'is',
	// subsidiaryId,null),
	new nlobjSearchFilter('custrecord_lmn_account', null, 'is', accountId, null) ];
	var SC = [ new nlobjSearchColumn('custrecord_lmn_matchnumber') ];
	var SR = nlapiSearchRecord('customrecord_nbsabr_lastmatchnumber', null, SF, SC);
	if (SR != null && SR.length > 0) // should only be one!!
	{
		stLastNumber = SR[0].getValue('custrecord_lmn_matchnumber');
		nlapiLogExecution('debug', 'stNextNumber', stLastNumber);
		return stLastNumber;
	} else {
		throw nlapiCreateError('ABR_NUM_REC_MISSING', 'Setup incomplete - last number record not found');
	}

}

// NOT USED
function incrementNextMatchNumber(accountId) {
	var intNextNumber = 0;
	var SF = [ new nlobjSearchFilter('isinactive', null, 'is', 'F', null), new nlobjSearchFilter('custrecord_lmn_account', null, 'is', accountId, null) ];
	var SC = [ new nlobjSearchColumn('custrecord_lmn_matchnumber') ];
	var SR = nlapiSearchRecord('customrecord_nbsabr_lastmatchnumber', null, SF, SC);
	if (SR != null) // should only be one!!
	{
		intNextNumber = parseInt(SR[0].getValue('custrecord_lmn_matchnumber'), 10);
		intNextNumber += 1;
		nlapiLogExecution('debug', 'intNextNumber', intNextNumber);
	}
	nlapiSubmitField('customrecord_nbsabr_lastmatchnumber', SR[0].getId(), 'custrecord_lmn_matchnumber', intNextNumber, false);
}

/**
 * This function is a background process to automatch (propose) bank transactions to GL trnsactions
 * 
 * If a reconcile rule is not found for a transaction type, transactions are matched using amount and date (on or before date of bank transaction).
 * 
 * @param (string)
 *            Process Id internal id of current process record, allowing this script to be invoked directly If this parameter is null (e.g. when called from a
 *            schedule), the custscriptprocessid script parameter will be used
 * 
 * @return no direct return parameters - all information is passed back by updating the process instance record
 * @author C Shaw
 * @version 1.0
 */
function nbsABR_ProposeBG(ProcessId, requestURL, sessionId) {
	var _failurePoint = '';
	// var _timestamp = (new Date()).getTime();
	var _timelimit = 600000;
	var procId = null;
	var subsidiaryId = '';
	var accountId = '';
	var stStartDate = '';
	var stStatementDate = '';
	var show = false;// change to true to show debugs
	var intMatchNumber = null;
	var stMatchNumId = null;

	try {
		/* retrieve script parameters --> process id */
		_failurePoint = 'Retrieve script parameters';

		var ctx = nlapiGetContext();
		procId = ctx.getSetting('SCRIPT', ncConst.BGP_ProcInstIdParam);
		//var userAccountId = ctx.getCompany(); // for RESTlet
		// var b_SubsEnabled = ctx.getFeature('SUBSIDIARIES');
		// var b_multiCurr = ctx.getFeature('MULTICURRENCY');

		if ((ProcessId !== undefined) && (ProcessId !== null)) {
			procId = ProcessId; // called directly, so use direct parameter not
			// context setting
			_timelimit = 60000; // because direct, only 60 seconds not 600
			// seconds
		}

		_timelimit -= 30000; // deduct 30 seconds to give margin of error,
		// time to tidy up and quit, etc. (15 seconds was too short, it STILL failed sometimes)

		if (procId == null)
			return; // nothing to do - no process record to determine status or log events against

		/* retrieve process record --> process parameters */
		_failurePoint = 'Retrieve process record';

		var rProcessInfo = nlapiLoadRecord(ncConst.BGP_ProcessInstance, procId);
		if (rProcessInfo.getFieldValue('custrecord_bgpprocstatus') != '1')
			return; // nothing to do

		var l_RecordCount = ncParseIntNV(rProcessInfo.getFieldValue('custrecord_bgpreccount'), 0);

		var l_QNmbr = rProcessInfo.getFieldValue('custrecord_bgpscrptqnmbr');
		if (isStringEmpty(l_QNmbr))
			l_QNmbr = '1';

		/* retrieve list for processing, and current status info */
		var tmpStr = rProcessInfo.getFieldValue('custrecord_bgpstatedefn');
		if (tmpStr == null)
			tmpStr = "";
		var pNames = tmpStr.split(',');
		tmpStr = rProcessInfo.getFieldValue('custrecord_bgpprocstate');
		if (tmpStr == null)
			tmpStr = "";
		var pValues = tmpStr.split(',');
		var lastId = null;

		if (pNames.length == pValues.length) {
			for ( var pN = 0; pN < pNames.length; ++pN) {
				switch (pNames[pN]) {
				case 'Subsidiary':
					subsidiaryId = pValues[pN];
					break;
				case 'Account':
					accountId = pValues[pN];
					nlapiLogExecution('debug','accountId 1338',accountId);
					break;
				case 'StartDate':
					stStartDate = pValues[pN];
					var dtStartDate = ncDecodeDate(stStartDate);
					stStartDate = nlapiDateToString(dtStartDate);
					break;
				case 'StatementDate':
					stStatementDate = pValues[pN];
					var dtStatementDate = ncDecodeDate(stStatementDate);
					stStatementDate = nlapiDateToString(dtStatementDate);
					break;
				case 'LastId':
					lastId = parseInt(pValues[pN], 10);
					break;

				default:
					// do nothing
				}
			}
		} else {
			// all gone wrong - gracefully abort (and log values?)
			nlapiLogExecution('error', 'nbsABR_ProposeBG', 'parameter values blank, aborting');

			fNames = new Array();
			fNames[0] = 'custrecord_bgpprocmsg';
			fNames[1] = 'custrecord_bgpprocstatus';
			fNames[2] = 'custrecord_bgpactivitytype';
			fValues = new Array();
			fValues[0] = 'parameter values blank, aborting';
			fValues[1] = '4'; // status 4 = failed
			fValues[2] = '3'; // activity type 3 = planned schedule

			nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, fNames, fValues, false);

			return;
		}

		// account object - need this as base currency check done on creation of shadow record
		//var objAccount = createAccountObject(accountId);
		// var subsidiaryId = objAccount.subsidiary;
		// var subsidCurrId = objAccount.subsidiarycurrency;
		// var accCurrId = objAccount.currency;
		//var b_IsBaseCurr = objAccount.isBaseCurrency;

		var bUseReconRules = true;
		var bMatchFound = false;
		var arrRules = [];
		// var arrAccts = [];//array of NetSuite account IDs

		// retrieve target accounts for this reconcile account
		// arrAccts = nbs_GetChildRecordsFieldValue('custrecord_nbsabr_ta_reconacc', 'customrecord_nbsabr_targetaccount', accountId,'custrecord_nbsabr_ta_accountname');
		//new nlobjSearchColumn('custrecord_nbsabr_ta_accountname','CUSTRECORD_NBSABR_TA_RECONACC')

		// retrieve last match number for this account
		_failurePoint = 'retrieve last match number';
		var SF = [ new nlobjSearchFilter('isinactive', null, 'is', 'F', null), new nlobjSearchFilter('custrecord_nbsabr_lmn_reconacct', null, 'is', accountId, null) ];
		var SC = [ new nlobjSearchColumn('custrecord_lmn_matchnumber') ];
		var SR = nlapiSearchRecord('customrecord_nbsabr_lastmatchnumber', null, SF, SC);
		if (SR != null && SR.length > 0) // should only be one!!
		{
			intMatchNumber = parseInt(SR[0].getValue('custrecord_lmn_matchnumber'), 0);
			stMatchNumId = SR[0].getId();
		} else {
			
			// create match number record if none found.
			var recMatchNum = nlapiCreateRecord('customrecord_nbsabr_lastmatchnumber', null);
			recMatchNum.setFieldValue('custrecord_nbsabr_lmn_reconacct', accountId);

			stMatchNumId = nlapiSubmitRecord(recMatchNum, true, true);
			intMatchNumber = 1;

		}

		// retrieve reconcile rules, if any
		var rrSFs = [ new nlobjSearchFilter('isinactive', null, 'is', 'F', null) ];
		var rrSCs = [ new nlobjSearchColumn('custrecord_rr_transactiontype'), new nlobjSearchColumn('custrecord_rr_date'),
				new nlobjSearchColumn('custrecord_rr_datefrom'), new nlobjSearchColumn('custrecord_rr_dateto'),
				new nlobjSearchColumn('custrecord_rr_docnumber'), new nlobjSearchColumn('custrecord_rr_documentfrom'),
				new nlobjSearchColumn('custrecord_rr_documentto'), new nlobjSearchColumn('custrecord_rr_docsrchoperator'),
				new nlobjSearchColumn('custrecord_rr_reference'), new nlobjSearchColumn('custrecord_rr_referencefrom'),
				new nlobjSearchColumn('custrecord_rr_referenceto'), new nlobjSearchColumn('custrecord_rr_nsreferencefrom'),
				new nlobjSearchColumn('custrecord_rr_nsrefenceto'), new nlobjSearchColumn('custrecord_rr_gltransactions'),
				new nlobjSearchColumn('custrecord_rr_billpayment'), new nlobjSearchColumn('custrecord_rr_cashsale'),
				new nlobjSearchColumn('custrecord_rr_check'), new nlobjSearchColumn('custrecord_rr_deposit'),
				new nlobjSearchColumn('custrecord_rr_journalentry'), new nlobjSearchColumn('custrecord_rr_payment'),
				new nlobjSearchColumn('custrecord_rr_customerdeposit'), new nlobjSearchColumn('custrecord_rr_customerrefund'),
				new nlobjSearchColumn('custrecord_rr_transfer')];
		var ReconRules = nlapiSearchRecord('customrecord_nbsabr_reconcilerules', null, rrSFs, rrSCs);

		if (ReconRules !== null) {
			for ( var i = 0; i < ReconRules.length; i += 1) {
				var stTrxType = ReconRules[i].getValue('custrecord_rr_transactiontype');
				var stUseDate = ReconRules[i].getValue('custrecord_rr_date');
				var stDateFrom = ReconRules[i].getValue('custrecord_rr_datefrom');
				var stDateTo = ReconRules[i].getValue('custrecord_rr_dateto');
				var stUseDoc = ReconRules[i].getValue('custrecord_rr_docnumber');
				var stDocFrom = ReconRules[i].getValue('custrecord_rr_documentfrom');
				var stDocTo = ReconRules[i].getValue('custrecord_rr_documentto');
				var DocSrchOp = ReconRules[i].getText('custrecord_rr_docsrchoperator');
				var stUseRef = ReconRules[i].getValue('custrecord_rr_reference');
				var stRefFrom = ReconRules[i].getValue('custrecord_rr_referencefrom');
				var stRefTo = ReconRules[i].getValue('custrecord_rr_referenceto');
				var stNSRefFrom = ReconRules[i].getValue('custrecord_rr_nsreferencefrom');
				var stNSRefTo = ReconRules[i].getValue('custrecord_rr_nsrefenceto');
				var stUseGLTrxType = ReconRules[i].getValue('custrecord_rr_gltransactions');
				var stGLTrxTypes = ReconRules[i].getValue('custrecord_rr_gltransactiontype');
				var BillPayment = ReconRules[i].getValue('custrecord_rr_billpayment');
				var CashSale = ReconRules[i].getValue('custrecord_rr_cashsale');
				var Check = ReconRules[i].getValue('custrecord_rr_check');
				var Deposit = ReconRules[i].getValue('custrecord_rr_deposit');
				var Journal = ReconRules[i].getValue('custrecord_rr_journalentry');
				var Payment = ReconRules[i].getValue('custrecord_rr_payment');
				var CustDep = ReconRules[i].getValue('custrecord_rr_customerdeposit');
				var CustRfnd = ReconRules[i].getValue('custrecord_rr_customerrefund');
				var Trnsfr = ReconRules[i].getValue('custrecord_rr_transfer');

				var rule = new Object();
				rule.stTrxType = stTrxType;
				rule.stUseDate = stUseDate;
				rule.stDateFrom = stDateFrom;
				rule.stDateTo = stDateTo;
				rule.stUseDoc = stUseDoc;
				rule.stDocFrom = stDocFrom;
				rule.stDocTo = stDocTo;
				rule.DocSrchOp = DocSrchOp;
				rule.stUseRef = stUseRef;
				rule.stRefFrom = stRefFrom;
				rule.stRefTo = stRefTo;
				rule.stNSRefFrom = stNSRefFrom;
				rule.stNSRefTo = stNSRefTo;
				rule.stUseGLTrxType = stUseGLTrxType;
				rule.stGLTrxTypes = stGLTrxTypes;
				rule.BillPayment = BillPayment;
				rule.CashSale = CashSale;
				rule.Check = Check;
				rule.Deposit = Deposit;
				rule.Journal = Journal;
				rule.Payment = Payment;
				rule.CustDep = CustDep;
				rule.CustRfnd = CustRfnd;
				rule.Trnsfr = Trnsfr;

				arrRules[stTrxType] = rule;

			}
		} else {
			nlapiLogExecution('AUDIT', 'ABR_ProposeBG', 'No reconcile rules found');
		}

		var bAbort = false; // flag to indicate we need to quit (governance limits approaching)
		// Determine maximum units per iteration, so you can test if enough remaining to go round again
		var uTarget = 100; // adjust this according to iteration cost
		// var uTarget = 9700; // test re-schedule 
		var uRem = 0;
		// var tUsed = 0;
	
		// retrieve bank statement lines with empty match numbers
		var bslSFs = [ new nlobjSearchFilter('internalidnumber', null, 'greaterthan', lastId, null),
				new nlobjSearchFilter('custrecord_bsl_reconaccount', null, 'is', accountId, null),
				new nlobjSearchFilter('custrecord_bsl_date', null, 'within', stStartDate, stStatementDate),
				new nlobjSearchFilter('custrecord_bsl_matchnumber', null, 'isempty', null, null) ];
		// Inactive is false
		// reconciled statement is None
		// loop through list of bank transactions and for each one try and a matching GL transaction
		_failurePoint = 'iterating through bank statement lines';

		do {
			// for each bank transaction - find matching GL trxs
			var bsLines = nlapiSearchRecord('customrecord_nbsabr_bankstatementline', 'customsearch_nbsabr_banktrx_orderedbyid', bslSFs, null);

			for ( var i = 0; bsLines != null && i < bsLines.length && !bAbort; i += 1) {
				nlapiLogExecution('debug', 'i', i);
				bMatchFound = false;

				var bslId = bsLines[i].getId();
				lastId = bslId;

				var flAmount = ncParseFloatNV(bsLines[i].getValue('custrecord_bsl_amount'), 0);
				var stDate = bsLines[i].getValue('custrecord_bsl_date');
				var stDoc = bsLines[i].getValue('custrecord_bsl_checknumber');
				if(stDoc === null) stDoc = '';
				var stRef = bsLines[i].getValue('custrecord_bsl_reference');
				var stBSLType = bsLines[i].getValue('custrecord_bsl_type');
				var stGLId = null;
				var stGLType = '';
				var lineNum = null;

				debugLog(show, '1. Bank Trx Id: Amt : Date : Type', bslId + ' : ' + flAmount + ' : ' + stDate + ' : ' + stBSLType);

				
				// no reconcile rules found or no rule for this type -> search on amount and date only
				_failurePoint = 'searching for NetSuite trx - no reconcile rules';
				if (isStringEmpty(stBSLType) || arrRules[stBSLType] == null) {
					bUseReconRules = false;
				} else {
					bUseReconRules = true;
				}

				if (!bUseReconRules) {
		
					var glSFs = [ new nlobjSearchFilter('custrecord_nbsabr_rs_amount', null, 'equalto', flAmount) ];
					glSFs.push(new nlobjSearchFilter('custrecord_nbsabr_rs_reconacc', null, 'is', accountId));
					glSFs.push(new nlobjSearchFilter('custrecord_nbsabr_rs_trndate', null, 'onorbefore', stDate));

					var glTrxSR = nlapiSearchRecord('customrecord_nbsabr_reconciliationstate', 'customsearch_nbsabr_reconstate_outstndng', glSFs, null);

					if (glTrxSR != null && glTrxSR.length > 0) {
						bMatchFound = true;
						// match found - grab earliest trx by trandate
						stGLId = glTrxSR[0].getId();
						//stGLType = glTrxSR[0].getRecordType();
						//stIsReversal = glTrxSR[0].getValue('isreversal');
						lineNum = ncParseIntNV(glTrxSR[0].getValue('custrecord_nbsabr_rs_linenumber'), 0);

						debugLog(show, 'Match Found (no rules) BKid : type : GLid : Line', bslId + ' : ' + stGLType + ' : ' + stGLId + ' : ' + lineNum);
					}
				} else {
					_failurePoint = 'searching for GL trx using reconcile rules';
	
					// is there is a rule for type eg BAC?
					if (arrRules[stBSLType] !== null) {
						var objRule = arrRules[stBSLType];
			
						var glSFs = [ new nlobjSearchFilter('custrecord_nbsabr_rs_amount', null, 'equalto', flAmount) ];
						glSFs[1] = new nlobjSearchFilter('custrecord_nbsabr_rs_reconacc', null, 'is', accountId);
						glSFs[2] = new nlobjSearchFilter('custrecord_nbsabr_rs_trndate', null, 'onorbefore', stDate); // date of bank trx

						// use date matching
						if (objRule.stUseDate == 'T') {
							var intFrom = ncParseIntNV(objRule.stDateFrom, 0);
							var intTo = ncParseIntNV(objRule.stDateTo, 0);
							var dtDate = nlapiStringToDate(stDate);
							var dtFrom = nlapiAddDays(dtDate, intFrom);
							var dtTo = nlapiAddDays(dtDate, intTo);

							glSFs[2] = new nlobjSearchFilter('custrecord_nbsabr_rs_trndate', null, 'onorbefore', nlapiDateToString(dtTo));
							glSFs[3] = new nlobjSearchFilter('custrecord_nbsabr_rs_trndate', null, 'onorafter', nlapiDateToString(dtFrom));

						}

						// use doc/check number matching
						if (objRule.stUseDoc == 'T') {
							var intFrom = ncParseIntNV(objRule.stDocFrom, 1) - 1;
							var intTo = ncParseIntNV(objRule.stDocTo, stDoc.length);
							var stText = stDoc.slice(intFrom, intTo);
							debugLog(show, 'stText', stText);

							/*
							 * var strHex = ''; for (var i = 0, l = stText.length; i < l; i++) { strHex += '\\u' + (stText.charCodeAt(i) +
							 * 0x10000).toString(16).slice(1); }
							 */

							var stSrchOp = objRule.DocSrchOp;
							if (isStringEmpty(stSrchOp)) {
								stSrchOp = 'startswith';
							}
							if (!isStringEmpty(stText)) {
								glSFs.push(new nlobjSearchFilter('custrecord_nbsabr_rs_tranid', null, stSrchOp, stText));
							} //else {continue;}
						}
						// transaction type matching
						if (objRule.stUseGLTrxType == 'T') {
							var arrTrxTypes = [];
							if (objRule.BillPayment == 'T')
								arrTrxTypes.push('18');//VendPymt
							if (objRule.CashSale == 'T')
								arrTrxTypes.push('5');//CashSale
							if (objRule.Check == 'T')
								arrTrxTypes.push('3');//Check
							if (objRule.Deposit == 'T')
								arrTrxTypes.push('4');//Deposit
							if (objRule.Journal == 'T')
								arrTrxTypes.push('1');//Journal
							if (objRule.Payment == 'T')
								arrTrxTypes.push('9');//CustPymt
							if (objRule.CustDep == 'T')
								arrTrxTypes.push('40');//CustDep
							if (objRule.CustRfnd == 'T')
								arrTrxTypes.push('30');//CustRfnd
							if (objRule.Trnsfr == 'T')
								arrTrxTypes.push('2');//Transfer

							if (arrTrxTypes != null) {
								glSFs.push(new nlobjSearchFilter('custrecord_nbsabr_rs_trantype', null, 'anyof', arrTrxTypes));
							}
							debugLog(show, 'include trx types', arrTrxTypes);
						}
						// execute search for matching gl trx
						var glTrxSR = nlapiSearchRecord('customrecord_nbsabr_reconciliationstate', 'customsearch_nbsabr_reconstate_outstndng', glSFs, null);

						if (glTrxSR != null && glTrxSR.length > 0) {
							bMatchFound = true;
							// match found - search ordered by date ASC - so take earliest
							stGLId = glTrxSR[0].getId();
							//stGLType = glTrxSR[0].getRecordType();
						
							lineNum = ncParseIntNV(glTrxSR[0].getValue('custrecord_nbsabr_rs_linenumber'), 0);

							debugLog(show, 'Match! BKid : type : GLid : Line', bslId + ' : ' + stGLType + ' : ' + stGLId + ' : ' + lineNum);

						}
						// reference matching - iterate through search results
						// not using "contains" as reference could be memo field on JE
						if (objRule.stUseRef == 'T' && bMatchFound) {
							// bank from & to positions
							var intFrom = ncParseIntNV(objRule.stRefFrom, 0) - 1;
							var intTo = ncParseIntNV(objRule.stRefTo, 0);
							// substring from bank trx reference field in upper case
							var stRefText = stRef.slice(intFrom, intTo).toUpperCase();

							// NS from & to positions
							var intNSFrom = ncParseIntNV(objRule.stNSRefFrom, 1) - 1;
							var intNSTo = ncParseIntNV(objRule.stNSRefTo, 0);

							if (!isStringEmpty(stRefText)) {
								bMatchFound = false;
								for ( var m = 0; m < glTrxSR.length && !bMatchFound; m += 1) {
									// var stTmp = glTrxSR[m].getText('custrecord_nbsabr_rs_entity');
									var stTmp = glTrxSR[m].getValue('custrecord_nbsabr_rs_entityname');
									// if empty, try memo value instead as could be JE
									if (isStringEmpty(stTmp)) {
										stTmp = glTrxSR[m].getValue('custrecord_nbsabr_rs_memo');
									}
									if (isStringEmpty(stTmp))
										stTmp = '';

									var stEntityText = stTmp.slice(intNSFrom, intNSTo).toUpperCase();

									debugLog(show, 'Ref text, Bank : GL', stRefText + ' : ' + stEntityText);

									if (stEntityText == stRefText) {
										bMatchFound = true;
										stGLId = glTrxSR[m].getId();
									}
								}
							}
						}
					}
				}
				if (bMatchFound) {
					intMatchNumber += 1;
					
					try{
						var fieldNames = ['custrecord_nbsabr_rs_matchnumber', 'custrecord_nbsabr_rs_status'];		
						var fieldValues = [intMatchNumber, nbsABR.CL.STATUS.MATCHED];		
						_failurePoint = 'updating match number on recon state';
						nlapiSubmitField('customrecord_nbsabr_reconciliationstate', stGLId, fieldNames, fieldValues, false);
					
						_failurePoint = 'updating match number on bank transaction';
						nlapiSubmitField('customrecord_nbsabr_bankstatementline', bslId, 'custrecord_bsl_matchnumber', intMatchNumber, false);
					}
					catch(e){
						throw(e);
					}
				}

				/* check governance limits - if approaching limit, set bAbort */
				uRem = ctx.getRemainingUsage();
				// nlapiLogExecution('debug','uRem',uRem);

				if (uRem <= uTarget) {
					nlapiLogExecution('debug', 'uRem', uRem + ': ' + i);
					bAbort = true;
					break;
				}
				// increment overall count of records
				l_RecordCount += 1;
				
				// update record count on process instance record
				nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, 'custrecord_bgpreccount', l_RecordCount, false);
			}
			bslSFs[0] = new nlobjSearchFilter('internalidnumber', null, 'greaterthan', lastId, null);
		} while (bsLines != null && !bAbort);

		// encode dates
		var dtStartDate = nlapiStringToDate(stStartDate);
		stStartDate = ncEncodeDate(dtStartDate);
		var dtStatementDate = nlapiStringToDate(stStatementDate);
		stStatementDate = ncEncodeDate(dtStatementDate);

		if (bAbort) {
			 //reached here due to governance abort - update Process record with new values and resume where we left off
			 
			_failurePoint = 'Handle exit condition and reschedule';
			
			var fNames = [];
			fNames[0] = 'custrecord_bgpstatedefn';
			fNames[1] = 'custrecord_bgpprocstate';
			fNames[2] = 'custrecord_bgpreccount';
			var fValues = [];
			fValues[0] = 'Subsidiary,Account,StartDate,StatementDate,LastId';
			fValues[1] = subsidiaryId + ',' + accountId + ',' + stStartDate + ',' + stStatementDate + ',' + lastId;
			fValues[2] = l_RecordCount.toString();

			var Activity = rProcessInfo.getFieldValue('custrecord_bgpactivitytype');
			if (Activity === null)
				Activity = '';
			switch (Activity.toString()) {
			case '1': // this was a direct call, so switch to custom schedule
				fNames[fNames.length] = 'custrecord_processactivitytype';
				fValues[fValues.length] = '2';
				break;
			case '2': // this was custom schedule, so revert to regular
				// scheduling
				fNames[fNames.length] = 'custrecord_processactivitytype';
				fValues[fValues.length] = '3';
				break;
			default:
				// nothing to do - remain as current
			}
			// submit process instance record
			nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, fNames, fValues, false);
			// log activity
			ncBGP_WriteToLog(procId, '', 'Processing limit reached, re-scheduling', 'Message');
			// submit match number record
			nlapiSubmitField('customrecord_nbsabr_lastmatchnumber', stMatchNumId, 'custrecord_lmn_matchnumber', intMatchNumber, false);

			if ((requestURL !== undefined) && (requestURL !== null)) // called directly so invoke background
			// processing to continue
			{
				var scriptParams = [];
				// scriptParams['functionName'] = 'nbsABR_ProposeBG';
				// scriptParams['queueNumber'] = l_QNmbr;
				scriptParams[ncConst.BGP_FunctionNameParam] = 'nbsABR_ProposeBG';
				scriptParams['QNmbr'] = l_QNmbr;

				/*
				 * only administrators can run scheduled scripts. wrap schedule script function in suitelet so call to nlapiScheduleScript can be made by
				 * non-administrator
				 */
				// l_msgtext = nlapiScheduleScript(ncConst.BGP_StartupScriptId,ncConst.BGP_StartupDeployId,scriptParams);
				/*
				 var BGPscriptURL = nlapiResolveURL('SUITELET','customscript_nbsabr_bgp_starter','customdeploy_nbsabr_bgp_starter',true);
				 var BGPscriptResp = nlapiRequestURL( BGPscriptURL, null, scriptParams ); // params now passed as custom headers l_msgtext = BGPscriptResp.getBody();
				 var l_msgtext = BGPscriptResp.getBody();
				 if( l_msgtext == null ){
					 l_msgtext = 'Script or deployment invalid (inst:1)'; 
				 }
				 else{
					 l_msgtext = 'Instance One: '+l_msgtext;
				 }
				*/				 

				var l_msgtext = nbsABR_InvokeBackgroundProcessing(requestURL, sessionId, scriptParams);
				ncBGP_WriteToLog(procId, '', 'Rescheduling...' + l_msgtext.slice(0,275), 'Message'); // 6u
			}
		} else {
			_failurePoint = 'Handle completion';

			// really finished - update process control record for completion
			fNames = [];
			fNames[0] = 'custrecord_bgpstatedefn';
			fNames[1] = 'custrecord_bgpprocstate';
			fNames[2] = 'custrecord_bgpreccount';
			fNames[3] = 'custrecord_bgpprocstatus';
			fNames[4] = 'custrecord_bgpactivitytype';
			fValues = [];
			fValues[0] = '';
			fValues[1] = '';
			fValues[2] = l_RecordCount.toString();
			fValues[3] = '2'; // status 2 = completed
			fValues[4] = '3'; // activity type 3 = planned schedule

			_failurePoint = 'Updating records prior to completion';
			nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, fNames, fValues, false);// 2u
			// log activity
			ncBGP_WriteToLog(procId, '', 'Proposal complete', 'Message'); // 6u
			// update last match number record
			nlapiSubmitField('customrecord_nbsabr_lastmatchnumber', stMatchNumId, 'custrecord_lmn_matchnumber', intMatchNumber, false);
		}
	} catch (GE) {
		if (GE instanceof nlobjError)
			msg = GE.getCode() + '\n' + GE.getDetails();
		else
			msg = GE.toString();

		nlapiLogExecution('Error', 'Unhandled Exception', msg);
		nlapiLogExecution('debug', 'Failure Point', _failurePoint);

		// failed - update process control record for error
		fNames = [];
		fNames[0] = 'custrecord_bgpprocmsg';
		fNames[1] = 'custrecord_bgpprocstatus';
		fNames[2] = 'custrecord_bgpactivitytype';
		fValues = [];
		fValues[0] = msg;
		fValues[1] = '4'; // status 4 = failed
		fValues[2] = '3'; // activity type 3 = planned schedule

		nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, fNames, fValues, false);
		// log activity
		ncBGP_WriteToLog(procId, '', 'Automatch failed:' + msg, 'Error');

		// update last match number record
		nlapiSubmitField('customrecord_nbsabr_lastmatchnumber', stMatchNumId, 'custrecord_lmn_matchnumber', intMatchNumber, false);
	}
}

/**
 * nbsABR_ReconcileBG - function is a background process to reconcile a bank statement
 * 
 * @param (string)
 *            Process Id internal id of current process record, allowing this script to be invoked directly If this parameter is null (e.g. when called from a
 *            schedule), the custscriptprocessid script parameter will be used
 * 
 * @return no direct return parameters - all information is passed back by updating the process instance record
 * @author C Shaw
 * @version 1.0
 */
function nbsABR_ReconcileBG(ProcessId, requestURL, sessionId) {

	var _failurePoint = '';
	// var _timestamp = (new Date()).getTime();
	var _timelimit = 600000;
	var procId = null;
	var show = true;

	try {
		/* retrieve script parameters --> process id */
		_failurePoint = 'Retrieve script parameters';

		var ctx = nlapiGetContext();
		procId = ctx.getSetting('SCRIPT', ncConst.BGP_ProcInstIdParam);
		
		if ((ProcessId !== undefined) && (ProcessId !== null)) {
			procId = ProcessId; // called directly, so use direct parameter not
			// context setting
			_timelimit = 60000; // because direct, only 60 seconds not 600
			// seconds
		}

		_timelimit -= 30000; // deduct 30 seconds to give margin of error,
		// time to tidy up and quit, etc. (15 seconds was too short, it STILL failed sometimes)

		if (procId == null)
			return; // nothing to do - no process record to determine status or log events against

		/* retrieve process record --> process parameters */
		_failurePoint = 'Retrieve process record';

		var rProcessInfo = nlapiLoadRecord(ncConst.BGP_ProcessInstance, procId);
		if (rProcessInfo.getFieldValue('custrecord_bgpprocstatus') != '1')
			return; // nothing to do

		var l_RecordCount = ncParseIntNV(rProcessInfo.getFieldValue('custrecord_bgpreccount'), 0);

		var l_QNmbr = rProcessInfo.getFieldValue('custrecord_bgpscrptqnmbr');
		if (isStringEmpty(l_QNmbr))
			l_QNmbr = '1';

		/* retrieve list for processing, and current status info */
		var tmpStr = rProcessInfo.getFieldValue('custrecord_bgpstatedefn');
		if (tmpStr == null)
			tmpStr = "";
		var pNames = tmpStr.split(',');
		tmpStr = rProcessInfo.getFieldValue('custrecord_bgpprocstate');
		if (tmpStr == null)
			tmpStr = "";
		var pValues = tmpStr.split(',');

		var SHId = null;
		var dtStartDate = null;
		var stStartDate = '';
		var stStatementDate = '';
		var stEncodedStmntDate = '';
		var accountId = null;
		var subsidiaryId = null;
		var lastTrxId = null;
		var lastBSLId = null;
		var endingBalance = null;
		var lastBalance = null;
		var stStmntOpeningDate = '';
		var strLastStmntId = '';

		if (pNames.length == pValues.length) {
			for ( var pN = 0; pN < pNames.length; ++pN) {
				switch (pNames[pN]) {
				case 'StatementHistoryId':
					SHId = pValues[pN];
					break;
				case 'StartDate':// Reconcile From date set on account setup record
					stStartDate = pValues[pN];
					dtStartDate = ncDecodeDate(stStartDate);
					stStartDate = nlapiDateToString(dtStartDate);
					break;
				case 'LastGLId':// not needed as records are updated
					lastTrxId = pValues[pN];
					break;
				case 'LastBSLId': // not needed?
					lastBSLId = pValues[pN];
					break;
				case 'StatementDate':
					// setup record
					//stStatementDate = pValues[pN];
					stEncodedStmntDate = pValues[pN];
					//var dtStatementDate = ncDecodeDate(stStatementDate);
					var dtStatementDate = ncDecodeDate(stEncodedStmntDate);
					stStatementDate = nlapiDateToString(dtStatementDate);
					break;
				case 'AccountId':
					accountId = pValues[pN];
					break;
				case 'SubsidiaryId':
					subsidiaryId = pValues[pN];
					break;
				case 'LastBalance':
					lastBalance = pValues[pN];
					break;
				case 'EndingBalance':
					endingBalance = pValues[pN];
					break;
				case 'StmntOpeningDate':
					stStmntOpeningDate = pValues[pN];
					var dtTmpDate = ncDecodeDate(stStmntOpeningDate);
					stStmntOpeningDate = nlapiDateToString(dtTmpDate);
					break;
				case 'LastStmntId':
					strLastStmntId = pValues[pN];
					break;

				default:
					// do nothing
				}
			}
		} else {
			// all gone wrong - gracefully abort (and log values?)
			nlapiLogExecution('error', 'nbsABR_ReconcileBG', 'parameter values blank, aborting');

			fNames = new Array();
			fNames[0] = 'custrecord_bgpprocmsg';
			fNames[1] = 'custrecord_bgpprocstatus';
			fNames[2] = 'custrecord_bgpactivitytype';
			fValues = new Array();
			fValues[0] = 'parameter values blank, aborting';
			fValues[1] = '4'; // status 4 = failed
			fValues[2] = '3'; // activity type 3 = planned schedule

			nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, fNames, fValues, false);

			return;
		}
	
		// account object
		_failurePoint = 'create account object';
//		var objAccount = nbsABR_CreateAccountObject(accountId);
//		var b_IsBaseCurr = objAccount.isBaseCurrency;
//		var arrAccts = objAccount.targetaccts;
		
		// get account balance as of statement date
		//var flAsOfBal = nbsABR_getAccountBalance(arrAccts, stStatementDate, b_IsBaseCurr,false);
		
		_failurePoint = 'creating statement';
		if (SHId == 'none') { //first time thru
			// create statement object
			var objStmnt = new Statement();
					
			_failurePoint = 'lookup balances on last statement';
			if( !isStringEmpty(strLastStmntId)){
				var fldNames = ['custrecord_sh_ns_balance','custrecord_sh_bk_balance'];
				var fldValues = nlapiLookupField('customrecord_nbsabr_statementhistory',strLastStmntId,fldNames);
				objStmnt.nslastbalance = ncParseFloatNV(fldValues['custrecord_sh_ns_balance'],0);
				objStmnt.bklastbalance = ncParseFloatNV(fldValues['custrecord_sh_bk_balance'],0);
				
				// SUM of new Bank transactions this period
				var bkSFs = [ new nlobjSearchFilter('custrecord_bsl_date',null,'within',stStmntOpeningDate,stStatementDate),
				              new nlobjSearchFilter('isinactive',null,'is','F',null),
				              new nlobjSearchFilter('custrecord_bsl_reconaccount',null,'is',accountId ,null)];
				var bkSCs = [new nlobjSearchColumn('custrecord_bsl_amount',null,'SUM')];
				var BKrecs = nlapiSearchRecord('customrecord_nbsabr_bankstatementline',null,bkSFs,bkSCs);
				if(BKrecs != null){			
					objStmnt.bkall = ncParseFloatNV(BKrecs[0].getValue('custrecord_bsl_amount',null,'SUM'),0);
					debugLog(show,'bkall',objStmnt.bkall);
				}
				
				// SUM of all Unreconciled BK transactions on and before this statement date
				bkSFs[0] = new nlobjSearchFilter('custrecord_bsl_date',null,'onorbefore',stStatementDate);
				bkSFs.push( new nlobjSearchFilter('custrecord_bsl_matchnumber',null,'isempty',null ,null));
				var BKrecs = nlapiSearchRecord('customrecord_nbsabr_bankstatementline',null,bkSFs,bkSCs);
				if(BKrecs != null){			
					objStmnt.bkunreconciled = ncParseFloatNV(BKrecs[0].getValue('custrecord_bsl_amount',null,'SUM'),0);
				}
				
				// SUM of new NS transactions this period
				var nsSFs = [ new nlobjSearchFilter('custrecord_nbsabr_rs_trndate',null,'within',stStmntOpeningDate,stStatementDate),
				            new nlobjSearchFilter('isinactive',null,'is','F',null),
				            new nlobjSearchFilter('custrecord_nbsabr_rs_reconacc',null,'is',accountId ,null)];
				var nsSCs = [	new nlobjSearchColumn('custrecord_nbsabr_rs_amount',null,'SUM')];
			
				var NSrecs = nlapiSearchRecord('customrecord_nbsabr_reconciliationstate',null,nsSFs,nsSCs);
				if(NSrecs != null){			
					objStmnt.nsall = ncParseFloatNV(NSrecs[0].getValue('custrecord_nbsabr_rs_amount',null,'SUM'),0);
					debugLog(show,'nsall',objStmnt.nsall);
				}
				
				// SUM of all Unreconciled NS transactions on and before this statement date
				nsSFs[0] = new nlobjSearchFilter('custrecord_nbsabr_rs_trndate',null,'onorbefore',stStatementDate);
				nsSFs.push(new nlobjSearchFilter('custrecord_nbsabr_rs_status',null,'anyof',nbsABR.CL.STATUS.UNMATCHED ,null));
				            		
				var NSrecs = nlapiSearchRecord('customrecord_nbsabr_reconciliationstate',null,nsSFs,nsSCs);
				if(NSrecs != null){			
					objStmnt.nsunreconciled = ncParseFloatNV(NSrecs[0].getValue('custrecord_nbsabr_rs_amount',null,'SUM'),0);
				}
			}
			// NetSuite balance as of statement date
			//objStmnt.nsbalance = flAsOfBal;
			objStmnt.nsbalance = nbsArithmetic('+',objStmnt.nslastbalance,objStmnt.nsall);
			objStmnt.bkbalance = nbsArithmetic('+',objStmnt.bklastbalance,objStmnt.bkall);
			
			//calculate adjusted balances
			objStmnt.nsadjbalance = nbsArithmetic('-',objStmnt.nsbalance,objStmnt.nsunreconciled);
			objStmnt.bkadjbalance = nbsArithmetic('-',objStmnt.bkbalance,objStmnt.bkunreconciled);
			
			debugLog(show,'nsbalance',objStmnt.nsbalance);
			debugLog(show,'bkbalance',objStmnt.bkbalance);
		
		//... moved further up: if (SHId == 'none') { //first time thru
			_failurePoint = 'create this statement history record';
		
			var recStatementHistory = nlapiCreateRecord('customrecord_nbsabr_statementhistory');
			recStatementHistory.setFieldValue('custrecord_sh_reconaccount', accountId);
			recStatementHistory.setFieldValue('custrecord_sh_subsidiary', subsidiaryId);
			recStatementHistory.setFieldValue('custrecord_sh_startingbalance', lastBalance);
			recStatementHistory.setFieldValue('custrecord_sh_endingbalance', endingBalance);
			recStatementHistory.setFieldValue('custrecord_sh_startdate', stStmntOpeningDate);
			recStatementHistory.setFieldValue('custrecord_sh_date', stStatementDate);
			// NS fields
	 		recStatementHistory.setFieldValue('custrecord_sh_ns_adjbalance', objStmnt.nsadjbalance);
	 		recStatementHistory.setFieldValue('custrecord_sh_ns_unreconciled', objStmnt.nsunreconciled);
	 		//recStatementHistory.setFieldValue('custrecord_sh_ns_reconciled', '');
	 		recStatementHistory.setFieldValue('custrecord_sh_ns_balance', objStmnt.nsbalance);
	 		// BK fields
	 		recStatementHistory.setFieldValue('custrecord_sh_bk_adjbalance', objStmnt.bkadjbalance);
	 		recStatementHistory.setFieldValue('custrecord_sh_bk_unreconciled', objStmnt.bkunreconciled);
	 		//recStatementHistory.setFieldValue('custrecord_sh_bk_reconciled', '');
	 		recStatementHistory.setFieldValue('custrecord_sh_bk_balance', objStmnt.bkbalance);
						
			SHId = nlapiSubmitRecord(recStatementHistory, false);
		} else {
			_failurePoint = 'load this statement history record';
			
			var recSH = nlapiLoadRecord('customrecord_nbsabr_statementhistory', SHId);
			stStatementDate = recSH.getFieldValue('custrecord_sh_date');
			accountId = recSH.getFieldValue('custrecord_sh_reconaccount');
		}
		
		var bAbort = false; // flag to indicate we need to quit (governance limits approaching)
		// var k = 0; // index for current trx
		// Determine maximum units per iteration, so you can test if enough remaining to go round again
		var uTarget = 100; // adjust this according to iteration cost
		// var uTarget = 9950; // test re-schedule
		//var uTarget = 900; // test re-schedule
		var uRem = 0;
	
		// NetSuite trx
		_failurePoint = 'iterating through reconciliation state';
		var glSRecs = '';
		// search for matched trx && keep searching until results is null
		while ((glSRecs !== null) && (!bAbort)) {
			var glSF = [// new nlobjSearchFilter('custrecord_nbsabr_rs_trndate', null, 'within', stStartDate, stStatementDate),
			             new nlobjSearchFilter('custrecord_nbsabr_rs_trndate', null, 'onorbefore', stStatementDate),
			             new nlobjSearchFilter('custrecord_nbsabr_rs_reconacc', null, 'is', accountId, null)];
			
			glSRecs = nlapiSearchRecord('customrecord_nbsabr_reconciliationstate', 'customsearch_nbsabr_reconstate_matched', glSF, null);

			var trxId = null;
			for ( var i = 0; glSRecs !== null && i < glSRecs.length && !bAbort; i += 1) {
				trxId = glSRecs[i].getId();
				lastTrxId = trxId;
												
				// update record with reconciled statement id
				_failurePoint = 'submit reconciliation state internalid: '+trxId;
				var FNs = ['custrecord_nbsabr_rs_reconstmnt', 'custrecord_nbsabr_rs_status','custrecord_nbsabr_rs_datereconciled'];
				var FVs = [SHId,nbsABR.CL.STATUS.RECONCILED,nlapiDateToString(new Date())];
				nlapiSubmitField('customrecord_nbsabr_reconciliationstate', trxId, FNs,FVs, false);
				
				nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, 'custrecord_bgpreccount', l_RecordCount, false);
				++l_RecordCount; // increment overall count of records

				/* check governance limits - if approaching limit, set bAbort */
				uRem = ctx.getRemainingUsage();
				if (uRem <= uTarget) {
					bAbort = true;
					ncBGP_WriteToLog(procId, '', l_RecordCount + ' GL records processed...rescheduling', 'Message');
				}
			}
		}

		// reconcile Bank trx
		_failurePoint = 'iterating through bank statement transactions';

		var bslSRecs = '';

		while (bslSRecs != null && !bAbort) {
			var bslSF = [ new nlobjSearchFilter('custrecord_bsl_date', null, 'within', stStartDate, stStatementDate),
					new nlobjSearchFilter('custrecord_bsl_reconaccount', null, 'is', accountId, null),
					new nlobjSearchFilter('custrecord_bsl_matchnumber', null, 'isnotempty', null, null),
					new nlobjSearchFilter('custrecord_bsl_reconciledstatement', null, 'is', '@NONE@', null) ];
			//retrive bank records with a match number
			bslSRecs = nlapiSearchRecord('customrecord_nbsabr_bankstatementline', 'customsearch_nbsabr_bankstatementtrx', bslSF, null);

			var bslId = null;
			for ( var i = 0; bslSRecs != null && i < bslSRecs.length && !bAbort; i += 1) {
				bslId = bslSRecs[i].getId();
				lastBSLId = bslId;
				nlapiSubmitField('customrecord_nbsabr_bankstatementline', bslId, 'custrecord_bsl_reconciledstatement', SHId, false);

				// check governance limits - if approaching limit, set bAbort
				uRem = ctx.getRemainingUsage();

				if (uRem <= uTarget) {
					bAbort = true;
					ncBGP_WriteToLog(procId, '', i + ' bank records processed...rescheduling ', 'Message');
				}
			}
		}

		_failurePoint = 'Handle exit condition and reschedule';
		if (bAbort) {
		//reached here due to governance abort - update Process record with new values and resume where we left off
			 
			var fNames = [];
			fNames[0] = 'custrecord_bgpstatedefn';
			fNames[1] = 'custrecord_bgpprocstate';
			fNames[2] = 'custrecord_bgpreccount';
			var fValues = [];
			fValues[0] = 'StatementHistoryId,StartDate,LastGLId,LastBSLId,AccountId';
			fValues[1] = SHId + ',' + ncEncodeDate(dtStartDate) + ',' + lastTrxId + ',' + lastBSLId+','+accountId;
			fValues[2] = l_RecordCount.toString();

			var Activity = rProcessInfo.getFieldValue('custrecord_bgpactivitytype');
			if (Activity === null)
				Activity = '';
			switch (Activity.toString()) {
			case '1': // this was a direct call, so switch to custom schedule
				fNames[fNames.length] = 'custrecord_processactivitytype';
				fValues[fValues.length] = '2';
				break;
			case '2': // this was custom schedule, so revert to regular
				// scheduling
				fNames[fNames.length] = 'custrecord_processactivitytype';
				fValues[fValues.length] = '3';
				break;
			default:
				// nothing to do - remain as current
			}
			if (stStatementDate === null)
				stStatementDate = '';
			if (endingBalance === null)
				endingBalance = '';
			
			// update reconcile account with last statement date and balance
			var fldNames = ['custrecord_accsetup_laststmntdate','custrecord_accsetup_laststmntbalance'];
			var fldValues = [stStatementDate.toString(),endingBalance.toString()];
			nlapiSubmitField('customrecord_nbsabr_accountsetup', accountId, fldNames, fldValues, false);
			// submit process instance record
			nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, fNames, fValues, false);
			// log activity
			ncBGP_WriteToLog(procId, '', 'Processing limit reached, re-scheduling', 'Message');

			if ((requestURL !== undefined) && (requestURL !== null)) // called directly so invoke background processing to continue
			{
				_failurePoint = 'Debug: Begin background processing';
				 var scriptParams = []; 
				 scriptParams[ncConst.BGP_FunctionNameParam] = 'nbsABR_ReconcileBG'; 
				 scriptParams['QNmbr'] = l_QNmbr; 

				 /*
				 // only administrators can run scheduled scripts. 
				 // wrap schedule script function in suitelet so call to nlapiScheduleScript can be made by non-administrator
				 // l_msgtext = nlapiScheduleScript(ncConst.BGP_StartupScriptId,ncConst.BGP_StartupDeployId,scriptParams); 
				_failurePoint = 'Debug: calling nlapiResolveURL()';
				 var BGPscriptURL = nlapiResolveURL('SUITELET','customscript_nbsabr_bgp_starter','customdeploy_nbsabr_bgp_starter',true); 
				_failurePoint = 'Debug: calling nlapiRequestURL()';
				nlapiLogExecution('debug', 'background startup url', BGPscriptURL);
				 var BGPscriptResp = nlapiRequestURL(BGPscriptURL, null, scriptParams ); 
				 // params now passed as custom headers 
				_failurePoint = 'Debug: Begin background processing';
				 l_msgtext = BGPscriptResp.getBody(); 
				 if( l_msgtext == null ){
					 l_msgtext = 'Script or deployment invalid (inst:1)'; 
				 }				
				 else{
					 l_msgtext = 'Instance One: '+l_msgtext;
				 }
				*/
				 
				var l_msgtext = nbsABR_InvokeBackgroundProcessing(requestURL, sessionId, scriptParams);
				ncBGP_WriteToLog(procId, '', 'Rescheduling...' + l_msgtext.slice(0,275), 'Message'); // 6u
			}
		} else {
			_failurePoint = 'Handle completion';

			// really finished - update process control record for completion
			fNames = [];
			fNames[0] = 'custrecord_bgpstatedefn';
			fNames[1] = 'custrecord_bgpprocstate';
			fNames[2] = 'custrecord_bgpreccount';
			fNames[3] = 'custrecord_bgpprocstatus';
			fNames[4] = 'custrecord_bgpactivitytype';
			fValues = [];
			fValues[0] = '';
			fValues[1] = '';
			fValues[2] = l_RecordCount.toString();
			fValues[3] = '2'; // status 2 = completed
			fValues[4] = '3'; // activity type 3 = planned schedule

			_failurePoint = 'Updating records prior to completion';

			nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, fNames, fValues, false);
			// log activity
			ncBGP_WriteToLog(procId, '', 'Reconciliation complete', 'Message'); // 30
		}
	} catch (GE) {
		if (GE instanceof nlobjError)
			msg = GE.getCode() + '\n' + GE.getDetails();
		else
			msg = GE.toString();

		nlapiLogExecution('Error', 'Unhandled Exception', msg);
		nlapiLogExecution('Error', 'Unhandled Exception', GE.description);
		nlapiLogExecution('debug', 'Failure Point', _failurePoint);

		// failed - update process control record for error
		fNames = [];
		fNames[0] = 'custrecord_bgpprocmsg';
		fNames[1] = 'custrecord_bgpprocstatus';
		fNames[2] = 'custrecord_bgpactivitytype';
		fValues = [];
		fValues[0] = msg;
		fValues[1] = '4'; // status 4 = failed
		fValues[2] = '3'; // activity type 3 = planned schedule

		nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, fNames, fValues, false);
		// log activity
		ncBGP_WriteToLog(procId, '', 'Reconciliation:' + msg, 'Error');
	}
}

/*
 * ncBGP_WriteToLog - utility function to write to the Background Process Manager log table
 * 
 * This function will create a new NC Process Log record using the details provided
 * 
 * Parameters: ProcessId - the id of the current process record RecordRef - a reference for the current record being processed or which the message relates to
 * MessageText - the message text to be written to the log MessageType - the type of message, 'Error', 'Warning' or 'Message'
 */
/*
 * ncBGP_WriteToLog - create a background process log record for the current process instance Parameters: ProcessInstanceId - record id for parent record
 * (process instance) RecordRef - current record description/name MessageText - message to be logged MessageType - type of message to be logged (string: Error,
 * Warning or Message)
 */
function ncBGP_WriteToLog(ProcessInstanceId, RecordRef, MessageText, MessageType) {
	var l_MsgType;
	switch (MessageType) {
	case 'Error':
		l_MsgType = 1;
		break;

	case 'Warning':
		l_MsgType = 2;
		break;

	case 'Message':
	default:
		l_MsgType = 3;
	}

	var LogRec = nlapiCreateRecord(ncConst.BGP_ProcessLog);
	LogRec.setFieldValue('custrecord_bgpprocinstance', ProcessInstanceId);
	LogRec.setFieldValue('custrecord_bgprecordname', RecordRef);
	LogRec.setFieldValue('custrecord_bgplogtype', l_MsgType);
	LogRec.setFieldValue('custrecord_bgplogmsg', MessageText);
	nlapiSubmitRecord(LogRec, false);
}

/**
 * nbsABR_ImportedStringToFloat - uses supplied formatting to convert a string to a numeric
 * 
 * @param {String}
 *            format - format to be applied, e.g. 0v00
 * @param {String}
 *            stAmount - string amount read from import file
 * @returns {Number} the converted amount
 */
function nbsABR_ImportedStringToFloat(format, stAmount) {
	
	var retAmtStr = stAmount.replace(/[^0-9\-.]/g, ''); // if decimal point is ",", use 0v00 as format option
	var retAmt = ncParseFloatNV(retAmtStr, 0.0); // initially just parse
	//var retAmt = ncParseFloatNV(stAmount, 0.0); // initially just parse

	if ((format === null) || (format == '')) {
		return retAmt;
	}

	var virtualDP = format.lastIndexOf('v');
	if (virtualDP > -1) {
		var decPL = format.length - 1 - virtualDP;
		var factor = Math.pow(10, decPL);
		retAmt /= factor;
	}

	return retAmt;
}

/**
 * Returns a date object by appling a format to a date string
 * 
 * @param (string)
 *            format used in import file e.g. dd/mm/yyyy
 * @param (string)
 *            date from import file
 * 
 * @return (object) the date
 */
function nbsABR_ImportedStringToDate(format, stdate) {
	if (isStringEmpty(stdate)) {
		return new Date();
	}

	var l_stdate = stdate.replace(/\s/g, '');
	// clean up date & add leading zeros if required
	if (l_stdate.indexOf('/') == 1) {
		l_stdate = '0' + l_stdate;
	}
	if (l_stdate.lastIndexOf('/') == 4) {
		var stCapture = /\/(\d+)\//g;
		l_stdate = l_stdate.replace(stCapture, '/0' + '$1/');
	}
	// nlapiLogExecution('debug','date and format',l_stdate + ' as ' + format);
	
	var dtDate = new Date('2001', '0', '0');
	var dd;
	var mm;
	var yy;
	var yyyy;
	var day;

	if (format.indexOf('DDD') != -1) {
		var idx = format.indexOf('DDD');
		day = l_stdate.slice(idx, 3);
		dtDate.setDate(day);
	}
	if (format.indexOf('dd') != -1) {
		var idx = format.indexOf('dd');
		dd = l_stdate.slice(idx, idx + 2);
		dtDate.setDate(dd);
	}
	if (format.indexOf('mm') != -1) {
		var idx = format.indexOf('mm');
		mm = l_stdate.slice(idx, idx + 2);
		dtDate.setMonth(mm - 1);
	}
	if (format.indexOf('yyyy') != -1) {
		var idx = format.indexOf('yyyy');
		yyyy = l_stdate.slice(idx, idx + 4);
		dtDate.setFullYear(yyyy);
	} 
	else if (format.indexOf('yy') != -1) {
		var idx = format.indexOf('yy');
		yy = l_stdate.slice(format.indexOf('yy'), idx + 2);
		// assume this century!
		yy = '20' + yy;
		dtDate.setFullYear(yy);
	}
	if (format.indexOf('MMM') != -1) {
		var idx = format.indexOf('MMM');
		mm = toMonthNumber(l_stdate.slice(idx, idx + 3));
		dtDate.setMonth(mm);
	}
	return dtDate;
}

/**
 * Returns the month as a number (from 0 to 11) given the month abbreviation.
 * 
 * @param (string)
 *            stMonth the month abbreviation
 * @return (string) month number
 */
function toMonthNumber(stMonth) {
	switch (stMonth.toUpperCase()) {
	case 'JAN':
		return '00';
		break;
	case 'FEB':
		return '01';
		break;
	case 'MAR':
		return '02';
		break;
	case 'APR':
		return '03';
		break;
	case 'MAY':
		return '04';
		break;
	case 'JUN':
		return '05';
		break;
	case 'JUL':
		return '06';
		break;
	case 'AUG':
		return '07';
		break;
	case 'SEP':
		return '08';
		break;
	case 'OCT':
		return '09';
		break;
	case 'NOV':
		return '10';
		break;
	case 'DEC':
		return '11';
		break;
	default:
	}
}

/**
 * The function takes a CSV string (one line) as parameter and returns an array of strings. Comma is assumed as field separator Double quotes are assumed as the
 * quote character
 * 
 * @param {string}
 *            stText - comma delimited string
 * @param {string}
 *            fieldSeparator (optional) - separator to use, defaults to comma
 * @return (array) arrFieldValues
 */
function parseCSV(stText, fieldSeparator) {
	var l_FS = ','; // field separator
	var l_pos;
	var l_real_pos;
	var i;
	var l_tmp;
	var l_qc;
	var l_end;
	var arrFieldValues = [];
	// var stReturn = '';
	var FieldValue;

	if ((fieldSeparator !== undefined) && (fieldSeparator !== null) && (fieldSeparator != ''))
		l_FS = fieldSeparator;

	if (stText.length == 0) {
		return '';
	} else {
		while (stText.length != 0) {
			FieldValue = "";

			if ((stText[0].toString() == "\"") || (stText[0].toString() == "'")) {
				l_qc = stText[0]; // store what type of quote character it is
				l_end = false;
				l_tmp = stText.slice(1);
				l_real_pos = 1;
				while (!l_end) {
					l_pos = l_tmp.indexOf(l_qc);
					if (l_pos > -1) {
						if ((l_tmp.length - l_pos <= 1) || (l_tmp.slice(l_pos, 2) != (l_qc.toString() + l_qc.toString()))) {
							l_end = true;
							l_tmp = l_tmp.slice(l_pos + 1);
							l_real_pos = l_real_pos + l_pos;
						} else {
							l_real_pos = l_real_pos + l_pos + 2;
							l_tmp = l_tmp.slice(l_pos + 2);
						}
					} else {
						// no closing quote!
						l_real_pos = 0;
						l_end = true;
					}
				}
				if (l_real_pos > 0) {
					// get contents, excluding Double quotes
					// 14/02/02, Fix for """" was only returning " now returns
					// "" correctly
					i = 1;
					while (i <= l_real_pos - 1) {
						if ((stText[i] == l_qc) && (stText[i + 1] == l_qc)) {
							i++;
						}
						FieldValue = FieldValue + stText[i];
						i++;
					}

					// find the next field separator
					l_pos = l_tmp.indexOf(l_FS);
					l_real_pos = l_real_pos + l_pos;

					// take this field off the front of the stText line
					stText = stText.slice(l_real_pos + 2);
				} else {
					// return nothing, and don't change the stText line
					// PJB: but if we don't change the line, we never finish, just keep re-processing the same unterminated field forever!
					// so instead, return the rest of the line and clear stText, so we finish!
					FieldValue = stText;
					stText = '';
				}
				// remove any stray ':' as used to delimit fields process instance
				FieldValue = FieldValue.replace(/|/g, '');
				arrFieldValues.push(FieldValue);
			} else {
				l_pos = stText.indexOf(l_FS);
				if (l_pos == -1) {
					FieldValue = stText;
					stText = "";
				} else {
					FieldValue = stText.slice(0, l_pos);
					stText = stText.slice(l_pos + 1);
				}
				// remove any stray ':' as used to delimit fields process instance
				// FieldValue = FieldValue.replace(/|/g,'');
				arrFieldValues.push(FieldValue);
			}

		}// while
	}
	// return arrFieldValues.join('|');
	return arrFieldValues;

}

/**
 * nbsABR_DeleteReconciliationBG - function is a background process to delete a reconciliation.
 * 
 * @param (string) Process Id internal id of current process record, allowing this script to be invoked directly. 
 * 				   If this parameter is null (e.g. when called from a schedule), the custscriptprocessid script parameter will be used
 * 
 * @return no direct return parameters - all information is passed back by updating the process instance record
 * @author C Shaw
 * @version 1.0
 */
function nbsABR_DeleteReconciliationBG(ProcessId, requestURL, sessionId) {
	var _failurePoint = '';
	// var _timestamp = (new Date()).getTime();
	var _timelimit = 600000;
	var procId = null;
	// var show = true;

	try {
		// retrieve script parameters --> process id
		_failurePoint = 'Retrieve script parameters';

		var ctx = nlapiGetContext();
		procId = ctx.getSetting('SCRIPT', ncConst.BGP_ProcInstIdParam);
	
		if ((ProcessId !== undefined) && (ProcessId !== null)) {
			procId = ProcessId; // called directly, so use direct parameter not context setting
			_timelimit = 60000; // because direct, only 60 seconds not 600 seconds
		}

		_timelimit -= 30000; // deduct 30 seconds to give margin of error,
		// time to tidy up and quit, etc. (15 seconds was too short, it STILL failed sometimes)

		if (procId == null)
			return; // nothing to do - no process record to determine status or log events against

		/* retrieve process record --> process parameters */
		_failurePoint = 'Retrieve process record';

		var rProcessInfo = nlapiLoadRecord(ncConst.BGP_ProcessInstance, procId);
		if (rProcessInfo.getFieldValue('custrecord_bgpprocstatus') != '1')
			return; // nothing to do

		var l_RecordCount = ncParseIntNV(rProcessInfo.getFieldValue('custrecord_bgpreccount'), 0);
		var l_QNmbr = rProcessInfo.getFieldValue('custrecord_bgpscrptqnmbr');
		if (isStringEmpty(l_QNmbr))
			l_QNmbr = '1';

		/* retrieve list for processing, and current status info */
		var tmpStr = rProcessInfo.getFieldValue('custrecord_bgpstatedefn');
		if (tmpStr == null)
			tmpStr = "";
		var pNames = tmpStr.split(',');
		tmpStr = rProcessInfo.getFieldValue('custrecord_bgpprocstate');
		if (tmpStr == null)
			tmpStr = "";
		var pValues = tmpStr.split(',');
		var reconId = null;
		var reconAcctId = null;

		if (pNames.length == pValues.length) {
			for ( var pN = 0; pN < pNames.length; ++pN) {
				switch (pNames[pN]) {
				case 'ReconciliationId':
					reconId = pValues[pN];
					break;
				case 'ReconAcctId':
					reconAcctId = pValues[pN];
					break;

				default:
					// do nothing
				}
			}
		} else {
			// all gone wrong - gracefully abort (and log values?)
			ncLogExecution('error', 'nbsABR_ReconcileBG', 'parameter values blank, aborting');

			fNames = new Array();
			fNames[0] = 'custrecord_bgpprocmsg';
			fNames[1] = 'custrecord_bgpprocstatus';
			fNames[2] = 'custrecord_bgpactivitytype';
			fValues = new Array();
			fValues[0] = 'parameter values blank, aborting';
			fValues[1] = '4'; // status 4 = failed
			fValues[2] = '3'; // activity type 3 = planned schedule

			nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, fNames, fValues, false);

			return;
		}
		var bAbort = false; // flag to indicate we need to quit (governance limits approaching)
	
		// Determine maximum units per iteration, so you can test if enough remaining to go round again
		var uTarget = 100; // adjust this according to iteration cost
		// var uTarget = 9950; // test re-schedule
		var uRem = 0;
		// var tUsed = 0;

		_failurePoint = 'iterating reconciliation state';
		var glSRecs = '';

		while (glSRecs != null && !bAbort) {
			var glSF = [ new nlobjSearchFilter('custrecord_nbsabr_rs_reconstmnt', null, 'is', reconId, null),
			             new nlobjSearchFilter('isinactive', null, 'is', 'F', null) ];
			glSRecs = nlapiSearchRecord('customrecord_nbsabr_reconciliationstate', null, glSF, null);

			for ( var i = 0; glSRecs != null && i < glSRecs.length && !bAbort; i += 1) {
				var trxId = glSRecs[i].getId();
								
				_failurePoint = 'submit trx id = ' + trxId;
				var fldNames = ['custrecord_nbsabr_rs_reconstmnt','custrecord_nbsabr_rs_status','custrecord_nbsabr_rs_datereconciled'];
				var fldValues = ['',nbsABR.CL.STATUS.MATCHED,''];
				nlapiSubmitField('customrecord_nbsabr_reconciliationstate', trxId, fldNames, fldValues, false);

				++l_RecordCount; // increment overall count of records
				nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, 'custrecord_bgpreccount', l_RecordCount, false);

				// check governance limits - if approaching limit, set bAbort
				uRem = ctx.getRemainingUsage();

				if (uRem <= uTarget)
					bAbort = true;
			}
		}

		// clear reconciliation statement on bank transactions
		_failurePoint = 'iterating through bank statement transactions';
		var bslSRecs = '';

		while (bslSRecs != null && !bAbort) {
			var bslSF = [ new nlobjSearchFilter('custrecord_bsl_reconciledstatement', null, 'is', reconId, null) ];
			bslSRecs = nlapiSearchRecord('customrecord_nbsabr_bankstatementline', null, bslSF, null);

			for ( var i = 0; bslSRecs != null && i < bslSRecs.length && !bAbort; i += 1) {
				var bslId = bslSRecs[i].getId();
				var fNames = ['custrecord_bsl_reconciledstatement','custrecord_bsl_reconcileddate'];
				var fValues = ['',''];
				nlapiSubmitField('customrecord_nbsabr_bankstatementline', bslId, fNames, fValues, false);

				++l_RecordCount; // increment overall count of records
				nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, 'custrecord_bgpreccount', l_RecordCount, false);

				/* check governance limits - if approaching limit, set bAbort */
				uRem = ctx.getRemainingUsage();

				if (uRem <= uTarget)
					bAbort = true;
			}
		}

		// 4 u to delete
		if (!bAbort) {
			_failurePoint = 'delete reconciliation record';
			nlapiDeleteRecord('customrecord_nbsabr_statementhistory', reconId);
		}
		//get most recent statement date and update last statement date on reconcile account
		var strStmntDate = nbsABR_GetLastStatementDate(reconAcctId);
		nlapiSubmitField('customrecord_nbsabr_accountsetup',reconAcctId,'custrecord_accsetup_laststmntdate',strStmntDate);
		
		

		_failurePoint = 'Handle exit condition and reschedule';
		if (bAbort) {
			/*
			 * reached here due to governance abort - update Process record with new values and resume where we left off
			 */
			var fNames = [];
			fNames[0] = 'custrecord_bgpstatedefn';
			fNames[1] = 'custrecord_bgpprocstate';
			fNames[2] = 'custrecord_bgpreccount';
			var fValues = [];
			fValues[0] = 'ReconciliationId,ReconAcctId';
			fValues[1] = reconId+','+reconAcctId;
			fValues[2] = l_RecordCount.toString();

			var Activity = rProcessInfo.getFieldValue('custrecord_bgpactivitytype');
			if (Activity === null)
				Activity = '';
			switch (Activity.toString()) {
			case '1': // this was a direct call, so switch to custom schedule
				fNames[fNames.length] = 'custrecord_processactivitytype';
				fValues[fValues.length] = '2';
				break;
			case '2': // this was custom schedule, so revert to regular
				// scheduling
				fNames[fNames.length] = 'custrecord_processactivitytype';
				fValues[fValues.length] = '3';
				break;
			default:
				// nothing to do - remain as current
			}
			// submit process instance record
			nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, fNames, fValues, false);
			// log activity
			ncBGP_WriteToLog(procId, '', 'Processing limit reached, re-scheduling', 'Message');

			if ((requestURL !== undefined) && (requestURL !== null)) // called directly so invoke background processing to continue
			{
				
				 var scriptParams = []; 
				 scriptParams[ncConst.BGP_FunctionNameParam] = 'nbsABR_DeleteReconciliationBG'; 
				 scriptParams['QNmbr'] = l_QNmbr;
				 
				 /*
				 // only administrators can run scheduled scripts. 
				 // wrap schedule script function in suitelet so call to nlapiScheduleScript can be made by non-administrator 
				 // l_msgtext = nlapiScheduleScript(ncConst.BGP_StartupScriptId,ncConst.BGP_StartupDeployId,scriptParams);
				 var BGPscriptURL = nlapiResolveURL('SUITELET','customscript_nbsabr_bgp_starter','customdeploy_nbsabr_bgp_starter',true);
				 nlapiLogExecution('debug', 'BGPscriptURL', BGPscriptURL);
				 var BGPscriptResp = nlapiRequestURL(BGPscriptURL, null, scriptParams ); 
				 // params now passed as custom headers 
				 l_msgtext = BGPscriptResp.getBody();
				  
				 if( l_msgtext == null ) 
					 l_msgtext = 'Script or deployment invalid (inst:1)'; 
				 else 
					 l_msgtext = 'Instance One: '+l_msgtext;
				 */
				 
				var l_msgtext = nbsABR_InvokeBackgroundProcessing(requestURL, sessionId, scriptParams);
				ncBGP_WriteToLog(procId, '', 'Rescheduling...' + l_msgtext, 'Message'); // 6u

			}
		} else {
			_failurePoint = 'Handle completion';

			_failurePoint = 'Updating records prior to completion';

			// really finished - update process control record for completion
			fNames = [];
			fNames[0] = 'custrecord_bgpstatedefn';
			fNames[1] = 'custrecord_bgpprocstate';
			fNames[2] = 'custrecord_bgpreccount';
			fNames[3] = 'custrecord_bgpprocstatus';
			fNames[4] = 'custrecord_bgpactivitytype';
			fValues = [];
			fValues[0] = '';
			fValues[1] = '';
			fValues[2] = l_RecordCount.toString();
			fValues[3] = '2'; // status 2 = completed
			fValues[4] = '3'; // activity type 3 = planned schedule

			nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, fNames, fValues, false);
			// log activity
			ncBGP_WriteToLog(procId, '', 'Deletion complete', 'Message'); // 30
		}
	} catch (GE) {
		if (GE instanceof nlobjError)
			msg = GE.getCode() + '\n' + GE.getDetails();
		else
			msg = GE.toString();

		nlapiLogExecution('Error', 'Unhandled Exception', msg);
		nlapiLogExecution('debug', 'Failure Point', _failurePoint);

		// failed - update process control record for error
		fNames = [];
		fNames[0] = 'custrecord_bgpprocmsg';
		fNames[1] = 'custrecord_bgpprocstatus';
		fNames[2] = 'custrecord_bgpactivitytype';
		fValues = [];
		fValues[0] = msg;
		fValues[1] = '4'; // status 4 = failed
		fValues[2] = '3'; // activity type 3 = planned schedule

		nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, fNames, fValues, false);
		// log activity
		ncBGP_WriteToLog(procId, '', 'Delete Reconciliation:' + msg, 'Error');
	}
}
/**
 * This function is a background process to clear transactions previously reconciled by the standard NS reconciliation functionality or by an external manual
 * process.
 * 
 * @param (string)
 *            Process Id internal id of current process record, allowing this script to be invoked directly If this parameter is null (e.g. when called from a
 *            schedule), the custscriptprocessid script parameter will be used
 * 
 * @return no direct return parameters - all information is passed back by updating the process instance record
 * @author C Shaw
 * @version 1.0
 */
function nbsABR_CleardownBG(ProcessId, requestURL, sessionId) {
	var _failurePoint = '';
	// var _timestamp = (new Date()).getTime();
	var _timelimit = 600000;
	var procId = null;
	
	try {
		/* retrieve script parameters --> process id */
		_failurePoint = 'Retrieve script parameters';

		var ctx = nlapiGetContext();
		//var b_multiCurr = ctx.getFeature('MULTICURRENCY');
		procId = ctx.getSetting('SCRIPT', ncConst.BGP_ProcInstIdParam);

		if ((ProcessId !== undefined) && (ProcessId !== null)) {
			procId = ProcessId; // called directly, so use direct parameter not
			// context setting
			_timelimit = 60000; // because direct, only 60 seconds not 600
			// seconds
		}

		_timelimit -= 30000; // deduct 30 seconds to give margin of error,
		// time to tidy up and quit, etc. (15 seconds was too short, it STILL failed sometimes)

		if (procId == null)
			return; // nothing to do - no process record to determine status or log events against

		/* retrieve process record --> process parameters */
		_failurePoint = 'Retrieve process record';

		var rProcessInfo = nlapiLoadRecord(ncConst.BGP_ProcessInstance, procId);
		if (rProcessInfo.getFieldValue('custrecord_bgpprocstatus') != '1')
			return; // nothing to do

		var l_RecordCount = ncParseIntNV(rProcessInfo.getFieldValue('custrecord_bgpreccount'), 0);

		// get queue number for scheduled script
		var l_QNmbr = rProcessInfo.getFieldValue('custrecord_bgpscrptqnmbr');
		if (isStringEmpty(l_QNmbr))
			l_QNmbr = '1';

		/* retrieve list for processing, and current status info */
		var tmpStr = rProcessInfo.getFieldValue('custrecord_bgpstatedefn');
		if (tmpStr == null)
			tmpStr = "";
		var pNames = tmpStr.split(',');
		tmpStr = rProcessInfo.getFieldValue('custrecord_bgpprocstate');
		if (tmpStr == null)
			tmpStr = "";
		var pValues = tmpStr.split(',');
		var reconAccId = ''; //ABR Reconcile Account
		var targetAccId = '';// ABR Target Account
		var nsAccId = ''; // NetSuite Account
		var stEncodedToDate = '';
		var stEncodedFromDate = '';
		var arrTrxIds = null;
		var arrTrxTypes = null;
		var arrStatus = null;
		var arrLines = null;
		var reconStmntId = null;
		var objNumOf = {intNew:0,intExisting:0,intUpdated:0,intExceptions:0};
		var lastProcessedId = 0;

		if (pNames.length == pValues.length) {
			for ( var pN = 0; pN < pNames.length; ++pN) {
				switch (pNames[pN]) {
				case 'ReconAccountId':
					reconAccId = pValues[pN];
					break;
				case 'TargetAccountId':
					targetAccId = pValues[pN];
					break;
				case 'NSAccountId':
					nsAccId = pValues[pN];
					break;
				case 'FromDate':
					stEncodedFromDate = pValues[pN];
					var dtFromDate = ncDecodeDate(stEncodedFromDate);
					stFromDate = nlapiDateToString(dtFromDate);
					break;
				case 'ToDate':
					stEncodedToDate = pValues[pN];
					var dtToDate = ncDecodeDate(stEncodedToDate);
					stToDate = nlapiDateToString(dtToDate);
					break;
				case 'TrxIds':
					var stTmp = pValues[pN];
					if (!isStringEmpty(stTmp))
						arrTrxIds = stTmp.split(':');
					// arrTrxIds = [67359,67359,67359,67359,67359,67359]
					break;
				case 'TrxTypes':
					var stTmp = pValues[pN];
					if (!isStringEmpty(stTmp))
						arrTrxTypes = stTmp.split(':');
					break;
				case 'StatementHistoryId':
					reconStmntId = pValues[pN];
					break;
				//case 'LastTrxId':
					//lastTrxId = parseInt(pValues[pN], 10);
					//break;
				case 'StatusCodes':
					var stTmp = pValues[pN];
					if (!isStringEmpty(stTmp))
						arrStatus = stTmp.split(':');
					break;
				case 'TrxLines':
					var stTmp = pValues[pN];
					if (!isStringEmpty(stTmp))
						arrLines = stTmp.split(':');
					break;

				default:
					// do nothing
				}
			}
		} else {
			// all gone wrong - gracefully abort (and log values?)
			nlapiLogExecution('error', 'nbsABR_CleardownBG', 'parameter values blank, aborting');

			fNames = new Array();
			fNames[0] = 'custrecord_bgpprocmsg';
			fNames[1] = 'custrecord_bgpprocstatus';
			fNames[2] = 'custrecord_bgpactivitytype';
			fValues = new Array();
			fValues[0] = 'parameter values blank, aborting';
			fValues[1] = '4'; // status 4 = failed
			fValues[2] = '3'; // activity type 3 = planned schedule

			nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, fNames, fValues, false);

			return;
		}
		var bAbort = false; // flag to indicate we need to quit (governance limits approaching)
		var k = 0; // index for current trx
		// Determine maximum units per iteration, so you can test if enough remaining to go round again
		var uTarget = 100; // adjust this according to iteration cost
		// var uTarget = 9950; // re-schedule target for testing
		var uRem = 0;
		
		// create account object
		var objAccount = nbsABR_CreateAccountObject(reconAccId);
		var b_IsBaseCurr = objAccount.isBaseCurrency;
		var amountFldId = 'amount';
		if((nbsABR.CONFIG.b_multiCurr) && (!b_IsBaseCurr))
		{
			amountFldId = 'fxamount';
		}
		
		/* PJB, 20/08/2013, handle currencies better because of multi-sub currency handling in searches */
		var scLocalCurrencyAmount = new nlobjSearchColumn('formulacurrency');
		if (nbsABR.CONFIG.b_multiCurr)
			scLocalCurrencyAmount.setFormula('ROUND({fxamount}*{exchangerate},2)');
		else
			scLocalCurrencyAmount.setFormula('{amount}');
		
		_failurePoint = 'iterating through transactions';	
		
		while (!bAbort && (arrTrxIds != null) && (k < arrTrxIds.length)) 
		{
			var l_trxId = arrTrxIds[k];
			lastProcessedId = l_trxId;
			var l_trxType = arrTrxTypes[k];
			var l_status = arrStatus[k];
			var l_line = arrLines[k];
			
			// search for original transaction
			// use search not load as search columns names are consistent across trn types
			var filters = [	new nlobjSearchFilter('internalid',null, 'is',l_trxId),
			               	new nlobjSearchFilter('account',null, 'anyof',nsAccId)];
			if(nbsCONFIG.reversalvoiding == 'F')
			{
				filters.push(new nlobjSearchFilter('voided',null,'is', 'F',null));
			}
			var columns = [	new nlobjSearchColumn(amountFldId),
			               	new nlobjSearchColumn('trandate'),
			               	new nlobjSearchColumn('linesequencenumber'),
			               	new nlobjSearchColumn('memo'),
			            	//new nlobjSearchColumn('subsidiary'),
			            	new nlobjSearchColumn('tranid'),
			            	new nlobjSearchColumn('entity'),
			            	new nlobjSearchColumn('type')];
			if(nbsABR.CONFIG.b_SubsEnabled){
				columns.push(new nlobjSearchColumn('subsidiary'));
			}
			columns.push(scLocalCurrencyAmount);	// PJB, 20/08/2013, fix currency amount handling
	 		//var srTrns = nlapiSearchRecord(l_trxType,null,filters,columns);
	 		var srTrns = nlapiSearchRecord('transaction',null,filters,columns);
	 			 		
	 		// could return multiple lines if journal
	 		for(var i=0; srTrns !== null && i<srTrns.length;i+=1)
	 		{
	 			// var strTrnAmt = srTrns[i].getValue(amountFldId);			// PJB, 20/08/2013, fix currency amount handling
	 			var strTrnAmt = srTrns[i].getValue(scLocalCurrencyAmount);	// PJB, 20/08/2013, fix currency amount handling
	 			var strTrnDate = srTrns[i].getValue('trandate');
	 			var intLine = srTrns[i].getValue('linesequencenumber');
	 			
	 			if(intLine != l_line){
	 				nlapiLogExecution('debug', 'type', srTrns[i].getRecordType());
	 				nlapiLogExecution('debug', 'intLine != l_line', (intLine != l_line));
	 			}
	 			//can't filter by line number so check have right line here
	 			if((srTrns[i].getRecordType() == 'journalentry') && (intLine != l_line)){
	 				continue;
	 			}
	 		
	 			// create object to encapsulate transaction values
	 			var objTrn = {
	 					internalid: l_trxId,
	 					amount: strTrnAmt,
	 					date: strTrnDate,
	 					reconacct: reconAccId,
	 					type: l_trxType,
	 					line: intLine
	 			};
	 			
	 			_failurePoint = 'running integrity check';
	 			nlapiLogExecution('debug', 'integrity check ', l_trxId+' ; '+intLine);
	 			var recRS = nbsABR_IntegrityCheck(objTrn,procId,objNumOf,null);
	 			
				// create Reconciliation Status record for each transaction if an existing one
	 			// not found by integrity check
	 			_failurePoint = 'creating Reconciliation Status record';
	 			if(recRS === null){
	 				
					recRS = nlapiCreateRecord('customrecord_nbsabr_reconciliationstate');
					recRS.setFieldValue('custrecord_nbsabr_rs_internalid', l_trxId);
					recRS.setFieldValue('custrecord_nbsabr_rs_trantype', nbsToTranTypeListValue(l_trxType));
					recRS.setFieldValue('custrecord_nbsabr_rs_status', l_status);
					recRS.setFieldValue('custrecord_nbsabr_rs_recordtype', '1'); //NetSuite Transaction
					recRS.setFieldValue('custrecord_nbsabr_rs_integritystatus', '1');//New
					recRS.setFieldValue('custrecord_nbsabr_rs_reconacc', reconAccId);
					recRS.setFieldValue('custrecord_nbsabr_rs_targetacc', targetAccId);
					if(l_status == '3'){
						recRS.setFieldValue('custrecord_nbsabr_rs_datereconciled', stToDate);
						recRS.setFieldValue('custrecord_nbsabr_rs_reconstmnt', reconStmntId);
					}
					if(amountFldId == 'fxamount'){
						recRS.setFieldValue('custrecord_nbsabr_rs_isfc', 'T');
					}
					//recRS.setFieldValue('custrecord_nbsabr_rs_amount', srTrns[0].getValue(amountFldId));
					recRS.setFieldValue('custrecord_nbsabr_rs_amount', strTrnAmt);
					//recRS.setFieldValue('custrecord_nbsabr_rs_date', srTrns[0].getValue('trandate'));
					recRS.setFieldValue('custrecord_nbsabr_rs_trndate', strTrnDate);
					recRS.setFieldValue('custrecord_nbsabr_rs_linenumber', srTrns[i].getValue('linesequencenumber'));
					recRS.setFieldValue('custrecord_nbsabr_rs_memo', srTrns[i].getValue('memo'));
					recRS.setFieldValue('custrecord_nbsabr_rs_subsidiary', srTrns[i].getValue('subsidiary'));
					recRS.setFieldValue('custrecord_nbsabr_rs_tranid', srTrns[i].getValue('tranid'));
					// recRS.setFieldValue('custrecord_nbsabr_rs_entity', srTrns[i].getValue('entity'));
					recRS.setFieldValue('custrecord_nbsabr_rs_entityname', srTrns[i].getText('entity'));
					recRS.setFieldValue('custrecord_nbsabr_rs_processid', procId);
	 			}
				
				try{
					_failurePoint = 'submitting Reconciliation Status record';
					nlapiSubmitRecord(recRS,true);
				}
				catch(GE){
					var msg = l_trxType + 'id= ' + l_trxId + ' - ';
					if (GE instanceof nlobjError)
						msg += GE.getCode() + '\n' + GE.getDetails();
					else
						msg += GE.toString();

					nlapiLogExecution('debug', 'Failure Point', _failurePoint);
					nlapiLogExecution('Error', 'Unhandled Exception', msg);
					
					throw msg;
				}
	 		}
			
			++l_RecordCount; // increment overall count of records
			k += 1;
			// update count on process instance
			nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, 'custrecord_bgpreccount', l_RecordCount, false);

			/* check governance limits - if approaching limit, set bAbort */
			uRem = ctx.getRemainingUsage();
			// nlapiLogExecution('debug','uRem',uRem);
			if (uRem <= uTarget)
				bAbort = true;
		}

		_failurePoint = 'Handle exit condition and reschedule';
		if (bAbort) {
			// reached here due to governance abort
			// update Process Instance record with new values and resume where we left off
			var arrTmp1 = arrTrxIds.slice(k);
			var arrTmp2 = arrTrxTypes.slice(k);
			var arrTmp3 = arrStatus.slice(k);
			var arrTmp4 = arrLines.slice(k);

			var fNames = [];
			fNames[0] = 'custrecord_bgpstatedefn';
			fNames[1] = 'custrecord_bgpprocstate';
			fNames[2] = 'custrecord_bgpreccount';
			var fValues = [];
			fValues[0] = 'ReconAccountId,TargetAccountId,NSAccountId,FromDate,ToDate,TrxIds,TrxTypes,StatementHistoryId,StatusCodes,TrxLines';
			fValues[1] = reconAccId + ','+targetAccId+','+nsAccId+',' + stEncodedFromDate + ',' + stEncodedToDate + ',' + arrTmp1.join(':') + ',' + arrTmp2.join(':') + ',' + reconStmntId + ','
					+ arrTmp3.join(':')+','+arrTmp4.join(':');
			fValues[2] = l_RecordCount.toString();

			var Activity = rProcessInfo.getFieldValue('custrecord_bgpactivitytype');
			if (Activity === null)
				Activity = '';
			switch (Activity.toString()) {
			case '1': // this was a direct call, so switch to custom schedule
				fNames[fNames.length] = 'custrecord_processactivitytype';
				fValues[fValues.length] = '2';
				break;
			case '2': // this was custom schedule, so revert to regular
				// scheduling
				fNames[fNames.length] = 'custrecord_processactivitytype';
				fValues[fValues.length] = '3';
				break;
			default:
				// nothing to do - remain as current
			}
			// submit process instance record
			nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, fNames, fValues, false);
			// log activity
			ncBGP_WriteToLog(procId, '', 'Processing limit reached, re-scheduling', 'Message');

			if ((requestURL !== undefined) && (requestURL !== null)) // called directly so invoke background processing to continue
			{
				var scriptParams = [];
				scriptParams[ncConst.BGP_FunctionNameParam] = 'nbsABR_CleardownBG';
				scriptParams['QNmbr'] = l_QNmbr;

				/*
				// only administrators can run scheduled scripts. 
				//wrap schedule script function in suitelet so call to nlapiScheduleScript can be made by non-administrator
				//var l_msgtext = nlapiScheduleScript(ncConst.BGP_StartupScriptId, ncConst.BGP_StartupDeployId + l_QNmbr, scriptParams);
				var BGPscriptURL = nlapiResolveURL('SUITELET','customscript_nbsabr_bgp_starter','customdeploy_nbsabr_bgp_starter', true);
				
				var BGPscriptResp = nlapiRequestURL( BGPscriptURL, null,scriptParams ); 
				
				// params now passed as custom headers
				l_msgtext = BGPscriptResp.getBody();
				// ---
				if (l_msgtext == null)
					l_msgtext = 'Script or deployment invalid (inst:1)';
				else
					l_msgtext = 'Instance One: ' + l_msgtext;
				*/

				var l_msgtext = nbsABR_InvokeBackgroundProcessing(requestURL, sessionId, scriptParams);
				nlapiLogExecution('debug', 'l_msgtext', l_msgtext);
			}
		} else {
			_failurePoint = 'Updating records prior to completion';

			// really finished - update process instance record for completion
			fNames = [];
			fNames[0] = 'custrecord_bgpreccount';
			fNames[1] = 'custrecord_bgpprocstatus';
			fNames[2] = 'custrecord_bgpactivitytype';
			// fNames[3] = 'custrecord_bgpstatedefn';
			// fNames[4] = 'custrecord_bgpprocstate';
			fValues = [];
			fValues[0] = l_RecordCount.toString();
			fValues[1] = '2'; // status 2 = completed
			fValues[2] = '3'; // activity type 3 = planned schedule
			// fValues[3] = '';
			// fValues[4] = '';

			nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, fNames, fValues, false);
			// update last processed id
			nlapiSubmitField('customrecord_nbsabr_statementhistory', reconStmntId, 'custrecord_sh_lastprocid', lastProcessedId, false);
			// log activity
			ncBGP_WriteToLog(procId, '', 'Cleardown complete', 'Message'); // 30
		}
	} catch (GE) {
		var msg = '';
		if (GE instanceof nlobjError)
			msg += GE.getCode() + '\n' + GE.getDetails();
		else
			msg += GE.toString();

		nlapiLogExecution('Error', 'Unhandled Exception', msg);
		nlapiLogExecution('debug', 'Failure Point', _failurePoint);

		// failed - update process control record for error
		fNames = [];
		fNames[0] = 'custrecord_bgpprocmsg';
		fNames[1] = 'custrecord_bgpprocstatus';
		fNames[2] = 'custrecord_bgpactivitytype';
		fValues = [];
		fValues[0] = msg;
		fValues[1] = '4'; // status 4 = failed
		fValues[2] = '3'; // activity type 3 = planned schedule

		nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, fNames, fValues, false);
		// log activity
		ncBGP_WriteToLog(procId, '', 'Cleardown:' + msg, 'Error');
	}
}
/**
 * nbsABR_PrepareReconciliationBG - background process to prepare transactions for reconciliation(import NetSuite transactions).
 * 
 * This function will:
 * 			Verify if a transaction is already extracted and not Reconciled.
 * 			Extract new transactions.
 * 
 * @param (string)
 *            Process Id internal id of current process record, allowing this script to be invoked directly If this parameter is null (e.g. when called from a
 *            schedule), the custscriptprocessid script parameter will be used
 * 
 * @return no direct return parameters - all information is passed back by updating the process instance record
 * @author C Shaw
 * @version 1.0
 * 
 * @deprecated no longer used, all processing now handled by nbsABR_ExtractTransactionsBG
 */
function nbsABR_PrepareReconciliationBG(ProcessId, requestURL, sessionId) {
	var _failurePoint = '';
	// var _timestamp = (new Date()).getTime();
	var _timelimit = 600000;
	var procId = null;
	
	try {
		/* retrieve script parameters --> process id */
		_failurePoint = 'Retrieve script parameters';

		var ctx = nlapiGetContext();
		//var b_multiCurr = ctx.getFeature('MULTICURRENCY');
		procId = ctx.getSetting('SCRIPT', ncConst.BGP_ProcInstIdParam);

		if ((ProcessId !== undefined) && (ProcessId !== null)) {
			procId = ProcessId; // called directly, so use direct parameter not context setting
			_timelimit = 60000; // because direct, only 60 seconds not 600 seconds
		}

		_timelimit -= 30000; // deduct 30 seconds to give margin of error,
		// time to tidy up and quit, etc. (15 seconds was too short, it STILL failed sometimes)

		if (procId == null)
			return; // nothing to do - no process record to determine status or log events against

		/* retrieve process record --> process parameters */
		_failurePoint = 'Retrieve process record';

		var rProcessInfo = nlapiLoadRecord(ncConst.BGP_ProcessInstance, procId);
		if (rProcessInfo.getFieldValue('custrecord_bgpprocstatus') != '1')
			return; // nothing to do

		var l_RecordCount = ncParseIntNV(rProcessInfo.getFieldValue('custrecord_bgpreccount'), 0);

		// get queue number for scheduled script
		var l_QNmbr = rProcessInfo.getFieldValue('custrecord_bgpscrptqnmbr');
		if (isStringEmpty(l_QNmbr))
			l_QNmbr = '1';

		/* retrieve list for processing, and current status info */
		var tmpStr = rProcessInfo.getFieldValue('custrecord_bgpstatedefn');
		if (tmpStr == null)
			tmpStr = "";
		var pNames = tmpStr.split('|');
		tmpStr = rProcessInfo.getFieldValue('custrecord_bgpprocstate');
		if (tmpStr == null)
			tmpStr = "";
		var pValues = tmpStr.split('|');
		
		var reconAccId = ''; //Reconcile Account id (previously Account Setup)
		var stEncodedCutOffDate = '';
		var stCutOffDate = '';
		var stEncodedToDate = '';
		var stToDate = '';
		var arrTrgtAcctIds = null;//Target Account ids
		var arrAcctIds = [];// Account ids
		var lastProcessedId = 0;//internalid of NetSuite transaction - used for rescheduling new transaction processing
		var lastRSId = 0;//internalid of recon state - used for rescheduling of integrity processing of existing recon state recs
		var arrExistRStateIds = [];//array to cache existing transaction internalids
		var arrRStates = [];//array to cache existing recon state onjects
		//var arrExistRStateStatus = [];//array to cache ABR Status
		var objNumOf = {"intNew":0,"intExisting":0,"intUpdated":0,"intExceptions":0};
		var k = 0;// index for current recon state record in the list
		
		if (pNames.length == pValues.length) {
			for ( var pN = 0; pN < pNames.length; ++pN) {
				switch (pNames[pN]) {
				case 'ReconAcct':
					reconAccId = pValues[pN];
					break;
				case 'CutOffDate':
					stEncodedCutOffDate = pValues[pN];
					var dtDate = ncDecodeDate(stEncodedCutOffDate);
					stCutOffDate = nlapiDateToString(dtDate);
					break;
				case 'ToDate':
					stEncodedToDate = pValues[pN];
					var dtDate = ncDecodeDate(stEncodedToDate);
					stToDate = nlapiDateToString(dtDate);
					break;
				case 'TrgtAccts':
					var stTmp = pValues[pN];
					if (!isStringEmpty(stTmp))
						arrTrgtAcctIds = stTmp.split(':');
					break;
				case 'LastProcessedId':
					lastProcessedId = parseInt(pValues[pN], 10);
					break;
				case 'k':
					k = parseInt(pValues[pN], 10);
					break;
				case 'NumberOf':
					var stTmp = pValues[pN];
					objNumOf = JSON.parse(stTmp);//convert JSON string into JavaScript object
					break;	
				
				default:
					// do nothing
				}
			}
		} else {
			// all gone wrong - gracefully abort (and log values?)
			nlapiLogExecution('error', 'nbsABR_PrepareReconciliationBG', 'parameter values blank, aborting');

			fNames = new Array();
			fNames[0] = 'custrecord_bgpprocmsg';
			fNames[1] = 'custrecord_bgpprocstatus';
			fNames[2] = 'custrecord_bgpactivitytype';
			fValues = new Array();
			fValues[0] = 'parameter values blank, aborting';
			fValues[1] = '4'; // status 4 = failed
			fValues[2] = '3'; // activity type 3 = planned schedule

			nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, fNames, fValues, false);

			return;
		}
		var bAbort = false; // flag to indicate we need to quit (governance limits approaching)
		//var k = 0; // index for current trx
		// Determine maximum units per iteration, so you can test if enough remaining to go round again
		var uTarget = 100; // adjust this according to iteration cost
		//var uTarget = 9900; // re-schedule target for testing
		var uRem = 0;
		
		// create account object
		var objReconAcct = nbsABR_CreateAccountObject(reconAccId);
		var b_IsBaseCurr = objReconAcct.isBaseCurrency;
		var amountFldId = 'amount';
		if((nbsABR.CONFIG.b_multiCurr) && (!b_IsBaseCurr))
		{
			amountFldId = 'fxamount';
		}
		arrAcctIds = objReconAcct.targetaccts;
		
		_failurePoint = 'cache existing reconciliation state records';	
		//search for existing reconciliation state records ordered by internalid ASC
		var sfRS = [new nlobjSearchFilter('custrecord_nbsabr_rs_reconacc',null, 'anyof',reconAccId),
		            new nlobjSearchFilter('custrecord_nbsabr_rs_trndate',null, 'after',stCutOffDate),
		            new nlobjSearchFilter('custrecord_nbsabr_rs_trndate',null, 'onorbefore',stToDate),
		            new nlobjSearchFilter('internalidnumber',null, 'greaterthan',lastRSId),
		          // new nlobjSearchFilter('custrecord_nbsabr_rs_recordtype',null, 'noneof',[nbsABR.CL.STATUS.OPENPOSTN]),
		            new nlobjSearchFilter('custrecord_nbsabr_rs_recordtype',null, 'noneof',['4']),
		            new nlobjSearchFilter('isinactive',null, 'is','F')];
		var scRS = [new nlobjSearchColumn('custrecord_nbsabr_rs_status'),
		            new nlobjSearchColumn('custrecord_nbsabr_rs_internalid'),// NS trn
		            new nlobjSearchColumn('custrecord_nbsabr_rs_trn_internalid'),//NS trn internalid
		            new nlobjSearchColumn('custrecord_nbsabr_rs_linenumber'),
		            new nlobjSearchColumn('internalid')];
		scRS[4].setSort();	// internalid
		debugLog(show,'create search','');
		var searchRS = nlapiCreateSearch( 'customrecord_nbsabr_reconciliationstate', sfRS, scRS );
		// cache existing reconciliation state records in array
		
		do{
			var resultSet = searchRS.runSearch(); //return 4000 records?
			
			resultSet.forEachResult(function(sr)
			{
				var recId = sr.getId();
				lastRSId = recId;
				// object to encapsulate RS values
	 			var objRS = {
	 					internalid:recId,
	 					//nsTrnId:sr.getValue('custrecord_nbsabr_rs_internalid'),
	 					nsTrnId:sr.getValue('custrecord_nbsabr_rs_trn_internalid'),
	 					line:sr.getValue('custrecord_nbsabr_rs_linenumber'),
	 					status:sr.getValue('custrecord_nbsabr_rs_status')
	 			};		
	 			arrRStates.push(objRS);
				arrExistRStateIds.push(objRS.nsTrnId);
				return true;
			});
			var searchFilters = searchRS.getFilters();

			for (var j=0;searchFilters !==null && j < searchFilters.length; j+=1) {
			
				if (searchFilters[j].getName() == 'internalidnumber') {
					searchFilters[j] = new nlobjSearchFilter('internalidnumber',null,'greaterthan',lastRSId);
				}
			}
			//set filters to search again
			searchRS.setFilters(searchFilters);
			
		}while (resultSet.getResults(0, 1000).length != 0);
		
		//set number of pre-existing records
		if(objNumOf.intExisting == 0){ //first time through
			objNumOf.intExisting = arrRStates.length;
		}
		debugLog(show,'number of existing extracts',arrRStates.length);
		debugLog(show,'arrTrgtAcctIds',arrTrgtAcctIds);
		//iterate thru array and
		//	1. search for associated NS trn
		//	2. if found, run integrity check
		//	3. else, delete recon state record
		
		while((!bAbort) && (k < arrRStates.length) && k < objNumOf.intExisting)
		{
			var currentTrnId = arrRStates[k].nsTrnId;
			var currentRSid = arrRStates[k].internalid;
			
			debugLog(show, 'processing extract... ',currentRSid);			
			_failurePoint = 'searching for existing transaction id: '+currentTrnId;	
			
			// search for the original NS transaction
			// use search not load as search columns names are consistent across trn types
			var filters = [	new nlobjSearchFilter('internalid',null, 'is',currentTrnId),
			               	new nlobjSearchFilter('account',null, 'anyof',arrTrgtAcctIds)];// need this filter to filter out other lines 
			if(nbsCONFIG.reversalvoiding == 'F'){
				filters.push(new nlobjSearchFilter('voided',null,'is', 'F',null));
			}
			var columns = [	new nlobjSearchColumn(amountFldId),
			               	new nlobjSearchColumn('trandate'),
			               	new nlobjSearchColumn('linesequencenumber'),
			               	new nlobjSearchColumn('memo'),
			            	new nlobjSearchColumn('tranid'),
			            	new nlobjSearchColumn('entity'),
			            	new nlobjSearchColumn('type')];
			if(nbsABR.CONFIG.b_SubsEnabled){
				columns.push(new nlobjSearchColumn('subsidiary'));
			}
	 		var srTrns = nlapiSearchRecord('transaction',null,filters,columns);
	 		
	 		if(srTrns !== null){ 		
	 		
		 		// if journal, multiple lines may be returned
				// can't filter by line number so iterate through results until find the right line
				var len = srTrns.length;
		 		for(var i=0; i<len;i+=1)
		 		{
		 			var strTrnAmt = srTrns[i].getValue(amountFldId);
		 			var strTrnDate = srTrns[i].getValue('trandate');
		 			var intTrnLine = srTrns[i].getValue('linesequencenumber');
		 			var trnType = srTrns[i].getRecordType();
		 			
		 			//var l_line = arrRStates[k].line;
		 
		 			if((trnType == 'journalentry') && (intTrnLine !=  arrRStates[k].line)){
		 				continue;
		 			}
		 		
		 			// object to encapsulate transaction values
		 			var objTrn = {
		 					internalid: currentTrnId,
		 					amount: strTrnAmt,
		 					date: strTrnDate,
		 					reconacct: reconAccId,
		 					type: trnType,
		 					line: intTrnLine
		 			};
		 			 			
		 			debugLog(show, 'running integrity check on NS trn', currentTrnId+' : '+intTrnLine);
		 			
		 			_failurePoint = 'integrity check on transaction id: '+currentTrnId+', extract id: '+arrRStates[k].internalid;	
		 			var recRS = nbsABR_IntegrityCheck(objTrn,procId,objNumOf,arrRStates[k].internalid);
		 			nlapiSubmitRecord(recRS);
		 		}
	 		}
	 		else{// can't find original NS transaction, so delete
	 			nlapiLogExecution('AUDIT', 'Deleting extract: '+currentRSid, 'NS internalid ='+currentTrnId);
				nlapiDeleteRecord('customrecord_nbsabr_reconciliationstate', currentRSid);
				
				objNumOf.intUpdated +=1;
			}
	 		
	 		l_RecordCount +=1;
 			k +=1;
	 			 		
	 		uRem = ctx.getRemainingUsage();
			//debugLog(show,'uRem',uRem);
			if(uRem <= uTarget){
				bAbort = true;
			}
		}
				
		_failurePoint = 'searching for new NetSuite transactions';	
		if(!bAbort){
				
			//use normal search as can't create much more than 1000 records in one script execution anyway
			var fils = [ new nlobjSearchFilter('internalidnumber', null, 'greaterthan', lastProcessedId, null),
			             new nlobjSearchFilter('account',null,'anyof', arrAcctIds,null),
			             new nlobjSearchFilter('trandate',null,'after', stCutOffDate),
			             new nlobjSearchFilter('trandate',null, 'onorbefore',stToDate),];
			// cols = [];
			if(nbsABR.CONFIG.reversalvoiding == 'F'){
				fils.push(new nlobjSearchFilter('voided',null,'is', 'F',null));
			}
			var srTrns = null;
			do{
				srTrns = nlapiSearchRecord('transaction','customsearch_nbsabr_newtrns_ordbyid',fils,null);
				
				for(var i =0; srTrns !== null && i < srTrns.length && !bAbort; i+=1)
				{
					var l_id = srTrns[i].getId();
					lastProcessedId = l_id;
					var l_type = srTrns[i].getRecordType();
					
					// create reconciliation state if non exists
					if(!inArray(l_id,arrExistRStateIds)){
							 				
						var recRS = nlapiCreateRecord('customrecord_nbsabr_reconciliationstate');
						recRS.setFieldValue('custrecord_nbsabr_rs_internalid', l_id);
						recRS.setFieldValue('custrecord_nbsabr_rs_trn_internalid', l_id);
						recRS.setFieldValue('custrecord_nbsabr_rs_trantype', nbsToTranTypeListValue(l_type));
						recRS.setFieldValue('custrecord_nbsabr_rs_status', ABR_CL.STATUS.UNMATCHED);
						recRS.setFieldValue('custrecord_nbsabr_rs_recordtype', ABR_CL.RECTYPE.NSTRANS); //NetSuite Transaction
						recRS.setFieldValue('custrecord_nbsabr_rs_integritystatus', ABR_CL.INTEGRITY.NEW);//New
						recRS.setFieldValue('custrecord_nbsabr_rs_reconacc', reconAccId);
						if(amountFldId == 'fxamount'){
							recRS.setFieldValue('custrecord_nbsabr_rs_isfc', 'T');
						}
						recRS.setFieldValue('custrecord_nbsabr_rs_targetacc', srTrns[i].getValue('account'));
						recRS.setFieldValue('custrecord_nbsabr_rs_amount', srTrns[i].getValue(amountFldId));
						recRS.setFieldValue('custrecord_nbsabr_rs_trndate', srTrns[i].getValue('trandate'));
						recRS.setFieldValue('custrecord_nbsabr_rs_linenumber', srTrns[i].getValue('linesequencenumber'));
						recRS.setFieldValue('custrecord_nbsabr_rs_memo', srTrns[i].getValue('memo'));
						recRS.setFieldValue('custrecord_nbsabr_rs_subsidiary', srTrns[i].getValue('subsidiary'));
						recRS.setFieldValue('custrecord_nbsabr_rs_tranid', srTrns[i].getValue('tranid'));
						// recRS.setFieldValue('custrecord_nbsabr_rs_entity', srTrns[i].getValue('entity'));
						recRS.setFieldValue('custrecord_nbsabr_rs_entityname', srTrns[i].getText('entity'));
						recRS.setFieldValue('custrecord_nbsabr_rs_processid', procId);
		 							
						try{
							_failurePoint = 'submitting Reconciliation Status record';
							nlapiSubmitRecord(recRS);
							
							debugLog(show, 'new extract for NS id', l_id);
					
							objNumOf.intNew +=1;
							++l_RecordCount; // increment overall count of records
							
							//check governance limits - if approaching limit, set bAbort 
							uRem = ctx.getRemainingUsage();
						//	nlapiLogExecution('debug','uRem processing',uRem);
							if (uRem <= uTarget)
								bAbort = true;
						}
						catch(GE){
							var msg = l_type + 'id= ' + l_id + ' - ';
							if (GE instanceof nlobjError)
								msg += GE.getCode() + '\n' + GE.getDetails();
							else
								msg += GE.toString();
		
							nlapiLogExecution('debug', 'Failure Point', _failurePoint);
							nlapiLogExecution('Error', 'Unhandled Exception', msg);
							
							throw msg;
						}
			 		}
				}
			
			// update count on process instance
			nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, 'custrecord_bgpreccount', l_RecordCount, false);

			//check governance limits - if approaching limit, set bAbort 
			//uRem = ctx.getRemainingUsage();
		//	nlapiLogExecution('debug','uRem processing',uRem);
			//if (uRem <= uTarget)
				//bAbort = true;
		
			fils[0] = new nlobjSearchFilter('internalidnumber', null, 'greaterthan', lastProcessedId, null);
			}while(srTrns !== null && !bAbort && lastProcessedId > 0)
		}

		_failurePoint = 'Handle exit condition and reschedule';
		if (bAbort) {
			// reached here due to governance abort
			// update Process Instance record with new values and resume where we left off
					
			var fNames = [];
			fNames[0] = 'custrecord_bgpstatedefn';
			fNames[1] = 'custrecord_bgpprocstate';
			fNames[2] = 'custrecord_bgpreccount';
			var fValues = [];
			fValues[0] = 'TrgtAccts|CutOffDate|ToDate|ReconAcct|LastProcessedId|NumberOf|k';
			fValues[1] = arrTrgtAcctIds.join(':')+'|'+stEncodedCutOffDate +'|'+stEncodedToDate+ '|'+reconAccId+'|' + lastProcessedId+'|'+JSON.stringify(objNumOf)+'|'+k;
			fValues[2] = l_RecordCount.toString();

			var Activity = rProcessInfo.getFieldValue('custrecord_bgpactivitytype');
			if (Activity === null)
				Activity = '';
			switch (Activity.toString()) {
			case '1': // this was a direct call, so switch to custom schedule
				fNames[fNames.length] = 'custrecord_processactivitytype';
				fValues[fValues.length] = '2';
				break;
			case '2': // this was custom schedule, so revert to regular scheduling
				fNames[fNames.length] = 'custrecord_processactivitytype';
				fValues[fValues.length] = '3';
				break;
			default:
				// nothing to do - remain as current
			}
			// submit process instance record
			nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, fNames, fValues, false);
			// log activity
			ncBGP_WriteToLog(procId, '', 'Processing limit reached, re-scheduling', 'Message');

			if ((ProcessId !== undefined) && (ProcessId !== null)) // called directly so invoke background processing to continue
			{
				var scriptParams = [];
				scriptParams[ncConst.BGP_FunctionNameParam] = 'nbsABR_PrepareReconciliationBG';
				scriptParams['QNmbr'] = l_QNmbr;

				/*
				// only administrators can run scheduled scripts. 
				//wrap schedule script function in suitelet so call to nlapiScheduleScript can be made by non-administrator
				//var l_msgtext = nlapiScheduleScript(ncConst.BGP_StartupScriptId, ncConst.BGP_StartupDeployId + l_QNmbr, scriptParams);
				var BGPscriptURL = nlapiResolveURL('SUITELET','customscript_nbsabr_bgp_starter','customdeploy_nbsabr_bgp_starter',true);
				var BGPscriptResp = nlapiRequestURL( BGPscriptURL, null,scriptParams ); 
				// params now passed as custom headers
				var l_msgtext = BGPscriptResp.getBody();
				// ---
				if (l_msgtext == null)
					l_msgtext = 'Script or deployment invalid (inst:1)';
				else
					l_msgtext = 'Instance One: ' + l_msgtext;
				*/

				var l_msgtext = nbsABR_InvokeBackgroundProcessing(requestURL, sessionId, scriptParams);
				nlapiLogExecution('debug', 'l_msgtext', l_msgtext);
			}
		} else {
			_failurePoint = 'Updating records prior to completion';

			//var stJSON = JSON.stringify(objNumOf);
			// really finished - update process instance record for completion
			fNames = [];
			fNames[0] = 'custrecord_bgpreccount';
			fNames[1] = 'custrecord_bgpprocstatus';
			fNames[2] = 'custrecord_bgpactivitytype';
			fNames[3] = 'custrecord_bgpstatedefn';
			fNames[4] = 'custrecord_bgpprocstate';
			fValues = [];
			fValues[0] = l_RecordCount.toString();
			fValues[1] = '2'; // status 2 = completed
			fValues[2] = '3'; // activity type 3 = planned schedule
			fValues[3] = 'TrgtAccts|CutOffDate|ToDate|ReconAcct|LastProcessedId|NumberOf';
			fValues[4] =  arrTrgtAcctIds.join(':') +'|'+stEncodedCutOffDate+'|'+stEncodedToDate+ '|'+reconAccId+'|' + lastProcessedId+'|'+JSON.stringify(objNumOf);

			nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, fNames, fValues, false);
			// update last extract date on reconcile account
			nlapiSubmitField('customrecord_nbsabr_accountsetup',reconAccId,'custrecord_accsetup_lastextractdate',stToDate);
			// log activity
			ncBGP_WriteToLog(procId, '', 'Extract of NetSuite transactions complete', 'Message'); // 30
		}
	} catch (GE) {
		var msg = '';
		if (GE instanceof nlobjError)
			msg += GE.getCode() + '\n' + GE.getDetails();
		else
			msg += GE.toString();

		nlapiLogExecution('Error', 'Unhandled Exception', msg);
		nlapiLogExecution('debug', 'Failure Point', _failurePoint);

		// failed - update process control record for error
		fNames = [];
		fNames[0] = 'custrecord_bgpprocmsg';
		fNames[1] = 'custrecord_bgpprocstatus';
		fNames[2] = 'custrecord_bgpactivitytype';
		fValues = [];
		fValues[0] = msg;
		fValues[1] = '4'; // status 4 = failed
		fValues[2] = '3'; // activity type 3 = planned schedule

		nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, fNames, fValues, false);
		// log activity
		ncBGP_WriteToLog(procId, '', 'Prepare Reconciliation:' + msg, 'Error');
	}
}
/**
 * nbsABR_ExtractTransactionsBG - background process to prepare NS transactions for reconciliation.
 * 
 * This function will:
 * 			Step 1 - 	Search for existing extracts (reconcilaition states) within a specified date range.
 * 			Step 2 - 	Run integrity check on extract against associated NS transaction.
 * 						Update amount and date if unreconciled.
 * 						Flag as exception if reconciled and amount is different.
 * 						If link to NS transaction is missing, assume NS transaction has been deleted and delete extract record.
 * 			Step 2 - 	Extract new transactions, i.e. NS transactions with no associated extract.
 * 
 * @param (string)
 *            Process Id internal id of current process record, allowing this script to be invoked directly If this parameter is null (e.g. when called from a
 *            schedule), the custscriptprocessid script parameter will be used
 * 
 * @return no direct return parameters - all information is passed back by updating the process instance record
 * @author C Shaw
 * @version 1.0
 */
function nbsABR_ExtractTransactionsBG(ProcessId) {
	debugLog(show,'ProcessId',ProcessId);
	var _failurePoint = '';
	// var _timestamp = (new Date()).getTime();
	var _timelimit = 600000;
	var procId = null;
	
	try {
		/* retrieve script parameters --> process id */
		_failurePoint = 'Retrieve script parameters';

		// var ctx = nlapiGetContext();
		//procId = ctx.getSetting('SCRIPT', ncConst.BGP_ProcInstIdParam);

		if (ProcessId != null) {
			procId = ProcessId; // called directly, so use direct parameter not context setting
			_timelimit = 60000; // because direct, only 60 seconds not 600 seconds
		}
		//procId = '3685';
		debugLog(show,'procId',procId);
		_timelimit -= 30000; // deduct 30 seconds to give margin of error,
		// time to tidy up and quit, etc. (15 seconds was too short, it STILL failed sometimes)

		if (procId == null)
			return; // nothing to do - no process record to determine status or log events against

		/* retrieve process record --> process parameters */
		_failurePoint = 'Retrieve process record';

		var rProcessInfo = nlapiLoadRecord(ncConst.BGP_ProcessInstance, procId);
		if (rProcessInfo.getFieldValue('custrecord_bgpprocstatus') != '1')//in progress
			return; // nothing to do

		var l_RecordCount = ncParseIntNV(rProcessInfo.getFieldValue('custrecord_bgpreccount'), 0);

		// get queue number for scheduled script
		var l_QNmbr = rProcessInfo.getFieldValue('custrecord_bgpscrptqnmbr');
		if (isStringEmpty(l_QNmbr))
			l_QNmbr = '1';

		/* retrieve list for processing, and current status info */
		var tmpStr = rProcessInfo.getFieldValue('custrecord_bgpstatedefn');
		if (tmpStr == null)
			tmpStr = "";
		var pNames = tmpStr.split('|');
		tmpStr = rProcessInfo.getFieldValue('custrecord_bgpprocstate');
		if (tmpStr == null)
			tmpStr = "";
		var pValues = tmpStr.split('|');
		
		var reconAccId = ''; //Reconcile Account id (previously Account Setup)
		var stEncodedCutOffDate = '';
		var stCutOffDate = '';
		var stEncodedToDate = '';
		var stToDate = '';
		var arrTrgtAcctIds = null;//Target Account ids
		var arrAcctIds = [];// Account ids
		var lastProcessedId = 0;//internalid of last processed NetSuite transaction - used for rescheduling new transaction processing
		var lastRSId = 0;//internalid of recon state - used for rescheduling of integrity processing of existing recon state recs
		var arrExistRStateIds = [];//array to cache existing transaction internalids
		var objExistRStateIds = {};	// object to cache existing transaction internalids
		var arrRStates = [];//array to cache existing recon state objects
		var objNumOf = {"intNew":0,"intExisting":0,"intUpdated":0,"intExceptions":0};
		var k = 0;// index for current recon state record in list
		
		if (pNames.length == pValues.length) {
			for ( var pN = 0; pN < pNames.length; ++pN) {
				switch (pNames[pN]) {
				case 'ReconAcct':
					reconAccId = pValues[pN];
					break;
				case 'CutOffDate':
					stEncodedCutOffDate = pValues[pN];
					var dtDate = ncDecodeDate(stEncodedCutOffDate);
					stCutOffDate = nlapiDateToString(dtDate);
					break;
				case 'ToDate':
					stEncodedToDate = pValues[pN];
					var dtDate = ncDecodeDate(stEncodedToDate);
					stToDate = nlapiDateToString(dtDate);
					break;
				case 'TrgtAccts':
					var stTmp = pValues[pN];
					if (!isStringEmpty(stTmp))
						arrTrgtAcctIds = stTmp.split(':');
					break;
				case 'LastProcessedId':
				//	lastProcessedId = parseInt(pValues[pN], 10);
					break;
				case 'k':
					k = parseInt(pValues[pN], 10);
					break;
			//	case 'NumberOf':
					//var stTmp = pValues[pN];
					//objNumOf = JSON.parse(stTmp);//convert JSON string into JavaScript object
				//	objNumOf = {"intNew":0,"intExisting":0,"intUpdated":0,"intExceptions":0};
				//	break;	
								
				default:
					// do nothing
				}
			}
		} else {
			// all gone wrong - gracefully abort (and log values?)
			nlapiLogExecution('error', 'nbsABR_PrepareReconciliationBG', 'parameter values blank, aborting');

			fNames = new Array();
			fNames[0] = 'custrecord_bgpprocmsg';
			fNames[1] = 'custrecord_bgpprocstatus';
			fNames[2] = 'custrecord_bgpactivitytype';
			fValues = new Array();
			fValues[0] = 'parameter values blank, aborting';
			fValues[1] = '4'; // status 4 = failed
			fValues[2] = '3'; // activity type 3 = planned schedule

			nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, fNames, fValues, false);

			return;
		}
		//var bAbort = false; // flag to indicate we need to quit (governance limits approaching)
		//var k = 0; // index for current trx
		// Determine maximum units per iteration, so you can test if enough remaining to go round again
		//var uTarget = 100; // adjust this according to iteration cost
		//var uTarget = 9900; // re-schedule target for testing
		//var uRem = 0;
		
		// create account object
		var objReconAcct = nbsABR_CreateAccountObject(reconAccId);
		var b_IsBaseCurr = objReconAcct.isBaseCurrency;
		var amountFldId = 'amount';
		if((nbsABR.CONFIG.b_multiCurr) && (!b_IsBaseCurr))
		{
			amountFldId = 'fxamount';
		}
		arrAcctIds = objReconAcct.targetaccts;
		
		/* PJB, 20/08/2013, handle currencies better because of multi-sub currency handling in searches */
		var scLocalCurrencyAmount = new nlobjSearchColumn('formulacurrency');
		var scLocalCurrAmtWithJoin = new nlobjSearchColumn('formulacurrency','custrecord_nbsabr_rs_internalid');
		if (nbsABR.CONFIG.b_multiCurr) {
			scLocalCurrencyAmount.setFormula('ROUND({fxamount}*{exchangerate},2)');
			scLocalCurrAmtWithJoin.setFormula('ROUND({custrecord_nbsabr_rs_internalid.fxamount}*{custrecord_nbsabr_rs_internalid.exchangerate},2)');
		} else {
			scLocalCurrencyAmount.setFormula('{amount}');
			scLocalCurrAmtWithJoin.setFormula('{custrecord_nbsabr_rs_internalid.amount}');
		}
		
		nlapiLogExecution('AUDIT', 'Searching for existing extracts', '');
		ncBGP_WriteToLog(procId, '', 'Searching for existing extracts', 'Message'); // 30
			
		_failurePoint = 'cache existing extracts';	
		//search for existing reconciliation state records ordered by internalid ASC
							
		var searchRS = nlapiLoadSearch( 'customrecord_nbsabr_reconciliationstate', 'customsearch_nbsabr_extract_transactions');
				
		searchRS.addFilter(new nlobjSearchFilter('custrecord_nbsabr_rs_reconacc',null, 'anyof',[reconAccId]));
		searchRS.addFilter(new nlobjSearchFilter('custrecord_nbsabr_rs_trndate',null, 'after',stCutOffDate));
		searchRS.addFilter(new nlobjSearchFilter('custrecord_nbsabr_rs_trndate',null, 'onorbefore',stToDate));
		searchRS.addFilter(new nlobjSearchFilter('internalidnumber',null, 'greaterthan',lastRSId));

		//var srchFilters = searchRS.getFilters();
		// cache existing reconciliation state records in array
		var resultSet = null;
		var ferCount = 0;
		var srchIncomplete = true;
		var maxIterations = 4000;	// must not iterate over more than 4000
		do {
			resultSet = searchRS.runSearch(); //returns ALL
			
			resultSet.forEachResult(
					function(sr) {
						ferCount++;
						var recId = sr.getId();
						lastRSId = recId;
						// object to encapsulate existing extract
			 			var objRS = {
			 					rsid:recId,
			 					reconacct:reconAccId,
			 					rsamt:sr.getValue('custrecord_nbsabr_rs_amount'),
			 					rsdate:sr.getValue('custrecord_nbsabr_rs_trndate'),
			 					rsline:sr.getValue('custrecord_nbsabr_rs_linenumber'),
			 					status:sr.getValue('custrecord_nbsabr_rs_status'),
			 					nstran:sr.getValue('custrecord_nbsabr_rs_internalid'),//list
			 					nsid:sr.getValue('custrecord_nbsabr_rs_trn_internalid'),//text
			 					nsamt:sr.getValue(scLocalCurrAmtWithJoin),	// sr.getValue(amountFldId,'custrecord_nbsabr_rs_internalid'),
			 					nsdate:sr.getValue('trandate','custrecord_nbsabr_rs_internalid'),
			 					nsline:sr.getValue('linesequencenumber','custrecord_nbsabr_rs_internalid'),
			 					
			 			};		
						objExistRStateIds[objRS.nsid] = arrRStates.length;	// store index of next element, by id
			 			arrRStates.push(objRS);
						arrExistRStateIds.push(objRS.nsid);
						return (ferCount < maxIterations);	// return false to abort iteration if reached max
					} );

			srchIncomplete = (ferCount >= maxIterations);
			
			if (srchIncomplete) {
				var searchFilters = searchRS.getFilters();
				for (var j=0;searchFilters !==null && j < searchFilters.length; j+=1) {
				
					if (searchFilters[j].getName() == 'internalidnumber') {
						searchFilters[j] = new nlobjSearchFilter('internalidnumber',null,'greaterthan',lastRSId);
					}
				}
				//set filters to search again
				searchRS.setFilters(searchFilters);
				// reset count too
				ferCount = 0;
			}
 			nbsABR_CheckGovernance(procId, true);	// force a yield here, to reset the script instruction count	
		} while (srchIncomplete); // (resultSet.getResults(0, 1).length != 0);
		
		//set number of pre-existing records
	//	if(objNumOf.intExisting == 0){ //first time through
			objNumOf.intExisting = arrRStates.length;
	//	}

	nlapiLogExecution('AUDIT', 'Running integrity check on extracts', objNumOf.intExisting);
	ncBGP_WriteToLog(procId, '', 'Running integrity check on extracts', 'Message'); // 30
	//iterate thru array and
	//	1. search for associated NS trn
	//	2. if found, run integrity check
	//	3. else, delete extract
	// currently this process iterates through the reconcile state objects and performs an individual transaction search for each one! 
	// performance wise not great especially as they could be multi-line journals.
	// batching the searches would make the code too complicated
	// however splitting the process into 2 steps; journals & transfers and all other transaction types would improve performance
	// as a joined search could be empolyed for all transaction types other than journals and transfers
	
	// pre-define filters and columns so not redefining every time through the loop!
	var sfTargetAccounts = new nlobjSearchFilter('account',null, 'anyof',arrTrgtAcctIds);
	var sfNotVoided = new nlobjSearchFilter('voided',null,'is', 'F',null);
	var srchCols = [new nlobjSearchColumn(amountFldId),
	               	new nlobjSearchColumn('trandate'),
	               	new nlobjSearchColumn('linesequencenumber'),
	               	new nlobjSearchColumn('memo'),
	            	new nlobjSearchColumn('tranid'),
	            	new nlobjSearchColumn('entity'),
	            	new nlobjSearchColumn('type')];
	if(nbsABR.CONFIG.b_SubsEnabled){
		srchCols.push(new nlobjSearchColumn('subsidiary'));
	}
	srchCols.push(scLocalCurrencyAmount);	// PJB, 20/08/2013, fix currency amount handling
	
	while( (k < arrRStates.length))
	{
		var nsTrnInternalid = arrRStates[k].nstran;
		var rsInternalid = arrRStates[k].rsid;
		var nsRecFound = false;
				
		if(!isStringEmpty(nsTrnInternalid)){
			// search for the original NS transaction
			// use search not load as search columns names are consistent across trn types
			var filters = [	new nlobjSearchFilter('internalid',null, 'is',nsTrnInternalid),
			               	sfTargetAccounts ];// need this filter to filter out other lines 
			if(nbsCONFIG.reversalvoiding == 'F'){
				filters.push(sfNotVoided);
			}
	 		var srTrns = nlapiSearchRecord('transaction',null,filters,srchCols);
	 		
	 		if((srTrns !== null) && (srTrns.length > 0)){
	 			
	 			//debugLog(show, 'running integrity check on NS trn', arrRStates[k].nstran+' : '+ arrRStates[k].rsline);
	 				 			
	 			//if journal, multiple lines may be returned	
				// can't filter by line number so iterate through results until find the right line
				var len = srTrns.length;
		 		for(var i=0; i<len;i+=1)
		 		{
		 			// var l_amt = srTrns[i].getValue(amountFldId);			// PJB, 20/08/2013, fix currency amount handling
		 			var l_amt = srTrns[i].getValue(scLocalCurrencyAmount);	// PJB, 20/08/2013, fix currency amount handling
		 			var l_date = srTrns[i].getValue('trandate');
		 			var l_line = srTrns[i].getValue('linesequencenumber');
		 			var l_type = srTrns[i].getRecordType();
		 							 
		 			if((l_type == 'journalentry') && (l_line !=  arrRStates[k].rsline)){
		 				continue;
		 			}
		 		
		 			nsRecFound = true;
		 			arrRStates[k].new_nsamt = l_amt;
		 			arrRStates[k].new_nsdate = l_date;
		 			arrRStates[k].new_nsline = l_line;
		 			arrRStates[k].trntype = l_type;			 			
	 			
		 			_failurePoint = 'integrity check on NS transaction id: '+nsTrnInternalid+', extract id: '+rsInternalid;	
		 			var recRS = nbsABR_RunIntegrityCheck(arrRStates[k],procId,objNumOf,rsInternalid);
		 			if(recRS !== null){
		 				nlapiSubmitRecord(recRS);
		 			}
		 		}
	 		}
		}
		if (!nsRecFound){
			//reference to NS tran is missing and must have been deleted, so delete this extract
 			_failurePoint = 'delete extract for missing NetSuite transaction';	
 			nlapiLogExecution('AUDIT', 'Deleting extract: ',rsInternalid);
 			
 			// TODO before deleting it, should we check match number and reconcile and clean up matched trns? Or at least log them?
 			
			nlapiDeleteRecord('customrecord_nbsabr_reconciliationstate', rsInternalid);
			
			objNumOf.intUpdated +=1;
		}
 		l_RecordCount +=1;
		k +=1;
 		
		//update count on process instance
		nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, 'custrecord_bgpreccount', l_RecordCount, false);
		
		nbsABR_CheckGovernance(procId);	// , (k%100)==0);	// force yield every 100 rows	
	}
	
	_failurePoint = 'searching for new NetSuite transactions';	
	nlapiLogExecution('AUDIT', 'Searching for new transactions', '');
	ncBGP_WriteToLog(procId, '', 'Searching for new transactions', 'Message'); // 30
	
		var fils = [ new nlobjSearchFilter('internalidnumber', null, 'greaterthan', lastProcessedId, null),
		             new nlobjSearchFilter('account',null,'anyof', arrAcctIds,null),
		             new nlobjSearchFilter('trandate',null,'after', stCutOffDate),
		             new nlobjSearchFilter('trandate',null, 'onorbefore',stToDate),];
		if(nbsABR.CONFIG.reversalvoiding == 'F'){
			fils.push(new nlobjSearchFilter('voided',null,'is', 'F',null));
		}
		var srTrns = null;
		do{
			srTrns = nlapiSearchRecord('transaction','customsearch_nbsabr_newtrns_ordbyid',fils,[scLocalCurrencyAmount]);	// PJB, 20/08/2013, fix currency amount handling
			
			for(var i =0; srTrns !== null && i < srTrns.length; i+=1)
			{
				var l_id = srTrns[i].getId();
				lastProcessedId = l_id;
				var l_type = srTrns[i].getRecordType();
				
				// create reconciliation state if non exists
				// if(!inArray(l_id,arrExistRStateIds)){
				if ((objExistRStateIds[l_id] === undefined)) {
						 				
					var recRS = nlapiCreateRecord('customrecord_nbsabr_reconciliationstate');
					recRS.setFieldValue('custrecord_nbsabr_rs_internalid', l_id);
					recRS.setFieldValue('custrecord_nbsabr_rs_trn_internalid', l_id);
					recRS.setFieldValue('custrecord_nbsabr_rs_trantype', nbsToTranTypeListValue(l_type));
					recRS.setFieldValue('custrecord_nbsabr_rs_status', ABR_CL.STATUS.UNMATCHED);
					recRS.setFieldValue('custrecord_nbsabr_rs_recordtype', ABR_CL.RECTYPE.NSTRANS); //NetSuite Transaction
					recRS.setFieldValue('custrecord_nbsabr_rs_integritystatus', ABR_CL.INTEGRITY.NEW);//New
					recRS.setFieldValue('custrecord_nbsabr_rs_reconacc', reconAccId);
					if(amountFldId == 'fxamount'){
						recRS.setFieldValue('custrecord_nbsabr_rs_isfc', 'T');
					}
					recRS.setFieldValue('custrecord_nbsabr_rs_targetacc', srTrns[i].getValue('account'));
					// recRS.setFieldValue('custrecord_nbsabr_rs_amount', srTrns[i].getValue(amountFldId));			// PJB, 20/08/2013, fix currency amount handling
					recRS.setFieldValue('custrecord_nbsabr_rs_amount', srTrns[i].getValue(scLocalCurrencyAmount));	// PJB, 20/08/2013, fix currency amount handling
					recRS.setFieldValue('custrecord_nbsabr_rs_trndate', srTrns[i].getValue('trandate'));
					recRS.setFieldValue('custrecord_nbsabr_rs_linenumber', srTrns[i].getValue('linesequencenumber'));
					recRS.setFieldValue('custrecord_nbsabr_rs_memo', srTrns[i].getValue('memo'));
					recRS.setFieldValue('custrecord_nbsabr_rs_subsidiary', srTrns[i].getValue('subsidiary'));
					recRS.setFieldValue('custrecord_nbsabr_rs_tranid', srTrns[i].getValue('tranid'));
					// recRS.setFieldValue('custrecord_nbsabr_rs_entity', srTrns[i].getValue('entity'));
					recRS.setFieldValue('custrecord_nbsabr_rs_entityname', srTrns[i].getText('entity'));
					recRS.setFieldValue('custrecord_nbsabr_rs_processid', procId);
	 							
					try{
						_failurePoint = 'submitting Reconciliation Status record';
						nlapiSubmitRecord(recRS);
										
						objNumOf.intNew +=1;
						++l_RecordCount; // increment overall count of records
						
						nbsABR_CheckGovernance(procId);	
						
					}
					catch(GE){
						var msg = l_type + 'id= ' + l_id + ' - ';
						if (GE instanceof nlobjError)
							msg += GE.getCode() + '\n' + GE.getDetails();
						else
							msg += GE.toString();
	
						nlapiLogExecution('debug', 'Failure Point', _failurePoint);
						nlapiLogExecution('Error', 'Unhandled Exception', msg);
						
						throw msg;
					}
		 		}
			}
		
			// update count on process instance
			nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, 'custrecord_bgpreccount', l_RecordCount, false);
		
			fils[0] = new nlobjSearchFilter('internalidnumber', null, 'greaterthan', lastProcessedId, null);
		}while(srTrns !== null && lastProcessedId > 0)
		
		_failurePoint = 'Updating records prior to completion';
		// really finished - update process instance record for completion
		
		fNames = [];
		fNames[0] = 'custrecord_bgpreccount';
		fNames[1] = 'custrecord_bgpprocstatus';
		fNames[2] = 'custrecord_bgpactivitytype';
		fNames[3] = 'custrecord_bgpstatedefn';
		fNames[4] = 'custrecord_bgpprocstate';
		fValues = [];
		fValues[0] = l_RecordCount.toString();
		fValues[1] = '2'; // status 2 = completed
		fValues[2] = '3'; // activity type 3 = planned schedule
		fValues[3] = 'TrgtAccts|CutOffDate|ToDate|ReconAcct|LastProcessedId|NumberOf';
		fValues[4] =  arrTrgtAcctIds.join(':') +'|'+stEncodedCutOffDate+'|'+stEncodedToDate+ '|'+reconAccId+'|' + lastProcessedId+'|'+JSON.stringify(objNumOf);

		nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, fNames, fValues, false);
		// update last extract date on reconcile account
		nlapiSubmitField('customrecord_nbsabr_accountsetup',reconAccId,'custrecord_accsetup_lastextractdate',stToDate);
		// log activity
		ncBGP_WriteToLog(procId, '', 'Extract complete', 'Message'); // 30
	
	} catch (GE) {
		var msg = '';
		if (GE instanceof nlobjError)
			msg += GE.getCode() + '\n' + GE.getDetails();
		else
			msg += GE.toString();

		nlapiLogExecution('Error', 'Unhandled Exception', msg);
		nlapiLogExecution('debug', 'Failure Point', _failurePoint);

		// failed - update process control record for error
		fNames = [];
		fNames[0] = 'custrecord_bgpprocmsg';
		fNames[1] = 'custrecord_bgpprocstatus';
		fNames[2] = 'custrecord_bgpactivitytype';
		fValues = [];
		fValues[0] = msg;
		fValues[1] = '4'; // status 4 = failed
		fValues[2] = '3'; // activity type 3 = planned schedule

		nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, fNames, fValues, false);
		// log activity
		ncBGP_WriteToLog(procId, '', 'Extract transactions:' + msg, 'Error');
	}
}

/** function nbsABR_RunIntegrityCheck - function to check the integrity of an extract/recon state against the original NS transaction
 * 
 * This function runs an integrity check on a NS transaction:
 * 		1. Is there an existing Reconciliation State?
 * 		2. If yes & unmatched - make changes
 * 		3. If yes & matched - make changes, unmatch and unmatch other Reconciliation State recs and Bank Statement LInes
 * 			with same match number.
 * 		4. If yes & reconciled - make changes and flag exception
 * 
 * @param {object} objTran - object encapsulating recon state values
 * @param {object} objNumberOf - object recording number of new, existing, updated and exception records
 * @param {string} strProcId - internalid of process instance
 * @param {string} strRSId - internalid of reconciliation state record that we are checking
 * @return {nlobjRecord} - updated Reconciliation State
 */
function nbsABR_RunIntegrityCheck(objTran,strProcId,objNumberOf,strRSId)
{
	/* objTran = {
				rsid:internalid or recon state,
				rsamt:amount,
				rsdate:date,
				rsline:line,
				status:ABR status,
				nstran:NS transaction,//list
				nsid:NS transaction internalid,//text
				nsamt:NS amount: NS amount from joined search
				nsdate:NS date: NS date from joined search
				nsline:NS line: NS line from joined search	
				new_nsamt: NS amount as set by new search
				new_nsdate:NS date as set by new search
				new_nsline:NS line as set by new search
				trntype
		};	*/	
	
	var l_trnId = objTran.nsid;
	var flNewAmt = ncParseFloatNV(objTran.new_nsamt,0);
	var dtNewDate = nlapiStringToDate(objTran.new_nsdate);
	var flOldAmt = ncParseFloatNV(objTran.rsamt,0);
	var dtOldDate =  nlapiStringToDate(objTran.rsdate);
	var l_status =objTran.status;
	var recOldRS = null;
	var b_Update = false;
	var l_rsId = strRSId;
		
	if(l_rsId === null){//account init.
		// search for an existing Reconciliation State
		var sfRS = [new nlobjSearchFilter('custrecord_nbsabr_rs_internalid',null, 'anyof',l_trnId),
		            new nlobjSearchFilter('custrecord_nbsabr_rs_linenumber',null, 'equalto',objTran.nsline),
		            new nlobjSearchFilter('isinactive',null, 'is','F')];
		var scRS = [new nlobjSearchColumn('custrecord_nbsabr_rs_status'),
		            new nlobjSearchColumn('custrecord_nbsabr_rs_trndate'),
		            new nlobjSearchColumn('custrecord_nbsabr_rs_amount'),
		            new nlobjSearchColumn('custrecord_nbsabr_rs_matchnumber')];
		var srRS = nlapiSearchRecord('customrecord_nbsabr_reconciliationstate',null,sfRS,scRS);
		
		if(srRS === null){
			return null;	// no existing record 
		}
		if(srRS.length > 1){
			//TODO
			// log error do what - should never happen!!
		}
		if(srRS.length == 1){
			l_rsId = srRS[0].getId();
		}
	}
	if((flNewAmt != flOldAmt) || ((dtNewDate - dtOldDate)/(24*60*60) != 0)){	
		recOldRS = nlapiLoadRecord('customrecord_nbsabr_reconciliationstate',l_rsId);
	}
	else{
		return null;//nothing to update
	}
	
	// update if changed
	if(flNewAmt != flOldAmt){
		nlapiLogExecution('debug', 'Amount changed to ', flNewAmt);
		recOldRS.setFieldValue('custrecord_nbsabr_rs_amount',flNewAmt);
		b_Update = true;
	}
	
	if((dtNewDate - dtOldDate)/(24*60*60) != 0){
		nlapiLogExecution('debug', 'Date changed to ', objTran.new_nsdate);
		recOldRS.setFieldValue('custrecord_nbsabr_rs_trndate',objTran.new_nsdate);
		b_Update = true;
	}	
		
	switch(l_status){
		case ABR_CL.STATUS.UNMATCHED:
			// update ABR Status
			if(b_Update){
				recOldRS.setFieldValue('custrecord_nbsabr_rs_integritystatus',ABR_CL.INTEGRITY.UPDATED);
				objNumberOf.intUpdated +=1;
			}
			break;
		
		case ABR_CL.STATUS.MATCHED:
			//  update ABR Status and UNMATCH
			if(b_Update){			
				var matchNum = recOldRS.getFieldValue('custrecord_nbsabr_rs_matchnumber');
				nlapiLogExecution('debug', 'Matched Number', matchNum);
				if(!isStringEmpty(matchNum)){ 
					// search for other unreconciled Reconciliation State recs (created at cleardown maybe) with same match number and set to ''
					var sfRS = [new nlobjSearchFilter('custrecord_nbsabr_rs_matchnumber',null, 'equalto',matchNum),
					            new nlobjSearchFilter('custrecord_nbsabr_rs_reconacc',null, 'anyof',objTran.reconacct),
					            new nlobjSearchFilter('internalid',null, 'noneof',[l_rsId]),
					            new nlobjSearchFilter('isinactive',null, 'is','F')];
					var recRS = nlapiSearchRecord('customrecord_nbsabr_reconciliationstate',null,sfRS,null);
					for(var i=0; recRS!==null && i<recRS.length;i+=1){
						nlapiSubmitField('customrecord_nbsabr_reconciliationstate',recRS[i].getId(),'custrecord_nbsabr_rs_matchnumber','');
					}
					
					// now search for all bank transactions with same match number and reset to ''
					// match number is unique to Reconcile Account so incl filter for this
					nlapiLogExecution('debug', 'objTran.reconacct', objTran.reconacct);
					var sfBT = [new nlobjSearchFilter('custrecord_bsl_matchnumber',null, 'equalto',matchNum),
					            new nlobjSearchFilter('custrecord_bsl_reconaccount',null, 'anyof',objTran.reconacct),
					            new nlobjSearchFilter('isinactive',null, 'is','F')];
					var srBT = nlapiSearchRecord('customrecord_nbsabr_bankstatementline',null,sfBT,null);
					for(var i=0; srBT!==null && i<srBT.length;i+=1){
						nlapiSubmitField('customrecord_nbsabr_bankstatementline',srBT[i].getId(),'custrecord_bsl_matchnumber','');
					}
					ncBGP_WriteToLog(strProcId, '', 'ABR Integrity Check...matched transaction found and updated', 'Warning');
				}
				//update this recon state
				recOldRS.setFieldValue('custrecord_nbsabr_rs_integritystatus',ABR_CL.INTEGRITY.UPDATED);
				recOldRS.setFieldValue('custrecord_nbsabr_rs_matchnumber','');
				objNumberOf.intUpdated +=1;
			}
			break;
		
		case ABR_CL.STATUS.RECONCILED:
			// flag as exception
			if(b_Update){
				recOldRS.setFieldValue('custrecord_nbsabr_rs_integritystatus',ABR_CL.INTEGRITY.EXCEPTION);
				objNumberOf.intExceptions +=1;
				
				var strDetails = 'Type: '+objTran.type+' id= '+objTran.internalid+' Date: '+objTran.date+' Amt: '+objTran.amount;
				nlapiLogExecution('AUDIT','ABR Integrity Check - EXCEPTION',strDetails);
				// log on process instance
				ncBGP_WriteToLog(strProcId, '', 'ABR EXCEPTION :'+strDetails, 'Warning');
			}
			break;
		default:	
	}
	
	return recOldRS;
}
function nbsABR_CheckGovernance(ProcessId,forceYield)
{
	 var context = nlapiGetContext();
	 if((context.getRemainingUsage() < 100) || (forceYield == true)) {
		nlapiLogExecution("debug", 'context.getRemainingUsage()',context.getRemainingUsage());
		
		var state = nlapiYieldScript();
		if( state.status == 'FAILURE')
		{
			nlapiLogExecution("ERROR","Failed to yield script, exiting: Reason = "+state.reason + " / Size = "+ state.size);
			throw "Failed to yield script";
		} 
		else if ( state.status == 'RESUME' )
		{
			ncBGP_WriteToLog(ProcessId,'','Resuming script...','Message');
			nlapiLogExecution("AUDIT", "Resuming script because of " + state.reason+".  Size = "+ state.size);
		}
	  // state.status will never be SUCCESS because a success would imply a yield has occurred.  The equivalent response would be yield
	 }
}

/**
 * Reads hidden match numbers on existing lines of a journal, sets match number on current line, loads and submits the journal.
 * 
 * Required because hidden values on a custom transaction column field are lost when the journal is loaded. Line ID NOT same as Line Sequence Number - need both
 * to correctly identify line to set!! Line Sequence Number only available as search column
 * 
 * @param (string)
 *            jrnId the internal id of the journal
 * @param (int)
 *            intLineNum the current line number
 * @param (string)
 *            stMatchNum the current match number or <blank> if unmatch
 * @param (string)
 *            stReconId the current reconciliation id
 * @return (string) stMsg error message
 */
/*function nbsABR_SubmitJournal(jrnId, intLineNum, stMatchNum, stReconId, stAccId) {

	var stMsg = '';
	var columns = [ new nlobjSearchColumn('line'), new nlobjSearchColumn('linesequencenumber'), new nlobjSearchColumn('custcol_nbsabr_matchnumber'),
			new nlobjSearchColumn('custcol_nbsabr_reconciled') ];
	var filters = [ new nlobjSearchFilter('internalid', null, 'is', jrnId), new nlobjSearchFilter('taxline', null, 'is', 'F') ];
	if (stAccId != null) {
		filters.push(new nlobjSearchFilter('account', null, 'is', stAccId));
	}
	var results = nlapiSearchRecord('journalentry', null, filters, columns);
	var recType = results[0].getRecordType(); // journalentry or
	// intercompanyjournalentry
	var recJE = nlapiLoadRecord(recType, jrnId);
	// var recJE = nlapiLoadRecord('journalentry',jrnId);
	// load record wipes out existing hidden line values so search and reset
	for ( var j = 0; results != null && j < results.length; j += 1) {
		var lineSeqNum = ncParseIntNV(results[j].getValue('linesequencenumber'), 0);

		var lineID = ncParseIntNV(results[j].getValue('line'), 0);

		if (lineID == intLineNum)// not always the same!!
		{
			intLineNum = lineSeqNum;
		}

		var match = results[j].getValue('custcol_nbsabr_matchnumber');
		var recon = results[j].getValue('custcol_nbsabr_reconciled');

		if (!isStringEmpty(match))
			recJE.setLineItemValue('line', 'custcol_nbsabr_matchnumber', lineSeqNum + 1, match);
		if (!isStringEmpty(recon))
			recJE.setLineItemValue('line', 'custcol_nbsabr_reconciled', lineSeqNum + 1, recon);
	}
	if (stMatchNum != null) {
		recJE.setLineItemValue('line', 'custcol_nbsabr_matchnumber', intLineNum + 1, stMatchNum);
	}
	if (stReconId != null) {
		recJE.setLineItemValue('line', 'custcol_nbsabr_reconciled', intLineNum + 1, stReconId);
	}

	try {
		//nlapiSubmitRecord(recJE, true);
	} catch (e) {
		if (e instanceof nlobjError) {
			stMsg = e.getCode() + ' - ' + e.getDetails();
		} else {
			stMsg = e.toString();
		}
	}
	return stMsg;
}*/

/**
 * Suitlet code for "Delete Statement" button on ABR - Bank Statement records. Deletes child bank statement lines first and then the parent bank statement
 * record. No records deleted if ANY of the child bank statement lines have been matched or reconciled.
 * 
 * User currently redirected back to Home page
 * 
 * @author C Shaw
 * @version 1.0
 */
function nbsABR_DeleteStatementSL(request, response) {
	var form = nlapiCreateForm('ABR Delete Imported Bank Statement', true);
	var fld_msg = form.addField('msg', 'richtext', '').setDisplayType('inline');
	form.addSubmitButton('OK');
	var stMsg = '';
	var recLinkURL;

	if (request.getMethod() == 'GET') {
		var recId = request.getParameter('recId');
		var totalFound = 0;
		var bOKtoDelete = true;

		try {
			var columns = [ new nlobjSearchColumn('internalid'), new nlobjSearchColumn('custrecord_bsl_matchnumber'),
					new nlobjSearchColumn('custrecord_bsl_reconciledstatement') ];
			var filters = [ new nlobjSearchFilter('custrecord_bsl_bankstatementid', null, 'is', recId) ];

			var results = nlapiSearchRecord('customrecord_nbsabr_bankstatementline', null, filters, columns);

			if (results != null) {
				totalFound = results.length;
			}
			// are there any matched or reconciled records?
			for ( var i = 0; i < totalFound; i++) {
				var matchNum = results[i].getValue('custrecord_bsl_matchnumber');
				var reconId = results[i].getValue('custrecord_bsl_reconciledstatement');

				if (!isStringEmpty(matchNum) || !isStringEmpty(reconId)) {
					bOKtoDelete = false;
					break;
				}
			}

			if (bOKtoDelete) {
				// delete children
				for ( var i = 0; i < totalFound; i++) {
					var stChildId = results[i].getValue('internalid');
					nlapiDeleteRecord('customrecord_nbsabr_bankstatementline', stChildId);

					var uRem = nlapiGetContext().getRemainingUsage();
					if (uRem < 20) {
						// nlapiCreateError('ABR_SCRIPT_USAGE_LIMIT','Script
						// execution usage nearing limit.\n Repeat process to
						// delete remaining records');
						recLinkURL = nlapiResolveURL('RECORD', 'customrecord_nbsabr_bankstatement', recId);
						stMsg = 'Script execution usage nearing limit.<BR>';
						stMsg += '<BR>Click <B><A HREF=" ' + recLinkURL + ' ">here</A></B> to return to statement record and delete remaining records.<BR>';
						fld_msg.setDefaultValue(stMsg);
						response.writePage(form);
						return;
					}
				}
				// delete parent
				nlapiDeleteRecord('customrecord_nbsabr_bankstatement', recId);
				totalFound += 1;

				fld_msg.setDefaultValue(totalFound + ' record(s) have been deleted');
				response.writePage(form);

			} else {
				recLinkURL = nlapiResolveURL('RECORD', 'customrecord_nbsabr_bankstatement', recId);
				stMsg = 'This bank statement cannot be deleted because transactions have been matched and/or reconciled.';
				stMsg += '<BR>Click <B><A HREF=" ' + recLinkURL + ' ">here</A></B> to return to statement record.<BR>';
				fld_msg.setDefaultValue(stMsg);
				response.writePage(form);
			}

		} catch (e) {
			var msg = '';
			if (e instanceof nlobjError) {
				msg = e.getCode() + '\n' + e.getDetails();
			} else {
				msg = 'Error:' + e.toString();
			}
			response.write(msg);
		}
	} else // POST
	{
		// click OK to redirect to Home page
		var stJS = "window.location='/app/center/card.nl?sc=-29'";
		var stHTML = '<html><body><script type="text/javascript">' + stJS + '</script></body></html>';
		response.write(stHTML);

		// response.sendRedirect('TASKLINK',
		// 'LIST_CUSTRECORD','customrecord_nbsabr_bankstatement');
	}

}

/**
 * Suitelet code for reconcile setup error - redirect here if no default or account setup records are found.
 * 
 * Redirect user to current list of account setup records if any found or user is redirected back to Home page
 * 
 * @author C Shaw
 * @version 1.0
 */
function nbsABR_ReconErrorSL(request, response) {
	var stMsg = '';
	// var recLinkURL;
	var stRecType = request.getParameter('recordtype');
	var stRecName = request.getParameter('recordname');

	if (request.getMethod() == 'GET') {
		var form = nlapiCreateForm('ABR Reconcile Error', true);
		var fld_msg = form.addField('msg', 'richtext', '').setDisplayType('inline');
		var fld_type = form.addField('recordtype', 'text', '').setDisplayType('hidden');
		form.addSubmitButton('OK');

		try {
			stMsg = 'Missing ' + stRecName + ' record.<br/>';
			stMsg += 'Click OK to view the current list.';

			fld_msg.setDefaultValue(stMsg);
			fld_type.setDefaultValue(stRecType);

			response.writePage(form);
		} catch (e) {
			var msg = '';
			if (e instanceof nlobjError) {
				msg = e.getCode() + '\n' + e.getDetails();
			} else {
				msg = 'Error:' + e.toString();
			}
			response.write(msg);
		}
	} else // POST
	{
		var results = nlapiSearchRecord(stRecType, null, null, null);
		if (results != null) {
			// click OK to redirect to list of account setup or default records
			var setupRec = nlapiLoadRecord(stRecType, results[0].getId());
			var recType = setupRec.getFieldValue('rectype');
			response.sendRedirect('TASKLINK', 'LIST_CUST_' + recType.toString());
		} else {
			// click OK to redirect to Home page
			var stJS = "window.location='/app/center/card.nl?sc=-29'";
			var stHTML = '<html><body><script type="text/javascript">' + stJS + '</script></body></html>';
			response.write(stHTML);
		}
	}
}
/** function nbsABR_IntegrityCheck - returns updated Reconciliation State record - replaced by nbsABR_RunIntegrityCheck
 * 
 * This function runs an integrity check on a NS transaction:
 * 		1. Is there an existing Reconciliation State?
 * 		2. If yes & unmatched - make changes
 * 		3. If yes & matched - make changes, unmatch and unmatch other Reconciliation State recs and Bank Statement LInes
 * 			with same match number.
 * 		4. If yes & reconciled - make changes and flag exception
 * 
 * @param {object} objTran - NS transaction object containing trandate, amount, reconcile account
 * @param {object} objNumberOf - object recording number of new, existing, updated and exception records
 * @param {string} strProcId - internalid of process instance
 *  @param {string} strRSId - internalid of reconciliation state record that we are checking
 * @return {nlobjRecord} - Reconciliation State
 */
function nbsABR_IntegrityCheck(objTran,strProcId,objNumberOf,strRSId)
{
	var l_trxId = objTran.internalid;
	var flNewAmt = ncParseFloatNV(objTran.amount,0);
	var dtNewDate = nlapiStringToDate(objTran.date);
	var flOldAmt = 0.00;
	var dtOldDate = null;
	var abrStatus ='';
	var recOldRS = null;
	var b_Update = false;
	var l_reconStateId = strRSId;
	
	if(l_reconStateId === null){
		// search for an existing Reconciliation State
		var sfRS = [new nlobjSearchFilter('custrecord_nbsabr_rs_internalid',null, 'anyof',l_trxId),
		            new nlobjSearchFilter('custrecord_nbsabr_rs_linenumber',null, 'equalto',objTran.line),
		            new nlobjSearchFilter('isinactive',null, 'is','F')];
		var scRS = [new nlobjSearchColumn('custrecord_nbsabr_rs_status'),
		            new nlobjSearchColumn('custrecord_nbsabr_rs_trndate'),
		            new nlobjSearchColumn('custrecord_nbsabr_rs_amount'),
		            new nlobjSearchColumn('custrecord_nbsabr_rs_matchnumber')];
		var srRS = nlapiSearchRecord('customrecord_nbsabr_reconciliationstate',null,sfRS,scRS);
		
		if(srRS === null){
			return null;	// no existing record 
		}
		if(srRS.length > 1){
			//TODO
			// log error do what - should never happen!!
		}
		if(srRS.length == 1){
			l_reconStateId = srRS[0].getId();
		}
	}

	
	//if(srRS.length == 1){
		//recOldRS = nlapiLoadRecord('customrecord_nbsabr_reconciliationstate',srRS[0].getId());
		recOldRS = nlapiLoadRecord('customrecord_nbsabr_reconciliationstate',l_reconStateId);
				
		flOldAmt = ncParseFloatNV(recOldRS.getFieldValue('custrecord_nbsabr_rs_amount'),0);
		dtOldDate = nlapiStringToDate(recOldRS.getFieldValue('custrecord_nbsabr_rs_trndate'));
		abrStatus = recOldRS.getFieldValue('custrecord_nbsabr_rs_status');
		if (abrStatus === null)
			abrStatus = '';
		
		// update if changed
		if(flNewAmt != flOldAmt){
			nlapiLogExecution('debug', 'Amount changed to ', flNewAmt);
			recOldRS.setFieldValue('custrecord_nbsabr_rs_amount',objTran.amount);
			b_Update = true;
		}
		
		if((dtNewDate - dtOldDate)/(24*60*60) != 0){
			nlapiLogExecution('debug', 'Date changed to ', objTran.date);
			recOldRS.setFieldValue('custrecord_nbsabr_rs_trndate',objTran.date);
			b_Update = true;
		}	
		
		switch(abrStatus.toString()){
			case ABR_CL.STATUS.UNMATCHED:
				// update ABR Status
				if(b_Update){
					recOldRS.setFieldValue('custrecord_nbsabr_rs_integritystatus',ABR_CL.INTEGRITY.UPDATED);
					objNumberOf.intUpdated +=1;
				}
				break;
			
			case ABR_CL.STATUS.MATCHED:
				//  update ABR Status and UNMATCH
				if(b_Update){			
					var matchNum = recOldRS.getFieldValue('custrecord_nbsabr_rs_matchnumber');
					nlapiLogExecution('debug', 'Matched Number', matchNum);
					if(!isStringEmpty(matchNum)){ 
						// search for other unreconciled Reconciliation State recs (created at cleardown maybe) with same match number and set to ''
						var sfRS = [new nlobjSearchFilter('custrecord_nbsabr_rs_matchnumber',null, 'equalto',matchNum),
						            new nlobjSearchFilter('custrecord_nbsabr_rs_reconacc',null, 'anyof',objTran.reconacct),
						            new nlobjSearchFilter('internalid',null, 'noneof',[l_reconStateId]),
						            new nlobjSearchFilter('isinactive',null, 'is','F')];
						var recRS = nlapiSearchRecord('customrecord_nbsabr_reconciliationstate',null,sfRS,null);
						for(var i=0; recRS!==null && i<recRS.length;i+=1){
							nlapiSubmitField('customrecord_nbsabr_reconciliationstate',recRS[i].getId(),'custrecord_nbsabr_rs_matchnumber','');
						}
						
						// now search for all bank transactions with same match number and reset to ''
						// match number is unique to Reconcile Account so incl filter for this
						nlapiLogExecution('debug', 'objTran.reconacct', objTran.reconacct);
						var sfBT = [new nlobjSearchFilter('custrecord_bsl_matchnumber',null, 'equalto',matchNum),
						            new nlobjSearchFilter('custrecord_bsl_reconaccount',null, 'anyof',objTran.reconacct),
						            new nlobjSearchFilter('isinactive',null, 'is','F')];
						var srBT = nlapiSearchRecord('customrecord_nbsabr_bankstatementline',null,sfBT,null);
						for(var i=0; srBT!==null && i<srBT.length;i+=1){
							nlapiSubmitField('customrecord_nbsabr_bankstatementline',srBT[i].getId(),'custrecord_bsl_matchnumber','');
						}
						ncBGP_WriteToLog(strProcId, '', 'ABR Integrity Check...matched transaction found and updated', 'Warning');
					}
					//update this recon state
					recOldRS.setFieldValue('custrecord_nbsabr_rs_integritystatus',ABR_CL.INTEGRITY.UPDATED);
					recOldRS.setFieldValue('custrecord_nbsabr_rs_matchnumber','');
					objNumberOf.intUpdated +=1;
				}
				break;
			
			case ABR_CL.STATUS.RECONCILED:
				// flag as exception
				if(b_Update){
					recOldRS.setFieldValue('custrecord_nbsabr_rs_integritystatus',ABR_CL.INTEGRITY.EXCEPTION);
					objNumberOf.intExceptions +=1;
					
					var strDetails = 'Type: '+objTran.type+' id= '+objTran.internalid+' Date: '+objTran.date+' Amt: '+objTran.amount;
					nlapiLogExecution('AUDIT','ABR Integrity Check - EXCEPTION',strDetails);
					// log on process instance
					ncBGP_WriteToLog(strProcId, '', 'ABR EXCEPTION :'+strDetails, 'Warning');
				}
				break;
			default:	
		}
	//}
	
	return recOldRS;
}

/**
 * This function retrieves company name from configuration record and return the result as a string. 
 * Execute as Admin as only administrators are able to access the configuration page.
 * 
 */
function nbsABR_LookupCompanySL(request, response) {
	if (request.getMethod() == 'GET') {
		var companyInfo = nlapiLoadConfiguration('companyinformation');
		response.write(companyInfo.getFieldValue('companyname') + ',' + companyInfo.getFieldValue('basecurrency'));
	}
}

/**
 * This function retrieves accounting preferences from configuration record and return the result as a string. Execute as Admin as only administrators are able
 * to access the configuration page. Permits users logged in under non- admin role to determine accounting preferences SL called from library file
 */
function nbsABR_LookupAccPreferencesSL(request, response) {
	if (request.getMethod() == 'GET') {
		var objAccPref = nlapiLoadConfiguration('accountingpreferences');
		response.write(objAccPref.getFieldValue('reversalvoiding'));
	}
}

// not in use
function nbsABR_CreateNewMatchNumber(accountId, glId, bkId) {
	var recReconDetail = nlapiCreateRecord('customrecord_nbsabr_customrecord_nbsabr_recondetail');
	recReconDetail.setFieldValue('custrecord_rd_account', accountId);
	recReconDetail.setFieldValue('custrecord_rd_gltransaction', glId);
	recReconDetail.setFieldValue('custrecord_rd_banktransaction', bkId);
	var id = nlapiSubmitRecord(recReconDetail, false);

	return id;
}

/**
 * Formats a value by adding a minus sign if value is negative
 * 
 * @param (string)
 *            value the value to be formatted
 * @return (string)the float value formatted with sign
 */
function formatCurrencyAmount(value) {
	var flValue = ncParseFloatNV(value, 0);
	var minus = '';

	if (flValue < 0)
		minus = '-';

	flValue = Math.abs(flValue);
	flValue = parseInt((flValue + .005) * 100, 10);
	flValue = flValue / 100;
	var stValue = flValue.toString();
	if (stValue.indexOf('.') < 0) {
		stValue += '.00';
	}
	if (stValue.indexOf('.') == (stValue.length - 2)) {
		stValue += '0';
	}

	stValue = minus + stValue;
	return stValue;

}

/**
 * Formats a value by adding decimal places and minus sign if value is a debit
 * 
 * @param (string)
 *            stValue the value to be formatted
 * @param (string)
 *            stIndicator indicates if value is a debit or a credit
 * @param (string)
 *            stCurrCode 3 character currency code dictates number of decimal places
 * @return (string)the float value formatted with the commas and sign
 */
function nbsABR_FormatBAI_CurrencyAmount(stValue, stIndicator, stCurrCode) {
	var flValue = ncParseFloatNV(stValue, 0);
	var minus = '';

	if (stIndicator == LIST_DEBIT_INDICATOR) {
		minus = '-';
	}

	var NumOfDPs = getDecimalPlaces(stCurrCode);
	if (NumOfDPs == '2') {
		flValue = flValue / 100;
	}
	if (NumOfDPs == '1') {
		flValue = flValue / 10;
	}

	var stValue = flValue.toString();

	stValue = minus + stValue;
	return stValue;
}

/**
 * Returns associative array of BAI type codes with debit/credit indicator e.g. array[475] = '1' (debit)
 * 
 * @return (array)
 */
function getBAITypeCodeArray() {
	var arrCodes = new Array();
	var key;

	var sfs = [ new nlobjSearchFilter('isinactive', null, 'is', 'F', null) ];
	var scs = [ new nlobjSearchColumn('name'), new nlobjSearchColumn('custrecord_btc_debitcredit'), new nlobjSearchColumn('custrecord_btc_description') ];
	var results = nlapiSearchRecord('customrecord_nbsabr_baitypecode', null, sfs, scs);

	for ( var i = 0; results != null && i < results.length; ++i) {
		key = results[i].getValue('name');
		var code = new Object();
		code.description = results[i].getValue('custrecord_btc_description');
		code.indicator = results[i].getValue('custrecord_btc_debitcredit');

		arrCodes[key] = code;
	}
	return arrCodes;
}

/**
 * Returns associative array of transaction type codes for the given bank format, with debit/credit indicator e.g. array['475'].indicator = '1' (debit)
 * 
 * @param {String} formatId - id of the bank format for which to retrieve the transaction types
 * @return {Array} array of objects:{description, indicator}
 */
function getTrnTypeCodeArray(formatId) {
	var arrCodes = new Array();
	var key;

	var sfs = [ new nlobjSearchFilter('isinactive', null, 'is', 'F', null), new nlobjSearchFilter('custrecord_ttc_bankfmt', null, 'anyof', formatId, null) ];
	var scs = [ new nlobjSearchColumn('name'), new nlobjSearchColumn('custrecord_ttc_debitcredit'), new nlobjSearchColumn('custrecord_ttc_description') ];
	var results = nlapiSearchRecord('customrecord_nbsabr_trntypecode', null, sfs, scs);

	for ( var i = 0; results !== null && i < results.length; ++i) {
		key = results[i].getValue('name');
		var code = new Object();
		code.description = results[i].getValue('custrecord_ttc_description');
		code.indicator = results[i].getValue('custrecord_ttc_debitcredit');

		arrCodes[key] = code;
	}
	return arrCodes;
}

/**
 * Determines if the currency of a bank account is the same as the base currency of the company or subsidiary by searching for the ABR - Account Setup record
 * 
 * @param (string)
 *            stAccountId the internal id of bank/credit card account
 * @return (boolean)
 */
function nbsABR_IsBaseCurrency(stAccountId) {
	var bIsBaseCurr = true;
	// retrieve account setup record to get from date for this account
	var filters = [ new nlobjSearchFilter('custrecord_accsetup_account', null, 'is', stAccountId) ];
	var cols = [ new nlobjSearchColumn('custrecord_accsetup_isbasecurr') ];
	var results = nlapiSearchRecord('customrecord_nbsabr_accountsetup', null, filters, cols);
	if ((results != null) && (results.length > 0)) {
		var stIsBaseCurr = results[0].getValue('custrecord_accsetup_isbasecurr');
		if (stIsBaseCurr == 'F') {
			bIsBaseCurr = false;
		}
	} else {
		nlapiLogExecution('ERROR', 'Advanced Bank Reconciliation account setup record is missing.', 'Unable to determine correct settings..');
	}
	return bIsBaseCurr;

}
/**
 * nbsABR_GetLastStatementDate - function to retrieve the most recent reconciliation statement date for a reconcile account
 * 
 * @param {string} stReconAcctId internal id of reconcile account
 * @return (string) strStmntDate statement date as a string
 */
function nbsABR_GetLastStatementDate(stReconAcctId)
{
	var strStmntDate = '';
	var SF = new nlobjSearchFilter('custrecord_sh_reconaccount',null,'is',stReconAcctId,null);
	var SR = nlapiSearchRecord('customrecord_nbsabr_statementhistory','customsearch_nbsabr_statehist_datedesc',SF,null);
	if((SR && SR.length > 0)){
		strStmntDate = SR[0].getValue('custrecord_sh_date');
	}
	return strStmntDate;
}

/**
 * Function to get base currency DEPRECATED
 * 
 * @param (string)
 *            stStringId the internal id of subsidiary
 * @return (string)stCurrencyId the internal id base currency record
 */
function getBaseCurrency(stSubsidiaryId) {
	var stCurrencyId = null;
	// if(stSubsidiaryId == '1')
	var SFs = [ new nlobjSearchFilter('isinactive', null, 'is', 'F'), new nlobjSearchFilter('internalid', null, 'is', stSubsidiaryId) ];
	var SCs = [ new nlobjSearchColumn('currency') ];
	var SRec = nlapiSearchRecord('subsidiary', null, SFs, SCs);
	if ((SRec != null) && (SRec.length > 0)) {
		stCurrencyId = SRec[0].getValue('currency');
	}
	nlapiLogExecution('debug', 'getBaseCurrency', stCurrencyId);
	return stCurrencyId;
}

/**
 * Function to to determine if multiple script queues are used Returns queue number to use for background scheduled script
 * 
 * @return (string)stQueueNum the script queue number to be
 */
function getScriptQueueNumber() {
	// are multiple scripts queues used?
	var b_UseMultiQs = false;
	var stStart = '';
	var stEnd = '';
	var intQNum = 1;

	// attempt to retrieve config record
	var cnfgSF = new nlobjSearchFilter('isinactive', null, 'is', 'F', null);
	var cnfgSC = [ new nlobjSearchColumn('custrecord_abr_config_mltplscrptqs'), new nlobjSearchColumn('custrecord_abr_config_strtscrptqnmbr'),
			new nlobjSearchColumn('custrecord_abr_config_endscrptqnmbr') ];
	var cnfgSR = nlapiSearchRecord('customrecord_nbsabr_config', null, cnfgSF, cnfgSC);
	if (cnfgSR !== null && cnfgSR.length > 0) {
		if (cnfgSR[0].getValue('custrecord_abr_config_mltplscrptqs') == 'T') {
			b_UseMultiQs = true;
			stStart = cnfgSR[0].getValue('custrecord_abr_config_strtscrptqnmbr');
			stEnd = cnfgSR[0].getValue('custrecord_abr_config_endscrptqnmbr');
		}
	} else {
		nlapiLogExecution('debug', 'getScriptQueueNumber', 'Unable to retrieve configuration record');
	}
	if (b_UseMultiQs) {
		intQNum = getLeastActiveScriptQueue(stStart, stEnd);
	}
	return intQNum;
}

/**
 * If multiple script queues are used, function to get least busy scheduled script queue It is not possible to query the queue status to determine which queues
 * are already loaded, queue utilisation can only be determines by tracking activity of NC Background Processes
 * 
 * @param (string)
 *            stStart first script number that may be used
 * @param (string)
 *            stend last script number that may be used
 * @return (string)stQueueNum the script queue number to be
 */
function getLeastActiveScriptQueue(stStart, stEnd) {
	var l_start = stStart;
	var l_end = stEnd;

	// search grouped and sorted by queue number
	// if queue number is <blank> assume queue number is 1
	var filters = [ new nlobjSearchFilter('isinactive', null, 'is', 'F', null),
			new nlobjSearchFilter('custrecord_bgpprocstatus', null, 'anyof', [ '1', '5' ], null) ]; // anyof
	// In
	// Progress
	// or
	// Queued
	var cols = [ new nlobjSearchColumn('internalid', null, 'COUNT'), new nlobjSearchColumn('formulanumeric', null, 'GROUP') ];
	cols[1].setFormula('CASE WHEN {custrecord_bgpscrptqnmbr} > 0 THEN {custrecord_bgpscrptqnmbr} ELSE 1 END');
	cols[1].setSort();

	var procRecs = nlapiSearchRecord('customrecord_ncbgp_procinstance', null, filters, cols);

	var arrQN = [];
	var arrCNT = [];
	var intQN = l_start;
	var intMIN = '';

	for ( var i = 0; procRecs != null && i < l_end && i < procRecs.length; i++) {
		arrQN[i] = procRecs[i].getValue('formulanumeric', null, 'GROUP');
		arrCNT[i] = ncParseIntNV(procRecs[i].getValue('internalid', null, 'COUNT'), 0);
	}
	var k = ncParseIntNV(l_start, 1);
	do {
		var idx = IndexOfArray(arrQN, k);
		intCNT = (idx == -1) ? 0 : arrCNT[idx];
		if (intMIN == '')// first time through
		{
			intMIN = intCNT;
		} else if (intCNT < intMIN) {
			intMIN = intCNT;
			intQN = k;
		}
		k += 1;
	} while (intCNT > 0 && k <= l_end);// if count is zero, bale out and use
	// current queue number
	// nlapiLogExecution('debug','intQN',intQN);
	return intQN;
}

function nbsABR_GetConfig() {
	// retrieve and validate configuration record
	var errMsg;
	// retrieve Configuration record
	var sfNotInactive = new nlobjSearchFilter('isinactive', null, 'is', 'F', null);
	var results = null;
	var id;
	var rec;
	try {
		results = nlapiSearchRecord('customrecord_nbsabr_config', null, sfNotInactive, null);
	} catch (e) {
		nlapiLogException(e, 'error', 'NBS Advanced Bank Reconciliation');
		return;
	}

	if ((results === null) || (results.length === 0)) // no record found
	{
		errMsg = 'ABR configuration record missing.';
		nlapiLogException('error', 'NBS Advanced Bank Reconciliation', errMsg);
		return;
	} else // one or more found
	{
		if (results.length == 1) {
			id = results[0].getId();
			rec = nlapiLoadRecord('customrecord_nbsabr_config', id); // assumes
			// this
			// will
			// not
			// fail...
		} else // multiple records found, flag error
		{
			errMsg = 'Multiple configurations have been found. Please delete or mark inactive all but one configuration record.';
			nlapiLogException('error', 'NBS Advanced Bank Reconciliation', errMsg);
			return;
		}
	}

	return rec;
}

/**
 * Determines if account currency is same as base currency of subsidiary DEPRECATED
 * 
 * @param (string)
 *            stAccountId the internal id of account
 * @param (string)
 *            stStringId the internal id of subsidiary
 * @param (string)
 *            stCurrencyId the internal id of account currency if known
 * @return (boolean) true if currency is base currency of subsidiary/company
 */
function isBaseCurrency(stAccountId, stSubsidiaryId, stCurrencyId) {
	nlapiLogExecution('debug', 'fn isBaseCurrency, AccId : SubId : CurrId', stAccountId + ' : ' + stSubsidiaryId + ' : ' + stCurrencyId);

	var stAccCurrId;// =
	// nlapiLoadRecord('account',stAccountId).getFieldValue('currency');
	var stSubsidCurrId;
	// get currency id if null
	if (isStringEmpty(stCurrencyId)) {
		var recAcc = nlapiLoadRecord('account', stAccountId);
		stAccCurrId = recAcc.getFieldValue('currency');
	} else {
		stAccCurrId = stCurrencyId;
	}
	if (stSubsidiaryId == '1')// parent
	{
		stSubsidCurrId = nbsCONFIG.basecurrency;
	} else {
		stSubsidCurrId = nlapiLookupField('subsidiary', stSubsidiaryId, 'currency');
	}
	nlapiLogExecution('debug', 'isBaseCurrency: Sub : Acc', stSubsidCurrId + ' : ' + stAccCurrId);
	if (stSubsidCurrId == stAccCurrId) {
		return true;
	} else {
		return false;
	}
}

/** @deprecated
 * Function to get account balance (opening or closing) for a given date DEPRECATED
 * 
 * @param (string)
 *            stAccountId the account internal id
 * @param (string)
 *            stDate date of balance
 * @param (boolean)
 *            bIsBaseCurr
 * @param (boolean)
 *            bIsOpenBal true:return opening balance for date, false: return closing balance for date
 * 
 * @return (float) account balance
 */
// return closing balance for date -1
// date = statement start date
function getAccountBalance(stAccountId, stDate, bIsBaseCurr, bIsOpenBal) {
	var stSrchOp = 'onorbefore';
	if (bIsOpenBal) {
		stSrchOp = 'before';
	}
	var flCurrBalance = 0;

	if (bIsBaseCurr) {
		flCurrBalance = getAccountOpeningBalance(stAccountId, stDate, false, bIsOpenBal);
		// flCurrBalance = ncParseFloatNV(nlapiLookupField('account',stAccountId,'balance'),0);
		// returns foreign curr balance
		nlapiLogExecution('debug', 'getAccountOpeningBalance', flCurrBalance);
	} else {
		// SUM summary saved search
		var SFs = [ new nlobjSearchFilter('memorized', null, 'is', 'F', null), new nlobjSearchFilter('account', null, 'is', stAccountId, null),
				new nlobjSearchFilter('trandate', null, stSrchOp, stDate, null) ];
		if (nbsCONFIG.reversalvoiding == 'F') {
			SFs.push(new nlobjSearchFilter('voided', null, 'is', 'F', null));
		}
		var SCs = [ new nlobjSearchColumn('amount', null, 'SUM'), new nlobjSearchColumn('fxamount', null, 'SUM') ];

		var SRecs = nlapiSearchRecord('transaction', null, SFs, SCs);
		if (SRecs != null) {
			flCurrBalance = ncParseFloatNV(SRecs[0].getValue('fxamount', null, 'SUM'), 0);
			nlapiLogExecution('debug', 'getAccountBalance (sum)', flCurrBalance);
		}
	}
	return flCurrBalance;
}

/**
 * Converts imported bank transaction lines from comma separated text to colon separated text
 * 
 * @param (string)
 *            stFileType file type as string
 * @param (array)
 *            arrFileLines array of file lines, comma separator
 * 
 */
/*
 * function toPipeFieldSeparatedText(stFileType,arrFileLines) { var stTmp;
 * 
 * switch(stFileType) { case LIST_FILEFORMAT_COMMA: for(var i = 0; i < arrFileLines.length;i++) { // nlapiLogExecution('debug', 'CSV BEFORE toFST',
 * arrFileLines[i]);
 * 
 * stTmp = arrFileLines[i]; arrFileLines[i] = parseCSV(stTmp); // arrFileLines[i] = 'fld1:fld2:fld3,fld1:fld2:fld3,....' // nlapiLogExecution('debug', 'CSV
 * AFTER toFST', arrFileLines[i]); } break; case LIST_FILEFORMAT_TAB: // not implemented yet // rewrite parseCSV function break; case LIST_FILEFORMAT_FIXED: //
 * do nothing break;
 * 
 * case LIST_FILEFORMAT_BAI: var arrNew = []; for(var i = 0; i < arrFileLines.length;i++) { var stTmp = arrFileLines[i]; var stRecCode = stTmp.slice(0,2); // 02 -
 * Group Header; Fld 4 - As-of-Date // 03 - Account Identifier; Fld 2 - Customer Acc No.; Fld 3 - Currency Code // 16 - Transaction Detail if(stRecCode == '16' ||
 * stRecCode == '03' || stRecCode == '02' ) { // nlapiLogExecution(show, 'BAI BEFORE toFST', stTmp);
 * 
 * stTmp = parseCSV(stTmp); arrNew.push(stTmp); // nlapiLogExecution(show, 'BAI AFTER toFST', stTmp); } } arrFileLines = arrNew; nlapiLogExecution('debug',
 * 'arrFileLines.length', arrFileLines.length); break;
 * 
 * default: break; } }
 */

/**
 * Returns number of implied decimal places from currency code Currency codes usually have two implied decimal places but there are execptions.
 * 
 * @param (string)
 *            stCode the currency code
 * @return the number of decimal places
 * @type string
 */
function getDecimalPlaces(stCode) {

	switch (stCode) {
	case 'JPY':
		return '0';

	default:
		return '2';
	}

}

function normalize(val) {
	/*
	 * line terminators can be \r\r\n, \r\n, \n or \r ... map all of them to just \n
	 */
	var tmp = val.replace(/\r\r\n/g, '\n');
	tmp = tmp.replace(/\r\n/g, '\n');
	tmp =  tmp.replace(/\r/g, '\n'); // handle single '\r' line terminators too
	return tmp;
}

/**
 * Simplifies the logging of debug messages toggle printing of DEBUG type messages by setting show to true or false.
 */
function debugLog(show, where, what) {
	if (where == null) {
		where = '';
	}
	if (what == null) {
		what = '';
	}
	if (show) {
		// nlapiLogExecution('debug', where, what);
		ncLogExecution('debug', where, what);
	}

}
/**
 * Utility for debug, to either log (server side) or show on screen (client) a debug message
 */

function ncLogExecution(msgType, msgTitle, msgDetails) {
	if (typeof (nlapiLogExecution) != 'undefined')
		nlapiLogExecution(msgType, msgTitle, msgDetails);
	else
		alert(msgTitle + '\n\n' + msgDetails);
}

/**
 * 
 * Base64 encode / decode http://www.webtoolkit.info/
 * 
 */

var Base64 = {

	// private property
	_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

	// public method for encoding
	encode : function(input) {
		var output = "";
		var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
		var i = 0;

		input = Base64._utf8_encode(input);

		while (i < input.length) {

			chr1 = input.charCodeAt(i++);
			chr2 = input.charCodeAt(i++);
			chr3 = input.charCodeAt(i++);

			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;

			if (isNaN(chr2)) {
				enc3 = enc4 = 64;
			} else if (isNaN(chr3)) {
				enc4 = 64;
			}

			output = output + this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) + this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

		}

		return output;
	},

	// public method for decoding
	decode : function(input) {
		var output = "";
		var chr1, chr2, chr3;
		var enc1, enc2, enc3, enc4;
		var i = 0;

		input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

		while (i < input.length) {

			enc1 = this._keyStr.indexOf(input.charAt(i++));
			enc2 = this._keyStr.indexOf(input.charAt(i++));
			enc3 = this._keyStr.indexOf(input.charAt(i++));
			enc4 = this._keyStr.indexOf(input.charAt(i++));

			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;

			output = output + String.fromCharCode(chr1);

			if (enc3 != 64) {
				output = output + String.fromCharCode(chr2);
			}
			if (enc4 != 64) {
				output = output + String.fromCharCode(chr3);
			}

		}

		output = Base64._utf8_decode(output);

		return output;

	},

	// private method for UTF-8 encoding
	_utf8_encode : function(string) {
		string = string.replace(/\r\n/g, "\n");
		var utftext = "";

		for ( var n = 0; n < string.length; n++) {

			var c = string.charCodeAt(n);

			if (c < 128) {
				utftext += String.fromCharCode(c);
			} else if ((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			} else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}

		}

		return utftext;
	},

	// private method for UTF-8 decoding
	_utf8_decode : function(utftext) {
		var string = "";
		var i = 0;
		var c = 0, /* c1 = 0, */c2 = 0;
		var c3 = 0;

		while (i < utftext.length) {

			c = utftext.charCodeAt(i);

			if (c < 128) {
				string += String.fromCharCode(c);
				i++;
			} else if ((c > 191) && (c < 224)) {
				c2 = utftext.charCodeAt(i + 1);
				string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
				i += 2;
			} else {
				c2 = utftext.charCodeAt(i + 1);
				c3 = utftext.charCodeAt(i + 2);
				string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
				i += 3;
			}

		}

		return string;
	}
};

/**
 * 
 * Javascript trim, ltrim, rtrim http://www.webtoolkit.info/
 * 
 */

function trim(str, chars) {
	return ltrim(rtrim(str, chars), chars);
}

function ltrim(str, chars) {
	chars = chars || "\\s";
	return str.replace(new RegExp("^[" + chars + "]+", "g"), "");
}

function rtrim(str, chars) {
	chars = chars || "\\s";
	return str.replace(new RegExp("[" + chars + "]+$", "g"), "");
}

