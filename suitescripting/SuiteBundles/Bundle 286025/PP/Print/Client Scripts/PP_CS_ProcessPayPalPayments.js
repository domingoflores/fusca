/**
 * Client script for the PP SL Process PayPal Payments suitelet.
 * 
 * Version    Date            Author           Remarks
 * 1.00       01 May 2014     maxm
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function clientFieldChanged(type, name, linenum) {
	
    var field = 'custpage_account_select';
    if (field == name) {
        // Use NetSuite to retrieve value
        var acc = nlapiGetFieldValue(field);
        if (acc > 0) {
            var p = insertParam(field, acc);
            setWindowChanged(window, false);
            document.location.search = p;
        }
    }
    return true;
}

function insertParam(key, value) {
    key = escape(key); value = escape(value);

    var kvp = document.location.search.substr(1).split('&');

    var i = kvp.length; var x; while (i--) {
        x = kvp[i].split('=');

        if (x[0] == key) {
            x[1] = value;
            kvp[i] = x.join('=');
            break;
        }
    }

    if (i < 0) { kvp[kvp.length] = [key, value].join('='); }
    return kvp.join('&');
    //this will reload the page, it's likely better to store this until finished
}

function redirectToEntity(entityId){
	var recordType = nlapiLookupField('entity', entityId, 'recordtype');
	var url = nlapiResolveURL('record', recordType, entityId);	
	window.location.href = url;
}