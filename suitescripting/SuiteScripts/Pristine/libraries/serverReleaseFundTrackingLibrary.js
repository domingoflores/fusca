/**
 * @NApiVersion 2.x
 * @NModuleScope public
 * Server Library for ATP-1077
 */

define(['N/search', 'N/runtime', 'N/ui/dialog', "N/record"
	 ,'SuiteScripts/Prolecto/Shared/SRS_Constants'
	 ,'SuiteScripts/Prolecto/Shared/SRS_Functions'
	 , '/.bundle/132118/PRI_ShowMessageInUI'
	 ,'SuiteScripts/Pristine/libraries/clientReleaseFundTrackingLibrary.js'
	],
       
    /**
        Client Fund Release Tracking - UserEvent Script
    */
    function (search, runtime, dialog, record
    		, srsConstants
    		, srsFunctions
    		,priMessage
    		,crftLibrary
    ) {

        function _selectLine(currentRecord, options)
        {
            var i = 0;
            var record_id = "";
            var amountdue = 0;
            var linepayment = 0;
            var due = 0;
            var remaining = 0;
            var deposit_apply_checked = false;
            log.audit(" _selectLine ", options.line_sublistid);
            var itemcount = currentRecord.getLineCount(
                {
                    sublistId : options.line_sublistid
                });

            log.audit(options.line_sublistid + " count: ", itemcount);


//			var csvFile = file.create({
//	            name: "lineids.json.txt",
//	            contents: JSON.stringify(currentRecord),			//write header row 
//	            folder: 356735, 
//	            fileType: file.Type.PLAINTEXT
//	        });
//			csvFile.save();


//			return;
            //if index is not selected initialize choises if invoice had been selected
            for (i=0;i<itemcount;i+=1)
            {
                record_id = currentRecord.getSublistValue({
                    sublistId : options.line_sublistid,
                    fieldId : options.line_fieldid,
                    line : i
                });

            	log.audit("_selectLine", record_id + ",  " + options.internalid);
                if (parseInt(record_id,10) === parseInt(options.internalid,10))
                {
                    currentRecord.selectLine({
                        sublistId: options.line_sublistid,
                        line: i
                    });
                    log.audit("line found");
                    currentRecord.setCurrentSublistValue(
                        {
                            sublistId: options.line_sublistid,
                            value: true,
                            fieldId: "apply"
                        });

                    if (options.line_amount)
                    {
	                    currentRecord.setCurrentSublistValue(
	                        {
	                            sublistId: options.line_sublistid,
	                            value: options.line_amount,
	                            fieldId: "amount"
	                        });
                    }
                    currentRecord.commitLine({sublistId:options.line_sublistid});

                }
              
            }
           
        }
		
		function _selectDepositLine(currentRecord, options)
        {
            var i = 0;
            var record_id = "";
            var amountdue = 0;
            var linepayment = 0;
            var due = 0;
            var depositdate = null;
            var remaining = 0;
            var arr = [];
            var line = "";
            var entry = {};
            var amounttoapply = "";
            log.audit(" _selectDepositLine ", options.line_sublistid);
            var itemcount = currentRecord.getLineCount(
                {
                    sublistId : options.line_sublistid
                });

            log.audit(options.line_sublistid + " count: ", itemcount);

            //if index is not selected initialize choises if invoice had been selected
            for (i=0;i<itemcount;i+=1)
            {
                record_id = currentRecord.getSublistValue({
                    sublistId : options.line_sublistid,
                    fieldId : options.line_fieldid,
                    line : i
                });
               if (options.line_sublistid === "deposit" && options.line_amount)
            	   {
            	   		log.audit("found deposit");
            	   		
            	   		depositdate = currentRecord.getSublistValue(
                        {
                            sublistId: options.line_sublistid,
                            fieldId: "depositdate",
                            line : i
                        });
            	   		
            	   		remaining = currentRecord.getSublistValue(
                           {
                               sublistId: options.line_sublistid,
                               fieldId: "remaining",
                               line : i
                           });
            	   		
            	   		entry = {};
            	   		entry.depositdate = depositdate;
            	   		entry.remaining = remaining;
            	   		entry.line = i;
            	   		arr.push(entry);	
            	   }
            }
            //input [{
//                "depositdate": "2019-10-08T07:00:00.000Z",
//                "remaining": 20,
//                "line": 0
//              },
//              {
//                "depositdate": "2019-10-08T07:00:00.000Z",
//                "remaining": 1,
//                "line": 1
//              },
//              {
//                "depositdate": "2019-09-18T07:00:00.000Z",
//                "remaining": 3,
//                "line": 2
//              }
//            ]
            
            //output [
//            {
//                "depositdate": "2019-09-18T07:00:00.000Z",
//                "remaining": 3,
//                "line": 2
//              },
//              {
//                "depositdate": "2019-10-08T07:00:00.000Z",
//                "remaining": 20,
//                "line": 0
//              },
//              {
//                "depositdate": "2019-10-08T07:00:00.000Z",
//                "remaining": 1,
//                "line": 1
//              }
//            ]
            
            if (arr.length>0)
            {
            	
            		log.audit("deposit lines before sort ", JSON.stringify(arr));
		            //sort array in the order 
		            arr.sort(function(a, b) {
		                return new Date(a.depositdate) - new Date(b.depositdate);
		            });
		            log.audit("deposit lines after sort ", JSON.stringify(arr));
		            for (i=0;i<arr.length;i+=1)
		            {
		            	remaining = arr[i].remaining;
		            	depositdate = arr[i].depositdate;
		            	line = arr[i].line;
		            	
		            	if (parseFloat(options.line_amount)>0)
		            	{
		            		//we are now spinning throug a sorted array grabbing sorted lines 
				    			currentRecord.selectLine({
				                    sublistId: options.line_sublistid,
				                    line: line
				                });
				        		currentRecord.setCurrentSublistValue(
				                    {
				                        sublistId: options.line_sublistid,
				                        value: true,
				                        fieldId: "apply"
				                    });
				        		
				        		if (parseFloat(options.line_amount)<=parseFloat(remaining))
				        		{
				        			//if amount is smaller or less than remaining, good apply entrie amount against deposit
				        			amounttoapply = options.line_amount;
					        	}
				        		else 
				        		{
				        			//amount is higher than deposit, apply only remaining portion, as that is how much is available
				        			amounttoapply = remaining;
				        		}
				        		//subracting remaining from amount, and updating amount for next round of processing
				        		// if 0, there is no next round 
				        		options.line_amount = options.line_amount - remaining;
				        		log.audit("line selected ", line);
				        		log.audit("applying amount ", amounttoapply);
				        		log.audit("remaining to apply ", options.line_amount);
				        		currentRecord.setCurrentSublistValue(
			                    {
			                        sublistId: options.line_sublistid,
			                        value: amounttoapply,
			                        fieldId: "amount"
			                    });
				        		
				        		currentRecord.commitLine({sublistId:options.line_sublistid});
				        		
//				        		var csvFile = file.create({
//				    	            name: "lineids.json."+line+".txt",
//				    	            contents: JSON.stringify(currentRecord),			//write header row 
//				    	            folder: 5122, 
//				    	            fileType: file.Type.PLAINTEXT
//				    	        });
//				    			csvFile.save();
				        		
		            		}
		            }
            	} 
            
//            var csvFile = file.create({
//	            name: "lineids.json.txt",
//	            contents: JSON.stringify(currentRecord),			//write header row 
//	            folder: 5122, 
//	            fileType: file.Type.PLAINTEXT
//	        });
//			csvFile.save();
        }
		
		
		function createVendorBill(options)
        {
            log.debug('createVendorBill');
            var message = '';
            var success = false;
            var vendorBillId = null;
            var i=0;

            // Create vendor bill
            var vendorBill = record.create({
                type: record.Type.VENDOR_BILL,
                isDynamic: true
            });


            for (key in options.vendorbill)
            {
                if (!Array.isArray(options.vendorbill[key]))
                {
                    //Set body fields
                    vendorBill.setValue({
                        fieldId: key,
                        value: options.vendorbill[key]
                        //,ignoreFieldChange: true
                    });
                }
            }


            var expenses = options.vendorbill.expenses;
            var expense = {};
            var key = null;
            for(i=0; i<expenses.length; i+=1)
            {
                expense = expenses[i];

                vendorBill.selectNewLine('expense');
                for (key in expense)
                {
                    vendorBill.setCurrentSublistValue('expense', key, expense[key]);
                }
                vendorBill.commitLine('expense');
            }

            //Set expense line fields


//            try {
                vendorBillId = vendorBill.save();
                message += 'Vendor Bill ' + srsFunctions.getAnchor("vendorbill", vendorBillId) + ' created.' + '<br>';
                success = true;
//            } catch (e) {
//                log.error('createVendorBill --', 'e: ' + JSON.stringify(e));
//                message += 'Failed to create Vendor Bill. Error: ' + e.message + ';<br>';
//
//            }

            return {
                "success": success,
                "vendorBillId": vendorBillId,
                "message": message
            };

        }
		
		
		function callCreateVendorBill(options)
        {
            var result = {};
            var funcName = "callCreateVendorBill";
            log.audit("callCreateVendorBill", JSON.stringify(options));
            //create vendor bill
            		options.vendorbill = {};
            		var fieldValues = search.lookupFields({
                     type: 'customrecord_client_release_tracking',
                     id: options.clientfund.internalid,
                     columns: ['custrecord_crf_trk_vendor', 'custrecord_crf_trk_amount', 'custrecord_crf_trk_currency'
                    	 , 'custrecord_crf_trk_date', 
                    	 'custrecord_crf_trk_post_period', 
                    	 'custrecord_crf_trk_memo', 
                    	 'custrecord_crf_trk_deal',
                    	 'custrecord_crf_trk_pay_from_acc'
                    	 ]
                 });
            		
            		
            	 log.debug("fieldValues ", JSON.stringify(fieldValues));
            	 
                 var message = '';
                 var success = false;
                 var invoiceId = null;

                 options.clientfund.custrecord_crf_trk_vendor = Number(fieldValues.custrecord_crf_trk_vendor[0].value);
                 log.debug('options.clientfund.custrecord_crf_trk_vendor', options.clientfund.custrecord_crf_trk_vendor);
                 
                 options.clientfund.custrecord_crf_trk_amount = fieldValues.custrecord_crf_trk_amount;
                 log.debug('options.clientfund.custrecord_crf_trk_amount', options.clientfund.custrecord_crf_trk_amount);
                 
                 options.clientfund.custrecord_crf_trk_currency = Number(fieldValues.custrecord_crf_trk_currency[0].value);
                 log.debug('options.clientfund.custrecord_crf_trk_currency', options.clientfund.custrecord_crf_trk_currency);
                 
                 options.clientfund.custrecord_crf_trk_date = fieldValues.custrecord_crf_trk_date;
                 log.debug('options.clientfund.custrecord_crf_trk_date', options.clientfund.custrecord_crf_trk_date);
                 
                 
                 options.clientfund.custrecord_crf_trk_post_period = fieldValues.custrecord_crf_trk_post_period;
                 log.debug('options.clientfund.custrecord_crf_trk_post_period', options.clientfund.custrecord_crf_trk_post_period);
                 
                 options.clientfund.custrecord_crf_trk_memo = fieldValues.custrecord_crf_trk_memo;
                 log.debug('options.clientfund.custrecord_crf_trk_memo', options.clientfund.custrecord_crf_trk_memo);
                 
                 options.clientfund.custrecord_crf_trk_deal = Number(fieldValues.custrecord_crf_trk_deal[0].value);
                 log.debug('options.clientfund.custrecord_crf_trk_deal', options.clientfund.custrecord_crf_trk_deal);
                 
                 options.clientfund.custrecord_crf_trk_pay_from_acc = Number(fieldValues.custrecord_crf_trk_pay_from_acc[0].value);
                 
                 
                options.vendorbill.customform = srsConstants.CUSTOM_FORMS.SRS_DEAL_EXPENSE_BILL;
                options.vendorbill.entity = options.clientfund.custrecord_crf_trk_vendor;
                options.vendorbill.account = srsConstants.ACCOUNT.AP_CLIENT_CASH;
                options.vendorbill.usertotal = options.clientfund.custrecord_crf_trk_amount;
                options.vendorbill.currency = options.clientfund.custrecord_crf_trk_currency;
                
                options.vendorbill.duedate = new Date(options.clientfund.custrecord_crf_trk_date);
                options.vendorbill.trandate = new Date(options.clientfund.custrecord_crf_trk_date);
                //posting period will not be needed because transaction date will update
                //options.vendorbill.postingperiod = options.clientfund.custrecord_crf_trk_post_period;
                options.vendorbill.memo = options.clientfund.custrecord_crf_trk_memo;
                options.vendorbill.department = srsConstants.DEPT.CLIENT_ACCOUNT_SRS;
                options.vendorbill.class = srsConstants.CLASS.CLIENT_ACCOUNTS_SRS;
                options.vendorbill.custbodyacq_deal_link = options.clientfund.custrecord_crf_trk_deal;
                options.vendorbill.approvalstatus = srsConstants.VENDOR_BILL_STATUS.APPROVED;
                
               options.vendorbill.expenses = [];

                var expense = {};
                expense.account = srsConstants.ACCOUNT.ACQUIOM_CLIENT_EXPENSES_ESCROW_DISTRIBUTIONS;
                expense.amount = options.clientfund.custrecord_crf_trk_amount;
                expense.memo = options.clientfund.custrecord_crf_trk_memo;
                expense.customer  = options.clientfund.custrecord_crf_trk_deal;
                
                expense.department = srsConstants.DEPT.CLIENT_ACCOUNT_SRS;
                expense.isbillable = true;

                options.vendorbill.expenses.push(expense);

                log.audit("vendorbill options ", JSON.stringify(options));

                result = createVendorBill(options);
                log.debug(funcName, "result: " + JSON.stringify(result));
                options.vendorbill.internalid = result.vendorBillId;
                options.all_messages += result.message;
               
                var fundActivityUpdates = {};
                if (result.success)
                {
                    priMessage.prepareMessage("Completed", options.all_messages, priMessage.TYPE.CONFIRMATION);
                    fundActivityUpdates.custrecord_crf_trk_bill = options.vendorbill.internalid;
                }
                else
                {
                    priMessage.prepareMessage('FAILED', options.all_messages, priMessage.TYPE.WARNING);
                    fundActivityUpdates.custrecord_crf_trk_status = srsConstants["Client Fund Release Status"]["Failed"];
                }
                
                fundActivityUpdates.custrecord_crf_trk_activity = result.message + "\n";
                updateFundActivityFields(options.clientfund.internalid, fundActivityUpdates);
                
                return result;
        }
		function updateFundActivityFields(fundid, fieldstoUpdate)
		{
			if (!fundid)
			{
				return;
			}
			
			if (fieldstoUpdate.custrecord_crf_trk_activity)
			{
				var activity = search.lookupFields({
	                type: "customrecord_client_release_tracking",
	                id: fundid,
	                columns: "custrecord_crf_trk_activity"
	            });
				fieldstoUpdate.custrecord_crf_trk_activity =  fieldstoUpdate.custrecord_crf_trk_activity.replace(/<[^>]*>?/gm, '') + "\n" + activity.custrecord_crf_trk_activity;				
			}
			var id = record.submitFields({
                type: 'customrecord_client_release_tracking',
                id: fundid,
                values: fieldstoUpdate
            });
			
		}
		function callCreateVendorPayment(options)
        {
            var result = {};
            var funcName = "callCreateVendorPayment";
            //create vendor Payment
            try {

//                options.vendorpayment.toach = false;
                options.vendorpayment.apacct = srsConstants.ACCOUNT.AP_CLIENT_CASH;
                	
                options.vendorpayment.entity = options.clientfund.custrecord_crf_trk_vendor;
               
                options.vendorpayment.currency = options.clientfund.custrecord_crf_trk_currency;
              //account must be called after currency 
                options.vendorpayment.account = options.clientfund.custrecord_crf_trk_pay_from_acc; 
                
                
                options.vendorpayment.trandate = new Date(options.clientfund.custrecord_crf_trk_date);
//                options.vendorpayment.postingperiod = options.clientfund.custrecord_crf_trk_post_period;
                options.vendorpayment.department = srsConstants.DEPT.CLIENT_ACCOUNT_SRS;
                options.vendorpayment.class = srsConstants.CLASS.CLIENT_ACCOUNTS_SRS;
                options.vendorpayment.custbodyacq_deal_link = options.clientfund.custrecord_crf_trk_deal;
                
                log.audit("vendorpayment options ", JSON.stringify(options));

                result = createVendorPayment(options);
                log.debug(funcName, "result: " + JSON.stringify(result));

                options.all_messages += result.message;
                var fundActivityUpdates = {};
                
                if (result.success)
                {
                    priMessage.prepareMessage("Completed", options.all_messages, priMessage.TYPE.CONFIRMATION);
                    fundActivityUpdates.custrecord_crf_trk_bill_paymt = result.vendorPaymentId;
                }
                else
                {
                    priMessage.prepareMessage('FAILED', options.all_messages, priMessage.TYPE.WARNING);
                    fundActivityUpdates.custrecord_crf_trk_status = srsConstants["Client Fund Release Status"]["Failed"];
                    
                }
                
                fundActivityUpdates.custrecord_crf_trk_activity = result.message;
                updateFundActivityFields(options.clientfund.internalid, fundActivityUpdates);
                

            } catch (e) {
                log.error(funcName, e);
                if (e.message)
                {
                    options.all_messages += e.message;
                    priMessage.prepareMessage("Error", e.message, priMessage.TYPE.ERROR);
                }
                else
                {
                    options.all_messages += e;
                    priMessage.prepareMessage("Error", e, priMessage.TYPE.ERROR);
                }
            }
            return result;
        }
		
		function createVendorPayment(options)
        {
            log.debug('createVendorPayment');
            var message = '';
            var success = false;
            var vendorPaymentId = null;
            var i=0;
            var key;

            var vendorpayment = record.transform({
                fromType : record.Type.VENDOR_BILL,
                fromId : options.vendorbill.internalid,
                toType : record.Type.VENDOR_PAYMENT,
                isDynamic : true
            });
            
            for (key in options.vendorpayment)
            {
                //Set body fields
                vendorpayment.setValue({
                    fieldId: key,
                    value: options.vendorpayment[key]
                });
            }

            var line = {};
            line.line_sublistid = "apply";
            line.line_fieldid = "internalid";
            line.internalid =    options.vendorbill.internalid;
            _selectLine(vendorpayment, line);
            
//			var csvFile = file.create({
//	            name: "vendorpayment.json.txt",
//	            contents: JSON.stringify(vendorpayment),			//write header row 
//	            folder: 164942, 
//	            fileType: file.Type.PLAINTEXT
//	        });
//			csvFile.save();



            try {
                vendorPaymentId = vendorpayment.save();
                message += 'Vendor Payment ' + srsFunctions.getAnchor("vendorpayment", vendorPaymentId) + ' created.' + '<br>';
                success = true;
            } catch (e) {
                log.error('createVendorPayment', 'e: ' + JSON.stringify(e));
                message += 'Failed to create Vendor Payment. Error: ' + e.message + ';<br>';

            }

            return {
                "success": success,
                "vendorPaymentId": vendorPaymentId,
                "message": message
            };

        }
		function callCreateInvoice(options)
        {
            var result = {};
            var funcName = "callCreateInvoice";
            //create invoice receive fees
            try {
            	options.invoice = {};
                options.invoice.customform = srsConstants.CUSTOM_FORMS.SRS_INVOICE;
                options.invoice.entity = options.clientfund.custrecord_crf_trk_deal;
                options.invoice.trandate = new Date(options.clientfund.custrecord_crf_trk_date);
                
                options.invoice.memo = options.clientfund.custrecord_crf_trk_memo;
                options.invoice.currency = options.clientfund.custrecord_crf_trk_currency;
                
                options.invoice.custbodyacq_deal_link= options.clientfund.custrecord_crf_trk_deal;
                options.invoice.department = srsConstants.DEPT.CLIENT_ACCOUNT_SRS;
                options.invoice.class = srsConstants.CLASS.CLIENT_ACCOUNTS_SRS;
                options.invoice.custbody_auto_generate_tasks = true;
                
//                options.invoice.items = [];
//                var item = {};
//                item.item = srsConstants.ITEM.OPS_AEA_FEE_RECEIVED;
//                item.quantity = 1;
//                item.amount = options.dealescrow.amount;
//                options.invoice.items.push(item);
                log.audit("vendoribll id 3", options.vendorbill.internalid);
                result = createInvoice2(options);
                options.all_messages += result.message;
                log.debug(funcName, "result: " + JSON.stringify(result));
                var fundActivityUpdates = {};
                if (result.success) {
                    priMessage.prepareMessage("Completed", options.all_messages, priMessage.TYPE.CONFIRMATION);
                    fundActivityUpdates.custrecord_crf_trk_invoice = options.invoice.internalid;
                
					var fieldValues = search.lookupFields({
                    type:  record.Type.INVOICE,
                    id: options.invoice.internalid,
                    columns: ['tranid']
					});
					
					if (fieldValues["tranid"])
					{
						var id = record.submitFields({
							type: record.Type.VENDOR_BILL,
							id: options.vendorbill.internalid,
							values: {
								"tranid":fieldValues["tranid"]
							}
						});
					}
				} 
                else 
                {
                    priMessage.prepareMessage('FAILED', options.all_messages, priMessage.TYPE.WARNING);
                    fundActivityUpdates.custrecord_crf_trk_status = srsConstants["Client Fund Release Status"]["Failed"];
                }
                fundActivityUpdates.custrecord_crf_trk_activity = result.message;
                updateFundActivityFields(options.clientfund.internalid, fundActivityUpdates);
                
                
                
                

            } catch (e) {
                log.error(funcName, e);
                if (e.message)
                {
                    result.all_messages += e.message;
                    priMessage.prepareMessage("Error", e.message, priMessage.TYPE.ERROR);
                }
                else
                {
                    result.all_messages += e;
                    priMessage.prepareMessage("Error", e, priMessage.TYPE.ERROR);
                }

            }
            return result;
        }
		function createInvoice2(options) {
            log.debug('createInvoice2');

            var message = '';
            var success = false;
            var invoiceId = null;
            var i = 0;
            var key = "";

            // // Create invoice
            var invoice = record.create({
                type: record.Type.INVOICE,
                isDynamic: true
            });

            for (key in options.invoice)
            {
                if (!Array.isArray(options.invoice[key]))
                {
                    //Set body fields
                    invoice.setValue({
                        fieldId: key,
                        value: options.invoice[key]
//						,ignoreFieldChange: true
                    });
                }
            }
            log.audit("vendoribll id 4", options.vendorbill.internalid);
            var line = {};
            line.line_sublistid = "expcost";
            line.line_fieldid = "doc";
            line.internalid = options.vendorbill.internalid;
           _selectLine(invoice, line);

            try {
                invoiceId = invoice.save();
                options.invoice.internalid = invoiceId; //store for future reference 

                message = 'Invoice ' + srsFunctions.getAnchor("invoice", invoiceId) + ' created.' + '<br>';
                success = true;
            } catch (e) {
                log.debug('createInvoice2', 'e: ' + JSON.stringify(e));
                message = 'Failed to create Invoice. Error: ' + e.message + '<br>';
            }
            return {
                "success": success,
                "invoiceId": invoiceId,
                "message": message
            };
        }
		function callCreatePayment(options)
        {
            var result = {};
            var funcName = "callCreatePayment";
            //accept payment
            try {
            	options.customerpayment = {};
                options.customerpayment.customer = options.clientfund.custrecord_crf_trk_deal;
                options.customerpayment.currency = options.clientfund.custrecord_crf_trk_currency;
                	
                options.customerpayment.aracct = srsConstants.ACCOUNT.AR_DUE_FROM_CLIENT_CASH;
                options.customerpayment.account = options.clientfund.custrecord_crf_trk_pay_from_acc;

                options.customerpayment.trandate = new Date(options.clientfund.custrecord_crf_trk_date);

                options.customerpayment.memo = options.clientfund.custrecord_crf_trk_memo;
                options.customerpayment.department = srsConstants.DEPT.CLIENT_ACCOUNT_SRS;
                options.customerpayment.class = srsConstants.CLASS.CLIENT_ACCOUNTS_SRS;
                options.customerpayment.custbodyacq_deal_link = options.clientfund.custrecord_crf_trk_deal;
                
                log.audit("customerpayment options ", JSON.stringify(options));

                result = createPayment(options);
                log.debug(funcName, "result: " + JSON.stringify(result));

                options.all_messages += result.message;
                var fundActivityUpdates = {};
                
                if (result.success)
                {
                    priMessage.prepareMessage("Completed", options.all_messages, priMessage.TYPE.CONFIRMATION);
                    fundActivityUpdates.custrecord_crf_trk_status = srsConstants["Client Fund Release Status"]["Completed"];
                	fundActivityUpdates.custrecord_crf_trk_deposit_appl = result.depositapp_ids;
                }
                else
                {
                    priMessage.prepareMessage('FAILED', options.all_messages, priMessage.TYPE.WARNING);
                    fundActivityUpdates.custrecord_crf_trk_status = srsConstants["Client Fund Release Status"]["Failed"];
                }
                fundActivityUpdates.custrecord_crf_trk_activity = result.message;
                updateFundActivityFields(options.clientfund.internalid, fundActivityUpdates);
          	 

            } catch (e) {
                log.error(funcName, e);
                if (e.message)
                {
                    options.all_messages += e.message;
                    priMessage.prepareMessage("Error", e.message, priMessage.TYPE.ERROR);
                }
                else
                {
                    options.all_messages += e;
                    priMessage.prepareMessage("Error", e, priMessage.TYPE.ERROR);
                }
            }
            return result;
        }
		function createPayment(options) {
            log.debug('createPayment');

            var message = '';
            var success = false;
            var customerPaymentId = null;
            var key = null;
            var depositapp_ids = [];
            var i = 0;
            
            var customerpayment = record.transform({
                fromType : record.Type.INVOICE,
                fromId : options.invoice.internalid,
                toType : record.Type.CUSTOMER_PAYMENT,
                isDynamic : true
            });


            for (key in options.customerpayment)
            {
                if (!Array.isArray(options.customerpayment[key]))
                {
                    //Set body fields
                    customerpayment.setValue({
                        fieldId: key,
                        value: options.customerpayment[key]
//						,ignoreFieldChange: true
                    });
                }
            }
            //note deposit must be entered first due to bugs in netsuite code. 
            var line = {};
            line.line_sublistid = "deposit";
            line.line_fieldid = "doc";
            line.line_amount = options.clientfund.custrecord_crf_trk_amount;
            _selectDepositLine(customerpayment, line);

            //once deposits are entered, select hte invoice 
            line = {};
            line.line_sublistid = "apply";
            line.line_fieldid = "internalid";
            line.internalid = options.invoice.internalid;
            _selectLine(customerpayment, line);
            
            

            try {
                customerPaymentId = customerpayment.save();
                log.audit("customerPaymentId " + customerPaymentId);
                
                var depositapplicationSearchObj = search.create({
                	   type: "depositapplication",
                	   filters:
                	   [
                	      ["type","anyof","DepAppl"], 
                	      "AND", 
                	      ["appliedtotransaction.internalidnumber","equalto",options.invoice.internalid]
                	   ],
                	   columns:
                	   [
                	      search.createColumn({name: "transactionnumber", label: "Transaction Number"}),
                	      search.createColumn({name: "transactionname", label: "Transaction Name"})                	                      	   
                	   ]
                	});
                	//expecting exactly one, with invoice that was just created.
                	var searchResults = depositapplicationSearchObj.run().getRange(0, 1000);
               		//CHECK TO SEE IF THERE ARE ANY RESULTS
                	var transactionname = "";
                	log.audit("searchResults", JSON.stringify(searchResults));
               		if (searchResults && searchResults.length>0)
					{
               			for(i=0; i<searchResults.length; i+=1)
                        {
               				//log.audit("result ", JSON.stringify(searchResults[i]));
               				transactionname = searchResults[i].getValue("transactionname");
               				depositapp_ids.push(searchResults[i].id);
               				message += 'Deposit Application ' + srsFunctions.getAnchor("depositapplication", searchResults[i].id) + ' created.\n<Br>';
//               				depositapp_ids += srsFunctions.getAnchor("depositapplication", searchResults[i].id, transactionname);
                        }
                	}
                	log.audit("depositapp_ids ", depositapp_ids);
                	success = true;
            } catch (e) {
                log.debug('createPayment', 'e: ' + JSON.stringify(e));
                message += 'Failed to create Deposit Application. Error: ' + e.message + '<br>';
            }
            return {
                "success": success,
                "depositapp_ids": depositapp_ids,
                "message": message
            };
        }


        return {
            callCreateVendorBill : callCreateVendorBill,
            callCreateVendorPayment: callCreateVendorPayment,
            callCreateInvoice : callCreateInvoice,
            callCreatePayment  : callCreatePayment,
            updateFundActivityFields : updateFundActivityFields
        };
    });