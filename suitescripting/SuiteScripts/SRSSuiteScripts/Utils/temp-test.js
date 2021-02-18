/**
 * @author durbano
 */

var Settings =
{
	Notifications:
    {
    	 From: 21345 //internal id of support employee.
		,Bcc: "durbano@shareholderrep.com" //internal id of operations employee.
		//,Bcc: "28154" //internal id of operations employee.
		//,Bcc: "durbano@shareholderrep.com"
		//,Bcc: "sbuttgereit@shareholderrep.com"
    },
	Testing:
	{
		//To: "sbuttgereit@shareholderrep.com"
		To: "durbano@shareholderrep.com"
		//To: "abruno@shareholderrep.com"
	}
}


function testEmail()
{
	
	//nlapiSendEmail('rheimbach@shareholderrep.com','durbano@shareholderrep.com','Testing nlapiSendEmail','This is just a test',null,null,null,null);
	nlapiSendEmail(Settings.Notifications.From,'durbano@shareholderrep.com','Testing nlapiSendEmail','This is just a test',null,null,null,null);
}
