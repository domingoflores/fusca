function VendorBillACH(type)
	{
		nlapiLogExecution('DEBUG','type','type : '+type);
		
		if((type == 'paybills') || (type == 'create'))
		{
			
			var netledgerid = nlapiEscapeXML(nlapiGetContext().getSetting('SCRIPT', 'custscript_upaya_netledgerid'));
			var coastalid = nlapiEscapeXML(nlapiGetContext().getSetting('SCRIPT', 'custscript_upaya_coastalid'));
			var federalid = nlapiEscapeXML(nlapiGetContext().getSetting('SCRIPT', 'custscript_upaya_federalid'));
			var name = nlapiEscapeXML(nlapiGetContext().getSetting('SCRIPT', 'custscript_upaya_name'));
			var address1 = nlapiEscapeXML(nlapiGetContext().getSetting('SCRIPT', 'custscript_upaya_add1'));
			var address2 = nlapiEscapeXML(nlapiGetContext().getSetting('SCRIPT', 'custscript_upaya_add2'));
			var cityScript = nlapiEscapeXML(nlapiGetContext().getSetting('SCRIPT', 'custscript_upaya_city'));
			var stateScript = nlapiEscapeXML(nlapiGetContext().getSetting('SCRIPT', 'custscript_upaya_state'));
			var postalcode = nlapiEscapeXML(nlapiGetContext().getSetting('SCRIPT', 'custscript_upaya_postal_code'));
			var countrycode = nlapiEscapeXML(nlapiGetContext().getSetting('SCRIPT', 'custscript_upaya_countrycode'));
			var telephone = nlapiEscapeXML(nlapiGetContext().getSetting('SCRIPT', 'custscript_upaya_telephone'));
			nlapiLogExecution('DEBUG','accountid',' securekey '+securekey+' netledgerid '+netledgerid+' coastalid '+coastalid+' federalid '+federalid+' name '+name+' address1 '+address1+' address2 '+address2+' cityScript '+cityScript+' stateScript '+stateScript+' postalcode '+postalcode+' countrycode '+countrycode+' telephone '+telephone);	
			var usadd1 = nlapiEscapeXML(nlapiGetContext().getSetting('SCRIPT', 'custscript_usa_address1'));
			var usadd2 = nlapiEscapeXML(nlapiGetContext().getSetting('SCRIPT', 'custscript_usa_address2'));
			var uscity = nlapiEscapeXML(nlapiGetContext().getSetting('SCRIPT', 'custscript_usa_city'));
			var usstate = nlapiEscapeXML(nlapiGetContext().getSetting('SCRIPT', 'custscript_usa_state'));
			var uszip = nlapiEscapeXML(nlapiGetContext().getSetting('SCRIPT', 'custscript_usa_zipcode'));
			var foradd1 = nlapiEscapeXML(nlapiGetContext().getSetting('SCRIPT', 'custscript_foreign_add1'));
			var foradd2 = nlapiEscapeXML(nlapiGetContext().getSetting('SCRIPT', 'custscript_foreign_add2'));
			var forcity = nlapiEscapeXML(nlapiGetContext().getSetting('SCRIPT', 'custscript_foreign_city'));
			var forregion = nlapiEscapeXML(nlapiGetContext().getSetting('SCRIPT', 'custscript_foreign_region'));
			var forcountry = nlapiEscapeXML(nlapiGetContext().getSetting('SCRIPT', 'custscript_foreign_country'));
			var forpostal = nlapiEscapeXML(nlapiGetContext().getSetting('SCRIPT', 'custscript_foreign_postalcode'));
			nlapiLogExecution('DEBUG','usadd1','usadd1 : '+usadd1+' usadd2 '+usadd2+' uscity '+uscity+' usstate '+usstate+' uszip '+uszip+' foradd1 '+foradd1+' foradd2 '+foradd2+' forcity '+forcity+' forregion '+forregion+' forcountry '+forcountry+' forpostal '+forpostal);	
		//--------------------------- end of script parameter ------------------------------------
			//--------------- if ACH is not available then script will not run ----------- 
			var accessType = nlapiGetContext().getSetting('SCRIPT', 'custscript_access_type');
			if((!accessType) || (accessType == 2))
			{
				nlapiLogExecution('AUDIT','Can not process ','Can not process - ACH integration is not allowed');
				return false;
			}
			//-------------------------- end of ACH Availability --------------------------
			var currentRecord = nlapiGetNewRecord();
			var recordId = currentRecord.getId();
			nlapiLogExecution('DEBUG','recordId','recordId : '+recordId);
			
			var recordType = currentRecord.getRecordType();
			nlapiLogExecution('DEBUG','@@@@@@@@@@recordId','recordType:'+recordType);
			var newrec =  nlapiLoadRecord(recordType, recordId); 
			var paymentMethod = newrec.getFieldValue('paymentmethod');
			nlapiLogExecution('DEBUG','#########paymentMethod:'+paymentMethod);
			
			//----------------for company's Bank Information -------------
			var undepfunds = newrec.getFieldValue('undepfunds');
			if(undepfunds == 'T')
			{
				nlapiLogExecution('ERROR', 'Please Choose an Account', 'Please Choose an Account : ' );
				return false;
			}
			var accountRecord = '';
			var companyBankName = '';
			var companyRoutingNumber = '';
			var companyAccountNumber = '';
			var companyAccountType = '';
			var accountid = '';
			var securekey = '';
			var accountInfo = newrec.getFieldValue('account');
			nlapiLogExecution('DEBUG','accountInfo','accountInfo : '+accountInfo+' undepfunds '+undepfunds);
			try
			{
				accountRecord = nlapiLoadRecord('account', accountInfo);
			
				companyBankName = nlapiEscapeXML(accountRecord.getFieldValue('custrecord_bank_name'));
				companyRoutingNumber = nlapiEscapeXML(accountRecord.getFieldValue('custrecord_bank_routing_number'));
				companyAccountNumber = nlapiEscapeXML(accountRecord.getFieldValue('custrecord_bank_acc_number'));
				companyAccountType = nlapiEscapeXML(accountRecord.getFieldValue('custrecord_checking_account'));
				accountid = nlapiEscapeXML(accountRecord.getFieldValue('custrecord_upaya_account_id'));
				securekey = nlapiEscapeXML(accountRecord.getFieldValue('custrecord_upaya_securekey'));
				nlapiLogExecution('DEBUG','accountid','accountid : '+accountid+' securekey '+securekey);
				//------------- may be we have add secure key and id here ------------------------------
				if(companyAccountType == 'F')
				{
					companyAccountType = 'S';
				}
				else
				{
					companyAccountType = 'C';
				}
					nlapiLogExecution('DEBUG','companyBankName','companyBankName : '+companyBankName+' companyRoutingNumber '+companyRoutingNumber+' companyAccountNumber '+companyAccountNumber+' companyAccountType '+companyAccountType);
			}
			catch(e)
			{
				nlapiLogExecution('ERROR', 'Unable To Load Account', 'Unable To Load Account - Reason : ' + e.toString());
			}	
			// ---------------end of company's Bank information ----------
			
			var vendorPayee = newrec.getFieldValue('entity');
			nlapiLogExecution('DEBUG','vendorPayee','vendorPayee : '+vendorPayee);
			var userId = nlapiGetContext().getUser();					
			var checkNum = nlapiEscapeXML(newrec.getFieldValue('tranid'));
			var memo = nlapiEscapeXML(newrec.getFieldValue('memo'));
			var chargeDate = nlapiEscapeXML(newrec.getFieldValue('trandate'));
			var body = '';
			var total = nlapiEscapeXML(newrec.getFieldValue('total'));
			nlapiLogExecution('DEBUG','total','total : '+total);
			var tax = 0.00;     
			var shippingcost = 0.00; 
			var invoiceXml = '';
			var invoiceItemXml = '';
			previousVendorACH = 0;
			var billCount = newrec.getLineItemCount('apply');
			nlapiLogExecution('DEBUG','billCount','billCount : '+billCount);
			var totalInvoice = '';
			var totalPayment = '';
			var totalDate = '';
			if(billCount)
			{
				for(var len =1 ; len <= billCount; len++)
				{
					if(newrec.getLineItemValue('apply', 'apply', len) == 'T')
					{
						//var paymentDiscount = newrec.getLineItemValue('apply', 'disc', len);
						var paymentAmount = nlapiEscapeXML(newrec.getLineItemValue('apply', 'amount', len));
						nlapiLogExecution('DEBUG','paymentAmount',' paymentAmount '+paymentAmount);
						var internalIdBill = nlapiEscapeXML(newrec.getLineItemValue('apply', 'doc', len));
						totalInvoice = totalInvoice + ' ' + internalIdBill;
						totalPayment = totalPayment + ' ' + paymentAmount;
						try
						{
							var billRecord = nlapiLoadRecord('vendorbill', internalIdBill);
												
							var billTotal = nlapiEscapeXML(parseFloat(billRecord.getFieldValue('usertotal')));
							var billDiscount = nlapiEscapeXML(billRecord.getFieldValue('discountamount'));
							var billDate = billRecord.getFieldValue('duedate');
							totalDate = totalDate + ' ' + billDate;
							var vendorAchUsa = billRecord.getFieldValue('custbody_upaya_vendor_ach_usa');
							
							nlapiLogExecution('DEBUG','vendorAchUsa',' vendorAchUsa '+vendorAchUsa);
							if(previousVendorACH == 0)
							{
								previousVendorACH = vendorAchUsa;
							}
							else if(previousVendorACH != vendorAchUsa)
							{
								nlapiLogExecution('ERROR','Please Choose Same ACH in Bill',' Please Choose Same ACH in Bill ');
								alert("Please Choose Same ACH in Bill");
								return;
							}
							var billLineItem = billRecord.getLineItemCount('item');
							
							nlapiLogExecution('DEBUG','billLineItem','billLineItem : '+billLineItem);
							if(billLineItem)
							{
								for(var lineNo = 1; lineNo <= billLineItem; lineNo++)
								{
									var item = nlapiEscapeXML(billRecord.getLineItemValue('item', 'item', lineNo));
									var quantity = nlapiEscapeXML(billRecord.getLineItemValue('item', 'quantity', lineNo));
									var description = nlapiEscapeXML(billRecord.getLineItemValue('item', 'description', lineNo));
									var weightunit = nlapiEscapeXML(billRecord.getLineItemValue('item', 'weightunit', lineNo));
									//-------for expenses--------------------------
									
									//--------------end of expenses-------------------
									if(weightunit == '' || weightunit == null )
									{
										weightunit = 'EA'
									}
									var amount = nlapiEscapeXML(billRecord.getLineItemValue('item', 'amount', lineNo));
									nlapiLogExecution('DEBUG','item','item : '+item+' quantity '+quantity+' description '+description+' weightunit '+weightunit+' amount '+amount);
									invoiceItemXml = invoiceItemXml +
									'<lineitem>'+
										'<productid>'+parseEmptyString(item)+'</productid>'+
										'<productdesc>'+parseEmptyString(description)+'</productdesc>'+
										'<serviceid></serviceid>'+
										'<servicedesc></servicedesc>'+
										'<qty>'+parseEmptyString(quantity)+'</qty>'+
										'<unitofmeasure>'+parseEmptyString(weightunit)+'</unitofmeasure>'+
										'<itemamount>'+parseEmptyString(amount)+'</itemamount>'+
										'<taxamount></taxamount>'+
										'<extendeditemamount></extendeditemamount>'+
									'</lineitem>';
									
								}
								
							}
							var billLineExpense = billRecord.getLineItemCount('expense');
							nlapiLogExecution('DEBUG','billLineExpense','billLineExpense : '+billLineExpense);
							if(billLineExpense)
							{
								for(var lineNo1 = 1; lineNo1 <= billLineExpense; lineNo1++)
								{
									var categoryExp = nlapiEscapeXML(billRecord.getLineItemValue('expense', 'category', lineNo1));
									var categoryExpText = nlapiEscapeXML(billRecord.getLineItemText('expense', 'category', lineNo1));
									var amountExp = nlapiEscapeXML(billRecord.getLineItemValue('expense', 'amount', lineNo1));
									var accountExp = nlapiEscapeXML(billRecord.getLineItemText('expense', 'account', lineNo1));
									nlapiLogExecution('DEBUG','categoryExp','categoryExp : '+categoryExp+' amountExp '+amountExp+' accountExp '+accountExp+' categoryExpText '+categoryExpText);
									invoiceItemXml = invoiceItemXml +
									'<lineitem>'+
										'<productid></productid>'+
										'<productdesc></productdesc>'+
										'<serviceid>'+parseEmptyString(categoryExp)+'</serviceid>'+
										'<servicedesc>'+parseEmptyString(categoryExpText)+'</servicedesc>'+
										'<qty></qty>'+
										'<unitofmeasure></unitofmeasure>'+
										'<itemamount>'+parseEmptyString(amountExp)+'</itemamount>'+
										'<taxamount></taxamount>'+
										'<extendeditemamount></extendeditemamount>'+
									'</lineitem>';
								}
							}
							
							nlapiLogExecution('DEBUG','invoiceItemXml','invoiceItemXml : '+invoiceItemXml);
							invoiceXml = invoiceXml+
							'<invoice>'+
							'<invoiceid>'+parseEmptyString(internalIdBill)+'</invoiceid>'+//internal is of bill
							'<invoiceamount>'+parseEmptyString(billTotal)+'</invoiceamount>'+//total of bill
							'<paymentdiscount></paymentdiscount>'+//payment discount
							'<invoicediscount>'+parseEmptyString(billDiscount)+'</invoicediscount>'+//bill discount
							'<paidamount>'+parseEmptyString(paymentAmount)+'</paidamount>'+//amout paid through payment
							'<shipping></shipping>'+
							'<lineitems>'+
							invoiceItemXml+
							'</lineitems>'+
							'</invoice>';
							invoiceItemXml = '';
							nlapiLogExecution('DEBUG','invoiceXml','invoiceXml : '+invoiceXml);
						}
						catch(e)
						{
							nlapiLogExecution('ERROR', 'Error', 'Error : ' + e.toString());
							continue;
						}
						
					}//end of if(apply)
				
				}//end of for loop
				
			}//end of bill count
			nlapiLogExecution('DEBUG','TESTING 1');
			var filters = new Array();
			if((previousVendorACH != '') && (previousVendorACH != null) && (typeof previousVendorACH != "undefined"))
			{
				nlapiLogExecution('DEBUG','TESTING 1.1');
				filters[0] = new nlobjSearchFilter( 'internalid', null, 'anyof', previousVendorACH, null);
			}
			else
			{
				nlapiLogExecution('DEBUG','ENDING THE SCRIPT BECAUSE THERE IS NO VALUE IN Vendor ACH-USA');
				return;//ADDED BY IA ON 11/8/12
			}
			nlapiLogExecution('DEBUG','TESTING 2');
			var columns1 = new Array();
			columns1[0] = new nlobjSearchColumn('custrecordc_cad_nameonaccount');
			columns1[1] = new nlobjSearchColumn('custrecord_usa_bankroutingnumber');//custrecordc_usa_bankroutingnumber 
			columns1[2] = new nlobjSearchColumn('custrecordc_cad_bankaccountnumber');//custrecordc_usa_bankaccountnumber custrecordc_cad_bankaccountnumber
			columns1[3] = new nlobjSearchColumn('internalid');
			columns1[4] = new nlobjSearchColumn('custrecord_usa_bankaccounttype');//custrecordc_usa_bankaccounttype
			columns1[5] = new nlobjSearchColumn('custrecord_cad_vendorid');//custrecord_usa_vendorid
			columns1[6] = new nlobjSearchColumn('custrecord_usa_useraccounttype');//custrecordc_usa_useraccounttype
			columns1[7] = new nlobjSearchColumn('custrecord_usa_entryclass');
			var searchresults = nlapiSearchRecord('customrecordcustomercscachcad', null, filters, columns1);
			//nlapiLogExecution('DEBUG','TESTING 3');
			nlapiLogExecution('DEBUG','TESTING 3', 'previousVendorACH:'+previousVendorACH);
try{
			if(searchresults != null)
			{
				
				for( var k = 0;k < searchresults.length; k++)
				{
					var searchResult = searchresults[k];
					nlapiLogExecution('DEBUG','TESTING 3.2 - searchresults.length:'+searchresults.length, 'record intid:'+searchResult.getId());
					var column1 = searchResult.getAllColumns();
					var nameOnAccount = nlapiEscapeXML(searchResult.getValue(column1[0]));
					var routingNumber = nlapiEscapeXML(searchResult.getText(column1[1]));
					var accountNumber = nlapiEscapeXML(searchResult.getValue(column1[2]));
					var internalid = nlapiEscapeXML(searchResult.getValue(column1[3]));
					var bankAccountType = nlapiEscapeXML(searchResult.getValue(column1[4]));
					var vendorId = nlapiEscapeXML(searchResult.getValue(column1[5]));
					var subType = nlapiEscapeXML(searchResult.getValue(column1[6]));
					var seccode = nlapiEscapeXML(searchResult.getText(column1[7]));
					
					//------this is for Vendor detail--------------------------
					nlapiLogExecution('DEBUG','TESTING 3.3 ', 'vendorId:'+vendorId);	
					var custRecord = nlapiLoadRecord('vendor', vendorId);
					var firstname = '';
					var lastname = '';
					var individual = custRecord.getFieldValue('isperson');
					if(individual == 'T')
					{
						firstname = nlapiEscapeXML(custRecord.getFieldValue('firstname'));
						lastname = nlapiEscapeXML(custRecord.getFieldValue('lastname'));
					}
					else
					{
						firstname = nlapiEscapeXML(custRecord.getFieldValue('companyname'));
						lastname = '';
					}
					nlapiLogExecution('DEBUG','TESTING 3.3');						
					var phone = nlapiEscapeXML(custRecord.getFieldValue('phone'));
					var email = nlapiEscapeXML(custRecord.getFieldValue('email'));
					var vendorSsn = nlapiEscapeXML(custRecord.getFieldValue('custentity_vendor_ssn'));
					var dayPhone = nlapiEscapeXML(custRecord.getFieldValue('custentity_day_phone'));
					var nightPhone = nlapiEscapeXML(custRecord.getFieldValue('custentity_night_phone'));
					var contactCount = custRecord.getLineItemCount('addressbook');
					var add1 = nlapiEscapeXML(custRecord.getFieldValue('addr1'));
					var add2 = nlapiEscapeXML(custRecord.getFieldValue('addr2'));
					var city = nlapiEscapeXML(custRecord.getFieldValue('city'));
					var state = nlapiEscapeXML(custRecord.getFieldValue('state'));
					var zipcode = nlapiEscapeXML(custRecord.getFieldValue('zipcode'));
					if(contactCount)
					{
						for(var length =1 ; length <= contactCount; length++)
						{
							if(custRecord.getLineItemValue('addressbook', 'defaultbilling', length) == 'T')
							{
								//nlapiLogExecution('DEBUG','inside if','inside if : ');
								add1 = nlapiEscapeXML(custRecord.getLineItemValue('addressbook', 'addr1', length));
								add2 = nlapiEscapeXML(custRecord.getLineItemValue('addressbook', 'addr2', length));
								city = nlapiEscapeXML(custRecord.getLineItemValue('addressbook', 'city', length));
								state = nlapiEscapeXML(custRecord.getLineItemValue('addressbook', 'state', length));
								zipcode = nlapiEscapeXML(custRecord.getLineItemValue('addressbook', 'zip', length));
							}
						}
					}
					
					var billcountry = nlapiEscapeXML(custRecord.getFieldValue('billcountry'));
					var shipcountry = nlapiEscapeXML(custRecord.getFieldValue('shipcountry'));
					nlapiLogExecution('DEBUG','billcountry','billcountry : '+billcountry+' shipcountry '+shipcountry);
					var shipaddr1 = '';
					var shipaddr2 ='';
					var shipcity = '';
					var shipstate = '';
					var shipzip = '';
					var forShipaddr1 = '';
					var forShipaddr2 = '';
					var forShipcity = '';
					var forShipstate = '';
					var forShipzip = '';
					var forshipcountry = '';
					var shipaddressee = nlapiEscapeXML(newrec.getFieldValue('shipaddressee'));
					if(billcountry == shipcountry)
					{
						if(contactCount)
						{
							for(var length =1 ; length <= contactCount; length++)
							{
								if(custRecord.getLineItemValue('addressbook', 'defaultshipping', length) == 'T')
								{
									
									shipaddr1 = nlapiEscapeXML(custRecord.getLineItemValue('addressbook', 'addr1', length));
									shipaddr2 = nlapiEscapeXML(custRecord.getLineItemValue('addressbook', 'addr2', length));
									shipcity = nlapiEscapeXML(custRecord.getLineItemValue('addressbook', 'city', length));
									shipstate = nlapiEscapeXML(custRecord.getLineItemValue('addressbook', 'state', length));
									shipzip = nlapiEscapeXML(custRecord.getLineItemValue('addressbook', 'zip', length));
									forShipaddr1 = '';
									forShipaddr2 = '';
									forShipcity = '';
									forShipstate = '';
									forShipzip = '';
									forshipcountry = '';
								}
							}
						}
					}
					else
					{
						if(contactCount)
						{
							for(var length =1 ; length <= contactCount; length++)
							{
								if(custRecord.getLineItemValue('addressbook', 'defaultshipping', length) == 'T')
								{
									forShipaddr1 = nlapiEscapeXML(custRecord.getLineItemValue('addressbook', 'addr1', length));
									forShipaddr2 = nlapiEscapeXML(custRecord.getLineItemValue('addressbook', 'addr2', length));
									forShipcity = nlapiEscapeXML(custRecord.getLineItemValue('addressbook', 'city', length));
									forShipstate = nlapiEscapeXML(custRecord.getLineItemValue('addressbook', 'state', length));
									forShipzip = nlapiEscapeXML(custRecord.getLineItemValue('addressbook', 'zip', length));
									shipaddr1 = '';
									shipaddr2 = '';
									shipcity = '';
									shipstate = '';
									shipzip = '';
								}
							}
						}
					}
					nlapiLogExecution('DEBUG','TESTING 4');
					//--------------------------------------------------------------------for xml parsing--------------------------------
					
					var xmlRequest ='<?xml version="1.0" encoding="utf-8"?>'+
									'<request>'+
										'<credentials>'+
											'<accountid>'+parseEmptyString(accountid)+'</accountid>'+//required
											'<securekey>'+parseEmptyString(securekey)+'</securekey>'+
										'</credentials>'+
										'<company>'+
											'<netLedgerId>'+parseEmptyString(netledgerid)+'</netLedgerId>'+
											'<coastalId>'+parseEmptyString(coastalid)+'</coastalId>'+
											'<federalId>'+parseEmptyString(federalid)+'</federalId>'+
											'<name>'+parseEmptyString(name)+'</name>'+
											'<address1>'+parseEmptyString(address1)+'</address1>'+
											'<address2>'+parseEmptyString(address2)+'</address2>'+
											'<city>'+parseEmptyString(cityScript)+'</city>'+
											'<stateProv>'+parseEmptyString(stateScript)+'</stateProv>'+
											'<postalCode>'+parseEmptyString(postalcode)+'</postalCode>'+
											'<countryCode>'+parseEmptyString(countrycode)+'</countryCode>'+
											'<telephone>'+parseEmptyString(telephone)+'</telephone>'+
									   '</company>'+
										'<companyTran>'+
											   '<bankName>'+parseEmptyString(companyBankName)+'</bankName>'+
											   '<routingNumber>'+parseEmptyString(companyAccountNumber)+'</routingNumber>'+
											   '<accountNumber>'+parseEmptyString(companyRoutingNumber)+'</accountNumber>'+
											   '<accountType>'+parseEmptyString(companyAccountType)+'</accountType>'+
										'</companyTran>'+
										'<auth>'+
										'<transtype>VendorBillPay</transtype>'+//required
										'<defaultinfo>'+
											'<ipaddress></ipaddress>'+//
											'<ordernumber></ordernumber>'+//no order no
											'<description>'+parseEmptyString(memo)+'</description>'+//memo of invoice
										'</defaultinfo>'+
										'<check>'+
											'<amount>'+parseEmptyString(total)+'</amount>'+//required
											'<tax></tax>'+//total tax
											'<shipping></shipping>'+//total Shipping Cost
											'<seccode>'+parseEmptyString(seccode)+'</seccode>'+
											'<bankinfo>'+//from debit card
												'<nameonaccount>'+parseEmptyString(nameOnAccount)+'</nameonaccount>'+
												'<accounttype>'+parseEmptyString(bankAccountType)+'</accounttype>'+
												'<subaccounttype>'+parseEmptyString(subType)+'</subaccounttype>'+
												'<routing>'+parseEmptyString(routingNumber)+'</routing>'+//required
												'<account>'+parseEmptyString(accountNumber)+'</account>'+//required
												'<checknumber>'+parseEmptyString(checkNum)+'</checknumber>'+//no check number on deposit
											'</bankinfo>'+
											'<usaddress>'+
												'<addr1>'+parseEmptyString(add1)+'</addr1>'+
												'<addr2>'+parseEmptyString(add2)+'</addr2>'+
												'<city>'+parseEmptyString(city)+'</city>'+
												'<state>'+parseEmptyString(state)+'</state>'+
												'<zipcode>'+parseEmptyString(zipcode)+'</zipcode>'+
											'</usaddress>'+
											'<foreignaddress>'+
												'<addr1></addr1>'+
												'<addr2></addr2>'+
												'<city></city>'+
												'<region></region>'+
												'<country></country>'+
												'<postalcode></postalcode>'+
											'</foreignaddress>'+
											'<chargedate></chargedate>'+
											'<customer>'+
												'<customerid>'+parseEmptyString(vendorId)+'</customerid>'+
												'<savecustomer>True</savecustomer>'+
												'<individual>'+
													'<firstname>'+parseEmptyString(firstname)+'</firstname>'+
													'<lastname>'+parseEmptyString(lastname)+'</lastname>'+
													'<usaddress>'+
														'<addr1>'+parseEmptyString(add1)+'</addr1>'+
														'<addr2>'+parseEmptyString(add2)+'</addr2>'+
														'<city>'+parseEmptyString(city)+'</city>'+
														'<state>'+parseEmptyString(state)+'</state>'+
														'<zipcode>'+parseEmptyString(zipcode)+'</zipcode>'+
													'</usaddress>'+
													'<dayphone>'+parseEmptyString(dayPhone)+'</dayphone>'+
													'<nightphone>'+parseEmptyString(nightPhone)+'</nightphone>'+
													'<cellphone>'+parseEmptyString(phone)+'</cellphone>'+
													'<email>'+parseEmptyString(email)+'</email>'+
													'<stateid type="">'+
														'<state></state>'+//
														'<number></number>'+//
													'</stateid>'+
													'<ssn>'+parseEmptyString(vendorSsn)+'</ssn>'+
												'</individual>'+
											'</customer>'+
											'<shipto>'+
												'<firstname>'+parseEmptyString(shipaddressee)+'</firstname>'+
												'<lastname></lastname>'+//to check 
												'<usaddress>'+
													'<addr1>'+parseEmptyString(shipaddr1)+'</addr1>'+
													'<addr2>'+parseEmptyString(shipaddr2)+'</addr2>'+
													'<city>'+parseEmptyString(shipcity)+'</city>'+
													'<state>'+parseEmptyString(shipstate)+'</state>'+
													'<zipcode>'+parseEmptyString(shipzip)+'</zipcode>'+
												'</usaddress>'+
												'<forienaddress>'+
													'<addr1>'+parseEmptyString(forShipaddr1)+'</addr1>'+
													'<addr2>'+parseEmptyString(forShipaddr2)+'</addr2>'+
													'<city>'+parseEmptyString(forShipcity)+'</city>'+
													'<region>'+parseEmptyString(forShipstate)+'</region>'+
													'<country>'+parseEmptyString(forshipcountry)+'</country>'+
													'<postalcode>'+parseEmptyString(forShipzip)+'</postalcode>'+
												'</forienaddress>'+
											'</shipto>'+
										'</check>'+
										'<images idescription="">'+
											'<image idescription="">'+
												'<imageformat></imageformat>'+
												'<imagedata></imagedata>'+
											'</image>'+
										'</images>'+
										'</auth>'+
										'<level3>'+invoiceXml+'</level3>'+
										'<batch batchid=""></batch>'+
										'<void>'+
											'<refnumber></refnumber>'+
											'<reason></reason>'+
										'</void>'+
										'<miscinfo>'+
											'<data1></data1>'+
											'<data2></data2>'+
											'<data3></data3>'+
											'<data4></data4>'+
											'<data5></data5>'+
											'<data6></data6>'+
											'<data7></data7>'+
											'<data8></data8>'+
											'<data9></data9>'+
											'<data10></data10>'+
											'<data11></data11>'+
											'<data12></data12>'+
											'<data13></data13>'+
											'<data14></data14>'+
											'<data15></data15>'+
											'<data16></data16>'+
											'<data17></data17>'+
											'<data18></data18>'+
											'<data19></data19>'+
											'<data20></data20>'+
											'<data21></data21>'+
											'<data22></data22>'+
											'<data23></data23>'+
											'<data24></data24>'+
											'<data25></data25>'+
										'</miscinfo>'+
									'</request>';
									
						//--------------------------------------------------------------------end of xml parsing------------------------------
					//-------------------------------------used for requested url-----------------------------------------------------------------			
					nlapiLogExecution('DEBUG','TESTING 5 AFTER XML PARSING');
					if(internalid == previousVendorACH)
					{
						nlapiLogExecution('DEBUG', 'request', 'xmlRequest : '+xmlRequest);   
						var requestURL = 'http://bill.coastalsoftware.com/webservice/ach.php';
						
						responses = nlapiRequestURL(requestURL, xmlRequest, null);//return the response from requested url
						nlapiLogExecution('DEBUG','responses','responses : '+responses);
						var code = responses.getCode();
						body = nlapiStringToXML(responses.getBody());//get the body
						body1 = responses.getBody();//get the body
						nlapiLogExecution('DEBUG','body',' body : '+body1);
						if(body1 != null)
						{
							try
							{
								var rawfeeds = nlapiSelectNodes(body, "//auth");
								var type = nlapiSelectValue(rawfeeds[0], "authtype");
								var authid = nlapiSelectValue(rawfeeds[0], "authid");
								if(type == 'VendorBillPay')
								{
									newrec.setFieldValue('custbody_upaya_ach_message','Accepted with Transaction id:'+authid);    
									newrec.setFieldValue('custbody_upaya_ach_charged', 1);
									if((authid) && (typeof authid != "undefined") && (isNaN(authid) == false))
									{
										newrec.setFieldValue('custbody_upaya_ach_order_id', authid);
									}
									
									newrec.setFieldValue('custbody_upaya_vendor_ach_usa', previousVendorACH);
									nlapiLogExecution('DEBUG','Cash Sale','Created Successfuly!');    
									newrec.setFieldValue('ccapproved', 'T');
															
									//--------------------- send email to customer --------------- this function is used on success
								
									var template = nlapiGetContext().getSetting('SCRIPT', 'custscript_email_templet');//
									var arrParameters = new Array();
									arrParameters['NLFIRSTNAME'] = firstname;
									arrParameters['NLLASTNAME'] = lastname;
									arrParameters['NLINVOICENUMBER'] = totalInvoice;
									arrParameters['NLINVOICEDATE'] = totalDate;
									arrParameters['NLTOTALPAYMENT'] = totalPayment;
									arrParameters['NLPAYMENTID'] = authid;
									arrParameters['NLTOTALVALUE'] = total;
									arrParameters['NLCOMPANYNAME'] = name;
									arrParameters['NLPHONE'] = telephone;
									var sub = ' Direct Deposit Notification';
									nlapiLogExecution('DEBUG','recordId',' recordId '+recordId);
									if(template)
									{
										var msg = nlapiMergeRecord(template, 'vendorpayment', recordId, null, null,arrParameters).getValue();
										nlapiSendEmail(userId, email, sub, msg, null, null, null, null);
										nlapiLogExecution('DEBUG','After Mail:'+email,'After Mail:'+userId);
									}
									//--------------------- end of email to customer -------------
								
								}
								
							}
							catch(e)
							{
								
							}
							
							try
							{
								var errorFeed = nlapiSelectNodes(body, "//error");
								var errorCode = nlapiSelectValue(errorFeed[0], "code");
								var errorMsg = nlapiSelectValue(errorFeed[0], "message");
								 nlapiLogExecution('DEBUG', 'errorCode', 'errorCode : '+errorCode+' errorMsg '+errorMsg);
								if(errorCode)
								{
									newrec.setFieldValue('custbody_upaya_ach_charged', 2);
									
									nlapiLogExecution('DEBUG','Cash Sale','Created RejectionSuccessfuly!');  
								}
							}
							catch(e)
							{
								
							}
						}	
							
							
						var id = nlapiSubmitRecord( newrec, true); // submit the record
						nlapiLogExecution('DEBUG','record id','id:'+id);
					}
					else
					{
						nlapiLogExecution('DEBUG','Card Type Not Found','Card Type Not Found!');  
					}
					nlapiLogExecution('DEBUG','TESTING 6');
				}//end of for serch result
			}//end of if
			else
			{
				nlapiLogExecution('DEBUG','search Result Not Found','search Result Not Found: ');
			}
    }catch(err){
        errorDetailMsg = "Error  " ;
        nlapiLogExecution('ERROR', "Error ", logExecutionMsg(err, errorDetailMsg));
        return;
    } 
  
				/*			
				
				
				
			//}//end of if paymentTtype
			
				*/
			nlapiLogExecution('DEBUG','TESTING 7');	
		}//end of create
		nlapiLogExecution('DEBUG','TESTING 8');
	}
function logExecutionMsg(e, errorDetailMsg)
{
     var msg = new String();
     msg += errorDetailMsg;
     if(e.getCode != null)
      {
        msg += " "+ e.getDetails();
      }
      else
      {
        msg += " "+ e.toString();
      }

      return msg;  
}	
function parseEmptyString(str)
{
	if(str == '' || str == null || str == 'NULL' || str == 'null')
	{
		//nlapiLogExecution('DEBUG','str','str '+str);
		str = '';
	}
	return str;
}	