function getClearedCheckImage(request, response) {
	try {
		if (request.getMethod() == 'GET') {

			//check if AvidPay is enabled. If not, let user know they'll need to upgrade
			var context = nlapiGetContext();
			var avidPayEnabled = context.getSetting('SCRIPT', 'custscript_pp_enable_apn_network');
			var form = nlapiCreateForm('Cleared Check Image');
			if (avidPayEnabled == 'F') {
				var textField = form.addField('text_display', 'textarea', '');
				textField.setDisplayType('inline');
				textField.setDefaultValue("Your account does not currently have AvidPay enabled. To be able to see cleared check images, please contact AvidXchange and upgrade to include AvidPay.");
			} else {
				
				var bpId = request.getParameter('pid');
				var bpFields = nlapiLookupField('vendorpayment', bpId, ['custbody_pp_apn_payment_batch', 'tranid']); 
				var batchId = bpFields['custbody_pp_apn_payment_batch']; //internal ID of APN Payment Batch
				var bpNum = bpFields['tranid']; //tranid of bill payment - need to compare to number in AvidPay
				nlapiLogExecution('debug', 'batchId/bpNum', batchId + ', ' + bpNum);

				if (batchId == '' || batchId == null) {
					nlapiLogExecution('debug', 'in batchId = null', 'start');
					var textField = form.addField('text_display', 'textarea', '');
					textField.setDisplayType('inline');
					textField.setDefaultValue('There is no AvidPay Payment Batch associated with this payment. As such, there will be no cleared check image.');
				} else {
					var batchNumber = nlapiLookupField('customrecord_pp_apn_payment_batch', batchId, 'custrecord_pp_apn_batch_number');  //batch name that AvidPay wants
					batchNumber = batchNumber.replace(new RegExp(' ','g'), '%20');	//fix to be URL-friendly
					nlapiLogExecution('debug', 'info', 'bpId: ' + bpId + ', batchId: ' + batchId + ', batchNumber: ' + batchNumber);
					var batchBodyJSON = getBatchPaymentIds(batchNumber); //get JSON of batch info
					//nlapiLogExecution('debug', 'batchNumber ' + batchNumber, JSON.stringify(batchBodyJSON));

					//get AvidPay ID for transaction
					var apId = getAvidPayId(batchBodyJSON, bpNum);
					nlapiLogExecution('debug', 'apId', apId);

					//call AvidPay to get cleared check image using APID
					var imageURL = PPSLibAvidSuite.getCheckImageUrl(apId);
					nlapiLogExecution('debug', 'imageURL', imageURL);

					form = getImageData(imageURL, form);
				}
			}
			nlapiLogExecution('debug', 'about to writePage');
			response.writePage(form);
		}

	} catch (ex){
		nlapiLogExecution('error', 'Error in getClearedCheckImage', ex.message);
	}
}


function getService() {
	// Load the APN user credentials of current user
		var context = nlapiGetContext();
		var apnCredentials = PPSLibAvidSuite.getUserCredentials(context.getUser());
		if(!apnCredentials){
			throw nlapiCreateError('PP_APN_NO_USER_CREDENTIALS','You have not setup your avid suite user credentials yet.');
		}
		
		// Configure and authorize the service
		var serviceConfig = apnCredentials;
		var service = new PPSLibAvidSuite.Service(serviceConfig);
		service.authorize();
		nlapiLogExecution('DEBUG','Authorized','true');
		return service;
}

function getBatchPaymentIds(batchNumber) {
	try {
		var service = getService();
		var batchURL = PPSLibAvidSuite.getPaymentBatchPaymentsUrl();
		var batchIDResult = service.sendRequest(batchURL + '?batchId='+batchNumber+'&flattenresponse=false',null,{"Content-Type": "text/xml; charset=UTF-8"},'GET',respHandler);
		
		nlapiLogExecution('debug', 'batchIDResult', batchIDResult);

		nlapiLogExecution('DEBUG','Send Payments Response Body',batchIDResult.resp.getBody());

		return batchIDResult.resp.getBody();
	} catch(ex) {
		nlapiLogExecution('error', 'Error in getBatchPaymentIds', ex.message);
	}
}

function getAvidPayId(batchJSON, bpNum) {
	//finds the avidPay ID that matches with the bill payment ID, by looking through the JSON associated with the AvidPay Payment Batch
	var batchInfo = JSON.parse(batchJSON);
	var itemList = batchInfo.Items;
	if (itemList != null) {
		for (var a = 0; a< itemList.length; a++) {
			var apNumber = itemList[a].Number;
			nlapiLogExecution('debug', 'apNumber', apNumber);
			if (apNumber == bpNum) {
				var apId = itemList[a].PaymentId;
				nlapiLogExecution('debug', 'Found apId for bpNum ' + bpNum, apId);
				return apId;
			}
		}
	} else {
		nlapiLogExecution('error', 'No Payment Info Found', 'Could not find payment info associated with batch.');
		return;
	}
}

function getImageData(imageURL, form) {
	try {
		var service = getService();

		var imageData = service.sendRequest(imageURL,null,{"Content-Type": "text/xml; charset=UTF-8"},'GET',respHandler);
		
		var imageResponse = imageData.resp;
		nlapiLogExecution('debug', 'imageResponse body', imageResponse.getBody());
		try {
			var imageBody = imageResponse.getBody();
			var imageJSON = JSON.parse(imageBody);
			if (imageJSON.exception != '' && imageJSON.exception != null) {	
				var textField = form.addField('text_display', 'textarea');
				textField.setDisplayType('inline');
				if (imageData.errorMessage == 'Unable to display cleared check image. No image available.') {
					textField.setDefaultValue('Unable to display cleared check image. No image available.');
				} else {
					textField.setDefaultValue('Could not load cleared check image. Reason: ' + imageJSON.exception.reason);
				}
			} else {				
				var imageDataFront = imageJSON.Front.Image;
				imageDataFront = imageDataFront.replace('+', '%2B');
				var imageDataBack = imageJSON.Back.Image;
				imageDataBack = imageDataBack.replace('+', '%2B');
				var frontsrc = '<img src="data:image/png;base64, ' + imageDataFront +'" width = "750"/>';
				var backsrc = '<img src="data:image/png;base64, ' + imageDataBack +'" width = "750"/>';
				nlapiLogExecution('debug', 'frontsrc', frontsrc);
				nlapiLogExecution('debug', 'image.JSON.Front.Image', imageJSON.Front.Image);
			
				form.addFieldGroup('front', 'Front');
				form.addFieldGroup('back', 'Back');
				form.addField('front_image', 'inlinehtml', '', null, 'front');
				form.addField('back_image', 'inlinehtml', '', null, 'back');
				form.setFieldValues({'front_image':frontsrc, 'back_image':backsrc});
			}

		} catch(ex) {
			nlapiLogExecution('error', 'error in parsing check image', ex.message);
		}

		return form;
	} catch(ex) {
		nlapiLogExecution('error', 'Error in getBatchPaymentIds', ex.message);
	}
}



var respHandler = function(resp){
	try{
		var result = {
				resp : resp,
				success: null,
				errorMessage: null
				
		};

    	switch(resp.getCode()){
    	case 200:
    		var resultObj = JSON.parse(resp.getBody());
    		var results = [].concat(resultObj.Results); // make Results always an array since it can be an object or an array
    		
    		if(results[0].Successful == "false" || results[0].Successful === false){
    			result.success = false;
    			var errs = [].concat(results[0].Errors); // make Errors an array since it can be an object or an array
    			result.errorMessage = "Error from APN server: " + errs[0].Message;
    		}
    		else{
    			result.success = true;
    		}
    		break;
    	case 400:
    		var resultObj = JSON.parse(resp.getBody());
    		result.success = false;
    		result.errorMessage = 'Unable to authorize. Reason: ' + resultObj.error_description;
    		break;
    	case 401:
    		var resultObj = JSON.parse(resp.getBody());
    		result.success = false;
    		result.errorMessage = resultObj.exception.reason + ": " + resultObj.exception.detail;
    		break;
    	case 500: 
    		var resultObj = JSON.parse(resp.getBody());
    		nlapiLogExecution('debug', 'detail', resultObj.exception.detail);
    		if (resultObj.exception.detail == 'Nullable object must have a value.'){ //particular error message in this case.
    			nlapiLogExecution('debug', 'nullable object error', 'No payment data returned.');
    			result.success = false;
    			result.errorMessage = 'Unable to display cleared check image. No image available.';
    		} else {
	    		nlapiLogExecution('ERROR',resp.getCode(),resp.getBody());
   	 			result.success = false;
    			result.errorMessage = 'Response Code: ' + resp.getCode();
    		}
    		break;
    	default:
    		nlapiLogExecution('ERROR',resp.getCode(),resp.getBody());
    		result.success = false;
    		result.errorMessage = 'Response Code: ' + resp.getCode();
    		break;
    	}
	}
	catch(e){
		result.success = false;
		result.errorMessage = e.toString();
	}
	return result;
};