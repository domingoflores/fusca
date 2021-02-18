/**
 * Module Description
 * 
 * Version    Date            Author  	        Remarks
 * 1.00       30 Jul 2014     smccurry			This is a new start on Dual Entry using the DataTables jQuery plugin as the basis.
 * 1.01		  01 Aug 2014	  smccurry			Installed the initial working version on Production.
 * 1.02		  19 Aug 2014	  smccurry			Moved current version from Production to Development.
 * 1.05		  16 Sept 2014    smccurry			Updated the createDualEntryUsersObject to reflect changes made to the customrecord_acq_lot_de_users record.
 * 1.06		  07 Feb 2018     sstreule			Added a search filter in the searchExchangeRecordsDualEntry function to exclude INACTIVE ExRecs
 */

var NS_ROLE_OFFSITE_DUALENTRY_ONLY = '1068';

/***********************************************************************************************
 * This createDualEntryUsersObject() function creates a Dual Entry Users object that can return
 *  a truncated version of the user's name (First L.) and can also return what role (de1, de2, 
 *  admin, review) the user has access to within Dual Entry as set on the 
 *  custom record 'customrecord_exchangereps'
 ***********************************************************************************************/
function createDualEntryUsersObject() {
	var users = {};
	try {
		var columns = [];
		columns.push(new nlobjSearchColumn('custrecord_acq_lot_de_employee'));
		columns.push(new nlobjSearchColumn('custrecord_acq_lot_de_user_type'));
		results =  nlapiSearchRecord('customrecord_acq_lot_de_users', null, null, columns);
	} catch(e) {
		var err = e;
		nlapiLogExecution('ERROR', 'searchDualEntryUsers() FAILED', JSON.stringify(err));
	}
	try {
		for(var usl = 0; usl < results.length; usl++) {
			var oneResult = results[usl];
			var userid = '_' + oneResult.getValue('custrecord_acq_lot_de_employee');
			users[userid] = {};
			var username = oneResult.getText('custrecord_acq_lot_de_employee');
			// Use regex to truncate the user name to be first name and last initial to save space in the table.
			var pattern = /\s/gi;
			var n = username.search(pattern);
			username = username.substr(0, (n+2)) + '.';
			users[userid].name = username;
			var usrType = oneResult.getValue('custrecord_acq_lot_de_user_type');
			if(usrType == 1) {
				users[userid].role = 'de1';
			} else if(usrType == 2) {
				users[userid].role = 'de2';
			} else if(usrType == 3) {
				users[userid].role = 'admin';
			} else {
				users[userid].role = null;
			}
		}
		return users;
	} catch (e) {
		var err = e;
		nlapiLogExecution('ERROR', 'Problem with createDualEntryUsersObject()', JSON.stringify(err));
		return users;
	}

}

/*************************************************************************************
 *  SEARCHES
 *************************************************************************************/
function searchExchangeRecordsDualEntry(dealID, userRole) {
	try {
		var filters = [];
		filters.push(new nlobjSearchFilter('custrecord_acq_loth_zzz_zzz_shrhldstat',null,'is','3'));
		filters.push(new nlobjSearchFilter('custrecord_acq_loth_zzz_zzz_acqstatus',null,'is','3'));
		filters.push(new nlobjSearchFilter('isinactive',null,'is','F'));
		filters.push(new nlobjSearchFilter('custrecord_acq_loth_zzz_zzz_deal',null,'noneof','306210')); // This removes the test data for Bend Research from the results.  Comment this out to see the test data.
		
		if(dealID != null && dealID != '') {
			filters.push(new nlobjSearchFilter('custrecord_acq_loth_zzz_zzz_deal',null, 'is', dealID));
		}
		
		/*
		 * If the user is currently logged in as Off-Site Dual Entry Only, they can only see the exchange records that are marked as Allow for Off-Site.
		 */
		if(nlapiGetRole() == NS_ROLE_OFFSITE_DUALENTRY_ONLY){
			filters.push(new nlobjSearchFilter('custrecord_acq_lot_allow_offsite_de',null, 'is', 'T'));
		}
		var columns = [];
		columns.push(new nlobjSearchColumn('custrecord_acq_loth_currentdestage1'));
		columns.push(new nlobjSearchColumn('custrecord_acq_loth_currentdestage2'));
		columns.push(new nlobjSearchColumn('custrecord_acq_loth_currentdeuser1'));
		columns.push(new nlobjSearchColumn('custrecord_acq_loth_currentdeuser2'));
		columns.push(new nlobjSearchColumn('custrecord_acq_loth_1_src_shrhldname'));
		columns.push(new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_shareholder'));
		columns.push(new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_deal'));
		columns.push(new nlobjSearchColumn('custrecord_acq_loth_0_de1_notes'));
		columns.push(new nlobjSearchColumn('custrecord_acq_loth_0_de2_notes'));
		columns.push(new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_rcvddocimage'));
		columns.push(new nlobjSearchColumn('custrecord_acq_loth_reviewcomplete'));
		columns.push(new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_contact'));
		columns.push(new nlobjSearchColumn('custrecord_acq_loth_4_de1_lotpaymethod'));
		columns.push(new nlobjSearchColumn('custrecord_acq_lot_allow_offsite_de'));
		
		return nlapiSearchRecord('customrecord_acq_lot', null, filters, columns);
	} catch(e) {
		var err = e;
		nlapiLogExecution('ERROR', 'searchExchangeRecords() FAILED', JSON.stringify(err));
	}
	return null;
}

function searchDualEntryStatusRecord(exRecID) {
// 	SEARCH LOT FOR ATTACHED CERTIFICATES.
	var filters = new Array();
	filters.push(new nlobjSearchFilter('custrecord_acq_lot_de',null,'is',exRecID));
	filters.push(new nlobjSearchFilter('isinactive',null,'is','F'));	
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid'));
	columns.push(new nlobjSearchColumn('custrecord_acq_lot_de_de1_user'));
	columns.push(new nlobjSearchColumn('custrecord_acq_lot_de_de2_user'));
	columns.push(new nlobjSearchColumn('custrecord_acq_lot_de_de1_status'));
	columns.push(new nlobjSearchColumn('custrecord_acq_lot_de_de2_status'));
	columns.push(new nlobjSearchColumn('custrecord_acq_lot_de_de1_notes'));
	columns.push(new nlobjSearchColumn('custrecord_acq_lot_de_de2_notes'));
	columns.push(new nlobjSearchColumn('custrecord_acq_lot_de_reviewcomplete'));
	columns.push(new nlobjSearchColumn('custrecord_acq_lot_de_last_reviewer'));
	columns.push(new nlobjSearchColumn('custrecord_acq_lot_de_current_reviewer'));
	columns.push(new nlobjSearchColumn('custrecord_acq_lot_de_de1_timedate'));
	columns.push(new nlobjSearchColumn('custrecord_acq_lot_de_de2_timedate'));
	columns.push(new nlobjSearchColumn('custrecord_acq_lot_de_review1_notes'));
	columns.push(new nlobjSearchColumn('custrecord_acq_lot_de_review2_notes'));
	
	return nlapiSearchRecord('customrecord_acq_lot_de_dualentry_status',null,filters,columns);
}

function searchRelatedDocuments(exRecID) {
// 	SEARCH LOT FOR ATTACHED CERTIFICATES.
	var filters = new Array();
	filters.push(new nlobjSearchFilter('custrecord_acq_lot_exrec',null,'is',exRecID));
	filters.push(new nlobjSearchFilter('isinactive',null,'is','F'));	
	var columns = [];
	columns.push(new nlobjSearchColumn('internalid'));
	columns.push(new nlobjSearchColumn('custrecord_acq_lot_de_required'));
	columns.push(new nlobjSearchColumn('custrecord_doc_type'));
	columns.push(new nlobjSearchColumn('custrecord_linked_file'));
	columns.push(new nlobjSearchColumn('custrecord_file'));
	
	return nlapiSearchRecord('customrecord_document_management',null,filters,columns);
}

function searchDocumentURL(mediaID) {
// 	SEARCH LOT FOR ATTACHED CERTIFICATES.
	var filters = new Array();
	filters.push(new nlobjSearchFilter('internalid',null,'is',mediaID));
	var columns = [];
	columns.push(new nlobjSearchColumn('url'));
	columns.push(new nlobjSearchColumn('name'));
	return nlapiSearchRecord('file',null,filters,columns);
}

function searchRelatedCerts(exRecID) {
// 	SEARCH LOT FOR ATTACHED CERTIFICATES.
// 	IS THIS SEARCH EVEN NEEDED, CAN'T WE JUST LOOP THRU THE EXCHANGE RECORD AND CHECK.
	var certSearchFilters = new Array();
	var certSearchColumns = new Array();
//	DO THE SEARCH FOR ASSOCIATED CERTIFICATE RECORDS HERE
	certSearchFilters[0] = new nlobjSearchFilter('custrecord_acq_lotce_zzz_zzz_parentlot',null,'is',exRecID);
	certSearchFilters[1] = new nlobjSearchFilter('isinactive',null,'is','F');	
//	certSearchFilters[2] = new nlobjsearchFilter('custrecord_acq_lotce_zzz_zzz_lotcestatus',null,'equalto', '5');
	// have commented this out and added to the columns so that I can separate out the error messages to show.
//	certSearchFilters[2] = new nlobjSearchFilter('custrecord_acq_lotce_zzz_zzz_lotcestatus', null, 'is', 5);
	
	certSearchColumns[0] = new nlobjSearchColumn('internalid',null,null);
	certSearchColumns[1] = new nlobjSearchColumn('custrecord_acq_lotce_3_src_certnumber',null);
	certSearchColumns[2] = new nlobjSearchColumn('custrecord_acq_lotce_3_de1_certnumber',null);
	certSearchColumns[3] = new nlobjSearchColumn('custrecord_acq_lotce_3_de2_certnumber',null);
	certSearchColumns[4] = new nlobjSearchColumn('custrecord_acq_lotce_3_src_certtype',null);
	certSearchColumns[5] = new nlobjSearchColumn('custrecord_acq_lotce_3_de1_certtype',null);
	certSearchColumns[6] = new nlobjSearchColumn('custrecord_acq_lotce_3_de2_certtype',null);
	certSearchColumns[7] = new nlobjSearchColumn('custrecord_acq_lotce_3_src_numbershares',null);
	certSearchColumns[8] = new nlobjSearchColumn('custrecord_acq_lotce_3_de1_numbershares',null);
	certSearchColumns[9] = new nlobjSearchColumn('custrecord_acq_lotce_3_de2_numbershares',null);
	certSearchColumns[7] = new nlobjSearchColumn('custrecord_acq_lotce_3_src_numbershares',null);
	certSearchColumns[8] = new nlobjSearchColumn('custrecord_acq_lotce_3_de1_numbershares',null);
	certSearchColumns[9] = new nlobjSearchColumn('custrecord_acq_lotce_3_de2_numbershares',null);
	certSearchColumns[10] = new nlobjSearchColumn('custrecord_acq_lotce_zzz_zzz_payment',null);
	certSearchColumns[11] = new nlobjSearchColumn('custrecord_acq_lotce_zzz_zzz_lotcestatus',null);
	
	return nlapiSearchRecord('customrecord_acq_lot_cert_entry',null,certSearchFilters,certSearchColumns);
}

function searchSingleCert(certID) {
// 	SEARCH LOT FOR ATTACHED CERTIFICATES.
// 	IS THIS SEARCH EVEN NEEDED, CAN'T WE JUST LOOP THRU THE EXCHANGE RECORD AND CHECK.
	var certSearchFilters = new Array();
	var certSearchColumns = new Array();
//	DO THE SEARCH FOR ASSOCIATED CERTIFICATE RECORDS HERE
	certSearchFilters.push(new nlobjSearchFilter('internalid',null,'is',certID));
	certSearchFilters.push(new nlobjSearchFilter('isinactive',null,'is','F'));	
	
	certSearchColumns.push(new nlobjSearchColumn('internalid',null,null));
	certSearchColumns.push(new nlobjSearchColumn('custrecord_acq_lotce_3_src_certnumber',null));
	certSearchColumns.push(new nlobjSearchColumn('custrecord_acq_lotce_3_de1_certnumber',null));
	certSearchColumns.push(new nlobjSearchColumn('custrecord_acq_lotce_3_de2_certnumber',null));
	certSearchColumns.push(new nlobjSearchColumn('custrecord_acq_lotce_3_src_certtype',null));
	certSearchColumns.push(new nlobjSearchColumn('custrecord_acq_lotce_3_de1_certtype',null));
	certSearchColumns.push(new nlobjSearchColumn('custrecord_acq_lotce_3_de2_certtype',null));
	certSearchColumns.push(new nlobjSearchColumn('custrecord_acq_lotce_3_src_numbershares',null));
	certSearchColumns.push(new nlobjSearchColumn('custrecord_acq_lotce_3_de1_numbershares',null));
	certSearchColumns.push(new nlobjSearchColumn('custrecord_acq_lotce_3_de2_numbershares',null));
	certSearchColumns.push(new nlobjSearchColumn('custrecord_acq_lotce_3_src_numbershares',null));
	certSearchColumns.push(new nlobjSearchColumn('custrecord_acq_lotce_3_de1_numbershares',null));
	certSearchColumns.push(new nlobjSearchColumn('custrecord_acq_lotce_3_de2_numbershares',null));
	certSearchColumns.push(new nlobjSearchColumn('custrecord_acq_lotce_zzz_zzz_payment',null));
	certSearchColumns.push(new nlobjSearchColumn('custrecord_acq_lotce_zzz_zzz_lotcestatus',null));
	
	return nlapiSearchRecord('customrecord_acq_lot_cert_entry',null,certSearchFilters,certSearchColumns);
}

function searchCertificateRecs(exRecID, certID) {
//	DO THE SEARCH FOR ASSOCIATED CERTIFICATE RECORDS HERE
	var filters = new Array();
	filters.push(new nlobjSearchFilter('custrecord_acq_lotce_zzz_zzz_parentlot',null,'is',exRecID));
	filters.push(new nlobjSearchFilter('isinactive',null,'is','F'));
	filters.push(new nlobjSearchFilter('internalid',null,'is', certID));
	var columns = new Array();
	columns.push(new nlobjSearchColumn('custrecord_acq_lotce_zzz_zzz_payment',null));
	columns.push(new nlobjSearchColumn('custrecord_acq_lotce_zzz_zzz_lotcestatus',null));
	return nlapiSearchRecord('customrecord_acq_lot_cert_entry',null,filters,columns);
}

function buildMaintenancePage() {
	var form = nlapiCreateForm('Exchange Records for Dual Entry');  //Setup the generation form
	var modalField = form.addField('custpage_maintenance_message', 'inlinehtml', '');
	var mantHTML = '';
	mantHTML += '<h4>Dual Entry is currently down for upgrades.</h4>';
	modalField.setDefaultValue(mantHTML);
	modalField.setLayoutType('normal', 'startcol');
	return form;
}
