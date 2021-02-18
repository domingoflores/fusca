// field changed function
// can't source subsidiary from account in UI. Aaargh!
function setup_FC(type,field)
{
	try
	{
		var accountId;	
		if(field == 'custrecord_accsetup_account')
		{		
			accountId = nlapiGetFieldValue('custrecord_accsetup_account');
			var SF = [	new nlobjSearchFilter('internalid',null,'is',accountId,null)];				
			var SC = [new nlobjSearchColumn('subsidiary')];		
			var SR = nlapiSearchRecord('account', null, SF, SC);
				
			if(SR != null)		
				nlapiSetFieldValue('custrecord_accsetup_subsidiary',SR[0].getValue('subsidiary'));
		}
	}
	catch(e)
	{
		// single company
	}
}
function setup_OS()
{
	try
	{
		// Check to see if default record already exists.
		// If yes, block the save and warn with a popup.
		var b_SubsEnabled = nlapiGetContext().getFeature('SUBSIDIARIES');
		var stMsg = '.';
		var subId = nlapiGetFieldValue('custrecord_accsetup_subsidiary');
		var bDefault = nlapiGetFieldValue('custrecord_accsetup_default');
		var filters = [new nlobjSearchFilter('isinactive',null, 'is','F'),
		               new nlobjSearchFilter('custrecord_accsetup_default',null, 'is','T')];
		if(b_SubsEnabled)
		{
			filters.push(new nlobjSearchFilter('custrecord_accsetup_subsidiary',null, 'is',subId));
			stMsg = ' for this subsidiary.';
		}
		var recs = nlapiSearchRecord('customrecord_nbsabr_accountsetup',null,filters,null);
		if( (recs != null) && (recs.length > 1) && (bDefault == 'T') )
		{
			alert('A default account record already exists'+stMsg);
			return false;
		}
		return true;
	}
	catch(GE)
	{
		var errMsg = '';
		if ( GE instanceof nlobjError )
		{
			errMsg = GE.getCode() + ' - ' + GE.getDetails();
		}
		else
		{
			errMsg = GE.toString();
		}
		alert('Exception at:<BR>'+errMsg);
	}

}
