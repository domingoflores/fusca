
var SALES_ORDER_TYPE = 'SalesOrder';
var VENDOR_TYPE = 'Vendor';
var VENDOR_BILL_TYPE = 'VendorBill';
var LOT_RMA_TYPE = 'LOT';
var LOT_RMA_UPDATE_TYPE = 'LOT Update'
var CUSTOMER_TYPE = 'Customer';

/***************************************************
 * Returns all of the CSV Data(Custom Record) and 
 * returns a JSON array
 * 
 * This function gets Data for both the intitial and
 * final CSV imports
 ***************************************************/
function getData(stageId,dealId){
	
	
	//var searchResults = nlapiLoadSearch(null,'customsearch_aqm_csv_initial_data_load');
	var searchFilters = new Array();
	searchFilters[0] = new nlobjSearchFilter('custrecord_acq_csv_import_stage', null, 'is',stageId );
	searchFilters[1] = new nlobjSearchFilter('custrecord_aqm_csv_deal', null, 'is',dealId);
	
	var searchResults = nlapiSearchRecord(null,'customsearch_aqm_csv_initial_data_load',searchFilters,null);
	if (searchResults == null) return null;
	nlapiLogExecution('Debug', 'run', 'searchResult length - '+searchResults.length);
	
	
	var csvData = {};
	var csvArray = [];
	
	
	var previousHashKey = null;
	var currentHashKey = null;
	for(var i = 0;i<searchResults.length;i++){

	
		//nlapiLogExecution('debug', 'getData', 'id = ' + searchResults[i].getId());
		currentHashKey = searchResults[i].getValue('custrecord_aqm_csv_cert_hash_key');
		
		if(currentHashKey == previousHashKey){
			//nlapiLogExecution('debug', 'getData', 'curentHashKey = ' + currentHashKey + ' previousHashKey = ' + previousHashKey);
			if (csvData.lineItems == null) csvData.lineItems = [];
			csvData.lineItems.push({description:searchResults[i].getValue('custrecord_aqm_csv_cert_description'),quantity:searchResults[i].getValue('custrecord_aqm_csv_number_shares')});
			
		} 
		else if(currentHashKey != previousHashKey){
			//nlapiLogExecution('debug', 'getData', 'in the else if');

			csvData=getJSONRecord();
			
			//populate JSON object with the data from the netsuite search results.
			
			for(var x in csvData){
				
				csvData[x] = searchResults[i].getValue(x,null,null);
				
				//custrecord_acq_certificate_line_no
			}
			if (csvData.lineItems == null) csvData.lineItems = [];
			csvData.lineItems.push({
						description:searchResults[i].getValue('custrecord_aqm_csv_cert_description'),
						quantity:searchResults[i].getValue('custrecord_aqm_csv_number_shares'),
						rowId:searchResults[i].getValue('custrecord_aqm_csv_cert_hash'),
						certLineNumber: searchResults[i].getValue('custrecord_acq_certificate_line_no'),
						securityType: searchResults[i].getValue('custrecord_acq_csv_security_type')
						}
					);
			csvArray.push(csvData);
			
		}
		
		previousHashKey=currentHashKey;
	}

	


	return csvArray;
		 
 }
	
function getJSONRecord(){
	
	var csvData = {
			custrecord_aqm_csv_company_name: '',custrecord_aqm_csv_first_name:'',
			custrecord_aqm_csv_middle_name: '', custrecord_aqm_csv_email : '',
			custrecord_aqm_csv_last_name: '', custrecord_aqm_csv_state: '',
			custrecord_aqm_csv_state: '', custrecord_aqm_csv_country:'',
			custrecord_aqm_csv_address1 : '', custrecord_aqm_csv_address2 :'',
			custrecord_aqm_csv_city: '',custrecord_aqm_csv_zip: '',
			custrecord_aqm_csv_cust_processed: 'F', custrecord_aqm_csv_contact_processed: 'F',
			custrecord_aqm_csv_deal: '',custrecord_aqm_csv_cert_number:'',custrecord_aqm_csv_cert_hash_key:'',
			custrecord_aqm_csv_cert_description:'',custrecord_aqm_csv_number_shares:'',
			custrecord_aqm_csv_lot_id:'',lineItems: [],customerInternalId:'', salesOrderInternalId:'',
			custrecord_acq_payee:'', custrecord_acq_principal:'',custrecord_acq_interest:'',custrecord_acq_total_amount:'',
		    custrecord_acq_bank_name:'',custrecord_aqm_csv_aba:'',custrecord_acq_swift:'',custrecord_acq_demand_account:'',
	        custrecord_acq_account_name:'',custrecord_acq_further_credit:'',custrecord_acq_notes:'',
	        custrecord_acq_1099:'',     custrecord_aqm_csv_taxid:'',custrecord_acq_payment_method:'',
	        custrecord_acq_certificate_line_no:'',custrecord_acq_csv_cash_close:''
			
		};
	return csvData;
	
	
}
/************************
 * Checks a saved search to see if a summarydata for a deal already exists, if it doesnt a new summary deal record will be created.
 *	a JSON Summary data object is returned from this function
 * @param dealId deal ID currently being manipulated for a summary
 * @returns A JSON object with all fields for a summary data record
 * @author Herb Joseph 7/18/2013
 */
function getCSVSummaryData(dealId){
	try{	
		
	var searchFilters = new Array();
	searchFilters[0] = new nlobjSearchFilter('custrecord_sum_acq_deal_id', null, 'is',dealId);
	var searchResults = nlapiSearchRecord(null,'customsearch_acq_csv_summary_data',searchFilters,null);
	
	var sumData = getSummaryJSONData();
	if(searchResults==null){
		sumData.custrecord_sum_acq_deal_id = dealId;

		var recordSum = nlapiCreateRecord('customrecord_acq_summary_data');
		recordSum.setFieldValue('custrecord_sum_acq_deal_id',dealId);
		var recordId = nlapiSubmitRecord(recordSum);
		
		return sumData;
	}
	else
	{
		for(var x in sumData){
			
			sumData[x] = searchResults[0].getValue(x,null,null);
			
			
		}
		
	}
	
	
	return sumData;
	}catch(e){
		nlapiLogExecution('error', 'getData', 'error message = ' + e.message);
	}
	
	
}
function getSummaryJSONData(){
	
	var summaryData = {
			custrecord_sum_acq_deal_id:'',custrecord_sum_acq_cust_success:0,
			custrecord_sum_acq_cust_fail:0,custrecord_sum_acq_so_success:0,
			custrecord_sum_acq_so_fail:0,custrecord_sum_acq_lot_success:0,custrecord_sum_acq_lot_fail:0,
			custrecord_sum_acq_lot_up_success:0,custrecord_sum_acq_lot_up_fail:0,custrecord_sum_acq_lot_ven_success:0,
			custrecord_sum_acq_lot_ven_fail:0,custrecord_sum_acq_ven_bill_success:0,custrecord_sum_acq_ven_bill_fail:0
	};
	return summaryData;
	
}
function updateCSVSummaryData(sumData){
	var dealId = sumData.custrecord_sum_acq_deal_id;
	var searchFilters = new Array();
	searchFilters[0] = new nlobjSearchFilter('custrecord_sum_acq_deal_id', null, 'is',dealId);
	var searchResults = nlapiSearchRecord('customrecord_acq_summary_data', null, searchFilters, null);

	
	var internalId = searchResults[0].getId();
	var dataLoad = nlapiLoadRecord('customrecord_acq_summary_data',internalId);
	
	for(var x in sumData){
		
			dataLoad.setFieldValue(x,sumData[x]);
	}
	var submitId = nlapiSubmitRecord(dataLoad);
	
	
}
/********************************
 * 
 * @param email email to search by
 * @param type type is the type of record to search through.
 * @returns
 */
/*function vendorSearch(entityId, type){
	
	//nlapiLogExecution('Debug', 'entitySearch', 'searching for ' + type + ' - email address - ' + email);
	var searchFilters = new Array();
	searchFilters[0] = new nlobjSearchFilter('entityid', null, 'is', entityId);
	
	try{
		
		var searchResults = nlapiSearchRecord(type, null, searchFilters, null);
		nlapiLogExecution('Debug', 'entitySearch', 'searchResults - ' + searchResults);
		if(searchResults != null && searchResults.length > 0){
			return searchResults[0].getId();
			
		}else{
			
			return null;
		}
	}catch(e){
		nlapiLogExecution('Error', 'entitySearch', 'Error searching for ' + type + ' - ' + e.message);
		return null;
	}
}*/
/************************
 * 
 * 
 * 
 * @param email to search by
 * @param type is the type of record were looking for.
 * @returns
 */
function entitySearch(criteria, type){
	
	nlapiLogExecution('Debug', 'entitySearch', 'searching for ' + type + ' - email address - ' + criteria);
	var searchFilters = new Array();
	searchFilters[0] = new nlobjSearchFilter('email', null, 'is', criteria);
	if(type=='vendor')	searchFilters[0] = new nlobjSearchFilter('entityid', null, 'is', criteria);
	try{
		
		var searchResults = nlapiSearchRecord(type, null, searchFilters, null);
		nlapiLogExecution('Debug', 'entitySearch', 'searchResults - ' + searchResults);
		if(searchResults != null && searchResults.length > 0){
			return searchResults[0].getId();
			
		}else{
			
			return null;
		}
	}catch(e){
		nlapiLogExecution('Error', 'entitySearch', 'Error searching for ' + type + ' - ' + e.message);
		return null;
	}
}
function submitErrorObject(errorMessage,type,csvSummaryData,recordIdentifier){
	var currentTime = new Date();
	var month = currentTime.getMonth() + 1;
	var day = currentTime.getDate();
	var year = currentTime.getFullYear();
	var hours = currentTime.getHours();
	var minutes = currentTime.getMinutes();
	var seconds = currentTime.getSeconds();
	var errorTime = month + '/' + day + '/' + year + ' - ' + hours + ':'+minutes+':'+seconds;
	//get parent summary data
	var searchFilters = new Array();
	searchFilters[0] = new nlobjSearchFilter('custrecord_sum_acq_deal_id', null, 'is',csvSummaryData.custrecord_sum_acq_deal_id);
	var searchResults = nlapiSearchRecord(null,'customsearch_acq_csv_summary_data',searchFilters,null);
	if(searchResults==null)return;
	var internalId = searchResults[0].getId();

	var errorObject = {
			custrecord_acq_error_deal_id : csvSummaryData.custrecord_sum_acq_deal_id,
			custrecord_acq_error_date : errorTime,
			custrecord_acq_error_record_type : type,
			custrecord_acq_error_description : errorMessage,
			custrecord_acq_error_parent : internalId,
			custrecord_acq_error_record_id : recordIdentifier
			
	};



	var recordError = nlapiCreateRecord('customrecord_acq_error_record');
		
	
	//setError Values
	for(var x in errorObject){
		
		recordError.setFieldValue(x,errorObject[x]);
}

	var submitId = nlapiSubmitRecord(recordError);
	nlapiLogExecution('debug', 'getErrorObject', 'erorr report Id = ' + submitId);
	
}

function returnSummaryDataId(dealId){
	searchFilters[0] = new nlobjSearchFilter('custrecord_sum_acq_deal_id', null, 'is',dealId);
	var searchResults = nlapiSearchRecord('customrecord_acq_summary_data', null, searchFilters, null);
	return searchResults[0].getId();
	
	
}
function emailComplete(stageId){
	var fileImport;
	if(stageId=='1') fileImport = 'initial file import';
	else if(stageId=='2') fileImport = 'final file import';
	else fileImport = 'vendor file import';
	var user = nlapiGetContext();
	var email = user.getEmail();
	var userId = user.getUser();
	var subject = 'Your ' + fileImport + ' has finished.';
	var body = 'This is a courtesy e-mail to let you know that your file import has finished uploading.';
	nlapiLogExecution('debug', 'emailComplete', 'internal Id = ' + userId+ 'stageID ' + stageId +' email = ' + email);
	
	nlapiSendEmail(userId,email,subject,body);
	
}