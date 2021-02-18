function exchangematch(type)
{
var currentContext = nlapiGetContext();
	if (currentContext.getExecutionContext != 'csvimport'){
	//Designed for Shareholder Representative Services - April 2012
	//Frank Foster - Grace Business Solutions
	//ffoster@grace-solutions.com - 314-831-0078
	
	//This is a User Event that will check and compare fields on the Exchange Record to see if DE1 and DE@ fields have been entered correctly
	//And indicate on the record if not.
	
	var status1 = nlapiGetFieldValue('custrecord_acq_loth_currentdestage1')
	var status2 = nlapiGetFieldValue('custrecord_acq_loth_currentdestage2')
	var time1 = nlapiGetFieldValue('custrecord_acq_loth_zzz_zzz_de1timestmp')
	var time2 = nlapiGetFieldValue('custrecord_acq_loth_zzz_zzz_de2timestmp')
	
	/*if (time1 != null && time1 != "" && time2 != null && time2 != "") //Already matched
	{
		return;
	}*/
	
	//Only Do Review Forms
	var custform = nlapiGetFieldValue('customform')
	if (custform == 154)
		var oktocontinue = true
	else
		return;
	
	if (status1 == 2 && status2 == 2)
		var oktocontinue = true
	//else
	//	return;
	
	nlapiLogExecution('Debug','Exchange Matching','Current = ' + nlapiGetRecordId());
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
	
	
	//Lets go get all the fields
	
	var exchangeid = nlapiGetRecordId()
	//var exchangeid = 908
	var exchangerec = nlapiLoadRecord('customrecord_acq_lot', exchangeid)
	var exchfields = exchangerec.getAllFields();
	exchfields.sort(); //Sort the fields so we'll have together
	
	var size = exchfields.length
	
	//Get PII masterkey
	var mastkey = retrievekeys(exchangerec)
	var mastkeyltn = mastkey[0].length
	if (mastkeyltn > 32)
	{
		mastkey[0] = mastkey[0].substring(0,32)
	}
	
	
	var de1_field_name
	var de2_field_name
	var mch_field_name
	
	var h = 0
	
	var formtbl = new Array();
	formtbl[0] = new Array(); //Form
	formtbl[1] = new Array(); //Form Count
	
	for(x=0;x<=size;x++) //Look for DE1 & DE2 Fields
	{
	
		var field = exchfields[x] 
		var field_grp = exchangerec.getField(field);
		if (field_grp != null && field_grp != "")
		{
			//Here we will cherry pick the field to compare
			var field_name = field_grp.getName();
			var field_split = field_name.split("_")
			if (field_split[4] == 'mch') //OK, this is a data entry field we should mtach to
			{
				
				h++
				
				mch_field_name = field_grp.getName();
				field_split[4] = 'de1'
				de1_field_name = field_split.join()
				de1_field_name = de1_field_name.replace(/,/g,"_")
				field_split[4] = 'de2'
				de2_field_name = field_split.join()
				de2_field_name = de2_field_name.replace(/,/g,"_")
	
				//Let's check for a match
				piifield1 = false
				piifield2 = false
				//First lets see if it needs to be Decrypted
				for(p=0;p<=size_pii-1;p++) 
				{
					if (de1_field_name == piifields[0][p])
					{
						//Decrypt DE101
						var field_name_enc = piifields[1][p]
						var datum_type = piifields[2][p]
						if (datum_type == 1)
							var datum_type = 0
						else
							var datum_type = 1
						var encfld1 = exchangerec.getFieldValue(field_name_enc)
						if (encfld1 != null && encfld1 != "")
							var plaintext1 = ACE.decrypt(encfld1, mastkey[0], Number(exchangeid), datum_type);
						else
							var plaintext1 = ""
						piifield1 = true
	//					nlapiLogExecution('Error','Encrypt','Current1 = ' + plaintext1 + ' fld=' + field_name_enc);
					}
					
					if (de2_field_name == piifields[0][p])
					{
						//Decrypt DE2
						var field_name_enc = piifields[1][p]
						var datum_type = piifields[2][p]
						if (datum_type == 1)
							var datum_type = 0
						else
							var datum_type = 1
						var encfld2 = exchangerec.getFieldValue(field_name_enc)
						if (encfld2 != null && encfld2 != "")
							var plaintext2 = ACE.decrypt(encfld2, mastkey[0], Number(exchangeid), datum_type);
						else
							var plaintext2 = ""
						piifield2 = true
						
	//					nlapiLogExecution('Error','Encrypt','Current2 = ' + plaintext2 + ' fld=' + field_name_enc);
					}
				}
				
	
				if (piifield1 || piifield2)
				{
					if (plaintext1 == plaintext2)
					{
						exchangerec.setFieldValue(mch_field_name, 2) //Matched
					}
					else
					{
						exchangerec.setFieldValue(mch_field_name, 1) //Not Matched
						var formno = field_split[3]
						var formtbl = accumform(formno, formtbl)
					}		
				}
				else
				{
					if (exchangerec.getFieldValue(de1_field_name) == exchangerec.getFieldValue(de2_field_name))
					{
						exchangerec.setFieldValue(mch_field_name, 2) //Matched
					}
					else
					{
						exchangerec.setFieldValue(mch_field_name, 1) //Not Matched
						var formno = field_split[3]
						var formtbl = accumform(formno, formtbl)
					}		
	
				}
		
			}
			if (h == 2)
			{
	//			break;
			}
		}
	
	}
	//Let go do Certificates now
	
	var filter_cert = new Array();
	filter_cert[0] = new nlobjSearchFilter('custrecord_acq_lotce_zzz_zzz_parentlot', null, 'anyof', exchangeid);
	var results_cert = nlapiSearchRecord('customrecord_acq_lot_cert_entry', null, filter_cert, null); 
	for (var j = 0; results_cert != null && j < results_cert.length; j++ )
	{
		
		var certid = results_cert[j].getId() 
		var certrec = nlapiLoadRecord('customrecord_acq_lot_cert_entry', certid) 
		var certmatch = true
	
		if (certrec.getFieldValue('custrecord_acq_lotce_3_de1_certnumber') == certrec.getFieldValue('custrecord_acq_lotce_3_de2_certnumber') )
		{
			certrec.setFieldValue('custrecord_acq_lotce_3_mch_certnumber', 2) //Matched
		}
		else
		{
			certrec.setFieldValue('custrecord_acq_lotce_3_mch_certnumber', 1) //Not Matched
			var formno = '3'
			var formtbl = accumform(formno, formtbl)
		}
	
		if (certrec.getFieldValue('custrecord_acq_lotce_3_de1_certtype') == certrec.getFieldValue('custrecord_acq_lotce_3_de1_certtype') )
		{
			certrec.setFieldValue('custrecord_acq_lotce_3_mch_certtype', 2) //Matched
		}
		else
		{
			certrec.setFieldValue('custrecord_acq_lotce_3_mch_certtype', 1) //Not Matched
			var formno = '3'
			var formtbl = accumform(formno, formtbl)
		}
	
		if (certrec.getFieldValue('custrecord_acq_lotce_3_de1_certdesc') == certrec.getFieldValue('custrecord_acq_lotce_3_de2_certdesc') )
		{
			certrec.setFieldValue('custrecord_acq_lotce_3_mch_certdesc', 2) //Matched
		}
		else
		{
			certrec.setFieldValue('custrecord_acq_lotce_3_mch_certdesc', 1) //Not Matched
			var formno = '3'
			var formtbl = accumform(formno, formtbl)
		}
	
		if (certrec.getFieldValue('custrecord_acq_lotce_3_de1_numbershares') == certrec.getFieldValue('custrecord_acq_lotce_3_de2_numbershares') )
		{
			certrec.setFieldValue('custrecord_acq_lotce_3_mch_numbershares', 2) //Matched
		}
		else
		{
			certrec.setFieldValue('custrecord_acq_lotce_3_mch_numbershares', 1) //Not Matched
			var formno = '3'	
			var formtbl = accumform(formno, formtbl)
		}
	
		if (certrec.getFieldValue('custrecord_acq_lotce_3_de1_lostcert') == certrec.getFieldValue('custrecord_acq_lotce_3_de2_lostcert') )
		{
			certrec.setFieldValue('custrecord_acq_lotce_3_mch_lostcert', 2) //Matched
		}
		else
		{
			certrec.setFieldValue('custrecord_acq_lotce_3_mch_lostcert', 1) //Not Matched
			var formno = '3'
			var formtbl = accumform(formno, formtbl)
		}
	
		if (certrec.getFieldValue('custrecord_acq_lotce_3_de1_comment') == certrec.getFieldValue('custrecord_acq_lotce_3_de1_comment') )
		{
			certrec.setFieldValue('custrecord_acq_lotce_3_mch_comment', 2) //Matched
		}
		else
		{
			certrec.setFieldValue('custrecord_acq_lotce_3_mch_comment', 1) //Not Matched
			var formno = '3'
			var formtbl = accumform(formno, formtbl)
		}
		
		nlapiSubmitRecord(certrec)
	}
	
	
	
	//Ok, lets fill in the form exceptions
	var size1 = formtbl[0].length
	for(y=0;y<=size1-1;y++)
	{
		if (formtbl[0][y] == '1')
		{
			exchangerec.setFieldValue('custrecord_acq_loth_1_zzz_form1except', formtbl[1][y])
		}
		if (formtbl[0][y] == '2')
		{
			exchangerec.setFieldValue('custrecord_acq_loth_2_zzz_form2except', formtbl[1][y])
		}
		if (formtbl[0][y] == '3')
		{
			exchangerec.setFieldValue('custrecord_acq_loth_3_zzz_form3except', formtbl[1][y])
		}
		if (formtbl[0][y] == '4')
		{
			exchangerec.setFieldValue('custrecord_acq_loth_4_zzz_form4except', formtbl[1][y])
		}
		if (formtbl[0][y] == '5a')
		{
			exchangerec.setFieldValue('custrecord_acq_loth_5a_zzz_form5aexcept', formtbl[1][y])
		}
		if (formtbl[0][y] == '5b')
		{
			exchangerec.setFieldValue('custrecord_acq_loth_5b_zzz_form5bexcept', formtbl[1][y])
		}
		if (formtbl[0][y] == '5c')
		{
			exchangerec.setFieldValue('custrecord_acq_loth_5c_zzz_form5cexcept', formtbl[1][y])
		}
		if (formtbl[0][y] == '6')
		{
			exchangerec.setFieldValue('custrecord_acq_loth_6_zzz_form6except', formtbl[1][y])
		}
		if (formtbl[0][y] == '7')
		{
			exchangerec.setFieldValue('custrecord_acq_loth_7_zzz_form7except', formtbl[1][y])
		}
	}
	
	var date = new Date()
	var dateTime = nlapiDateToString(date, 'datetimetz');
	exchangerec.setFieldValue('custrecord_acq_loth_zzz_zzz_de1timestmp', dateTime) 
	exchangerec.setFieldValue('custrecord_acq_loth_zzz_zzz_de2timestmp', dateTime) 
	
	nlapiSubmitRecord(exchangerec)
	}
}

function accumform(formno, formtbl)
{
	var cnt
	var size = formtbl[0].length
	if (size == 0)
	{
		formtbl[0][0] = formno
		formtbl[1][0] = 1
	}
	else
	{
		var added = false
		for(z=0;z<=size-1;z++) 
		{
			if (formtbl[0][z] == formno)
			{
				formtbl[0][z] = formno
				formtbl[1][z] = formtbl[1][z] + 1
				added = true
			}
		}
		if (!added)
		{
			formtbl[0][z] = formno
			formtbl[1][z] = 1
		}
	}

return formtbl;
}



function exchangematchbl(type, form)
{
//Designed for Shareholder Representative Services - April 2012
//Frank Foster - Grace Business Solutions
//ffoster@grace-solutions.com - 314-831-0078


//form.getField('custrecord_acq_loth_5c_mch_checkspayto').setDisplaySize(100,0)
//form.getField('custrecord_acq_loth_5c_mch_checkspayto').setDisplayType('readonly').setPadding(.5)
//form.getField('custrecord_acq_loth_5c_mch_checksmailto').setDisplayType('readonly').setPadding(.5)
//form.getField('custrecord_acq_loth_5c_mch_checksaddr1').setDisplayType('readonly').setPadding(.5)
//form.getField('custrecord_acq_loth_5c_mch_checksaddr2').setDisplayType('readonly').setPadding(.5)
	nlapiSetFieldValue('custrecord_acq_loth_5c_mch_checkspayto', 2, false) //Matched
	window.document.main_form.custrecord_acq_loth_5c_mch_checkspayto_fs_send.style.backgroundColor='ff99cc';

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
