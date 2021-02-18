function decrypiifields(type,form)
{

//Designed for Shareholder Representative Services - August 2013
//Frank Foster - Grace Business Solutions
//ffoster@grace-solutions.com - 314-831-0078

//This is a Before Load that will manage the retrieval of PII fields for various transactions within SRS

//First let's get the list of managed PII Fields

var role = nlapiGetRole()
if (role == 1052) //DE User1
{
	return;
}

var currentContext = nlapiGetContext();
var ckcontext = currentContext.getExecutionContext(); //Check for web services entry web services

if ((type == 'view' || type == 'edit') /*&& (nlapiGetFieldValue('custrecord_acq_loth_reviewcomplete') == 'T')*/ || ckcontext == 'webservices')
{
	//Assumption - nlapiGetRecordType not needed as only deployed on affected transacton

/*	var rec-type = nlapiGetRecordType()
	if (rec-type == null)
	{
		//No fields 
		return;
	}*/

	//Go get Master Keys for decryption 
	var mastkey = retrievekeys()
	var mastkeyltn = mastkey[0].length
	if (mastkeyltn > 32)
	{
		mastkey[0] = mastkey[0].substring(0,32)
	}
	
//	var internalid = nlapiGetFieldValue('entity')
	var internalid = nlapiGetRecordId()

	//Get Users Role Properties
	var role = nlapiGetRole()

	var filter_role = new Array();
	filter_role[0] = new nlobjSearchFilter('custrecord_ace_acerole', null, 'anyof', role);
	var columns_role = new Array();
	columns_role[0] = new nlobjSearchColumn('custrecord_ace_viewencrypted');
	columns_role[1] = new nlobjSearchColumn('custrecord_ace_viewelided');
	columns_role[2] = new nlobjSearchColumn('custrecord_ace_rwencrypted');
	var role_results = nlapiSearchRecord('customrecord_aceroles', null, filter_role, columns_role);
	

	//Now lets see if there any fields that need to be decyrted for intitial display
	var columns_fields = new Array();
	columns_fields[0] = new nlobjSearchColumn('custrecord_pii_fieldinternal');
	columns_fields[1] = new nlobjSearchColumn('custrecord_pii_cipherfield');
	columns_fields[2] = new nlobjSearchColumn('custrecord_pii_datumtype');

//	nlapiSetFieldValue('custbody_aqm_1_bankaccountnumber_disp', 'Hello Frank', false)
	
	var fld_results = nlapiSearchRecord('customrecord_piifields', null, null, columns_fields);
	for (var x = 0; fld_results != null && x < fld_results.length; x++ )
	{
		var currentfield = fld_results[x].getValue('custrecord_pii_fieldinternal')
		var currentfield_enc = fld_results[x].getValue('custrecord_pii_cipherfield')
		nlapiLogExecution('Error','Fldname','Current = ' + currentfield_enc);
		if (nlapiGetFieldValue(currentfield_enc) )
		{
			
			var datum_type_rec = fld_results[x].getValue('custrecord_pii_datumtype')
			if (datum_type_rec == 1)
				var datum_type = 0
			else
				var datum_type = 1
			
			//Decrypt data field
			var encfld = nlapiGetFieldValue(currentfield_enc)
			var plaintext = ACE.decrypt(encfld, mastkey[0], Number(internalid), datum_type);
			nlapiLogExecution('Error','Fldname','Matched = ' + plaintext + '  enc=' + encfld + ' mast=' + mastkey[0] + ' int=' + internalid + ' dat=' + datum_type);

			//Display plaintext according to Users Role Properties
			if (role_results == null  ||
				(role_results[0].getValue('custrecord_ace_rwencrypted') != 'T' &&
				 role_results[0].getValue('custrecord_ace_viewelided') != 'T' &&
				 role_results[0].getValue('custrecord_ace_viewencrypted') != 'T') ) //Cannot See or Modify
			{
				
//				---> Replace plaintext with all xxxxx
				plaintext = "xxxxxxxxxxxxxxxx"
				nlapiSetFieldValue(currentfield, plaintext, false)
			}
			else
				if (role_results[0].getValue('custrecord_ace_rwencrypted') == 'T') //Full Read Write Access
				{
					nlapiSetFieldValue(currentfield, plaintext, false)
				}
				else
					if (role_results[0].getValue('custrecord_ace_viewelided') == 'T')
					{
//						---> Replace plaintext to see last 4
						var last4 = 'xxxxxxxxxx-' + plaintext.substring(plaintext.length - 4, (plaintext.length - 4) + 4) 
						var curr1 =	nlapiSetFieldValue(currentfield, last4, false)
						form.getField(currentfield).setDisplayType('disabled');
					}
					else //Must be View Encrypted 
					{
						var plaintext = "xxxxxxxxxxxxxxxx"
						nlapiSetFieldValue(currentfield, plaintext, false)
						form.getField(currentfield).setDisplayType('disabled');
					}
			}
		}
	}
}

function retrievekeys()
{
	//Go get current Key Name, unless this records used a master key before - if so use that key

	var mastkeyused = nlapiGetFieldValue('custrecord_acq_piimasterkeyused')
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


function encrypiifields(type,name)
{
	
//This is a After Submit that will manage the storage of PII fields for various transactions within SRS

//First let's see if this is a field for encryption

//If a read write role we should encrypt the field

var columns_fields = new Array();
columns_fields[0] = new nlobjSearchColumn('custrecord_pii_fieldinternal');
columns_fields[1] = new nlobjSearchColumn('custrecord_pii_cipherfield');
columns_fields[2] = new nlobjSearchColumn('custrecord_pii_datumtype');

var fld_results = nlapiSearchRecord('customrecord_piifields', null, null, columns_fields);
for (var x = 0; fld_results != null && x < fld_results.length; x++ )
{
	var currentfield = fld_results[x].getValue('custrecord_pii_fieldinternal')
	var currentfield_enc = fld_results[x].getValue('custrecord_pii_cipherfield')
	
	if (nlapiGetFieldValue(currentfield) )
	{
		//Go get Master Keys for decryption 
		var rectype = nlapiGetRecordType()
		var plaintext = nlapiGetFieldValue(currentfield)
		var mastkey = retrievekeys()
		var mastkeyltn = mastkey[0].length
		if (mastkeyltn > 32)
		{
			mastkey[0] = mastkey[0].substring(0,32)
		}

		var mastkeyltn = mastkey[0].length
//		var internalid = nlapiGetFieldValue('entity')
		var internalid = nlapiGetRecordId()

		//Get Users Role Properties
		var role = nlapiGetRole()

		var filter_role = new Array();
		filter_role[0] = new nlobjSearchFilter('custrecord_ace_acerole', null, 'anyof', role);
		var columns_role = new Array();
		columns_role[0] = new nlobjSearchColumn('custrecord_ace_viewencrypted');
		columns_role[1] = new nlobjSearchColumn('custrecord_ace_viewelided');
		columns_role[2] = new nlobjSearchColumn('custrecord_ace_rwencrypted');
		var role_results = nlapiSearchRecord('customrecord_aceroles', null, filter_role, columns_role);

		var datum_type_rec = fld_results[x].getValue('custrecord_pii_datumtype')
		if (datum_type_rec == 1)
			var datum_type = 0
		else
			var datum_type = 1
		
		//Encrypt data field
		var ciphertext = ACE.encrypt(plaintext, mastkey[0], Number(internalid), datum_type);
		nlapiLogExecution('Error','Encrypt Result','Current = ' + ciphertext);

		try
		{
			nlapiLogExecution('Error','Submitting','Current = ' + rectype + ' ' +  nlapiGetRecordId() + ' ' + plaintext + ' ' + currentfield_enc + ' ' + ciphertext + ' ' + mastkey[1] + ' ' + mastkey[0] + ' ' + datum_type )
			nlapiSubmitField(rectype, nlapiGetRecordId(), [currentfield_enc, 'custrecord_acq_piimasterkeyused'], [ciphertext, mastkey[1] ] ) //Update fields and record Master Key Used

		}
		catch (e)
		{
			nlapiLogExecution('Error','Submit Error','Current = ' + e.getCode() )
			nlapiLogExecution('Error','Submit Error','Current = ' + e.toString() )
		}
		
		nlapiLogExecution('Error','Encrypt Result1','Current = ' + ciphertext);


		//Display plaintext according to Users Role Properties
		if (role_results == null  ||
			(role_results[0].getValue('custrecord_ace_rwencrypted') != 'T' &&
			 role_results[0].getValue('custrecord_ace_viewelided') != 'T' &&
			 role_results[0].getValue('custrecord_ace_viewencrypted') != 'T') ) //Cannot See or Modify
		{
			var currentfield = fld_results[x].getValue('custrecord_pii_fieldinternal')
	//				---> Replace plaintext with all xxxxx
	//		nlapiSetFieldValue(currentfield, plaintext, false)
			var plaintext = "xxxxxxxxxxxxxxxx"
			nlapiSetFieldValue(currentfield, plaintext, false)
		}
		else
			if (role_results[0].getValue('custrecord_ace_rwencrypted') == 'T') //Full Read Write Access
			{
				nlapiSetFieldValue(currentfield, plaintext, false)
			}
			else
				if (role_results[0].getValue('custrecord_ace_viewelided') == 'T')
				{
	//						---> Replace plaintext to see last 4
					
					var last4 = 'xxxxxxxxxx-' + plaintext.substring(plaintext.length - 4, (plaintext.length - 4) + 4) 
					nlapiSetFieldValue(currentfield, plaintext, false)
				}
				else //Must be View Encrypted 
				{
					var plaintext = "xxxxxxxxxxxxxxxx"
					nlapiSetFieldValue(currentfield, plaintext, false)
				}

	}
}

}
