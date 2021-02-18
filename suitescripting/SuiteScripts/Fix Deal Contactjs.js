function fixdealcust(type, name)
{
var columns = new Array();
columns[0] = new nlobjSearchColumn( 'custevent_phonename');  // id

var results = nlapiSearchRecord('customrecord16', 2124, null, null);
for ( var i = 0; results != null && i < results.length; i++ )
{
	try
	{
		var id1 = results[i].getId()
		var company = results[i].getValue('custrecord59')
		nlapiSubmitField('customrecord16', id1, 'custrecord_dealcusteo', company)

	}
	catch (e)
	{
		var err1 = e.getCode()
        var err2 = e.toString()
		
		var a = a + 1
	}
	if (i > 300)  //if we do more that 1000 we'll time out.  End script and start another one
	{
		var context = nlapiGetContext();
		var status = nlapiScheduleScript(context.getScriptId(), context.getDeploymentId())
	}

}

}

