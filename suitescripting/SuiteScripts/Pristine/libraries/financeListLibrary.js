/**
 * financeListLibrary.js
 * @NApiVersion 2.x
 * @NModuleScopt public
 * Centralized library of all lists used in finance, so if internal IDs are altered, only one location has to be changed.
 *
 * include '/SuiteScripts/Pristine/libraries/paymtInstrListLibrary.js'
 *    Date          Author           Remarks
 *  7/10/2018       AFodor           ATP-253 created new list library
 */

define(['/SuiteScripts/Pristine/libraries/Enum.js'],

	function(Enum) {

		var financeEnum = {

			 billApprovalSts: Enum.Enum("zero", "PendingRequestForApproval", "PendingApproval", "Approved", "RejectedPendingRequestForReApproval")
			,nativeBillApprovalSts: Enum.Enum("zero", "PendingApproval", "Approved", "Rejected")
                };

		return {
			financeEnum: financeEnum
		};
	});