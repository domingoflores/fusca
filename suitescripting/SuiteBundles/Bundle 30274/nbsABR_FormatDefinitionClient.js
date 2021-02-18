/** nbsABR_Help - script for Help button
*/
/*function nbsABR_Help() {
	var linkURL = 'http://docs.nolanbusinesssolutions.com/abr/abr_format_setup.html';
	window.open(linkURL,"abrhelp",'width=1200px,height=900px,resizable=yes,scrollbars=yes');
}*/
/** nbsABR_FrmtDfn_PgInit - page init
*/
function nbsABR_FrmtDfn_PgInit(type){

	if (type == 'create' || type == 'edit'){
		var strInc = nlapiGetFieldValue('custrecord_fd_include');		
		if(strInc == 'F'){
			nlapiDisableField('custrecord_fd_includestring',true);
		}
	}
}

/** nbsABR_FrmtDfn_FldChngd - field changed
*/
function nbsABR_FrmtDfn_FldChngd(type,name){

	if (name == 'custrecord_fd_include'){
		var strInc = nlapiGetFieldValue('custrecord_fd_include');				
		if(strInc == 'T'){
			nlapiDisableField('custrecord_fd_includestring',false);
		}
		else{
			nlapiDisableField('custrecord_fd_includestring',true);
		}
	}
}