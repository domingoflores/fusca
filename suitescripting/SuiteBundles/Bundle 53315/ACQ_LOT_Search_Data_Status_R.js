/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       10 Jul 2014     smccurry
 *
 */

/**
 * @param {Object} dataIn Parameter object
 * @returns {Object} Output object
 */
var msg = new ERROR_MESSAGES();

function postRESTlet(dataIn) {
	var responseData = {};
	
	msg.setStatusSuccess();
	
	if(dataIn.calltype != null && dataIn.calltype == 'buildtable') {
		var dealID = dataIn.deal;
		var tableHTML = buildListTable(dealID);
		responseData.calltype = 'buildtable';
		responseData.html = tableHTML;
		return JSON.stringify(responseData);
	} else if(dataIn.calltype != null && dataIn.calltype == 'callMCPapi') {
		var btnID = dataIn.btnID;
		var idArr = btnID.split('_');
		var hashID = idArr[2];
		var recID = idArr[1];
		hashID = hashID.trim();
		try {
			var dataReadyObj = checkDataStatusOnClearingHouse(hashID);
		} catch (e) {
			var err = e;
			msg.addMessage('Problem calling nlapiRequestURL(https://clearinghouse.srsacquiom.com/data/ready/) Response was: ' + JSON.stringify(dataReadyObj));
			msg.setStatusError();
			nlapiLogExecution('ERROR', 'nlapiRequestURL error.', JSON.stringify(err));
		}
		responseData.calltype = 'callMCPapi';
		responseData.btnID = btnID;
		responseData.hashID = hashID;
		responseData.recID = recID;
		responseData.datareadystatus = dataReadyObj;
		responseData.errorMsg = msg;
		return JSON.stringify(responseData);
	}
	return {};
}

function buildListTable(dealID) {
	var tableHTML = '';
	try {
    	ACQ_LOT_DE_TABLE_CSS = nlapiLoadFile('SuiteBundles/Bundle 53315/css/ACQ_LOT_DE_TABLE_CSS.css');
    } catch (e) {
    	// TODO: ADD ERROR MESSAGE HERE
    	nlapiLogExecution('ERROR', 'Problems loading html or css file.', 'bootStrapcss');
    }
    tableHTML += '<head>';
    tableHTML += '<style>';
    tableHTML += ACQ_LOT_DE_TABLE_CSS.getValue();
    tableHTML += '.text { font-size:10pt } .checkboximage { srs=""';
    tableHTML += '</style>';
    tableHTML += '<meta charset="utf-8">';
    tableHTML += '<title>Letter of Transmittal - Payments</title>';
    tableHTML += '<meta name="author" content="smccurry">';
    tableHTML += '</head>';
    tableHTML += '<body>';
    tableHTML += '<br>';
    tableHTML += '<div id="lotlist" class="container">';
    tableHTML += '<table id="statustable" class="table display table-condensed" style="font-size:12px;">';
    tableHTML += '<thead style="font-size:13px;font-style:bold;">';
    tableHTML += '<tr>';
    tableHTML += '<th>#</th>';
    tableHTML += '<th>EX REC</th>';
    tableHTML += '<th>DEAL</th>';
    tableHTML += '<th>SHAREHOLDER</th>';
    tableHTML += '<th>ACQUIOM STATUS</th>';
    tableHTML += '<th>DELIVERY METHOD</th>';
    tableHTML += '<th>HASH #</th>';
    tableHTML += '<th style="width:100px;">DATA READY</th>';
    tableHTML += '<th class="text-right" style="width:50px;">#LOT</th>';
    tableHTML += '<th class="text-right" style="width:50px;">#CERT</th>';
    tableHTML += '<th class="text-right" style="width:70px;">MCP STATUS</th>';
    tableHTML += '<th class="text-right">CHECK BUTTON</th>';
    tableHTML += '</tr>';
    tableHTML += '</thead>';
    tableHTML += '<tbody>';
    
    try {
    	var results = searchExRecords(dealID);
    } catch (e) {
    	msg.addMessage('Problem with nlapiSearchRecord.');
		msg.setStatusError();
    }
    if(results != null && results != '') {
    	for(var x = 0; x < results.length; x++) {
    		var oneResult = results[x];
    		tableHTML += buildAdminListRow(oneResult, x);
    	}
    } else {
    	return '<h3>There are no records that match the criteria.  Exchange Records must have an \'Acquiom Status\' of \'1. Exchange Record Created\'  and a LOT Delivery Method of \'Web\' to show up in this search.</h3>';
    }
    
    tableHTML += '</tbody>';
    tableHTML += '</table>';
    tableHTML += '</div>';
    
    // Populate State select options in template with the correct list from NetSuite
    tableHTML += '</body>';
//  <!-- DataTables CSS -->
//    tableHTML += '<link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.10.0/css/jquery.dataTables.css">';
//	<!-- jQuery -->
    tableHTML += '<script type="text/javascript" charset="utf8" src="https://code.jquery.com/jquery-1.10.2.min.js"></script>';
//	<!-- DataTables -->
//    tableHTML += '<script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/1.10.0/js/jquery.dataTables.js"></script>';
//	<!-- jQuery UI -->
    tableHTML += '<script src="https://code.jquery.com/ui/1.11.0/jquery-ui.js"></script>';
//	<!-- jQuery Stylesheet -->
    tableHTML += '<link rel="stylesheet" href="https://code.jquery.com/ui/1.11.0/themes/smoothness/jquery-ui.css">';
//  <!-- DataTables jQuery -->
//    tableHTML += '<script src="https://cdn.datatables.net/1.10.0/js/jquery.dataTables.js"></script>';
    
    tableHTML += '<link href="//netdna.bootstrapcdn.com/bootstrap/3.0.0/css/bootstrap.min.css" rel="stylesheet">';
//    tableHTML += '</html>';
    return tableHTML;
}

function buildAdminListRow(row, x) {
	var rowID = row.getId();
	var rowHTML = '';
	rowHTML += '<tr class="active" id="tr_'+ rowID +'">';
	// NUMBER COLUMN
	rowHTML += '<td>' + (x+1) + '</td>';
	// EXCHANGE RECORD ID COLUMN
	rowHTML += '<td>'+ rowID +'</td>';
	// DEAL COLUMN - TODO: CHANGE THIS TO BE TRUNCATED IN THE BROWSER ONLY SO THAT IF WE NEED THE FULL NAME HERE WE HAVE IT
	var dealText = row.getText('custrecord_acq_loth_zzz_zzz_deal');
	if(dealText != null && dealText.length > 30) {
		dealText = dealText.slice(0,30);
	}
	rowHTML += '<td class="deal">'+ dealText +'</td>';
	// SHAREHOLDER COLUMN
	var sholderText = row.getText('custrecord_acq_loth_zzz_zzz_shareholder');
	if(sholderText != null && sholderText.length > 30) {
		sholderText = sholderText.slice(0,30);
	}
	rowHTML += '<td>'+ sholderText +'</td>';
	var acqstatus = row.getText('custrecord_acq_loth_zzz_zzz_acqstatus');
	// ACQUIOM STATUS COLUMN
	rowHTML += '<td>' + acqstatus + '</td>';
	// #DELIVERY METHOD
	var lotdelivery = row.getText('custrecord_acq_loth_zzz_zzz_lotdelivery');
	rowHTML += '<td>'+ lotdelivery +'</td>'; //style="width:50px"
	// HASH ID
	var identcode = row.getValue('custrecord_acq_loth_zzz_zzz_identcode');
	rowHTML += '<td>' + identcode + '</td>';
	// DATA STATUS COLUMN
	rowHTML += '<td id="'+ rowID + '_' + identcode +'" class="text-center data-ready" style="width:75px"></td>';
	// #LOT COLUMN
	rowHTML += '<td id="lotnumb_'+ rowID + '_' + identcode +'" class="text-right data-ready" style="width:50px"></td>';
	// #CERT COLUMN
	rowHTML += '<td id="certnumb_'+ rowID + '_' + identcode +'" class="text-right data-ready" style="width:50px"></td>';
	// #SENT STATUS COLUMN
	rowHTML += '<td id="sentstatus_'+ rowID + '_' + identcode +'" class="text-right data-ready" style="width:70px"></td>';
	// CHECK STATUS COLUMN
	rowHTML += '<td id="checkbtn_' + rowID + '_' + identcode +'" class="text-right">';
	rowHTML +=	'<button id="check_'+ rowID + '_' + identcode +'" type="button" class="btn btn-sm btn-default checkstatus">Check Status</button>';
	rowHTML += '</td>';
	rowHTML += '</tr>';
	return rowHTML;
}

function getUserName(userID) {
	var userName = nlapiLookupField('employee', userID, 'entityid'); 
	return userName;
}

function searchExRecords(dealID) {
	var filters = [];
	filters.push(new nlobjSearchFilter('custrecord_acq_loth_zzz_zzz_deal',null,'is',dealID));
//	filters.push(new nlobjSearchFilter('custrecord_acq_loth_zzz_zzz_acqstatus', null, 'anyof', '1'));
//	filters.push(new nlobjSearchFilter('custrecord_acq_loth_zzz_zzz_lotdelivery', null, 'anyof', '5'));
	var columns = [];
	columns.push(new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_deal'));
	columns.push(new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_shareholder'));
	columns.push(new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_contact'));
//	columns.push(new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_shrhldstat'));
	columns.push(new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_acqstatus'));
	columns.push(new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_lotdelivery'));
	columns.push(new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_identcode'));
//	columns.push(new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_acqstatus'));
	return nlapiSearchRecord('customrecord_acq_lot', null, filters, columns);
}

function checkDataStatusOnClearingHouse(hashid) {	
	var url = 'https://clearinghouse.srsacquiom.com/send/ready/' + hashid;
	var dataReadyResponse = nlapiRequestURL(url);	
	var dataReady = JSON.parse(dataReadyResponse.getBody()); 
	return dataReady;;
}

