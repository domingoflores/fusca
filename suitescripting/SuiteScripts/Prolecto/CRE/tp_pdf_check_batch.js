if (creRecord.RawData)
{
	/*
	 * 
	 var completionurl = nlapiResolveURL('SUITELET', 'customscript_srs_sl_utilities', 'customdeploy_srs_sl_utilities', true)
	completionurl = completionurl+"&profileID={profileID}&ID={ID}&status={status}&action=PDFCheckBatchCompleted";
	creRecord.CompletionURL = completionurl;
	nlapiLogExecution('audit',"creRecord.CompletionURL ",creRecord.CompletionURL );
	*/
	
	var extension = creRecord.DocumentName.split('.').pop();
	creRecord.DocumentName = "${CRE_REQUEST_HEADER.custrecord_pri_cre_request_header_param2}." + extension;
}