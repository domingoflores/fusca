function saveRecord()
{
	//  Check to see if either the Shares Held at Closing or the Cash Paid at Closing fields are populated
	
	if (String(nlapiGetFieldValue('custrecord_shares_at_closing')).length == 0 && String(nlapiGetFieldValue('custrecord_cash_paid_at_closing')).length == 0) 
	{
		alert("Please provide either the amount of the cash proceeds you received at closing or the number of shares that you held at closing.  Doing so helps us to securely confirm your identity.");
		return false;
	}
	return true;
}