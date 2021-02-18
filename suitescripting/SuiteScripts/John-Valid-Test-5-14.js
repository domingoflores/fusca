function ValidateField(type, name)
{
	if (name == 'custrecord_mr_country')
	{	//alert((nlapiGetFieldValue('custrecord_mr_country')).length);
		var fieldALength = nlapiGetFieldValue('custrecord_mr_country');
		
		if (fieldALength != 232)
		{	var state = nlapiGetFieldValue('custrecord_mr_state');
		//alert(state);
		//nlapiGetField('custrecord_mr_state').setFieldValue(0);
		//nlapiGetField('custrecord_mr_state').setMandatory(false);
		//state.setFieldValue(0);
		//state.setDisplayType('disabled');
			//alert("State must be at least 6 characters.");
			return false;
		
		}
	}
	//  Always return true at this level, to continue validating other fields
	return true;
}