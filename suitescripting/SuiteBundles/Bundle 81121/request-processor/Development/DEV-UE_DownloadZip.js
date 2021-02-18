function customrecord_AfterSubmit(type)
{
	"use strict";
	if ((String(type)==='delete')||(String(type)==='xedit'))
	{	
		return;
	}
	var func = 'customrecord_AfterSubmit';
	var id = nlapiGetRecordId();
	nlapiLogExecution('AUDIT', func + 'starting', type + '|' + id);
	if ( String(type) === 'view')
	{
		var context = nlapiGetContext();
		var folderid = nlapiGetFieldValue("custrecord_folderid");
		
		if (folderid)
		{
			var fileLink = 'https://system.na1.netsuite.com/core/media/downloadfolder.nl?id=' + folderid;

			var response1 = nlapiRequestURL(fileLink);
		 
			 // Change the content type according to the file
			 //response1.setContentType('ZIP', 'file.zip');
			 
			 var body = response1.getBody();
			 nlapiLogExecution("DEBUG","body ", body);
	//		 nlapiLogExecution("DEBUG","body ", body);
	//		 var file = nlapiCreateFile('zip.zip', 'ZIP', body);
	//		 var folderid = 5338	;
	//		 file.setFolder(folderid);
	//		 file.setIsOnline(true);
	//		 var fileid = nlapiSubmitFile(file);
	//	     url = nlapiLoadFile(fileid).getURL();
			
		}
	    nlapiLogExecution('AUDIT', 'folderid', folderid);
	}
}