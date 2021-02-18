var lineList = [];
function fieldChange(type, name, linenum) {
	try {
		if (name == 'custbody_pp_afn_error') {
			var errorText = nlapiGetFieldValue('custbody_pp_afn_error');
			//alert('test');
		}

	} catch(ex) {
		nlapiLogExecution('error', 'error', ex.message);
	}
}

function pageInit(type) {
	try {
		if (type == 'create') {
			var context = nlapiGetContext();
			var mapHeaderToLine = context.getSetting('SCRIPT', 'custscript_pp_enable_header_to_line_map');
			var  mapLineToLine = context.getSetting('SCRIPT', 'custscript_pp_enable_dist_line_map');
			var mapHeaderToHeader = context.getSetting('SCRIPT', 'custscript_pp_enable_hdr_fld_map');
			var isOneWorld = context.getFeature('SUBSIDIARIES');
			nlapiLogExecution('debug', 'header to header', mapHeaderToHeader);

			if (mapHeaderToLine == 'T' || mapLineToLine == 'T') {
				var tcDesc = nlapiGetFieldValue('custpage_tcdesc_field');
				nlapiLogExecution('audit','tcDesc', tcDesc);

			  	nlapiLogExecution('debug', 'totallines', nlapiGetLineItemCount('expense'));
			  	var types = ['expense', 'item'];
			  	for (var a = 0; a < types.length; a++) {
			  		var lineCount = nlapiGetLineItemCount(types[a]);
			  	  	if (lineCount > 0) {
				  	  	for (var b = 1; b <= lineCount; b++) {
				  	  		nlapiSelectLineItem(types[a], b); //why isn'tt his triggering lineinit?
							var amount = nlapiGetLineItemValue(types[a], 'amount', b);
						     if (amount != null && amount != '') {
						     	nlapiLogExecution('debug', 'pageInit', 'There is an amount value, but no tax code yet. Not doing anything further for now.');
						    	 nlapiCommitLineItem(types[a]);
						    	 nlapiLogExecution('debug', 'done recommitting line', b);
						    }
				  	  	}
					}
			  	}
			  	//nlapiRefreshLineItems('expense');
				var errorText = nlapiGetFieldValue('custbody_pp_afn_error');
				if (errorText != '' && errorText != null) {
					alert(errorText);
				}
			}
		}
	} catch (ex) {
		nlapiLogExecution('error', 'pageInit error', ex.message);
	}
}

function addTaxCode(linenum, tcDesc, lineType) {
	try {
		nlapiLogExecution('debug', 'addTaxCode', 'Start');
		var tcArray = tcDesc.split(',');
		nlapiLogExecution('debug', 'tcArray', tcArray);
		nlapiLogExecution('debug', 'linenum', linenum + ', ' + typeof linenum);
		var line = parseInt(linenum) - 1;
		nlapiLogExecution('debug', 'line', line + ', ' + typeof line);
		nlapiLogExecution('debug', 'reentering tax code on line ' + linenum, tcArray[line]);
		//nlapiSetCurrentLineItemValue(lineType, 'taxcode', tcArray[line]);
		nlapiSetLineItemValue(lineType, 'taxcode', linenum, tcArray[line], true, true);
		nlapiLogExecution('debug', 'addTaxCode', 'End');
	} catch(ex) {
		nlapiLogExecution('error', 'addTaxCode Error', ex.message);
	}
}

function validateLine(type) {
	try {
		nlapiLogExecution('debug', 'validated!', 'line type ' + type);
		var context = nlapiGetContext();
		var mapHeaderToLine = context.getSetting('SCRIPT', 'custscript_pp_enable_header_to_line_map');
		var  mapLineToLine = context.getSetting('SCRIPT', 'custscript_pp_enable_dist_line_map');
		if (mapHeaderToLine == 'T' || mapLineToLine == 'T') {
			var taxCode = nlapiGetCurrentLineItemValue(type, 'taxcode');
			nlapiLogExecution('debug', 'tax code', taxCode);
			if (taxCode != '' && taxCode != undefined && taxCode != null) {
				nlapiSetCurrentLineItemValue(type, 'taxcode', taxCode);
				var grAmount = parseFloat(nlapiGetCurrentLineItemValue(type, 'grossamt'));
				var amount = nlapiGetCurrentLineItemValue(type, 'amount');
				//nlapiLogExecution('debug', 'amount', amount);
				nlapiSetCurrentLineItemValue(type, 'amount', amount);
			 }
		}
		nlapiLogExecution('debug', 'end validateLine', 'End');
		return true;
	} catch(ex) {
		nlapiLogExecution('error', 'Error in Validate Line', ex.message);
	}
}



function onSave() {
  var total = nlapiGetFieldValue('usertotal');
  nlapiLogExecution('debug', 'usertotal on save', total);
  nlapiSetFieldValue('usertotal', total);
  return true;
}

function lineInit(type) {
  nlapiLogExecution('debug', 'line init', type);
  nlapiLogExecution('debug', 'line amount/grossamt', nlapiGetCurrentLineItemValue(type, 'amount') + '/' + nlapiGetCurrentLineItemValue(type, 'grossamt'));
  nlapiLogExecution('debug', 'line index', nlapiGetCurrentLineItemIndex(type));
  lineList.push(nlapiGetCurrentLineItemIndex(type));
  nlapiLogExecution('debug', 'lineList', lineList.toString());
}

