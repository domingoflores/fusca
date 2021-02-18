function excdatacollup(exchangeid)
{
//Designed for Shareholder Representative Services - April 2012
//Frank Foster - Grace Business Solutions
//ffoster@grace-solutions.com - 314-831-0078

//This is a Client script that will update Data Collection of DE1 & DE2 fields for Exchange records.  Using the naming convention of the data entery fields
//a dynamic form will be built with the DE fields specifcially for certain Dat Collection users.  

//Data Entry Stages
//0 - Not Started
//1 - Partially Complete
//2 - Complete


var defields = nlapiGetFieldValue('custpage_currentde')
var formfields = nlapiGetFieldValue('custpage_formfields').split(",")
//alert('here1 ' + defields + ' ' + exchangeid)
var submitdata = new Array();
var update = false;
var nosubs = -1

//alert ('here1 ' + exchangeid)
//Show Progress Indicator
//createDiv()
//document.getElementById('ProgressIndicator').style.display = 'block'

//Must have set Alterations Question
if (nlapiGetFieldValue('custpage_alterations') == 1)
{
	alert ('Aleternate Field Text Must Be Set')
	return false;
}

//Lets loop thru all the line to see if we can find updates
try
{
	var exchangerec = nlapiLoadRecord('customrecord_acq_lot', exchangeid, {recordmode: 'dynamic'})
}
catch (e)
{
	var ecode = e.getCode() 
	var estring = e.toString()
	alert('here2a ' + ecode + ' ' + estring)
}
//alert ('here1z ' + exchangeid)
var destage1 = exchangerec.getFieldValue('custrecord_acq_loth_currentdestage1')
var destage2 = exchangerec.getFieldValue('custrecord_acq_loth_currentdestage2')
var exchfields = exchangerec.getAllFields();

//Get PII masterkey
var mastkey = nlapiGetFieldValue('custpage_piimsg') //Need to key key from Suitelet
var mastkey_1 = nlapiGetFieldValue('custpage_piimsg_1') //Need to key key from Suitelet

//alert ('here1a ' + mastkey)
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

//alert ('here2a')

var size = formfields.length
//Break down fields and look for updates - these are just the fields data collected
for(x=0;x<=size-1;x++) 
{
	var zz = 0
	var field_form = formfields[x]
	var field_form1 = field_form.split("*")
	var field_name = field_form1[0]
	var field_mandatory = field_form1[1]
	var field_label = field_form1[2]
	//Here we will cherry pick the field to look for on the form
	var field_split = field_name.split("_")
	if (field_split[4] == defields) //OK, this is a data entry field
	{
		
		//Do form field names
		var custpage = 'custpage_' + field_name
		var custpage_hid = 'custpage_' + field_name + '_hid'
		var custpage_enc = 'custpage_' + field_name + '_enc'
//		alert ('here9 ' + custpage + field_mandatory)
		//First check if mandatory
		if (field_mandatory == 'true' && (nlapiGetFieldValue(custpage) == null || nlapiGetFieldValue(custpage) == "" || nlapiGetFieldValue(custpage) == 0))
		{
			alert ('Field ' + field_label + ' Is Required')
			return false;
		}

		if (nlapiGetFieldValue(custpage) != nlapiGetFieldValue(custpage_hid))
		{
			if (nlapiGetFieldValue(custpage) == 0 && nlapiGetFieldValue(custpage_hid) == 0.00)
			{
				var zz = zz + 1
			}
			else
			{
				//Get record field name and update record
				var field_name_rec = field_name.replace('custpage_', "")
				var lth1 = nlapiGetFieldValue(custpage).length
				var lth2 = nlapiGetFieldValue(custpage_hid).length
//				alert ('here4 ' + nlapiGetFieldValue(custpage_enc) + ' ' +  custpage_enc)

				//Check to see if this field requires encryption
				if (nlapiGetFieldValue(custpage_enc) == 'T')
				{
//					alert ('here5')
					for(p=0;p<=size_pii-1;p++) 
					{
						if (field_name_rec == piifields[0][p])
						{
							var field_name_enc = piifields[1][p]
							var datum_type = piifields[2][p]
							if (datum_type == 1)
								var datum_type = 0
							else
								var datum_type = 1
							var internalid = exchangeid
							var plaintext = nlapiGetFieldValue(custpage)
							var ciphertext = ACE.encrypt(plaintext, mastkey, Number(internalid), datum_type);

							exchangerec.setFieldValue(field_name_enc, ciphertext)
							exchangerec.setFieldValue('custrecord_acq_piimasterkeyused', mastkey_1)
							update = true
//							alert ('here6 ' + ciphertext)
							nlapiLogExecution('Error','Encrypt','Current = ' + plaintext + ' ' + ciphertext);
							break;
						}
					}
				}
				else
				{
					exchangerec.setFieldValue(field_name_rec, nlapiGetFieldValue(custpage))
					update = true
				}
			}
		}
	}
}

var certsupdated = false
//Here we will update certificates
var sizesublist = nlapiGetLineItemCount('custpagesublistcust'); 
for(s=1;s<=sizesublist;s++)
{
	var certid = nlapiGetLineItemValue('custpagesublistcust', 'custpagecertid', s)

	if (nlapiGetLineItemValue('custpagesublistcust', 'custpagedelete', s) == 'T') //Requesting a Delete
	{
//		alert ('Deleting Record - well not really!')
		nlapiDeleteRecord('customrecord_acq_lot_cert_entry', certid)
		var certsupdated = true
	}
	else
	{
		var update_cert = false
//		if ( (nlapiGetLineItemValue('custpagesublistcust', 'custpagecert', s) != "" && nlapiGetLineItemValue('custpagesublistcust', 'custpagecert_hid', s) != null) || 
//			 (nlapiGetLineItemValue('custpagesublistcust', 'custpageshares', s) != "" && nlapiGetLineItemValue('custpagesublistcust', 'custpagecert_hid', s) != null) ||
//			 (nlapiGetLineItemValue('custpagesublistcust', 'custpagecomment', s) != "" && nlapiGetLineItemValue('custpagesublistcust', 'custpagecomment_hid', s) != null) )
		if (nlapiGetLineItemValue('custpagesublistcust', 'custpagecert', s) != "" && 
		    nlapiGetLineItemValue('custpagesublistcust', 'custpageshares', s) != "" /*&&
			nlapiGetLineItemValue('custpagesublistcust', 'custpagecomment', s) != ""*/)

		{

			if (certid == "" || certid == null)
			{
				var certrec = nlapiCreateRecord('customrecord_acq_lot_cert_entry') //This line needs to be added
				certrec.setFieldValue('custrecord_acq_lotce_zzz_zzz_lotcestatus', 2 )
				certrec.setFieldValue('custrecord_acq_lotce_3_src_certtype', 8 )

				update_cert = true
			}
			else
			{
				//alert('here2 '+ ' ' + nlapiGetLineItemValue('custpagesublistcust', 'custpageshares', s) + ' ' + nlapiGetLineItemValue('custpagesublistcust', 'custpageshares_hid', s))
				if ((nlapiGetLineItemValue('custpagesublistcust', 'custpagecert', s) != nlapiGetLineItemValue('custpagesublistcust', 'custpagecert_hid', s))  ||
					(nlapiGetLineItemValue('custpagesublistcust', 'custpageshares', s) != nlapiGetLineItemValue('custpagesublistcust', 'custpageshares_hid', s)) ||
					(nlapiGetLineItemValue('custpagesublistcust', 'custpagelost', s) != nlapiGetLineItemValue('custpagesublistcust', 'custpagelost_hid', s))/* ||
					(nlapiGetLineItemValue('custpagesublistcust', 'custpagecomment', s) != nlapiGetLineItemValue('custpagesublistcust', 'custpagecomment_hid', s))*/ )
				{
					var certrec = nlapiLoadRecord('customrecord_acq_lot_cert_entry', certid) //This line needs to be updated
					update_cert = true					
				}	
			}
			
			if (update_cert)
			{
				if (defields == 'de1')
				{
					certrec.setFieldValue('custrecord_acq_lotce_3_de1_certnumber', nlapiGetLineItemValue('custpagesublistcust', 'custpagecert', s) )
					certrec.setFieldValue('custrecord_acq_lotce_3_de1_numbershares', nlapiGetLineItemValue('custpagesublistcust', 'custpageshares', s) )
					certrec.setFieldValue('custrecord_acq_lotce_3_de1_lostcert', nlapiGetLineItemValue('custpagesublistcust', 'custpagelost', s) )
//					certrec.setFieldValue('custrecord_acq_lotce_3_de1_comment', nlapiGetLineItemValue('custpagesublistcust', 'custpagecomment', s) )
				}
				else
				{
					certrec.setFieldValue('custrecord_acq_lotce_3_de2_certnumber', nlapiGetLineItemValue('custpagesublistcust', 'custpagecert', s) )
					certrec.setFieldValue('custrecord_acq_lotce_3_de2_numbershares', nlapiGetLineItemValue('custpagesublistcust', 'custpageshares', s) )
					certrec.setFieldValue('custrecord_acq_lotce_3_de2_lostcert', nlapiGetLineItemValue('custpagesublistcust', 'custpagelost', s) )
//					certrec.setFieldValue('custrecord_acq_lotce_3_de2_comment', nlapiGetLineItemValue('custpagesublistcust', 'custpagecomment', s) )
				}
				
				certrec.setFieldValue('custrecord_acq_lotce_3_src_certnumber', nlapiGetLineItemValue('custpagesublistcust', 'custpagecert', s) )
				certrec.setFieldValue('custrecord_acq_lotce_zzz_zzz_parentlot', exchangeid )
				
				nlapiSubmitRecord(certrec)
				var certsupdated = true
			    update_cert = true	
			}					
		}
	}
}
	
if (update || certsupdated || nlapiGetFieldValue('custpage_complete') == 'T')
{
	var user = nlapiGetUser()
	if (nlapiGetFieldValue('custpage_complete') == 'T') //Marked as Completed
	{
		
		var date = new Date()
		var dateTime = nlapiDateToString(date, 'datetimetz');		 
		
		if (defields == 'de1')
		{
//			exchangerec.setFieldValue('custrecord_acq_loth_currentdeuser1', null) //Current DE User
			exchangerec.setFieldValue('custrecord_acq_loth_zzz_zzz_de1timestmp', dateTime) 
			destage1 = 2
		}
		else
		{
//			exchangerec.setFieldValue('custrecord_acq_loth_currentdeuser2', null) //Current DE User
			exchangerec.setFieldValue('custrecord_acq_loth_zzz_zzz_de2timestmp', dateTime)
			destage2 = 2
		}		
	}
	else
	{
		
		if (defields == 'de1')
		{
			exchangerec.setFieldValue('custrecord_acq_loth_currentdeuser1', user) //Current DE User		
			if (destage1 == 0 || destage1 == null || destage1 == "")
			{
				destage1 = 1
			}
//			else
//			if (destage1 == 1)
//			{
//				destage1 = 2			
//			}
		}
		else
		{
			exchangerec.setFieldValue('custrecord_acq_loth_currentdeuser2', user) //Current DE User		
			if (destage2 == 0 || destage2 == null || destage2 == "")
			{
				destage2 = 1
			}
//			else
//			if (destage2 == 1)
//			{
//				destage2 = 2			
//			}
		}		
	}
	try
	{
		
		if (defields == 'de1')
			exchangerec.setFieldValue('custrecord_acq_loth_currentdestage1', destage1) //Set Stage
		else
			exchangerec.setFieldValue('custrecord_acq_loth_currentdestage2', destage2) //Set Stage
		if (nlapiGetFieldValue('custpage_complete') == 'T' )
		{
			if (exchangerec.getFieldValue('custrecord_acq_loth_currentdestage1') == 2 && exchangerec.getFieldValue('custrecord_acq_loth_currentdestage2') == 2)
			{
				exchangerec.setFieldValue('custrecord_acq_loth_zzz_zzz_shrhldstat', 5) //Shareholder Status
				exchangerec.setFieldValue('custrecord_acq_loth_zzz_zzz_acqstatus', 4) //Acquiom Status
			}
		}
	
		nlapiSubmitRecord(exchangerec)
	}
	catch (e)
	{
		alert(e.getCode()) 
		alert(e.toString())
	}
	
	alert('Exchange Record Successfully Updated \n\n Click OK to Close')
}
else
{
	alert('No Fields Found For Update \n\n Click OK to Close')	
}

//Otherwise go back to forms
var url = nlapiResolveURL('TASKLINK','CARD_-29',null, null); //Redirect Home
window.onbeforeunload = null //Gets rid of leave this page message
window.location= url

return;


}

function createDiv()
{
	var ProgInd = document.createElement('div')
	ProgInd.setAttribute('id', 'ProgressIndicator')
	ProgInd.style.display = 'none'
	ProgInd.style.position = 'absolute'
	ProgInd.style.top = '0px'
	ProgInd.style.left = '0px'
	ProgInd.style.width = '100%'
	ProgInd.style.height = '100%'
	ProgInd.style.verticalAlign = 'top'
	ProgInd.style.textAlign = 'center'
	ProgInd.innerHTML = '<img src=https://system.na2.netsuite.com/core/media/media.nl?id=1541&c=1014080&h=c6127a9f88ee9d8ac71f><br><b>Please wait.</b>'
	document.body.appendChild(ProgInd)
}

