/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/ui/message', 'N/currentRecord',
        "/SuiteScripts/Prolecto/Shared/SRS_Constants"    
        ],
	/**
	 * PaymentFileCreation_SL_CL.js
	 * Payment File Creation Suitelet client script 
	 */
	function(msg, currentRecord,
	srsConstants		
	) {
		var myMsg = null;
		Number.prototype.numberWithCommas = function(){
			return this.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
		};
		function showErrorMessage(title, msgText) {
			myMsg = msg.create({
				title: title,
				message: msgText,
				type: msg.Type.ERROR
			});
			myMsg.show();
			window.scrollTo(0, 0);
		}
	
		function fieldChanged(context)
		{
			var REC = context.currentRecord;          
	        var fieldId = context.fieldId;
	        var selectedValues = [];
	        var unfilteredIndex = null;
	        try {
	            switch (fieldId) {
	            	case 'deal':
	            	case 'transactiontype':
	            		//for both deal and transaction type, 
	            		//do not allow Unfiltered to be selected
	            		//with other choices. This doubles up results incorrectly.
	            		selectedValues = REC.getValue(fieldId);
	            		if (selectedValues.length>1)
	            		{	//if there are at least two selections, apply this logic 
	            			unfilteredIndex = selectedValues.indexOf("Unfiltered");
	            			if (unfilteredIndex >= 0)
	            			{
	            				REC.setValue(
	            						{ fieldId: fieldId
	            						, value: selectedValues.splice(unfilteredIndex, 1)
	            						, ignoreFieldChange: true 
	            						}
	            					);
	            			}
	            		}
	            		//console.log("selectedValues " + selectedValues);
	            		break;
	            }
	        }
	        catch (e)
	        {
	        	log.error("PaymentFileCreation_SL_CL field changed error ", e.toString());
	        	//console.log(e);
	        }
            
		}
		function saveRecord(context) {
			if (myMsg)
			{
				myMsg.hide();
			}
			var REC = currentRecord.get();//Get current record
			var actiononsubmit = REC.getValue("actiononsubmit");
			try 
			{
				
				if (actiononsubmit === "genradio")
				{
					var allExcluded = true;
					var amount = 0;
					var cust_refund_id = 0;
					var payment_type_code = "";
					var i = 0; 
					var messages = "";
					var exclude = "";
					for (i = 0; i < REC.getLineCount({sublistId: "sublist"}); i+=1) 
					{
						exclude = REC.getSublistValue({
							sublistId : 'sublist',
							fieldId : 'column' +srsConstants.CUST_REFUND_SUBLIST_COLUMNS.EXCLUDE_FLAG_INDEX,
							line : i
						});
						if (!exclude)
						{
							allExcluded = false;
							break;
						}
					}
					
					if (allExcluded)
					{
						showErrorMessage("Payment File Cannot be Created", "All lines are excluded.");
						return false;
					}
					
					
					for (i = 0; i < REC.getLineCount({sublistId: "sublist"}); i+=1) 
					{
						exclude = REC.getSublistValue({
							sublistId : 'sublist',
							fieldId : 'column' +srsConstants.CUST_REFUND_SUBLIST_COLUMNS.EXCLUDE_FLAG_INDEX,
							line : i
						});
						if (!exclude)
						{
							amount = REC.getSublistValue({
								sublistId : 'sublist',
								fieldId : 'column' +srsConstants.CUST_REFUND_SUBLIST_COLUMNS.PAYMENT_TOTAL_INDEX,
								line : i
							});
							cust_refund_id = REC.getSublistValue({
								sublistId : 'sublist',
								fieldId : 'column' +srsConstants.CUST_REFUND_SUBLIST_COLUMNS.INTERNAL_ID_INDEX,
								line : i
							});
							payment_type_code = REC.getSublistValue({
								sublistId : 'sublist',
								fieldId : 'column' +srsConstants.CUST_REFUND_SUBLIST_COLUMNS.TRANSACTION_TYPE_INDEX,
								line : i
							});
							if (payment_type_code === "CHECK")
							{
								if (parseFloat(amount)>parseFloat(srsConstants["Check Max Amount"]))
								{
									messages += (messages) ? "<Br>" : "";
									messages += "Please check Customer Refund " + cust_refund_id + " amount $" + parseFloat(amount).numberWithCommas();
								}
							}
						}
					}
					if (messages)
					{
						showErrorMessage("Unreasonable Payment Amount Error(s) found ", messages);
						return false;
					}
					
				}
			}
			catch (e)
			{
				showErrorMessage("Unexpected Error ", e.message);
				return false;
			}
		//	console.log("passed");
			return true;
		}



		

		

		return {
			saveRecord: saveRecord,
			fieldChanged: fieldChanged
		};
	});