/**
 * This plugin adds the ability to add custom columns to the avid payment approval form. 
 * 
 * Version    Date            Author           Remarks
 * 1.00       10 Dec 2013     maxm
 *
 */

/**
 * Hook to add custom search filters to the form
 * 
 * @param {nlobjForm} form
 * @param {nlobjRequest} request
 */
function formSetupHook(form,request){
}


/**
 * Hook to add custom display columns to the sublist
 * 
 * @param {nlobjSublist} sublist 
 * @returns void
 */
function sublistSetupHook(sublist){
}

/**
 * Hook to add custom nlojbSearchColumns to the search
 * 
 * @param {nlobjSearchColumn[]} columns
 * @returns void
 */
function searchColumnsHook(columns){
}

/**
 * Hook to add custom nlojbSearchFilters to the search
 * 
 * @param {nlobjSearchFilter[]} filters
 * @returns void
 */
function searchFiltersHook(filters){
}

/**
 * Hook to add custom row data to the sublist per searchResult
 * 
 * @param {hash} item 
 * @param {nlobjSearchResult} searchResult 
 * 
 * @returns void
 */
function addSublistRowHook(item,searchResult){
}