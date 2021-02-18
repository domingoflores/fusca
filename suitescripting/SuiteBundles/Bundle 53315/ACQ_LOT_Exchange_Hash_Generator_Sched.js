/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       20 Apr 2014     smccurry
 *
 */

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function createHash12(){  //hashLength, idLOT, hash12
    var hash = "";
    var charset = "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789";
    var hashLength = 12;
   	for(var i=0; i < hashLength; i++) {
   		hash += charset.charAt(Math.floor(Math.random() * charset.length));   	
   	}
	//Slice the hash string and format it here prior to the search
	var frontHash = hash.slice(0,4);
	var midHash = hash.slice(4,8);
	var endHash = hash.slice(8,12);
	hash = frontHash+'-'+midHash+'-'+endHash;
   	return hash;
}

function exchangeHashGenerator(type) {
	var qtyHash = determineQTYUnusedHashRecords();
	// TODO: (smccurry 04/20/14) qtyNeed is hard coded for testing but should be loaded from a setup field on the profile
	var qtyNeed = 500;
	if(qtyHash != null && qtyHash < qtyNeed) {
		var qtyCreate = qtyNeed - qtyHash;
		var n = 0;
		while(n < qtyCreate) {
			try {
				var newRec = nlapiCreateRecord('customrecord_acq_exchange_hash');
				var hashNumber = createHash12();
				var exist = determineHashExist(hashNumber);
				if(exist == false) {
					newRec.setFieldValue('name', hashNumber);
					nlapiSubmitRecord(newRec);
				}
				n++;
			} catch (e) {
				nlapiLogExecution('ERROR', 'ExchangeHash_Generator', 'Failed creating Exchange Hash Record');
			}
		}
	}
}

function determineQTYUnusedHashRecords() {
	var hashQTY = 0;
	var columns = new Array();
	columns[0] = new nlobjSearchColumn('custrecord_acq_hash_deal_link');
	var searchresults = nlapiSearchRecord('customrecord_acq_exchange_hash', null, null, columns );
	// loop through the results
	for(var i = 0; searchresults != null && i < searchresults.length; i++) {
		// if the hash record does not have a deal attached, then count it as unused by adding to the hashQTY
		var searchresult = searchresults[i];
		if(searchresult.getValue('custrecord_acq_hash_deal_link') == null || searchresult.getValue('custrecord_acq_hash_deal_link') == '') {
			hashQTY += 1;
		}
	}
	return hashQTY;
}

function determineHashExist(hashNumber) {
	var hashExist = false;
	var filters = new Array();
	filters[0] = new nlobjSearchFilter('custrecord_acq_hash_deal_link', null, 'anyof', '@NONE@');
	var columns = new Array();
	columns[0] = new nlobjSearchColumn('name');
	var searchresults = nlapiSearchRecord('customrecord_acq_exchange_hash', null, filters, columns );
	for (var i = 0; searchresults != null && i < searchresults.length; i++ ) {
            var searchresult = searchresults[i];
            var hashNumberSearch = searchresult.getValue('name');
            if(hashNumberSearch.trim() == hashNumber.trim()) {
            	hashExist = true;
            	break;
			}
	}
	return hashExist;
}
