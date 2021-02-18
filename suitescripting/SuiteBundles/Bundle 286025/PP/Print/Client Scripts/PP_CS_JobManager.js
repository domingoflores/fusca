/**
 * Client Script for JobManager suitelet
 * 
 * Version    Date            Author           Remarks
 * 1.00       13 Dec 2013     maxm
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType 
 * 
 * @param {String} type Access mode: create, copy, edit
 * @returns {Void}
 */
/*
 * IE < 9 does not support Object.keys
 */
if (!Object.keys) {
  Object.keys = function(obj) {
    var keys = [];

    for (var i in obj) {
      if (obj.hasOwnProperty(i)) {
        keys.push(i);
      }
    }

    return keys;
  };
}

/*
 * Use form to post
 */
function submitAction(jobStatusId,action){
	nlapiSetFieldValue('custpage_printstatusid', jobStatusId, false);
	nlapiSetFieldValue('custpage_action', action, false);
	
	jQuery('form#main_form').submit();
}

/*
 * Display a modal window with a list of check numbers, number of items and total amount
 */
function showIds(jobStatusId){
	try{
		var context = nlapiGetContext();
		var multiCurrencyEnabled = context.getFeature('MULTICURRENCY');
		var amountField = 'amount';
		if(multiCurrencyEnabled){
			amountField = 'fxamount';
		}
		
		// load the record and get the paymentIds json object
		var printStatusRec = nlapiLoadRecord('customrecord_pp_print_status', jobStatusId);
		// unserialize
		var internalIdsObj = JSON.parse(printStatusRec.getFieldValue('custrecord_pp_ps_internal_ids'));
		// extract the ids
		var paymentIds = Object.keys(internalIdsObj);
		
		// do a transaction search
		var filters = [];
		var columns = [];
		
		filters.push(new nlobjSearchFilter('mainline',null,'is','T'));
		filters.push(new nlobjSearchFilter('internalid',null,'anyof',paymentIds));
		
		var tranidCol = new nlobjSearchColumn('tranid');
		tranidCol.setSort(true);
		columns.push(tranidCol);
		columns.push(new nlobjSearchColumn(amountField));
		
		var searchResults = nlapiSearchRecord('transaction', null, filters, columns);
		
		// Build the HTML
		var table = jQuery('<table class="listtable listborder" cellspacing="0"  cellpadding="0" border="0" width="100%"></table>');
		table.append('<tr><td class="listheadertd">Check #</td><td class="listheadertd">Amount</td></tr>');
		var totalAmt = 0.00;
		if(searchResults){
			for(var i = 0; i < searchResults.length; i++){
				var trclass = (i % 2 == 0 ? 'listtext' : 'listtexthl');
				var searchResult = searchResults[i];
				var tr = jQuery('<tr></tr>');
				tr.append('<td class="'+trclass+'">'+searchResult.getValue('tranid')+'</td>');
				tr.append('<td class="'+trclass+'">$'+searchResult.getValue(amountField)+'</td>');
				totalAmt += Math.abs(parseFloat(searchResult.getValue(amountField)));
				tr.appendTo(table);
			}
		}
		else{
			alert('No transactions found');
			return;
		}
		
		var contentDiv = jQuery('<div style="width: 100%; height: 190px;overflow: scroll;"></div>');
		contentDiv.append('<div style="padding-bottom: 5px;">Item Count: '+searchResults.length+'</div>');
		contentDiv.append('<div style="padding-bottom: 5px;">Total Amount: $'+totalAmt.toFixed(2)+'</div>');
		contentDiv.append(table);
		
		// Open Modal Window
		var win = new Ext.Window({
			contentEl: contentDiv[0],
	        layout:'auto',
	        width: '500',
	        title: 'Job Details',
	        modal: true,
	        plain: true,
	        buttons: [
		        {
		            text: 'Close',
		            handler: function(){
		                win.close();
		            }
		        }
	        ]
	    });
		
		win.show();
	}
	catch(e){
		alert("There was an error");
		nlapiLogExecution('ERROR', 'Job details error', e);
	}
}