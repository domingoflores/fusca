/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * @ FILENAME      : SRSMemoLibrary.js
 * @ AUTHOR        : Steven C. Buttgereit
 * @ DATE          : 2012/02/08
 *
 * Copyright (c) 2012 Shareholder Representative Services LLC
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

//
// getLastMemo: This function retrieves the most recent memo recorded for the supplied entity.
//

function getLastMemo(_entityId,_entityType,_numberOfMemos) { //Valid types: Contact, Deal, Firm, Opportunity, Case & Transaction
	nlapiLogExecution('DEBUG','SRSMemoLibrary.getLastMemo','Starting getLastMemo...');
	//define the default number of memos to retrieve if not otherwise defined.
	if(_numberOfMemos == undefined || _numberOfMemos == null) {
		_numberOfMemos = 1;
	}
	//If no kind of entity is identified, default to contact
	if(_entityType == undefined || _entityType == null) {
		nlapiLogExecution('DEBUG','SRSMemoLibrary.getLastMemo','No entity type provided, defaulting to Contact.');
		_entityType = 'contact';
	} else {
		_entityType = _entityType.toLowerCase();
	}

	if(_entityId == null || _entityId == undefined ) {
		nlapiLogExecution('ERROR','SRSMemoLibrary.getLastMemo','No entity ID was provided to the function, returning null.');
		return null; //must have something to look for, if bad call return null.
	}

	var columns = new Array();
	var filters = new Array();
	var results = null;

	switch (_entityType) {
		case 'contact':
			filters[0] = new nlobjSearchFilter('contact',null,'anyOf',_entityId);
			filters[0].setOr(true);
			filters[1] = new nlobjSearchFilter('custevent_memo_contact',null,'anyOf',_entityId);
			break;
		case 'deal':
			filters[0] = new nlobjSearchFilter('custevent_memo_deal',null,'anyOf',_entityId);
			filters[0].setOr(true);
			filters[1] = new nlobjSearchFilter('company',null,'anyOf',_entityId);
			filters[1].setLeftParens(1);
			filters[2] = new nlobjSearchFilter('category','companycustomer','is','Deal');
			filters[2].setRightParens(1);
			break;
		case 'firm':
			filters[0] = new nlobjSearchFilter('custevent_memo_firm',null,'anyOf',_entityId);
			filters[0].setOr(true);
			filters[1] = new nlobjSearchFilter('company',null,'anyOf',_entityId);
			filters[1].setLeftParens(1);
			filters[2] = new nlobjSearchFilter('category','companycustomer','anyOf',['VC Firm','Investor Group','Buyer','Investment Bank','Law Firm','PE Firm','Seller','SRS Customer']);
			filters[2].setRightParens(1);
			break;
		case 'transaction':
			filters[0] = new nlobjSearchFilter('transaction',null,'anyOf',_entityId);
			filters[0].setOr(true);
			filters[1] = new nlobjSearchFilter('custevent_memo_transaction',null,'anyOf',_entityId);
			break;
		case 'opportunity':
			filters[0] = new nlobjSearchFilter('transaction',null,'anyOf',_entityId);
			filters[0].setOr(true);
			filters[1] = new nlobjSearchFilter('custevent_memo_opportunity',null,'anyOf',_entityId);
			break;
		case 'case':
			filters[0] = new nlobjSearchFilter('supportcase',null,'anyOf',_entityId);
			filters[0].setOr(true);
			filters[1] = new nlobjSearchFilter('custevent_memo_case',null,'anyOf',_entityId);
			break;
		default:
			nlapiLogExecution('ERROR','SRSMemoLibrary.getLastMemo','Didn\'t find a valid entity type to setup phonecall search with.');
			return null;
	}

	columns[0] = new nlobjSearchColumn('internalid');

	results = nlapiSearchRecord('phonecall',null,filters,columns);

	if(results != null) {
		nlapiLogExecution('DEBUG','SRSMemoLibrary.getLastMemo','Found a valid memo, returning it.');
		var returnMemos = new Array();
		for(var rm = 0; rm < results.length && rm < _numberOfMemos; rm++) {
			returnMemos.push(nlapiLoadRecord('phonecall',results[rm].getId()))
		}
		returnMemos.sort(sortInternalIdsDesc);
		return returnMemos;
	} else {
		nlapiLogExecution('DEBUG','SRSMemoLibrary.getLastMemo','No matching memo found, returning null.');
		return null;
	}

}

//
// fixMemos: A utility function that cleans up deals in the company field and re-assigns them to the custevent_memo_deal field.  23983
//

function fixMemos() {

	//First get the target memos
	nlapiLogExecution('DEBUG','SRSMemoLibrary.fixMemos','Starting fixMemos...');
	var filters = new Array();
	var columns = new Array();
	var results = null;

	filters[0] = new nlobjSearchFilter('category','companycustomer','anyOf',['1']);
	filters[1] = new nlobjSearchFilter('custevent_memo_deal',null,'anyOf','@NONE@');

	columns[0] = new nlobjSearchColumn('internalid');
	columns[1] = new nlobjSearchColumn('contact');
	columns[2] = new nlobjSearchColumn('title');
	columns[3] = new nlobjSearchColumn('company');
	columns[4] = new nlobjSearchColumn('company','contact');
	columns[5] = new nlobjSearchColumn('custevent_memo_deal');
	columns[6] = new nlobjSearchColumn('category','company');

	results = nlapiSearchRecord('phonecall',null,filters,columns);
	if(results == null) {
		nlapiLogExecution('DEBUG','SRSMemoLibrary.fixMemos','Found no memos. No work to do, Returning null.');
		return null;
	}

	//Now that we have the memos, lets process them.
	for(var i = 0;i < results.length; i++) {
		var currResult = results[i];
		var currMemo = nlapiLoadRecord('phonecall',currResult.getValue('internalid'));
		if(currMemo.getFieldValue('customform') == 35) {
			nlapiLogExecution('DEBUG','SRSMemoLibrary.fixMemos','Found one, processing...('+currMemo.getId()+').');
			//set the values
			currMemo.setFieldValue('custevent_memo_deal',currResult.getValue('company')); //First copy the company into the deal field.
			if(currResult.getValue('contact') != null && currResult.getValue('contact') != '') {
				currMemo.setFieldValue('company',currResult.getValue('company','contact')); //Copy the contact's primary company into the company record.
			} else {
				currMemo.setFieldValue('company',null); //if there is no contact there can be no firm.
			}

			nlapiSubmitRecord(currMemo);
		}

	}
}

//
//getLastMemoFieldValue: Constructs a the HTML for an inlinehtml field.  The HTML is the last memo and a link to create a new memo.  Takes a type of calling record
//                       , the internal id of that record and an object that defines links for new memos.
//

function getLastMemoFieldValue(recType,recId,targetVals) { // the targetVals object should be of form: targetVals[recordType] = recordId

	var targetMemo = getLastMemo(recId,recType,4);
	var memoText = '<span style="font-weight: bold;">Last 4 Memos: </span><BR/><table id=notes>';

	var fieldText = null;
	var memoToolTipCss = "border-radius: 15px;color: #000000;background-color:#ffffc5;display: none;left:10px;padding:10px;position:absolute;top:10px;width:400px;text-decoration:none;z-index:100;";
	var requestParms = 'l=T&amp;obj_cf=35';

	for(var parmType in targetVals) {
		var parmId = targetVals[parmType];
		nlapiLogExecution('DEBUG','SRSMemoLibrary.getLastMemoFieldValue','Run for '+parmType+' with ID '+parmId);
		switch (parmType) {
		case 'contact':
			requestParms = requestParms+'&amp;obj_custevent_memo_contact='+parmId;
			break;
		case 'deal':
			requestParms = requestParms+'&amp;obj_custevent_memo_deal='+parmId;
			break;
		case 'firm':
			requestParms = requestParms+'&amp;obj_custevent_memo_firm='+parmId;
			break;
		case 'transaction':
			requestParms = requestParms+'&amp;obj_custevent_memo_transaction='+parmId;
			break;
		case 'opportunity':
			requestParms = requestParms+'&amp;obj_custevent_memo_opportunity='+parmId;
			break;
		case 'case':
			requestParms = requestParms+'&amp;obj_custevent_memo_case='+parmId;
			break;
		default:
			nlapiLogExecution('ERROR','SRSMemoLibrary.getLastMemoFieldValue','Didn\'t find a valid record type: '+parmType+'.  That\'s wrong.');
			return null;
		}
	}

	if(targetMemo != null) {
		for(var gm = 0; gm < targetMemo.length;gm++) {
			var currMemo = targetMemo[gm];
			memoText = memoText+'<tr><td valign="top" width="10%" style="font-size:70%">' +  currMemo.getFieldValue('startdate') + '</td><td valign="top" width="18%" style="font-size:70%">' + currMemo.getFieldText('assigned') + '</td><td valign="top" width="72%" style="font-size:70%">' + currMemo.getFieldValue('message') + '</td></tr>'
		}
		memoText = memoText + '</table>'
		fieldText = '<a href="#" onclick="nlOpenWindow(\'/app/crm/calendar/call.nl?'+requestParms+'\', \'activitypopup\',\'width=880,height=620,resizable=yes,scrollbars=yes\');return false;">Last Memo: '+targetMemo[0].getFieldValue('startdate')+' - '+targetMemo[0].getFieldText('assigned')+'</a>';
		fieldText = '<div onMouseOver="var x = document.getElementById(\'srsLastMemo\');x.style.display=\'block\';var offset = -150;x.style.left=(event.pageX+offset)+\'px\';x.style.top=(event.pageY+20)+\'px\';" onMouseOut="var x = document.getElementById(\'srsLastMemo\');x.style.display=\'none\'">'+fieldText+'<div id="srsLastMemo" style="'+memoToolTipCss+'" align="left">'+memoText+'</div></div>'
	} else {
		fieldText = '<a href="#" onclick="nlOpenWindow(\'/app/crm/calendar/call.nl?'+requestParms+'\', \'activitypopup\',\'width=880,height=620,resizable=yes,scrollbars=yes\');return false;">-No Previous Notes Found, Click Here to Create One-</a>';
	}

	return fieldText;
}


//
//  Internal ID Sort Functions:  These are necessary because NetSuite, in their infinite wisdom, returned the internalid column as a string
//								 which naturally means that they don't sort worth a shit when used with their search API setSort function.
//
//
function sortInternalIdsDesc(a,b) {
	  return b.getId() - a.getId();
	}

function sortInternalIdsAsc(a,b) {
	  return a.getId() - b.getId();
	}