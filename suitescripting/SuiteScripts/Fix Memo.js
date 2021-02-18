function fix1()
{

var columns = new Array();
columns[0] = new nlobjSearchColumn('company');
columns[1] = new nlobjSearchColumn('custevent_memodeal');
var searchresults = nlapiSearchRecord('phonecall', 'customsearch2142', null, columns);  // Search for duplicate already
for ( var i = 0; searchresults != null && i < searchresults.length; i++ )
{
	var company = searchresults[i].getValue('company')
	var deal = searchresults[i].getValue('custevent_memodeal')
	if ( (deal == null ||  deal == "")  && company)
	{
		try
		{
			nlapiSubmitField('phonecall', searchresults[i].getId(), 'custevent_memodeal', company) 	
		}
		catch (e)
		{
			nlapiLogExecution('Error','Opportunity','Current = ' + searchresults[i].getText('company'));
		}
		
	}

		if (i > 250)  //if we do more that 1000 we'll time out.  End script and start another one
		{
			var context = nlapiGetContext();
			var status = nlapiScheduleScript(context.getScriptId(), context.getDeploymentId())
		}

}

}