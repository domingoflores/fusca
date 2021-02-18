/**
 * financeUtilitiesLibrary.js
 * @NApiVersion 2.x
 * @NModuleScope public
 * A lightweight library of utilities that 
 * 
 * Version    Date            Author           Remarks
 *  		  7/31/2018       Alex Fodor       ATP-261 Vendor Bill Pre-Approved Import
 */
define(['N/search',  'N/ui/message' ],

	function(search, msg ) {


		function showErrorMessage(msgTitle, msgText) {
			var myMsg = msg.create({
				title: msgTitle,
				message: msgText,
				type: msg.Type.ERROR
			});
			myMsg.show({
				duration: 7500
			});
		}

		function vendorBillPreApprovedRoleValid(roleId) {
            if (roleId == 'customrole1096') { return true; } 
            return false;
		}

		return {
			 showErrorMessage: showErrorMessage
            ,vendorBillPreApprovedRoleValid: vendorBillPreApprovedRoleValid
		};
	});