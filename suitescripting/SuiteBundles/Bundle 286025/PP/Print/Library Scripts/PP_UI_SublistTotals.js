/**
 * Sublist classes for updating amount and item selected totals
 * 
 * Version    Date            Author           Remarks
 * 1.00       11 Nov 2013     maxm
 *
 */

function SublistTotaler(sublists,options){
	var sublistTotals = [];
	var defaults = {
			totalAmountUIField: 'custpage_total_amount',
			totalSelectedUIField: 'custpage_total_selected',
			sublistAmountField: 'amount',
			scheduleScriptField: 'custpage_use_scheduled_script'
	};
	
	var opts = jQuery.extend(defaults,options);

	// use callbacks to publish fieldChanged to SublistTotal objects
	var callbacks = jQuery.Callbacks();
	// make callbacks public
	this.callbacks = callbacks;

	for(var i = 0; i < sublists.length; i++){
		var sublistTotal = new SublistTotal(sublists[i],{amountFieldName: opts.sublistAmountField});
		sublistTotals.push(sublistTotal);
		callbacks.add(sublistTotal.fieldChanged);
		
		// listen for amountChange event from SublistTotal objects
		jQuery(sublistTotal).on('amountChange',sublistTotalChange);
	}

	function sublistTotalChange(){
		var totalAmount = 0;
		var totalSelected = 0;
		
		// loop through sublists and sum up
		for(var i = 0; i < sublistTotals.length; i++){
			totalAmount += sublistTotals[i].getTotalAmount();
			totalSelected += sublistTotals[i].getTotalSelected();
		}

		nlapiSetFieldValue(opts.totalAmountUIField, totalAmount.toFixed(2), false);
	    nlapiSetFieldValue(opts.totalSelectedUIField, totalSelected, false);
	    if (totalSelected >= 50) {
	    	nlapiSetFieldValue(opts.scheduleScriptField, 'T', false);
	    }
	}
}

function SublistTotal(sublistName,options){
	var me = this;
	var name = sublistName;
	var totalAmt = 0;
	var totalSelected = 0;
	
	var defaults = {
			amountFieldName : 'amount'
	};
	var opts = jQuery.extend(defaults,options);
	
	this.getName = function(){
		return name;
	};
	
	this.getTotalAmount = function(){
		return totalAmt;
	};
	
	this.getTotalSelected = function(){
		return totalSelected;
	};
	
	
	this.fieldChanged = function(type, fname, linenum){
		if(type == name){
			if(nlapiGetLineItemValue(type, fname, linenum) === 'T'){
		    	totalAmt += parseFloat(nlapiGetLineItemValue(type, opts.amountFieldName, linenum));
		    	totalSelected++;
		    }
		    else{
		    	totalAmt -= parseFloat(nlapiGetLineItemValue(type, opts.amountFieldName, linenum));
		    	totalSelected--;
		    }
			
			jQuery(me).trigger('amountChange');
		}
	};
	
	// Hook up to markall and unmarkall button clicks
	jQuery('#' + name + 'markall').click(function(){
		var itemCount = nlapiGetLineItemCount(name);
		totalAmt = 0;
		for(var linenum = 1; linenum <= itemCount; linenum++){
			totalAmt += parseFloat(nlapiGetLineItemValue(name, opts.amountFieldName, linenum));
		}
		totalSelected = itemCount;
		jQuery(me).trigger('amountChange');
	});
	
	jQuery('#' + name + 'unmarkall').click(function(){
		totalSelected = 0;
		totalAmt = 0;
		jQuery(me).trigger('amountChange');
	});
}