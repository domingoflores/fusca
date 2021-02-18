/**
 * Module Description


 * 
 * Version    Date            Author           Remarks
 * 1.0		  26 June 2014    smccurry         started with copy from other scripts.
 * 1.01		  15 July 2014    smccurry		   Moved the current version to PRODUCTION.
 * 1.02  	  03 Feb 2015	  sstreule		   Added in logic to change / update dual entry status field on the exchange record
 *                                             Updated the postFormDataAjax() and confirmFinalSubmit() functions
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your
 * script deployment.
 * 
 * @appliedtorecord recordType
 * 
 * @param {String}
 *            type Access mode: create, copy, edit
 * @returns {Void}
 */

var stateIDtoNameJSON = '{"_0":"Alabama","_1":"Alaska","_2":"Arizona","_3":"Arkansas","_4":"California","_5":"Colorado","_6":"Connecticut","_7":"Delaware","_8":"District of Columbia","_9":"Florida","_10":"Georgia","_11":"Hawaii","_12":"Idaho","_13":"Illinois","_14":"Indiana","_15":"Iowa","_16":"Kansas","_17":"Kentucky","_18":"Louisiana","_19":"Maine","_20":"Maryland","_21":"Massachusetts","_22":"Michigan","_23":"Minnesota","_24":"Mississippi","_25":"Missouri","_26":"Montana","_27":"Nebraska","_28":"Nevada","_29":"New Hampshire","_30":"New Jersey","_31":"New Mexico","_32":"New York","_33":"North Carolina","_34":"North Dakota","_35":"Ohio","_36":"Oklahoma","_37":"Oregon","_38":"Pennsylvania","_39":"Puerto Rico","_40":"Rhode Island","_41":"South Carolina","_42":"South Dakota","_43":"Tennessee","_44":"Texas","_45":"Utah","_46":"Vermont","_47":"Virginia","_48":"Washington","_49":"West Virginia","_50":"Wisconsin","_51":"Wyoming","_52":"Armed Forces Europe","_53":"Armed Forces Americas","_54":"Armed Forces Pacific","_101":"Alberta","_102":"British Columbia","_103":"Manitoba","_104":"New Brunswick","_105":"Newfoundland","_106":"Nova Scotia","_107":"Northwest Territories","_108":"Nunavut","_109":"Ontario","_110":"Prince Edward Island","_111":"Quebec","_112":"Saskatchewan","_113":"Yukon","_201":"Aberdeenshire","_202":"Angus","_203":"Argyll","_204":"Avon","_205":"Ayrshire","_206":"Banffshire","_207":"Bedfordshire","_208":"Berkshire","_209":"Berwickshire","_210":"Buckinghamshire","_211":"Caithness","_212":"Cambridgeshire","_213":"Cheshire","_214":"Clackmannanshire","_215":"Cleveland","_216":"Clwyd","_217":"Cornwall","_218":"County Antrim","_219":"County Armagh","_220":"County Down","_221":"County Fermanagh","_222":"County Londonderry","_223":"County Tyrone","_225":"Cumbria","_226":"Derbyshire","_227":"Devon","_228":"Dorset","_229":"Dumfriesshire","_230":"Dunbartonshire","_231":"County Durham","_232":"Dyfed","_233":"East Sussex","_234":"East Lothian","_235":"Essex","_236":"Fife","_237":"Gloucestershire","_238":"Greater London","_239":"Gwent","_240":"Gwynedd","_241":"Hampshire","_242":"Herefordshire","_243":"Hertfordshire","_245":"Inverness-shire","_246":"Isle of Arran","_247":"Isle of Barra","_248":"Isle of Benbecula","_249":"Isle of Bute","_250":"Isle of Canna","_251":"Isle of Coll","_252":"Isle of Colonsay","_253":"Isle of Cumbrae","_254":"Isle of Eigg","_255":"Isle of Gigha","_256":"Isle of Harris","_257":"Isle of Islay","_258":"Isle of Iona","_259":"Isle of Jura","_260":"Isle of Lewis","_261":"Isle of Mull","_262":"Isle of North Uist","_263":"Isle of Rum","_264":"Isle of Scalpay","_265":"Isle of Skye","_266":"Isle of South Uist","_267":"Isle of Tiree","_268":"Isle of Wight","_269":"Kent","_270":"Kincardineshire","_271":"Kinross-shire","_272":"Kirkcudbrightshire","_273":"Lanarkshire","_274":"Lancashire","_275":"Leicestershire","_276":"Lincolnshire","_277":"Merseyside","_278":"Mid Glamorgan","_279":"Mid Lothian","_280":"Middlesex","_281":"Morayshire","_282":"Nairnshire","_283":"Norfolk","_284":"North Humberside","_285":"North Yorkshire","_286":"Northamptonshire","_287":"Northumberland","_288":"Nottinghamshire","_289":"Oxfordshire","_290":"Peeblesshire","_291":"Perthshire","_292":"Powys","_293":"Renfrewshire","_294":"Ross-shire","_295":"Roxburghshire","_297":"Shropshire","_298":"Selkirkshire","_299":"Somerset","_300":"South Glamorgan","_301":"South Humberside","_302":"South Yorkshire","_303":"Staffordshire","_304":"Stirlingshire","_305":"Suffolk","_306":"Surrey","_307":"Sutherland","_308":"Tyne and Wear","_309":"Warwickshire","_310":"West Glamorgan","_311":"West Lothian","_312":"West Midlands","_313":"West Sussex","_314":"West Yorkshire","_315":"Wigtownshire","_316":"Wiltshire","_317":"Worcestershire","_400":"Australian Capital Territory","_401":"New South Wales","_402":"Northern Territory","_403":"Queensland","_404":"South Australia","_405":"Tasmania","_406":"Victoria","_407":"Western Australia","_500":"Aguascalientes","_501":"Baja California Norte","_502":"Baja California Sur","_503":"Campeche","_504":"Chiapas","_505":"Chihuahua","_506":"Coahuila","_507":"Colima","_508":"Distrito Federal","_509":"Durango","_510":"Guanajuato","_511":"Guerrero","_512":"Hidalgo","_513":"Jalisco","_514":"México (Estado de)","_515":"Michoacán","_516":"Morelos","_517":"Nayarit","_518":"Nuevo León","_519":"Oaxaca","_520":"Puebla","_521":"Querétaro","_522":"Quintana Roo","_523":"San Luis Potosí","_524":"Sinaloa","_525":"Sonora","_526":"Tabasco","_527":"Tamaulipas","_528":"Tlaxcala","_529":"Veracruz","_530":"Yucatán","_531":"Zacatecas","_601":"Heilongjiang Province","_602":"Jilin Province","_603":"Liaoning Province","_604":"Neimenggu A. R.","_605":"Gansu Province","_606":"Ningxia A. R.","_607":"Xinjiang A. R.","_608":"Qinghai Province","_609":"Hebei Province","_610":"Henan Province","_611":"Shandong Province","_612":"Shanxi Province","_613":"Shaanxi Province","_614":"Jiangsu Province","_615":"Zhejiang Province","_616":"Anhui Province","_617":"Hubei Province","_618":"Hunan Province","_619":"Sichuan Province","_620":"Guizhou Province","_621":"Jiangxi Province","_622":"Guangdong Province","_623":"Guangxi A. R.","_624":"Yunnan Province","_625":"Hainan Province","_626":"Xizang A. R.","_627":"Beijing","_628":"Shanghai","_629":"Tianjin","_630":"Chongqing","_631":"Fujian Province","_700":"Hokkaidō","_701":"Aomori","_702":"Iwate","_703":"Miyagi","_704":"Akita","_705":"Yamagata","_706":"Fukushima","_707":"Ibaraki","_708":"Tochigi","_709":"Gunma","_710":"Saitama","_711":"Chiba","_712":"Tokyo","_713":"Kanagawa","_714":"Niigata","_715":"Toyama","_716":"Ishikawa","_717":"Fukui","_718":"Yamanashi","_719":"Nagano","_720":"Gifu","_721":"Shizuoka","_722":"Aichi","_723":"Mie","_724":"Shiga","_725":"Kyoto","_726":"Osaka","_727":"Hyōgo","_728":"Nara","_729":"Wakayama","_730":"Tottori","_731":"Shimane","_732":"Okayama","_733":"Hiroshima","_734":"Yamaguchi","_735":"Tokushima","_736":"Kagawa","_737":"Ehime","_738":"Kochi","_739":"Fukuoka","_740":"Saga","_741":"Nagasaki","_742":"Kumamoto","_743":"Ōita","_744":"Miyazaki","_745":"Kagoshima","_746":"Okinawa"}',
	timestamp = '';

// Even listener that grabs the button id of the button that has been clicked.
jQuery(document).ready(function($) {
	
	var date = new Date(),
		month = date.getMonth() + 1,
		day = date.getDate(),
		year = date.getFullYear(),
		hour = date.getHours(),
		minute = date.getMinutes(),
		second = date.getSeconds(),
		ampm = '';
	
	ampm = ( hour > 12 ) ? 'pm' : 'am';
	hour = ( hour > 12 ) ? hour - 12 : hour;
	minute = ( minute < 10 ) ? '0' + minute : minute;
	second = ( second < 10 ) ? '0' + second : second;
	
	timestamp = month + '/' + day + '/' + year + ' ' + hour + ':' + minute + ':' + second + ' ' + ampm;
	
	
	setTimeout(function() {
		var btnType = getParameter('btnType');
//		alert(btnType);
		var usr = getParameter('usr');
		if(btnType == 'review') {
			var data = {};
			data.calltype = 'fetchReviewFieldData';
			data.statusrec = jQuery('#custpage_statusrecid').val();
			data.txnid = getParameter('txnid');
//			alert('About to fetch review fields from server: ' + JSON.stringify(data));
			getFormDataAjax(data);
		} else {
//			alert('About to call fetchFormFields');
			var data = buildInitialGetRequest('fetchfielddata');
//			var data = {};
			getFormDataAjax(data);
//			jQuery(".certificate" ).attr("disabled", "disabled");
		}

		reloadjQuery();
	}, 1000);

	jQuery("input[type='text']").focusout(function(){
//		alert(this.id);
		compareFields(this.id);
	  });
	jQuery('select').focusout(function(){
//		alert(this.id);
		compareFields(this.id);
	  });
	jQuery("#custRefresh.btn").click(function() {
		clearAllFields();
		createProgressBar();
		var data = buildGetRequestFields(this.id, 'fetchfielddata');
		getFormDataAjax(data);
	});
	jQuery("#custSubmit.btn").click(function() {
		var data = fetchFormFields(this.id, 'postfields');
		createProgressBar();
		postFormDataAjax(data);
	});
	jQuery("#reviewSubmit1.btn").click(function() {
		confirmFinalSubmit(this.id, 'postfields');
	});
	jQuery("#reviewSubmit2.btn").click(function() {
		confirmFinalSubmit(this.id, 'postfields');
	});
	jQuery("#addCertRow.btn").click(function() {
		var trNum = $('#certList tr:last-child td:first-child').html();
		if(trNum == null || trNum == '') {
			trNum = 0;
		}
		$('#certList').append(buildCertRow(parseInt(trNum)));
	});
	 jQuery(".achVerify").focusout(function(){ //e3_bank_abanumber
		 console.log(this.id);
		 verifyACHBankNameField(this.id);
	 });
	 jQuery(".wireVerify").focusout(function(){ //e3_wire_aba_numbere3_bank_abanumber
		 console.log(this.id);
		 verifyWireBankNameField(this.id);
	 });
	 jQuery(function() {
		 $( "#datepicker" ).datepicker();
	 });
});

function getFormDataAjax(data) {
	Ext.Ajax.request({
		url : nlapiResolveURL('SUITELET','customscript_acq_lot_de_entryform_s','customdeploy_acq_lot_de_entryform_s'), // /app/site/hosting/restlet.nl?script=483&deploy=1'
		method : 'POST',
		success : function(result, request) {
//			alert('Success: ' + result.responseText);
			var response = result.responseText;
			response = response.replace(/^\s*<!--[\s\S]*?-->\s*$/gm, '');
			var data = JSON.parse(response);
			console.log(JSON.stringify(data));
			if(data.callbacktype == 'returningDE1Fields' || data.callbacktype == 'returningDE2Fields') {
				handleRetrieveFieldsResponse(data);
				closeProgressBar();
				jQuery(".certificate").attr("disabled", "disabled");
				jQuery(".certificate").css('background-color', '#EBFFEB');
				verifyACHBankNameField('e3_bank_abanumber');
				verifyWireBankNameField('e3_wire_aba_number');
			} else if (data.callbacktype == 'returningReviewFields' ){
//				console.log('returningReviewFields: ' + JSON.stringify(data));
				handleRetrieveReviewFieldsResponse(data);
				closeProgressBar();
				jQuery(".certificate" ).attr("disabled", "disabled");
				jQuery(".certificate").css('background-color', '#EBFFEB');
				verifyACHBankNameField('de1_e3_bank_abanumber');
				verifyWireBankNameField('de1_e3_wire_aba_number');
				verifyACHBankNameField('de2_e3_bank_abanumber');
				verifyWireBankNameField('de2_e3_wire_aba_number');
			}
			
			if( $('#datetimestamp').val() == '' ) {
				 $('#datetimestamp').val(timestamp);
			 }
		},
		failure : function(result, request) {
			alert('There was a problem loading data on the page.');
			closeProgressBar();
//			Ext.MessageBox.alert('Failed', result.responseText);
		},
		jsonData : JSON.stringify(data)
	});
}

function postFormDataAjax(data, finalSubmit, acqStatus) {
	Ext.Ajax.request({
		url : nlapiResolveURL('SUITELET', 'customscript_acq_lot_de_entryform_s', 'customdeploy_acq_lot_de_entryform_s'), // /app/site/hosting/restlet.nl?script=483&deploy=1'
		method : 'POST',
		success : function(result, request) {
			 // This alert is not for testing but actually displays the response message.  Leave on.
			 closeProgressBar();
			 alert(result.responseText); // LEAVE THIS ALERT ON IT IS NOT FOR TESTING BUT ACTUALLY SHOWS A RESPONSE MESSAGE
			 //Need to figure out what the status of the DE Status record is. Would it be better to search the exchange record and get the value of the field and then if it is already "IN PROGRESS" we don't load it?  Or do we just need to load the record and update the field regardless?
			 var exRec = nlapiLoadRecord('customrecord_acq_lot', data.txnid);
			 
			 if((exRec.getFieldValue(acqStatus) != '3') && (finalSubmit != 'True')){
				 exRec.setFieldValue(acqStatus, '3');
				 //nlapiSubmitRecord(exRec);
				 //nlapiSubmitField('customrecord_acq_lot', data.txnid, 'custrecord_acq_loth_zzz_zzz_de_status', '3');
				 //alert('Setting the Dual Entry Status for Exchange Record ' + data.txnid + ' to be In Process');
			 }else{
				 //We are all good, nothing needs to be done here
				 //if(finalSubmit != 'True'){
					//alert('Exchange Record ' + data.txnid + ' is already In Process for Dual Entry Status');
				 //}else{
					//alert('Exchange Record ' + data.txnid + ' is set to Completed from the confirmFinalSubmit Function');
				 //}
			 }
		},
		failure : function(result, request) {
			alert('There was a problem saving the page or loading the page.');
			closeProgressBar();
//			Ext.MessageBox.alert('Failed', result.responseText);
		},
		jsonData : JSON.stringify(data)
	});
}

function buildInitialGetRequest(calltype) {
		var data = {};
		data.calltype = calltype;
		data.statusrec = document.getElementById('custpage_statusrecid').value || null;
		data.detype = document.getElementById('custpage_detype').value || null;
		data.txntype = 'customrecord_acq_lot';
		data.txnid = nlapiGetFieldValue('custpage_txnid');
		data.user = nlapiGetFieldValue('custpage_user');
		data.viewmode = nlapiGetFieldValue('custpage_viewmode');
		console.log(JSON.stringify(data));
		return data;
}

function buildCertRow(x) {
    var certRowHTML = '<tr id="tr_'+ (x+1) +'" style="margin:20px;" class="certRow">';
    certRowHTML += '<td style="width: 30px;"> '+ (x + 1) +' </td>';
    certRowHTML += '<td class="text-right fieldCol">';
    certRowHTML += '<select class="form-control dropdown certificate" id="ST_'+ (x + 1) +'">';
    certRowHTML += '<option value=""></option>';
    certRowHTML += document.getElementById('hiddenSelectData').innerHTML;
//    alert(hidden);
    // Load up a certificate record and get the Certificate Type (Security Type) field and create select options
//    var certTypesOBJ = buildCertTypesListOBJ();
//    var certTypesList = buildSelectOptionsHTML(certTypesOBJ);
//    certRowHTML += certTypesList;
    certRowHTML += '</select>';
    certRowHTML += '</td>';
    certRowHTML += '<td class="text-right fieldCol"><input type="text" class="form-control certificate" id="SN_'+ (x + 1) +'" placeholder="" style="width:90%;"></td>';
    certRowHTML += '<td class="text-right fieldCol"><input type="text" class="form-control certificate" id="SH_'+ (x + 1) +'" placeholder="" style="width:90%;"></td>';
    certRowHTML += '<td class="text-right fieldCol" style="heigth:12px;width:30px;">';
    certRowHTML += '<select class="form-control dropdown" id="MISS_'+ (x + 1) + '">';
    certRowHTML += '<option></option>';
    certRowHTML += '<option value="1">Yes</option>';
    certRowHTML += '<option value="2">No</option>';
    certRowHTML += '</select>';
    certRowHTML += '</td>';
    certRowHTML += '<td class="checkbox">&nbsp;<label><input id="MATCH_'+ (x+1) +'" type="checkbox">&nbsp;Matches Certificate</label></td>';
    certRowHTML += '<td id="ID_' + (x + 1) + '" class="certRowID">';
    certRowHTML += '</td>';
    certRowHTML += '</tr>';
    return certRowHTML;
}

function buildReviewCertRow(x) {
    var certRowHTML = '<tr id="tr_'+ (x+1) +'" style="margin:20px;" class="certRow">';
    certRowHTML += '<td style="width: 30px;"> '+ (x + 1) +' </td>';
    certRowHTML += '<td class="text-right fieldCol">';
    certRowHTML += '<select class="form-control dropdown certificate" id="ST_'+ (x + 1) +'">';
    certRowHTML += '<option value=""></option>';
    certRowHTML += document.getElementById('hiddenSelectData').innerHTML;
//    alert(hidden);
    // Load up a certificate record and get the Certificate Type (Security Type) field and create select options
//    var certTypesOBJ = buildCertTypesListOBJ();
//    var certTypesList = buildSelectOptionsHTML(certTypesOBJ);
//    certRowHTML += certTypesList;
    certRowHTML += '</select>';
    certRowHTML += '</td>';
    certRowHTML += '<td class="text-right fieldCol"><input type="text" class="form-control certificate" id="SN_'+ (x + 1) +'" placeholder="" style="width:90%;"></td>';
    certRowHTML += '<td class="text-right fieldCol"><input type="text" class="form-control certificate" id="SH_'+ (x + 1) +'" placeholder="" style="width:90%;"></td>';
    certRowHTML += '<td id="de1_MISS_'+ (x+1) +'"></td>';
    certRowHTML += '<td id="de2_MISS_'+ (x+1) +'"></td>';
    certRowHTML += '<td id="de1_MATCH_'+ (x+1) +'"></td>';
    certRowHTML += '<td id="de2_MATCH_'+ (x+1) +'"></td>';
    certRowHTML += '<td id="ID_' + (x + 1) + '" class="certRowID">';
    certRowHTML += '</td>';
    certRowHTML += '</tr>';
    return certRowHTML;
}

//function buildReviewCertRow(x) {
//	var selectOptions = document.getElementById('hiddenSelectData').innerHTML;
//	
//    var certRowHTML = '<tr id="tr_'+ (x+1) +'" style="margin:20px;" class="certRow">';
//    certRowHTML += '<td style="width: 30px;"> '+ (x + 1) +' </td>';
//    
//    // DE0 SECURITY TYPE
//    certRowHTML += '<td id="de0_ST" class="text-right fieldCol">';
//    certRowHTML += '<select class="form-control dropdown certificate certde0" id="de0ST_'+ (x + 1) +'">';
//    certRowHTML += '<option value=""></option>';
//    // Load up a certificate record and get the Certificate Type (Security Type) field and create select options
//    certRowHTML += selectOptions;
//    certRowHTML += '</select>';
//    certRowHTML += '</td>';
//    // DE1 SECURITY TYPE
//    certRowHTML += '<td id="de1_ST" class="text-right fieldCol">';
//    certRowHTML += '<select class="form-control dropdown certificate certde1" id="de1ST_'+ (x + 1) +'">';
//    certRowHTML += '<option value=""></option>';
//    certRowHTML += selectOptions;
//    certRowHTML += '</select>';
//    certRowHTML += '</td>';
//    // DE2 SECURITY TYPE
//    certRowHTML += '<td id="de2_ST" class="text-right fieldCol" style="border-right-style:double; border-right-width: 2px;">';
//    certRowHTML += '<select class="form-control dropdown certificate certde2" id="de2ST_'+ (x + 1) +'">';
//    certRowHTML += '<option value=""></option>';
//    certRowHTML += selectOptions;
//    certRowHTML += '</select>';
//    certRowHTML += '</td>';
//
//    // DE0, DE1, DE2 SECURITY NUMBER (CERTIFICATE NUMBER) - THIS IS USED AS A UNIQUE ID - MUST BE DIFFERENT FOR EVERY CERTIFICATE IN A DEAL
//    certRowHTML += '<td id="de0_SN" class="text-right fieldCol"><input type="text" class="form-control certificate certde0 certSN" id="de0SN_'+ (x + 1) +'" placeholder="" style="width:90%;"></td>';
//    certRowHTML += '<td id="de1_SN" class="text-right fieldCol"><input type="text" class="form-control certificate certde1 certSN" id="de1SN_'+ (x + 1) +'" placeholder="" style="width:90%;"></td>';
//    certRowHTML += '<td id="de2_SN" class="text-right fieldCol" style="border-right-style:double; border-right-width: 2px;"><input type="text" class="form-control certificate certde2 certSN" id="de2SN_'+ (x + 1) +'" placeholder="" style="width:90%;"></td>';
//    // DE0, DE1, DE2 SECURITY NUMBER OF SHARES
//    certRowHTML += '<td id="de0_SH" class="text-right fieldCol"><input type="text" class="form-control certificate certde0" id="de0SH_'+ (x + 1) +'" placeholder="" style="width:90%;"></td>';
//    certRowHTML += '<td id="de1_SH" class="text-right fieldCol"><input type="text" class="form-control certificate certde1" id="de1SH_'+ (x + 1) +'" placeholder="" style="width:90%;"></td>';
//    certRowHTML += '<td id="de2_SH" class="text-right fieldCol" style="border-right-style:double; border-right-width: 2px;"><input type="text" class="form-control certificate certde2" id="de2SH_'+ (x + 1) +'" placeholder="" style="width:90%;"></td>';
//
//    certRowHTML += '<td id="id_' + (x + 1) + '" class="certRowID">';
//    certRowHTML += '</td>';
//    certRowHTML += '</tr>';
//    return certRowHTML;
//}

function compareFields(tmpID) {
//	var tmpID = this.id;
	var tmpArry = tmpID.split('_');
	var prefix = tmpArry[0] + '_';
	var newTmpID = null;
	if(prefix != null) {
//		console.log(prefix);
		newTmpID = tmpID.replace(prefix, '');
//		console.log(newTmpID);
	}
	var src = '#de0_' + newTmpID;
//	console.log(src);
	var srcFld = jQuery(src).val();
//	var srcFld = document.getElementById(src).valueOf();
//	console.log('srcFld '+ srcFld);
	var de1 = '#de1_' + newTmpID;
//	console.log(de1);
	var de1Fld = jQuery(de1).val();
//	console.log('de1Fld '+ srcFld);
	var de2 = '#de2_' + newTmpID;
//	console.log(de2);
    var de2Fld = jQuery(de2).val();
//    console.log('de2Fld '+ srcFld);
    compareFieldValues(srcFld,de1Fld,de2Fld,newTmpID);
//    compareFieldValues(srcFld,de1Fld,de2Fld);
}

function reloadjQuery() {
	// Reload Refresh button after modifying the DOM because it breaks when removing the Submit button.
	jQuery("#custRefresh.btn").click(function() {
		// Clear the fields
		clearAllFields();
		// Ajax call to get the field data again.
		var data = buildGetRequestFields(this.id, 'fetchfielddata');
		getFormDataAjax(data);
		closeProgressBar();
	});
	 jQuery(".achVerify").focusout(function(){ //e3_bank_abanumber
		 console.log(this.id);
		 verifyACHBankNameField(this.id);
	 });
	 jQuery(".wireVerify").focusout(function(){ //e3_wire_aba_numbere3_bank_abanumber
		 console.log(this.id);
		 verifyWireBankNameField(this.id);
	 });
}

function confirmFinalSubmit(btnid, calltype) {
	var conf = confirm("Press OK to submit the DE1 fields to the Exchange Record.\n\nThis will only submit the DE1 fields and will\nnot change the DE0 or DE2 fields.");
	if (conf == true) {
	    var data = fetchReviewFormFields(btnid, calltype);
	    var finalSubmit = 'True';
	    var testOrReleased = 'TEST';
	    //Added this if to be able to set the status field that is being updated.  This is to be used during testing or bugfixing
		if(testOrReleased == 'TEST'){
			var acqStatus = 'custrecord_test_acq_status_test'; //Used for testing purposes to set a Temporary Test Status that does not drive any searches or portlets
		}else{
			var acqStatus = 'custrecord_acq_loth_zzz_zzz_acqstatus'; //This is the "Real Deal" aka.  the actual field that needs to be updated once testing is completed
		}
	    createProgressBar();
	    postFormDataAjax(data, finalSubmit, acqStatus);
	    
	    var exRec = nlapiLoadRecord('customrecord_acq_lot', data.txnid);
		//var acqStatus = exRec.getFieldValue('custrecord_acq_loth_zzz_zzz_acqstatus');
		//var loginStatus = exRec.getFieldValue('custrecord_acq_loth_zzz_zzz_login_status');
		//var lockoutStatus = exRec.getFieldValue('custrecord_acq_loth_zzz_zzz_lockout_stas');
		var holdingsStatus = exRec.getFieldValue('custrecord_acq_loth_zzz_zzz_vrfy_hldngs');
		var contactStatus = exRec.getFieldValue('custrecord_acq_loth_zzz_zzz_cntct_info');
		var taxStatus = exRec.getFieldValue('custrecord_acq_loth_zzz_zzz_tax_doc_stas');
		var payInfoStatus = exRec.getFieldValue('custrecord_acq_loth_zzz_zzz_pay_info');
		var medallionStatus = exRec.getFieldValue('custrecord_acq_loth_zzz_zzz_mdlin_status');
		var eSignStatus = exRec.getFieldValue('custrecord_acq_loth_zzz_zzz_esign_status');
		var addDocStatus = exRec.getFieldValue('custrecord_acq_loth_zzz_zzz_add_doc_stat');
		//var dualEntryStatus = exRec.getFieldValue('custrecord_acq_loth_zzz_zzz_de_status');
	    
		if((holdingsStatus == '2')||(holdingsStatus == '3')){
			exRec.setFieldValue('custrecord_acq_loth_zzz_zzz_vrfy_hldngs', '4');
		}
		if((contactStatus == '2')||(contactStatus == '3')){
			exRec.setFieldValue('custrecord_acq_loth_zzz_zzz_cntct_info', '4');
		}
		if((taxStatus == '2')||(taxStatus == '3')||(taxStatus == '4')){
			exRec.setFieldValue('custrecord_acq_loth_zzz_zzz_tax_doc_stas', '5');
		}
		if((payInfoStatus == '2')||(payInfoStatus == '3')){
			exRec.setFieldValue('custrecord_acq_loth_zzz_zzz_pay_info', '4');
		}
		if(medallionStatus == '3'){
			exRec.setFieldValue('custrecord_acq_loth_zzz_zzz_mdlin_status', '4');
		}
		if((eSignStatus == '2')||(eSignStatus == '3')){
			exRec.setFieldValue('custrecord_acq_loth_zzz_zzz_esign_status', '4');
		}
		if(addDocStatus == '3'){
			exRec.setFieldValue('custrecord_acq_loth_zzz_zzz_add_doc_stat', '4');
		}
		
		//exRec.setFieldValue('custrecord_acq_loth_zzz_zzz_de_status', '4');
		
		
	    //nlapiSubmitRecord(exRec);
		//nlapiSubmitField('customrecord_acq_lot', data.txnid, 'custrecord_acq_loth_zzz_zzz_de_status', '4');
	} else {
		return;
	}
}

function fetchFormFields(btntype, calltype) {// fetchfielddata
	var fields = new Array();
	var values = new Array();

	var data = {};
	data.datetimestamp = jQuery('#datetimestamp').val();
	data.entrycomplete = jQuery("#entrycomplete").prop('checked');
	
	data.alterations = jQuery("#alterations").prop('checked');
//	alert('data.alterations: ' + data.alterations);
	data.de_notes = document.getElementById('header_notes').value;
	data.statusrec = document.getElementById('custpage_statusrecid').value;
	var erfields = {};
	// FETCH THE CONTENT OF THE EXCHANGE RECORD FIELDS
	var allFields = document.getElementsByClassName('exrecords');
	for ( var i = 0; i < allFields.length; i++) {
		var field = allFields[i];
		if (field.value != null && field.value != '') {
			if (field.type == 'text') {
				erfields[field.id] = field.value;
			}
			if (field.type = 'select-one' && field.selectedIndex != '' && field.selectedIndex != null) {
				erfields[field.id] = field[field.selectedIndex].text;
			}
		}
	}
	
	data.erfields = erfields;
//	data.erFields = fields;
//	data.erValues = values;
	// FETCH THE CONTENT OF THE CERTIFICATE FIELDS
	var certFields = {};
	var allCertRows = document.getElementsByClassName('certRow');
	for ( var i = 0; i < allCertRows.length; i++) {
		var row = allCertRows[i];
		console.log('Row: ' + row);
		var tmpId = row.id;
		var tmpRowArry = tmpId.split('_');
		var rowNum = tmpRowArry + 1;
		var cert_st = jQuery('#ST_' + tmpRowArry[1]).val();
		var cert_sn = jQuery('#SN_' + tmpRowArry[1]).val();
		var cert_sh = jQuery('#SH_' + tmpRowArry[1]).val();
		var cert_id = jQuery('#ID_' + tmpRowArry[1]).html();
		var cert_miss = jQuery('#MISS_' + tmpRowArry[1]).val();
		var cert_match = jQuery('#MATCH_' + tmpRowArry[1]).prop('checked');

	  if(cert_sn != null && cert_sn != '') {
		  var obj = new createCertObj(cert_st, cert_sn, cert_sh, cert_id, cert_miss, cert_match);
		  certFields['CERT_' + cert_id] = obj;
	  } else {
		  var ndate = new Date();
		  var ntimestamp = ndate.getTime(); 
		  cert_sn = 'TEMP-' + ntimestamp;
	  }
	}
	
	data.certfields = certFields;
//	alert('certFields: ' + JSON.stringify(certFields));
	data.calltype = calltype;
	data.detype = nlapiGetFieldValue('custpage_detype');
	if (btntype == 'custSubmit' || btntype == 'custRefresh') {
		data.btntype = btntype;
	} else {
		data.btntype = nlapiGetFieldValue('custpage_btntype');
	}
	data.txntype = 'customrecord_acq_lot';
	data.txnid = nlapiGetFieldValue('custpage_txnid');
	data.user = nlapiGetFieldValue('custpage_user');
	data.viewmode = nlapiGetFieldValue('custpage_viewmode');
	console.log('fetchFormFields(): ' + JSON.stringify(data));
//	alert('About to POST data');
	return data;
}

function fetchReviewFormFields(btntype, calltype) {// fetchfielddata
	var fields = new Array();
	var values = new Array();

	var data = {};
	data.datetimestamp = jQuery('#de1_datetimestamp').val();
	data.entrycomplete = jQuery("#entrycomplete").prop('checked');
	data.alterations = jQuery("#alterations").prop('checked');
	data.de_notes = document.getElementById('header_notes').value;
	data.statusrec = document.getElementById('custpage_statusrecid').value;
	data.reviewerid = nlapiGetContext().getUser();
	var erfields = {};
	// FETCH THE CONTENT OF THE EXCHANGE RECORD FIELDS
	var allFields = document.getElementsByClassName('de1');
	for ( var i = 0; i < allFields.length; i++) {
		var field = allFields[i];
		if (field.value != null && field.value != '') {
			var fldID = field.id;
			var prefx = 'de1_';
			fldID = fldID.replace(prefx, '');
//			console.log('new field id: ' + fldID);
			if (field.type == 'text') {
				erfields[fldID] = field.value;
			}
			if (field.type = 'select-one' && field.selectedIndex != '' && field.selectedIndex != null) {
				erfields[fldID] = field[field.selectedIndex].text;
			}
		}
	}
	data.erfields = erfields;
//	data.erFields = fields;
//	data.erValues = values;
	// FETCH THE CONTENT OF THE CERTIFICATE FIELDS
	var certFields = {};
	var allCertRows = document.getElementsByClassName('certRow');
	for ( var i = 0; i < allCertRows.length; i++) {
		var row = allCertRows[i];
		console.log('Row: ' + row);
		var tmpId = row.id;
		var tmpRowArry = tmpId.split('_');
		var rowNum = tmpRowArry + 1;
		var cert_st = jQuery('#ST_' + tmpRowArry[1]).val();
		var cert_sn = jQuery('#SN_' + tmpRowArry[1]).val();
		var cert_sh = jQuery('#SH_' + tmpRowArry[1]).val();
		var cert_id = jQuery('#ID_' + tmpRowArry[1] + ' a').html();
		var cert_miss = jQuery('#MISS_' + tmpRowArry[1]).val();
		var cert_match = jQuery('#MATCH_' + tmpRowArry[1]).prop('checked');

	  if(cert_sn != null && cert_sn != '') {
		  var obj = new createCertObj(cert_st, cert_sn, cert_sh, cert_id, cert_miss, cert_match);
		  certFields['CERT_' + cert_id] = obj;
	  } else {
		  var ndate = new Date();
		  var ntimestamp = ndate.getTime(); 
		  cert_sn = 'TEMP-' + ntimestamp;
	  }
	}
	
	data.certfields = certFields;
//	alert('certFields: ' + JSON.stringify(certFields));
	data.calltype = 'postReviewFields';
	data.detype = 'review'; //nlapiGetFieldValue('custpage_detype');
	data.btntype = 'reviewSubmit';
//	if (btntype == 'custSubmit' || btntype == 'custRefresh') {
//		data.btntype = btntype;
//	}
	data.txntype = 'customrecord_acq_lot';
	data.txnid = nlapiGetFieldValue('custpage_txnid');
	data.user = nlapiGetFieldValue('custpage_user');
	data.viewmode = nlapiGetFieldValue('custpage_viewmode');
//	alert('fetchFormFields(): ' + JSON.stringify(data));
	console.log('sending fetchFormFields data: '+ JSON.stringify(data));
	return data;
}

function buildGetRequestFields(btntype, calltype) {// fetchfielddata
	var data = {};
	data.calltype = calltype;
	data.detype = nlapiGetFieldValue('custpage_detype');
//	if (btntype == 'custSubmit' || btntype == 'custRefresh') {
//		data.btntype = btntype;
//	} else {
//		data.btntype = nlapiGetFieldValue('custpage_btntype');
//	}
	data.txntype = 'customrecord_acq_lot';
	data.txnid = nlapiGetFieldValue('custpage_txnid');
	data.user = nlapiGetFieldValue('custpage_user');
	data.viewmode = nlapiGetFieldValue('custpage_viewmode');
	return data;
}

function handleRetrieveFieldsResponse(data) {
	/*********************************************
	 * POPULATE THE FIELDS WITH THE RESPONSE DATA
	 *********************************************/
	var statesObj = JSON.parse(stateIDtoNameJSON);
	
//	alert('handleRetrieveFieldsResponse' + JSON.stringify(data));
	console.log('response: ' + JSON.stringify(data));
//	alert(data.alterations);
	/******************************************
	 * IF VIEW MODE THEN REMOVE HEADER FIELDS
	 ******************************************/
	var viewEdit = nlapiGetFieldValue('custpage_viewmode');
	if (viewEdit == 'view') {
		jQuery("#custSubmit").remove();
		jQuery("#entrycomplete").remove();
		jQuery("#alterations").remove();
		jQuery("#header_notes").remove();
//		jQuery("#td_alterations").replaceWith('<td id="td_alterations"></td>');
//		jQuery("#td_entrycomplete").replaceWith('<td id="td_entrycomplete"></td>');
		// Reload the Refresh button
		reloadjQuery();
	} else {
		
	}
//	alert('data.entrycomplete: ' + data.entrycomplete);
	if(data.entrycomplete == 3) {
//		alert('response data.entrycomplete: ' + data.entrycomplete);
		jQuery("#entrycomplete").prop( "checked", true );
	} else {
		jQuery("#entrycomplete").prop( "checked", false );
	}
	if(data.alterations == 'T') {
		jQuery("#alterations").prop( "checked", true );
	} else {
		jQuery("#alterations").prop( "checked", false );
	}
	if(data.de_notes != null && data.de_notes != '') {
		jQuery("#header_notes").val(data.de_notes);
	}
	if(data.datetimestamp != null && data.datetimestamp != '') {
		jQuery("#datetimestamp").val(data.datetimestamp);
	}
	
	var erFields = data.erfields;
	var certFields = data.certfields;
	var tmpTotalCerts = [];
	
//	console.log('data.certfields: ' + JSON.stringify(data.certfields));
	for(field in certFields) {
		tmpTotalCerts.push(certFields[field].SN);
	}
//	console.log('tmpTotalCerts: ' + numOfCerts.length);
	 var uniqueArray = tmpTotalCerts.filter(function(elem, pos) {
		    return tmpTotalCerts.indexOf(elem) == pos;
	 }); 
	 var numOfCerts = uniqueArray.length;
//	 console.log(uniqueArray);
//	var numOfCerts = Object.keys(certFields).length;
	for(var c = 0; c < numOfCerts; c++) {
		jQuery('#certList').append(buildCertRow(parseInt(c)));
	}
	// Loop through all of the fields passed back and retrieve the values and
	// populate the Exchange Record tab fields on screen
	for (field in erFields) {
		var fieldID = '#' + field;
		var fieldData = erFields[field] || {};
//		console.log('fieldID: ' + fieldID + ' - ' + fieldData);
		var isSelect = jQuery('select[name=select-name][id=' + fieldID + ']');
		if (viewEdit == 'view') {
			if (fieldData != null && fieldData != '' && jQuery(fieldID).prop('type') != 'select-one') {
				jQuery(fieldID).attr("disabled", "disabled");
				jQuery(fieldID).css('background-color', '#CCFFCC');
			} else if (jQuery(fieldID).prop('type') == 'select-one') {
				// alert(fieldData);
				if (fieldData != null && fieldData != '') {
//					jQuery(fieldID).val(fieldData);
					jQuery(fieldID +' option').filter(function () { return $(this).html() == fieldData; }).prop('selected', true);
					jQuery(fieldID).attr("disabled", "disabled");
					jQuery(fieldID).css('background-color', '#CCFFCC');
				} else {
//					jQuery(fieldID).val(fieldData);
					jQuery(fieldID +' option').filter(function () { return $(this).html() == fieldData; }).prop('selected', true);
					jQuery(fieldID).attr("disabled", "disabled");
					// jQuery(fieldID).css('background-color' , '#FF6666');
				}
			} else if (fieldData == null || fieldData == '') {
				jQuery(fieldID).attr("disabled", "disabled");
			}
		}
		if (viewEdit == 'edit') {
			if (jQuery(fieldID).prop('type') == 'select-one') {
				jQuery(fieldID +' option').filter(function () { return $(this).html() == fieldData; }).prop('selected', true);
			} else {
				jQuery(fieldID).val(fieldData);
			}
		}
	}
	
	for (field in erFields) {
		var fieldID = field;
		var fieldData = erFields[field];
		var isSelect = jQuery('select[name=select-name][id=' + fieldID + ']');
//		if (viewEdit == 'view') {
//			if (fieldData != null && fieldData != ''
//					&& jQuery(fieldID).prop('type') != 'select-one') {
//				// alert(data[field]);
//				jQuery(fieldID).val(fieldData);
//				jQuery(fieldID).attr("disabled", "disabled");
//				jQuery(fieldID).css('background-color', '#CCFFCC');
//			} else if (jQuery(fieldID).prop('type') == 'select-one') {
//				// alert(fieldData);
//				if (fieldData != null && fieldData != '') {
//					jQuery(fieldID).val(fieldData);
//					jQuery(fieldID).attr("disabled", "disabled");
//					jQuery(fieldID).css('background-color', '#CCFFCC');
//				} else {
//					jQuery(fieldID).val(fieldData);
//					jQuery(fieldID).attr("disabled", "disabled");
//					// jQuery(fieldID).css('background-color' , '#FF6666');
//				}
//			} else if (fieldData == null || fieldData == '') {
//				jQuery(fieldID).attr("disabled", "disabled");
//			}
//		}
		if (viewEdit == 'edit' || viewEdit == 'view') {
			var de1FieldID = '#de1_' + fieldID;
			jQuery(de1FieldID).val(fieldData);
			jQuery(de1FieldID).css('background-color', '#CCFFCC');
			var de2FieldID = '#de2_' + fieldID;
			jQuery(de2FieldID).val(fieldData);
			jQuery(de2FieldID).css('background-color', '#CCFFCC');
		}
		if (viewEdit == 'view') {
			var de1FieldID = '#de1_' + fieldID;
			jQuery(de1FieldID).attr("disabled", "disabled");
			var de2FieldID = '#de2_' + fieldID;
			jQuery(de2FieldID).attr("disabled", "disabled");
		}
	}
	// Loop through all of the fields passed back and retrieve the values and
	// populate the Certificates tab fields on screen
	
	var f = 1;
//	alert('certFields ' + JSON.stringify(certFields));
	console.log('certFields ' + JSON.stringify(certFields));
	// Empty the table before building or rebuilding the rows.
	if(certFields != null && certFields != '') {
		for (field in certFields) {
			buildCertRow(f-1);
			var tmp = field.split('_');
			var ctype = tmp[0];
			var cid = tmp[1];
			var fieldData = certFields[field];
//		alert(JSON.stringify(fieldData));
			if (viewEdit == 'view') {
				if (fieldData.ID != null && fieldData.ID != '') {
//				alert('fieldData.SN: ' + fieldData.SN);
					jQuery('#SN_' + f).val(fieldData.SN);
					jQuery('#SN_' + f).attr("disabled", "disabled");
					jQuery('#SN_' + f).css('background-color', '#CCFFCC');
					jQuery('#SH_' + f).val(fieldData.SH);
					jQuery('#SH_' + f).attr("disabled", "disabled");
					jQuery('#SH_' + f).css('background-color', '#CCFFCC');
					jQuery('#ST_' + f).val(fieldData.ST);
					jQuery('#ST_' + f).attr("disabled", "disabled");
					jQuery('#ST_' + f).css('background-color', '#CCFFCC');
//				alert('fieldData.MISSING: ' + fieldData.MISSING);
					jQuery('#MISS_' + f).val(fieldData.MISSING);
					jQuery('#MISS_' + f).attr("disabled", "disabled");
					jQuery('#MISS_' + f).css('background-color', '#CCFFCC');
//				alert('fieldData.MATCH: ' + fieldData);
					if(fieldData.MATCH == true) {
						jQuery('#MATCH_' + f).prop( "checked", true );
					} else {
						jQuery('#MATCH_' + f).prop( "checked", false );
					}
//				alert('fieldData.ID: ' + fieldData.ID);
//				jQuery('#ID_' + f).html(fieldData.ID);
//				if(nlapiGetFieldValue('custpage_user') == 'admin'){
//					jQuery('#ID_' + f).html('<a href="' + nlapiResolveURL("RECORD", "customrecord_acq_lot_cert_entry", fieldData.ID, "VIEW") + '">' + fieldData.ID + '</a>');
//				}
					jQuery('#ID_' + f).html(fieldData.ID);
//				jQuery('#ID_' + f).attr("disabled", "disabled");
//				jQuery('#ID_' + f).css('background-color', '#CCFFCC');
				} 
				else if (jQuery(fieldID).prop('type') == 'select-one') {
					// alert(fieldData);
					if (fieldData == null || fieldData == '') {
//					jQuery(fieldID).val(fieldData);
//					jQuery(fieldID).attr("disabled", "disabled");
					} else {
						// TODO: NOT SURE WHAT COLOR TO SHOW IF A SELECT FIELD IS ''
						// jQuery(fieldID).val(fieldData);
						// jQuery(fieldID).attr("disabled", "disabled");
						// jQuery(fieldID).css('background-color' , '#FF6666');
					}
				} else if (fieldData == null && fieldData == '') {
//				jQuery(fieldID).attr("disabled", "disabled");
//				jQuery(fieldID).css('background-color', '#FF6666');
				}
			}
			if (viewEdit == 'edit') {
//			if(data.entrycomplete == true) {
//				document.getElementById('entrycomplete').checked = true;
//			}
				jQuery('#SN_' + f).val(fieldData.SN);
				jQuery('#SH_' + f).val(fieldData.SH);
				jQuery('#ST_' + f).val(fieldData.ST);
//			alert('fieldData.MISS: ' + fieldData.MISS);
				jQuery('#MISS_' + f).val(fieldData.MISS);
				if(fieldData.MATCH == true) {
					jQuery('#MATCH_' + f).prop( "checked", true );
				} else {
					jQuery('#MATCH_' + f).prop( "checked", false );
				}
				jQuery('#ID_' + f).html(fieldData.ID);
//			jQuery('#ID_' + f).attr("disabled", "disabled");
//			jQuery('#ID_' + f).css('background-color', '#CCFFCC');
			}
			f += 1;
		}
	}
	reloadjQuery();
}

function handleRetrieveReviewFieldsResponse(data) {
//	var statesObj = JSON.parse(stateIDtoNameJSON);
//	console.log('handleRetrieveFieldsResponse: ' + JSON.stringify(data));
//	alert(data.entrycomplete);
	var viewEdit = nlapiGetFieldValue('custpage_viewmode');
	if (viewEdit == 'view') {
		jQuery("#custSubmit").remove();
		jQuery("#entryComplete").remove();
		jQuery("#alterations").remove();
		jQuery("#td_alterations").replaceWith('<td id="td_alterations"></td>');
		jQuery("#td_entrycomplete").replaceWith('<td id="td_entrycomplete"></td>');
		// Reload the Refresh button
		reloadjQuery();
	}
	
	// alert('viewEdit is: ' + viewEdit);
	var src = data.src;
	var de1 = data.de1;
	var de2 = data.de2;
//	if(data.entrycomplete == 3) {
//		jQuery("#entrycomplete").prop( "checked", true );
//	} else {
//		jQuery("#entrycomplete").prop( "checked", false );
//	}
//	if(data.datetimestamp != null && data.datetimestamp != '') {
//		jQuery("#datetimestamp").val(data.datetimestamp);
//	}
//	alert('de1.alterations: ' + de1.alterations);
	if(de1.alterations == 'T') {
		jQuery("#de1_alterations").prop( "checked", true );
	} else {
		jQuery("#de1_alterations").prop( "checked", false );
	}
	if(de2.alterations == 'T') {
		jQuery("#de2_alterations").prop( "checked", true );
	} else {
		jQuery("#de2_alterations").prop( "checked", false );
	}
	if(de1.datetimestamp != null && de1.datetimestamp != '') {
		jQuery("#de1_datetimestamp").val(de1.datetimestamp);
	}
	if(de2.datetimestamp != null && de2.datetimestamp != '') {
		jQuery("#de2_datetimestamp").val(de2.datetimestamp);
	}
	if(de1.de_notes != null && de1.de_notes != '') {
		jQuery("#de1_header_notes").val(de1.de_notes);
	}
	if(de2.de_notes != null && de2.de_notes != '') {
		jQuery("#de2_header_notes").val(de2.de_notes);
	}
	console.log('src: '+JSON.stringify(src));
	var srcerFields = src.erFields || {};
	var de1erFields = de1.erfields || {};
	var de2erFields = de2.erfields || {};

	var srccertFields = src.certfields;
	console.log('srccertFields: '+JSON.stringify(srccertFields));
	var de1certFields = de1.certfields;
	console.log('de1certFields: '+JSON.stringify(de1certFields));
	var de2certFields = de2.certfields;
	console.log('de2certFields: '+JSON.stringify(de2certFields));
	var tmpTotalCerts = [];
	for(field in srccertFields) {
		tmpTotalCerts.push(srccertFields[field].ID);
		console.log('field in srccertFields: '+srccertFields.ID);
	}
	for(field in de1certFields) {
		tmpTotalCerts.push(de1certFields[field].ID);
		console.log('field in de1certFields: '+de1certFields.ID);
	}
	for(field in de2certFields) {
		tmpTotalCerts.push(de2certFields[field].ID);
		console.log('field in de2certFields: '+de2certFields.ID);
	}
//	console.log('tmpTotalCerts: ' + numOfCerts.length);
	 var uniqueArray = tmpTotalCerts.filter(function(elem, pos) {
		    return tmpTotalCerts.indexOf(elem) == pos;
	 }); 
	 var numOfCerts = uniqueArray.length;
	 console.log('uniqueArray'+uniqueArray);
	
	var erFields = data.erfields;
	var certFields = data.certfields;
	for(var c = 0; c < uniqueArray.length; c++) {
		jQuery('#certList').append(buildReviewCertRow(parseInt(c)));
	}
	
	/*
	 * Loop through both DE1 and DE2 fields to get an accurate count
	 */
	var totalFields = {};
	for( var field in de1erFields ) {
		totalFields[ field ] = true;
	}
	for( var field in de2erFields ) {
		totalFields[ field ] = true;
	}
	
	// Loop through all of the fields passed back and retrieve the values and
	// populate the Exchange Record tab fields on screen
	for (field in totalFields) {
//		alert(field);
		var fieldID = '#de1_' + field;
		var compareID = '#de2_' + field;
		var srcFieldData = srcerFields[field] || null;
//		srcFieldData = srcFieldData.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g,"");
		var de1FieldData = de1erFields[field] || null;
//		de1FieldData = de1FieldData.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g,"");
		var de2FieldData = de2erFields[field] || null;
//		de2FieldData = de2FieldData.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g,"");
		var compareData = de2erFields[compareID];
		console.log(fieldID + ': ' + de1FieldData);
		console.log(compareID + ': ' + de2FieldData);
		console.log('srcFieldData: ' + srcFieldData);
//		jQuery(fieldID).val(fieldData); // testing only
//		if(field == 'm1_medallion') { alert('found m1_medallion'); };
//		var isSelect = jQuery('select[name=select-name][id=' + fieldID + ']');
//		console.log(isSelect);
		if ( 
				( de1FieldData != null && de1FieldData != '' && jQuery(fieldID).prop('type') != 'select-one' )
				|| ( de2FieldData != null && de2FieldData != '' && jQuery(compareID).prop('type') != 'select-one' )
			) {
			var	de1Fld = jQuery.trim(de1FieldData);
			var de2Fld = null;
			if(de2FieldData != null && de2FieldData != '') {
				de2Fld = jQuery.trim(de2FieldData);
			}
			var srcFld = null;
			if(srcFieldData != null && srcFieldData != '') {
				srcFld = jQuery.trim(srcFieldData);
			}
			// If variables are not empty, then populate the fields
			if(de1FieldData != null && de1FieldData != '') {
				jQuery('#de1_'+field).val(de1FieldData);
			}
			if(de2FieldData != null && de2FieldData != '') {
				jQuery('#de2_'+field).val(de2FieldData);
			}
			if(srcFieldData != null && srcFieldData != ''){
				jQuery('#de0_'+field).val(srcFieldData);
//				jQuery('#de0_'+field).attr("disabled", "disabled");
			} 
//			else if(srcFld == null && srcFld == '') {
////				jQuery('#de0_'+field).attr("disabled", "disabled");
//			}
			compareFieldValues(srcFld,de1Fld,de2Fld,field);
//			var srcFld = jQuery('#src_' + field).val();
//			var de2Fld = jQuery('#de2_' + field).val();
//			jQuery(fieldID).attr("disabled", "disabled");
//				jQuery(fieldID).css('background-color', '#CCFFCC');
//				jQuery(fieldID).css('background-color' , '#FF6666');
		} else if (jQuery(fieldID).prop('type') == 'select-one' || jQuery(compareID).prop('type') == 'select-one') {
//			console.log(fieldID + ': ' + fieldData);
			var de1Fld = null;
			if(de1FieldData != null && de1FieldData != '') {
				de1Fld = jQuery.trim(de1FieldData);
			}
			var de2Fld = null;
			if(de2FieldData != null && de2FieldData != '') {
				de2Fld = jQuery.trim(de2FieldData);
			}
			var srcFld = null;
			if(srcFieldData != null && srcFieldData != '') {
				srcFld = jQuery.trim(srcFieldData);
			}
			if(de1Fld != null && de1Fld != '') {
				$('#de1_'+ field + " option").each(function() {
					  if($(this).text() == de1FieldData) {
					    $(this).attr('selected', 'selected');            
					  }                        
					});
			}
			if(de2Fld != null && de2Fld != '') {
				$('#de2_'+ field + " option").each(function() {
					  if($(this).text() == de2Fld) {
					    $(this).attr('selected', 'selected');            
					  }   
					});
			}
			if(srcFld != null && srcFld != ''){
				$('#de0_'+ field + " option").each(function() {
					  if($(this).text() == srcFld) {
					    $(this).attr('selected', 'selected');            
					  }
//					  $('#de0_'+field).attr("disabled", "disabled");
					});
			}
			compareFieldValues(srcFld,de1Fld,de2Fld,field);
		}
	}
//	$( "input:empty" ).attr("disabled", "disabled");
	$(".de0" ).attr("disabled", "disabled");
	$(".certde0" ).attr("disabled", "disabled");
	
	console.log('uniqueArray: ' + uniqueArray);
	var rowsID_SN_Obj = {};
	// Loop through an array with the SN values.  This array only contains unique values.
//	alert('de1certFields: ' + JSON.stringify(de1certFields));
//	alert('de2certFields: ' + JSON.stringify(de2certFields));
	if(uniqueArray != null && uniqueArray != '') {
		for(var cLoop = 0; cLoop < uniqueArray.length; cLoop++) {
			var rowid = cLoop + 1;
//			for(eachCert in srccertFields) {
//				var tmpCertCheck = eachCert;
//				if(tmpCertCheck.SN ==)
//			}
			var srcFieldData = srccertFields['CERT_' + uniqueArray[cLoop]] || {};
			var de1FieldData = de1certFields['CERT_' + uniqueArray[cLoop]] || {};
			var de2FieldData = de2certFields['CERT_' + uniqueArray[cLoop]] || {};
			console.log('srcFieldData: ' + JSON.stringify(srcFieldData));
			if(srcFieldData != null && srcFieldData != '') {
				jQuery('#SN_' + rowid).val(srcFieldData.SN || '');
				jQuery('#SH_' + rowid).val(srcFieldData.SH || '');
				if(srcFieldData.ST != null && srcFieldData.ST != '') {
					jQuery('#ST_' + rowid + " option").each(function() {
						if($(this).val() == srcFieldData.ST) {
							$(this).attr('selected', 'selected');            
						}
					});
				}
				if(nlapiGetFieldValue('custpage_user') == 'admin'){
					jQuery('#ID_' + rowid).html('<a href="' + nlapiResolveURL("RECORD", "customrecord_acq_lot_cert_entry", srcFieldData.ID, "VIEW") + '">' + srcFieldData.ID + '</a>');
				} else {
					jQuery('#' + rowid).html(srcFieldData.ID);
				}
			}
			// Loop through the DE1 cert object and populate fields on this row.
			if(de1FieldData != null && de1FieldData != '') {
				if(de1FieldData.MISS == '1') {
					jQuery('#de1_MISS_' + rowid).html('1: YES');
				} else if(de1FieldData.MISS == '2'){
					jQuery('#de1_MISS_' + rowid).html('1: NO');
				} else {
					jQuery('#de1_MISS_' + rowid).html('');
				}
				if(de1FieldData.MATCH == true) {
					jQuery('#de1_MATCH_' + rowid).html('1: YES');
				} else if(de2FieldData.MATCH == false){
					jQuery('#de1_MATCH_' + rowid).html('1: NO');
				} else {
					jQuery('#de1_MATCH_' + rowid).html('');
				}
			}
			// Loop through the DE2 cert object and populate fields on this row.
			if(de2FieldData != null && de2FieldData != '') {
				if(de2FieldData.MISS == '1') {
					jQuery('#de2_MISS_' + rowid).html('2: YES');
				} else if(de2FieldData.MISS == '2'){
					jQuery('#de2_MISS_' + rowid).html('2: NO');
				} else {
					jQuery('#de2_MISS_' + rowid).html('');
				}
				if(de2FieldData.MATCH == true) {
					jQuery('#de2_MATCH_' + rowid).html('2: YES');
				} else if(de2FieldData.MATCH == false){
					jQuery('#de2_MATCH_' + rowid).html('2: NO');
				} else {
					jQuery('#de2_MATCH_' + rowid).html('');
				}
			}
		}
	}
}
	
Array.prototype.remove = function(value) {
    if (this.indexOf(value)!==-1) {
       this.splice(this.indexOf(value), 1);
       return true;
   } else {
      return false;
   }
};

// This function is primarily used to give a visual that the fields have been clear and replaced on refresh
function clearAllFields() {
	var allFields = document.getElementsByClassName('form-control');
	for ( var i = 0; i < allFields.length; i++) {
		var field = allFields[i];
	  var id = field.id;
	  jQuery('#'+id).removeAttr("disabled");
	  jQuery('#'+id).css('background-color', '#FFFFFF');
	  jQuery('#'+id).val('');

	}
}

function verifyACHBankNameField(fieldID) {
	 var bankabaRouting = jQuery("#"+fieldID).val();
//	 alert('About to Verify the ACH: ' + bankabaRouting);
	 if(bankabaRouting != null && bankabaRouting != '') {
//	 alert('bankabaRounting: ' + bankabaRouting);
		 var results = searchACHBankName(bankabaRouting);
		 if(results == null || results == '') {
			 console.log(bankabaRouting);
//			 jQuery("#"+fieldID).css('background-color' , 'FF6666');
			 jQuery("#"+fieldID+"_v").html('<p style="color:red">&nbsp;NOT Verified<p>');
		 } else {
//			 jQuery("#"+fieldID).css('background-color', '#CCFFCC');
			 jQuery("#"+fieldID+"_v").html('<p style="color:green">&nbsp;Verified!<p>');
		 }
	 }
}

function verifyWireBankNameField(fieldID) {
//	alert('fieldID' + fieldID);
	 var wireRouting = jQuery("#"+fieldID).val();
	 console.log('wireRouting: ' + wireRouting);
	 if(wireRouting != null && wireRouting != ''){
//	 alert('wireabaRounting: ' + wireRouting);
		 var wResults = searchWireBankName(wireRouting);
		 if(wResults != null && wResults.length > 0) {
			 var onewResult = wResults[0];
		 }
		 if(onewResult != null && onewResult != '') {
			 jQuery("#"+fieldID+"_v").html('<p style="color:green">&nbsp;Verified!<p>');
//			 alert('wireRouting: '+ wireRouting);
//			 jQuery("#"+fieldID).css('background-color' , '#FF6666');
		 } else {
//			 jQuery("#"+fieldID).css('background-color', '#CCFFCC');
			 jQuery("#"+fieldID+"_v").html('<p style="color:red">&nbsp;NOT Verified<p>');
		 }
	 }
}

function searchACHBankName(bankabaRouting) {
	bankabaRouting = bankabaRouting.toString();
	var filters = new Array();
	filters[0] = new nlobjSearchFilter('custrecord162', null, 'is', bankabaRouting);
	var columns = new Array();
	columns[0] = new nlobjSearchColumn('custrecord162');
	columns[1] = new nlobjSearchColumn('custrecord168');
	columns[2] = new nlobjSearchColumn('custrecord171');
	try{
		return nlapiSearchRecord('customrecord416', null, filters, columns);
	} catch(e) {
		var err = e;
		nlapiLogExecution('DEBUG', searchACHBankName(lotFields), JSON.stringify(err));
		return
	}
}

function searchWireBankName(wireRouting) {
	wireRouting = wireRouting.toString();
	var filters = new Array();
	filters[0] = new nlobjSearchFilter('custrecord153', null, 'is', wireRouting);
	var columns = new Array();
	columns[0] = new nlobjSearchColumn('custrecord153');
	columns[1] = new nlobjSearchColumn('custrecord155');
	columns[2] = new nlobjSearchColumn('custrecord156');
	try {
		return nlapiSearchRecord('customrecord415', null, filters, columns);
	} catch(e) {
		var err = e;
		nlapiLogExecution('DEBUG', searchWireBankName(lotFields), JSON.stringify(err));
		return;
	}
}

var progressbarhtml = '<progress max="100" style="height:16px; width:200px;"></progress>';
function createProgressBar() { 
//	alert('progressbar');
	document.getElementById('progressbar').innerHTML = progressbarhtml;
}
function closeProgressBar() { 
//	alert('progressbar');
	document.getElementById('progressbar').innerHTML = '';
}

function createCertObj(st, sn, sh, id, miss, match) {
    this.ST = st;
    this.SN = sn;
    this.SH = sh;
    this.ID = id;
    this.MISS = miss;
    this.MATCH = match;
}

function compareFieldValues(srcFld,de1Fld,de2Fld,field) {
	var compareArray = [];
	compareArray[0] = srcFld;
	compareArray[1] = de1Fld;
	compareArray[2] = de2Fld;
//	console.log(compareArray);
	
	// IF THE SRC FIELD (AKA DE0) EXIST AND IS NOT EMPTY THEN COMPARE WITH DE1 AND DE2 TO DETERMINE BACKGROUND COLOR - RED / GREEN
	if(srcFld != null) {
		var matched = [];
		for(var cf = 0; cf < compareArray.length; cf++) {
			if(compareArray[cf] == null || compareArray[cf] == '') {
				matched[cf] = false;
			} else {
				matched[cf] = true;
			}
		}
		if(compareArray[0] === compareArray[1] && compareArray[0] === compareArray[2]) {
			matched[0] = true;
			matched[1] = true;
			matched[2] = true;
		} 
		if (compareArray[0] === compareArray[1] && compareArray[0] != compareArray[2] && compareArray[1] != compareArray[2]) {
//			if(compareArray[2] == null || compareArray[2] == '') {
				matched[0] = true;
				matched[1] = true;
				matched[2] = false;
//			}
		} 
		if (compareArray[0] == compareArray[1] && compareArray[0] != compareArray[2]) {
				matched[0] = true;
				matched[1] = true;
				matched[2] = false;
		} 
		if (compareArray[0] == compareArray[2] && compareArray[0] != compareArray[1]) {
			if(compareArray[0] == compareArray[2]) {
				matched[0] = true;
				matched[1] = false;
				matched[2] = true;
			}
		} 
		if (compareArray[0] != compareArray[1] && compareArray[0] != compareArray[2]) {
			if(compareArray[1] == compareArray[2]) {
				matched[0] = false;
				matched[1] = true;
				matched[2] = true;
			}
		}
		if(compareArray[0] != compareArray[1] && compareArray[1] != compareArray[2]) {
			if(compareArray[0] != compareArray[2]){
				matched[0] = false;
				matched[1] = false;
				matched[2] = false;
			}
		}
		if(compareArray[0] == null || compareArray[0] == '') {
			matched[0] = null;
		}
		if(compareArray[1] == null || compareArray[1] == '') {
			matched[1] = null;
		}
		if(compareArray[2] == null || compareArray[2] == '') {
			matched[2] = null;
		}
//		if (compareArray[1] != compareArray[0] || compareArray[1] != compareArray[2]) {
//			matched[1] = false;
//		}
//		console.log(matched);
		if(matched[0] == true) {
			jQuery('#de0_'+field).css('background-color' , '#CCFFCC');
		} else if(matched[0] == false){
			jQuery('#de0_'+field).css('background-color' , '#FF6666');
		} else if (matched[0] != null && matched[1] != null && matched[2] != null){
			jQuery('#de0_'+field).css('background-color' , '#FFFFFF');
		}
		if(matched[1] == true) {
			jQuery('#de1_'+field).css('background-color' , '#CCFFCC');
		} else if(matched[1] == false){
			jQuery('#de1_'+field).css('background-color' , '#FF6666');
		} else if (matched[0] != null && matched[1] != null && matched[2] != null){
			jQuery('#de1_'+field).css('background-color' , '#FFFFFF');
		}
		if(matched[2] == true) {
			jQuery('#de2_'+field).css('background-color' , '#CCFFCC');
		} else if(matched[2] == false){
			jQuery('#de2_'+field).css('background-color' , '#FF6666');
		} else if (matched[0] != null && matched[1] != null && matched[2] != null){
			jQuery('#de2_'+field).css('background-color' , '#FFFFFF');
		}
	} else {
		if(compareArray[1] == compareArray[2]) {
			jQuery('#de1_'+field).css('background-color' , '#CCFFCC');
			jQuery('#de2_'+field).css('background-color' , '#CCFFCC');
		} else {
			jQuery('#de1_'+field).css('background-color' , '#FF6666');
			jQuery('#de2_'+field).css('background-color' , '#FF6666');
		}
	}
}
