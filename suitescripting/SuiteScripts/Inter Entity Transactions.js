function interentity(request,response)
{
//Designed for Shareholder Representative Services - August 2013
//Frank Foster - Grace Business Solutions
//ffoster@grace-solutions.com - 314-831-0078

//This is a Suitelet designed to automatically generate, Inter-Entity transactions from a base transaction

//This is the GET method

if ( request.getMethod() == 'GET' )
	{

//		IECONTROL
//		0 = First Time
//		1 = Credit Card Selection
//		2 = IE Trans ID Selection

//		var soid = 167370
//		var nextline = 1
//		var entityid = 7090
//		var soid = 122358
//		var entityid = 6097
//		var entitylist = 6097

		var iecontrol = request.getParameter('iecontrol');
		var soid = request.getParameter('soid');
		var entityid  = request.getParameter('entity');
		var entitylist  = request.getParameter('entity');	

		var nextline = request.getParameter('nextline');
	//	var currentline = request.getParameter('currentline');
		var currentline = request.getParameter('nextline');
		var firstime = request.getParameter('firstime');

		if (nextline == 0)
		{
			throw nlapiCreateError('License Error','Sales Order Does Not Have Any Eleigible Line Items For Licenses') 
			return;
		}
	

		var drilldown = request.getParameter('drilldown');  //Will limit list if supplied
		if (drilldown == null || drilldown == "")
		{
			drilldown = ""
		}

		var newsassign = request.getParameter('newsassign');  //Will assign to new enity if supplied
		if (newsassign != null && newsassign != "")
		{
			entitylist = request.getParameter('newsassign')
		}

		if (firstime == 0) //Not the first time
		{
			var selected = request.getParameter('selected')
			if (selected != null && selected != "")
			{
				var selected = request.getParameter('selected').split(",");;
			}

		}

/*
		var sorec = nlapiLoadRecord('salesorder', soid)
		
		//See if it was matched
		if (nextline > 1)
		{
			if (sorec.getLineItemValue('item','item', nextline - 1) == sorec.getLineItemValue('item','item', nextline) &&
				sorec.getLineItemValue('item', 'revrecstartdate', nextline - 1) == sorec.getLineItemValue('item', 'revrecstartdate', nextline) &&
				sorec.getLineItemValue('item', 'revrecenddate', nextline - 1) == sorec.getLineItemValue('item', 'revrecenddate', nextline) )
			{
				nextline = Number(nextline) + 1
			}
		}
		
		
		//We only want Non-Inventory type line items
		var size1 = sorec.getLineItemCount('item')		
		var itemid = sorec.getLineItemValue('item', 'item', nextline)
		var itemidtext = sorec.getLineItemText('item', 'item', nextline)

		for(h=1;h<=size1;h++)
		{
			var rectype = nlapiLookupField('item', itemid, 'recordType');
			if (rectype != 'noninventoryitem')
			{
				nextline = Number(nextline) + 1
				var itemid = sorec.getLineItemValue('item', 'item', nextline)
				var itemidtext = sorec.getLineItemText('item', 'item', nextline)
			}
			else
				h = 9999
		}

		var qty = sorec.getLineItemValue('item', 'quantity', nextline)

		//Here we look to see if there are other like items - total is we do
		for(y=1;y<=size1;y++)
		{
//			if (nextline != 999 && nextline != y && firstime == 1)
			if (nextline != 999 && nextline != y)
			{
				//If these are equal - consider as one line
				if (sorec.getLineItemValue('item','item', y) == sorec.getLineItemValue('item','item', nextline) &&
				    sorec.getLineItemValue('item', 'revrecstartdate', y) == sorec.getLineItemValue('item', 'revrecstartdate', nextline) &&
				    sorec.getLineItemValue('item', 'revrecenddate', y) == sorec.getLineItemValue('item', 'revrecenddate', nextline) )
				{
					var qty = Number(qty) + Number(sorec.getLineItemValue('item', 'quantity', y))
//					var schools = Number(schools) + Number(sorec.getLineItemValue('item', 'custcol_num_schools_licensed', y))

				}
			}
		}		
			

		if (Number(nextline) > size1) //Out of line items so we're all done
		{
			var url = nlapiResolveURL('RECORD', 'salesorder', soid)
			document.location= url
			return;
		}
		
		var schools = sorec.getLineItemValue('item', 'custcol_num_schools_licensed', nextline)
		var startdate = sorec.getLineItemValue('item', 'revrecstartdate', nextline)
		var enddate = sorec.getLineItemValue('item', 'revrecenddate', nextline)
		var custname = nlapiLookupField('customer', entityid, 'companyname')
		var custnamelist = nlapiLookupField('customer', entitylist, 'companyname')
		var message = ""
		
		var bccstd = new Array;*/
		var form = nlapiCreateForm('Inter Entity Transactions (POC - Proof Of Concepts - Only!)');  //Setup the selection form
		form.addTab('custpagetab1', 'Generated Transactions')
		form.addTab('custpagetab2', 'Existing SubCustomers With Licenses')
		var msgline = form.addField('custpage_msgline','inlinehtml', null, null, 'custpagetab1');
		var message = "Ready For Update"
		msgline = '<span style="font-weight:bold; font-size:100%; color:blue">' + message + '</span>'

		form.addField('custpage_credtcard','select','Credit Card Transaction', '-30')
		form.addField('custpage_interentity','select','Inter Entity Id', 'customrecord_interentitytrans')
		form.addField('custpage_vendorhd','select','Vendor', '-3').setLayoutType('normal', 'startcol')
		form.addField('custpage_amounthd','currency','Amount')
		form.addField('custpage_reference','text','Reference#')

		// add a sublist to the form
		var sublist = form.addSubList('custpagesublisttran','list','Generated Transactions', 'custpagetab1');

		// add fields to the sublist
		sublist.addField('custpage_base','checkbox', 'Base Trans?');
		sublist.addField('custpage_trans','text', 'Transaction');
		sublist.addField('custpage_cust','select', 'Customer', '-2')
		sublist.addField('custpage_entity','select', 'Entity', '-101')
		sublist.addField('custpage_vendor','select', 'Vendor', '-3')
		sublist.addField('custpage_amount','currency', 'Amount')
		sublist.addField('custpage_debit','select', 'Debit', '-112')
		sublist.addField('custpage_credit','select', 'Credit', '-112')
		sublist.addField('custpage_ieid','text', 'IE ID').setDisplayType('disabled');
		sublist.addField('custpage_interanlid','integer', 'Internal Id').setDisplayType('hidden');

		if (iecontrol == 0 || iecontrol == null || iecontrol == "")
		{
			var message = "Please enter base Credit Card Transaction or Inter Entity ID"
			msgline = '<span style="font-weight:bold; font-size:100%; color:blue">' + message + '</span>'
		}
		else
		if (iecontrol == 1)
		{
			var creditcardid = request.getParameter('ccrec');
			var ccrecord = nlapiLoadRecord('creditcardcharge', creditcardid)
			var vendor = ccrecord.getFieldValue('entity')
			var amount = ccrecord.getFieldValue('usertotal')
			var refno = ccrecord.getFieldValue('tranid')
			
		}
		else
		{
			if (iecontrol == 2)
			{
				var interentid = request.getParameter('ierec');
				var filter = new Array();
				filter[0] = new nlobjSearchFilter('custrecord_ie_refno', null, 'equato', interentid);
				var columns = new Array();
				columns[0] = new nlobjSearchColumn('custrecord_ie_transaction');
				columns[1] = new nlobjSearchColumn('custrecord_ie_customer');
				columns[2] = new nlobjSearchColumn('custrecord_ie_entity');
				columns[3] = new nlobjSearchColumn('custrecord_ie_vendor');
				columns[4] = new nlobjSearchColumn('custrecord_ie_amount');
				columns[5] = new nlobjSearchColumn('custrecord_ie_credit');
				columns[6] = new nlobjSearchColumn('custrecord_ie_debit');
				columns[7] = new nlobjSearchColumn('custrecord_ie_basetran');
				columns[8] = new nlobjSearchColumn('custrecord_ie_refno');

				var results = nlapiSearchRecord('customrecord_interentitytrans', 'customsearch_ietransactions', filter, columns); 
				for (var i = 0; results != null && i < results.length; i++ )
				{
					sublist.setLineItemValue('custpage_trans', i + 1, results[i].getValue('custrecord_ie_transaction') );
					sublist.setLineItemValue('custpage_cust', i + 1, results[i].getValue('custrecord_ie_customer') );
					sublist.setLineItemValue('custpage_entity', i + 1, results[i].getValue('custrecord_ie_entity') );
					sublist.setLineItemValue('custpage_vendor', i + 1, results[i].getValue('custrecord_ie_vendor') );
					sublist.setLineItemValue('custpage_amount', i + 1, results[i].getValue('custrecord_ie_amount') );
					sublist.setLineItemValue('custpage_debit', i + 1, results[i].getValue('custrecord_ie_debit') );
					sublist.setLineItemValue('custpage_credit', i + 1, results[i].getValue('custrecord_ie_credit') );				
					sublist.setLineItemValue('custpage_base', i + 1, results[i].getValue('custrecord_ie_basetran') );				
					sublist.setLineItemValue('custpage_ieid', i + 1, results[i].getValue('custrecord_ie_refno') );				
				}
			}
		}

		form.setFieldValues({custpage_msgline: msgline, custpage_vendorhd: vendor, custpage_amounthd: amount, custpage_reference: refno})

/*
		var currentitem = form.addField('custpageproduct','select','Product', '-10').setDisplayType('hidden');
		var currentitemtext = form.addField('custpageproducttext','inlinehtml','Product')
		var nxtline = form.addField('custpagenextline','integer','Next Line Item').setDisplayType('hidden');
		var currline = form.addField('custpagecurrentline','integer','Current Line Item').setDisplayType('hidden');
		var custnameFld = form.addField('custpagecustomer','text','Sales Order Customer').setDisplayType('disabled');
		var custid = form.addField('custpagecustomerid','select','Select Customer', '-2')
		var custorigianl = form.addField('custpagecustomerorig','select','Select Customer', '-2').setDisplayType('hidden');
		var selectarray = form.addField('custpageselected','multiselect','Selected Lines').setDisplayType('hidden');

		var dillout = form.addField('custpagedrilldown','text','List Drill Down');

		var licensename = form.addField('custpagelicensename','text','Name');
		var nolicense = form.addField('custpagenolicense','integer','# of Licenses')
		var nobuildings = form.addField('custpagenobuildings','integer','# of Buildings')
		var nobuildings_hidden = form.addField('custpagenobuildingshid','integer','# of Buildings').setDisplayType('hidden');
		var nolicense_hidden = form.addField('custpagenolicensehid','integer','# of Buildings').setDisplayType('hidden');
		var stdate = form.addField('custpagestartdate','date','Start Date')
//		startdate.setMandatory( true );
		var edate = form.addField('custpageenddate','date','End Date')
//		enddate.setMandatory( true );


		//See if the control record for the number of licenses is there and/or up-to-date
		var filters_ctl = new Array();
		filters_ctl[0] = new nlobjSearchFilter('custrecord_sl_buyer', null, 'anyof', entityid); 
		filters_ctl[1] = new nlobjSearchFilter('custrecord_sl_product', null, 'anyof', itemid); 
		filters_ctl[2] = new nlobjSearchFilter('custrecord_sl_saleorder', null, 'anyof', soid); 
		filters_ctl[3] = new nlobjSearchFilter('custrecord_sl_startdate', null, 'on', startdate); 
		filters_ctl[4] = new nlobjSearchFilter('custrecord_sl_enddate', null, 'on', enddate); 
		var columns_ctl = new Array();
		columns_ctl[0] = new nlobjSearchColumn( 'custrecord_sl_licenses'); //Licenses assigned
		columns_ctl[1] = new nlobjSearchColumn( 'custrecord_sl_buildings'); //No Buildings

		var licassigned = nlapiSearchRecord('customrecord_stulicrework', null, filters_ctl, columns_ctl);  
		if (licassigned == null)
		{
			var licrec = nlapiCreateRecord('customrecord_stulicrework')
			licrec.setFieldValue('custrecord_sl_buyer', entityid)
			licrec.setFieldValue('custrecord_sl_product', itemid)
			licrec.setFieldValue('custrecord_sl_saleorder', soid)
			licrec.setFieldValue('custrecord_sl_licenses', qty)
			licrec.setFieldValue('custrecord_sl_buildings', schools)
			licrec.setFieldValue('custrecord_sl_startdate', startdate)
			licrec.setFieldValue('custrecord_sl_enddate', enddate)
			nlapiSubmitRecord(licrec)
		}
		else
		{
			qty = licassigned[0].getValue('custrecord_sl_licenses')
			schools = licassigned[0].getValue('custrecord_sl_buildings')
		}

//Build the list of Sub-customers, licenses and existing licenses

		//First lets build an array of existing licenses for this sales order
		var filters_prod = new Array();
		filters_prod[0] = new nlobjSearchFilter('custrecord_bought_by', null, 'anyof', entityid); 
		filters_prod[1] = new nlobjSearchFilter('custrecord_product', null, 'anyof', itemid); 
		filters_prod[2] = new nlobjSearchFilter('custrecord_sales_order', null, 'anyof', soid); 
		filters_prod[3] = new nlobjSearchFilter('custrecord_start_date', null, 'on', startdate); 
		filters_prod[4] = new nlobjSearchFilter('custrecord_end_date', null, 'on', enddate); 
		var columns_prod = new Array();
		columns_prod[0] = new nlobjSearchColumn( 'custrecord_authorized_school'); // Authorized School
		columns_prod[1] = new nlobjSearchColumn( 'custrecord_authorized_students'); // Authorized Students
		var holdln = new Array();  //Array of arrays
		holdln[0] = new Array(); //School
		holdln[1] = new Array(); //Students
		
		
		var subprodcut = nlapiSearchRecord('customrecord1', null, filters_prod, columns_prod);  
		for (var k = 0; subprodcut != null && k < subprodcut.length; k++ )
		{
			holdln[0][k] = subprodcut[k].getValue('custrecord_authorized_school')
			holdln[1][k] = subprodcut[k].getValue('custrecord_authorized_students')
		}

		//Lets find Sub Customers
		var filters = new Array();
		filters[0] = new nlobjSearchFilter('parent', null, 'anyof', entitylist); 
		filters[1] = new nlobjSearchFilter('companyname', null, 'contains', drilldown); 
		filters[2] = new nlobjSearchFilter('isinactive', null, 'is', 'F'); 
		var columns = new Array();
		columns[0] = new nlobjSearchColumn( 'companyname'); // Company Name
		columns[1] = new nlobjSearchColumn( 'entityid'); // Company Name
		columns[2] = new nlobjSearchColumn( 'custentity_enrollment'); // Enrollment
		columns[3] = new nlobjSearchColumn( 'custentity_low_grade'); // Low Grade
		columns[4] = new nlobjSearchColumn( 'custentity_high_grade'); // High Grade
		// add a sublist to the form
		var sublist = form.addSubList('custpagesublistcust','list','SubCustomers', 'custpagetab1');

		// add fields to the sublist
		sublist.addField('custpagesubsel','checkbox', 'Select');
		sublist.addField('custpagesubco','text', 'School/Company')
		sublist.addField('custpageenroll','integer', 'Enrollment')
		sublist.addField('custpagelowgrade','text', 'Low Grade')
		sublist.addField('custpagehighgrade','text', 'High Grade')
		sublist.addField('custpagenolicenses','float', '# of Licenses').setDisplayType('hidden');
//		sublist.addField('custpagenolicenses','integer', '# of Licenses').setDisplayType('entry');
		sublist.addField('custpagesubcoid','integer', 'Internal ID').setDisplayType('hidden');
		sublist.addField('custpageparent','text', 'Parent')


		// another sublist to list existing school licenses for this product
		var sublist1 = form.addSubList('custpagesublistexist','list', null, 'custpagetab2');
			 
		// add fields to the sublist
		sublist1.addField('custpagesubcoexist','text', 'Existing School/Company')
		sublist1.addField('custpageenrollexist','integer', 'Enrollment')
		sublist1.addField('custpagelowgradeexist','text', 'Low Grade')
		sublist1.addField('custpagehighgradeexist','text', 'High Grade')
//		sublist1.addField('custpagenolicensesxist','integer', '# of Licenses')
		sublist1.addField('custpageparentexist','text', 'Parent')
	
		var sublicenses = 0 

		var subcusts = nlapiSearchRecord('customer', 'customsearch_stulicsearch1', filters, columns); 
		var lineno = 0
		var lineno1 = 0
		for ( var i = 0; subcusts != null && i < subcusts.length; i++ )
		{
			
			//See if this customer already has this product
			var sizex = holdln[0].length
			var matched = false
			for(l=0;l<=sizex - 1;l++) 
			{
				if (holdln[0][l] == subcusts[i].getId() ) //We have a license for this sales order & product
				{
					matched = true
					l = 99999
				}
			}
			
			if (!matched) //No licenses assigned
			{
				var lineno = lineno + 1

				if (lineno == 1) //Put total licnses in first line, the first time
					var nolisc = qty
				else
					var nolisc = 0
				
				if (firstime == 0 && (selected != null && selected != "") ) //If previously selected, select again
				{					
					if (lineno <= selected.length)
					{						
						var sel1 = lineno - 1
						var sel2 = selected[sel1]
						if (selected[sel1] == 'T')
						{
							sublist.setLineItemValue('custpagesubsel', lineno, 'T');
						}
					}					
				}						
				
				sublist.setLineItemValue('custpagesubcoid', lineno, subcusts[i].getId() );
				sublist.setLineItemValue('custpageenroll', lineno, subcusts[i].getValue('custentity_enrollment') );
				sublist.setLineItemValue('custpagenolicenses', lineno, Number(nolisc) );
				sublist.setLineItemValue('custpagelowgrade', lineno, subcusts[i].getText('custentity_low_grade') );
				sublist.setLineItemValue('custpagehighgrade', lineno, subcusts[i].getText('custentity_high_grade') );
	//			sublist.setLineItemValue('custpagesubco', lineno, subcusts[i].getId() )
				sublist.setLineItemValue('custpageparent', lineno, custnamelist);
				sublist.setLineItemValue('custpagesubco', lineno, subcusts[i].getValue('entityid') + ' ' + subcusts[i].getValue('companyname'));
			}


			if (matched)
			{
				
				var lineno1 = lineno1 + 1
				if (lineno1 == 1)
				{
					var sublicenses = subprodcut[0].getValue('custrecord_authorized_students')					
				}

				sublist1.setLineItemValue('custpageparentexist', lineno1, custnamelist);
//				sublist1.setLineItemValue('custpagesubcoidsxist', lineno1, subcusts[i].getId() );
				sublist1.setLineItemValue('custpageenrollexist', lineno1, subcusts[i].getValue('custentity_enrollment') );
				sublist1.setLineItemValue('custpagenolicensesxist', lineno1, sublicenses);
				sublist1.setLineItemValue('custpagelowgradeexist', lineno1, subcusts[i].getText('custentity_low_grade') );
				sublist1.setLineItemValue('custpagehighgradeexist', lineno1, subcusts[i].getText('custentity_high_grade') );
				sublist1.setLineItemValue('custpagesubcoexist', lineno1, subcusts[i].getValue('entityid') + ' ' + subcusts[i].getValue('companyname'));
			} 

			if (lineno == 100)
			{				
				var message = "More than 100+ Schools - Please Use Import to Assign Licenses"
				i = 99999
			}
		}

		//If we had matched and on same line - only put total once	
		if (lineno1 > 0 && lineno > 0)
		{
			sublist.setLineItemValue('custpagenolicenses', 1, 0 );
		}


		//No subcustomers, so lets check to see if the SO Customer has one, if not show it		
		if (lineno == 0) 
		{
			
			//First check school license to see if the Select customer has one
			var newcust = entitylist
			schools = 1
			if (newcust != "" && newcust != null)
			{
				var filters_prod = new Array();
				filters_prod[0] = new nlobjSearchFilter('custrecord_bought_by', null, 'anyof', newcust); 
				filters_prod[1] = new nlobjSearchFilter('custrecord_product', null, 'anyof', itemid); 
				filters_prod[2] = new nlobjSearchFilter('custrecord_sales_order', null, 'anyof', soid); 
				var columns_prod = new Array();
				columns_prod[0] = new nlobjSearchColumn('custrecord_authorized_school'); // Authorized School
				columns_prod[1] = new nlobjSearchColumn('custrecord_authorized_students'); // Authorized Students


				var newcustprodcut = nlapiSearchRecord('customrecord1', null, filters_prod, columns_prod);  
				newcustrec = nlapiLoadRecord('customer', newcust)
				if (newcustprodcut == null)
				{										
					sublist.setLineItemValue('custpagesubcoid', 1, newcust);
					sublist.setLineItemValue('custpageenroll', 1, newcustrec.getFieldValue('custentity_enrollment') );
					sublist.setLineItemValue('custpagelowgrade', 1, newcustrec.getFieldText('custentity_low_grade') );
					sublist.setLineItemValue('custpagehighgrade', 1, newcustrec.getFieldText('custentity_high_grade') );
					sublist.setLineItemValue('custpagenolicenses', 1, Number(qty) );
					//sublist.setLineItemValue('custpageparent', lineno, custnamelist);
					sublist.setLineItemValue('custpagesubco', 1, newcustrec.getFieldValue('entityid') + ' ' + newcustrec.getFieldValue('companyname'));
					lineno = 1
				}
				else
				{					
//					sublist1.setLineItemValue('custpageparentexist', 1, custnamelist);
					sublist1.setLineItemValue('custpageenrollexist', 1, newcustrec.getFieldValue('custentity_enrollment') );
					sublist1.setLineItemValue('custpagenolicensesxist', 1, 1);
					sublist1.setLineItemValue('custpagelowgradeexist', 1, newcustrec.getFieldText('custentity_low_grade') );
					sublist1.setLineItemValue('custpagehighgradeexist', 1, newcustrec.getFieldText('custentity_high_grade') );
					sublist1.setLineItemValue('custpagesubcoexist', 1, newcustrec.getFieldValue('entityid') + ' ' + newcustrec.getFieldValue('companyname'));
					lineno1 = 1
				}

			}		

		}
		
		var noschoolslisted = form.addField('custpagsenoschoollist','integer','Total Number of Schools Listed');
		var noinlist = lineno

					
//		var context = nlapiGetContext();
//		var noinlist = context.getRemainingUsage()

		//Setup any message line	
		msgline2 = '<span style="font-weight:bold; font-size:100%; color:blue">' + "No. Buildings With Licenses = " + lineno1 + '</span>'

		if (message == "")
		{	
			message = "Ready For Update"
			msgline = '<span style="font-weight:bold; font-size:100%; color:blue">' + message + '</span>' + '   -   ' + msgline2
		}
		else
			msgline = '<span style="font-weight:bold; font-size:115%; color:red">' + message + '</span>'+ '   -   ' + msgline2


		form.addSubmitButton('ReSelect');

		var soURL = nlapiResolveURL('RECORD','salesorder', soid ,null);
		form.addButton('custpagesreturn', 'Cancel & Return', "document.location='"+soURL+"'" );		

		form.setScript('customscript_stuupdate');
		//See where we are aith line items
		var done = false
		var size = sorec.getLineItemCount('item')
		var trynext = Number(nextline) + 1
		
		var x = 0
		if (trynext > size)
		{
			var done = true
		}
		else
		{
			//If this was a line that got matched, skip it
			var wasmatched = false
			if (sorec.getLineItemValue('item','item', trynext) == sorec.getLineItemValue('item','item', nextline) &&
			sorec.getLineItemValue('item', 'revrecstartdate', trynext) == sorec.getLineItemValue('item', 'revrecstartdate', nextline) &&
			sorec.getLineItemValue('item', 'revrecenddate', trynext) == sorec.getLineItemValue('item', 'revrecenddate', nextline) )
			{
				nextline = Number(nextline) + 1
				wasmatched = true
			}
			
			var done = true

			for(x=trynext;x<=size;x++) 
			{
				var itemlook = sorec.getLineItemValue('item','item', x)
				var rectype = nlapiLookupField('item', itemlook, 'recordType');
				if (rectype == 'noninventoryitem')
				{
					nextline = x
/*					if (wasmatched)
					{
						nextline = Number(nextline) + 1
						trynext = nextline
					}
					x = 999
					var done = false
				}			
			}
		}
		
		//We're also done if the next line was matched
		if (trynext == size & x == 999)
		{
			if (sorec.getLineItemValue('item','item', trynext) == sorec.getLineItemValue('item','item', nextline) &&
				sorec.getLineItemValue('item', 'revrecstartdate', trynext) == sorec.getLineItemValue('item', 'revrecstartdate', nextline) &&
				sorec.getLineItemValue('item', 'revrecenddate', trynext) == sorec.getLineItemValue('item', 'revrecenddate', nextline) )
			{
				done = true
			}
		}


		if (done)
		{
			var checkit4 = "4"
			form.addButton('custpageupstudent','Save & Done',"updatestudent("+checkit4+");");
			var checkit3 = "3"
			form.addButton('custpageupstudent','Save & Same',"updatestudent("+checkit3+");");
			nextline = 999
		}
		else
		{
			var checkit5 = "5"
			form.addButton('custpageupstudent','Save & Next',"updatestudent("+checkit5+");");
			var checkit2 = "2"
			form.addButton('custpageupstudent','Skip Item',"updatestudent("+checkit2+");");
			var checkit3 = "3"
			form.addButton('custpageupstudent','Save & Same',"updatestudent("+checkit3+");");
		}

		var checkit = "1"
		form.addButton('custpageupstudent','Select/Deselect',"updatestudent("+checkit+");");	

		
		//Populate Form
		itemidtext = '<style="font-weight:bold; font-size:125%; color:blue">' + itemidtext + '</span>'
		
		form.setFieldValues({custpageproduct: itemid, custpageproducttext: itemidtext, custpagecustomer: custname, custpagsenoschoollist: noinlist,
			custpagesorder: soid, custpagecustomerid: entitylist, custpagenobuildings: schools, custpagenobuildingshid: lineno1, custpagenolicense: qty, custpagemsgline: msgline, custpagemsgline2: msgline2,
			custpagecustomerorig: entityid, custpagenextline: nextline, custpagecurrentline: currentline, custpagestartdate: startdate, custpageenddate: enddate})
		currentitem.setDisplayType('disabled')
*/
		form.addSubmitButton('Select');
		var soid = 1
		var soURL = nlapiResolveURL('RECORD','salesorder', soid ,null);
		form.addButton('custpagesreturn', 'Generate', "document.location='"+soURL+"'" );
		form.addButton('custpagesreturn', 'Approve', "document.location='"+soURL+"'" );

		response.writePage(form);
		return;
	

	}
	else //OK, this is the Post
	{
		var params = new Object()
		var creditcardid = request.getParameter('custpage_credtcard');
		var interentid = request.getParameter('custpage_interentity');
		
		params.iecontrol = 0
		if (creditcardid != null && creditcardid != "")
		{
			params.ccrec = creditcardid
			params.iecontrol = 1
		}	
		if (interentid != null && interentid != "")
		{
			params.ierec = interentid
			params.iecontrol = 2
		}	


/*		var soid = nlapiGetRecordId();
		var a1 = request.getParameter('custpagedrilldown');
		params.entity = request.getParameter('custpagecustomerorig');
		params.soid = request.getParameter('custpagesorder');
		params.drilldown = request.getParameter('custpagedrilldown');*/

		nlapiSetRedirectURL('SUITELET', 324, 1, null, params);	
		return;
	
//		var soURL = nlapiResolveURL('RECORD','salesorder', soid ,null);
//		document.location=soURL		
		
	}


}

function reworkButton(type,form)
{

if ( type == 'view' )
	{
		var soid = nlapiGetRecordId();
		var entity = nlapiGetFieldValue('entity')

		//Lets go get the first non-invenotry line item
		var sorec = nlapiLoadRecord('salesorder', soid)
		var size = sorec.getLineItemCount('item')
		var nextline = 0
		for(x=1;x<=size;x++) 
		{
			var itemid = sorec.getLineItemValue('item','item', x)
			var rectype = nlapiLookupField('item', itemid, 'recordType');
			if (rectype = 'noninventoryitem')
			{
				nextline = x
				x = 999
			}
		}
		var firstime = 1
		var linkURL = nlapiResolveURL('SUITELET','customscript_stulicpopulate','customdeploy_stlicrework',null);
		form.addButton('custpageodcemail','Assign Student Licenses',"document.location='"+linkURL+"&soid="+soid+"&entity="+entity+"&nextline="+nextline+"&firstime="+firstime+"'");			

	}

}
