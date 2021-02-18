
function nbsABR_PeriodRecons_FC(type,field)
{
	if(field == 'reconaccount'){
		window.nlapiSetFieldValue('main_action','Refresh');
		if (window.isinited && window.isvalid){
				setWindowChanged(window,false);
				main_form.submit();
		}
	}
}
/** nbsABR_Help - script for Help button
*/
function nbsABR_Help(){
	var linkURL = 'http://docs.nolanbusinesssolutions.com/abr/abr_period_recs.html';
	window.open( linkURL,"abrhelp",'width=1200px,height=900px,resizable=yes,scrollbars=yes');
}