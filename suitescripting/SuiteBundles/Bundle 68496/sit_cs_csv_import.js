/*
*Summit IT Services LLC Copyright Notice
*
* Copyright © 2014 Summit IT Services LLC. All rights reserved. 
* This material may not be resold or redistributed without prior written 
* permission from Summit IT Services LLC. If you have any questions about
* these terms, please contact Summit IT Services LLC at +1 (970) 422-5022,
* or send email to admin@summitit.com.
*/

function parseImportJobLineResults() {
	try {
		loadStateListBasedOnCountry();
		var results = nlapiGetFieldValue('custrecord_si_csv_ibl_results');
		var validationObj = JSON.parse(results);
		if(!validationObj.hasOwnProperty('CSV_IMPORT')) { return; }
		for(var prop in validationObj.CSV_IMPORT) {
			if(validationObj.CSV_IMPORT.hasOwnProperty(prop)) {
				try {
					jQuery('#'+validationObj.CSV_IMPORT[prop].field).addClass('sit_validation_error');
					jQuery('#'+validationObj.CSV_IMPORT[prop].field).attr('title',validationObj.CSV_IMPORT[prop].message);
					jQuery('#'+validationObj.CSV_IMPORT[prop].field+'_fs_lbl a').addClass('sit_validation_error');
					jQuery('#'+validationObj.CSV_IMPORT[prop].field+'_display').addClass('sit_validation_error');
					jQuery('#'+validationObj.CSV_IMPORT[prop].field+'_display').attr('title',jQuery('#'+validationObj.CSV_IMPORT[prop].field+'_display').attr('title')+validationObj.CSV_IMPORT[prop].message);
//					nlapiGetField('custrecord_si_csv_ibl_customer_rec_display') 
				} catch(e) {}
			}
		}
		var test = true;
	} catch(e) {
		var err = e;
		var test = true;
	}
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord customrecord_si_csv_import_batch_line
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function sitJobLineFieldChanged(type, name, linenum) {
	if(name=='custpage_lotdelivery_dd') {
		nlapiSetFieldValue('custrecord_si_csv_ibl_lot_delivery',nlapiGetFieldValue('custpage_lotdelivery_dd'),false,true);
	} else if(name=='custpage_certstatus_dd') {
		nlapiSetFieldValue('custrecord_si_csv_ibl_certificate_status',nlapiGetFieldValue('custpage_certstatus_dd'),false,true);
	} else if(name=='custpage_securitytype_dd') {
		nlapiSetFieldValue('custrecord_si_csv_ibl_security_type',nlapiGetFieldValue('custpage_securitytype_dd'),false,true);
	} else if(name=='custpage_state_dd') {
		nlapiSetFieldValue('custrecord_si_csv_ibl_state',nlapiGetFieldValue('custpage_state_dd'),false,true);
	} else if(name=='custpage_country_dd') {
		var country = nlapiGetFieldValue('custpage_country_dd');
		nlapiSetFieldValue('custrecord_si_csv_ibl_country',country,false,true);
		loadStateListBasedOnCountry();
	}
}

function loadStateListBasedOnCountry() {
	try {
		var country = nlapiGetFieldValue('custpage_country_dd');
		if(country == null || country == '') {
			nlapiDisableField('custrecord_si_csv_ibl_state',false);
		} else {
			/* lookup country/states */
			var nameCol = new nlobjSearchColumn('name');
			var abbrCol = new nlobjSearchColumn('custrecord_state_abbreviation');
			var results = nlapiSearchRecord('customrecord_states',null,[['custrecord_state_country.name','is',country]],[nameCol,abbrCol]);
			nlapiRemoveSelectOption('custpage_state_dd');
			if(results != null && results.length>0) {
				nlapiDisableField('custpage_state_dd',false);
				nlapiInsertSelectOption('custpage_state_dd','','');
				for(var rL=0;results!=null && rL<results.length;rL++) {
					nlapiInsertSelectOption('custpage_state_dd',results[rL].getValue(nameCol),results[rL].getValue(nameCol),false);
				}
				nlapiSetFieldMandatory('custrecord_si_csv_ibl_state',true);
				nlapiDisableField('custrecord_si_csv_ibl_state',true);
				nlapiSetFieldValue('custpage_state_dd',nlapiGetFieldValue('custrecord_si_csv_ibl_state'));
			} else {
				nlapiSetFieldMandatory('custrecord_si_csv_ibl_state',false);
				nlapiDisableField('custpage_state_dd',true);
				nlapiDisableField('custrecord_si_csv_ibl_state',false);
			}
		}
	} catch(e) {
		alert(e);
	}
}

function sitLogEndOfRequest() {
	/* netsuite native logEndOfRequest Client-Side function */
	if (!window.doPageLogging) {
		return;
	}
	try {
		var u = new Date();
		var n = null;
		var F = {}, y;
		var k = /(\w+):([^|]*)/g;
		var E = GetCookie("base_t") || "";
		while (y = k.exec(E)) {
			F[y[1]] = unescape(y[2]);
		}
		var w = F.start;
		var j = F.url;
		var A = nvl(F.sqlcalls, 0);
		var t = F.sqltime;
		var G = F.servertime;
		var g = F.ssstime;
		var f = F.swftime;
		var I = F.email;
		var q = F.fcalls;
		var a = F.ftime;
		if (w && j && unescape(document.location.href).indexOf(j) != -1) {
			document.cookie = "base_t=; path=/";
			n = u.getTime() - w;
			window.pageEndToEndTime = n;
		}
		var b = window.renderstarttime != null ? u.getTime() - window.renderstarttime.getTime() : 0;
		var H = window.pageinitstart != null ? (u.getTime() - window.pageinitstart.getTime()) : 0;
		var D = window.headerstarttime != null ? (window.headerendtime.getTime() - window.headerstarttime.getTime()) : 0;
		var r = window.staticscriptstarttime != null ? (window.staticscriptendtime.getTime() - window.staticscriptstarttime.getTime()) : 0;
		var p = window.dynamicscriptstarttime != null ? (window.dynamicscriptendtime.getTime() - window.dynamicscriptstarttime.getTime()) : 0;
		var C = window.footerscriptstarttime != null ? (window.footerscriptendtime.getTime() - window.footerscriptstarttime.getTime()) : 0;
		var d = b - H - D - r - p - C - (window.dropdownCounter > 0 ? window.dropdownloadtime : 0);
		var o = document.getElementById("devpgloadtime");
		if (o != null) {
			var v = '<table cellspacing=5 cellpadding=0 class="smalltextnolink">';
			if (n != null) {
				v = addPetDataRow(v, "Total", (n / 1000));
				if (window.isProdsys) {
					v = addPetDataRow(v, "Server", ((G) / 1000) + " (" + format_currency(100 * (G) / n) + "%)");
					if (g != null) {
						v = addPetDataRow(v, "Server Suite Script", (g / 1000) + " (" + format_currency(100 * g / n) + "%)");
					}
					if (f != null) {
						v = addPetDataRow(v, "Server Workflow", (f / 1000) + " (" + format_currency(100 * f / n) + "%)");
					}
					v = addPetDataRow(v, "Network", ((n - G - b) / 1000) + " (" + format_currency(100 * (n - G - b) / n) + "%)");
					v = addPetDataRow(v, "Client", (b / 1000) + " (" + format_currency(100 * b / n) + "%)");
				} else {
					v = addPetDataRow(v, "Java", ((G - t) / 1000) + " (" + format_currency(100 * (G - t) / n) + "%)");
					if (g != null) {
						v = addPetDataRow(v, "SSS", (g / 1000) + " (" + format_currency(100 * g / n) + "%)");
					}
					if (f != null) {
						v = addPetDataRow(v, "SWF", (f / 1000) + " (" + format_currency(100 * f / n) + "%)");
					}
					v = addPetDataRow(v, "SQL", (t / 1000) + " (" + format_currency(100 * t / n) + "%) (" + A + " call" + (A == 1 ? "" : "s") + ")");
					v = addPetDataRow(v, "Fetches", (a / 1000) + " (" + q + " call" + (q == 1 ? "" : "s") + ")");
					v = addPetDataRow(v, "Network", ((n - G - b) / 1000) + " (" + format_currency(100 * (n - G - b) / n) + "%)");
					v = addPetDataRow(v, "Client", (b / 1000) + " (" + format_currency(100 * b / n) + "%)");
				}
			} else {
				v = addPetDataRow(v, "Client", (b / 1000));
			}
			if (!window.isProdsys) {
				v = addPetDataRow(v, "Header", (D / 1000) + " (" + format_currency(100 * D / b) + "%)");
				v = addPetDataRow(v, "Static", (r / 1000) + " (" + format_currency(100 * r / b) + "%)");
				v = addPetDataRow(v, "Dynamic", (p / 1000) + " (" + format_currency(100 * p / b) + "%)");
				v = addPetDataRow(v, "Footer", (C / 1000) + " (" + format_currency(100 * C / b) + "%)");
				v = addPetDataRow(v, "Selects", (window.dropdownloadtime / 1000) + " (" + format_currency(100 * window.dropdownloadtime / b) + "%) (" + window.dropdownCounter + " dropdown" + (window.dropdownCounter != 1 ? "s" : "") + ")");
				var z = window.editmachineCounter > 0 ? "(" + window.editmachineCounter + " machine" + (window.editmachineCounter != 1 ? "s" : "") + ": " + (window.editmachineConstructorTime / 1000) + ")" : "";
				v = addPetDataRow(v, "PageInit", (H / 1000) + " (" + format_currency(100 * H / b) + "%) " + z);
				v = addPetDataRow(v, "Other", (d / 1000) + " (" + format_currency(100 * d / b) + "%)");
			}
			v = addPetDataRow(v, "Page", emptyIfNull(j));
			v = addPetDataRow(v, "Email", emptyIfNull(I));
			v = addPetDataRow(v, "Time", getdatestring(u) + " " + gettimestring(u) + " GMT " + (u.getTimezoneOffset() > 0 ? "+" : "") + (u.getTimezoneOffset() / 60));
			v += "</table>";
			o.ondblclick = new Function("nlShowPet('', 'get_nlPetContent().submitAsCase()','" + v + "');");
		}
		if (window.doPerfdbLogging && n != null && parseInt(n) > (parseInt(b) + parseInt(G))) {
			if (window.renderstarttime != null) {
				F.pageload = b;
			}
			if (window.headerstarttime != null) {
				F.header = D;
			}
			if (window.pageinitstart != null) {
				F.pageinit = H;
			}
			if (window.staticscriptstarttime != null) {
				F.staticscript = r;
			}
			if (window.dynamicscriptTime != null) {
				F.dynamicscript = p;
			}
			if (window.footerscriptTime != null) {
				F.footerscript = C;
			}
			F.endtoend = n;
			new NLXMLHttpRequest(true).requestURL("/app/PerfRenderTime.nl", F, null, true);
		}
	} catch (B) {
	}
}