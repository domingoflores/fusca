/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 *
 * This suitelet is a container for a collection of Deal Escrow related server side functions
 * which can be called from a client and specified with the action parameter.
 */
define(['N/record', 'N/runtime', 'N/search', 'N/url'
        ,'/.bundle/132118/PRI_ShowMessageInUI'
        ,'/SuiteScripts/Pristine/libraries/dealEscrowLibrary.js'
        ,'/.bundle/132118/PRI_AS_Engine'
        ,'/SuiteScripts/Prolecto/Shared/SRS_Constants'
    ],

    function(record, runtime, search, url, priMessage, dealEscrowLib, appSettings, srsConstants) {

        var scriptName = "dealEscrowUtilitiesSL.js";

        function onRequest(context) {
            var funcName = scriptName + ".onRequest ";
            log.debug(funcName, "Starting: " + JSON.stringify(context.request.parameters));
            var action = context.request.parameters.action || "";
            var parmDealEscrowId = context.request.parameters.dealEscrowId;
            var result = {};
            var options = {};

            var objAppSettings = appSettings.createAppSettingsObject("Acquiom Escrow Agent");
            log.debug(funcName, "objAppSettings: " + JSON.stringify(objAppSettings));

            log.audit("action ", action);
            try
            {
                switch (action.toLowerCase())
                {
                    case "createglaccount":
                        try
                        {
                            result = createGLAccount(parmDealEscrowId, objAppSettings);
                            log.debug(funcName, "result: " + JSON.stringify(result));
                            if (result.success)
                            {
                                priMessage.prepareMessage("Completed", result.message, priMessage.TYPE.CONFIRMATION);
                            } else {
                                priMessage.prepareMessage('FAILED', result.message, priMessage.TYPE.WARNING);
                            }

                        } catch (e) {
                            log.error(funcName, e);
                            if (e.message)
                            {
                                priMessage.prepareMessage("Error", e.message, priMessage.TYPE.ERROR);
                            }
                            else
                            {
                                priMessage.prepareMessage("Error", e, priMessage.TYPE.ERROR);
                            }
                        }
                        break;

                    case "createinvoice":
                        try {
                            result = createInvoice(parmDealEscrowId, objAppSettings);
                            log.debug(funcName, "result: " + JSON.stringify(result));
                            if (result.success) {
                                priMessage.prepareMessage("Completed", result.message, priMessage.TYPE.CONFIRMATION);
                            } else {
                                priMessage.prepareMessage('FAILED', result.message, priMessage.TYPE.WARNING);
                            }

                        } catch (e) {
                            log.error(funcName, e);
                            if (e.message)
                            {
                                priMessage.prepareMessage("Error", e.message, priMessage.TYPE.ERROR);
                            }
                            else
                            {
                                priMessage.prepareMessage("Error", e, priMessage.TYPE.ERROR);
                            }
                        }
                        break;
                    case "receivefees":
                        options.dealescrow = {};
                        options.dealescrow.internalid = parmDealEscrowId;
                        options.dealescrow = getDealEscrowFields(options);

                        options.all_messages = "";

                        options.customerpayment = {};
                        options.invoice = {};
                        options.vendorbill = {};
                        options.vendorpayment = {};


                        result = callCreateInvoice(options);

                        if (!result.success)
                        {
                            return;
                        }

                        result = callCreatePayment(options);
                        if (!result.success)
                        {
                            return;
                        }

                        result = callCreateVendorBill(options);
                        if (!result.success)
                        {
                            return;
                        }

                        result = callCreateVendorPayment(options);
                        if (!result.success)
                        {
                            return;
                        }

                        result = callCreateCorporateInvoice(options);
                        if (!result.success)
                        {
                            return;
                        }

                        break;

                    default:
                        log.error(funcName, "action was not handled.");
                } // CASE


            } catch (e) {
                log.error(funcName, e);
            }

        } //function onRequest

        function callCreateCorporateInvoice(options)
        {
            var result = {};
            var funcName = "callCreateCorporateInvoice";
            //create corporate invoice
            try {

                options.invoice = {};
                options.invoice.customform = srsConstants.CUSTOM_FORMS.SRS_INVOICE;
                options.invoice.entity = options.dealescrow.dealId;
                options.invoice.trandate = new Date();
                var customerFields = getCustomerFields(options);
                options.invoice.memo = "Escrow Agent Fee - Close Date " + customerFields.closingdate;
                options.invoice.custbodyacq_deal_link = options.dealescrow.dealId;
                options.invoice.currency = options.dealescrow.deCurrency;
                options.invoice.department = srsConstants.DEPT.ACQUIOM;
                options.invoice.class = srsConstants.CLASS.ACQUIOM_CLEARINGHOUSE_LLC;
                options.invoice.account = srsConstants.ACCOUNT.CORPORATE_ACCOUNTS_RECEIVABLE_NEW;
                options.invoice.custbody_deal_escrow = options.dealescrow.internalid;
                options.invoice.items = [];
                var item = {};
                item.item = srsConstants.ITEM.ESCROW_AGENT_ANNUAL_FEE;
                item.quantity = 1;
                item.amount = options.dealescrow.amount;
                options.invoice.items.push(item);



                result = createInvoice2(options);
                options.all_messages += result.message;
                log.debug(funcName, "result: " + JSON.stringify(result));
                if (result.success) {
                    priMessage.prepareMessage("Completed", options.all_messages, priMessage.TYPE.CONFIRMATION);
                } else {
                    priMessage.prepareMessage('FAILED', options.all_messages, priMessage.TYPE.WARNING);
                }


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


        function callCreateVendorPayment(options)
        {
            var result = {};
            var funcName = "callCreateVendorPayment";
            //create vendor Payment
            try {

                options.vendorpayment.toach = false;
                options.vendorpayment.account = options.customerpayment.account;
                options.vendorpayment.entity = srsConstants.VENDOR.ACQUIOM_CLEARINGHOUSE_LLC;
                options.vendorpayment.amount = options.dealescrow.fee;
                options.vendorpayment.currency = options.dealescrow.deCurrency;
                options.vendorpayment.trandate = new Date();
                options.vendorpayment.tranid = "";
                options.vendorpayment.memo = "Payment of Escrow Fees";
                options.vendorpayment.department = srsConstants.DEPT.ACQUIOM_ESCROW_AGENT;
                options.vendorpayment.class = srsConstants.CLASS.ACQUIOM_ESCROW_AGENT;
                options.vendorpayment.custbodyacq_deal_link = options.dealescrow.dealId;
                options.vendorpayment.custbody_deal_escrow = options.dealescrow.internalid;

                log.audit("vendorpayment options ", JSON.stringify(options));

                result = createVendorPayment(options);
                log.debug(funcName, "result: " + JSON.stringify(result));

                options.all_messages += result.message;
                if (result.success)
                {
                    priMessage.prepareMessage("Completed", options.all_messages, priMessage.TYPE.CONFIRMATION);
                }
                else
                {
                    priMessage.prepareMessage('FAILED', options.all_messages, priMessage.TYPE.WARNING);
                }

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

        function callCreateVendorBill(options)
        {
            var result = {};
            var funcName = "callCreateVendorBill";
            //create vendor bill
            try {

                options.vendorbill.customform = srsConstants.CUSTOM_FORMS.ACQUIOM_VENDOR_BILL;
                options.vendorbill.entity = srsConstants.VENDOR.ACQUIOM_CLEARINGHOUSE_LLC;
                options.vendorbill.account = srsConstants.ACCOUNT.ACQUIOM_ESCROW_AGENT_AP;
                options.vendorbill.usertotal = options.dealescrow.fee;
                options.vendorbill.currency = options.dealescrow.deCurrency;
                options.vendorbill.trandate = new Date();
                options.vendorbill.memo = "Payment of Escrow Fees";
                options.vendorbill.department = srsConstants.DEPT.ACQUIOM_ESCROW_AGENT;
                options.vendorbill.approvalstatus = srsConstants.VENDOR_BILL_STATUS.APPROVED;
                options.vendorbill.class = srsConstants.CLASS.ACQUIOM_ESCROW_AGENT;
                options.vendorbill.custbodyacq_deal_link = options.dealescrow.dealId;
                options.vendorbill.custbody_deal_escrow = options.dealescrow.internalid;

                options.vendorbill.expenses = [];

                var expense = {};
                expense.category = srsConstants.EXPENSE_CATEGORY.ACQUIOM_ESCROW_AGENT_FEE;
                expense.account = srsConstants.ACCOUNT.ACQUIOM_ESCROW_AGENT_DR;
                expense.amount = options.dealescrow.fee;
                expense.memo = "Payment of Escrow Fees";
                expense.department = srsConstants.DEPT.ACQUIOM_ESCROW_AGENT;
                expense.customer = options.dealescrow.dealId;

                options.vendorbill.expenses.push(expense);

                log.audit("vendorbill options ", JSON.stringify(options));

                result = createVendorBill(options);
                log.debug(funcName, "result: " + JSON.stringify(result));
                options.vendorbill.internalid = result.vendorBillId;
                options.all_messages += result.message;
                if (result.success)
                {
                    priMessage.prepareMessage("Completed", options.all_messages, priMessage.TYPE.CONFIRMATION);
                }
                else
                {
                    priMessage.prepareMessage('FAILED', options.all_messages, priMessage.TYPE.WARNING);
                }

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

        function callCreatePayment(options)
        {
            var result = {};
            var funcName = "callCreatePayment";
            //accept payment
            try {

                options.customerpayment.customer = options.dealescrow.dealId;
                options.customerpayment.aracct = srsConstants.ACCOUNT.ACQUIOM_ESCROW_AGENT_AR;
                options.customerpayment.account = getDealEscrowAccount(options);

                options.customerpayment.trandate = new Date();

                options.customerpayment.amount = options.dealescrow.fee; //store payment amount

                options.customerpayment.memo = "Deposit of Escrow Fees";
                options.customerpayment.department = srsConstants.DEPT.ACQUIOM_ESCROW_AGENT;
                options.customerpayment.class =  srsConstants.CLASS.ACQUIOM_ESCROW_AGENT;
                options.customerpayment.custbodyacq_deal_link = options.dealescrow.dealId;
                options.customerpayment.custbody_deal_escrow = options.dealescrow.internalid;

                log.audit("customerpayment options ", JSON.stringify(options));

                result = createPayment(options);
                log.debug(funcName, "result: " + JSON.stringify(result));

                options.all_messages += result.message;
                if (result.success)
                {
                    priMessage.prepareMessage("Completed", options.all_messages, priMessage.TYPE.CONFIRMATION);
                }
                else
                {
                    priMessage.prepareMessage('FAILED', options.all_messages, priMessage.TYPE.WARNING);
                }

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

        function callCreateInvoice(options)
        {
            var result = {};
            var funcName = "callCreateInvoice";
            //create invoice receive fees
            try {

                options.invoice.customform = srsConstants.CUSTOM_FORMS.ACQUIOM_INVOICE;
                options.invoice.entity = options.dealescrow.dealId;
                options.invoice.trandate = new Date();
                options.invoice.memo = "Deposit of Escrow Fees";
                options.invoice.custbodyacq_deal_link = options.dealescrow.dealId;
                options.invoice.custbody_deal_escrow = options.dealescrow.internalid;
                options.invoice.currency = options.dealescrow.deCurrency;
                options.invoice.department = srsConstants.DEPT.ACQUIOM_ESCROW_AGENT;
                options.invoice.class = srsConstants.CLASS.ACQUIOM_ESCROW_AGENT;
                options.invoice.account = srsConstants.ACCOUNT.ACQUIOM_ESCROW_AGENT_AR;

                options.invoice.items = [];
                var item = {};
                item.item = srsConstants.ITEM.OPS_AEA_FEE_RECEIVED;
                item.quantity = 1;
                item.amount = options.dealescrow.amount;
                options.invoice.items.push(item);



                result = createInvoice2(options);
                options.all_messages += result.message;
                log.debug(funcName, "result: " + JSON.stringify(result));
                if (result.success) {
                    priMessage.prepareMessage("Completed", options.all_messages, priMessage.TYPE.CONFIRMATION);
                } else {
                    priMessage.prepareMessage('FAILED', options.all_messages, priMessage.TYPE.WARNING);
                }

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



        function createGLAccount(dealEscrowId, objAppSettings) {
            log.debug('createGLAccount');
            var deFieldValues = search.lookupFields({
                type: 'customrecord_deal_escrow',
                id: dealEscrowId,
                columns: ['custrecord_de_deal', 'custrecord_de_escrow_type', 'custrecord_de_currency', 'custrecord_de_bank', 'custrecord_de_bank_account_name']
            });
            // log.debug('createGLAccount', 'deFieldValues: ' + JSON.stringify(deFieldValues));

            var message = '';
            var success = false;
            var accountId = null;
            var dealId = Number(deFieldValues.custrecord_de_deal[0].value);
            var dealName = deFieldValues.custrecord_de_deal[0].text;
            var escrowTypeId = deFieldValues.custrecord_de_escrow_type[0].value;
            var escrowType = deFieldValues.custrecord_de_escrow_type[0].text;
            var deCurrency = deFieldValues.custrecord_de_currency[0].value;
            var deBankId = deFieldValues.custrecord_de_bank[0].value;

            // Derive Account Name
            var accountName = dealEscrowLib.deriveBankAccountName(dealEscrowId, deFieldValues);
            // Derive Account Number
            var nextGLAccountNbr = dealEscrowLib.deriveBankAccountNbr(dealEscrowId);

            // Create Account
            var account = record.create({
                type: record.Type.ACCOUNT,
                isDynamic: true
            });
            account.setValue({
                fieldId: 'acctnumber',
                value: nextGLAccountNbr.toString()
            });
            account.setValue({
                fieldId: 'acctname',
                value: accountName
            });
            account.setValue({
                fieldId: 'parent',
                value: objAppSettings.settings["AEA Parent Bank Account ID"] // Acquiom Escrow Agent 20000
            });
            account.setValue({
                fieldId: 'accttype',
                value: 'Bank'
            });
            account.setValue({
                fieldId: 'currency',
                value: deCurrency
            });
            account.setValue({
                fieldId: 'description',
                value: objAppSettings.settings['AEA Bank Account Description']
                // value: 'Acquiom Escrow Agent'
            });
            account.setValue({
                fieldId: 'custrecord_gl_account_bank_name',
                value: deBankId
                // value: 82575 // Citizens Bank (Vendor) 
            });
            account.setValue({
                fieldId: 'custrecordglreportinggroup2',
                value: objAppSettings.settings['AEA Bank Account GL Reporting Group']
                // value: 1 // General Escrow (GL Reporting Groups Custom List) 
            });
            account.setValue({
                fieldId: 'custrecord_escrow_account_type',
                value: escrowTypeId
            });
            account.setValue({
                fieldId: 'custrecord_acq_escrow_description',
                value: objAppSettings.settings['AEA Bank Account Acquiom Escrow Description']
                // value: 6 // Acquiom Escrow Agent (Acquiom Escrow Description Custom List) 
            });
            account.setValue({
                fieldId: 'custrecord_deal_name',
                value: dealId
            });
            account.setValue({
                fieldId: 'custrecord_acq_deal_link',
                value: dealId
            });
            account.setValue({
                fieldId: 'custrecord_deal_escrow',
                value: dealEscrowId
            });
            account.setValue({
                fieldId: 'custrecord_bank_statement_deliverymethod',
                value: objAppSettings.settings['AEA Bank Account Bank Statement Delivery Method']
                // value: 2 // Email (Bank Statement Delivery Method Custom List)  
            });
            account.setValue({
                fieldId: 'custrecord_bank_branch_domestic',
                // value: objAppSettings.settings['AEA Bank Account Is US Based']
                value: 1 // Yes (Yes/No Custom List)  
            });
            account.setValue({
                fieldId: 'custrecord120', // Online Acccount Access
                // value: objAppSettings.settings['AEA Bank Account Online Access']
                value: 1 // Yes (Yes/No Custom List)  
            });

            try {
                accountId = account.save();
                message += 'Created Account #' + nextGLAccountNbr + ' ' + accountName + '.<br>';
                success = true;
            } catch (e) {
                log.debug('createGLAccount', 'e: ' + JSON.stringify(e));
                message += 'Failed to create Account for Deal Escrow.<br>';

                if (e.message.search('The account name you have chosen is already used') > -1) {
                    message += 'The account name you have chosen, ' + accountName + ', is already used.<br>';
                    message += 'Please change the Bank Account Name on the Deal Escrow and retry.<br>';
                } else {
                    message += e.message + '.<br>';
                }

            }
            return {
                "success": success,
                "accountId": accountId,
                "accountNbr": nextGLAccountNbr,
                "message": message
            };
        }

        function createInvoice(dealEscrowId, objAppSettings) {
            log.debug('createInvoice');
            var deFieldValues = search.lookupFields({
                type: 'customrecord_deal_escrow',
                id: dealEscrowId,
                columns: ['custrecord_de_deal', 'custrecord_de_expected_balance', 'custrecord_de_currency']
            });
            log.debug('createInvoice', 'deFieldValues: ' + JSON.stringify(deFieldValues));

            var message = '';
            var success = false;
            var invoiceId = null;

            var dealId = Number(deFieldValues.custrecord_de_deal[0].value);
            log.debug('createInvoice', 'dealId: ' + JSON.stringify(dealId));
            var amount = Number(deFieldValues.custrecord_de_expected_balance);
            log.debug('createInvoice', 'amount: ' + JSON.stringify(amount));
            var deCurrency = deFieldValues.custrecord_de_currency[0].value;
            log.debug('createInvoice', 'deCurrency: ' + JSON.stringify(deCurrency));
            var deCurrencyName = deFieldValues.custrecord_de_currency[0].text;
            log.debug('createInvoice', 'deCurrencyName: ' + JSON.stringify(deCurrencyName));
            // // Create invoice
            var invoice = record.create({
                type: record.Type.INVOICE,
                isDynamic: true
            });

            // //Set body fields
            invoice.setValue({
                fieldId: 'customform',
                value: objAppSettings.settings["AEA Deposit Invoice Custom Form"]
                // value: 137 // Acquiom Invoice
            });

            invoice.setValue({
                fieldId: 'entity',
                value: dealId
            });
            // This may not work if the Customer has not had the currency assigned yet
            try {
                invoice.setValue({
                    fieldId: 'currency',
                    value: deCurrency // From Deal Escrow Currency
                });
            } catch (e) {
                log.debug('createInvoice', 'e: ' + JSON.stringify(e));
                message += 'Failed to create Invoice for Deal Escrow deposit.<br>';
                message += 'Please add currency ' + deCurrencyName + ' to Deal currencies list.<br>';
                message += e.message;
                return {
                    "success": false,
                    "invoiceId": '',
                    "message": message
                };
            }

            invoice.setValue({
                fieldId: 'class',
                value: objAppSettings.settings["AEA Entity (Class)"]
                // value: 127 // Acquiom Escrow Agent
            });

            invoice.setValue({
                fieldId: 'department',
                value: objAppSettings.settings["AEA Department"]
                // value: 40 // Acquiom Escrow Agent
            });

            invoice.setValue({
                fieldId: 'custbodyacq_deal_link',
                value: dealId
            });

            invoice.setValue({
                fieldId: 'custbody_deal_escrow',
                value: dealEscrowId
            });

            invoice.setValue({
                fieldId: 'memo',
                value: 'Escrow Deposit'
            });

            //Set item line fields 
            invoice.selectNewLine('item');
            invoice.setCurrentSublistValue('item', 'item', objAppSettings.settings["AEA Item Acquiom Escrow Agent Deposit"]); // Acquiom Escrow Agent Deposit
            invoice.setCurrentSublistValue('item', 'quantity', 1);
            invoice.setCurrentSublistValue('item', 'amount', amount);
            invoice.setCurrentSublistValue('item', 'department', objAppSettings.settings["AEA Department"]);
            invoice.commitLine('item');

            try {
                invoiceId = invoice.save();
                message += 'Created Invoice #' + invoiceId + ' for Deal Escrow deposit' + ';<br>';
                success = true;
            } catch (e) {
                log.debug('createInvoice', 'e: ' + JSON.stringify(e));
                message += 'Failed to create Invoice for Deal Escrow deposit. Error: ' + e.message + ';<br>';
            }
            return {
                "success": success,
                "invoiceId": invoiceId,
                "message": message
            };
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

            var items = options.invoice.items;
            var item = {};
            for(i=0; i<items.length; i+=1)
            {
                item = items[i];
                invoice.selectNewLine('item');
                for (key in item)
                {
                    invoice.setCurrentSublistValue('item', key, item[key]);
                }
                invoice.commitLine('item');
            }

            try {
                invoiceId = invoice.save();
                options.invoice.internalid = invoiceId; //store for future reference 

                message = 'Invoice ' + getAnchor("invoice", invoiceId) + ' created.' + '<br>';
                success = true;
            } catch (e) {
                log.debug('createInvoice2', 'e: ' + JSON.stringify(e));
                message = 'Failed to create Invoice for Deal Escrow Fee. Error: ' + e.message + '<br>';
            }
            return {
                "success": success,
                "invoiceId": invoiceId,
                "message": message
            };
        }
        function getAnchor(recordtype, internalid)
        {
            var link = url.resolveRecord({
                recordType: recordtype,
                recordId: internalid,
                isEditMode: false
            });
            link = "<a href=\""+link+"\" target=\"_blank\">"+internalid+"</a></td>";
            return link;
        }
        function _selectLine(currentRecord, options)
        {
            var i = 0;
            var invoiceid = "";
            var amountdue = 0;
            var linepayment = 0;
            var lineid = "";
            var Transaction_CLASS = "";
//			var Transaction_TYPE = "";
            var due = 0;

            var itemcount = currentRecord.getLineCount(
                {
                    sublistId : options.sublistid
                });

            log.audit("invoicecount ", itemcount);


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
                invoiceid = currentRecord.getSublistValue({
                    sublistId : options.sublistid,
                    fieldId : "internalid",
                    line : i
                });

                lineid = currentRecord.getSublistValue(
                    {
                        sublistId: options.sublistid,
                        fieldId: "line",
                        line : i
                    });

                //console.log(invoiceid + ",  " + invoice)
                if (parseInt(invoiceid,10) === parseInt(options.invoice.internalid,10))
                {
                    currentRecord.selectLine({
                        sublistId: options.sublistid,
                        line: i
                    });
                    log.audit("line found");
                    currentRecord.setCurrentSublistValue(
                        {
                            sublistId: options.sublistid,
                            value: true,
                            fieldId: "apply"
                        });


                    currentRecord.setCurrentSublistValue(
                        {
                            sublistId: options.sublistid,
                            value: options.customerpayment.amount,
                            fieldId: "amount"
                        });
                    currentRecord.commitLine({sublistId:options.sublistid});

                }
            }
            //return retValue;
        }
        function createPayment(options) {
            log.debug('createPayment');

            var message = '';
            var success = false;
            var customerPaymentId = null;
            var key = null;

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

            options.sublistid = "apply";

            _selectLine(customerpayment, options);


            try {
                customerPaymentId = customerpayment.save();
                message += 'Customer Payment ' + getAnchor("customerpayment", customerPaymentId) + ' created.' + '<br>';
                success = true;
            } catch (e) {
                log.debug('createPayment', 'e: ' + JSON.stringify(e));
                message += 'Failed to create Customer Payment for Deal Escrow Fee. Error: ' + e.message + '<br>';
            }
            return {
                "success": success,
                "invoiceId": customerPaymentId,
                "message": message
            };
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


            try {
                vendorBillId = vendorBill.save();
                message += 'Vendor Bill ' + getAnchor("vendorbill", vendorBillId) + ' created.' + '<br>';
                success = true;
            } catch (e) {
                log.error('createVendorBill', 'e: ' + JSON.stringify(e));
                message += 'Failed to create Vendor Bill. Error: ' + e.message + ';<br>';

            }

            return {
                "success": success,
                "vendorBillId": vendorBillId,
                "message": message
            };

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
                    value: options.vendorpayment[key],
                    ignoreFieldChange: true
                });
            }

//			var csvFile = file.create({
//	            name: "vendorpayment.json.txt",
//	            contents: JSON.stringify(vendorpayment),			//write header row 
//	            folder: 164942, 
//	            fileType: file.Type.PLAINTEXT
//	        });
//			csvFile.save();



            try {
                vendorPaymentId = vendorpayment.save();
                message += 'Vendor Payment ' + getAnchor("vendorpayment", vendorPaymentId) + ' created.' + '<br>';
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

        function getDealEscrowAccount(options)
        {
            if (!(options.dealescrow && options.dealescrow.internalid))
            {
                throw "Could not find Deal Escrow Internal ID";
            }
            log.audit("getDealEscrowAccount EscrowId", options.dealescrow.internalid);
            //we may not need account id lookup
            var accountId = "";
            var accountSearchObj = search.create({
                type: "account",
                filters:
                    [
                        ["isinactive","is","F"]
                        ,"AND", ["custrecord_deal_escrow","anyof",options.dealescrow.internalid]
                    ],
                columns:
                    [
                        search.createColumn({name: "internalid", label: "Internal ID"})
                    ]
            });

            var runSearch = accountSearchObj.run();
            var SearchResults = runSearch.getRange(0,1);
            log.audit("getDealEscrowAccount found GL Accounts ", SearchResults.length);
            if (SearchResults && SearchResults.length === 1)
            {
                //there is exactly 1 GL Account expected for each Deal Escrow.
                accountId = SearchResults[0].getValue("internalid");
                log.audit("accountId ", accountId);
            }
            else
            {
                throw "GL Account not found. ";
            }
            return accountId;
        }
        function getDealEscrowFields(options)
        {
            var retValue = {};
            var deFieldValues = search.lookupFields({
                type: 'customrecord_deal_escrow',
                id: options.dealescrow.internalid,
                columns: ['custrecord_de_deal', 'custrecord_de_expected_balance', 'custrecord_de_currency', 'custrecord_de_fee_amount']
            });
            log.debug('getDealEscrowFields', 'deFieldValues: ' + JSON.stringify(deFieldValues));

            retValue.dealId = Number(deFieldValues.custrecord_de_deal[0].value);
            log.debug('getDealEscrowFields', 'dealId: ' + JSON.stringify(retValue.dealId));

            retValue.amount = Number(deFieldValues.custrecord_de_fee_amount);
            log.debug('getDealEscrowFields', 'amount: ' + JSON.stringify(retValue.amount));

            retValue.deCurrency = deFieldValues.custrecord_de_currency[0].value;
            log.debug('getDealEscrowFields', 'deCurrency: ' + JSON.stringify(retValue.deCurrency));

            retValue.deCurrencyName = deFieldValues.custrecord_de_currency[0].text;
            log.debug('getDealEscrowFields', 'deCurrencyName: ' + JSON.stringify(retValue.deCurrencyName));

            retValue.fee = deFieldValues.custrecord_de_fee_amount;
            log.debug('getDealEscrowFields', 'fee: ' + JSON.stringify(retValue.fee));

            retValue.internalid = options.dealescrow.internalid; //since we will owerrite deal escrow object, preserve its' internal id  

            return retValue;
        }

        function getCustomerFields(options)
        {
            log.debug('getCustomerFields', "starting");
            log.debug('getCustomerFields', 'options.dealescrow.dealId: ' + options.dealescrow.dealId);
            var retValue = {};
            var custFields = search.lookupFields({type: record.Type.CUSTOMER,
                id: options.dealescrow.dealId, columns: ["custentity8"]});

            log.debug('getCustomerFields', JSON.stringify(custFields));

            retValue.closingdate = custFields.custentity8||"";
            log.debug('getCustomerFields', 'closing date: ' + JSON.stringify(retValue.closingdate));

            return retValue;
        }


        return {
            onRequest: onRequest
        };
    });
