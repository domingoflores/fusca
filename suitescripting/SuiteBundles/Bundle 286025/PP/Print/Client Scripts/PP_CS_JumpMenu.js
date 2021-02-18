/**
 * Script Description...
 * 
 * @appliedtorecord {recordTypeId}
 * 
 * @author 360 Cloud Solutions
 * @author Jay
 */

/* CHANGELOG 
 * Date		Developer		Changes Made
 * 04 Jan 2013	Jay			Initial creation. Description...
 */

/* SCRIPT GLOBALS */
var /* {String} Enables (true) or disables (false) all logging in this script */
	SHOW_LOGS = true;

/**
 * Field Changed event handler.
 *  
 * @appliedtorecord recordType
 * 
 * <h5>API Governance:</h5>
 * TODO This function uses XXX units each time it is invoked.
 * <br><br>
 * 
 * @param type {String} - The internal ID of the Sublist containing the field
 * 		that changed, if the field is contained in a Sublist
 * @param name {String} - The internal ID of the Field that changed
 * @param linenum {Number} [Optional] - The index of the line item being
 * 		validated. The first line item has a <code>linenum</code> of
 * 		<code>1</code>.
 * 
 * @return {Void}
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
