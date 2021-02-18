/**
 * Module Description
 * 
 * Version Date Author Remarks 1.00 20 Nov 2013 gbearneza
 * 
 */

function checkDependencies() {
    // do not attempt to do translation since the required files are not yet
    // copied at this point
    var objContext = nlapiGetContext();
    var customcode_enabled = objContext.getSetting("FEATURE", "CUSTOMCODE");
    if (customcode_enabled != 'T') {
        throw new nlobjError('INSTALLATION_ERROR', 'Client SuiteScript Feature must first be enabled before installation.');
    }

    var serversidescripting_enabled = objContext.getSetting("FEATURE", "SERVERSIDESCRIPTING");
    if (serversidescripting_enabled != 'T') {
        throw new nlobjError('INSTALLATION_ERROR', 'Server SuiteScript Feature must first be enabled before installation.');
    }
}

/**
 * Performs dependency check before installation.
 * 
 * @param {Number}
 *        toversion
 * @returns {Void}
 */
function beforeInstall(toversion) {
    checkDependencies();
}

/**
 * Create any required records after installation.
 * 
 * @param {Number}
 *        toversion
 * @returns {Void}
 */
function afterInstall(toversion) {
    try {
        // These 3 are the default search columns
        var columnKeys = [ 'title', 'email', 'phone' ];

        var columns = [];
        for (var i = 0; i < columnKeys.length; i++) {
            columns.push(new nlobjSearchColumn(columnKeys[i]));
        }

        // Create saved search
        var search = nlapiCreateSearch('employee', null, columns);
        search.setIsPublic(true);
        search.saveSearch(ocGlobal.APPNAME + ' Employee Card Details', ocGlobal.CUSTSEARCH_EMP_FLDS_ID);
    } catch (e) {

        // Suppress only this exception, when the saved searched already exists.
        // Do nothing if Save Search already exists.
        if (e.code === 'SSS_DUPLICATE_SEARCH_SCRIPT_ID') {
            nlapiLogExecution('debug', 'SuiteOrgChart', 'Skipping saved search creation. ' + ocGlobal.CUSTSEARCH_EMP_FLDS_ID);
        } else {
            // Re throw exception otherwise
            throw e;
        }
    }
}
