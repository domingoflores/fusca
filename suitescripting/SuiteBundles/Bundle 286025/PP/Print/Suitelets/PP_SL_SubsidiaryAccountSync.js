
function suitelet(request,response){
	var context = nlapiGetContext();
	var form = nlapiCreateForm('Automatic Subsidiary Account Sync');
	
	form.addPageLink('crosslink', 'Subsidiary/User Administration', nlapiResolveURL('SUITELET','customscript_pp_sl_admin_console','customdeploy_pp_sl_admin_console'));
	if(!context.getFeature('SUBSIDIARIES')){
		$PPS.addMessageToForm(form,'error','This feature is only available for OneWorld accounts');
	}
	else{
		form.addSubmitButton('Sync');
		if(request.getMethod() == 'POST'){
			try{
				doSync(request,response,form);
				$PPS.addMessageToForm(form,'success','Sync was successful');
			}
			catch(e){
				$PPS.logException(e,'ERROR');
				if(e.message == "Error: HTTP code 401"){
					$PPS.addMessageToForm(form,'error','Access denied. Please make sure your AvidXchange user has admin access');
				}
				else{
					$PPS.addMessageToForm(form,'error','An error occurred. Please check the execution log of custdeploy_pp_sl_subsidiary_acct_sync for more info.');
				}
			}
		}
	}
	
	response.writePage(form);
}

/**
 * Update pps server with subsidiary/account association setup in NetSuite
 * 
 * @param request
 * @param response
 * @param form
 */ 
function doSync(request,response,form){
	
	// objects in the nsSubsidiaryAccountsMap are also used to store information about the update related to the subsidiary
	var nsSubsidiaryAccountsMap = getNsSubsidairyAccountsMap();
	
	var service = new $PPS.Service();
	var baseUrl = $PPS.nlapiOutboundSSO();
	// attach baseUrl to service object so we don't have to pass it around all over
	service.baseUrl = baseUrl;
	
	// get list of subsidiaries already setup on the remote server
	var ppsSubsidiaries = getPPSSubsidiaries(service);
	
	// do the meat
	updateOrCreateSubsidiaries(service,nsSubsidiaryAccountsMap,ppsSubsidiaries);
	
	// Do a second pass to see if any of the unmatched accounts have become available,
	// This situation would occur if an account was manually assigned to the wrong subsidiary
	selectNewAvailableAccounts(service,nsSubsidiaryAccountsMap);
	
	writeResultsToForm(form,nsSubsidiaryAccountsMap);
}


function updateOrCreateSubsidiaries(service,nsSubsidiaryAccountsMap,ppsSubsidiaries){
	var ppsAvailableAccounts = getPPSAvailableAccounts(service);
	
	// Go through each Subsidairy in NetSuite and update or create it in PPS
	var keys = Object.keys(nsSubsidiaryAccountsMap);
	for(var i = 0; i < keys.length; i++){
		var sId = keys[i];
		var nsSubsidiary = nsSubsidiaryAccountsMap[sId];
		var ppsSubsidiary = findPpsSubsidiaryById(sId,ppsSubsidiaries);
		
		// subsidiary already exists in PPS
		if(ppsSubsidiary){
			// Only update if record is changing
			nsSubsidiary.recChanged = false;
			nsSubsidiary.found = true;
			nsSubsidiary.ppsSubsidiary = ppsSubsidiary;
			// TODO: follow HATEOS links, maybe use cookie so we do not have to redecorate url?
			
			var ppsSubsidiaryAccounts = getPPSAccountsBySubsidiary(service,ppsSubsidiary.id); // 10 units
			
			// only pass required fields and fields we might change
			var putObject = {
					id: ppsSubsidiary.id,
					external_id: ppsSubsidiary.external_id,
					name: ppsSubsidiary.name
			};
			var nsAccountIds = $PPS.clone(nsSubsidiary.accountIds);
			
			if(ppsSubsidiary.name != nsSubsidiary.name){
				putObject.name = nsSubsidiary.name;
				nsSubsidiary.recChanged = true;
			}
			
			// NOTE: nsAccountIds gets reduced if found in ppsSubsidiaryAccounts
			nsSubsidiary.matchedPpsSubsidiaryAccounts = filterReduceAccounts(nsAccountIds,ppsSubsidiaryAccounts);
			
			nsSubsidiary.matchedPpsAvailableAccounts = [];
			if(nsAccountIds.length > 0){
				// get accountids(pps id) of accounts not yet set on subsidiary, but are available
				nsSubsidiary.matchedPpsAvailableAccounts = filterReduceAccounts(nsAccountIds,ppsAvailableAccounts);
				//TODO: calculate recChanged smarter... pain in the ass
				nsSubsidiary.recChanged = true;
				
				// if we still have leftover accounts, lets stash them so we can see if they become available later
				if(nsAccountIds.length > 0){
					nsSubsidiary.unmatchedAccounts = nsAccountIds;
				}
			}
			
			// merge already selected accounts with new found available accounts to form all matched accounts
			nsSubsidiary.allMatchedPpsSubsidairyAccounts = [].concat(nsSubsidiary.matchedPpsSubsidiaryAccounts,nsSubsidiary.matchedPpsAvailableAccounts);
			// API requires accounts to be passed as ids in order to select them
			putObject.accounts = nsSubsidiary.allMatchedPpsSubsidairyAccounts.map(function(ppsObj){return ppsObj.id;});
			
			if(nsSubsidiary.recChanged){
				//nlapiLogExecution('DEBUG','Record changed',JSON.stringify(putObject));
				var url = $PPS.insertPathIntoURL(service.baseUrl,'admin/subsidiaries/' + encodeURIComponent(ppsSubsidiary.id));
				
				try{
					service.sendRequest(url, putObject, null, 'PUT'); // 10 governance units
				}
				catch(e){
					nlapiLogExecution('ERROR', 'Unable to update subsidiary',e.toString());
					logPPSServiceResult(service.getLastResult());
					nsSubsidiary.wasError = true;
				}
			}
			else{
				nlapiLogExecution('DEBUG','Record did not change',JSON.stringify(postObject));
			}
		}
		else{
			nsSubsidiary.found = false;
			
			var nsAccountIds = $PPS.clone(nsSubsidiary.accountIds);
			nsSubsidiary.allMatchedPpsSubsidairyAccounts = filterReduceAccounts(nsAccountIds,ppsAvailableAccounts);
			nsSubsidiary.matchedPpsAvailableAccounts = nsSubsidiary.allMatchedPpsSubsidairyAccounts;
			nsSubsidiary.unmatchedAccounts = nsAccountIds
			
			// create
			var postObject = {
					name : nsSubsidiary.name,
					external_id : nsSubsidiary.id,
					accounts : nsSubsidiary.allMatchedPpsSubsidairyAccounts.map(function(ppsObj){return ppsObj.id;})
			};
			
			var url = $PPS.insertPathIntoURL(service.baseUrl,'admin/subsidiaries');
			
			try{
				service.sendRequest(url, postObject, null, 'POST'); // 10 governance units
			}
			catch(e){
				nlapiLogExecution('ERROR', 'Unable to create subsidiary',e.toString());
				logPPSServiceResult(service.getLastResult());
				nsSubsidiary.wasError = true;
			}
		}
	}
}

function selectNewAvailableAccounts(service,nsSubsidiaryAccountsMap){
	
	var ppsAvailableAccounts = getPPSAvailableAccounts(service);
	var keys = Object.keys(nsSubsidiaryAccountsMap);
	for(var i = 0; i < keys.length; i++){
		var sId = keys[i];
		var nsSubsidiary = nsSubsidiaryAccountsMap[sId];
		
		if(nsSubsidiary.unmatchedAccounts && nsSubsidiary.unmatchedAccounts.length > 0){
			var matchedPpsAvailableAccounts = filterReduceAccounts(nsSubsidiary.unmatchedAccounts,ppsAvailableAccounts);
			
			for(var j = 0; j < matchedPpsAvailableAccounts.length; j++){
				var ppsAcct = matchedPpsAvailableAccounts[j];
				nsSubsidiary.allMatchedPpsSubsidairyAccounts.push(ppsAcct);
				nsSubsidiary.recChanged = true;
				
				var url = $PPS.insertPathIntoURL(service.baseUrl,'admin/accounts/' + encodeURIComponent(ppsAcct.id));
				var putObject = $PPS.clone(ppsAcct);
				putObject.subsidiary_id = nsSubsidiary.ppsSubsidiary.id;
				
				try{
					service.sendRequest(url, putObject, null, 'PUT'); // 10 governance units
				}
				catch(e){
					nlapiLogExecution('ERROR', 'Unable to update account with subsidiary id',e.toString());
					logPPSServiceResult(service.getLastResult());
					nsSubsidiary.wasError = true;
				}
			}
		}
	}
}

function writeResultsToForm(form,nsSubsidiaryAccountsMap){
	// Write results to UI
	var lineBr = "\n";
	var sublist = form.addSubList('results','staticlist','Results');
	
	sublist.addField('subsidiary','text','Subsidiary');
	sublist.addField('result','text','Added/Updated');
	sublist.addField('selected_accounts','text','Selected Accounts');
	
	var keys = Object.keys(nsSubsidiaryAccountsMap);
	for(var i = 0; i < keys.length; i++){
		var sId = keys[i];
		var nsSubsidiary = nsSubsidiaryAccountsMap[sId];
		
		sublist.setLineItemValue('subsidiary', i+1,nsSubsidiary.name);
		sublist.setLineItemValue('result', i+1,nsSubsidiary.found ? 'Updated' : 'Added');
		sublist.setLineItemValue('selected_accounts', i+1,nsSubsidiary.allMatchedPpsSubsidairyAccounts.map(function(el){return el.name;}).join(lineBr));
	}	
}

/**
 * Modifies accountIds to only those not found in ppsAccountObjs and runs array
 * of objects of those ppsAccountObjs that were found
 * 
 * @param accountIds
 * @param ppsAccountObjs
 * @returns
 */
function filterReduceAccounts(accountIds,ppsAccountObjs){
	
	var ppsAcctObjs = [];
	var accountIdsNotFound = [];
	
	for(var i = 0; i < accountIds.length; i++){
		var acctId = accountIds[i];
		var found = false;
		for(var j = 0; j < ppsAccountObjs.length; j++){
			var ppsObj = ppsAccountObjs[j];
			if(ppsObj.external_id == acctId){
				//acctIds.push(acctId);
				ppsAcctObjs.push(ppsObj);
				found = true;
				break;
			}
		}
		if(!found){
			accountIdsNotFound.push(acctId);
		}
	}
	
	// since accountIds is passed by reference, just assigning a new array to it only affects the accountIds "pointer"
	// and the outside pointer still points to the original data structure. Therefore we must manipulate the original data structure instead
	accountIds.length = 0;
	Array.prototype.push.apply(accountIds,accountIdsNotFound);

	return ppsAcctObjs;
}

//function filterAccounts(accountIds,ppsAccountObjs){
//	var acctIds = [];
//	
//	for(var i = 0; i < accountIds.length; i++){
//		var acctId = accountIds[i];
//		for(var j = 0; j < ppsAccountObjs.length; j++){
//			var ppsObj = ppsAccountObjs[j];
//			if(ppsObj.external_id == acctId){
//				//acctIds.push(acctId);
//				acctIds.push(ppsObj.id);
//				break;
//			}
//		}
//	}
//	
//	return acctIds;
//}

function findPpsSubsidiaryById(id,ppsSubsidiaries){
	for(var j = 0; j < ppsSubsidiaries.length; j++){
		if(ppsSubsidiaries[j].external_id == id){
			return ppsSubsidiaries[j];
		}
	}
	return null;
}

function getPPSAvailableAccounts(service){
	var url = $PPS.insertPathIntoURL(service.baseUrl,'admin/accounts');
	url += '&subsidiary_id=available';
	
	var pagerSettings = {
		resourceUrl: url,
		itemsContainer: 'items',
		pagingContainerProperty: 'paging'
	};
	
	var pager = new $PPS.ResourcePager(pagerSettings,service);
	return pager.all();
}

/**
 * Get a list of all subsidiaries from PPS server
 * 
 * @param service
 * @returns {Array} ppsSubsidiaries
 */
function getPPSSubsidiaries(service){
	var url = $PPS.insertPathIntoURL(service.baseUrl,'admin/subsidiaries')
	
	var pagerSettings = {
		resourceUrl: url,
		itemsContainer: 'items',
		pagingContainerProperty: 'paging'
	};
	
	var pager = new $PPS.ResourcePager(pagerSettings,service);
	var ppsSubsidiaries = pager.all();
	return ppsSubsidiaries;
}

/**
 * Get a subsidiary's accounts from ppsServer
 * 
 * @param service
 * @param pps_subsidiary_id
 * @returns {Array} ppsAccounts
 */
function getPPSAccountsBySubsidiary(service,pps_subsidiary_id){

	var url = $PPS.insertPathIntoURL(service.baseUrl,'admin/accounts');
	url += '&subsidiary_id=' +  encodeURIComponent(pps_subsidiary_id);
	
	var pagerSettings = {
			resourceUrl: url,
			itemsContainer: 'items',
			pagingContainerProperty: 'paging'
		};
		
	var pager = new $PPS.ResourcePager(pagerSettings,service);
	var ppsAccounts = pager.all();
	return ppsAccounts;
}

/**
 * Get a map of subsidiaries and ids their associated accounts
 * 
 * {
 * 	1: {
 * 		accountIds: [],
 * 		name: 'SubsidairyName',
 * 		id: 1
 * 	},
 * 	...
 * }
 * 
 * @returns {}
 */
function getNsSubsidairyAccountsMap(){
	var map = {};
	
	var subsidairySeachResults = subsidiarySearch();
	var accountsSearch = createBankAccountSearch();
	if(subsidairySeachResults){
		for(var i = 0; i < subsidairySeachResults.length; i++){
			var sr = subsidairySeachResults[i];
			map[sr.getId()] = {
					accountIds: [], 
					name: sr.getValue('name'), 
					id: sr.getId()
			};
		}
		
		var resultSet = accountsSearch.runSearch();
		var i = 0;
		resultSet.forEachResult(function(searchResult){
			if(map.hasOwnProperty(searchResult.getValue('subsidiary'))){
				map[searchResult.getValue('subsidiary')].accountIds.push(searchResult.getId());
			}
			else{
				nlapiLogExecution('DEBUG','Subsidairy not found for account','Account id ' + searchResult.getId() + ', Subsidairy Id' + searchResult.getValue('subsidiary'));
			}
			i++;
			return i < 4000; // return true to keep iterating
		});
	}
	
	return map;
}

function subsidiarySearch(){
	var filters = [];
	var columns = [];
	
	filters.push(new nlobjSearchFilter('isinactive', 'null', 'is', 'F'));
	columns.push(new nlobjSearchColumn('name'));
	
	return nlapiSearchRecord('subsidiary',null,filters,columns);
}

function createBankAccountSearch(){
	var filters = [];
	var columns = [];
	
	filters.push(new nlobjSearchFilter('type', null, 'is', 'Bank'));
	filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
	filters.push(new nlobjSearchFilter('custrecord_pp_account_exclude',null,'is','F'));
	
	columns.push(new nlobjSearchColumn('name'));
	columns.push(new nlobjSearchColumn('subsidiary'));
	
	return nlapiCreateSearch('account',filters,columns);
}

function logPPSServiceResult(result){
	var resultClone = {
			wasError : result.wasError,
			errorType : result.errorType,
			
	};
	
	if(result.errorMessage){
		resultClone.errorMessage = result.errorMessage;
	}
	
	if(result.data){
		resultClone.data = result.data;
	}
	
	nlapiLogExecution('DEBUG', 'Service ERROR', JSON.stringify(resultClone));
}