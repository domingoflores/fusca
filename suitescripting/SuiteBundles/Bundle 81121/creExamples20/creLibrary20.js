//------------------------------------------------------------------
// Copyright 2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------

define(['N/search','N/url','N/crypto','N/encode','N/runtime','N/record'],
/**
 * @param {search} search
 * @param {url} url
 * @param {crypto} crypto
 * @param {encode} encode
 * @param {runtime} runtime
 * @param {record} record
 */
function(search,url,crypto,encode,runtime,record){
	
	CRE_LIB_CONSTS = {
			
	}
	
	/**
     * Description: Adds button to record for triggering CRE
     * Usage Example: 
     * var buttonParamObj={form:objForm,profileId:profileId,recid:recid,buttonId:'custpage_buttonid',buttonLabel:'Print CRE'}
     * lib.addPrintButton(buttonParamObj)
     */
	function addCREtriggerButton(buttonParamObj){
		var logTitle='addPrintButton';
		var CREurl = url.resolveScript({
			scriptId : 'customscript_cre_profile_suitelet_exampl',
			deploymentId : 'customdeploy_test_cre',
			params : {profileid: buttonParamObj.profileId, id: buttonParamObj.recid, doNotSend: 'T'}
		});
		var scr = "window.open('"+CREurl+"','_blank');";
		buttonParamObj.form.addButton({
			id : buttonParamObj.buttonId,
			label : buttonParamObj.buttonLabel,
			functionName: scr
		});
	}
	
	return{
		CRE_LIB_CONSTS : CRE_LIB_CONSTS,
		addCREtriggerButton : addCREtriggerButton,
	}
});
    