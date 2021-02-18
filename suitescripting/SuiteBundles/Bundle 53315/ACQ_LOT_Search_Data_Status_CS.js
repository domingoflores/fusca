/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       03 Jul 2014     smccurry
 * 1.10		  11 Jul 2014     smccurry         Moved the api call to MCP to a Restlet due to using up too many governance points.
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType 
 * 
 * @param {String} type Access mode: create, copy, edit
 * @returns {Void}
 */

// Even listener that grabs the button id of the button that has been clicked.
jQuery(document).ready(function(){
	jQuery( "#createtable" ).click(function() {
//		alert(this.id);
		var data = buildGetRequest(this.id);
		if(data.deal != null && data.deal != '') {
			postFormDataAjax(JSON.stringify(data));
		} else {
			alert('You must select a deal.');
		}
	});
});

function postFormDataAjax(data) {
    jQuery.ajax({
    	headers: {
    		'Accept': 'application/json',
            'Content-Type': 'application/json' 
        },
        type: "POST",
        url: '/app/site/hosting/restlet.nl?script=485&deploy=1',
        data: data,
        dataType: 'JSON',
        success: function(response) {
//			alert('Success: ' + response);
        	var responseDataObj = JSON.parse(response);
			var html = responseDataObj.html;
			var calltype = responseDataObj.calltype;
			if(calltype == 'buildtable') {
				handleResponse(html);
				loadButtons();
				loadHeaderButtons();
			}
			if(calltype == 'callMCPapi') {
//				alert('Success return of callMCPapi');
				handleDataReadyResponse(responseDataObj);
				
			}
        },
        error: function(response) {
//        	alert('There was a problem.');
        	var responseText = JSON.parse(response.responseText);
        	var errors = responseText.error;
        	alert('There was a problem with the Ajax response.\n\n' + errors.code + '\n' + errors.message);
		},
    });
}

function loadButtons() {
	jQuery(".checkstatus").click(function(){
//	alert('Processing: ' + this.id);
	document.getElementById(this.id).innerHTML = '&nbsp;Processing&nbsp;';
	var dataReady = buttonCheckStatus(this.id);
	console.log(JSON.stringify(dataReady));
	});
//	jQuery('#statustable').dataTable();
}

function loadHeaderButtons() {
	jQuery( "#createtable" ).click(function() {
//		alert(this.id);
		var data = buildGetRequest(this.id);
		if(data.deal != null && data.deal != '') {
			postFormDataAjax(JSON.stringify(data));
		} else {
			alert('You must select a deal.');
		}
	});
	jQuery( "#checkall" ).click(function() {
//		alert(this.id);
		checkAllDataStatus();
	});
}

function buildGetRequest(btntype) {
	var data = {};
	data.calltype = 'buildtable';
	data.deal = nlapiGetFieldValue('custpage_deal');
//	alert('buildGetRequest: ' + JSON.stringify(data));
	return data;
}

function buttonCheckStatus(btnID) {
//	alert('btnID: ' + btnID);
	var data = {};
	data.calltype = 'callMCPapi';
	data.btnID = btnID;
	postFormDataAjax(JSON.stringify(data));
}

function handleResponse(html) {
	nlapiSetFieldValue('custpage_status_list', html, false);
	jQuery('#custpage_button_val').replaceWith('<button id="createtable" type="button" class="btn btn-sm btn-default">Reload</button>&nbsp;&nbsp;<button id="checkall" type="button" class="btn btn-sm btn-default">Check All</button>');
}

function checkAllDataStatus() {
//	alert('start of : checkDataStatus');
	var allFields = document.getElementsByClassName('checkstatus');
	for(var i = 0; i < allFields.length; i++) { //allFields.length
		var field = allFields[i];
		var btnID = field.id;
//		var delay=500;
//		setTimeout(function(){
			try {
				console.log('Attempting to check status on: ' + btnID);
				document.getElementById(btnID).innerHTML = '&nbsp;Processing&nbsp;';
				var dataReady = buttonCheckStatus(btnID);
				console.log('dataReady returned from: ' + JSON.stringify(dataReady));
			} catch (e) {
				document.getElementById(btnID).innerHTML = '&nbsp;Check Again&nbsp;';
			}
//		},delay); 
	}
}

function handleDataReadyResponse(responseDataObj) {
//	alert('Processing: ' + JSON.stringify(responseDataObj));
	var dataReadyStatus = responseDataObj.datareadystatus;
	var status = dataReadyStatus.status;
	var message = '';
	if(dataReadyStatus.message) {
		message = dataReadyStatus.message;
	}
	var data = {};
	var sent_status = {};
	if(dataReadyStatus.data) {
		data = dataReadyStatus.data;
		if(data.sent_status) {
			sent_status = data.sent_status;
		}
	}
	
	if(status != null && status != '') {
		if(status == true) {
			var statusField = document.getElementById(responseDataObj.recID + '_' + responseDataObj.hashID);
			statusField.innerHTML = 'Ready';
			jQuery('#' + responseDataObj.btnID).remove();
			document.getElementById('lotnumb_' + responseDataObj.recID + '_' + responseDataObj.hashID).innerHTML = data.lots;
			document.getElementById('certnumb_' + responseDataObj.recID + '_' + responseDataObj.hashID).innerHTML = data.certs;
			if(sent_status != null && sent_status != '') {
				var sentStatusString = '';
				for(key in sent_status) {
					if(sent_status.hasOwnProperty(key)) {
						sentStatusString += key + ': ' + sent_status[key];
					}
				}
				document.getElementById('sentstatus_' + responseDataObj.recID + '_' + responseDataObj.hashID).innerHTML = sentStatusString;
			}
			var row = document.getElementById('tr_' + responseDataObj.recID);
			row.className = 'success';
		} else if (status == false) {
			var statusField = document.getElementById(fieldID);
			var row = document.getElementById('tr_' + responseDataObj.recID);
			row.className = 'danger';
			if(message != null && message != '') {
				document.getElementById(responseDataObj.recID + '_' + responseDataObj.hashID).innerHTML = 'Status Message: ' + message;
				document.getElementById(responseDataObj.btnID).innerHTML = '&nbsp;Check Again&nbsp;';
			}
		} else {
			
		}
	} else {
		var row = document.getElementById('tr_' + responseDataObj.recID);
		row.className = 'danger';
		document.getElementById(responseDataObj.recID + '_' + responseDataObj.hashID).innerHTML = 'Status Message: ' + message;
		document.getElementById(responseDataObj.btnID).innerHTML = '&nbsp;Check Again&nbsp;';
	}
}


