function exchangedymatch(type, name)
{
//Designed for Shareholder Representative Services - April 2012
//Frank Foster - Grace Business Solutions
//ffoster@grace-solutions.com - 314-831-0078

//This is a Field Change script that will check and compare fields on the Exchange Record to see if DE1 and DE@ fields have been entered correctly
//And indicate on the record if not.
//To Be used by Reviewers only

var formtbl = new Array();
formtbl[0] = new Array(); //Form
formtbl[1] = new Array(); //Form Count

var matchcnt = 0

//First lets see if this was a DE1 or DE2 field that was changed
var customform = nlapiGetFieldValue('customform')

if (customform == 152 && name != 'customform') //Reviewer Form
{
	var field_name = name;
	var field_split = field_name.split("_")

	if (field_split[4] == 'de1' || field_split[4] == 'de2')
	{
		
		var compare1 = field_name //First compare
		
		//Lets create the second compare field
		if (field_split[4] == 'de1')
			var cmp1 = 'de2'
		else
			var cmp1 = 'de1'

		field_split[4] = cmp1
		var compare2 = field_split.join()
		compare2 = compare2.replace(/,/g,"_")

		//Create the match field
		field_split[4] = 'mch'
		var mch_field_name = field_split.join()
		mch_field_name = mch_field_name.replace(/,/g,"_")

		//OK, lets compare

		if (nlapiGetFieldValue(compare2) == null || nlapiGetFieldValue(compare2) == "")
		{
			if (nlapiGetFieldValue(mch_field_name) != 1)
			{
				//Accum Not Matched
				matchcnt = 1
				var formno = field_split[3]
				var formtbl = accumform(formno, formtbl, matchcnt)
			}
			nlapiSetFieldValue(mch_field_name, 1, false) //Not Matched			
		}
		else
		{
			if (nlapiGetFieldValue(compare1) == nlapiGetFieldValue(compare2))
			{
				if (nlapiGetFieldValue(mch_field_name) != 2)
				{
					matchcnt = -1
					var formno = field_split[3]
					var formtbl = accumform(formno, formtbl, matchcnt)
				}
				nlapiSetFieldValue(mch_field_name, 2, false) //Matched
			}
			else
			{
				if (nlapiGetFieldValue(mch_field_name) != 1)
				{
					//Accum Not Matched
					matchcnt = 1
					var formno = field_split[3]
					var formtbl = accumform(formno, formtbl, matchcnt)
				}
				nlapiSetFieldValue(mch_field_name, 1, false) //Not Matched
			}
		}
		
	}

	//Ok, lets fill in the form exceptions
	var size1 = formtbl[0].length
	for(y=0;y<=size1-1;y++)
	{
		if (formtbl[0][y] == '1')
		{
			var exccnt = nlapiGetFieldValue('custrecord_acq_loth_1_zzz_form1except')
			nlapiSetFieldValue('custrecord_acq_loth_1_zzz_form1except', formtbl[1][y], false)
		}
		if (formtbl[0][y] == '2')
		{
			var exccnt = nlapiGetFieldValue('custrecord_acq_loth_2_zzz_form2except')
			nlapiSetFieldValue('custrecord_acq_loth_2_zzz_form2except', formtbl[1][y], false)
		}
		if (formtbl[0][y] == '3')
		{
			var exccnt = nlapiGetFieldValue('custrecord_acq_loth_3_zzz_form3except')
			nlapiSetFieldValue('custrecord_acq_loth_3_zzz_form3except', formtbl[1][y], false)
		}
		if (formtbl[0][y] == '4')
		{
			var exccnt = nlapiGetFieldValue('custrecord_acq_loth_4_zzz_form4except')
			nlapiSetFieldValue('custrecord_acq_loth_4_zzz_form4except', formtbl[1][y], false)
		}
		if (formtbl[0][y] == '5a')
		{
			var exccnt = nlapiGetFieldValue('custrecord_acq_loth_5a_zzz_form5aexcept')
			nlapiSetFieldValue('custrecord_acq_loth_5a_zzz_form5aexcept', formtbl[1][y], false)
		}
		if (formtbl[0][y] == '5b')
		{
			var exccnt = nlapiGetFieldValue('custrecord_acq_loth_5b_zzz_form5bexcept')
			nlapiSetFieldValue('custrecord_acq_loth_5b_zzz_form5bexcept', formtbl[1][y], false)
		}
		if (formtbl[0][y] == '5c')
		{
			var exccnt = nlapiGetFieldValue('custrecord_acq_loth_5c_zzz_form5cexcept')
			nlapiSetFieldValue('custrecord_acq_loth_5c_zzz_form5cexcept', formtbl[1][y] + Number(exccnt), false)
		}
		if (formtbl[0][y] == '6')
		{
			var exccnt = nlapiGetFieldValue('custrecord_acq_loth_6_zzz_form6except')
			nlapiSetFieldValue('custrecord_acq_loth_6_zzz_form6except', formtbl[1][y], false)
		}
		if (formtbl[0][y] == '7')
		{
			var exccnt = nlapiGetFieldValue('custrecord_acq_loth_7_zzz_form7except')
			nlapiSetFieldValue('custrecord_acq_loth_7_zzz_form7except', formtbl[1][y], false)
		}
	}

}


return;

}

function accumform(formno, formtbl, matchcnt)
{
	var cnt
	var size = formtbl[0].length
	if (size == 0)
	{
		formtbl[0][0] = formno
		formtbl[1][0] = Number(matchcnt)
	}
	else
	{
		var added = false
		for(z=0;z<=size-1;z++) 
		{
			if (formtbl[0][z] == formno)
			{
				formtbl[0][z] = formno
				formtbl[1][z] = formtbl[1][z] + Number(matchcnt)
				added = true
			}
		}
		if (!added)
		{
			formtbl[0][z] = formno
			formtbl[1][z] = Number(matchcnt)
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
//form.getField('custrecord_acq_loth_5c_mch_checkspayto').setDisplayType('inline')
//form.getField('custrecord_acq_loth_5c_mch_checksmailto').setDisplayType('readonly').setPadding(.5)
//form.getField('custrecord_acq_loth_5c_mch_checksaddr1').setDisplayType('readonly').setPadding(.5)
//form.getField('custrecord_acq_loth_5c_mch_checksaddr2').setDisplayType('readonly').setPadding(.5)
//	nlapiSetFieldValue('custrecord_acq_loth_5c_mch_checkspayto', 2, false) //Matched
	window.document.main_form.custrecord_acq_loth_5c_mch_checkspayto.font='30px'

}