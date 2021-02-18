function excdatacoll(request,response)
{
//Designed for Shareholder Representative Services - April 2012
//Frank Foster - Grace Business Solutions
//ffoster@grace-solutions.com - 314-831-0078

//This is a Suitelet that will allow the Data Collection of DE1 & DE2 fields for Exchange records.  Using the naming convention of the data entery fields
//a dynamic form will be built with the DE fields specifcially for certain Dat Collection users.  Once all DE1 fields are populated, the Suitelet will then allow the entry
//of DE2 fields.  Both may  be in a state of "incomplete"

//Data Entry Stages
//0 - Not Started
//1 - Partially Complete
//2 - Complete

if ( request.getMethod() == 'GET' )
{
	
	var message = 0;
	var oktocontinue = true
	var estring;

	var exchangeid = request.getParameter('exchid');
//	var exchangeid = 203
//	var exchangeid = 908
	if (exchangeid == null || exchangeid == "")
	{
		message = 1
		oktocontinue = false
	}
	else
	{
		try
		{
			var exchangerec = nlapiLoadRecord('customrecord_acq_lot', exchangeid)
			var destage1 = exchangerec.getFieldValue('custrecord_acq_loth_currentdestage1')
			var destage2= exchangerec.getFieldValue('custrecord_acq_loth_currentdestage2')
			var deuser1 = exchangerec.getFieldValue('custrecord_acq_loth_currentdeuser1')
			var deuser2 = exchangerec.getFieldValue('custrecord_acq_loth_currentdeuser2')
			//Check the User and Set the form
			var user = nlapiGetUser()
			//Effective Feb. 2014 DE1 done only by DE1 Data Entry Role and DE2 only done by DE2 Role
			var environment = nlapiGetContext().getEnvironment()
			var role = nlapiGetRole()

			//Effectve May 2014 we will check roles via a dynamic table
			var filter_entry = new Array();
			filter_entry[0] = new nlobjSearchFilter('custrecord_edc_employee', null, 'is', user);
			var columns_entry = new Array();
			columns_entry[0] = new nlobjSearchColumn('custrecord_edc_de1');
			columns_entry[1] = new nlobjSearchColumn('custrecord_edc_de2');
			var results_entry = nlapiSearchRecord('customrecord_exchangereps', null, filter_entry, columns_entry); 
			if (results_entry != null)
			{
				var deck1 = results_entry[0].getValue('custrecord_edc_de1')
				var deck2 = results_entry[0].getValue('custrecord_edc_de2')
				if (deck1 == 'T')
					var defields = 'de1'
				else
					if (deck2 == 'T')
						var defields = 'de2'
					else
					{
						message = 7
						oktocontinue = false
					}
			}
			else
			{
				message = 5
				oktocontinue = false
			}



/*			if(environment == "PRODUCTION")
			{
				if (role == 1057)
					var defields = 'de1'
				else
					if (role == 1054)
						var defields = 'de2' //DE2 = 1054
					else
					{
						message = 5
						oktocontinue = false
					}
			}
			else
			{
				if (role == 1052)
					var defields = 'de1'
				else
					if (role == 1053)
						var defields = 'de2' //DE2 = 1053
					else
					{
						message = 5
						oktocontinue = false
					}
					
			}*/
			
			//Same user that started must complete the Data Entry
			if (defields == 'de1' && oktocontinue)
			{
				if (deuser1 != null && deuser1 != "")
				{
					if (destage1 == 1 && user != deuser1)
					{
						message = 4
						oktocontinue = false
					}
				}
			}
			else
			{
				if (deuser2 != null && deuser2 != "" && oktocontinue)
				{
					if (destage2 == 1 && user != deuser2)
					{
						message = 4
						oktocontinue = false
					}
				}
			}
			
			if (exchangerec.getFieldValue('custrecord_acq_loth_reviewcomplete') == 'T') //If reviewed - do not allow
			{
				message = 6
				oktocontinue = false
			}

		}
		catch (e)
		{
			message = 2
			var estring = e.toString()
			oktocontinue = false
		}
	}
	
	if (oktocontinue)
	{			
		//Let's see where we are in the data collection process for this record
//		var destage = 0
		
		if (destage1 == 2 && defields == 'de1') //Data Entry is complete
		{
			message = 3
			createform(message, estring)
		}
		if (destage2 == 2 && defields == 'de2') //Data Entry is complete
		{
			message = 3
			createform(message, estring)
		}
		else
		{				
			//Lets get all the fields and send out the form or send back an error message
//			var exchfields = exchangerec.getAllFields();
			var exchfields = ""
			createform(message, estring, exchfields, exchangerec, exchangeid)
		}
	}
	else
	{
		//Send Error
		createform(message, estring)
	}
	
	

}
else //OK, this is the Post
{
	
	var i = 1
	
}

}


function createform(message, estring, exchfields, exchangerec, exchangeid)
{
	var form = nlapiCreateForm('Add/Update Exchange & Certificate Detail');  //Setup the generation form
	form.addTab('custpagetab1', 'Exchange Record')
	form.addTab('custpagetab2', 'Certificates')

	var msgline = form.addField('custpage_msgline','inlinehtml', null, null)	

	if (message == 0){var msgline = '<span style="font-weight:bold; font-size:130%; color:red">' + 'Please Begin Entry of Data Fields</span>'}
	else
	if (message == 1){var msgline = '<span style="font-weight:bold; font-size:110%; color:red">' + 'Fatal Error - No Exchange Record Key Found</span>'}
	else
	if (message == 2){var msgline = '<span style="font-weight:bold; font-size:110%; color:red">' + 'Fatal Error Retrieving Exchange Record- ' + estring + '</span>'}
	else
	if (message == 3){var msgline = '<span style="font-weight:bold; font-size:110%; color:green">' + 'Data Entry Has Been Completed For This Record</span>'}
	else
	if (message == 4){var msgline = '<span style="font-weight:bold; font-size:110%; color:red">' + 'Record Partially Entered - Must Be The Same User</span>'}
	else
	if (message == 5){var msgline = '<span style="font-weight:bold; font-size:110%; color:red">' + 'Cannot Continue - Must Be Data Collection Role 1 or Data Collection Role 2</span>'}
	else
	if (message == 6){var msgline = '<span style="font-weight:bold; font-size:130%; color:red">' + 'Exchange Record Is In Review - Disallowed</span>'}
	else
	if (message == 7){var msgline = '<span style="font-weight:bold; font-size:130%; color:red">' + 'Cannot Continue - Your Role Must Be Deignated Either DE1 or DE2</span>'}
	else
	var msgline = '<span style="font-weight:bold; font-size:110%; color:blue">' + 'Please enter required field to Generate Key </span>'

	if (message != 0)
	{
		form.setFieldValues({custpage_msgline: msgline})
		response.writePage(form);
		return;
	}
	
	//Lets Load PII Data Encryptions fields, as we'll need to know if we need to decrypt them
	var columns_fields = new Array();
	columns_fields[0] = new nlobjSearchColumn('custrecord_pii_fieldinternal');
	columns_fields[1] = new nlobjSearchColumn('custrecord_pii_cipherfield');
	columns_fields[2] = new nlobjSearchColumn('custrecord_pii_datumtype');
	var piifields = new Array();
	piifields[0] = new Array(); //Internal Id
	piifields[1] = new Array(); //Cipher Field
	piifields[2] = new Array(); //Field Type

	var fld_results = nlapiSearchRecord('customrecord_piifields', null, null, columns_fields);
	for (var f = 0; fld_results != null && f < fld_results.length; f++ )
	{
		piifields[0][f] = fld_results[f].getValue('custrecord_pii_fieldinternal')
		piifields[1][f] = fld_results[f].getValue('custrecord_pii_cipherfield')
		piifields[2][f] = fld_results[f].getValue('custrecord_pii_datumtype')
	}
	var size_pii = piifields[0].length
	
	//Get PII masterkey
	var mastkey = retrievekeys(exchangerec)
	var mastkeyltn = mastkey[0].length
	if (mastkeyltn > 32)
	{
		mastkey[0] = mastkey[0].substring(0,32)
	}

	form.addField('custpage_piimsg','text', null, null).setDisplayType('hidden')
	form.addField('custpage_piimsg_1','text', null, null).setDisplayType('hidden')
//	nlapiLogExecution('Error','Opportunity','Key = ' + mastkey[0]);

	form.addField('custpage_complete','checkbox', 'Check If Complete')//.setBreakType('startcol')//.setPadding(1)//.setLayoutType('normal')
	var alterations = form.addField('custpage_alterations','select', 'Any Alterations To Text?')//.setBreakType('startcol')//.setPadding(1)//.setLayoutType('normal')
	alterations.addSelectOption('1','-'); alterations.addSelectOption('2','Yes'); alterations.addSelectOption('3', 'No');
	alterations.setDefaultValue('1')

	//form.addField('custpage_lotdocimaage_1','text','LOT Received Document Image').setBreakType('startcol').setDisplayType('inline');
	var imagefld = form.addField('custpage_lotdocimaage','inlinehtml','LOT Received Document Image')//.setPadding(1)//.setLayoutType('normal')

	form.addField('custpage_currentde','text', 'Current DE Field', null, 'custpagetab1').setDisplayType('hidden')
	form.addField('custpage_formfields','longtext', 'Form Fields', null, 'custpagetab1').setDisplayType('hidden')
	form.addField('custpage_exchangeid','integer', 'Exchange Record Id', null, 'custpagetab1').setDisplayType('hidden')



	//Effective Feb. 2014 DE1 done only by DE1 Data Entry Role and DE2 only done by DE2 Role
	var environment = nlapiGetContext().getEnvironment()
	var role = nlapiGetRole()
	if(environment == "PRODUCTION")
	{
		if (role == 1057)
			var defields = 'de1'
		else
			var defields = 'de2' //DE2 = 1053
	}
	else
	{
		if (role == 1052)
			var defields = 'de1'
		else
			var defields = 'de2' //DE2 = 1054
	}

	//Load up the array of field to go on the form
	var formfields = new Array();
	var ff = 0
	var firstfield = true
	
//	exchfields.sort();
//	var size = exchfields.length
	var field_name
	var field_label
	var field_type
	var field_mandatory
	var ffield_group
	
	//Here will will override the exchange fields so we ay dictate the sequence of the field on the form
	var exccol = new Array();
	exccol[0] = new nlobjSearchColumn('custrecord_acq_formgroups').setSort(true)
	exccol[1] = new nlobjSearchColumn('custrecord_acq_exchsequence').setSort()
	exccol[2] = new nlobjSearchColumn('custrecord_acq_exchlabel');
	exccol[3] = new nlobjSearchColumn('custrecord_acq_exchname');
	exccol[4] = new nlobjSearchColumn('custrecord_acq_exchtype');
	exccol[5] = new nlobjSearchColumn('custrecord_acq_exchlmandatory');
	exccol[6] = new nlobjSearchColumn('custrecord_acq_fieldrow');

	var exchseq = nlapiSearchRecord('customrecord_acq_exchsequence', null, null, exccol); 

	for (var x = 0; exchseq != null && x < exchseq.length; x++ ) //Format the fields
	{
		if (x == 3)
		{
//			break;
		}
		field_name = exchseq[x].getValue('custrecord_acq_exchname')
		field_label = exchseq[x].getValue('custrecord_acq_exchlabel')
		field_type = exchseq[x].getValue('custrecord_acq_exchtype')
		field_mandatory = exchseq[x].getValue('custrecord_acq_exchlmandatory')
		field_group = exchseq[x].getValue('custrecord_acq_formgroups')
		field_row = exchseq[x].getValue('custrecord_acq_fieldrow')
		if (field_group == null || field_group == "")
		{
			field_group = 9
		}
		form.addFieldGroup('custpage_group9', 'Signature Page', 'custpagetab1');
		form.addFieldGroup('custpage_group1', 'Registered Holder Information - FORM 1', 'custpagetab1');
		form.addFieldGroup('custpage_group2', 'Taxpayer Identification Number and Certification - FORM 2', 'custpagetab1');
		form.addFieldGroup('custpage_group3', 'Certificates Enclosed - FORM 3', 'custpagetab2');
		form.addFieldGroup('custpage_group4', 'Payment Method - FORM 4', 'custpagetab1');
		form.addFieldGroup('custpage_group5', 'Payment Instructions: Direct Deposit (ACH) Information - FORM 5A', 'custpagetab1');
		form.addFieldGroup('custpage_group6', 'Payment Instructions: Wire Transfer Information - FORM 5B', 'custpagetab1');
		form.addFieldGroup('custpage_group7', 'Payment Instructions : Check Payment Information - FORM 5C', 'custpagetab1');
		form.addFieldGroup('custpage_group8', 'Medallion Guarantee - FORM 6', 'custpagetab1');

		if (field_mandatory == 'true')
			field_mandatory = true
		else
			field_mandatory = false

		//Here we will cherry pick the field to go on the form
		var field_split = field_name.split("_")
		if (field_split[4] == defields) //OK, this is a data entry field
		{

			formfields[ff] = field_name + '*' + field_mandatory + '*' + field_label  //Send the field name to the update - canot do a getField in Client Script
			ff++
							
			var custpage = 'custpage_' + field_name
			var custpage_hid = 'custpage_' + field_name + '_hid'
			var custpage_enc = 'custpage_' + field_name + '_enc'
			
			//Tweak the field formatting
			
			if (field_row == 'T')
			{
				firstfield = true
			}

			if (firstfield)
			{
				var layout1 = 'outsidebelow'
				var layout2 = 'startrow'
//				var layout2 = 'none'

			}
			else
			{
				var layout1 = 'outsidebelow'
/*				if (field_row == 'T')
				{
					var layout2 = 'startrow'
				}
				else*/
					var layout2 = 'startcol'
				
			}

			
//			var first3 = field_label.substring(0,15)
//			nlapiLogExecution('Error','Opportunity','Current = ' + first3 + ' ' + field_type + ' ' + firstfield);

			var grpidx = 'custpage_group' + field_group
			
			field_label = field_label.replace("DE1-", "")
			field_label = field_label.replace("DE2-", "")

			if (field_type != 'select')
			{
				fldadd = form.addField(custpage, field_type, field_label, null, grpidx).setMandatory(field_mandatory).setLayoutType(layout1, layout2)
				fldadd_hid = form.addField(custpage_hid, field_type, field_label + '_hid', null, grpidx).setDisplayType('hidden')
				fldadd_enc = form.addField(custpage_enc, 'checkbox', field_label + '_enc', null, grpidx).setDisplayType('hidden')

				//Lets see if an encryption field
				var encrypt = false
				for(p=0;p<=size_pii-1;p++) 
				{
					if (field_name == piifields[0][p])
					{
						encrypt = true
						var field_name_enc = piifields[1][p]
						var datum_type = piifields[2][p]
						if (datum_type == 1)
							var datum_type = 0
						else
							var datum_type = 1
//						nlapiLogExecution('Error','Encrypt','Current = ' + field_name);
						break;
					}
				}

				if (encrypt && (exchangerec.getFieldValue(field_name_enc) != null && exchangerec.getFieldValue(field_name_enc) != ""))
				{					
					var internalid = exchangerec.getId()
					var encfld = exchangerec.getFieldValue(field_name_enc)
//					nlapiLogExecution('Error','Encrypt','Current1 = ' + field_name_enc + ' ' + exchangerec.getFieldValue(field_name_enc) + ' ' + mastkey[0] + ' ' + Number(internalid) + ' ' + datum_type);
					var plaintext = ACE.decrypt(encfld, mastkey[0], Number(internalid), datum_type);
					fldadd.setDefaultValue(plaintext)
					fldadd_hid.setDefaultValue(plaintext)
					fldadd_enc.setDefaultValue('T')
				}
				else
				{ 
					if (exchangerec.getFieldValue(field_name) != null && exchangerec.getFieldValue(field_name) != "")
					{
						fldadd.setDefaultValue(exchangerec.getFieldValue(field_name))
						fldadd_hid.setDefaultValue(exchangerec.getFieldValue(field_name))
						fldadd_enc.setDefaultValue('F')
					}						
				}
					
				if (firstfield)
					firstfield = false
				else
					firstfield = true
			}
			else
			{					
				var fldadd = form.addField(custpage, field_type, field_label, null, grpidx).setMandatory(field_mandatory).setLayoutType(layout1, layout2)
				var fldadd_hid = form.addField(custpage_hid, field_type, field_label + '_hid', null, grpidx).setDisplayType('hidden')
				if (firstfield)
					firstfield = false
				else
					firstfield = true

				var optfield = exchangerec.getField(field_name)
				var options = optfield.getSelectOptions();
				
				fldadd.addSelectOption(0, ""); //Default to blank
				fldadd_hid.addSelectOption(0, ""); //Default to blank
				for (var i = 0; i != options.length; ++i)
				{
				   fldadd.addSelectOption(options[i].getId(), options[i].getText());
				   fldadd_hid.addSelectOption(options[i].getId(), options[i].getText());
				}

				if (exchangerec.getFieldValue(field_name) != null && exchangerec.getFieldValue(field_name) != "")
				{
					fldadd.setDefaultValue(exchangerec.getFieldValue(field_name))
					fldadd_hid.setDefaultValue(exchangerec.getFieldValue(field_name))
				}
				else
				{
					fldadd.setDefaultValue(0)
					fldadd_hid.setDefaultValue(0)		
				}			
			} 
		}
	}

	//Lets add the Certificates subtab
	
	var filter_cert = new Array();
	filter_cert[0] = new nlobjSearchFilter('custrecord_acq_lotce_zzz_zzz_parentlot', null, 'anyof', exchangeid); 
	var columns_cert = new Array();
	columns_cert[0] = new nlobjSearchColumn( 'custrecord_acq_lotce_3_de1_certnumber');
	columns_cert[1] = new nlobjSearchColumn( 'custrecord_acq_lotce_3_de2_certnumber');
	columns_cert[2] = new nlobjSearchColumn( 'custrecord_acq_lotce_3_de1_numbershares');
	columns_cert[3] = new nlobjSearchColumn( 'custrecord_acq_lotce_3_de2_numbershares');
	columns_cert[4] = new nlobjSearchColumn( 'custrecord_acq_lotce_3_de1_comment');
	columns_cert[5] = new nlobjSearchColumn( 'custrecord_acq_lotce_3_de2_comment');
	columns_cert[6] = new nlobjSearchColumn( 'custrecord_acq_lotce_3_de1_lostcert');
	columns_cert[7] = new nlobjSearchColumn( 'custrecord_acq_lotce_3_de2_lostcert');
	
	form.addField('custpage_certtitle','inlinehtml', 'Add/Change/Delete Certificates', null, 'custpage_group3')
	var sublist = form.addSubList('custpagesublistcust','list','Certificates', 'custpagetab2');

	// add fields to the sublist
	sublist.addField('custpagedelete','checkbox', 'Delete').setDisplayType('entry')
	sublist.addField('custpagecertno','float', 'Cert#')//.setDisplayType('inline')
	sublist.addField('custpagecert','text', 'CN) Certificate Number').setDisplayType('entry')
	sublist.addField('custpagecert_hid','text', 'CN) Certificate Number').setDisplayType('hidden')
	sublist.addField('custpageshares','currency', 'SH) Number of Shares').setDisplayType('entry')
	sublist.addField('custpageshares_hid','currency', 'SH) Number of Shares').setDisplayType('hidden')
	var lost1 = sublist.addField('custpagelost','select', 'LS1) Lost Certificate?').setDisplayType('entry')
	var lost2 = sublist.addField('custpagelost_hid','select', 'LS1) Lost Certificate?').setDisplayType('hidden')
//	sublist.addField('custpagecomment','text', 'Comment').setDisplayType('entry') Comments removed per B. Price 3/2014
//	sublist.addField('custpagecomment_hid','text', 'Comment').setDisplayType('hidden')
	sublist.addField('custpagecertid','integer', 'Certificate Id').setDisplayType('hidden')

	lost1.addSelectOption('1','Yes'); lost1.addSelectOption('2', 'No');
	lost2.addSelectOption('1','Yes'); lost2.addSelectOption('2', 'No');
	lost1.setDefaultValue(1)	
	lost2.setDefaultValue(1)	

	var lineno = 0
	
	var certificates = nlapiSearchRecord('customrecord_acq_lot_cert_entry', null, filter_cert, columns_cert); 
	for ( var y = 0; certificates != null && y < certificates.length; y++ )
	{
		
		lineno++
		sublist.setLineItemValue('custpagecertno', lineno, lineno.toFixed(0));
		if (defields == 'de1')
		{
			sublist.setLineItemValue('custpagecert', lineno, certificates[y].getValue('custrecord_acq_lotce_3_de1_certnumber'));
			sublist.setLineItemValue('custpagecert_hid', lineno, certificates[y].getValue('custrecord_acq_lotce_3_de1_certnumber'));
			sublist.setLineItemValue('custpageshares', lineno, certificates[y].getValue('custrecord_acq_lotce_3_de1_numbershares'));
			sublist.setLineItemValue('custpageshares_hid', lineno, certificates[y].getValue('custrecord_acq_lotce_3_de1_numbershares'));
			sublist.setLineItemValue('custpagelost', lineno, certificates[y].getValue('custrecord_acq_lotce_3_de1_lostcert'));
			sublist.setLineItemValue('custpagelost_hid', lineno, certificates[y].getValue('custrecord_acq_lotce_3_de1_lostcert'));
//			sublist.setLineItemValue('custpagecomment', lineno, certificates[y].getValue('custrecord_acq_lotce_3_de1_comment'));
//			sublist.setLineItemValue('custpagecomment_hid', lineno, certificates[y].getValue('custrecord_acq_lotce_3_de1_comment'));
			sublist.setLineItemValue('custpagecertid', lineno, certificates[y].getId() );
		}
		else
		{
			sublist.setLineItemValue('custpagecert', lineno, certificates[y].getValue('custrecord_acq_lotce_3_de2_certnumber'));
			sublist.setLineItemValue('custpagecert_hid', lineno, certificates[y].getValue('custrecord_acq_lotce_3_de2_certnumber'));
			sublist.setLineItemValue('custpageshares', lineno, certificates[y].getValue('custrecord_acq_lotce_3_de2_numbershares'));
			sublist.setLineItemValue('custpageshares_hid', lineno, certificates[y].getValue('custrecord_acq_lotce_3_de2_numbershares'));
			sublist.setLineItemValue('custpagelost', lineno, certificates[y].getValue('custrecord_acq_lotce_3_de2_lostcert'));
			sublist.setLineItemValue('custpagelost_hid', lineno, certificates[y].getValue('custrecord_acq_lotce_3_de2_lostcert'));
//			sublist.setLineItemValue('custpagecomment', lineno, certificates[y].getValue('custrecord_acq_lotce_3_de2_comment'));
//			sublist.setLineItemValue('custpagecomment_hid', lineno, certificates[y].getValue('custrecord_acq_lotce_3_de2_comment'));
			sublist.setLineItemValue('custpagecertid', lineno, certificates[y].getId() );
		}
	}

	//Open up to xx lines
	lineno++
	for(z=lineno;z<=50;z++) 
	{
		sublist.setLineItemValue('custpagecertno', lineno, lineno.toFixed(0));
		sublist.setLineItemValue('custpagecert', lineno, "");
		sublist.setLineItemValue('custpagecert_hid', lineno, "");
		sublist.setLineItemValue('custpageshares', lineno, "");
		sublist.setLineItemValue('custpageshares_hid', lineno, "");
		sublist.setLineItemValue('custpagelost', lineno, "");
		sublist.setLineItemValue('custpagelost_hid', lineno, "");
//		sublist.setLineItemValue('custpagecomment', lineno, "");
//		sublist.setLineItemValue('custpagecomment_hid', lineno, "");
		sublist.setLineItemValue('custpagecertid', lineno, "" );
		lineno++
	}

	form.setScript('customscript_exdatacollupd');
	form.addButton('custpage_updateform','Save/Update Exchange Record',"excdatacollup("+exchangeid+");");

	var ff1 = formfields.toString(); //Set array to string

	var docimage = exchangerec.getFieldValue('custrecord_acq_loth_zzz_zzz_rcvddocimage')
	var imagefile = nlapiLoadFile(docimage);
	//Get the URL for the file
	var imageurl = imagefile.getURL();
	imageurl = 'https://system.na2.netsuite.com' + imageurl
	var imagename = imagefile.getName();
	var imagehtml = '';
//	imagehtml += "<a href="+imageurl+" style=color:#0000FF>"+imagename+"</a>"
	imagehtml += "<a href="+imageurl+" style=color:#CC0000>"+imagename+"</a>"
	imagefld.setDefaultValue(imagehtml);

	form.setFieldValues({custpage_msgline: msgline, custpage_currentde: defields, custpage_formfields: ff1, custpage_exchangeid: exchangeid,
	custpage_piimsg: mastkey[0], custpage_piimsg_1: mastkey[1]})
	response.writePage(form);
}


function retrievekeys(exchangerec)
{
	//Go get current Key Name, unless this records used a master key before - if so use that key

	var mastkeyused = exchangerec.getFieldValue('custrecord_acq_piimasterkeyused')
	if (mastkeyused == null || mastkeyused == "")
	{
		var filter_name = new Array();
		filter_name[0] = new nlobjSearchFilter('custrecord_kp_currentkey', null, 'is', 'T');
	}
	else
	{
		var filter_name = new Array();
		filter_name[0] = new nlobjSearchFilter('internalid', null, 'is', mastkeyused);
	}
	
	var columns_name = new Array();
	columns_name[0] = new nlobjSearchColumn('custrecord_kp_generation');
	columns_name[1] = new nlobjSearchColumn('custrecord_kp_keyname');
	var name_results = nlapiSearchRecord('customrecord_piikeystable', null, filter_name, columns_name);
	if (name_results == null)
	{
		throw new AceError('PII Field Management: Current Master Key Not Found');
		return false;
	}
	else
		mastkeyused = name_results[0].getId()



	//Retrieve stored Keys
	var firstname =  name_results[0].getValue('custrecord_kp_generation')
	var lastname = name_results[0].getValue('custrecord_kp_keyname')

	var filter_key = new Array();
	filter_key[0] = new nlobjSearchFilter('firstname', null, 'is', firstname);
	filter_key[1] = new nlobjSearchFilter('lastname', null, 'is', lastname);
	var columns_key = new Array();
	columns_key[0] = new nlobjSearchColumn('socialsecuritynumber');

	var mast_keys = new Array();

	//Go get current master keys
	var key_results = nlapiSearchRecord('employee', null, filter_key, columns_key);

	if (key_results.length != 6) //We must have 6 Keys
	{
		throw new AceError('PII Field Management: Incorrect Number of Keys');
		return false;

	}

	//Stack keys for ACE.key call
	var triplets = ""

	for (var y = 0; key_results != null && y < key_results.length; y++ )
	{		
		var empid = key_results[y].getId()
		var emprec = nlapiLoadRecord('employee', empid)
		var ssn = emprec.getFieldValue('socialsecuritynumber')
//		if (y == 5)
//			triplets += key_results[y].getValue('socialsecuritynumber').substring(0,3)
//		else
//			triplets += key_results[y].getValue('socialsecuritynumber').substring(0,9)				
		if (y == 5)
			triplets += ssn.substring(0,3)
		else
			triplets += ssn.substring(0,9)				
	}
	
	if (triplets.length != 48)
	{
		throw new AceError('PII Field Management: Master Key Retrieval Faliure');
		return false;
	}

	//Go get hex version of key	
	var hex_key = ACE.key_from_digits(triplets)
	
	return [hex_key, mastkeyused]

}
