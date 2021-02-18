function previewRecipientsLink(type, name){
	if (name == 'custrecord_qx_sce_recipientsgroup') {
		var link = document.getElementById('previewLink');
		link.setAttribute('href', '/app/common/search/searchresults.nl?' +
			'rectype=16&searchtype=Custom&CUSTRECORD59=' + nlapiGetFieldValue('custrecord_qx_sce_customer') + '&searchid=' + 
			nlapiGetFieldValue('custrecord_qx_sce_recipientsgroup') + '&dle=');
	}
}

