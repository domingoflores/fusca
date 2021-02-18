/*
 * 2005-2008 Celigo, Inc. All Rights Reserved.
 * 
 * Version:    1.0.0
 * Type:       Library
 *
 * Purpose: 
 *    <What the script does>
 *
 * Revisions:
 *    <Date in MM/DD/YYYY format> - Initial version
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
};

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
};

log = function(title, details){
    nlapiLogExecution('DEBUG', title, details);
};

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
};


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
};

Util._tryGetFieldValue = function(record, field){ //void
	if (field) {
		try {
    		Util.log(field, record.getFieldValue(field));
		} 
		catch (e) {
   	 		Util.log(field, (e.getDetails) ? e.getDetails() + '-unable to determine value-' : e.message + '-unable to determine value-');
		}
	}
};

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
};

//object function (clone)
Util.object = function(o){ //Object
    function F(){
    }
    F.prototype = o;
    return new F();
};

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
};

Util.validateReferenceKey = function(recordType, id){ //Boolean
    if (recordType && id) {
        var filters = [new nlobjSearchFilter('internalid', null, 'is', id), new nlobjSearchFilter('isinactive', null, 'is', 'F')];
        if (nlapiSearchRecord(recordType, null, filters)) {
            return true;
        }
    }
    return false;
};

Util.truthyFilter = function(element, index, array){ //Boolean
	return (element);
};

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
// "columnname_val" or "columnname_txt"
//id and recordType are included by default
function NlobjSearchResultConverter(){
	
	var that = this;
	
	this.toJS = function(results, prependHeaders){
		
		if(!results)
			return null;
		
		var columns = results[0].getAllColumns();
		var js = [];
		
		for (var i = 0; i < 1/*results.length*/; i++) {
			var o = {};
			var headers = {};
			
			if (results[i].getId()) 
				o['id'] = results[i].getId();
			if (results[i].getRecordType()) 
				o['recordType'] = results[i].getRecordType();
			
			for (var j = 0; columns && j < columns.length; j++) {
				headers[j] = {
					name: (columns[j].getJoin()) ?  columns[j].getName()+'_'+columns[j].getJoin() : columns[j].getName(),
					label: columns[j].getLabel(),
				};
				if(columns[j].getFunction())
					headers[j]['funct'] = columns[j].getFunction();
				
				//getValue
				if (results[i].getValue(columns[j])) 
					o[columns[j].getName()+'_val'] = results[i].getValue(columns[j]);
				//getValue (join)
				if(columns[j].getJoin() && results[i].getValue(columns[j].getName(), columns[j].getJoin()))
					o[columns[j].getName()+'_'+columns[j].getJoin()+'_val'] = results[i].getValue(columns[j].getName(), columns[j].getJoin());
				//getValue (summary)
				if (columns[j].getSummary() && results[i].getValue(columns[j].getName(), null, columns[j].getSummary())) 
					o[columns[j].getName()+'_'+columns[j].getSummary()] = results[i].getValue(columns[j].getName(), null, columns[j].getSummary());
				//getValue (join and summary)
				if (columns[j].getJoin() && columns[j].getSummary() && results[i].getValue(columns[j].getName(), columns[j].getJoin(), columns[j].getSummary())) 
					o[columns[j].getName()+'_'+columns[j].getJoin()+'_summary'] = results[i].getValue(columns[j].getName(), columns[j].getJoin(), columns[j].getSummary());
				//getText
				if(results[i].getText(columns[j].getName()))	
					o[columns[j].getName()+'_txt'] = results[i].getText(columns[j].getName());
				//getText (join)
				if(columns[j].getJoin() && results[i].getText(columns[j].getName(), columns[j].getJoin()))	
					o[columns[j].getName()+'_'+columns[j].getJoin()+'_txt'] = results[i].getText(columns[j].getName(), columns[j].getJoin());
			}
			js.push(o);
		}
		
				
		if(prependHeaders)
			js.unshift(headers);
		
		return js;
	};
	
	this.toTwoDArray = function(results, asJSON){
		var twoD = [];
		var columns = results[0].getAllColumns();
		for (var i = 0; results && i < results.length; i++) {
			twoD[i] = [];
			for (var j = 0; columns && j < columns.length; j++) {
				if(results[i].getText(columns[j].getName()))
					twoD[i].push(results[i].getText(columns[j].getName()));
				else
					twoD[i].push(results[i].getValue(columns[j].getName()));
			}
		}
		
		if(!asJSON)
			return twoD;
		
		var json = '[';
		for (var i=0; i<twoD.length; i++) 
			json += JSON.stringify(twoD[i]);
			
		json += ']';	
		return json;	
	};
	
};

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

Util.twoDimensionalArrayToCSVFile = function(twoDimensionalArray, fileName){ //nlobjFile
	if(!twoDimensionalArray || twoDimensionalArray.length === 0)
		throw nlapiCreateError('INVALID_SOURCE_ARRAYS', 'Unable to create nlobjFile, source arrays contain no data');
	
	for (var i=0; i<twoDimensionalArray.length; i++) 
		if(typeof twoDimensionalArray[i] !== 'object')
			throw nlapiCreateError('INVALID_SOURCE_ARRAYS', 'Unable to create nlobjFile, line array '+i+' is not an object, it is a '+typeof twoDimensionalArray[i]);
		
	var content = '';
	for (var i=0; i<twoDimensionalArray.length; i++) {
		for (var j=0; j<twoDimensionalArray[i].length; j++) {
			if(twoDimensionalArray[i][j].indexOf(',') === -1)
				content += twoDimensionalArray[i][j];
			else
				content += '"'+twoDimensionalArray[i][j]+'"';
			if(j === twoDimensionalArray[i].length - 1)
				content += '\n';
			else
				content += ',';
		}
	}
	
	return nlapiCreateFile(fileName, 'CSV', content);		
};

Util.search = function(type, id, filters, columns){
	var timer = new Date().getTime();
	try {
		var results = nlapiSearchRecord(type, id, filters, columns);
	}
	catch(e){
		nlapiCreateError('SEARCH_ERROR ',(e.name || e.getCode()) +' ,'+ (e.message || e.getDetails())+' ,Check Line '+ Util.getLineNumber(e));
	}
	nlapiLogExecution('AUDIT', 'Search time', (new Date().getTime() - timer)/1000 + ' seconds');
	if (results) {
		nlapiLogExecution('AUDIT', type+' search', results.length+' results found');
		
		if (!results[0].getId()) 
			nlapiLogExecution('AUDIT', 'Internal Id is null, grouped or summarized search');
		if (!results[0].getRecordType()) 
			nlapiLogExecution('AUDIT', 'Record Type is null, grouped or summarized search');
		if (id) {
			var columns = results[0].getAllColumns();
			for (var i = 0; columns && i < columns.length; i++) 
				if (columns[i].getSummary() === 'group') 
					throw nlapiCreateError('GROUPED_RESULTS', 'Saved search using grouped results which do not contain business objects.');
		}
	}
	else
		Util.log(type+' search', 'No results found');
	
	return results;
};

Util.trim = function(s){
	if(!s || typeof s !== 'string')
		return null;
		
  	return s.replace(/^\s*(\S*(\s+\S+)*)\s*$/, "$1");
};

String.prototype.trim = function(s){
	if(!s || typeof s !== 'string')
		return null;
		
  	return s.replace(/^\s*(\S*(\s+\S+)*)\s*$/, "$1");
};

var Clone = function() {}
Util.clone = function(o){ //Object
    Clone.prototype = o;
    return new Clone();
}

Object.prototype.clone = Util.clone;

Util.copy = function(o){
	if (typeof o !== 'object') {
		return o;
	}
	else {
		var value = o.valueOf();
		if (o != value) {
			return new o.constructor(value);
		}
		else {
			if (o instanceof o.constructor && o.constructor !== Object) {
				var c = clone(o.constructor.prototype);
				for (var property in o) {
					if (o.hasOwnProperty(property)) {
						c[property] = o[property];
					}
				}
			}
			else {
				var c = {};
				for (var property in o) 
					c[property] = o[property];
			}
			return c;
		}
	}	
}

//converts an associative array (array of arrays) into an object with properties whose 
// value is equal to inner arrays (rows) of the original structure
Util.associativeArrayToObject = function(a){ //Object
	
	var o = {};
	for (i in a) {
		if (a[i] && typeof a[i] !== 'function') {
			o[i] = [];
			for (j in a[i]) 
				o[i].push(a[i][j]);
		}
	}
	return o;
}

Util.objectToAssociativeArray = function(o){
	
	var a = [];
	var c = 0;
	for (i in o) {
		a[c] = [];
		for (var j = 0; j < o[i].length; j++) 
			a[c].push(o[i][j]);
		
		c++;
	}
	return a;
}

Util.stripHtmlTags = function(string){
	if(string && typeof string === 'string')
		return string.replace(/(<([^>]+)>)/ig,'');
}

Util.getExtensionToNSContentTypeEnumMap = function(){
	return {
		'.dwg' : 'AUTOCAD',
		'.bmp' : 'BMPIMAGE',
		'.csv' : 'CSV',
		'.xls' : 'EXCEL',
		'.xlsx' : 'EXCEL',
		'.swf' : 'FLASH',
		'.gif' : 'GIFIMAGE',
		'.gz' : 'GZIP',
		'.htm' : 'HTMLDOC',
		'.html': 'HTMLDOC',
		'.ico' : 'ICON',
		'.js' : 'JAVASCRIPT',
		'.jpg' : 'JPGIMAGE',
		'.eml' : 'MESSAGERFC',
		'.mp3' : 'MP3',
		'.mpg' : 'MPEGMOVIE',
		'.mpp' : 'MSPROJECT',
		'.pdf' : 'PDF',
		'.pjpeg' : 'PJPGIMAGE',
		'.txt' : 'PLAINTEXT',
		'.png' : 'PNGIMAGE',
		'.ps' : 'POSTSCRIPT',
		'.ppt' : 'POWERPOINT',
		'.pptx' : 'POWERPOINT',
		'.mov' : 'QUICKTIME',
		'.rtf' : 'RTF',	
		'.sms' : 'SMS',
		'.css' : 'STYLESHEET',
		'.tiff' : 'TIFFIMAGE',
		'.vsd' : 'VISIO',
		'.doc' : 'WORD',
		'.docx' : 'WORD',
		'.xml' : 'XMLDOC',
		'.zip' : 'ZIP'
	}
}

Util.getMimeTypeToNsContentTypeEnumMap = function(){
	return {
		'application/x-autocad' : 'AUTOCAD',
		'image/x-xbitmap' : 'BMPIMAGE',
		'text/csv' : 'CSV',
		'application/vnd.ms-excel' : 'EXCEL',
		'application/x-shockwave-flash' : 'FLASH',
		'image/gif' : 'GIFIMAGE',
		'application/x-gzip-compressed' : 'GZIP',
		'text/html' : 'HTMLDOC',
		'image/ico' : 'ICON', 
		'text/javascript' : 'JAVASCRIPT',
		'image/jpeg' : 'JPGIMAGE' ,
		'message/rfc822' : 'MESSAGERFC',
		'audio/mpeg' : 'MP3',
		'video/mpeg' : 'MPEGMOVIE',
		'application/vnd.ms-project' : 'MSPROJECT',
		'application/pdf' : 'PDF',
		'image/pjpeg' : 'PJPGIMAGE',
		'text/plain' : 'PLAINTEXT',
		'image/x-png' : 'PNGIMAGE',
		'application/postscript' : 'POSTSCRIPT',
		'application/vnd.ms-powerpoint' : 'POWERPOINT',
		'video/quicktime' : 'QUICKTIME',
		'application/rtf' : 'RTF',
		'application/sms' : 'SMS',
		'text/css' : 'STYLESHEET',
		'image/tiff' : 'TIFFIMAGE',
		'application/vnd.visio' : 'VISIO',
		'application/msword' : 'WORD',
		'text/xml' : 'XMLDOC',
		'application/zip' : 'ZIP'
	}
}

Util.getExtensionToMimeTypeMap = function(){
	return {
		'.3dm': 'x-world/x-3dmf',
		'.3dmf': 'x-world/x-3dmf',
		'.a': 'application/octet-stream',
		'.aab': 'application/x-authorware-bin',
		'.aam': 'application/x-authorware-map',
		'.aas': 'application/x-authorware-seg',
		'.abc': 'text/vnd.abc',
		'.acgi': 'text/html',
		'.afl': 'video/animaflex',
		'.ai': 'application/postscript',
		'.aif': 'audio/aiff',
		'.aifc': 'audio/aiff',
		'.aiff': 'audio/aiff',
		'.aim': 'application/x-aim',
		'.aip': 'text/x-audiosoft-intra',
		'.ani': 'application/x-navi-animation',
		'.aos': 'application/x-nokia-9000-communicator-add-on-software',
		'.aps': 'application/mime',
		'.arc': 'application/octet-stream',
		'.arj': 'application/arj',
		'.art': 'image/x-jg',
		'.asf': 'video/x-ms-asf',
		'.asm': 'text/x-asm',
		'.asp': 'text/asp',
		'.asx': 'video/x-ms-asf',
		'.au': 'audio/basic',
		'.avi': 'video/avi',
		'.avs': 'video/avs-video',
		'.bcpio': 'application/x-bcpio',
		'.bin': 'application/octet-stream',
		'.bm': 'image/bmp',
		'.bmp': 'image/bmp',
		'.boo': 'application/book',
		'.book': 'application/book',
		'.boz': 'application/x-bzip2',
		'.bsh': 'application/x-bsh',
		'.bz': 'application/x-bzip',
		'.bz2': 'application/x-bzip2',
		'.c': 'text/plain',
		'.c++': 'text/plain',
		'.cat': 'application/vnd.ms-pki.seccat',
		'.cc': 'text/plain',
		'.ccad': 'application/clariscad',
		'.cco': 'application/x-cocoa',
		'.cdf': 'application/cdf',
		'.cer': 'application/pkix-cert',
		'.cha': 'application/x-chat',
		'.chat': 'application/x-chat',
		'.class': 'application/java',
		'.com': 'application/octet-stream',
		'.conf': 'text/plain',
		'.cpio': 'application/x-cpio',
		'.cpp': 'text/x-c',
		'.cpt': 'application/x-cpt',
		'.crl': 'application/pkcs-crl',
		'.crt': 'application/pkix-cert',
		'.csh': 'application/x-csh',
		'.css': 'text/css',
		'.cxx': 'text/plain',
		'.dcr': 'application/x-director',
		'.deepv': 'application/x-deepv',
		'.def': 'text/plain',
		'.der': 'application/x-x509-ca-cert',
		'.dif': 'video/x-dv',
		'.dir': 'application/x-director',
		'.dl': 'video/dl',
		'.doc': 'application/msword',
		'.dot': 'application/msword',
		'.dp': 'application/commonground',
		'.drw': 'application/drafting',
		'.dump': 'application/octet-stream',
		'.dv': 'video/x-dv',
		'.dvi': 'application/x-dvi',
		'.dwf': 'model/vnd.dwf',
		'.dwg': 'image/vnd.dwg',
		'.dxf': 'image/vnd.dwg',
		'.dxr': 'application/x-director',
		'.el': 'text/x-script.elisp',
		'.elc': 'application/x-elc',
		'.env': 'application/x-envoy',
		'.eps': 'application/postscript',
		'.es': 'application/x-esrehber',
		'.etx': 'text/x-setext',
		'.evy': 'application/envoy',
		'.exe': 'application/octet-stream',
		'.f': 'text/plain',
		'.f77': 'text/x-fortran',
		'.f90': 'text/plain',
		'.fdf': 'application/vnd.fdf',
		'.fif': 'image/fif',
		'.fli': 'video/fli',
		'.flo': 'image/florian',
		'.flx': 'text/vnd.fmi.flexstor',
		'.fmf': 'video/x-atomic3d-feature',
		'.for': 'text/x-fortran',
		'.fpx': 'image/vnd.fpx',
		'.frl': 'application/freeloader',
		'.funk': 'audio/make',
		'.g': 'text/plain',
		'.g3': 'image/g3fax',
		'.gif': 'image/gif',
		'.gl': 'video/gl',
		'.gsd': 'audio/x-gsm',
		'.gsm': 'audio/x-gsm',
		'.gsp': 'application/x-gsp',
		'.gss': 'application/x-gss',
		'.gtar': 'application/x-gtar',
		'.gz': 'application/x-gzip',
		'.gzip': 'application/x-gzip',
		'.h': 'text/plain',
		'.hdf': 'application/x-hdf',
		'.help': 'application/x-helpfile',
		'.hgl': 'application/vnd.hp-hpgl',
		'.hh': 'text/plain',
		'.hlb': 'text/x-script',
		'.hlp': 'application/hlp',
		'.hpg': 'application/vnd.hp-hpgl',
		'.hpgl': 'application/vnd.hp-hpgl',
		'.hqx': 'application/binhex',
		'.hta': 'application/hta',
		'.htc': 'text/x-component',
		'.htm': 'text/html',
		'.html': 'text/html',
		'.htmls': 'text/html',
		'.htt': 'text/webviewhtml',
		'.htx': 'text/html',
		'.ice': 'x-conference/x-cooltalk',
		'.ico': 'image/x-icon',
		'.idc': 'text/plain',
		'.ief': 'image/ief',
		'.iefs': 'image/ief',
		'.iges': 'application/iges',
		'.igs': 'application/iges',
		'.ima': 'application/x-ima',
		'.imap': 'application/x-httpd-imap',
		'.inf': 'application/inf',
		'.ins': 'application/x-internett-signup',
		'.ip': 'application/x-ip2',
		'.isu': 'video/x-isvideo',
		'.it': 'audio/it',
		'.iv': 'application/x-inventor',
		'.ivr': 'i-world/i-vrml',
		'.ivy': 'application/x-livescreen',
		'.jam': 'audio/x-jam',
		'.jav': 'text/plain',
		'.java': 'text/plain',
		'.jcm': 'application/x-java-commerce',
		'.jfif': 'image/jpeg',
		'.jfif-tbnl': 'image/jpeg',
		'.jpe': 'image/jpeg',
		'.jpeg': 'image/jpeg',
		'.jpg': 'image/jpeg',
		'.jps': 'image/x-jps',
		'.js': 'application/x-javascript',
		'.jut': 'image/jutvision',
		'.kar': 'audio/midi',
		'.ksh': 'application/x-ksh',
		'.la': 'audio/nspaudio',
		'.lam': 'audio/x-liveaudio',
		'.latex': 'application/x-latex',
		'.lha': 'application/octet-stream',
		'.lhx': 'application/octet-stream',
		'.list': 'text/plain',
		'.lma': 'audio/nspaudio',
		'.log': 'text/plain',
		'.lsp': 'application/x-lisp',
		'.lst': 'text/plain',
		'.lsx': 'text/x-la-asf',
		'.ltx': 'application/x-latex',
		'.lzh': 'application/octet-stream',
		'.lzx': 'application/octet-stream',
		'.m': 'text/plain',
		'.m1v': 'video/mpeg',
		'.m2a': 'audio/mpeg',
		'.m2v': 'video/mpeg',
		'.m3u': 'audio/x-mpequrl',
		'.man': 'application/x-troff-man',
		'.map': 'application/x-navimap',
		'.mar': 'text/plain',
		'.mbd': 'application/mbedlet',
		'.mc$': 'application/x-magic-cap-package-1.0',
		'.mcd': 'application/mcad',
		'.mcf': 'text/mcf',
		'.mcp': 'application/netmc',
		'.me': 'application/x-troff-me',
		'.mht': 'message/rfc822',
		'.mhtml': 'message/rfc822',
		'.mid': 'audio/midi',
		'.midi': 'audio/midi',
		'.mif': 'application/x-mif',
		'.mime': 'message/rfc822',
		'.mjf': 'audio/x-vnd.audioexplosion.mjuicemediafile',
		'.mjpg': 'video/x-motion-jpeg',
		'.mm': 'application/base64',
		'.mme': 'application/base64',
		'.mod': 'audio/mod',
		'.moov': 'video/quicktime',
		'.mov': 'video/quicktime',
		'.movie': 'video/x-sgi-movie',
		'.mp2': 'audio/mpeg',
		'.mp3': 'audio/mpeg',
		'.mp4': 'video/mp4',
		'.mpa': 'audio/mpeg',
		'.mpc': 'application/x-project',
		'.mpe': 'video/mpeg',
		'.mpeg': 'video/mpeg',
		'.mpg': 'video/mpeg',
		'.mpga': 'audio/mpeg',
		'.mpp': 'application/vnd.ms-project',
		'.mpt': 'application/vnd.ms-project',
		'.mpv': 'application/vnd.ms-project',
		'.mpx': 'application/vnd.ms-project',
		'.mrc': 'application/marc',
		'.ms': 'application/x-troff-ms',
		'.mv': 'video/x-sgi-movie',
		'.my': 'audio/make',
		'.mzz': 'application/x-vnd.audioexplosion.mzz',
		'.nap': 'image/naplps',
		'.naplps': 'image/naplps',
		'.nc': 'application/x-netcdf',
		'.ncm': 'application/vnd.nokia.configuration-message',
		'.nif': 'image/x-niff',
		'.niff': 'image/x-niff',
		'.nix': 'application/x-mix-transfer',
		'.nsc': 'application/x-conference',
		'.nvd': 'application/x-navidoc',
		'.o': 'application/octet-stream',
		'.oda': 'application/oda',
		'.omc': 'application/x-omc',
		'.omcd': 'application/x-omcdatamaker',
		'.omcr': 'application/x-omcregerator',
		'.p': 'text/x-pascal',
		'.p10': 'application/pkcs10',
		'.p12': 'application/pkcs-12',
		'.p7a': 'application/x-pkcs7-signature',
		'.p7c': 'application/pkcs7-mime',
		'.p7m': 'application/pkcs7-mime',
		'.p7r': 'application/x-pkcs7-certreqresp',
		'.p7s': 'application/pkcs7-signature',
		'.part': 'application/pro_eng',
		'.pas': 'text/pascal',
		'.pbm': 'image/x-portable-bitmap',
		'.pcl': 'application/vnd.hp-pcl',
		'.pct': 'image/x-pict',
		'.pcx': 'image/x-pcx',
		'.pdb': 'chemical/x-pdb',
		'.pdf': 'application/pdf',
		'.pfunk': 'audio/make',
		'.pgm': 'image/x-portable-greymap',
		'.pic': 'image/pict',
		'.pict': 'image/pict',
		'.pkg': 'application/x-newton-compatible-pkg',
		'.pko': 'application/vnd.ms-pki.pko',
		'.pl': 'text/plain',
		'.plx': 'application/x-pixclscript',
		'.pm': 'image/x-xpixmap',
		'.pm4': 'application/x-pagemaker',
		'.pm5': 'application/x-pagemaker',
		'.png': 'image/png',
		'.pnm': 'application/x-portable-anymap',
		'.pot': 'application/vnd.ms-powerpoint',
		'.pov': 'model/x-pov',
		'.ppa': 'application/vnd.ms-powerpoint',
		'.ppm': 'image/x-portable-pixmap',
		'.pps': 'application/vnd.ms-powerpoint',
		'.ppt': 'application/vnd.ms-powerpoint',
		'.ppz': 'application/vnd.ms-powerpoint',
		'.pre': 'application/x-freelance',
		'.prt': 'application/pro_eng',
		'.ps': 'application/postscript',
		'.psd': 'image/x-photoshop',
		'.pvu': 'paleovu/x-pv',
		'.pwz': 'application/vnd.ms-powerpoint',
		'.py': 'text/x-script.phyton',
		'.pyc': 'applicaiton/x-bytecode.python',
		'.qcp': 'audio/vnd.qcelp',
		'.qd3': 'x-world/x-3dmf',
		'.qd3d': 'x-world/x-3dmf',
		'.qif': 'image/x-quicktime',
		'.qt': 'video/quicktime',
		'.qtc': 'video/x-qtc',
		'.qti': 'image/x-quicktime',
		'.qtif': 'image/x-quicktime',
		'.ra': 'audio/x-pn-realaudio',
		'.ram': 'audio/x-pn-realaudio',
		'.ras': 'application/x-cmu-raster',
		'.rast': 'image/cmu-raster',
		'.rexx': 'text/x-script.rexx',
		'.rf': 'image/vnd.rn-realflash',
		'.rgb': 'image/x-rgb',
		'.rm': 'application/vnd.rn-realmedia',
		'.rmi': 'audio/mid',
		'.rmm': 'audio/x-pn-realaudio',
		'.rmp': 'audio/x-pn-realaudio',
		'.rng': 'application/ringing-tones',
		'.rnx': 'application/vnd.rn-realplayer',
		'.roff': 'application/x-troff',
		'.rp': 'image/vnd.rn-realpix',
		'.rpm': 'audio/x-pn-realaudio-plugin',
		'.rt': 'text/richtext',
		'.rtf': 'text/richtext',
		'.rtx': 'text/richtext',
		'.rv': 'video/vnd.rn-realvideo',
		'.s': 'text/x-asm',
		'.s3m': 'audio/s3m',
		'.saveme': 'application/octet-stream',
		'.sbk': 'application/x-tbook',
		'.scm': 'application/x-lotusscreencam',
		'.sdml': 'text/plain',
		'.sdp': 'application/sdp',
		'.sdr': 'application/sounder',
		'.sea': 'application/sea',
		'.set': 'application/set',
		'.sgm': 'text/sgml',
		'.sgml': 'text/sgml',
		'.sh': 'application/x-sh',
		'.shar': 'application/x-shar',
		'.shtml': 'text/html',
		'.sid': 'audio/x-psid',
		'.sit': 'application/x-sit',
		'.skd': 'application/x-koan',
		'.skm': 'application/x-koan',
		'.skp': 'application/x-koan',
		'.skt': 'application/x-koan',
		'.sl': 'application/x-seelogo',
		'.smi': 'application/smil',
		'.smil': 'application/smil',
		'.snd': 'audio/basic',
		'.sol': 'application/solids',
		'.spc': 'text/x-speech',
		'.spl': 'application/futuresplash',
		'.spr': 'application/x-sprite',
		'.sprite': 'application/x-sprite',
		'.src': 'application/x-wais-source',
		'.ssi': 'text/x-server-parsed-html',
		'.ssm': 'application/streamingmedia',
		'.sst': 'application/vnd.ms-pki.certstore',
		'.step': 'application/step',
		'.stl': 'application/sla',
		'.stp': 'application/step',
		'.sv4cpio': 'application/x-sv4cpio',
		'.sv4crc': 'application/x-sv4crc',
		'.svf': 'image/vnd.dwg',
		'.svr': 'application/x-world',
		'.swf': 'application/x-shockwave-flash',
		'.t': 'application/x-troff',
		'.talk': 'text/x-speech',
		'.tar': 'application/x-tar',
		'.tbk': 'application/toolbook',
		'.tcl': 'application/x-tcl',
		'.tcsh': 'text/x-script.tcsh',
		'.tex': 'application/x-tex',
		'.texi': 'application/x-texinfo',
		'.texinfo': 'application/x-texinfo',
		'.text': 'text/plain',
		'.tgz': 'application/x-compressed',
		'.tif': 'image/tiff',
		'.tiff': 'image/tiff',
		'.tr': 'application/x-troff',
		'.tsi': 'audio/tsp-audio',
		'.tsp': 'application/dsptype',
		'.tsv': 'text/tab-separated-values',
		'.turbot': 'image/florian',
		'.txt': 'text/plain',
		'.uil': 'text/x-uil',
		'.uni': 'text/uri-list',
		'.unis': 'text/uri-list',
		'.unv': 'application/i-deas',
		'.uri': 'text/uri-list',
		'.uris': 'text/uri-list',
		'.ustar': 'application/x-ustar',
		'.uu': 'application/octet-stream',
		'.uue': 'text/x-uuencode',
		'.vcd': 'application/x-cdlink',
		'.vcs': 'text/x-vcalendar',
		'.vda': 'application/vda',
		'.vdo': 'video/vdo',
		'.vew': 'application/groupwise',
		'.viv': 'video/vivo',
		'.vivo': 'video/vivo',
		'.vmd': 'application/vocaltec-media-desc',
		'.vmf': 'application/vocaltec-media-file',
		'.voc': 'audio/voc',
		'.vos': 'video/vosaic',
		'.vox': 'audio/voxware',
		'.vqe': 'audio/x-twinvq-plugin',
		'.vqf': 'audio/x-twinvq',
		'.vql': 'audio/x-twinvq-plugin',
		'.vrml': 'application/x-vrml',
		'.vrt': 'x-world/x-vrt',
		'.vsd': 'application/x-visio',
		'.vst': 'application/x-visio',
		'.vsw': 'application/x-visio',
		'.w60': 'application/wordperfect6.0',
		'.w61': 'application/wordperfect6.1',
		'.w6w': 'application/msword',
		'.wav': 'audio/wav',
		'.wb1': 'application/x-qpro',
		'.wbmp': 'image/vnd.wap.wbmp',
		'.web': 'application/vnd.xara',
		'.wiz': 'application/msword',
		'.wk1': 'application/x-123',
		'.wmf': 'windows/metafile',
		'.wml': 'text/vnd.wap.wml',
		'.wmlc': 'application/vnd.wap.wmlc',
		'.wmls': 'text/vnd.wap.wmlscript',
		'.wmlsc': 'application/vnd.wap.wmlscriptc',
		'.word': 'application/msword',
		'.wp': 'application/wordperfect',
		'.wp5': 'application/wordperfect',
		'.wp6': 'application/wordperfect',
		'.wpd': 'application/wordperfect',
		'.wq1': 'application/x-lotus',
		'.wri': 'application/mswrite',
		'.wrl': 'application/x-world',
		'.wrz': 'x-world/x-vrml',
		'.wsc': 'text/scriplet',
		'.wsrc': 'application/x-wais-source',
		'.wtk': 'application/x-wintalk',
		'.xbm': 'image/x-xbitmap',
		'.xdr': 'video/x-amt-demorun',
		'.xgz': 'xgl/drawing',
		'.xif': 'image/vnd.xiff',
		'.xl': 'application/excel',
		'.xla': 'application/vnd.ms-excel',
		'.xlb': 'application/vnd.ms-excel',
		'.xlc': 'application/vnd.ms-excel',
		'.xld': 'application/vnd.ms-excel',
		'.xlk': 'application/vnd.ms-excel',
		'.xll': 'application/vnd.ms-excel',
		'.xlm': 'application/vnd.ms-excel',
		'.xls': 'application/vnd.ms-excel',
		'.xlt': 'application/vnd.ms-excel',
		'.xlv': 'application/vnd.ms-excel',
		'.xlw': 'application/vnd.ms-excel',
		'.xm': 'audio/xm',
		'.xml': 'application/xml',
		'.xmz': 'xgl/movie',
		'.xpix': 'application/x-vnd.ls-xpix',
		'.xpm': 'image/xpm',
		'.x-png': 'image/png',
		'.xsr': 'video/x-amt-showrun',
		'.xwd': 'image/x-xwd',
		'.xyz': 'chemical/x-pdb',
		'.z': 'application/x-compressed',
		'.zip': 'application/zip',
		'.zoo': 'application/octet-stream',
		'.zsh': 'text/x-script.zsh'
	}
}	

//TODO
//Util.getMimeTypeToExtensionMap = function(){
	
//}

Util.inferNsContentTypeFromExtension = function(/*String*/fileName){
	
	if(!fileName || fileName.indexOf('.') === -1)
		return null;
		
	var ext = fileName.substring(fileName.lastIndexOf('.'), fileName.length);
	return Util.getExtensionToNSContentTypeEnumMap()[ext];
}

/*
    http://www.JSON.org/json2.js
    2009-08-17

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html

    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.

    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.
*/

/*jslint evil: true */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/

"use strict";

// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (!this.JSON) {
    this.JSON = {};
}

(function () {

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf()) ?
                   this.getUTCFullYear()   + '-' +
                 f(this.getUTCMonth() + 1) + '-' +
                 f(this.getUTCDate())      + 'T' +
                 f(this.getUTCHours())     + ':' +
                 f(this.getUTCMinutes())   + ':' +
                 f(this.getUTCSeconds())   + 'Z' : null;
        };

        String.prototype.toJSON =
        Number.prototype.toJSON =
        Boolean.prototype.toJSON = function (key) {
            return this.valueOf();
        };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ?
            '"' + string.replace(escapable, function (a) {
                var c = meta[a];
                return typeof c === 'string' ? c :
                    '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            }) + '"' :
            '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0 ? '[]' :
                    gap ? '[\n' + gap +
                            partial.join(',\n' + gap) + '\n' +
                                mind + ']' :
                          '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    k = rep[i];
                    if (typeof k === 'string') {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0 ? '{}' :
                gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' +
                        mind + '}' : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                     typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/.
test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@').
replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function' ?
                    walk({'': j}, '') : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());


