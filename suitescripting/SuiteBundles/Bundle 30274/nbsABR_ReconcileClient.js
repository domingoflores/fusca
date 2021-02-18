/** reloadIFrame - Match button code on main form
 * Function to assign a match number to all records selected on NetSuite and Bank side
 * Records that have an existing match number cannot be matched again!
 * Sum amount of select records on NetSuite side must equal sum amount on the bank side.
 * 
 * @return(boolean)
 */
//function reloadIFrame()
function matchOnClick()
{
	try{
		var pathGL = document.getElementById('GL').contentWindow;
		var pathBK = document.getElementById('BK').contentWindow;

		var intCntGL = pathGL.nlapiGetLineItemCount('gl_list');
		var intCntBK = pathBK.nlapiGetLineItemCount('bs_list');

		// quick check - bail out if no rows at all
		if ((intCntGL == 0) && (intCntBK == 0))
			return;	 // nothing to do!
		
		// check we have some marked rows
		var matchCount = 0;
		for(var i=1, j =intCntGL; i<=j; ++i)
		{	
			if( (pathGL.nlapiGetLineItemValue('gl_list','gl_match',i) == 'T') ){
				matchCount += 1;
			}
		}
		for(var i=1, j =intCntBK; i<=j; ++i)
		{	
			if( (pathBK.nlapiGetLineItemValue('bs_list','bs_match',i) == 'T') ){
				matchCount += 1;
			}
		}
		if(matchCount == 0){
			return; // nothing to do!
		}
		if(matchCount > 400){
			alert(objResources[NBSABRSTR.ONLYMTCH400]);	// 'You can only match 400 records at a time.'
			return;
		}
		
		// 1. Check that nothing marked has an existing match number
		//NetSuite side
		for(var i=1, j =intCntGL; i<=j; ++i)
		{	
			// check that nothing marked has an existing match number
			if( (pathGL.nlapiGetLineItemValue('gl_list','gl_match',i) == 'T') && (pathGL.nlapiGetLineItemValue('gl_list','custrecord_nbsabr_rs_matchnumber',i) !='') ){
				alert(objResources[NBSABRSTR.NSRECALRDYMTCHD]);	// 'NetSuite record already matched!'
				//clear selection
				pathGL.nlapiSetLineItemValue('gl_list','gl_match',i,'F');
				//recalculate totals
				var flTotal = recalcMarkedTotal('gl_list');
				//set total on child
				pathGL.nlapiSetFieldValue('gl_selected',flTotal);
				//set total on parent (hidden)
				nlapiSetFieldValue('matchvalue_gl',flTotal);
				return false;
			}
		}
		//Bank side
		for(var i=1, j =intCntBK; i<=j; ++i)
		{	
			if( (pathBK.nlapiGetLineItemValue('bs_list','bs_match',i) == 'T') && (pathBK.nlapiGetLineItemValue('bs_list','custrecord_bsl_matchnumber',i) !='') )
			{
				alert(objResources[NBSABRSTR.BKRECALRDYMTCHD]);	// 'Bank transaction already matched!'
				pathBK.nlapiSetLineItemValue('bs_list','bs_match',i,'F');
				var flTotal = recalcMarkedTotal('bs_list');
				pathBK.nlapiSetFieldValue('bk_selected',flTotal);
				nlapiSetFieldValue('matchvalue_bk',flTotal);
				return false;
			}
		}
		
		//2. Check total amounts are equal
		var mvGL= parseFloat(nlapiGetFieldValue('matchvalue_gl'));	// parseInt(nlapiGetFieldValue('matchvalue_gl'),10);
		var mvBK= parseFloat(nlapiGetFieldValue('matchvalue_bk'));	// parseInt(nlapiGetFieldValue('matchvalue_bk'),10);
		mvGL = Math.round(mvGL * 100)/100.0;
		mvBK = Math.round(mvBK * 100)/100.0;
		if((mvGL == mvBK) || (mvGL == 0 && mvBK == 0)){
			// do I need to do this?
			nlapiSetFieldValue('matchvalue_gl',0);
			nlapiSetFieldValue('matchvalue_bk',0);
			
			//var accountId = nlapiGetFieldValue('custpage_bankaccount');// Reconcile Account internalid
			var matchNum = getNextMatchNumber(nlapiGetFieldValue('custpage_bankaccount'));
			
			// hide display option and mark frames as busy before refreshing them
			var dispOptElement = document.getElementById('displayoption_fs'); // enclosing <span> for displayoption field
			/* ... doesn't work in all browsers
			var elemStyleAttr = dispOptElement.getAttribute('style');
			if (elemStyleAttr !== null) {
				elemStyleAttr.visibility = "hidden";
			}
			... */
			if (dispOptElement.style !== undefined)
				dispOptElement.style.visibility = "hidden";
			
			nlapiSetFieldValue('custpage_framestate_a','busy');
			nlapiSetFieldValue('custpage_framestate_b','busy');
			// --
	
			// needed for FireFox
			var pathGLdoc = document.getElementById('GL').contentWindow.document;
			var pathBKdoc = document.getElementById('BK').contentWindow.document;
			// set match num on hidden fld on iFrames
			pathGLdoc.getElementById('matchnum_gl').value=(matchNum);
			pathBKdoc.getElementById('matchnum_bs').value=(matchNum);
			// call hidden button on iFrames
			pathGLdoc.getElementById('gl_action').value=('Match');
			pathGLdoc.getElementById('match_gl').click();
			
			pathBKdoc.getElementById('bs_action').value=('Match');
			pathBKdoc.getElementById('match_bs').click();
		}
		else{
			alert(objResources[NBSABRSTR.MKDTRNSDONTREC]);	// 'The marked transactions do not reconcile!'
		}
	}
	catch(e){
		alert(errText(e));
		return;
	}
}

/** unmatchOnClick - Code for Unmatch button on main form
 * 
 * Function to unmatch all records selected on NetSuite and Bank side
 * Records must have an existing match number to unmatch!
 * Sum amount of select records on NetSuite side must equal sum amount on the bank side.
 * 
 * @return(boolean)
 */

function unmatchOnClick()
{
	var arrGLSubTotals = [];
	var arrBKSubTotals = [];
	
	var pathGL = document.getElementById('GL').contentWindow;
	var pathBK = document.getElementById('BK').contentWindow;

	var intCntGL = pathGL.nlapiGetLineItemCount('gl_list');
	var intCntBK = pathBK.nlapiGetLineItemCount('bs_list');

	// quick check - bail out if no rows at all
	if ((intCntGL == 0) && (intCntBK == 0))
		return;	 // nothing to do!

	// check we have some marked rows
	var matchCount = 0;
	for(var i=1, j =intCntGL; i<=j; ++i)
	{	
		if( (pathGL.nlapiGetLineItemValue('gl_list','gl_match',i) == 'T') ){
			matchCount += 1;
		}
	}
	for(var i=1, j =intCntBK; i<=j; ++i)
	{	
		if( (pathBK.nlapiGetLineItemValue('bs_list','bs_match',i) == 'T') ){
			matchCount += 1;
		}
	}
	if(matchCount == 0){
		return;
	}
	if(matchCount > 400){
		alert(objResources[NBSABRSTR.ONLYUNMTCH400]);	// 'You can only unmatch 400 records at a time.'
		return;
	}
	
	// NetSuite
	for(var i=1, j =intCntGL; i<=j; ++i)
	{	
		if( (pathGL.nlapiGetLineItemValue('gl_list','gl_match',i) == 'T') ){
			var MN = pathGL.nlapiGetLineItemValue('gl_list','custrecord_nbsabr_rs_matchnumber',i);
			//if(MN == ''){
			if(!MN){
				alert(objResources[NBSABRSTR.INVLDMTCHNOMSGNS]);	// 'Invalid Unmatch! Match number not found on NetSuite record.'
				pathGL.nlapiSetLineItemValue('gl_list','gl_match',i,'F');
				var flTotal = recalcMarkedTotal('gl_list');
				pathGL.nlapiSetFieldValue('gl_selected',flTotal);
				nlapiSetFieldValue('matchvalue_gl',flTotal);
				return false;
			}
			//build array of sub-totals for each match number
			if(arrGLSubTotals[MN] === undefined)
				arrGLSubTotals[MN] = [0];
			var flAmt = ncParseFloatNV(pathGL.nlapiGetLineItemValue('gl_list','custrecord_nbsabr_rs_amount',i));
		
			arrGLSubTotals[MN][0] = Math.round((arrGLSubTotals[MN][0]*100)+(flAmt*100)) / 100;
		}
	}
	//Bank
	for(var i=1, j =intCntBK; i<=j; ++i)
	{	
		if( (pathBK.nlapiGetLineItemValue('bs_list','bs_match',i) == 'T') ){
			var MN = pathBK.nlapiGetLineItemValue('bs_list','custrecord_bsl_matchnumber',i);
			if(MN == '')
			{
				alert(objResources[NBSABRSTR.INVLDMTCHNOMSGBK]);	// 'Invalid unmatch! Match number not found on bank transaction.'
				pathBK.nlapiSetLineItemValue('bs_list','bs_match',i,'F');
				var flTotal = recalcMarkedTotal('bs_list');
				pathBK.nlapiSetFieldValue('bk_selected',flTotal);
				nlapiSetFieldValue('matchvalue_bk',flTotal);
				return false;
			}
			//build array of subtotals for each match number
			if(arrBKSubTotals[MN] === undefined)
				arrBKSubTotals[MN] = [0];
			var flAmt = ncParseFloatNV(pathBK.nlapiGetLineItemValue('bs_list','custrecord_bsl_amount',i),0);
			arrBKSubTotals[MN][0] = Math.round((arrBKSubTotals[MN][0]*100)+(flAmt*100)) / 100;
		}
	}
	
	// validate sub-totals
	var b_AllowForcedUnmatch = (nlapiGetFieldValue('allowforcedunmatch') == 'T');
	var l_unmatchMsg = '';

	// var l = arrGLSubTotals.length;
	// for(var i=0; i<=l; i+=1)
	for (var i in arrGLSubTotals)
	{	
		if((arrGLSubTotals[i] !== null) && (arrGLSubTotals[i] !== undefined)) {
			if((arrBKSubTotals[i] !== null) && (arrBKSubTotals[i] !== undefined) && (arrGLSubTotals[i][0] != arrBKSubTotals[i][0])){
				// alert(objResources[NBSABRSTR.INVLDCOMBOMTCHNUMS]);	// 'Invalid combination of match numbers...unable to unmatch!'
				// return false;
				l_unmatchMsg = objResources[NBSABRSTR.INVLDCOMBOMTCHNUMS];	// 'Invalid combination of match numbers...unable to unmatch!'
			} else if(((arrBKSubTotals[i] === null)||(arrBKSubTotals[i] === undefined)) && (arrGLSubTotals[i][0] != 0)){
				// alert(objResources[NBSABRSTR.INVLDMTCHTOTAL]);	// 'Invalid match total...unable to unmatch!'
				// return false;
				l_unmatchMsg = objResources[NBSABRSTR.INVLDMTCHTOTAL];	// 'Invalid match total...unable to unmatch!'
			}
		}
	}
	if (l_unmatchMsg == '') {
		for (var i in arrBKSubTotals)
		{	
			if((arrBKSubTotals[i] !== null) && (arrBKSubTotals[i] !== undefined)) {
				if((arrGLSubTotals[i] !== null) && (arrGLSubTotals[i] !== undefined) && (arrGLSubTotals[i][0] != arrBKSubTotals[i][0])){
					// alert(objResources[NBSABRSTR.INVLDCOMBOMTCHNUMS]);	// 'Invalid combination of match numbers...unable to unmatch!'
					// return false;
					l_unmatchMsg = objResources[NBSABRSTR.INVLDCOMBOMTCHNUMS];	// 'Invalid combination of match numbers...unable to unmatch!'
				} else if(((arrGLSubTotals[i] === null)||(arrGLSubTotals[i] === undefined)) && (arrBKSubTotals[i][0] != 0)){
					// alert(objResources[NBSABRSTR.INVLDMTCHTOTAL]);	// 'Invalid match total...unable to unmatch!'
					// return false;
					l_unmatchMsg = objResources[NBSABRSTR.INVLDMTCHTOTAL];	// 'Invalid match total...unable to unmatch!'
				}
			}
		}
	}

	if (l_unmatchMsg != '') {
		if (b_AllowForcedUnmatch) {
			var l_forced = window.confirm(l_unmatchMsg + '\r\n' + objResources[NBSABRSTR.FORCEUNMATCH]);	// ...\r\nDo you wish to force the unmatch?
			if (!l_forced)
				return false;
		} else {
			alert (l_unmatchMsg);
			return false;
		}
	}
	
	var mvGL= parseFloat(nlapiGetFieldValue('matchvalue_gl'));	// parseInt(nlapiGetFieldValue('matchvalue_gl'),10);
	var mvBK= parseFloat(nlapiGetFieldValue('matchvalue_bk'));	// parseInt(nlapiGetFieldValue('matchvalue_bk'),10);
	mvGL = Math.round(mvGL * 100)/100.0;
	mvBK = Math.round(mvBK * 100)/100.0;
	// this check is redundant because of sub-total validation above?
	if (b_AllowForcedUnmatch || ((mvGL == mvBK) || (mvGL == 0 && mvBK == 0)) ){
		nlapiSetFieldValue('matchvalue_gl',0);
		nlapiSetFieldValue('matchvalue_bk',0);
		
		// hide display option and mark frames as busy before refreshing them
		var dispOptElement = document.getElementById('displayoption_fs'); // enclosing <span> for displayoption field
		/* ... doesn't work in all browsers
		var elemStyleAttr = dispOptElement.getAttribute('style');
		if (elemStyleAttr !== null) {
			elemStyleAttr.visibility = "hidden";
		}
		... */
		if (dispOptElement.style !== undefined)
			dispOptElement.style.visibility = "hidden";
		
		nlapiSetFieldValue('custpage_framestate_a','busy');
		nlapiSetFieldValue('custpage_framestate_b','busy');
		// --

		// needed for FireFox
		var pathGLdoc = document.getElementById('GL').contentWindow.document;
		var pathBKdoc = document.getElementById('BK').contentWindow.document;
							
		pathGLdoc.getElementById('gl_action').value=('Unmatch');
		pathGLdoc.getElementById('match_gl').click();
		
		pathBKdoc.getElementById('bs_action').value=('Unmatch');
		pathBKdoc.getElementById('match_bs').click();
	}
	else{
		alert(objResources[NBSABRSTR.SLCTSTRNSNOTMTCH]);	// 'The selected transactions do not match!'
	}
}
// Reconcile button code
function reconcileOnClick()
{	
	var path = null;
	//GL
	path = document.getElementById('GL').contentWindow;
	var glTM = ncParseFloatNV(path.nlapiGetFieldValue('custrecord_gltotalmarked'),0);
	// Bank
	path = document.getElementById('BK').contentWindow;
	var bkTM = ncParseFloatNV(path.nlapiGetFieldValue('custrecord_bstotalmarked'),0);
	// is match total value same on each side
	if(glTM != bkTM)
	{
		alert(objResources[NBSABRSTR.UNABLERECNOTBLNCD]);	// 'Unable to reconcile...matched totals do not balance!'
		return false;
	}
	
	if (window.isinited && window.isvalid && save_record(true))
	{
		window.nlapiSetFieldValue('main_action','Reconcile');
		setWindowChanged(window,false);
		main_form.submit();
	}
}
// Propose/Automatch button code
function proposeOnClick()
{	
	if (window.isinited && window.isvalid && save_record(true))
	{
		window.nlapiSetFieldValue('main_action','Propose');
		setWindowChanged(window,false);
		main_form.submit();
	}
}

/** @deprecated */
function nbsABR_MainFormPI()
{
	var answer = confirm("Do you want to check data before reconciling?");
	if (answer){
		var linkURL = nlapiResolveURL('SUITELET', 'customscript_nbsabr_preparerecon','customdeploy_nbsabr_preparerecon', null);
		//window.open(linkURL);
		//window.location.href='https://system.netsuite.com'+linkURL;
		window.location.href=linkURL;
	}	
	else{
		return false;
	}
		

}
// main form field change code
function reconcile_FC(type,field)
{
	var flLastBal=0.00;
	var flThisBal=0.00;
	var flReconThis=0.00;
	var flDiff = 0.00;
		
	if(field == 'custpage_endingbalance')
	{		
		flLastBal = ncParseFloatNV(nlapiGetFieldValue('custpage_lastbalance'),0)*100;
		flThisBal = ncParseFloatNV(nlapiGetFieldValue('custpage_endingbalance'),0)*100;
		flReconThis = ncParseFloatNV(nlapiGetFieldValue('custpage_reconciledthis'),0)*100;
		
		var flTmp = flLastBal + flReconThis;
		flDiff = (flThisBal-flTmp)/100;
		nlapiSetFieldValue('custpage_difference',nlapiFormatCurrency(flDiff));
	}
	if(field == 'custpage_statementdate'|| field == 'custpage_startdate')
	{
		nlapiSetFieldValue('main_action','Refresh');
		nbsRefresh();
	}
	if(field == 'custpage_bankaccount')
	{
		var acctId = nlapiGetFieldValue('custpage_bankaccount');
		//search for all target/NS accounts
		var SFs = [	new nlobjSearchFilter('isinactive',null,'is','F',null),
		           	new nlobjSearchFilter('custrecord_nbsabr_ta_reconacc',null,'anyof',acctId,null)];
		if(nlapiSearchRecord('customrecord_nbsabr_targetaccount', null, SFs, null) === null){
			alert(objResources[NBSABRSTR.NSACCTSFORRECONACCTMSG]);	// 'NetSuite account/s for this reconcile account are missing!'
			return;
		}
		
		nlapiSetFieldValue('main_action','NewAcc');
		nbsRefresh();
	}
	if(field == 'displayoption')
	{
		var displayOption = nlapiGetFieldValue('displayoption');

		// hide displayoption and mark frames as busy before refreshing them
		var dispOptElement = document.getElementById('displayoption_fs'); // enclosing <span> for displayoption field
		if (dispOptElement.style !== undefined)
			dispOptElement.style.visibility = "hidden";
		
		nlapiSetFieldValue('custpage_framestate_a','busy');
		nlapiSetFieldValue('custpage_framestate_b','busy');
		// --

		// needed for FireFox
		var pathGL = document.getElementById('GL').contentWindow;
		var pathBK = document.getElementById('BK').contentWindow;
							
		if (pathGL.isinited && pathGL.isvalid)
		{
			pathGL.document.getElementById('gl_displayoption').value=(displayOption);
			pathGL.setWindowChanged(pathGL, false);
			pathGL.document.getElementById('match_gl').click();
		}
		
		if (pathGL.isinited && pathGL.isvalid)
		{
			pathBK.document.getElementById('bk_displayoption').value=(displayOption);
			pathGL.setWindowChanged(pathGL, false);
			pathBK.document.getElementById('match_bs').click();
		}
	}
	
	if (field == 'custpage_gl_datefilter' || field == 'custpage_gl_typefilter' || field == 'custpage_gl_entityfilter' ||
		field == 'custpage_gl_tranidfilter' || field == 'custpage_gl_memofilter' || field == 'custpage_gl_amountfilter') {
		var displayOption = nlapiGetFieldValue('displayoption');

		// hide displayoption and mark frames as busy before refreshing them
		var dispOptElement = document.getElementById('displayoption_fs'); // enclosing <span> for displayoption field
		if (dispOptElement.style !== undefined)
			dispOptElement.style.visibility = "hidden";
		
		nlapiSetFieldValue('custpage_framestate_a','busy');
		// --

		var pathGL = document.getElementById('GL').contentWindow;
		if (pathGL.isinited && pathGL.isvalid)
		{
			var glField = field.substring(9);
			pathGL.document.getElementById(glField).value = nlapiGetFieldValue(field);
			pathGL.document.getElementById('gl_displayoption').value=(displayOption);
			pathGL.setWindowChanged(pathGL, false);
			pathGL.document.getElementById('match_gl').click();
		}
		setWindowChanged(window, false);
	}
	if (field == 'custpage_bk_datefilter' || field == 'custpage_bk_typefilter' ||
		field == 'custpage_bk_tranidfilter' || field == 'custpage_bk_memofilter' || field == 'custpage_bk_amountfilter') {
		var displayOption = nlapiGetFieldValue('displayoption');

		// hide displayoption and mark frames as busy before refreshing them
		var dispOptElement = document.getElementById('displayoption_fs'); // enclosing <span> for displayoption field
		if (dispOptElement.style !== undefined)
			dispOptElement.style.visibility = "hidden";
		
		nlapiSetFieldValue('custpage_framestate_b','busy');
		// --

		var pathBK = document.getElementById('BK').contentWindow;
		if (pathBK.isinited && pathBK.isvalid)
		{
			var bkField = field.substring(9);
			pathBK.document.getElementById(bkField).value = nlapiGetFieldValue(field);
			pathBK.document.getElementById('bk_displayoption').value=(displayOption);
			pathBK.setWindowChanged(pathBK, false);
			pathBK.document.getElementById('match_bs').click();
		}
		setWindowChanged(window, false);
	}
}

//On Save - not used
// triggered when Propose button clicked - move code to suitelet
/** @deprecated */
function reconcile_OS()
{
	var diff = nlapiGetFieldValue('custpage_difference');
	var action = nlapiGetFieldValue('main_action');
			
	if (String(diff).length == 0 && action == 'Reconcile') 	
	{
		alert("Please enter an ending balance");		
		return false;	
	}	
	if(parseInt(diff) != 0 && action == 'Reconcile') 	
	{
		alert("You have an unreconciled difference of "+diff);		
		return false;	
	}	
	return true;
}

/** nbsUItest_subframeComplete - used to re-show the displayoption field, if both frames are ready */
function nbsUItest_subframeComplete() {
	var frameA = nlapiGetFieldValue('custpage_framestate_a');
	var frameB = nlapiGetFieldValue('custpage_framestate_b');
	if ((frameA == 'ready') && (frameB == 'ready')) {
		var dispOptElement = document.getElementById('displayoption_fs'); // enclosing <span> for displayoption field
		/* ... doesn't work in all browsers
		var elemStyleAttr = dispOptElement.getAttribute('style');
		if (elemStyleAttr !== null) {
			elemStyleAttr.visibility = "";
		}
		... */
		if (dispOptElement.style !== undefined)
			dispOptElement.style.visibility = "";
		
	}
}

/** iframeBS_FC - Field changed function attached to suitelet listing Bank transaction on RHS.
 * Total Selected (total amount selected) is updated as transactions are marked/unmarked. This total value
 * is also set on a hidden field on the parent window so it can be accessed by the Match and Unmatch buttons on the parent.
 * 
 * @param type
 * @param field
 * @return void
 */
function iframeBS_FC(type,field)
{
	var line;
	var isChecked;
	var flAmt = 0.00;
	var flTotalSelected = 0.00;
	
	if(type == 'bs_list' && field == 'bs_match'){
		flTotalSelected = ncParseFloatNV(nlapiGetFieldValue('bk_selected'),10)*100;			
		line = nlapiGetCurrentLineItemIndex('bs_list');
		isChecked = nlapiGetLineItemValue('bs_list','bs_match',line);
		flAmt = ncParseFloatNV(nlapiGetLineItemValue('bs_list','custrecord_bsl_amount',line),10)*100;
						
		if(isChecked == 'T'){
			flTotalSelected = (flTotalSelected + flAmt);
		}
		if(isChecked == 'F'){
			flTotalSelected = (flTotalSelected - flAmt);		
		}
		window.parent.nlapiSetFieldValue('matchvalue_bk', nlapiFormatCurrency(flTotalSelected/100));
		nlapiSetFieldValue('bk_selected', nlapiFormatCurrency(flTotalSelected/100));
	}	
	
}
/** iframeGL_FC - Field changed function attached to suitelet listing NetSuite transaction on LHS.
 * Total Selected (total amount selected) is updated as transactions are marked/unmarked. This total value
 * is also set on a hidden field on the parent window so it can be accessed by the Match and Unmatch buttons on the parent.
 * 
 * @param type
 * @param field
 * @return void
 */

function iframeGL_FC(type,field)
{
	var line;
	var isChecked;
	var flAmt = 0.00;
	var flTotalSelected = 0.00;
	
	if(type == 'gl_list' && field == 'gl_match'){
		flTotalSelected = ncParseFloatNV(nlapiGetFieldValue('gl_selected'),10)*100;	
			
		line = nlapiGetCurrentLineItemIndex('gl_list');
		isChecked = nlapiGetLineItemValue('gl_list','gl_match',line);	
		flAmt = parseFloat(nlapiGetLineItemValue('gl_list','custrecord_nbsabr_rs_amount',line))*100;
								
		if(isChecked == 'T'){
			flTotalSelected = (flTotalSelected + flAmt);	
		}
		if(isChecked == 'F'){
			flTotalSelected = (flTotalSelected - flAmt);
		}	
		parent.nlapiSetFieldValue('matchvalue_gl', flTotalSelected/100);
		nlapiSetFieldValue('gl_selected', flTotalSelected/100);
	}
}
	

function nbsABR_iFramePI()
{
	// hide title
	var div = document.getElementsByTagName("div");
	div[4].style.display = 'none';
	
	// hide match button
	var match_tbl = document.getElementById('tbl_match_gl');
	match_tbl.style.display = 'none';
	
	// hide secondary match button
	var sec_match_tbl = document.getElementById('tbl_secondarymatch_gl');
	sec_match_tbl.style.display = 'none';

	window.parent.nlapiSetFieldValue('custpage_framestate_a','ready');
	if (window.parent.nbsUItest_subframeComplete === undefined) {
		window.setTimeout('window.parent.nbsUItest_subframeComplete();',5000);	// run in 5 seconds time
	} else
		window.parent.nbsUItest_subframeComplete();	// notify parent

	var flGLTotal = ncParseFloatNV(nlapiGetFieldValue('gl_linetotal'),0)*100;
	var flReconThis = ncParseFloatNV(nlapiGetFieldValue('custrecord_gltotalmarked'),0)*100;
	var flLastBal = ncParseFloatNV(window.parent.nlapiGetFieldValue('account_balance'),0)*100;
			
	// Matched Balance = Account Balance - Line Total Amount + Matched Total
	var flThisBal = (flLastBal - flGLTotal + flReconThis);
	window.parent.nlapiSetFieldValue('custpage_ns_matchedbal', nlapiFormatCurrency(flThisBal/100));//pre 2012.1
	//window.parent.document.getElementById('custpage_ns_matchedbal_formattedValue').value=nlapiFormatCurrency(flThisBal/100);
			
//	Outstanding = Line Total Amount - Matched Total
	var diff = (flGLTotal - flReconThis)/100;
	window.parent.nlapiSetFieldValue('custpage_ns_outstanding', nlapiFormatCurrency(diff));//pre 2012.1
	//window.parent.document.getElementById('custpage_ns_outstanding_formattedValue').value=nlapiFormatCurrency(diff);
	
	window.parent.nlapiSetFieldValue('custpage_ns_matched', nlapiFormatCurrency(flReconThis/100));	//pre 2012.1
	//window.parent.document.getElementById('custpage_ns_matched_formattedValue').value=nlapiFormatCurrency(flReconThis/100);
	
	var seb = ncParseFloatNV(window.parent.nlapiGetFieldValue('custpage_endingbalance'),0);
	window.parent.nlapiSetFieldValue('custpage_ns_difference', nlapiFormatCurrency(seb - flThisBal/100));
}

function nbsABR_iFrame_bsPI()
{
	var div = document.getElementsByTagName("div");
//	for(i=0; i<x.length;i+=1)
//	{
//		var className = x[i].getAttribute('className');
//		if(className == 'pt_container')
//			alert(className+':'+i);
//	}

	div[4].style.display = 'none';

	// hide match button
	var match_tbl = document.getElementById('tbl_match_bs');
	match_tbl.style.display = 'none';
	var sec_match_tbl = document.getElementById('tbl_secondarymatch_bs');
	sec_match_tbl.style.display = 'none';

	window.parent.nlapiSetFieldValue('custpage_framestate_b','ready');
	if (window.parent.nbsUItest_subframeComplete === undefined) {
		window.setTimeout('window.parent.nbsUItest_subframeComplete();',5000);	// run in 5 seconds time
	} else
	window.parent.nbsUItest_subframeComplete();	// notify parent
				
	var flBankTotal = ncParseFloatNV(nlapiGetFieldValue('bk_total'),0)*100;
	var flReconThis = ncParseFloatNV(nlapiGetFieldValue('custrecord_bstotalmarked'),0)*100;
	var flLastBal = ncParseFloatNV(parent.nlapiGetFieldValue('custpage_lastbalance'),0)*100;
			
	// Ending Statement Balance = Last Reconciled Balance + Bank Transactions Total Amount
	var flThisBal = (flLastBal + flBankTotal);
	window.parent.nlapiSetFieldValue('custpage_endingbalance', nlapiFormatCurrency(flThisBal/100));//pre 2012.1
	//window.parent.document.getElementById('custpage_endingbalance_formattedValue').value=nlapiFormatCurrency(flThisBal/100);
			
//	Difference = Ending Statement Balance - (Last Reconciled Balance + Reconciled This Statement
	var diff = (flThisBal - (flLastBal + flReconThis))/100;
	window.parent.nlapiSetFieldValue('custpage_difference', nlapiFormatCurrency(diff));//pre 2012.1
	//window.parent.document.getElementById('custpage_difference_formattedValue').value=nlapiFormatCurrency(diff);
	
	window.parent.nlapiSetFieldValue('custpage_reconciledthis', nlapiFormatCurrency(nlapiGetFieldValue('custrecord_bstotalmarked')));	//pre 2012.1
	//window.parent.document.getElementById('custpage_reconciledthis_formattedValue').value=nlapiFormatCurrency(nlapiGetFieldValue('custrecord_bstotalmarked'));	
	
	var nsmatched = ncParseFloatNV(window.parent.nlapiGetFieldValue('custpage_ns_matchedbal'),0);
	window.parent.nlapiSetFieldValue('custpage_ns_difference', nlapiFormatCurrency(flThisBal/100 - nsmatched));
}

/**
 * recalcMarkedTotal - recalc function to calculate selected totals on NS and Bank side
 * 
 * @param type sublist internalid
 * @returns {Number} float total
 */
function recalcMarkedTotal(type)
{
	try
	{
		var flTotal = 0;
		if(type == 'gl_list')
		{
			//var amtField = nlapiGetFieldValue('custpage_amt_fldname');
			for(var i=1; i<=nlapiGetLineItemCount('gl_list'); ++i)
			{
				var marked = nlapiGetLineItemValue('gl_list','gl_match',i);		
				if(marked == 'T')
				{
					flTotal += ncParseFloatNV(nlapiGetLineItemValue('gl_list','custrecord_nbsabr_rs_amount',i),0)*100;
				}
			}
			nlapiSetFieldValue('gl_selected', nlapiFormatCurrency(flTotal/100));
			parent.nlapiSetFieldValue('matchvalue_gl', nlapiFormatCurrency(flTotal/100));
			
		}
		if(type == 'bs_list')
		{
			for(var i=1; i<=nlapiGetLineItemCount('bs_list'); ++i)
			{
				var marked = nlapiGetLineItemValue('bs_list','bs_match',i);	
				if(marked == 'T')
				{
					flTotal += ncParseFloatNV(nlapiGetLineItemValue('bs_list','custrecord_bsl_amount',i),0)*100;
				}
			}
			nlapiSetFieldValue('bk_selected', nlapiFormatCurrency(flTotal/100));	
			parent.nlapiSetFieldValue('matchvalue_bk', nlapiFormatCurrency(flTotal/100));
		}
		return (flTotal/100);
	}
	catch (GE) 
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
		alert('Exception at:'+errMsg);
	}
	
}
function nbsRefresh()
{
	var pathGL = document.getElementById('GL').contentWindow;
	if (pathGL.isinited && pathGL.isvalid)
	{
		pathGL.setWindowChanged(pathGL, false);
	}
	var pathBK = document.getElementById('BK').contentWindow;
	if (pathBK.isinited && pathBK.isvalid)
	{
		pathBK.setWindowChanged(pathBK, false);
	}

	if (window.isinited && window.isvalid)
	{
		setWindowChanged(window, false);
	}
	main_form.submit();
}

function getNextMatchNumber(accountId)
{
	var intNextNumber;
	var SF = [new nlobjSearchFilter('isinactive',null,'is', 'F',null),
	          new nlobjSearchFilter('custrecord_nbsabr_lmn_reconacct',null,'anyof', accountId,null)];
	var SC = [new nlobjSearchColumn('custrecord_lmn_matchnumber')];
	var SR = nlapiSearchRecord('customrecord_nbsabr_lastmatchnumber',null,SF,SC);
	if(SR !=null && SR.length > 0){	// should only be one!!
		intNextNumber = parseInt(SR[0].getValue('custrecord_lmn_matchnumber'),10)+1;
		nlapiSubmitField('customrecord_nbsabr_lastmatchnumber', SR[0].getId(), 'custrecord_lmn_matchnumber', intNextNumber, false);

	}
	else{		
		var recMatchNum = nlapiCreateRecord('customrecord_nbsabr_lastmatchnumber',null);
		recMatchNum.setFieldValue('custrecord_nbsabr_lmn_reconacct',accountId);
		recMatchNum.setFieldValue('customrecord_lmn_lastmatchnumber',1);
		stMatchNumId = nlapiSubmitRecord(recMatchNum, false, true);
		intNextNumber = 1;
	}
	return intNextNumber;
}

function glMatchButton() // doesn't get value form match checkbox
{
	nlapiSetFieldValue('custrecord_action', 'Match');
	if (window.isinited && window.isvalid)
	{
		setWindowChanged(window, false);
		window.main_form.submit();
	}
	if (parent.frames['BK'].window.isinited && parent.frames['BK'].window.isvalid && save_record(true))
	{
		setWindowChanged(parent.frames['BK'].window, false);
		parent.frames['BK'].window.main_form.submit();
	}
//	location.reload();
}

function ncParseFloatNV(S,F)
{
	if( (S===null) || (S.length==0) )
		return F;

	return parseFloat(S);
}
function ncParseIntNV(S,I)
{
	if( (S===null) || (S.length==0) )
		return I;

	return parseInt(S,10);
}
// button script for bank mark all button
function nbsBankMarkAll()
{	 

	var intCnt = nlapiGetLineItemCount('bs_list');
	for(var i=1; i<=intCnt; i+=1)
	{	 
	//	var flAmt = ncParseFloatNV(nlapiGetLineItemValue('bs_list','custrecord_amount',i),0)*100;
		nlapiSetLineItemValue('bs_list','bs_match',i,'T');
	//	flTotal += flAmt;	
	}
//	nlapiSetFieldValue('bk_selected', nlapiFormatCurrency(flTotal/100));	
	recalcMarkedTotal('bs_list');
	return true;
}

//button script for bank unmark all button
function nbsBankUnmarkAll()
{
	var intCnt = nlapiGetLineItemCount('bs_list');
	for(var i=1; i<=intCnt; i+=1)
	{	 
		nlapiSetLineItemValue('bs_list','bs_match',i,'F');		
	}
	nlapiSetFieldValue('bk_selected', '0.00');	
	parent.nlapiSetFieldValue('matchvalue_bk', '0.00');
	return true;
}
//button script for bank mark all button
function nbsGLMarkAll()
{	 

	var intCnt = nlapiGetLineItemCount('gl_list');
	for(var i=1; i<=intCnt; i+=1)
	{	 
		nlapiSetLineItemValue('gl_list','gl_match',i,'T');	
	}
	// recalculate total
	recalcMarkedTotal('gl_list');
	return true;

}
//button script for bank unmark all button
function nbsGLUnmarkAll()
{
	var intCnt = nlapiGetLineItemCount('gl_list');
	for(var i=1; i<=intCnt; i+=1)
	{	 
		nlapiSetLineItemValue('gl_list','gl_match',i,'F');		
	}
	nlapiSetFieldValue('gl_selected', '0.00');	
	parent.nlapiSetFieldValue('matchvalue_gl', '0.00');
	return true;
}


function nbsCreateGLTrx()
{
	var subsidId = nlapiGetFieldValue('bs_subsidiary');
	var accId = nlapiGetFieldValue('bs_account');
	var stTrxDate = nlapiGetFieldValue('bs_enddate');
	var subsidCurrId = nlapiGetFieldValue('bs_sub_currId');
	var trxCurrId = nlapiGetFieldValue('bs_acc_currId');
	
	var count = nlapiGetLineItemCount('bs_list');
	var arrLines = [];
	var stLines = '';
	
	for(var i=1; i<=count; i+=1)
	{	 
		var checked = nlapiGetLineItemValue('bs_list','bs_match',i);
		if(checked == 'T')
		{
			arrLines.push(nlapiGetLineItemValue('bs_list','internalid',i));
		}	
	}
	stLines = arrLines.join(':');
	
	var glpath = window.parent.document.getElementById('GL').contentWindow;
	var gl_count = glpath.nlapiGetLineItemCount('gl_list');
	var gl_arrLines = [];
	var glLines = '';
	
	for(var i=1; i<=gl_count; i+=1)
	{	 
		var checked = glpath.nlapiGetLineItemValue('gl_list','gl_match',i);
		if(checked == 'T')
		{
			gl_arrLines.push(glpath.nlapiGetLineItemValue('gl_list','internalid',i));
		}	
	}
	glLines = gl_arrLines.join(':');
	
	if ((arrLines.length == 0) && (gl_arrLines.length == 0))
	{
		alert(objResources[NBSABRSTR.PLSSLCTMINONETRN]);	// 'Please select at least one transaction'
		return false;
	}
	
	var URL;
	try {
		URL = nlapiResolveURL('SUITELET','customscript_nbsabr_creategltrx','customdeploy_nbsabr_creategltrx',false); // false => internal URL
	} catch (X)
	{
		// suitelet missing?
		var errMsg = 'Unable to create journal. Error text:'+X.toString();
		alert(errMsg);
		return;
	}
	
	window.open(URL+'&subsidiary='+subsidId+'&account='+accId+'&trxdate='+stTrxDate+'&basecurrency='
			+subsidCurrId+'&trxcurrency='+trxCurrId+'&lines='+stLines+'&gllines='+glLines);
}

function nbsABR_Help() {
	var linkURL = 'http://docs.nolanbusinesssolutions.com/abr/abr_rec_window.html';
	window.open( linkURL,"abrhelp",'width=1200px,height=900px,resizable=yes,scrollbars=yes');
}
// utility functions
function IndexOfArray(array, val)
{
	 for(var i=0; array !== null && i < array.length; i++)
	 	if(val == array[i])
	 		return i;
	 return -1;
}

/**
 * Function to check to see if a generated error is an instance of nlobjError object
 * @param {Object} _e
 * @return formatted error text
 */
function errText(_e) {
	var txt='';
	if (_e instanceof nlobjError) {
		//this is netsuite specific error
		txt = 'NLAPI Error: '+_e.getCode()+' :: '+_e.getDetails();
	} else {
		//this is generic javascript error
		txt = 'JavaScript/Other Error: '+_e.toString();
	}
	return txt;
}

var objResources = [];

function nbsABR_Recon_PageInit() {
	var userId = nlapiGetUser();
	var xlateURL = '/app/site/hosting/restlet.nl?script=customscript_nbsabr_translate_rl&deploy=1&userId='+userId;
	var reqHdr = new Object();
	reqHdr['Content-Type'] = 'application/json';
	var resp = nlapiRequestURL(xlateURL, null, reqHdr, null, 'GET');
	objResources = JSON.parse(resp.getBody());
}

/* special page init function for pre-load of page to retrieve current session id */
function nbsABR_PreLoadPageInit() {
	if (document.cookie.toString() != '') {
		var JSESSIONID = document.cookie.match(/JSESSIONID=[^;]+/);
		//var sessionId = 'NS_VER=2013.1.0; ' + JSESSIONID + ';';
		//var sessionId = 'NS_VER=2013.2.0; ' + JSESSIONID + ';';
		var sessionId = 'NS_VER='+nlapiGetContext().getVersion()+'.0; ' + JSESSIONID + ';';

		nlapiSetFieldValue('custpage_jsid', sessionId);
		main_form.submit();
	}
}
