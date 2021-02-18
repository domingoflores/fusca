/**
 * Sync signatures from the PPS server to the custrecord_pp_signatures record.
 * 
 * Version    Date            Author           Remarks
 * 1.00       13 Sep 2013     maxm
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
$PPS.debug = true;
$PPS.where = "PP_SL_Signatures";

function suitelet(request, response){

	$PPS.log("*** Start ***");
	var hideNavBar = false;
	var title = "AvidXchange Signatures";
    var ctx = nlapiGetContext();
    var form = nlapiCreateForm(title, hideNavBar);

    var group2 = form.addFieldGroup('custpage_maingroup2', ' ');
    group2.setSingleColumn(true);
    form.addSubmitButton('Sync signatures');    

    if(request.getMethod() == 'POST'){
    	var url = $PPS.nlapiOutboundSSO();
    	
    	var resp = $PPS.NSRestReq(url, null, $PPS.httpVerbs.get);

        $PPS.log(resp);
        if(resp.httpcode == '401'){
        	form.addField("custpage_label", "label", "Error: Your AvidXchange Self-Managed account has not been setup or is inactive. "+
					"Please contact AvidXchange support at 800.621.5720 or send an email to <a href=\"mailto:supportdepartment@avidxchange.com\">supportdepartment@avidxchange.com</a>.");
        }
        else{
	        try{
	        	var data = JSON.parse(resp.httpbody);
	        	// Get the list of signatures from the NetSuite side
	        	var searchColumns = [new nlobjSearchColumn('name'), new nlobjSearchColumn('isinactive')];
	        	var searchResults = nlapiSearchRecord('customrecord_pp_signatures', null, null, searchColumns);
	        	if (!searchResults) {
	        		searchResults = []; 
	        	}
	        	var srLength = searchResults.length;
	        	var fLength = data.files.length;
	        	var toAdd = [];
	        	var setInactive = [];
	        	var reactivate = [];
	        	// Find the signatures from NetSuite that are missing on the PPS side
	        	for (var i=0;i<srLength;i++) { 
	       			var foundIt = false;
	        		for(var j=0;j<fLength;j++) {
	        			if (searchResults[i].getValue('name')==data.files[j]) {
	        				foundIt = true;
	        			}
	        		}
	        		// only set stuff as inactive if necessary, to save governance
	    			if (foundIt==false && searchResults[i].getValue('isinactive')=='F') {
	    				setInactive.push(searchResults[i].getId());
	    			}
	        	}
	        	// Find the signatures from PPS that are missing on the NetSuite side
	        	for (var i=0;i<fLength;i++) {
	        		var foundIt = false;
	        		for(var j=0;j<srLength;j++) {
	        			if (data.files[i]==searchResults[j].getValue('name')) {
	        				foundIt = true;
	        				// if it was found, but inactive, reactivate it
	        				if (searchResults[j].getValue('isinactive')=='T') {
	        					reactivate.push(searchResults[j].getId());
	        				}
	        			}
	        		}
	        		if (foundIt==false) {
	        			toAdd.push(data.files[i]);
	        		}
	        	}
	        	
	        	for (var i=0;i<toAdd.length;i++) {
	        		var rec = nlapiCreateRecord('customrecord_pp_signatures', null);
	        		rec.setFieldValue('name', toAdd[i]);
	        		nlapiSubmitRecord(rec);
	        	}
	        	for (var i=0;i<setInactive.length;i++) {
	        		nlapiSubmitField('customrecord_pp_signatures', setInactive[i], 'isinactive', 'T');
	        	}
	        	for (var i=0;i<reactivate.length;i++) {
	        		nlapiSubmitField('customrecord_pp_signatures', reactivate[i], 'isinactive', 'F');
	        	}
	        	var html = '<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#DAEBD5"><tbody><tr><td><img src="/images/icons/messagebox/msgbox_corner_tl.png" alt="" width="7" height="7" border="0"></td><td width="40"><img src="/images/icons/reporting/x.gif" width="1" height="1" alt="" hspace="20"></td><td width="100%"></td><td><img src="/images/icons/messagebox/msgbox_corner_tr.png" alt="" width="7" height="7" border="0"></td></tr><tr><td></td><td align="left" valign="top"><img src="/images/icons/messagebox/icon_msgbox_confirmation.png" alt="" width="32" height="32" border="0"></td><td width="100%" valign="top"><table cellpadding="0" cellspacing="0" border="0" width="600" style="font-size: 11px"><tbody><tr><td><img src="/images/icons/reporting/x.gif" width="1" height="8" alt=""></td></tr><tr><td style="font-color: #000000"><b>Confirmation:</b> Synchronization successful</td></tr><tr><td><img src="/images/icons/reporting/x.gif" width="1" height="8" alt=""></td></tr></tbody></table></td><td></td></tr><tr><td><img src="/images/icons/messagebox/msgbox_corner_bl.png" alt="" width="7" height="7" border="0"></td><td></td><td width="100%"></td><td><img src="/images/icons/messagebox/msgbox_corner_br.png" alt="" width="7" height="7" border="0"></td></tr></tbody></table><br />';
	        	form.addField('custpage_confirmation', 'inlinehtml', null, null, 'custpage_maingroup2').setDefaultValue(html);
	        }
	        catch (e) {
	            form.addField("custpage_label", "label", e);
	            $PPS.log(e);
	        }
        }
    }
    

    var sigColumns = [new nlobjSearchColumn('name'), new nlobjSearchColumn('isinactive')];
    var sigs = nlapiSearchRecord('customrecord_pp_signatures', null, null, sigColumns);
    
    var sigSublist = form.addSubList('custpage_signatures', 'staticlist', 'Signatures','custpage_maingroup2');
    sigSublist.addField('name', 'text', 'Name');
    sigSublist.addField('isinactive', 'checkbox', 'Inactive');
    sigSublist.setLineItemValues(sigs);
    
    response.writePage(form);

    $PPS.log("*** End ***");
}
