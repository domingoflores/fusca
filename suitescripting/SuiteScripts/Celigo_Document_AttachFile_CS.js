/*
 * 2005-2009 Celigo, Inc. All Rights Reserved.
 * 
 * Version:		1.0.0
 * Type:		Client
 *
 * Purpose:
 *		Attach File to Escrow Customer when saving Document record.
 *
 * Revisions:
 *		09/16/2008 - Initial version
 *		10/14/2009 - Updated
 *
 */
var SRS = {};
SRS.Document = (function(){
	function DocumentManager(){
		this.AttachFile = function(){
			//alert("Going to attach file to Escrow Customer");
			nlapiAttachRecord('file', nlapiGetFieldValue('custrecord_file'), 'customer', nlapiGetFieldValue('custrecord_escrow_customer'), null);
			return true;
		};
	}
	return{
		saveRecord: function(){ //boolean
			try {
				if (nlapiGetFieldValue('custrecord_escrow_customer') && nlapiGetFieldValue('custrecord_file')) {
					//alert("File and Escrow Customer populated");
					var attF = new DocumentManager();
					return attF.AttachFile();
				}else 
					return true;
				/*if(!nlapiGetFieldValue('custrecord_escrow_customer')){
					alert("Please enter a value for Escrow Customer");
					return false;
				}else{
					return true;
				}
				else if(!nlapiGetFieldValue('custrecord_file')){
					alert("File is empty");
					return false;
				}*/
			}catch (e) {
				alert("Error: "+(e.getDetails() || e.message()));
				Util.handleError(e, 'Celigo_Document_AttachFile_CS.js', ['lakshika@celigo.com']);
			}
		}
	}
})();