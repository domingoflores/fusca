/**
 * Display a list of manual fixes so that the user can export the results and fix them in AvidInvoice
 * 
 * Version    Date            Author           Remarks
 * 1.00       02 Dec 2015     mmenlove
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function suitelet(request, response){
	if(request.getMethod() == 'GET'){
		displayForm(request, response);
	}
	else{
		generateCSV(request, response);
	}
	
}


var formFilters = [
   {
	  	field: 'created_start_date',
     	label: 'Created Start Date',
     	type: 'date',
     	storeInSession: true,
     	connectedField: 'created_end_date',
     	connectedRule: 'interconnected'
  },
  {
   		field: 'created_end_date',
      	label: 'Created End Date',
      	type: 'date',
      	storeInSession: true,
      	connectedField: 'created_start_date',
      	connectedRule: 'interconnected'
 }];



function displayForm(request, response){
	var form = nlapiCreateForm('Fixlog');
	
	form.setScript('customscript_pp_cs_ai_invoice_list');
	
	var listLink = nlapiResolveURL('suitelet','customscript_pp_sl_ai_invoice_list','customdeploy_pp_sl_ai_invoice_list');
	form.addPageLink('crosslink', 'Invoice List', listLink);
	
	var errLink = nlapiResolveURL('suitelet','customscript_pp_sl_ai_invoice_error_list','customdeploy_pp_sl_ai_invoice_error_list');
	form.addPageLink('crosslink', 'Error List', errLink);
	
	var opts = {
			 filters : formFilters,
	         group : {
	        	 name: 'filters',
	        	 label: 'Filters'
	         }
	};

	var nsFormFilter = new NSFormFilter(opts,form);
	nsFormFilter.renderFilters();

	var sublist = form.addSubList('custpage_changes', 'list', 'Changes');
	
	sublist.addField('batch', 'text', 'Batch');
	sublist.addField('invoice_number', 'text', 'Invoice #');
	sublist.addField('status', 'text', 'Status');
	sublist.addField('error_code', 'text', 'Error Code');
	sublist.addField('user_error_message', 'textarea', 'User Error Message');
	sublist.addField('field', 'text', 'Field');
	sublist.addField('ai_value', 'text', 'AvidInvoice Value');
	sublist.addField('ns_value', 'text', 'New NetSuite Value');
	//sublist.addField('changes', 'textarea', 'Changes');
	sublist.addField('date', 'text', 'Date');
	
	var filterParams = nsFormFilter.getFilterValues();
	var extraFilters = [];
	
	if(filterParams['created_start_date'] && filterParams['created_end_date']){
		extraFilters.push(new nlobjSearchFilter('created', null, 'within', filterParams['created_start_date'],filterParams['created_end_date']));
	}
	
	var dataArr = getData(extraFilters);
	
	//sublist.setValues(dataArr);
	sublist.setLineItemValues(dataArr);
	
	form.addSubmitButton('Export CSV');
	response.writePage(form);
}

function getData(extraFilters){
	var search = nlapiLoadSearch('customrecord_pp_ai_changeset','customsearch_ai_changeset');
	if(extraFilters && extraFilters.length > 0){
		search.addFilters(extraFilters);
	}
	var searchResultSet = search.runSearch();
	var searchResults = searchResultSet.getResults(0, 1000);
	
	// convert searchresults to display value
	
	var dataArr = [];
	for(var i = 0; i < searchResults.length; i++){
		var sr = searchResults[i];
		var obj = null;
		
		/*for(var j = 0; j < dataArr.length; j++){
			if(sr.getId() == dataArr[j].id){
				obj = dataArr[j];
				break;
			}
		}*/
		
		//if(!obj){
			//try and find id
			obj = {
					id : sr.getId(),
					batch: sr.getText('custrecord_ai_inv_batch','custrecord_ai_imported_inv'),
					invoice_number : sr.getValue('custrecord_ai_inv_number','custrecord_ai_imported_inv'),
					inv_id : sr.getValue('custrecord_ai_imported_inv'),
					status : 'Fixed',
					error_code : sr.getValue('custrecord_ai_error_code'),
					user_error_message : sr.getValue('custrecord_ai_user_error_message'),
					date : sr.getValue('created'),
					field: null,
					changeObj : null,
					ai_value: null,
					ns_value: null
					//changesArr : []
			};
			
		//}
		
		var changeObj = {
				field_id : sr.getValue('custrecord_ai_ch_field_id','custrecord_ai_ch_changeset'),
				old_value : sr.getValue('custrecord_ai_ch_old_value','custrecord_ai_ch_changeset'),
				new_value : sr.getValue('custrecord_ai_ch_new_value','custrecord_ai_ch_changeset'),
				new_text : sr.getValue('custrecord_ai_ch_new_text','custrecord_ai_ch_changeset'),
				reference_value : sr.getValue('custrecord_ai_ch_reference_value','custrecord_ai_ch_changeset'),
				reference_text : sr.getValue('custrecord_ai_ch_reference_text','custrecord_ai_ch_changeset')
		};
		
		//changeObj.summary = '';
		
		//var displayName = '';
		//var aiValue = '';
		//var nsValue = '';
		switch(changeObj.field_id){
		case 'custrecord_ai_inv_vendor':
			obj.field = 'Vendor';
			obj.ai_value =  '(' + changeObj.reference_value + ')' + ' ' + changeObj.reference_text;
			obj.ns_value =  '(' + changeObj.new_value + ')' + ' ' + changeObj.new_text;
			break;
		case 'custrecord_ai_inv_purchase_order':
			obj.field = 'Purchase Order';
			obj.ai_value = changeObj.reference_value;
			obj.ns_value = changeObj.new_text;
			break;
		case 'custrecord_ai_inv_amount':
			obj.field  = 'Amount';
			obj.ai_value =  changeObj.old_value;
			obj.ns_value = changeObj.new_value;
			break;
		default :
			obj.field = changeObj.field_id;
			obj.ai_value =  changeObj.old_value;
			obj.ns_value = changeObj.new_value;
			break;
		}
		
	
		//changeObj.summary = displayName + ': AvidInvoiceValue="' + aiValue +'", NetSuite New Value="' + nsValue + '"';
		//obj.changesArr.push(changeObj);
		obj.changeObj = changeObj;
		dataArr.push(obj);
	}
	
	// loop  through dataArr and build changestext
	/*for(var i = 0; i < dataArr.length; i++){
		var obj = dataArr[i];
		var changeSummaryArr = [];
		for(var j = 0; j < obj.changesArr.length; j++){
			changeSummaryArr.push(obj.changesArr[j].summary);
		}
		obj.changes = changeSummaryArr.join("\r\n");
	}*/
	
	return dataArr;
}

function generateCSV(request, response){
	var csvFilename = 'fixlog_export';
	var opts = {
			 filters : formFilters,
	         group : {
	        	 name: 'filters',
	        	 label: 'Filters'
	         }
	};

	var nsFormFilter = new NSFormFilter(opts,null);
	var filterParams = nsFormFilter.getFilterValues();
	var extraFilters = [];
	
	if(filterParams['created_start_date'] && filterParams['created_end_date']){
		extraFilters.push(new nlobjSearchFilter('created', null, 'within', filterParams['created_start_date'],filterParams['created_end_date']));
		var startDate = nlapiStringToDate(filterParams['created_start_date']);
		var endDate = nlapiStringToDate(filterParams['created_end_date']);
		
		csvFilename += '_' + moment(startDate).format('YYYY-MM-DD') + '_' + moment(endDate).format('YYYY-MM-DD');
	}
	
	var dataArr = getData(extraFilters);
	
	var rows = [];
	// push headers
	rows.push(["Batch","Invoice Number","Status","Error Code","User Error Message", "Field","AvidInvoice Value","New NetSuite Value", "Change Date"]);
	// push data
	for(var i = 0; i < dataArr.length; i++){
		var dataObj = dataArr[i];
		var row = [];
		row.push(dataObj.batch);
		row.push(dataObj.invoice_number);
		row.push(dataObj.status);
		row.push(dataObj.error_code);
		row.push(dataObj.user_error_message);
		row.push(dataObj.field);
		row.push(dataObj.ai_value);
		row.push(dataObj.ns_value);
		row.push(dataObj.date);
		rows.push(row);
	}
	// generate csv string
	var csvStr = exportToCsv(rows);
	
	response.setContentType('CSV', csvFilename + '.csv');
	response.write(csvStr);
}


function exportToCsv(rows) {
    var processRow = function (row) {
        var finalVal = '';
        for (var j = 0; j < row.length; j++) {
            var innerValue = row[j] === null ? '' : row[j].toString();
            if (row[j] instanceof Date) {
                innerValue = row[j].toLocaleString();
            };
            var result = innerValue.replace(/"/g, '""');
            if (result.search(/("|,|\n)/g) >= 0)
                result = '"' + result + '"';
            if (j > 0)
                finalVal += ',';
            finalVal += result;
        }
        return finalVal + '\n';
    };

    var csvStr = '';
    for (var i = 0; i < rows.length; i++) {
    	csvStr += processRow(rows[i]);
    }
    
    return csvStr;
}