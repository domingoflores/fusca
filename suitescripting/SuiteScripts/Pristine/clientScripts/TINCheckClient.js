//------------------------------------------------------------------
// Copyright 2017, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------

// ------------------------------------------------------------------------------------------------------------------------------------
// Description: Entity Bank Details Client Script
// Developer: Alex Fodor
// Date: Sep 2018
// Initial development is to default the name field to the name of template in use
// ------------------------------------------------------------------------------------------------------------------------------------
/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(
		[ 'N/error' ,'N/record' ,'N/runtime' ,'N/search' ,'N/ui/message' ,'N/ui/dialog' ,'N/currentRecord' ,'N/https' ],
		/**
		 * @param {error}
		 *            error
		 * @param {record}
		 *            record
		 * @param {runtime}
		 *            runtime
		 * @param {search}
		 *            search
		 */
		function(error ,record ,runtime ,search ,msg ,dialog ,currentRecord ,https) {

			/**
			 * Function to be executed after page is initialized.
			 * 
			 * @param {Object}
			 *            context
			 * @param {Record}
			 *            context.currentRecord - Current form record
			 * @param {string}
			 *            context.mode - The mode in which the record is
			 *            being accessed (create, copy, or edit)
			 * 
			 * @since 2015.2
			 */
			function pageInit(context) {

				try {

					var name = context.currentRecord.getText("custpage_2663_entity_file_format");
			        context.currentRecord.setValue("name" ,name);

					
				} catch (ex) {
					alert("BT_CL_Entity_Bank_Details.js Exception in pageInit: " + JSON.stringify(ex));
				}

				return true;
			}


			/**
			 * Function to be executed when field is changed.
			 * 
			 * @param {Object}
			 *            context
			 * @param {Record}
			 *            context.currentRecord - Current form record
			 * @param {string}
			 *            context.sublistId - Sublist name
			 * @param {string}
			 *            context.fieldId - Field name
			 * @param {number}
			 *            context.lineNum - Line number. Will be undefined
			 *            if not a sublist or matrix field
			 * @param {number}
			 *            context.columnNum - Line number. Will be
			 *            undefined if not a matrix field
			 * 
			 * @since 2015.2
			 */
			function fieldChanged(context) {
		        var fieldId = context.fieldId;
		        
//		        if (fieldId == 'custpage_2663_entity_file_format') { 
//					var name = context.currentRecord.getText("custpage_2663_entity_file_format");
//			        context.currentRecord.setValue("name" ,name);
//		        } // fieldId == 'custpage_2663_entity_file_format'
		        


			}

			/**
			 * Function to be executed when field is slaved.
			 * 
			 * @param {Object}
			 *            context
			 * @param {Record}
			 *            context.currentRecord - Current form record
			 * @param {string}
			 *            context.sublistId - Sublist name
			 * @param {string}
			 *            context.fieldId - Field name
			 * 
			 * @since 2015.2
			 */
			function postSourcing(context) {

			}

			/**
			 * Function to be executed after sublist is inserted, removed, or
			 * edited.
			 * 
			 * @param {Object}
			 *            context
			 * @param {Record}
			 *            context.currentRecord - Current form record
			 * @param {string}
			 *            context.sublistId - Sublist name
			 * 
			 * @since 2015.2
			 */
			function sublistChanged(context) {

			}

			/**
			 * Function to be executed after line is selected.
			 * 
			 * @param {Object}
			 *            context
			 * @param {Record}
			 *            context.currentRecord - Current form record
			 * @param {string}
			 *            context.sublistId - Sublist name
			 * 
			 * @since 2015.2
			 */
			function lineInit(context) {

			}

			/**
			 * Validation function to be executed when field is changed.
			 * 
			 * @param {Object}
			 *            context
			 * @param {Record}
			 *            context.currentRecord - Current form record
			 * @param {string}
			 *            context.sublistId - Sublist name
			 * @param {string}
			 *            context.fieldId - Field name
			 * @param {number}
			 *            context.lineNum - Line number. Will be undefined
			 *            if not a sublist or matrix field
			 * @param {number}
			 *            context.columnNum - Line number. Will be
			 *            undefined if not a matrix field
			 * 
			 * @returns {boolean} Return true if field is valid
			 * 
			 * @since 2015.2
			 */
			function validateField(context) {

			}

			/**
			 * Validation function to be executed when sublist line is
			 * committed.
			 * 
			 * @param {Object}
			 *            context
			 * @param {Record}
			 *            context.currentRecord - Current form record
			 * @param {string}
			 *            context.sublistId - Sublist name
			 * 
			 * @returns {boolean} Return true if sublist line is valid
			 * 
			 * @since 2015.2
			 */
			function validateLine(context) {

			}

			/**
			 * Validation function to be executed when sublist line is inserted.
			 * 
			 * @param {Object}
			 *            context
			 * @param {Record}
			 *            context.currentRecord - Current form record
			 * @param {string}
			 *            context.sublistId - Sublist name
			 * 
			 * @returns {boolean} Return true if sublist line is valid
			 * 
			 * @since 2015.2
			 */
			function validateInsert(context) {

			}

			/**
			 * Validation function to be executed when record is deleted.
			 * 
			 * @param {Object}
			 *            context
			 * @param {Record}
			 *            context.currentRecord - Current form record
			 * @param {string}
			 *            context.sublistId - Sublist name
			 * 
			 * @returns {boolean} Return true if sublist line is valid
			 * 
			 * @since 2015.2
			 */
			function validateDelete(context) {

			}

			/**
			 * Validation function to be executed when record is saved.
			 * 
			 * @param {Object}
			 *            context
			 * @param {Record}
			 *            context.currentRecord - Current form record
			 * @returns {boolean} Return true if record is valid
			 * 
			 * @since 2015.2
			 */
			function saveRecord(context) {

				
	    		var status = context.currentRecord.getText("custrecord_tinchk_req_sts"); 
	        	
//	    		
//	    		if (   status == "Invoking"
//	    			|| status == "Deferred"
//	    			|| status == "Requested"
//	    			|| status == "Scheduled" ) { 
//	    			
//	        		var submitTinCheck = true;
//	            	if ( !(   (   context.currentRecord.getValue("custrecord_acq_loth_2_de1_ssnein")  > ""
//	    	                   && context.currentRecord.getValue("custrecord_acq_loth_2_de1_irsname") > "" )  
//	    		           || ( context.currentRecord.getValue("custrecord_exrec_giin") > ""                )      )   ) 
//	    	        { submitTinCheck = false; }
//	        		
//	        		if (submitTinCheck == false) {  
//						showErrorMessage('TIN Check Data Incomplete.', 'TIN Check data is incomplete, minimum required data is not present.'); 
//						return false;
//	        		}
//	    		}
	    		
	    		return true;
			}
			
    		
    		//=====================================================================================================
    		//=====================================================================================================
    		function showErrorMessage(msgTitle, msgText) {
    			var myMsg = msg.create({
    				title: msgTitle,
    				message: msgText,
    				type: msg.Type.ERROR
    			});
    			myMsg.show({ duration: 7500 });
                window.scrollTo(0, 0);
    		}
			

			return {
				// pageInit : pageInit
				//,fieldChanged : fieldChanged
				//,postSourcing : postSourcing
				//,sublistChanged : sublistChanged
				//,lineInit : lineInit
				//,validateField : validateField
				//,validateLine : validateLine
				//,validateInsert : validateInsert
				//,validateDelete : validateDelete
				saveRecord : saveRecord
			};

		});