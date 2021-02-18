/*******************************************************************************
 * ADOBE CONFIDENTIAL ___________________ Copyright [first year code created]
 * Adobe Systems Incorporated All Rights Reserved. NOTICE: All information
 * contained herein is, and remains the property of Adobe Systems Incorporated
 * and its suppliers, if any. The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its suppliers and
 * are protected by trade secret or copyright law. Dissemination of this
 * information or reproduction of this material is strictly forbidden unless
 * prior written permission is obtained from Adobe Systems Incorporated.
 ******************************************************************************/

var EchoSign = {};
EchoSign.Agreements = (function() { // private members
	function AgreementLoader() {

		// instance vars
		var that = this;

		var isEntity = function(type) {
			return {
				'customer' : true,
				'partner' : true,
				'prospect' : true,
				'lead' : true
			}[type] || false;
		};

		// methods
		this.loadAgreements = function(form) {
			var object = nlapiGetNewRecord();

			var filterExpression = null;
			if (isEntity(object.getRecordType())) {
				filterExpression = 
					[
						['custrecord_echosign_entity_id', 'is', object.getId()],
						'OR',
						[
							['custrecord_echosign_parent_record', 'is', object.getId()],
							'AND',
							[
								['custrecord_echosign_parent_type', 'is', 'customer'],
								'OR',
								['custrecord_echosign_parent_type', 'is', 'partner'],
								'OR', 
								['custrecord_echosign_parent_type', 'is', 'prospect'], 
								'OR',
								['custrecord_echosign_parent_type', 'is', 'lead']
							]
						]
					];
			} else {
				filterExpression = 
					[
						['custrecord_echosign_parent_record', 'is', object.getId()], 
						'AND',
						['custrecord_echosign_parent_type', 'is', object.getRecordType()]
					];
			}

			var agreementColumns = [];
			agreementColumns.push(new nlobjSearchColumn('name'));
			agreementColumns.push(new nlobjSearchColumn('custrecord_echosign_status'));
			agreementColumns.push(new nlobjSearchColumn('custrecord_echosign_date_signed'));
			agreementColumns.push(new nlobjSearchColumn('custrecord_echosign_date_sent'));
			agreementColumns.push(new nlobjSearchColumn('custrecord_echosign_signed_url'));
			agreementColumns.push(new nlobjSearchColumn('custrecord_echosign_signed_doc'));

			form.addTab('custpage_echosign_agreements', 'Agreements');
			var url = nlapiResolveURL('SUITELET', 'customscript_echosign_agreement_creater', 'customdeploy_echosign_agreement_creater', false);
			url += '&recordtype=' + object.getRecordType() + '&recordid=' + object.getId();
			var agreeList = form.addSubList('custpage_echosign_agree_list', 'staticlist', 'Agreements', 'custpage_echosign_agreements');

			// only show new button if the user has create edit full permissions
			if (parseInt(Util.getUserPermissionOnRecordType('customrecord_echosign_agreement'), 10) > 1)
				agreeList.addButton('custpage_echosign_new_agreement', "New Agreement", "window.location.href= '" + url + "'");

			agreeList.addField('custpage_echosign_agreement_name', 'text', 'Agreement Name');
			agreeList.addField('custpage_echosign_status', 'text', 'Status');
			agreeList.addField('custpage_echosign_date_sent', 'text', 'Date Sent');
			agreeList.addField('custpage_echosign_date_signed', 'text', 'Signed Date');
			agreeList.addField('custpage_echosign_signed_doc', 'text', 'Signed Document');

			// only show delete link if the user has create edit full
			// permissions
			if (parseInt(Util.getUserPermissionOnRecordType('customrecord_echosign_agreement'), 10) > 1)
				agreeList.addField('custpage_echosign_delete', 'text', 'Delete Agreement');

			try {
				var searchObj = nlapiCreateSearch('customrecord_echosign_agreement', filterExpression, agreementColumns);
				var agreements = searchObj.runSearch().getResults(0, 1000);

				if (agreements) {
					var rows = [];
					var thisUrl = nlapiResolveURL('RECORD', nlapiGetRecordType(), nlapiGetRecordId(), 'VIEW');
					for ( var i = 0; i < agreements.length; i++) {
                        nlapiLogExecution('debug', 'agreement id', agreements[i].getId());
						var deleteUrl = thisUrl + '&delagree=' + agreements[i].getId();
						var deleteHtml = '<a href=' + deleteUrl + '>Delete</a>';
						var viewUrl = nlapiResolveURL('RECORD', 'customrecord_echosign_agreement', agreements[i].getId(), 'VIEW');
						viewUrl = '<a href=' + viewUrl + '>' + agreements[i].getValue('name') + '</a>';
						rows[i] = [];
						rows[i].custpage_echosign_agreement_name = viewUrl;
						rows[i].custpage_echosign_status = agreements[i].getText('custrecord_echosign_status') || ' ';
						rows[i].custpage_echosign_date_sent = '' + agreements[i].getValue('custrecord_echosign_date_sent') || ' ';
						rows[i].custpage_echosign_date_signed = '' + agreements[i].getValue('custrecord_echosign_date_signed') || ' ';

						// file cabinet signed file takes priority
						if (agreements[i].getValue('custrecord_echosign_signed_doc')) {
							// var fileCabUrl =
							// 'https://system.netsuite.com/app/common/media/mediaitem.nl?id=';
							// rows[i].custpage_echosign_signed_doc = '<a
							// target="blank"
							// href="'+fileCabUrl+agreements[i].getValue('custrecord_echosign_signed_doc')+'#">View
							// Signed Document</a>';

							var actualUrl = nlapiLoadFile(agreements[i].getValue('custrecord_echosign_signed_doc')).getURL();
							rows[i].custpage_echosign_signed_doc = '<a target="blank" href="' + actualUrl + '">View Signed Document</a>';

						}

						if (agreements[i].getValue('custrecord_echosign_signed_url') && !agreements[i].getValue('custrecord_echosign_signed_doc'))
							rows[i].custpage_echosign_signed_doc = '<a target="blank" href="'
									+ agreements[i].getValue('custrecord_echosign_signed_url') + '">View Signed Document</a>';

						rows[i].custpage_echosign_delete = deleteHtml;
					}
					agreeList.setLineItemValues(rows);
				}
			} catch (e) {
				log("Unable to load agreements");
			}
		};

		this.deleteAgreements = function(agreeId) {
			var signerResults = nlapiSearchRecord('customrecord_echosign_signer', null, new nlobjSearchFilter('custrecord_echosign_agree', null,
					'is', agreeId));
			if (signerResults && signerResults.length > 0) {
				for ( var i = 0; i < signerResults.length; i++) {
					nlapiDeleteRecord('customrecord_echosign_signer', signerResults[i].getId());
				}
			}

			var docResults = nlapiSearchRecord('customrecord_echosign_document', null, new nlobjSearchFilter('custrecord_echosign_agreement', null,
					'is', agreeId));
			if (docResults && docResults.length > 0) {
				for ( var i = 0; i < docResults.length; i++) {
					nlapiDeleteRecord('customrecord_echosign_document', docResults[i].getId());
				}
			}

			var eventResults = nlapiSearchRecord('customrecord_echosign_event', null, new nlobjSearchFilter('custrecord_echosign_agreem', null, 'is',
					agreeId));
			if (eventResults && eventResults.length > 0) {
				for ( var i = 0; i < eventResults.length; i++) {
					nlapiDeleteRecord('customrecord_echosign_event', eventResults[i].getId());
				}
			}

			var thumbResults = nlapiSearchRecord('customrecord_echosign_signed', null, new nlobjSearchFilter('custrecord_echosign_agreeme', null,
					'is', agreeId));
			if (thumbResults && thumbResults.length > 0) {
				for ( var i = 0; i < thumbResults.length; i++) {
					nlapiDeleteRecord('customrecord_echosign_signed', thumbResults[i].getId());
				}
			}
			log('before agreement load');
			try {
				var agreement = nlapiLoadRecord('customrecord_echosign_agreement', agreeId);
				log('After Agreement Load', agreement.getId());
				if (agreement.getFieldText('custrecord_echosign_status') === 'Out For Signature'
						|| agreement.getFieldText('custrecord_echosign_status') === 'Expired') {
					var url = nlapiResolveURL('SUITELET', 'customscript_echosign_service_manager', 'customdeploy_echosign_service_manager_de', true);
					url += '&echoaction=cancelAgreement';
					url += '&recid=' + agreement.getId();
					url += '&senderid=' + nlapiGetUser();

					log('Cancel Agreement', url);
					try {
						var canResponse = nlapiRequestURL(url);
					} catch (e) {
						nlapiLogExecution('ERROR', 'Unable to do request to EchoSign', e.getCode());
					}
					nlapiDeleteRecord('customrecord_echosign_agreement', agreeId);
					log('Deleted Agreement', request.getParameter('delagree'));
					// canResponse = JSON.parse(canResponse.getBody());
				}
				if (agreement.getFieldText('custrecord_echosign_status') === 'Signed'
						|| agreement.getFieldText('custrecord_echosign_status') === 'Cancelled') {
					var url = nlapiResolveURL('SUITELET', 'customscript_echosign_service_manager', 'customdeploy_echosign_service_manager_de', true);
					url += '&echoaction=removeAgreement';
					url += '&recid=' + agreement.getId();
					url += '&senderid=' + nlapiGetUser();

					log('Remove Agreement', url);
					try {
						var remResponse = nlapiRequestURL(url);
					} catch (e) {
						nlapiLogExecution('ERROR', 'Unable to do request to EchoSign', e.getCode());
					}
					nlapiDeleteRecord('customrecord_echosign_agreement', agreeId);
					log('Deleted Agreement', request.getParameter('delagree'));
				} else {
					nlapiDeleteRecord('customrecord_echosign_agreement', agreeId);
					log('Deleted Agreement', request.getParameter('delagree'));
				}
			} catch (e) {
			}
		};

	}

	return {
		beforeLoad : function(type, form, request) {
			try {
				// hide agreement tab if user has none permission
				if (parseInt(Util.getUserPermissionOnRecordType('customrecord_echosign_agreement'), 10) === 0)
					return;

				var AL = new AgreementLoader();
				try {
					if (request.getParameter('delagree') !== null && request.getParameter('delagree').length !== 0) {
						AL.deleteAgreements(request.getParameter('delagree'));
					}
				} catch (e) {
				}
				if (type.toLowerCase() === 'view') {
					AL.loadAgreements(form);
				}

			} catch (e) {
				Util.handleError(e, 'EchoSign_LoadAgreement.js', [ 'client@client.com, client@client.com' ], nlapiGetUser());
			}
		}
	};
})();

beforeLoad = function(type, form, request) {
	EchoSign.Agreements.beforeLoad(type, form, request);
};
/** @ignoreNlapi */
