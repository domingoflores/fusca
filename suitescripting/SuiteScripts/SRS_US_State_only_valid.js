function ValidateField(type, name)
{
	// if fieldA is not greater than 5 characters, fail validation
	if (name == 'custrecord_mr_state')
	{	alert((nlapiGetFieldValue('custrecord_mr_country')).length);
		var fieldALength = nlapiGetFieldValue('custrecord_mr_country');
		
		if (fieldALength == 232)
		{	
			alert("State must be at least 6 characters.");
			return false;
		}
	}
	//  Always return true at this level, to continue validating other fields
	return true;
}