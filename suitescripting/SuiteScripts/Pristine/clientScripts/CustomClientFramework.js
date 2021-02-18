//-----------------------------------------------------------------------------------------------------------
// Copyright 2020, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------
/*
 * This Client Script can be included in records that do not support Client Scripting. 
 * Default Value of the Inner HTML filed is 
 * 
 * <script type="text/javascript" src="/app/common/scripting/scriptmodule.nl?_xt=.js&childPath=%2FSuiteScripts%2FPristine%2FclientScripts%2FCustomClientFramework"></script>
 * where childPath is encoded URL root Path of this client script file
 * Then, this script file, includes the "client-like" environment located here
 * SuiteScripts/Pristine/clientScripts/CustomClientCode.js
 * 
 * This is a 'framework' that will trigger three events in related CustomClientCode module:
 * 1. saveRecord: saveRecord,
   2. fieldChanged: fieldChanged,
   3. pageInit: pageInit
 * 
 * No additional events coded 
 * 
 */
require(["N/currentRecord", "SuiteScripts/Pristine/clientScripts/CustomClientCode.js"], 
		
		function (currentRecord, CustomClientCode) 
{
	var REC = currentRecord.get();
	
	if (window.location.href.indexOf("e=T")<0) //if it's not edit, exit immediately.
	{
		//this is either view mode or create page 
		if (REC.id)
		{
			//this is view mode, exit 
			return;
		}
	}
	
	var responsive_account_fields = [];
	var unresponsive_account_fields = [];
	var verifyfields = [];
	const DEBUG = false;
	if (DEBUG)
	{
		responsive_account_fields = ["acctnumber","acctname","revalue","description","issummary","isinactive","reconcilewithmatching","bach","sbankname","sachmsg","sbankroutingnumber"
		,"sbankcompanyid"
		,"mmaxamtpertran"
		,"department"
		,"class"
		,"location"
		,"custrecord_account_status"
		,"custrecord_nacha_company_id"
		,"custrecord_nacha_immediate_origin"
		,"custrecord_gl_account_bank_name"
		,"custrecord_gl_account_bank_account"
		,"custrecord_bank_branch_domestic"
		,"custrecordglreportinggroup2"
		,"custrecord_escrow_account_type"
		,"custrecord_acq_escrow_description"
		,"custrecord_ops_acquiomescrow"
		,"custrecord_ops_statement_available"
		,"custrecord_bank_routing_number"
		,"custrecord_upaya_account_id"
		,"custrecord_upaya_securekey"
		,"custrecord_bank_name"
		,"custrecord_bank_acc_number"
		,"custrecord_srs_mcp_export_flag"
		,"custrecord_srs_mcp_int_fail"
		,"custrecord120"
		,"custrecord_bank_statement_deliverymethod"
//		,"custrecord_pp_account_exclude"
		,"custrecord_bank_balance"
		,"custrecord_bank_balance_date"
		,"custrecord_bank_balance_date_reconcilied"
		,"custrecord_multi_acct_id"
		,"custrecord_unpresented_amount"
		,"currency"
		,"exchangerate"
		,"accttype"
		];
	
		unresponsive_account_fields = ["custrecord_srs_mcp_int_fail_reason"
	                                   ,"custrecord_deal_name"
	                                   ,"custrecord_acq_deal_link"
	                                   ,"parent"
	                                   ,"custrecord_account_audience"
	                                   ];
		verifyfields = responsive_account_fields.concat(unresponsive_account_fields); //used to confirm correct logic
	}
	
	

	
	
	const form = document.getElementById("main_form");
	
	function srs_pageInit()
	{
		CustomClientCode.pageInit();
	}
	
	
	//if input id="inpt_custrecord12012", then how do you get to custrecord120? Grab it from name="inpt_custrecord120"
	function _getFieldNameViaId(id)
	{
		var retValue = id;
		var el = document.getElementById(id);
		if (el)
		{
			retValue = el.getAttribute("name");
		}
		else 
		{
			if (DEBUG)
			{
				console.log("cound not find element " + id);
			}
		}
		return retValue;
	}
	
	//given an id, strip common strings to get nlapi name 
	function srs_getNLAPIName(id)
	{
		var retValue = id;
		if (id)
		{
			retValue = id.replace("_formattedValue", "");
			retValue = retValue.replace("_display", "");
			if (retValue.indexOf("inpt_")===0 || retValue.indexOf("hddn_")===0)
			{
				//for inpt_ fields, get id from name to handle (name="inpt_custrecord120" id="inpt_custrecord12012") and name="inpt_custrecordglreportinggroup2" id="inpt_custrecordglreportinggroup29"
				//or name="custrecord_account_audience" id="hddn_custrecord_account_audience17"
				retValue = _getFieldNameViaId(id);
				retValue = retValue.replace("inpt_", "");
				retValue = retValue.replace("hddn_", "");
			}
			retValue = retValue.replace("_fs_inp", "");
		}
		return retValue;
	}
	
	// core function that determines if field has changed 
	// if so, it triggers CustomClientCode.fieldChanged(nlapiid); call
	// no context is passed. 
	function srs_hasFieldChanged(id, calledfrom)
	{
		var retValue = false;
		var strmsg = "";
		if (!id)
		{
			return retValue; 
		}
		var nlapiid = srs_getNLAPIName(id);
		
		var el = document.getElementById(id);
		if (el)
		{
			if (String(el.getAttribute("previous_value")) !== String(REC.getValue({fieldId: nlapiid})))
			{
				strmsg = id + "/" + nlapiid + " [" + el.getAttribute("previous_value") + "] --> [" + REC.getValue({fieldId: nlapiid}) + "]";
				if (DEBUG)
				{
					console.log(calledfrom + ": " + strmsg);
				}
				el.setAttribute("previous_value", REC.getValue({fieldId: nlapiid}));
				retValue = true; 
				
				CustomClientCode.fieldChanged(nlapiid);
				
			}
			
		}
		return retValue;
	}
	//on load, set all input fields "previous_value" attribute to current value of the field 
	function srs_initialize_input(id)
	{
		
		var el = document.getElementById(id);
		if (el)
		{
			if (!el.hasAttribute("previous_value"))
			{
				var nlapiid = srs_getNLAPIName(id);
				el.setAttribute("previous_value", REC.getValue({fieldId: nlapiid}));
				//console.log("initialized value " + nlapiid + ": " + el.getAttribute("previous_value"));
////				if (nlapiid === "custrecord120")
////				{
////					console.log("verifyfields " + verifyfields.toString());
////					console.log (nlapiid + " verifyfields.indexOf(nlapiid) " + verifyfields.indexOf(nlapiid));
////					var itemindex = verifyfields.indexOf(nlapiid);
////					if (itemindex>-1)
////					{
////						verifyfields.splice(itemindex, 1);
////					}
////					console.log("verifyfields " + verifyfields.toString());
////				}
////				else 
////				{
				if (DEBUG)
				{
					var itemindex = verifyfields.indexOf(nlapiid);
					if (itemindex>-1)
					{
						verifyfields.splice(itemindex, 1);
					}
				}
////				}
			}
			
		}
	}
	//some fields in netsuite are for UI supporting purposes. identify them. 
	function isDuplicateField(fieldid)
	{
		var retValue = false;
	
		if (fieldid)
		{
			if (fieldid.indexOf("_display")>=0 
			|| fieldid.indexOf("_formattedValue")>=0 
			|| fieldid.indexOf("indx_")>=0
			|| fieldid.indexOf("inpt_")>=0)
			{
				retValue = true;
			}
		}
		return retValue;
	}
	//srs field changed that will be called on different invents 
	function srs_determineIfFieldChanged(event) 
	{
		var name = "";
		var retValue = false;
		var changed = false;
		var inputs = document.getElementsByTagName("input");
		var i = 0;
		for (i = 0; i < inputs.length; i+=1)
		{
			if (inputs[i].id)
			{
				//some fields are there for display purposes and are duplicate. These can be skipped. 
				if (!isDuplicateField(inputs[i].id))
				{
					//console.log("INPUT FIELD CHANGE ")
					srs_hasFieldChanged(inputs[i].id, "INPUT FIELD CHANGE");
				}
			}
		}
		inputs = document.getElementsByTagName("textarea");
		for (i = 0; i < inputs.length; i+=1)
		{
			if (inputs[i].id)
			{
				//skip duplicate fields 
				if (!isDuplicateField(inputs[i].id))
				{
					//console.log(" GLOBAL TEXTAREA FIELD CHANGE ")
					srs_hasFieldChanged(inputs[i].id, "TEXTAREA FIELD CHANGE");
				}
			}
		}
		
		
	}
	//fires on form submit 
	function srs_saveRecord(event) 
	{
		if (DEBUG)
		{
			console.log("Form Submitted! Time stamp: " + event.timeStamp);
		}
		var _isValid = CustomClientCode.saveRecord();
	  if (!_isValid)
	  {
		  form.submitted.value = false;
		  event.preventDefault();
		  return;
	  }
			  
	}
	//fires on tab press 
	function checkTabPress(e) {
	    var ele = document.activeElement;

	    if (e.keyCode === 9) 
	    {
	    	//console.log("field changed trigger by tab");
	    	srs_determineIfFieldChanged(); 
	    }
	}
	
	function addEventListenersToElement(tagname)
	{
		var tagnames = document.getElementsByTagName(tagname);
		var i = 0;
		for (i = 0; i < tagnames.length; i+=1)
		{
			tagnames[i].addEventListener("change", srs_determineIfFieldChanged);
			tagnames[i].addEventListener("blur", srs_determineIfFieldChanged);
			//inputs[i].addEventListener("click", srs_determineIfFieldChanged, true);
	
			if (tagnames[i].id)
			{
				if (!isDuplicateField(tagnames[i].id))
				{
					//store initial values 
					srs_initialize_input(tagnames[i].id);
				}
			}
//			else 
//			{
//				if (DEBUG)
//				{
//					console.log("##########unhandled 2 ############# " + tagnames[i].name);
//				}
//			}
		}
	}
	
	//when document is ready, execute following 
	NS.jQuery(document).ready(function() 
	{
		//add event listeners
		form.addEventListener("submit", srs_saveRecord);
		var name = "";
		var verifyfields_initsize = verifyfields.length;
		
		//process all input fields 
		addEventListenersToElement("input");
		//process all text area fields 
		addEventListenersToElement("textarea");
		if (DEBUG)
		{
			console.log("Expecting length 0: Found: " + verifyfields.length + ". Initial size " + verifyfields_initsize + ". Remaining:  " + JSON.stringify(verifyfields));
		}
		
		//add click event 
		window.addEventListener("click", function(e){
			  //document.getElementById("demo").innerHTML = "Hello World";
			if (DEBUG)
			{
				console.log("clicked");
			}
			//var REC = currentRecord.get();
			if (e.srcElement.getAttribute("class") ==="checkboximage")
			{
				//since checkbox prevented click event, let it execute, then process. Same may be needed for drop down. 
				setTimeout(srs_determineIfFieldChanged, 100);
			}
			else 
			{
				srs_determineIfFieldChanged(e);
			}
			
			

		}, true); //addEventListener requires true to be triggered prior to checkbox click. Checkbox click will not be triggered if false.  
		
		//add key up event 
		document.addEventListener("keyup", function (e) {
		    checkTabPress(e);
		}, false);
		
		
		srs_pageInit();
		
	});
				
});