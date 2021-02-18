/**
 * Allows you to add and manipulate data passed to the AvidXchange Self-Managed service when processing payments.
 * 
 * Version    Date            Author           Remarks
 * 1.00       14 May 2013     maxm
 *
 */

/*
 * Use this callback to modify the search columns and filters before a transaction search.
 * 
 * @param columns {array}
 * @param filters {array}
 */
function beforeTransactionSearch(columns,filters){
}

/*
 * Use this callback to modify each payment object with extra columns added from the beforeTransactionSearch. 
 * 
 * @param searchResult {nlobjSearchResult}
 * @param paymentObj {object}
 */
function paymentConversion(searchResult,paymentObj){
}

/*
 * Use this callback to modify the search columns and filters for each entity search. An entity search will
 * be a vendor search, customer search or an employee search. 
 * 
 * @param searchType {string} - vendor,customer,employee
 * @param columns {array}
 * @param filters {array}
 */
function beforeEntitySearch(searchType,columns,filters){
}

/*
 * Use this callback to modify each vendor object with extra columns added from the beforeEntitySearch.
 * 
 * @param searchResult {nlobjSearchResult}
 * @param vendorObj {object}
 */
function vendorConversion(searchResult,vendorObj){
}

/*
 * Use this callback to modify the search columns and filters for each applied transaction extras.
 * 
 * @param columns {array}
 * @param filters {array}
 */
function beforeAppliedExtrasSearch(columns,filters){
}

/*
 * Use this callback to modify add extra fields to applied transactions with extra columns added from the beforeAppliedExtrasSearch.
 * 
 * @param searchResult {nlobjSearchResult}
 * @param transExtraObj {object}
 */
function appliedExtrasConversion(searchResult,transExtraObj){
}

/*
 * Use this callback to do any custom searches or final data manipulation on payments and vendors.
 * 
 * @param payments {array}
 * @param vendors {array}
 */
function afterConversions(payments, vendors){
}

/*
 * Use this callback to add custom columns to the process and reprocess payments lists.
 * 
 * Sample adding the memo field
 * fields.theMemo = {
 * 		name: 'custpage_pp_pc_memo', - the id of the sublist column
 *      type: 'text', - The type of data of the sublist column
 *      label: 'Memo', - The header label of the sublist column
 *      record: 'memo', - The name of the search column(See transaction search in NetSuite record browser)
 *      text: 'F' - Optional - Set text to 'T' to use the nlobjSearchResult getText method instead of getValue. Useful for displaying List/Record results
 * };
 *  
 * @param fields {Object} - Hash of fields used to build the sublists(not NetSuite fields)
 * @returns null
 */
function uiBeforeCreate(fields){
}
