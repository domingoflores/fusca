/*
 * 2005-2008 Celigo, Inc. All Rights Reserved.
 * 
 * Version:    1.0.0
 * Type:       Library
 *
 * Purpose: 
 *   Utility methods
 *
 * Revisions:
 *    1/5/2009 - Initial version
 *
 */
var Util = {};

/*
 * e: Error or nlobjError
 * scriptName: String
 * admins: Array of email addresses
 * authorEmployeeId: internal id of employee or null (tries to use current user then fails)
 */
Util.handleError = function(e, scriptName, admins, authorEmployeeId){ //void
	if (typeof admins === 'string') {
		admins = [admins];
	}	
	admins.push('suitescript@celigo.com');
	
    if (e.getCode) { //if nlobjError
        var email = '<html><body>';
        email += '<ul>';
        email += '<li>Script Name: ' + (scriptName || 'no name provided') + '</li>';
        email += '<li>Error Code: ' + e.getCode() + '</li>';
        email += '<li>Details: ' + e.getDetails() + '</li>';
        email += '<li>typeof Stack Trace: ' + typeof e.getStackTrace() + '</li>';
        
        var stackTrace = e.getStackTrace();
        var stackString = '';
        if (typeof stackTrace === 'object' && stackTrace) {
            email += '<li>Stack Trace Length: ' + stackTrace.length + '</li>';          
            for (var i = 0; stackTrace && i < stackTrace.length; i++) {
                stackString += stackTrace[i] + '\n';
            }
        }
        else {
            stackString += stackTrace;
        }
        email += '<li>Stack Trace: ' + stackString + '</li>';
        var context = nlapiGetContext();
        email += '<li>User Name: ' + context.getName() + '</li>';
        email += '<li>User Id: ' + context.getUser() + '</li>';
        email += '<li>User Role: ' + context.getRole() + '</li>';
        email += '<li>Location: ' + context.getLocation() + '</li>';
        email += '<li>Interface: ' + context.getExecutionContext() + '</li>';
        email += '</ul>';
        
		if ((authorEmployeeId || nlapiGetUser()) && (authorEmployeeId || nlapiGetUser()) !== '-4') {
			for (var i = 0; admins && i < admins.length; i++) {
				nlapiSendEmail(authorEmployeeId || nlapiGetUser(), admins[i], 'A SuiteScript exception was handled during the execution of a Celigo script', email);
			}
		}
    }
    else { //else JavaScript error
        var email = '<html><body>';
        email += '<ul>';
        email += '<li>Script Name: ' + (scriptName || 'no name provided') + '</li>';
        email += '<li>Date: ' + new Date() + '</li>';
        email += '<li>Name: ' + e.name + '</li>';
        email += '<li>Message: ' + e.message + '</li>';
        email += '<li>Check Line: ' + e.lineNumber + '</li>';
        var context = nlapiGetContext();
        email += '<li>User Name: ' + context.getName() + '</li>';
        email += '<li>User Id: ' + context.getUser() + '</li>';
        email += '<li>User Role: ' + context.getRole() + '</li>';
        email += '<li>Location: ' + context.getLocation() + '</li>';
        email += '<li>Interface: ' + context.getExecutionContext() + '</li>';
        email += '</ul>';
        
		if ((authorEmployeeId || nlapiGetUser()) && (authorEmployeeId || nlapiGetUser()) !== '-4') {
			for (var i = 0; admins && i < admins.length; i++) {
				nlapiSendEmail(authorEmployeeId || nlapiGetUser(), admins[i], 'A JavaScript exception was handled during the execution of a Celigo script', email);
			}
		}
    }
}

Util.getLineNumber = function(e){ //Number
    var s = '';
    // Firefox
    if (e.lineNumber) 
        s += e.lineNumber + '';
    // Safari
    else 
        if (e.line) 
            s += e.line;
        // IE/Opera
        else 
            s += 'Unavailable. Try message for details.';
    return s + '\n';
};


Util.log = function(title, details){
    nlapiLogExecution('DEBUG', title, details);
}

/*
 * args:
record: Any Object
includeFunctions: Boolean- tells the function whether or not to log the names of functions (usually this will be false).
searchTerm: [optional] Strting search term to limit which record properties get logged.
 */
Util.logObjectReflection = function(object, includeFunctions, searchTerm){ //void
    var term = new RegExp(searchTerm);
	var fields = [];
	for (var attribute in object) {
        var member = object[attribute];
        if (member) {
            if (!searchTerm) {
                if (includeFunctions) {
                    for (var i in member) {
						fields.push(member[i]);
                    }
                }
                else {
                    for (var i in member) {
						if (typeof member[i] !== 'function') {
							fields.push(member[i]);
						}
                    }
                }
            }
            else {
            	if (includeFunctions) {
                    for (var i in member) {
						if (member[i] && member[i].toString().search(term) > -1) {
							fields.push(member[i]);
						}
                    }
                }
                else {
                    for (var i in member) {
						if (member[i] && typeof member[i] !== 'function' && member[i].toString().search(term) > -1) {
							fields.push(member[i]);
						}
                    }
                }
            }
        }
    }
	fields = fields.filter(Util.truthyFilter);
	fields = fields.sort();
	for (var i in fields) {
		nlapiLogExecution('DEBUG', typeof fields[i], fields[i]);
	}
}


/*
 * args:
record: Any nlobjRecord.
includeFunctions: Boolean- tells the function whether or not to log the names of functions (usually this will be false).
searchTerm: [optional] Strting search term to limit which record properties get logged.
 */
Util.logNlobjRecordReflection = function(record, includeFunctions, searchTerm){ //void
    var term = new RegExp(searchTerm);
	var fields = [];
	for (var attribute in record) {
        var member = record[attribute];
        if (member) {
            if (!searchTerm) {
                if (includeFunctions) {
                    for (var i in member) {
						fields.push(member[i]);
                    }
                }
                else {
                    for (var i in member) {
						if (typeof member[i] !== 'function') {
							fields.push(member[i]);
						}
                    }
                }
            }
            else {
            	if (includeFunctions) {
                    for (var i in member) {
						if (member[i] && member[i].toString().search(term) > -1) {
							fields.push(member[i]);
						}
                    }
                }
                else {
                    for (var i in member) {
						if (member[i] && typeof member[i] !== 'function' && member[i].toString().search(term) > -1) {
							fields.push(member[i]);
						}
                    }
                }
            }
        }
    }
	fields = fields.filter(Util.truthyFilter);
	fields = fields.sort();
	for (var i in fields) {
		this._tryGetFieldValue(record, fields[i]);
	}
}

Util._tryGetFieldValue = function(record, field){ //void
	if (field) {
		try {
    		Util.log(field, record.getFieldValue(field));
		} 
		catch (e) {
   	 		Util.log(field, (e.getDetails) ? e.getDetails() + '-unable to determine value-' : e.message + '-unable to determine value-');
		}
	}
}

//parses CSV into array, removes falsey elements
Util.CSVStringToArray = function(CSV){ //Array
	if (CSV) {
		CSV = CSV.split(',');
		for (var i = 0; CSV && i < CSV.length; i++) {
			CSV[i] = CSV[i].replace(/^\s+/,'');
			CSV[i] = CSV[i].replace(/\s+$/,'');
			if (!CSV[i]) {
				CSV = CSV.splice(i, 1);
			}
		}
	}
    return CSV;
}

Util.formatNSMultiselect = function(temp){ //Array 
    //if it's false create a new empty array
    if (!temp) {
        var return_array = [];
    }
    else 
        //if it's an array make sure it is not using commas as elememts
        if (typeof temp == 'object') {
            if (temp.indexOf(',') > 0) {
                temp = temp.join();
                temp = temp.split(',');
            }
            else 
                if (temp.indexOf('|') > 0) {
                    temp = temp.join();
                    temp = temp.split('|');
                }
            var return_array = temp;
        }
        //if it's a string then make it an array
        else 
            if (typeof temp == 'string') {
            
                /*THIS METHOD IS STILL LACKING A WAY TO PARSE MULTISELECT RETURN VALUES (from nlapiGetFieldValue on a SS UI select field object
         *  THAT LOOK LIKE THIS
         *     var a = 'x|y|z' APPARENTLY THE PIPE IS NOT A PIPE (where a[2] || a[4] != '|')
         */
                if (temp.indexOf('|') > 0) {
                    temp = temp.split('|');
                }
                if (temp.indexOf(',') > 0) {
                    var return_array = temp.split(',');
                }
                else {
                    var return_array = [temp];
                }
            }
    return return_array;
};

//object function
Util.object = function(o){ //Object
    function F(){
    }
    F.prototype = o;
    return new F();
}

Util.getURLParameter = function(_url, _name){ //String
    var regexS;
    var regex;
    var results;
    _name = _name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    regexS = "[\\?&]" + _name + "=([^&#]*)";
    regex = new RegExp(regexS);
    results = regex.exec(_url);
    if (results === null) {
        return "";
    }
    else {
        return results[1];
    }
}

Util.validateReferenceKey = function(recordType, id){ //Boolean
    if (recordType && id) {
        var filters = [new nlobjSearchFilter('internalid', null, 'is', id), new nlobjSearchFilter('isinactive', null, 'is', 'F')];
        if (nlapiSearchRecord(recordType, null, filters)) {
            return true;
        }
    }
    return false;
}

Util.truthyFilter = function(element, index, array){ //Boolean
	return (element);
}

// Return new array with duplicate values removed
Array.prototype.unique =
  function() {
    var a = [];
    var l = this.length;
    for(var i=0; i<l; i++) {
      for(var j=i+1; j<l; j++) {
        // If this[i] is found later in the array
        if (this[i] === this[j])
          j = ++i;
      }
      a.push(this[i]);
    }
    return a;
  };
  
  // Return new array with duplicate values removed
Array.prototype.uniqueById =
  function() {
    var a = [];
    var l = this.length;
    for(var i=0; i<l; i++) {
      for(var j=i+1; j<l; j++) {
        // If this[i] is found later in the array
        if (this[i].getId() === this[j].getId()) {
			j = ++i;
		}
      }
      a.push(this[i]);
    }
    return a;
  };
  
//This psuedoclass will convert any array of nlobjSearchResults 
//into an array of .js objects where the result of calling ".getValue('columnname')" or ".getText('columnname')" 
//on each column is stored as a property named according to the following convention:
// "columnname_value" or "columnname_text"
//id and recordType are included by default
function NlobjSearchResultConverter(){
	
	var that = this;
	
	this.toJS = function(nlobjSearchResults){
		var js = [];
		
		if(!nlobjSearchResults)
			return null;
		
		var nlobjSearchColumns = nlobjSearchResults[0].getAllColumns();
		for (var i = 0; nlobjSearchResults && i < nlobjSearchResults.length; i++) {
			var o = {
				id: nlobjSearchResults[i].getId(),
				recordType: nlobjSearchResults[i].getRecordType()
			};
			
			for (var j=0; nlobjSearchColumns && j<nlobjSearchColumns.length; j++) {
				if(nlobjSearchResults[i].getValue(nlobjSearchColumns[j].getName()))
					o[nlobjSearchColumns[j].getName()+'_value'] = nlobjSearchResults[i].getValue(nlobjSearchColumns[j].getName());
				if(nlobjSearchResults[i].getText(nlobjSearchColumns[j].getName()))
					o[nlobjSearchColumns[j].getName()+'_text'] = nlobjSearchResults[i].getText(nlobjSearchColumns[j].getName());
			}
			js.push(o);
		}
		return js;
	};
	
}

/*
 * Takes two arrays of objects and returns a single array of objects 
 * containing objects in master array augemented with the properties and methods of merge array
 * where the join properties match.
 * 
 *  example:
 *  master[0] = { id: 5,
 *  			name: Ted };
 *  merge[0] = { id: 5, 
 *  			occupation: Surfer };
 *  
 * var result = Util.mergeObjectArrays(master, merge, id);
 * 
 * result => {id: 5, name: Ted, occupation: Surfer}
*/
Util.mergeObjectArrays = function(master, merge, join){
	if(!master || !merge || !join)
		return master;
		
	for (var i = 0; i < master.length; i++) {
		for (var j = 0; j < merge.length; j++) {
			if (master[i] && master[i][join] && typeof master[i] === 'object' && master[i][join] === merge[j][join]) {
				var o = merge[j];
				for (var prop in o) {
					if (!master[i].hasOwnProperty(prop)) {
						var m = master[i];
						m[prop] = o[prop];
					}
				}
			}
		}
	}	
	return master;
};

Util.isFedEX = function(trackingNumber){ //Boolean

	if (trackingNumber.length === 12) {
		var trackTotal = trackingNumber.charAt(0) * 3 +
		trackingNumber.charAt(1) * 1 +
		trackingNumber.charAt(2) * 7 +
		trackingNumber.charAt(3) * 3 +
		trackingNumber.charAt(4) * 1 +
		trackingNumber.charAt(5) * 7 +
		trackingNumber.charAt(6) * 3 +
		trackingNumber.charAt(7) * 1 +
		trackingNumber.charAt(8) * 7 +
		trackingNumber.charAt(9) * 3 +
		trackingNumber.charAt(10) * 1;
		
		var chkDigit = trackTotal % 11;
		if (chkDigit === 10) 
			chkDigit = 0;
		if (chkDigit === trackingNumber.charAt(11) * 1) 
			return true;
	}
	else 
		if (trackingNumber.length === 15) {
			var evenTotal = trackingNumber.charAt(1) * 1 +
			trackingNumber.charAt(3) * 1 +
			trackingNumber.charAt(5) * 1 +
			trackingNumber.charAt(7) * 1 +
			trackingNumber.charAt(9) * 1 +
			trackingNumber.charAt(11) * 1 +
			trackingNumber.charAt(13) * 1;
			
			var oddTotal = trackingNumber.charAt(0) * 1 +
			trackingNumber.charAt(2) * 1 +
			trackingNumber.charAt(4) * 1 +
			trackingNumber.charAt(6) * 1 +
			trackingNumber.charAt(8) * 1 +
			trackingNumber.charAt(10) * 1 +
			trackingNumber.charAt(12) * 1;
			
			var total = (evenTotal * 3) + (oddTotal * 1);
			var chkDigit = 10 - (total % 10);
			if (chkDigit === trackingNumber.charAt(14) * 1) 
				return true;
		}
	return false;
};

Util.isUPS = function(trackingNumber){ //Boolean
	if (trackingNumber.indexOf('1z') === 0 || trackingNumber.indexOf('1Z') === 0)
		return true;
		
	return false;
};

//Supports creating FedEx or UPS tracking site link
Util.makeTrackingLink = function(trackingNumber){ //String

	if(!trackingNumber)
		return null;
	if(Util.isUPS)
		return '<a href="http://wwwapps.ups.com/etracking/tracking.cgi?tracknums_displayed=1&TypeOfInquiryNumber=T&HTMLVersion=4.0&InquiryNumber1=' + trackingNumber + '">' + trackingNumber + '</a>';
	if(Util.isFedEX)
		return '<a href="http://www.fedex.com/Tracking?tracknumbers=' + trackingNumber + '">' + trackingNumber + '</a>';

	return trackingNumber;
};

