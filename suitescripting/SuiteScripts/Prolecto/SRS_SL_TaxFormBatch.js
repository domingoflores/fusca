//-----------------------------------------------------------------------------------------------------------
// Copyright 2020 All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NAmdConfig /SuiteScripts/Pristine/libraries/configuration.json		
 */


/*
 * 
 * This suitelet was created to support Preview Functionality of the Batch Tax Detail records. 
 * Suitelet is embedded as a tab in a sublist in the Tax Batch Edit mode. 
 * Suitelet was chosen over Saved Search because we can refresh iframe tab 
 *	without refreshing entire page and loosing entered data 
 * 
 */
define(["N/record", "N/runtime", "N/search", "N/task", "N/ui/serverWidget", "N/ui/message", "N/file", "N/url",
        "./Shared/SRS_Constants",
        "/.bundle/132118/PRI_ServerLibrary",
        "underscore",		//add underscore library to suitelet 
        "/SuiteScripts/Pristine/libraries/searchLibrary.js",
 	    "/.bundle/132118/PRI_AS_Engine",
        "SuiteScripts/Pristine/libraries/TaxForm_Library.js"
 	   ,'/SuiteScripts/Pristine/libraries/toolsLibrary.js'
 	    ],
	function(record, runtime, search, task, ui, message, file, url,
			srsConstants,
			priLibrary,
			_,
			searchLibrary,
			appSettings,
			tfLibrary
			,tools
			)
	{
		var scriptName = "SRS_SL_CreateTaxFormBatch.";
		var objTask; // ATP-2036
		
		var msg = {title: "", text: "", type: ""}; 
		Number.prototype.numberWithCommas = function(){
			return this.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
		};
		//dealsFound function is needed to determine 
		//if user has provided meaningful value 
		//in the deal parameter
		//it handles internalid by itself and rejects undefined, 
		//or comma sparated list of values 
		function dealsFound(deals)
		{
			var retValue = false;
			if (deals && deals.indexOf(",")>0)
			{
				//comma separated list detected
				retValue = true;
			}
			else 
			{
				if (!isNaN(deals))
				{
					//deals is a numeric value (it is not 'undefined' or something else)
					retValue = true;
				}
			}
			return retValue;
		}
		//in this function, array of columns can be customized 
		//to showColumn true/false or similar
//		{
//			"id": "isinactive",			//internal id of the field as defined in netsuite 
//			"label": "Show Inactive",	//label under which this field will be shown 
//			"isAvailableFilter":true,	//if true, it will be added to as part of the search 
//			"showAvailableFilter":true,	//if true, filter will be added above the columns 
//			"helpText": "When selected, 'Mark All', 'Unmark All', and 'Select' checkboxes will be hidden. Both active and inactive Tax Form Batch Detail records will be shown.",
//			"operator":"is",			//operator to be used in search; if not provided, anyof will be used 
//	 		"filterparam" : "isinactive",//in the URL this filter will be represented with with this 'user friendly' name
//			"filtertype" : "CHECKBOX",	 //this filter is of type 
//			"showColumn":false			//controls if column will be show or not 
//		},
		function applyCustomRules(options)
		{
			var i = 0;
			for (i = 0; i < options.fields_to_render.length; i+=1) 
    		{
				//show processing notes when status is Failed
				if ((options.fields_to_render[i].id ==="custrecord_txfm_detail_processing_notes")
					&& (parseInt(options.status,10) === parseInt(srsConstants["Tax Form Batch Status"]["Submit Failed"],10))
				)
				{
					options.fields_to_render[i].showColumn = true; 
	    		}
				if ((options.fields_to_render[i].id ==="isinactive")
						&& (options.fields_to_render[i].value === "T")
					)
					{
						options.fields_to_render[i].showColumn = true;
		    		}
				
    		}
		}
		
		
		//isValueSelected - given a value and a parameter name
		//this function returns true if value is selected
		//example
		//value = 670565
		//values = deals 
		//netsuite uses \u0005 as selector in multiselect boxes
		//values has deals=670565,1237043
		//function would return true because
		//,670565, is found in ",670565,1237043,"
		function isValueSelected(values, value)
		{
			var retValue = false;
			if (value && values)
			{
				
				values = values.replace(/\u0005/g, ",");
				var values_with_commas = ","+values+",";
				if (values_with_commas.indexOf(","+value+",")>=0)
				{
					retValue = true;
				}
			}
			return retValue;
		}
		//this function helps provide correct height for the iframe 
		//when sublist gets too many rows
		function addIframeHeightDetectionField(context, form)
		{
			if ((context.request.parameters.custparam_hidenavbar === "T")
    			&& (context.request.parameters.ifrmcntnr === "T"))
    		{
				//only render this code if we are in iframe
				var objEmbeddedFld = form.addField({
					id : "custpage_iframeheightdetection_field",
					label : "Iframe Height Detection",
					type : ui.FieldType.INLINEHTML
				});
				
				// create iframe without headers 
				objEmbeddedFld.defaultValue = "<script> \n"
				+ "NS.jQuery(window).on(\"click load resize\", function () { \n"
					+ "var height = NS.jQuery(\"html\").height(); \n"
					+ "window.parent.postMessage({\"frameHeight\": height}, \"*\"); \n"
					+ "//  console.log(height); \n"
				   + "}); \n"
				   + "</script> \n";
    		}

		}
		//if previous select options have 
		//been already saved and available via custpage_ field
		//use them; otherwise, its a brand new attempt
		function getPreviousSelectOptions(context, field)
		{
			var retValue = null;
			
			if (field.filtertype !== "MULTISELECT")
			{
					return;
				}
			//if this is a multiselet box do not filter them, instead always show previous choices
			//this is so that user does not have to reload the page 
			//and always have original list of select options
			if (context.request.parameters["custpage_selectoptions_"+field.id])
			{
				retValue = JSON.parse(context.request.parameters["custpage_selectoptions_"+field.id]);
			}
			return retValue;
		}
		
		
		//===================================================================================================================================================================
		//===================================================================================================================================================================
		function getCorrectPopupOptions() {
			
			var correctPopupOptions = [];
			
//			var name  = "type 1";
//			var value = "1";
//			correctPopupOptions.push({buttonText:name ,buttonValue:value });
			
			var correctTypeSearchObj = search.create({ type:'customrecord_irs_correction_type'
                                                   ,columns:[ {name:'internalid' } 
                                                             ,{name:'name' }
                                                             ,{name:'custrecord_ict_code' }
                                                            ]
                                                   ,filters:[ search.createFilter({ name:'isinactive' ,operator:"IS"      ,values:["F"] }) 
                                                	        ]
                                                    }).run();
            var correctTypeSearchResults = correctTypeSearchObj.getRange(0,100);

            for ( ix in correctTypeSearchResults ) { 
    			correctPopupOptions.push({buttonText:correctTypeSearchResults[ix].getValue("name") ,buttonValue:correctTypeSearchResults[ix].getValue("internalid") });
            }
			
            log.debug("ATP-2036" ,"correctPopupOptions: " + JSON.stringify(correctPopupOptions));
			return JSON.stringify(correctPopupOptions);
		}
		
		
		//===================================================================================================================================================================
		//Tax Form Batch Detail sublist is rendered once 
		//===================================================================================================================================================================
		function renderDetailSublist(context, options)
		{
			//CREATE FORM
			var form = ui.createForm({title: "Tax Form Batch: " + tfLibrary.getAnchor("customrecord_tax_form_batch", options.taxformbatch, options.name)});
			
			//ADD TAX FORM BATCH SUBLIST 
			var sublist = form.addSublist(
			{
			    id : "custpage_sublist_batch_detail",
			    label : "Tax Form Batch Detail",
			    type : ui.SublistType.LIST
			});
			
			//ADD APPLY FILTER BUTTON
			var submitButton = form.addSubmitButton({
				label: "Apply Filter"
			});
			
		    var buttonObject  = '{ "id":"custpage_button_{0}" ,"label":"{1}" ,"functionName":"processTaxBatchDetail(' + "'{2}'" + ')" }';
		    var buttonRevise  = JSON.parse(buttonObject.replace("{0}","revise").replace("{1}","Revise").replace("{2}","revise"));
		    form.addButton(buttonRevise);
			var buttonCorrect = JSON.parse(buttonObject.replace("{0}","correct").replace("{1}","Correct").replace("{2}","correct"));
		    form.addButton(buttonCorrect);
			var buttonGenerate = JSON.parse(buttonObject.replace("{0}","generate").replace("{1}","Generate").replace("{2}","generate"));
		    form.addButton(buttonGenerate);
			var buttonRecreate  = JSON.parse(buttonObject.replace("{0}","recreate").replace("{1}","Recreate").replace("{2}","recreate"));
		    form.addButton(buttonRecreate);
		    
		    var correctPopupOptions = getCorrectPopupOptions();
		    var fieldHtmlCorrectPopupOptions = form.addField({ id:'custpage_html_correct_popup_options' ,type:ui.FieldType.LONGTEXT ,label:'hidden' });
		    fieldHtmlCorrectPopupOptions.updateDisplayType({ displayType:ui.FieldDisplayType.HIDDEN });
		    fieldHtmlCorrectPopupOptions.defaultValue = correctPopupOptions;
		    
		    var fieldTaskStartedMsg= form.addField({ id:'custpage_message' ,type:ui.FieldType.INLINEHTML ,label:'&nbsp;' });
		    fieldTaskStartedMsg.defaultValue = '<div id="submittedDiv" class="uir-alert-box info" width="undefined" role="status" style="display:none;width:70%;margin-bottom:20px;"><div class="icon info"><img src="/images/icons/messagebox/icon_msgbox_info.png" alt=""></div><div class="content"><div id="submittedTitle" class="title">Request Submitted</div><div id="submittedMsg" class="descr">Your request has been submitted for background processing</div></div></div>';
		    
		    var fieldObjectTaxFormBatch = form.addField({ id:'custpage_object_tax_form_batch' ,type:ui.FieldType.LONGTEXT ,label:'hidden' });
		    fieldObjectTaxFormBatch.updateDisplayType({ displayType:ui.FieldDisplayType.HIDDEN });
    		var taxformbatch = context.request.parameters.custpage_taxformbatch || context.request.parameters.taxformbatch;
			var objtaxFormBatchFields = search.lookupFields({type:"customrecord_tax_form_batch" ,id:taxformbatch   
                                                         ,columns:["custrecord_txfm_batch_status" 
                                                        	      ,"isinactive"
                                                                  ]});

		    var objTaxFormBatch = {};
		    objTaxFormBatch["id"]                           = taxformbatch;
		    objTaxFormBatch["custrecord_txfm_batch_status"] = objtaxFormBatchFields["custrecord_txfm_batch_status"][0].value;
		    objTaxFormBatch["isinactive"]                   = objtaxFormBatchFields["isinactive"];
		    fieldObjectTaxFormBatch.defaultValue = JSON.stringify(objTaxFormBatch);
			
			var param = "";
			var field = null;
			var value = "";
			//STORE ALL PARAMETERS INTO CUSTOM HIDDEN FIELDS 
			//IN ORDER TO PRESERVE VALUES AFTER USER INTERACTS WITH THE FORM 
			for (param in context.request.parameters)
			{
				param = param.toLowerCase();
				//during GET values such as "action", "deals" etc will be available.
				//during post many are already "custpage_action", "custpage_deals" etc, so they can be skipped
				if (param && param.indexOf("custpage_")<0)  
				{
					//log.audit("processing ", param)
					field = form.addField({
		                id: "custpage_"+param,
		                type: (context.request.parameters[param] && context.request.parameters[param].length<=300) ? "TEXT" : "LONGTEXT",
		                label: param
		            });
					field.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN	});
					field.defaultValue = context.request.parameters[param];
				}
			}
			
			
			form.clientScriptModulePath = "SuiteScripts/Prolecto/SRS_SL_TaxFormBatch_CL.js";
			
			//1. UPDATE fields_to_render OBJECT WITH VALUES FROM URL PARAMETER
			for (i = 0; i < options.fields_to_render.length; i+=1) 
    		{
    			if (options.fields_to_render[i].isAvailableFilter)
    			{
    				//retrieve any filters available in parameters and store 
    				//first check POST value parameters
    				//then check GET value parameters 
    				//else empty
    				value = context.request.parameters["custpage_filter_"+options.fields_to_render[i].id] || context.request.parameters[options.fields_to_render[i].filterparam] || "";
    				value = value.trim();
    				//STORED FILTER VALUES WILL BE USED DURING SEARCH
    				options.fields_to_render[i].value = value;	//even if value is empty, that's user's choice, so empty choices are OK.
    				
    				
    			
    			}
    		}
			
			
			//1.5 APPLY CUSTOM RULES TO OPTIONS
    		//FOR EXAMPLE, NOTES FIELD DOES NOT NEED TO BE SHOWN
    		//ONCE TAX FORM BATCH IS STATE=SUBMITTED
    		applyCustomRules(options);
			
//			2. Run Saved Search
	   		// the records to be displayed are from a saved search
//    		var datetime = Date.now();
//	    	var newSavedSearchID = "customsearch_" + datetime;
//	    	options.newSavedSearchID = newSavedSearchID;
//	    	options.downloadRequested = true;
	    	log.debug("options ", JSON.stringify(options));
	    	
//			if (runtime.getCurrentUser().id == 1047697) {
//			}
			if (context.request.parameters['custpage_filter_revise']) {
				if (context.request.parameters['custpage_filter_revise'] == "T" )  { options["custpage_filter_revise"]  = true; }
			}
			if (context.request.parameters['custpage_filter_correct']) {
				if (context.request.parameters['custpage_filter_correct'] == "T" ) { options["custpage_filter_correct"] = true; }
			}
	    	
    		
	    	//GIVEN OPTIONS USER CHOSE, RETRIEVE SEARCH OBJECT
	    	var searchObj = tfLibrary.getTaxFormBatchDetailSearch(options);
			log.debug("searchObj ", JSON.stringify(searchObj));
			
    		var searchResultCount = searchObj.runPaged().count;
    		log.debug("searchObj result count",searchResultCount);
    		var results =  searchObj.run();
    		var jsonresults = null; 
    		var jsonresult = null;
    		//request all records, even if over 1000
    		results = searchLibrary.getSearchResultData(results);
    		log.audit("results ", results.length);
    		//throw " results " + results.length + " options: " + JSON.stringify(options);
    		
//    		3. Load list of available options
    		//FOR EACH FIELD THAT NEEDS TO BE RENDERED, 
			//IDENTIFY UNIQUE VALUES IN SAVED SEARCH RESULTS
			//SO THAT WE CAN HAND THIS BACK DOWN TO CLIENT SCRIPT
			//TO POPULATE AVAILABLE SELECT OPTIONS
    		for (i = 0; i < options.fields_to_render.length; i+=1) 
    		{
    			if ((options.fields_to_render[i].isAvailableFilter) 
    			&& ((options.fields_to_render[i].filtertype === "SELECT")
    				||
    				(options.fields_to_render[i].filtertype === "MULTISELECT")
    				)
    			)
    			{
    				jsonresults = JSON.parse(JSON.stringify(results));
    				
//    				_map transforms finds
//    				[
//    				  {
//    				    "recordType": "customrecord_tax_form_batch_detail",
//    				    "id": "103104",
//    				    "values": {
//    				      "custrecord_txfm_detail_deal": [
//    				        {
//    				          "value": "1169715",
//    				          "text": "VaaS International Motorola"
//    				        }
//    				      ]
//    				    }
//    				  },
//    				  {
//    				    "recordType": "customrecord_tax_form_batch_detail",
//    				    "id": "103105",
//    				    "values": {
//    				      "custrecord_txfm_detail_deal": [
//    				        {
//    				          "value": "1169715",
//    				          "text": "VaaS International Motorola"
//    				        }
//    				      ]
//    				    }
//    				  }
//    				]
//    				into
//    				[
//    				  {
//    				    "value": "1169715",
//    				    "text": "VaaS International Motorola"
//    				  },
//    				  {
//    				    "value": "1169715",
//    				    "text": "VaaS International Motorola"
//    				  }
//    				]
//    				then _.uniq transforms that into unique list based on value
//    				[
//    				  {
//    				    "value": "1169715",
//    				    "text": "VaaS International Motorola"
//    				  }
//    				]
    				//results are parsed into JOSN and then during
    				//_.map call are transformed into JSON array of objects that hold key value pairs
    				//then _.uniq removes all duplicates based on value 
    				//if multiselect was already created, use it (POST), otherwise create new one (GET)
					options.fields_to_render[i].filterSelectOptions = getPreviousSelectOptions(context, options.fields_to_render[i]) || _.uniq(_.map(jsonresults, function(jsonresult)
					{ 
						jsonresult = JSON.parse(JSON.stringify(jsonresult));
						key = options.fields_to_render[i].id;
						return jsonresult["values"][key][0];  
					}), "value");
					
					options.fields_to_render[i].filterSelectOptions.sort(function(a, b){
					    if(a.text < b.text) { return -1; }
					    if(a.text > b.text) { return 1; }
					    return 0;
					})
    				
					// Save entire list for Multi Select fields so when user selects one and page refreshes
					// the list can contain all available options with only those chosen by the user selected
					if (options.fields_to_render[i].filtertype === "MULTISELECT") {
						field = form.addField({     id: "custpage_selectoptions_"+options.fields_to_render[i].id
			                                     ,type: "LONGTEXT"
			                                    ,label: "Select Values for " + options.fields_to_render[i].filterlabel
			                                  });
						field.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
						field.defaultValue = JSON.stringify(options.fields_to_render[i].filterSelectOptions);						
					}
					
    			}
    		}
			
			var fieldRevise  = form.addField({ id:"custpage_filter_revise"  ,type:ui.FieldType.CHECKBOX ,label:"Only show Revisable Forms" });
			if (context.request.parameters['custpage_filter_revise']) {
				if (context.request.parameters['custpage_filter_revise'] == "T" ) { fieldRevise.defaultValue = "T"; }
			}
			var fieldCorrect = form.addField({ id:"custpage_filter_correct" ,type:ui.FieldType.CHECKBOX ,label:"Only show IRS Correctable Forms" });
			if (context.request.parameters['custpage_filter_correct']) {
				if (context.request.parameters['custpage_filter_correct'] == "T" ) { fieldCorrect.defaultValue = "T"; }
			}
			
			//2. RENDER AVAILABLE FILTERS
			for (i = 0; i < options.fields_to_render.length; i+=1) 
    		{
    			if (options.fields_to_render[i].isAvailableFilter)
    			{
    				//FOR ALL AVAILABLE FILTERS 
    				if (options.fields_to_render[i].showAvailableFilter)
        			{
    					//IF FILTER IS TO BE SHOWN, RENDER IT
	    				field = form.addField({
		                     id: "custpage_filter_"+options.fields_to_render[i].id,
		                     type: options.fields_to_render[i].filtertype,
		                     label: options.fields_to_render[i].filterlabel
		                 });
	    				if (options.fields_to_render[i].helpText)
	    				{
	    					field.setHelpText({
	    					help: options.fields_to_render[i].helpText });
	    				}
	    				//UPDATE DEFAULT VALUE OF ALREADY CHOSEN TEXT FIELDS, SUCH AS TAX ID
	    				//THIS CANNOT BE DONE VIA CLIENT SCRIPT IN VIEW MODE 
	    				if (options.fields_to_render[i].filtertype === "TEXT")
	        			{
	    					if (options.fields_to_render[i].value)
	    					{
	    						field.defaultValue = options.fields_to_render[i].value;
	    					}
	        			}
	    				if (options.fields_to_render[i].filtertype === "CHECKBOX")
	        			{
	    					//USER SELECTED A CHECKBOX
	    					if (options.fields_to_render[i].value === "T")
	    					{
	    						//UPDATE FIELD WITH USER SELECTION 
	    						field.defaultValue = options.fields_to_render[i].value;
	    						//CHECKBOX 
	    					}
	        			}
	    				if (options.fields_to_render[i].filtertype === "SELECT")
	        			{
    						field.addSelectOption({
							    value: " ",
							    text: " "
							});  
	    					for (j = 0; j < options.fields_to_render[i].filterSelectOptions.length; j+=1) 
				    		{
								//log.audit( "options.fields_to_render[i].filterSelectOptions", JSON.stringify(options.fields_to_render[i].filterSelectOptions[j]));
								//throw ("JSON.stringify(options.fields_to_render[i].filterSelectOptions " + JSON.stringify(options.fields_to_render[i].filterSelectOptions))
								if (options.fields_to_render[i].filterSelectOptions[j])
								{
									field.addSelectOption({
										text: options.fields_to_render[i].filterSelectOptions[j].text,
										value: options.fields_to_render[i].filterSelectOptions[j].value,
										isSelected: (parseInt(options.fields_to_render[i].filterSelectOptions[j].value,10) === parseInt(options.fields_to_render[i].value,10)) ? true : false
									});
								}
				    		}
	        			}
	    				if (options.fields_to_render[i].filtertype === "MULTISELECT")
	        			{
	    					for (j = 0; j < options.fields_to_render[i].filterSelectOptions.length; j+=1) 
				    		{
								//log.audit( "options.fields_to_render[i].filterSelectOptions", JSON.stringify(options.fields_to_render[i].filterSelectOptions[j]));
								//throw ("JSON.stringify(options.fields_to_render[i].filterSelectOptions " + JSON.stringify(options.fields_to_render[i].filterSelectOptions))
								if (options.fields_to_render[i].filterSelectOptions[j])
								{
									field.addSelectOption({
										text: options.fields_to_render[i].filterSelectOptions[j].text,
										value: options.fields_to_render[i].filterSelectOptions[j].value,
										isSelected: isValueSelected(options.fields_to_render[i].value, options.fields_to_render[i].filterSelectOptions[j].value)
									});
								}
				    		}
	        			}
        			}
    			}
    		}
			
			//ADD MARK ALL AND UNMARK ALL BUTTONS 
    		sublist.addMarkAllButtons();
    		
    		//ADD SELECT CHECKBOXES 
    		sublist.addField({
                id: "custpage_select_checkbox_",
                type: ui.FieldType.CHECKBOX,
                label: "Select"
            });
    		
			//OPTIONAL. EXPORT DETAIL LIST TO CSV
    		var exportSS = sublist.addButton({
    			id:"custpage_downloadss",
    			label: "Export All",
    			functionName: "exportSS(\"requestBatchDetailSavedSearchExport\")"
    		});
    		
    		
    		//SHOW "OPEN IN NEW WINDOW" BUTTON, AS IT IS TIDIOUS TO WORK IN BOTTOM PANE OF WINDOW
    		if ((context.request.parameters.custparam_hidenavbar === "T")
    			&& (context.request.parameters.ifrmcntnr === "T"))
    		{
    			 sublist.addButton({
    	    			id:"custpage_openinnewwindow",
    	    			label: "Open in New Window",
    	    			functionName: "openinwindow"
    	    		});
    		}
    		
    		//DYNAMICALLY RENDER TO SCREEN EACH OF THE COLUMNS 
    		for (i = 0; i < options.fields_to_render.length; i+=1) 
    		{
    			//COLUMNS CAN BE CHOSEN TO NOT BE SHOWN, AND THEY WOULD NOT RENDER
    			if (options.fields_to_render[i].showColumn)
    			{
    				if (options.fields_to_render[i].id ==="custrecord_txfm_detail_shareholder")
					{
    					sublist.addField({
    		                 id: "custpage_hidden_custrecord_txfm_detail_shareholder",
    		                 type: ui.FieldType.TEXT,
    		                 label: "Shareholder ID"
    					});
					}
					sublist.addField({
	                     id: "custpage_"+options.fields_to_render[i].id,
	                     type: options.fields_to_render[i].columntype,
	                     label: options.fields_to_render[i].columnlabel
	                 });
    			}
    		}
    		//add hard coded fields at end
    		sublist.addField({
                id: "custpage_hidden_custrecord_txfm_detail_deal",
                type: ui.FieldType.TEXT,
                label: "Deal Internal ID"
			}).updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
    		
    		
 
    		var row = 0;
    		var i = 0;
    		var j = 0;
    		var sublistvalue = "";
    		var text = "";
    		var internalid = "";
    		var box1dTotal = 0;
    		var box1eTotal = 0;
    		var box4Total = 0;
    		for (i = 0; i < results.length; i+=1) 
    		{
    			//throw "result " + JSON.stringify(results[0]);
//	        			{
//	        			  "recordType": "customrecord_tax_form_batch_detail",
//	        			  "id": "32318",
//	        			  "values": {
//	        			    "internalid": [
//	        			      {
//	        			        "value": "32318",
//	        			        "text": "32318"
//	        			      }
//	        			    ],
//	        			    "custrecord_txfm_detail_batch_id": [
//	        			      {
//	        			        "value": "14",
//	        			        "text": "Value Payments Batch"
//	        			      }
//	        			    ],
//	        			    "custrecord_txfm_detail_deal": [
//	        			      {
//	        			        "value": "1169715",
//	        			        "text": "VaaS International Motorola"
//	        			      }
//	        			    ],
//	        			    "custrecord_txfm_detail_shareholder": [
//	        			      {
//	        			        "value": "1208908",
//	        			        "text": "4 Hijas Family LP"
//	        			      }
//	        			    ],
//	        			    "custrecord_txfm_detail_txid": "264271751",
//	        			    "custrecord_txfm_detail_status": [
//	        			      {
//	        			        "value": "1",
//	        			        "text": "Draft"
//	        			      }
//	        			    ],
//	        			    "custrecord_txfm_detail_version": [
//	        			      {
//	        			        "value": "1",
//	        			        "text": "Original"
//	        			      }
//	        			    ],
//	        			    "custrecord_txfm_detail_delivery": [
//	        			      {
//	        			        "value": "2",
//	        			        "text": "Mail"
//	        			      }
//	        			    ],
//	        			    "custrecord_txfm_detail_box1d_proceed": "265024.96",
//	        			    "custrecord_txfm_detail_box4_fedwithheld": ".00",
//	        			    "custrecord_txfm_detail_box1e_cost_other": ".00",
//	        			    "custrecord_txfm_detail_processing_notes": ""
//	        			  }
//	        			}
    			row = i + 1;
    			//SPIN THROUGH COLUMNS AND RENDER THEM AS REQUESTED 
    			for (j = 0; j < options.fields_to_render.length; j+=1) 
	        	{
    				if (!options.fields_to_render[j].showColumn)
        			{
    					//skip field that should not be visible
    					continue;
        			}
    	            		value = results[i].getValue({name: options.fields_to_render[j].id});
							text = results[i].getText({name: options.fields_to_render[j].id});
					//if text does not exist, use value
					//if value does not exist use " "
					sublistvalue = text || value || " "; //default
					if (options.fields_to_render[j].id === "isinactive")
					{
						sublistvalue = (value) ? "Yes": "No";
					}
					
				
					if (options.fields_to_render[j].columntype === "TEXT")
							{
						//for text fields, if record type is provided, link it up
						if (options.fields_to_render[j].recordtype)
						{
							sublistvalue = tfLibrary.getAnchor(options.fields_to_render[j].recordtype, value, text);
							if ((options.fields_to_render[j].id ==="custrecord_txfm_detail_deal")
								|| (options.fields_to_render[j].id ==="custrecord_txfm_detail_shareholder"))
							{
								sublist.setSublistValue({
									id: "custpage_hidden_" + options.fields_to_render[j].id,
									line: i,
									value:  value
								});
							}
							
							}
    				}
					else if (options.fields_to_render[j].columntype === "CURRENCY")
					{
						sublistvalue = (value) ? value : 0;
					}
					else if (options.fields_to_render[j].columntype === "TEXTAREA")
					{
						;//no changes; default value is ok
					}
					else 
					{
						throw " column type not yet handled " + JSON.stringify(options.fields_to_render[j]);
					}
    				
    				//ONE LINE UPDATES ALL COLUMNS PREPARED ABOVE
    				sublist.setSublistValue({
						id: "custpage_"+options.fields_to_render[j].id,
						line: i,
						value:  sublistvalue
					});
        		
	        	}
    		 }
    		 if (sublist.lineCount>0)
    	     {
    			 sublist.label = "(" + sublist.lineCount + ") Tax Form Batch Detail";
    	     }
    		 else 
    	     {
    			 sublist.label = "Tax Form Batch Detail";
    			 exportSS.isDisabled = true;
    	     }
    		
    		addIframeHeightDetectionField(context, form);
    		context.response.writePage(form);
        		 return;
	        		
		}
		function onRequest(context) 
		{
			var funcName = scriptName + "onRequest";
			var request = context.request;
			log.debug(funcName, context.request.parameters); 
        	var form = ui.createForm({title: "Tax Form Batch"});
        	var deals = null;
        	//honor custpage_ parameter first (in a case of a POST)
        	//if empty use regular parameter (in a case of GET)
    		if (dealsFound(request.parameters.custpage_deals))
    		{
    			deals = (request.parameters.custpage_deals||"").split(",");
    		}
    		else if (dealsFound(request.parameters.deals))
    		{
    			deals = (request.parameters.deals||"").split(",");
    		}
    		var taxyearfiled = request.parameters.custpage_taxyearfiled || request.parameters.taxyearfiled;
    		var reportmethod = request.parameters.custpage_reportmethod || request.parameters.reportmethod;
    		var taxformbatch = request.parameters.custpage_taxformbatch || request.parameters.taxformbatch;
    		var action = request.parameters.custpage_action || request.parameters.action;    		    		
    		var isCovered = request.parameters.isCovered;
    		var payerEntity = request.parameters.payerEntity;
    		var taskId = request.parameters.taskId;
    		var searchId = request.parameters.searchId;
    		var fileId = request.parameters.fileId;
    		var erId = request.parameters.erId;
    		var temp_folderid = appSettings.readAppSetting("General Settings","WIP Folder ID"); //temporary folder
    		var status = null;
    		var searchObj = null;
    		var options = {};
    		var datetime = "";
	    	var newSavedSearchID = "";
	    	var filename = "";
			var exportfileid = "";
			var searchTask = null;
			var searchTaskId = "";
			var value = "";
			var searchResultCount = 0;
    		var results = [];
    		
			var fields_to_render = srsConstants["Tax Form Batch Preview Columns"];
    		
    		try 
	        {
	    		//Only Tax Analysts have access to this functionality
	    		if (!tfLibrary.userIsATaxAnalyst()) 
	        	{ 
	   	        	form.addPageInitMessage({type: message.Type.ERROR, title: "Not Authorized", message: "Only Tax Analyst users (or Administrators) are authorized to use this function"}); 
	   	        	context.response.writePage(form);
	        		return; 
	        	}
	    		
	    		
	//    		if ((action === "crePreview") && (erId))
	//    		{
	//				var creProfileID = 42;
	//    			var defaultOptionsGroup = 1;
	//    			var requestHeader = record.create({type: "customrecord_pri_cre_request_header", isDynamic: true});
	//    			requestHeader.setValue({fieldId:"custrecord_pri_cre_request_header_status",value:srsConstants["CRE Request Status"]["Open"]});
	//    			requestHeader.setValue({fieldId:"custrecord_pri_cre_request_profile",value:creProfileID});
	//    			requestHeader.setValue({fieldId:"custrecord_pri_cre_request_header_reqid",value:erId});
	//    			requestHeader.setValue({fieldId:"custrecord_pri_cre_request_folder",value:temp_folderid});
	//    			requestHeader.setValue({fieldId:"custrecord_pri_cre_request_option",value:defaultOptionsGroup});
	//    			
	//    			//requestHeader.setValue({fieldId:"custrecord_pri_cre_request_header_param1",value:JSON.stringify(completionInfo)});
	//    			//requestHeader.setValue({fieldId:"custrecord_pri_cre_request_header_param2",value:request_options.FileName});
	//    			
	//    			var rawData = {};
	//    			rawData.payerEntity = payerEntity;
	//    			rawData.erId = erId;
	//    			rawData.taxformbatch = taxformbatch;
	//    			
	//    			requestHeader.setValue({fieldId:"custrecord_pri_cre_request_header_rawdat",value:JSON.stringify(rawData)});
	//    			
	//    			var requestHeaderid = requestHeader.save();	
	//    			
	//    			var objRequestHeader = record.load({type: "customrecord_pri_cre_request_header", id: requestHeaderid, isDynamic: true});
	//    		  	var outputDocumentID = objRequestHeader.getValue("custrecord_pri_cre_request_header_doc"); 
	//    		    var ofile = file.load({
	//                    id: outputDocumentID
	//                });
	//      		    var lurl = ofile.url;
	//                var documentbody  = '<hr><br><iframe src="'+lurl+'" width="75%" height="900">alt : <a href="'+lurl+'">Link</a></iframe>';
	//                
	//                context.response.write (documentbody);
	//    			
	//   	            return ;
	//    		}
	    		
	    		if (action === "submitBatch" && taxformbatch)
	    		{
	    			var request_options = {};
	    			request_options.taxformbatch = taxformbatch;
	    			
	    			log.audit("submitBatch request_options", JSON.stringify(request_options));
	    			
	    			var mapReduceTask = task.create({ taskType:task.TaskType.MAP_REDUCE });
	    			mapReduceTask.scriptId     = "customscript_tax_form_deal_mr";
	    			mapReduceTask.params       = {"custscript_mr_taxform_deal_json_object": JSON.stringify(request_options)};
	    			var mapReduceTaskId = mapReduceTask.submit();
	    			
	    			status = task.checkStatus({
		    			taskId: mapReduceTaskId
	    	    	});
	    	    	status = JSON.parse(JSON.stringify(status));
	    	    	
	    	    	var strInputSlURL = url.resolveScript({
						scriptId : "customscript_srs_tax_form_batch",
						deploymentId : "customdeploy_srs_tax_form_batch",
						returnExternalUrl: false
					});
	    	    	
	    	    	status.lookupurl = strInputSlURL;
    	    		
	    	    	//store prepared status with metadata into processing metadata field.
	    	    	var tfbREC = record.load({type: "customrecord_tax_form_batch", id: taxformbatch, isDynamic: true});
	    	    	tfbREC.setValue("custrecord_txfm_batch_processingmetadata", JSON.stringify(status, null, "\t"));
					tfbREC.save();
	    			
	    	    	
	    	    	return;
	    		}
	    		
	    		//trigger saved search export action as step #1.
	    		switch (action) 
				{
            		case "requestBatchPreviewSavedSearchExport":
            		case "requestBatchDetailSavedSearchExport":
	            		options = {
		        				 "taxyearfiled" : taxyearfiled,
		        				 "reportmethod" : reportmethod,
		        				 "deals" : deals,
		        				 "isCovered" : isCovered,
		        				 "taxformbatch" : taxformbatch
		        		 };
		    			options.downloadRequested = true;
		    			datetime = Date.now();
				    	newSavedSearchID = "customsearch_" + datetime;
				    	options.newSavedSearchID = newSavedSearchID;
				    	if (action === "requestBatchPreviewSavedSearchExport")
				    	{
							//PREVIEW SAVED SEARCH EXPORT 
				    		if (isNaN(options.taxyearfiled))
				    		{
				    			throw "taxyearfiled is required "; 
				    		}
				    		if (isNaN(options.reportmethod))
				    		{
				    			throw "reportmethod is required "; 
				    		}
				    		if (isNaN(options.isCovered))
				    		{
				    			throw "isCovered is required "; 
				    		}
				    		if (!deals)
				    		{
				    			throw "deals is required "; 
				    		}
				    		
				    		searchObj = tfLibrary.getTaxFormBatchSearch(options);
				    		filename = "BatchID_"+taxformbatch+"_"+newSavedSearchID+".csv";
			    			
				    	}
				    	else if (action === "requestBatchDetailSavedSearchExport")
				    	{
							//DETAIL RECORDS SAVED SEARCH EXPORT 
				    		if (isNaN(options.taxformbatch))
				    		{
				    			throw "taxformbatch is required "; 
				    		}
				    		options.fields_to_render = srsConstants["Tax Form Batch Detail Columns"];
				    		for (i = 0; i < options.fields_to_render.length; i+=1) 
				    		{
				    			if (options.fields_to_render[i].isAvailableFilter)
				    			{
				    				//retrieve any filters available in parameters and store 
				    				//first check POST value parameters
				    				//then check GET value parameters 
				    				//else empty
				    				value = context.request.parameters["custpage_filter_"+options.fields_to_render[i].id] || context.request.parameters[options.fields_to_render[i].filterparam] || "";
				    				value = value.trim();
				    				if (value)
				    				{
				    					//STORED FILTER VALUES WILL BE USED DURING SEARCH
				    					options.fields_to_render[i].value = value;
				    				}
				    			}
				    		}
				    		searchObj = tfLibrary.getTaxFormBatchDetailSearch(options);
				    		filename = "BatchID_"+taxformbatch+"_Detail_"+newSavedSearchID+".csv";
			    			
				    	}
		    			exportfileid = getBlankFileID(temp_folderid, filename ,file.Type.PLAINTEXT);
		    			
		    			searchTask = task.create({
		    	    	    taskType: task.TaskType.SEARCH
		    	    	});
		    			searchTask.fileId = exportfileid;
		    			
		    	    	searchTask.savedSearchId = searchObj.id;	//internal ID is exposed once search is loaded via search script ID
		    		
		    	    	searchTaskId = searchTask.submit();		//submit persistent search
		    	    	
		    	    	status = task.checkStatus({
			    			taskId: searchTaskId
		    	    	});
		    	    	status = JSON.parse(JSON.stringify(status));
		    	    	status.searchId = newSavedSearchID;
		    	    	
		    	    	context.response.write (JSON.stringify(status));
		    	    	return;
				}
	    		//if user action is checkTaskStatus, and taskId is provided 
	    		//check the status of the task and return entire status object 
	    		//this is step #2 in the export process 
	    		//map reduce and saved search tasks have _ in them; this check will exclude string "undefined"
	    		if ((action === "checkTaskStatus") && (taskId) && (taskId.indexOf("_")>=0))
	    		{
	    			log.debug("taskId " + taskId);
	    			status = task.checkStatus({
		    			taskId: taskId
	    	    	});
	    			var statusJSON = JSON.parse(JSON.stringify(status));
	    			log.debug("statusJSON ", JSON.stringify(statusJSON));
	    			
	    			if (statusJSON.type === "task.MapReduceScriptTaskStatus")
	    			{
	    				statusJSON.percentComplete = status.getPercentageCompleted();
	    			}
	    			context.response.write (JSON.stringify(statusJSON));
	    	    	return;
	    		}
	    		//if download file is requested and file ID is provided 
	    		//hand the file to the user using following method
	    		//there is a limit of 10MB for this process. 
	    		//this is step #3 in the export process 
	    		if ((action === "downloadFile") && (fileId))
	    		{
	    			if (!fileId)
	    			{
	    				throw "Expected parameter fileId not found";
	    			}
	    			var oFile = file.load({id: fileId});
	    	    	context.response.setHeader({name: "Content-Type", value: "text/csv"});
		    	    context.response.setHeader({name: "Content-Disposition", value: "attachment; filename=" + oFile.name});
	  	            context.response.write(oFile.getContents());
	  	            return;
	    		}
	    		
	    		//delete temp files function could be misused by providing any search/file combination
	    		//However, it must be a tax analyst, and is no more dangerous than
	    		//someone going directly to netsuite and deleting objects 
	    		//therefore, it is concluded that no additional security is needed for this call
	    		//this is step #4 in the export process 
	    		if ((action === "deleteTempfiles") && (searchId) && (fileId))
	    		{
	    			 if (fileId)
	   	            {
	   	            	 file.delete({
							 id: fileId
							 });
	   	            }
	   	            if (searchId)
	   	            {
	   	            	search.delete({
	   	            		id: searchId
	   	            	});
	   	            }
	   	            return ;
	    		}
	    		
	    		if (action === "getDetailData" 
	    			&& (!isNaN(taxformbatch))
	    			)
	    		{
	    			//renderDetailSublist IS MAIN FUNCTION THAT 
					//WILL RENDER TAX FORM BATCH DETAIL RECORDS 
	    			options = tfLibrary.getTaxFormValues(taxformbatch);
	    			options.fields_to_render = srsConstants["Tax Form Batch Detail Columns"];
	    			renderDetailSublist(context, options);
	    			return;
	    			
	    		}
	    		
    			//all other request will enter get preview suitelet functionality 
    			if (context.request.method === "GET") 
	        	{
    				
    				if (isNaN(taxyearfiled))
    				{
	        			return;
	        		}
	        		
	        		if (isNaN(reportmethod))
	        		{
	        			return;
	        		}
	        		if (!deals)
	        		{
	        			return;
	        		}
	        		if (isNaN(isCovered))
	        		{
	        			return;
	        		}
	        		
	        		var sublist = form.addSublist(
    				{
					    id : "custpage_sublist_batch_detail_preview",
					    label : "Tax Form Batch Detail Preview",
					    type : ui.SublistType.LIST
    				});
	        		
	        		form.clientScriptModulePath = "SuiteScripts/Prolecto/SRS_SL_TaxFormBatch_CL.js";
		    		
	        		
	        		var exportSS = sublist.addButton({
	        			id:"custpage_downloadss",
	        			label: "Export",
	        			functionName: "exportSS(\"requestBatchPreviewSavedSearchExport\")"
	        		});
	        		
	        		for (i = 0; i < fields_to_render.length; i+=1) 
	        		{
		        		sublist.addField({
		                     id: "custpage_"+fields_to_render[i].id,
		                     type: fields_to_render[i].columntype,
		                     label: fields_to_render[i].columnlabel
		                 });
	        		 
	        		}
	        		//hardcode Box1e. Is there a saved search field?
	        		sublist.addField({
	                     id: "custpage_box1e",
	                     type: ui.FieldType.TEXT,
	                     label: "Box 1E"
	                 });
	        		 
	        		options = {
	        				"taxyearfiled" : taxyearfiled,
	        				"reportmethod" : reportmethod,
	        				"deals" : deals,
	        				"isCovered" : isCovered
	        		};
	        		// the records to be displayed are from a saved search
//	        		var datetime = Date.now();
//			    	var newSavedSearchID = "customsearch_" + datetime;
//			    	options.newSavedSearchID = newSavedSearchID;
//			    	options.downloadRequested = true;
			    	log.debug("options ", JSON.stringify(options));
	        		
			    	
	        		searchObj = tfLibrary.getTaxFormBatchSearch(options);
			    	log.debug("searchObj ", JSON.stringify(searchObj));
	        		 
	        		searchResultCount = searchObj.runPaged().count;
	        		log.debug("searchObj result count: ",searchResultCount);
	        		results =  searchObj.run();
	        		 
	        		//request all records, even if over 1000
	        		results = searchLibrary.getSearchResultData(results);
	        		log.audit("results ", results.length);
	        		taxyearfiled = request.parameters.taxyearfiled;
	        		reportmethod = request.parameters.reportmethod;
	        		deals = (request.parameters.deals||"").split(",");
	        		isCovered = request.parameters.isCovered;
	        		payerEntity = request.parameters.payerEntity;
	        		taxformbatch = request.parameters.taxformbatch;
	        		
	        		//crePreview code is to be used for submit functionality
//	        		var strInputSlURL = url.resolveScript({
//						scriptId : "customscript_srs_tax_form_batch",
//						deploymentId : "customdeploy_srs_tax_form_batch",
//						returnExternalUrl: false,
//						 params: {taxyearfiled: taxyearfiled
//							 , reportmethod: reportmethod
//							 , deals: deals
//							 , isCovered: isCovered
//							 , payerEntity: payerEntity
//							 , taxformbatch: taxformbatch
//							 , action: "crePreview"
//						 }
//					});
	        		
	        		
	        		var row = 0;
	        		var i = 0;
	        		var j = 0;
	        		var sublistvalue = "";
	        		var text = "";
	        		var internalid = "";
	        		var box1dTotal = 0;
	        		var box1eTotal = 0;
	        		var box4Total = 0;
	        		for (i = 0; i < results.length; i+=1) 
	        		{
//	        			{
//        				  "values": {
//        				    "GROUP(custrecord_acq_loth_zzz_zzz_deal)": [
//        				      {
//        				        "value": "972033",
//        				        "text": "Value Payment Systems Government Brands Holdings"
//        				      }
//        				    ],
//        				    "GROUP(custrecord_acq_loth_zzz_zzz_shareholder)": [
//        				      {
//        				        "value": "976582",
//        				        "text": "Allisdair Kinloch"
//        				      }
//        				    ],
//        				    "GROUP(custrecord_acq_loth_2_de1_ssnein)": "594244414",
//        				    "SUM(CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT.custrecord_act_lotce_tax_report_amount)": "1221.22",
//        				    "SUM(CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT.custrecord_acq_lotce_zzz_zzz_taxwithheld)": "",
//        				    "MAX(custrecord_exrec_payment_eff_date)": "",
//        				    "MAX(id)": "611730",
//        				    "MAX(CUSTRECORD_ACQ_LOTH_RELATED_TRANS.trandate)": "3/14/2019"
//        				  }
//        				}
	        			row = i + 1;
	        			for (j = 0; j < fields_to_render.length; j+=1) 
			        	{
	        				switch (fields_to_render[j].id) 
	        				{
		    	            	case "custrecord_acq_loth_zzz_zzz_deal":
		    	            	case "custrecord_acq_loth_zzz_zzz_shareholder":
		    	            		value = results[i].getValue({name: fields_to_render[j].id, summary: "GROUP"});
									text = results[i].getText({name: fields_to_render[j].id, summary: "GROUP"});
									sublistvalue = tfLibrary.getAnchor("customer", value, text);
		    		        		sublist.setSublistValue({
		    								id: "custpage_"+fields_to_render[j].id,
		    								line: i,
		    								value:  (sublistvalue || " ")
		    							});
		    		        		break;
		    	            	case "custrecord_acq_loth_2_de1_ssnein":
		    	            		sublistvalue = results[i].getValue({name: fields_to_render[j].id, summary: "MAX"});
									text = results[i].getValue({name: fields_to_render[j].id, summary: "MAX"});
									sublist.setSublistValue({
		    								id: "custpage_"+fields_to_render[j].id,
		    								line: i,
		    								value:  (sublistvalue || " ")
		    							});
		    		        		break;
		    	            	case "custrecord_act_lotce_tax_report_amount":
		    	            	case "custrecord_acq_lotce_zzz_zzz_taxwithheld":
		    	            		value = results[i].getValue({name: fields_to_render[j].id, join:"CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT", summary: "SUM"})||0;
									text = results[i].getValue({name: fields_to_render[j].id, join:"CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT", summary: "SUM"});
									sublistvalue = (value) ? value : 0;
									sublist.setSublistValue({
		    								id: "custpage_"+fields_to_render[j].id,
		    								line: i,
		    								value:  sublistvalue
		    							});
									if (fields_to_render[j].id === "custrecord_act_lotce_tax_report_amount")
									{
										box1dTotal += parseFloat(value);
									}
									else if (fields_to_render[j].id === "custrecord_acq_lotce_zzz_zzz_taxwithheld")
									{
										box4Total += parseFloat(value);
									}
		    		        		break;
	        				}
			        	}
	        			
	        			
	        			value = 0;
	        			box1eTotal += parseFloat(value);
		        		sublist.setSublistValue({
		        			id: "custpage_box1e",
							line: i,
							value: " "
						});
//	        		  internalid = (searchresult.values["GROUP(internalid)"] && searchresult.values["GROUP(internalid)"][0] && searchresult.values["GROUP(internalid)"][0].value) || 0;
//	        		  value = strInputSlURL + "&erId=" + internalid;
//	        		  
//	        		  sublist.setSublistValue({
//							id: "preview",
//							line: i,
//							value: "<a href=""+value+"" target="_blank">"+internalid+"</a>"
//						});
	        		 }
	        		 if (sublist.lineCount>0)
	        	     {
	        			 sublist.label = "(" + sublist.lineCount + ") Tax Form Batch Detail Preview";
	        	     }
	        		 else 
	        	     {
	        			 sublist.label = "Tax Form Batch Detail Preview";
	        			 exportSS.isDisabled = true;
	        	     }
	        		 //retrieving summary data only for updating 
	        		 //of tax form batch header column 4
	        		 if (action === "getSummaryData")
	         		 {
	        			var summary = {};
						summary.numOfDeals = deals.length;
						summary.numOfForms = results.length;
						summary.Box1D = box1dTotal;
						//summary.Box1E =box1eTotal;
						summary.Box1E = " ";
						summary.Box4 = box4Total;
						
						 context.response.write(JSON.stringify(summary));
						 return;
	         		 }
	        		 else 
	        		 {
	        			 addIframeHeightDetectionField(context, form);
	        			 context.response.writePage(form);
		        		 return;
	        		 }
	        	}
	        } 
	        catch (e) 
	        {
	        	log.error(funcName + " " + e.toString(), JSON.stringify(e));
				msg.text = e.message;
				msg.title = "Error";
				msg.type = message.Type.ERROR; 
				context.response.write(JSON.stringify(e));
				return;
	        }

	        if (msg.text)
	        {
	        	//this functionality will not be visible if 
	        	//form is loaded in iframe without header
	        	form.addPageInitMessage({type: msg.type, title: msg.title, message: msg.text}); 
	        }
    	    
   	    	context.response.writePage(form);
   	    	
   	    	

		} // onRequest
		
		
		//===============================================================================================================================
		//===============================================================================================================================
		function getBlankFileID(folderid, name, type)
		{
			//persistent search requires file to be created. It overwrites the contents of the file. 
			// should file be downloaded, it will show the message. 
			var csvFile = file.create({
	            name: name,
	            folder: folderid, 
	            contents: " ",			
	            fileType: type
	        });
	    	
	    	var fileid = csvFile.save();
	    	return fileid;
		}
		
		// ================================================================================================================================
		// ================================================================================================================================
		// ================================================================================================================================
		
		return {
			onRequest : onRequest
		};
	});