/** nbsABR_Help - script for Help button
*/
/*function nbsABR_Help() {
	var linkURL = 'http://docs.nolanbusinesssolutions.com/abr/abr_format_setup.html';
	window.open( linkURL,"abrhelp",'width=1200px,height=900px,resizable=yes,scrollbars=yes');
}*/
/** nbsABR_FrmtDfnLne_VldtFld - validate field
*/
function nbsABR_FrmtDfnLne_VldtFld(type, field){

	if((field == 'custrecord_fdl_start') || (field == 'custrecord_fdl_end')){
		var intStrt = parseInt(nlapiGetFieldValue('custrecord_fdl_start'),10);
		var intEnd = parseInt(nlapiGetFieldValue('custrecord_fdl_end'),10);
		
		if (intStrt < 0)
		{	
			alert("You must enter a value greater or equal to 0.");
			return false;
		}
		if ( intEnd < 0)
		{	
			alert("You must enter a value greater or equal to 0.");
			return false;
		}
		if ((field == 'custrecord_fdl_end') && (intStrt > intEnd))
		{	
			alert("Start number cannot be greater than end number!");
			return false;
		}
	}
	return true;
}
/** nbsABR_FrmtDfnLne_PgInit - page init
*/
function nbsABR_FrmtDfnLne_PgInit(type){

	if (type == 'create' || type == 'edit')
	{
		var frmtDfnId = nlapiGetFieldValue('custrecord_fdl_formatid');
		if(frmtDfnId == null || frmtDfnId == ''){
			alert('Format definition lines may be created via the parent format definition record only!');
			return;
		}
		var fileFrmt = nlapiLookupField('customrecord_nbsabr_formatdefinition',frmtDfnId,'custrecord_fd_fileformat');
		
		if((fileFrmt == '3') || (fileFrmt == '5')){ // fixed format or MT940
			nlapiDisableField('custrecord_fdl_fieldnumber',true);
		}
	}
}