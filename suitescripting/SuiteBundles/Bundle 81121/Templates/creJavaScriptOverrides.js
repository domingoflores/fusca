//------------------------------------------------------------------------------------------------------------------------------------
//Purpose: 	This is the "built-in" JavaScript Override file which allows us to easily enhance and extend the functionality of CRE
//				without modifying the core CRE Crud code.
//
//			Clients can also add their own JavaScript override file which will be added to this.
//
//			To avoid conflicts, we will use the standard "cre" prefix whenever possible.
//------------------------------------------------------------------------------------------------------------------------------------


//====================================================================================================================================
// JavaScript prototype extensions 
//====================================================================================================================================

if (!Number.prototype.numberWithCommas) {
	Number.prototype.numberWithCommas = function(){
		return this.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
	};
}

if (!Number.prototype.accountingNumberWithCommas) {
	Number.prototype.accountingNumberWithCommas = function(){
		if (this < 0)
			return "(" + Math.abs(this).toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,") + ")";
		else
			return this.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");			
	};
}

if (!String.prototype.replaceAll) {
	String.prototype.replaceAll = function(replaceWhat, replaceWith) {
		return this.replace(new RegExp(replaceWhat, 'g'), replaceWith);
	};
}

if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position){
      position = position || 0;
      return this.substr(position, searchString.length) === searchString;
  };
}

if (!String.prototype.endsWith) {
	String.prototype.endsWith = function(suffix) {
		return this.slice(-suffix.length) == suffix;
	};
}

if (!String.prototype.removeTrailing) {
	String.prototype.removeTrailing = function(charToRemove) {
		var regExp = new RegExp(charToRemove + "+$");
		return this.replace(regExp, "");
	}	
}

// provides "recursive" parsing of strings.  if a template references ${record.memo} and the contents of the "memo" field have blah blah ${record.tranid} -- then that content will be parsed as well
String.prototype.parseTrimPath = function(){
  return this.process(creRecord.RawData); 
};

if (!String.prototype.formatDate) {
	String.prototype.formatDate = function(format) {
		
		return _formatDate(new Date(this), format);
	};
}


if (!Date.prototype.format) {
	Date.prototype.format = function(format) {
		return _formatDate(this, format);
	};
}

//====================================================================================================================================
//Date Localization Functions 
//====================================================================================================================================

if (!Date.prototype.localized) {
	Date.prototype.localized = function(overrideLocaleId) {
		return _localizedDate(this, overrideLocaleId);
	};
}


_generateCustomFields = function() {
	
	if (creRecord.DataRecordType == "-30") {
		// nlapiLogExecution("AUDIT","name2=", creRecord.Name);
		// nlapiLogExecution("AUDIT","recType2=", creRecord.DataRecordType);
		// nlapiLogExecution("AUDIT","recName2=", creRecord.RecordName);
		// nlapiLogExecution("AUDIT","engine2=", creRecord.TemplateEngine);

		var recName = creRecord.RecordName;
		
		nlapiLogExecution("AUDIT","recName=", recName);
		
		try {
			
			switch (creRecord.RawData[recName].recordtype) {
				case "invoice" :
					var TRAN = nlapiLoadRecord(creRecord.RawData[recName].recordtype, creRecord.RawData[recName].id);
				
					creRecord.RawData[recName].shippingCost = TRAN.getFieldValue("shippingcost");
					creRecord.RawData[recName].amountPaid = TRAN.getFieldValue("amountpaid");
					creRecord.RawData[recName].amountRemaining = TRAN.getFieldValue("amountremaining");
					creRecord.RawData[recName].amountRemainingTotalBox = TRAN.getFieldValue("amountremainingtotalbox");
					
					break;
			} // switch 
			
		} catch (e) {
			nlapiLogExecution("ERROR", "retrieveInvoiceTotals", e.message);
		}
		
	}



}

_formatDate = function (d, format) {

	var element = "";
	var i = 0;
	var result = "";

	if (! (d instanceof Date))
		d = new Date(d);
	
	do {
		// console.log("at position " + i + " element = " + element);

		if ( (element.length > 0) && (format.charAt(i).toLowerCase() != element.substring(element.length-1).toLowerCase()) ) {
			result += formatDateElement(d, element);
			element = "";
		}
		element += format.charAt(i++);
	} while (i <= format.length);

	if (element.length > 0)
		result += formatDateElement(d, element);

	return result;
}


_localizedDate = function(d, overrideLocaleId) {
	
	var localeId = creRecord.RawData.LocaleId;
	
	nlapiLogExecution("DEBUG", "_localizedDate", " native Locale=" + localeId);
	
	var dateFormat;
	
	if (overrideLocaleId) {
		dateFormat = getLocaleDateFormat(overrideLocaleId);
		if (dateFormat)
			return _formatDate(d, dateFormat);
	}
	
	
	if (localeId) {
		dateFormat = getLocaleDateFormat(localeId);
		if (dateFormat)
			return _formatDate(d, dateFormat);		
	} 
	
		
	if (creRecord.DefaultLocale) {
		dateFormat = getLocaleDateFormat(creRecord.DefaultLocale);
		if (dateFormat)
			return _formatDate(d, dateFormat);		
	} 
	
	// go with a default
	return _formatDate(d, "dd-MMM-yyyy");
}


function getLocaleDateFormat(localeId) {
	var filters = new Array();		
	filters.push(new nlobjSearchFilter("internalid",null,"anyof",localeId));
	filters.push(new nlobjSearchFilter("isinactive",null,"is","F"));
	var searchResults = nlapiSearchRecord("customrecord_pri_cre_locales_available",null, filters, [new nlobjSearchColumn('custrecord_pri_cre_locales_available_dtf')]) || [];

	nlapiLogExecution("DEBUG","getLocaleDateFormat"," looking for locale " + localeId + " yields " + searchResults.length + " results");
	
	if (searchResults.length > 0)
		return searchResults[0].getValue("custrecord_pri_cre_locales_available_dtf");
		
}


//====================================================================================================================================
//Functions related to Currency Formatting 
//====================================================================================================================================


_.currencyCache = [];	// this is an array of objects: each object contains a currency code, optionally a customer ID, a currency symbol, and a flag indicating whether the symbols goes before (1) or after (2) the number


//formats a number as currency, based on the definition of the currency code, but optionally

function lookupCurrencyFormat(currencyId, customerId) {
	

	for (var key in _.currencyCache) {
		var obj = _.currencyCache[key];
		
		if (customerId) {
			if ((obj.currencyId==currencyId) && (obj.customerId==customerId)) 
				return obj;							
		} else
			if (obj.currencyId==currencyId) 
				return obj;							
	}
	
	// couldn't find in cache, so add it
	
	if (customerId) {
		var C = nlapiLoadRecord("customer", customerId);
		for (var i = 1; i <= C.getLineItemCount("currency"); i++) 
			if (C.getLineItemValue("currency","currency",i) == currencyId) {
				var obj = {customerId: customerId, currencyId: currencyId, symbolPlacement: C.getLineItemValue("currency","symbolplacement", i), displaySymbol: C.getLineItemValue("currency","displaysymbol", i)};
				_.currencyCache.push(obj);
				return obj;				
			}		
	}
		
	// we get here either if there was no customer, or the customer doesn't have this currency defined
	
	var C = nlapiLoadRecord("currency", currencyId);
	
	var obj = {currencyId: currencyId, symbolPlacement: C.getFieldValue("symbolplacement"), displaySymbol: C.getFieldValue("displaysymbol")};
	_.currencyCache.push(obj);
	return obj;				

}

_formatCurrency = function(amt, currencyId, customerId) {
	var amtStr = parseFloat(amt).numberWithCommas();
	
	var obj = lookupCurrencyFormat(currencyId, customerId);
	
	if (obj.symbolPlacement == 1)
		return obj.displaySymbol + amtStr;
	else
		return amtStr + obj.displaySymbol;
	
}


// ?

//====================================================================================================================================
//Functions related to Locale translations 
//====================================================================================================================================



// this function will lookup the "Locale" element identified by elementName, and attempt to translate it to the localization as referenced
//	by profile's localization field. there are a few scenarios:
//		elementName doesn't exist
//		elementName exists, but not in the preferred localizations
//		elementName exists and has proper localization
//		under either of the 1st two scenarios, the function will either return nothing, or an appropriate error string, if the checkbox
//			is set on the profile

// this version allows you to call it like this:  ${var_name.localized()}
//		or even ${"transaction_title".localized()}

_.localizedElements = [];
_.cacheLoaded = false;



String.prototype.localized = function(overrideLocaleId) {
	return localized(this, overrideLocaleId);
};


_getLocalized = function(elementName, overrideLocaleId ) {
	return localized(elementName, overrideLocaleId);
}

function setDefaultLocale() {
	
	// nlapiLogExecution("AUDIT", "ROOT", "creRecord.DefaultLocale=" + creRecord.DefaultLocale);
	// nlapiLogExecution("AUDIT", "ROOT","Currency=" + creRecord.RawData.CurrencyId);

	var funcName = "setDefaultLocale";
	
	try {
		
		if (creRecord.RawData.CurrencyId) {
			var currencyDefaultLocaleId = getLocaleFromCurrency(creRecord.RawData.CurrencyId);
			if (currencyDefaultLocaleId) {
				creRecord.DefaultLocale = currencyDefaultLocaleId;	
				creRecord.CurrencyLocaleId = currencyDefaultLocaleId;
				nlapiLogExecution("AUDIT", "ROOT", "CurrencyDefaultLocaleId=" + creRecord.CurrencyLocaleId);
			} 
			nlapiLogExecution("AUDIT", "ROOT", "NOW creRecord.DefaultLocale=" + creRecord.DefaultLocale);
			creRecord.RawData.CurrencyId = "";
		}

	} catch (e) {
		nlapiLogExecution("ERROR", funcName, e.toString());
	}
	
}

function getLocaleFromCurrency(currencyId) {

	var funcName = "getLocaleFromCurrency " + currencyId;
	
	try {
		var filters = new Array();		
		filters.push(new nlobjSearchFilter("custrecord_pri_cre_locales_available_cur",null,"anyof",currencyId));
		filters.push(new nlobjSearchFilter("isinactive",null,"is","F"));
		
		var searchResults = nlapiSearchRecord("customrecord_pri_cre_locales_available",null, filters, null) || [];

		if (searchResults.length != 0)
			nlapiLogExecution("AUDIT","getLocaleFromCurrency","currency " + currencyId + " is associated with " + searchResults.length + " locales");
		
		if (searchResults.length > 0)
			return searchResults[0].getId();
		
	} catch (e) {
		nlapiLogExecution("ERROR", funcName, e.toString());
	}
	
}

function loadLocalizationCache() {
	
	var funcName = "loadLocalizationCache";
	
	var filters = new Array();		
	filters.push(new nlobjSearchFilter("isinactive",null,"is","F"));

	// create search; alternatively nlapiLoadSearch() can be used to load a saved search
	// var savedSearch = nlapiSearchRecord("customrecord_pri_cre_locale_el",null, filters, [new nlobjSearchColumn('custrecord_pri_cre_locale_el_id'),new nlobjSearchColumn('custrecord_pri_cre_locale_el_value'),new nlobjSearchColumn('custrecordpri_cre_locale_el_locales')]) || [];
	var savedSearch = nlapiCreateSearch("customrecord_pri_cre_locale_el", filters, [new nlobjSearchColumn('custrecord_pri_cre_locale_el_id'),new nlobjSearchColumn('custrecord_pri_cre_locale_el_value'),new nlobjSearchColumn('custrecordpri_cre_locale_el_locales')]);
	var completeSearchResult = savedSearch.runSearch();

	// resultIndex points to record starting current resultSet in the entire results array 
	var resultIndex = 0; 
	var resultStep = 1000; // Number of records returned in one step (maximum is 1000)
	var searchResults; // temporary variable used to store the result set
	do 
	{
	    // fetch one result set
	    searchResults = completeSearchResult.getResults(resultIndex, resultIndex + resultStep);

		nlapiLogExecution("AUDIT", funcName, "search retrieved " + searchResults.length + " rows");

		for (i = 0; i < searchResults.length; i++) {
			var list = searchResults[i].getValue("custrecordpri_cre_locale_el_locales").split(",");
			// nlapiLogExecution("AUDIT", funcName, "search row " + i + " element " + searchResults[i].getValue("custrecord_pri_cre_locale_el_value") + " has locales " + searchResults[i].getValue("custrecordpri_cre_locale_el_locales") + " | " + searchResults[i].getText("custrecordpri_cre_locale_el_locales")) 

			for (j = 0; j < list.length; j++) {

				var key = searchResults[i].getValue("custrecord_pri_cre_locale_el_id") + "." + list[j];
				
				// nlapiLogExecution("AUDIT", funcName, "Locale # " + j + " key = " + key);
				
				_.localizedElements[key] = searchResults[i].getValue("custrecord_pri_cre_locale_el_value"); 
			}
		}
		
	    // increase pointer
	    resultIndex = resultIndex + resultStep;

	// once no records are returned we already got all of them
	} while (searchResults.length > 0)
	
	
	_.cacheLoaded = true;
	
}


function lookupLocalizedElement(elementName, localeId, defaultLocaleId) {
	var funcName = "lookupLocalizedElement " + elementName + "," + localeId;

	try {

		// nlapiLogExecution("AUDIT", "lookupLocalizedElement","searching for element " + elementName + " in locale " + localeId + " or " + defaultLocaleId);
		
		if (!_.cacheLoaded) {
			loadLocalizationCache();

			nlapiLogExecution("AUDIT", "lookupLocalizedElement"," cache loaded with " + Object.keys(_.localizedElements).length + " elements");		
		} 
		
		return _.localizedElements[elementName + "." + localeId] || _.localizedElements[elementName + "." + defaultLocaleId];

	} catch (e) {
		nlapiLogExecution("ERROR", funcName, e.toString());
		return e.toString();		
	}
	
}


//====================================================================================================================================
//TrimPath extensions.  Use with the "|" modifiier.    
//Reference:					http://www.summitdowntown.org/site_media/media/javascript/private/trimpath-template-docs/JavaScriptTemplateModifiers.html
//Sample Usage in TrimPath:     ${summaries[0].columns.amount|words} 
//====================================================================================================================================

//define a JST modifier for our special handling
var modifiers = {
	"br" : function(str){
		return str.replace(/\n/g, '<br />');
	},
	"words" : toWords,
	"localized" : localized,
	"commas": Commas		// this is similar to the "numberWithCommas" prototype extension
};

function Commas(x){
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
};

//Convert numbers to words
//copyright 25th July 2006, by Stephen Chapman http://javascript.about.com
//permission to use this Javascript on your web page is granted
//provided that all of the code (including this copyright notice) is
//used exactly as shown (you can change the numbering system if you wish)
function toWords(s){
	//American Numbering System
	var th = ['','thousand','million', 'billion','trillion'];
	
	//uncomment this line for English Number System
	//var th = ['','thousand','million', 'milliard','billion'];

	var dg = ['zero','one','two','three','four', 'five','six','seven','eight','nine']; 
	var tn = ['ten','eleven','twelve','thirteen', 'fourteen','fifteen','sixteen', 'seventeen','eighteen','nineteen']; 
	var tw = ['twenty','thirty','forty','fifty', 'sixty','seventy','eighty','ninety']; 
	
	s = s.toString(); 
	s = s.replace(/[\, ]/g,''); 
	if (s != parseFloat(s)) return 'not a number'; 
	var x = s.indexOf('.'); if (x == -1) x = s.length; 	if (x > 15) return 'too big'; 
	var n = s.split(''); var str = ''; 	var sk = 0; 
	for (var i=0; i < x; i++) {if ((x-i)%3==2) {if (n[i] == '1') {str += tn[Number(n[i+1])] + ' '; i++; sk=1;} else if (n[i]!=0) {str += tw[n[i]-2] + ' ';sk=1;}} else if (n[i]!=0) {str += dg[n[i]] +' '; if ((x-i)%3==0) str += 'hundred ';sk=1;} if ((x-i)%3==1) {if (sk) str += th[(x-i-1)/3] + ' ';sk=0;}} if (x != s.length) {var y = s.length; str += 'point '; for (var i=x+1; i<y; i++) str += dg[n[i]] +' ';} return str.replace(/\s+/g,' ');
};


// this will become one of the "modifiers" of TrimPath, and will allow you to call it using the following syntax:

//		${var_name|localized}
//or	${"transaction_title"|localized}

// modifiers can be linked together, so you can use {$"bank_info"|localized|br}

function localized(s, overrideLocaleId) {

	var funcName = "MODIFIER.localized";
	
	try {
		
		setDefaultLocale();

		// nlapiLogExecution("AUDIT", "localized","element=" + s + "; override=" + overrideLocaleId + "; RawData.LocaleId=" + creRecord.RawData.LocaleId + "; DefaultLocale=" + creRecord.DefautlLocale + "; RawData.DefaultLocale=" + creRecord.RawData.DefautlLocale);

		//nlapiLogExecution("AUDIT", "localized","creRecord.RawData.LocaleId="+creRecord.RawData.LocaleId);
		//nlapiLogExecution("AUDIT", "localized","creRecord.DefaultLocale="+creRecord.DefaultLocale);
		//nlapiLogExecution("AUDIT", "localized","creRecord.RawData.TemplateFields.DefaultLocale="+creRecord.RawData.TemplateFields.DefaultLocale);		

		//var x = JSON.parse(JSON.stringify(creRecord.RawData));
		//delete x.invoice;
		//delete x.deposititems;
		//delete x.parent;
		//delete x.customer;
		//delete x.syntheticCompanyFields;
		//delete x.syntheticUserFields;
		//delete x.syntheticPreferencesFields;
		//delete x.userpreferences;
		//delete x.companyinformation;
		//delete x.companypreferences;
		
		// nlapiLogExecution("AUDIT", "localized","creRecord=" + JSON.stringify(x));
		
		// nlapiLogExecution("AUDIT", funcName, "requesting localization of " + s + " using " + overrideLocaleId);
		
		// a shortcut for using the locale based on currency
		if (overrideLocaleId && overrideLocaleId.toString().toLowerCase() == "currency") {
			if (creRecord.currencyLocaleId)
				overrideLocaleId = creRecord.currencyLocaleId;
		}
		
		if (overrideLocaleId)
			localeId = overrideLocaleId;
		else			
			if (creRecord.RawData.LocaleId)
				localeId = creRecord.RawData.LocaleId;
			else
				if (creRecord.RawData.TemplateFields && creRecord.RawData.TemplateFields.DefaultLocale) 
					localeId = creRecord.RawData.TemplateFields.DefaultLocale;
				else
					if (creRecord.ShowMissingTranslations == "T") 
						return "[[[ Cant' determine which Locale to use (Set or Default) for element '" + s + "' ]]]";
					else
						return "";
		
		var elementValue = lookupLocalizedElement(s, localeId, creRecord.DefaultLocale);
		
		if (elementValue == null) 		
			if (creRecord.ShowMissingTranslations == "T") 
				return "[[[ No Translation found for Element '" + s + "' ]]]";
			else
				return "";
		else
			return elementValue;
					
		
	} catch (e) {
		nlapiLogExecution("ERROR", funcName, e.toString());
	}

}

//here, we inject the Modifiers into the structure which TrimPath expects as a hook point "_MODIFIERS"
this.RawData._MODIFIERS = modifiers;

// this.RawData.CurrencyLocaleId = getLocaleFromCurrency(creRecord.RawData.CurrencyId);

//====================================================================================================================================
// Additions to the data environment
//====================================================================================================================================

if (creRecord.RawData && creRecord.RawData.syntheticCompanyFields)
{
       creRecord.RawData.Environment = String(creRecord.RawData.syntheticCompanyFields.loginURL).indexOf('sandbox')>0 ? 'SANDBOX' : 'PRODUCTION';
}





//====================================================================================================================================
//Internal support functions
//====================================================================================================================================


function formatDateElement(dt, format) {

	var monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
	var dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

	switch (format.toLowerCase()) {

		case "m" : 		return dt.getMonth()+1;
						break;
	
		case "mm" :		return dt.getMonth() < 9 ? "0" + (dt.getMonth() + 1).toString() : dt.getMonth()+1;
						break;
	
		case "mmm" :	return (format == "MMM") ? monthNames[dt.getMonth()].substring(0,3).toUpperCase() : monthNames[dt.getMonth()].substring(0,3);
						break;              
	
		case "mmmm" : 	return (format == "MMMM") ?  monthNames[dt.getMonth()].toUpperCase() : monthNames[dt.getMonth()];
						break;
	
		case "d" :		return dt.getDate();
						break;
	
		case "dd" : 	return (dt.getDate() < 10) ? "0" + (dt.getDate()).toString() : dt.getDate();
						break;
	
		case "ddd" : 	return (format == "DDD") ? dayNames[dt.getDay()].substring(0,3).toUpperCase() : dayNames[dt.getDay()].substring(0,3);
						break;              
	
		case "dddd" : 	return (format == "DDDD") ? dayNames[dt.getDay()].toUpperCase() : dayNames[dt.getDay()];
						break;
	
		case "yy" : 	return dt.getFullYear() % 100;
						break;
	
		case "yyyy" : 	return dt.getFullYear();
						break;
	
						
		case "h" :		return dt.getHours();
						break;
						
		case "hh" : 	return (dt.getHours() < 10) ? "0" + (dt.getHours()).toString() : dt.getHours();
						break;
	
		case "n" :		return dt.getMinutes();
						break;
	
		case "nn" : 	return (dt.getMinutes() < 10) ? "0" + (dt.getMinutes()).toString() : dt.getMinutes();
						break;
	
		case "s" :		return dt.getSeconds();
						break;
	
		case "ss" :		return (dt.getSeconds() < 10) ?  "0" + (dt.getSeconds()).toString() : dt.getSeconds();
						break;
	
		default: 
			return format;
	}

}