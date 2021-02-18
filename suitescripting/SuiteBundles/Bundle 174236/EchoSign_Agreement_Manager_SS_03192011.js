/*************************************************************************
*
* ADOBE CONFIDENTIAL
* ___________________
*
*  Copyright [first year code created] Adobe Systems Incorporated
*  All Rights Reserved.
*
* NOTICE:  All information contained herein is, and remains
* the property of Adobe Systems Incorporated and its suppliers,
* if any.  The intellectual and technical concepts contained
* herein are proprietary to Adobe Systems Incorporated and its
* suppliers and are protected by trade secret or copyright law.
* Dissemination of this information or reproduction of this material
* is strictly forbidden unless prior written permission is obtained
* from Adobe Systems Incorporated.
**************************************************************************/
/** @ignoreNlapi */
EchoSign.Agreement = (function() { // private members
	var
	eds = EchoSign.DocumentStatus,
		parentTypes = {
			'customer': 'customer',
			'partner': 'partner',
			'opportunity': 'opportunity',
			'prospect': 'prospect',
			'estimate': '',
			'lead': ''
		},

		isCurrentlyPendingSendCallback = function() {
			var agreement = nlapiGetNewRecord();
			var agreementStatus = agreement.getFieldText('custrecord_echosign_status');
			if (agreementStatus === 'Draft') {
				var eventTimeOfSendDocTimeLimitExceeded = parseInt(agreement.getFieldValue('custrecord_echo_send_doc_45s_at') || '0', 10);
				if ((new Date()).getTime() - eventTimeOfSendDocTimeLimitExceeded <= 60 * 60 * 1000 /* 60 minutes */ ) {
					return true;
				}
			}
			return false;
		};

	function AgreementManager() {

		var getSecurityOptions = function() {
				var opts = [];

				var c = nlapiGetContext();
				// password
				if (c.getSetting('script', 'custscript_echosign_enable_require_pswd') === 'T') {
					opts.push({
						'field': 'custrecord_echosign_protect_sign',
						'label': 'Password Required to Sign',
						'value': 'password'
					});
				}
				// knowledge base auth
				if (c.getSetting('script', 'custscript_echosign_enable_kb_auth') === 'T') {
					opts.push({
						'field': 'custrecord_echosign_kba_protect',
						'label': 'Knowledge Based Authentication',
						'value': 'kba'
					});
				}
				// web identity auth
				if (c.getSetting('script', 'custscript_echosign_enable_webid_auth') === 'T') {
					opts.push({
						'field': 'custrecord_echosign_webid_protect',
						'label': 'Web Identity Authentication',
						'value': 'webid'
					});
				}

				return opts;
			};

		var getSecurityAppliesTo = function() {
				var appliesTo = nlapiGetContext().getSetting('script', 'custscript_echosign_securityopt_applyto');
				var appliesToEnum = '';
				switch (appliesTo) {
				case '1':
					appliesToEnum = 'Verify Signer Identity';
					break;
				case '2':
					appliesToEnum = 'Verify Signer Identity for External Users';
					break;
				case '3':
					appliesToEnum = 'Verify Signer Identity for Internal Users';
					break;
				default:
					appliesToEnum = 'Verify Signer Identity';
					break;
				}

				return appliesToEnum;
			};

		this.hideNew = function(form) {
			form.removeButton('new');
		};

		// methods
		this.addSendButton = function(form) {
			nlapiGetContext().setSetting('SESSION', 'lastAgreementLoaded', nlapiGetRecordId());
			nlapiGetContext().setSetting('SESSION', 'echoSignAction', 'sendDocument');

			// set script in VIEW mode
			form.setScript('customscript_echosign_agreement_field_va');

			var agreement = nlapiGetNewRecord();
			var agreementStatus = agreement.getFieldText('custrecord_echosign_status');
			if (agreementStatus === 'Draft' || (agreementStatus === 'Not Yet Sent For Signature' && nlapiGetFieldValue('custrecord_echosign_senddocinteractive') === 'T')) {
				if (isCurrentlyPendingSendCallback()) {
					form.addButton('custpage_send_button', 'Send For Signature', 'EchoSign.Manager.showPendingSendMessage()');
				} else {
					form.addButton('custpage_send_button', 'Send For Signature', 'EchoSign.Manager.main()');
				}
			} else {
				form.addButton('custpage_update_button', 'Update Status', 'EchoSign.Manager.update()');

				// only show cancel button if the user has create edit full
				// permissions
				if (parseInt(Util.getUserPermissionOnRecordType('customrecord_echosign_agreement'), 10) > 1) {
					form.addButton('custpage_cancel_button', 'Cancel Agreement', 'EchoSign.Manager.cancel()');
				}
			}
			return form;
		};

		this.addReminderButton = function(form) {
			if (nlapiGetFieldValue('custrecord_echosign_doc_key') && nlapiGetFieldText('custrecord_echosign_status') === 'Out For Signature') {
				form.addButton('custpage_sendreminder_button', 'Send Reminder', 'EchoSign.Manager.sendReminder()');
			}
		};

		this.addFields = function(form, typeStr) {
			var agreement = nlapiGetNewRecord();

			var sigType = form.addField('custpage_echosign_sigtype', 'select', 'Signature Type');
			sigType.addSelectOption('1', 'e-Signature');
			sigType.addSelectOption('2', 'Fax Signature');
			if (!agreement.getFieldValue('custrecord_echosign_sign_type')) sigType.setDefaultValue('1');
			else {
				sigType.setDefaultValue(agreement.getFieldValue('custrecord_echosign_sign_type'));
			}

			var helpLink = form.addField('custpage_echosign_help', 'inlinehtml', 'Help');
			var helpHtml = '<SCRIPT language="JavaScript">';
			helpHtml += 'function newhelp(){window.open("https://helpx.adobe.com/document-cloud/topics.html", "EchoSignHelp", "width=1024,height=764,resizable=1,status=1,scrollbars=1");}';
			helpHtml += '</SCRIPT>';
			helpHtml += '<SCRIPT language="JavaScript">';
			helpHtml += 'function newwindow(){window.open("https://NetSuiteIntegration.echosign.com/public/upgrade?type=enterprise_trial&cs=ns_bundle", "EchoSignHelp", "width=1024,height=764,resizable=1,status=1,scrollbars=1");}';
			helpHtml += '</SCRIPT>';
			helpHtml += '<SCRIPT language="JavaScript">';
			helpHtml += "function newlink(url){window.location = url;}";
			helpHtml += '</SCRIPT>';
			helpHtml += '<p>For Help <A HREF="javascript:newhelp()" >Click Here</A> </p>';

			helpLink.setDefaultValue(helpHtml);

			// old status
			var oldStatus = form.addField('custpage_echosign_old_status', 'text', '');
			oldStatus.setDefaultValue(nlapiGetFieldText('custrecord_echosign_status'));
			oldStatus.setDisplayType('hidden');

			//parent record
			if (typeStr === 'view') {
				var parentRec = form.addField('custpage_echosign_parent_record_url', 'url', 'Parent Record');
				if (nlapiGetFieldValue('custrecord_echosign_parent_type') && nlapiGetFieldValue('custrecord_echosign_parent_record')) {
					nlapiSetFieldValue('custpage_echosign_parent_record_url', nlapiResolveURL('record', nlapiGetFieldValue('custrecord_echosign_parent_type'), nlapiGetFieldValue('custrecord_echosign_parent_record'), false));
				}
				try{
					//get the parent record tranid/entityid/name
					var theParentRec = nlapiLoadRecord(nlapiGetFieldValue('custrecord_echosign_parent_type'), nlapiGetFieldValue('custrecord_echosign_parent_record'));
					if(theParentRec)
						parentRec.setLinkText(theParentRec.getFieldValue('tranid') || theParentRec.getFieldValue('entityid') || theParentRec.getFieldValue('name') || "Click to open parent record");
					else
						parentRec.setLinkText( "Click to open parent record");
				}catch(ex) {
					//if things faild
					nlapiLogExecution('error', ex.name, ex.message);
					parentRec.setLinkText( "Click to open parent record");
				}

				
				form.insertField(parentRec, 'custrecord_echosign_signed_doc');
			} else if (typeStr === 'edit') {
				var pRecType = parentTypes[nlapiGetFieldValue('custrecord_echosign_parent_type')];
				var pr = form.addField('custpage_echosign_parent_record', 'select', 'Parent Record', pRecType || 'transaction');
				pr.setDefaultValue(nlapiGetFieldValue('custrecord_echosign_parent_record') || '');
				form.insertField(pr, 'custrecord_echosign_signed_doc');
			}

			// interactive URL
			var interactiveURL = form.addField('custpage_echosign_inter_url', 'url', 'Interactive URL');
			interactiveURL.setDefaultValue(nlapiGetFieldValue('custrecord_echosign_interactive_url'));
			interactiveURL.setDisplayType('hidden');

			/*
			 * var interactiveURLClick =
			 * form.addField('custpage_echosign_inter_url_click', 'richtext',
			 * ''); interactiveURLClick.setDisplayType('inline');
			 *
			 * if(nlapiGetFieldValue('custrecord_echosign_interactive_url'))
			 * interactiveURLClick.setDefaultValue('<a href="#"
			 * onclick="EchoSign.showInteractive(\''+nlapiGetFieldValue('custrecord_echosign_interactive_url')+'\');">Interactive
			 * Document</a>'); else{ interactiveURLClick.setDefaultValue('');
			 * //interactiveURLClick.setDisplayType('hidden'); }
			 * form.insertField(interactiveURLClick,
			 * 'custpage_echosign_parent_record');
			 */

			sigType.setLayoutType('normal', 'startcol');
			var sigOrder = form.addField('custpage_echosign_sigorder', 'select', 'Signature Order');

			sigOrder.addSelectOption('1', 'I sign, then recipients sign');
			sigOrder.addSelectOption('2', 'Recipients sign, then I sign');
			sigOrder.addSelectOption('3', '-NONE-');

			nlapiLogExecution('debug', 'actual sig order', agreement.getFieldValue('custrecord_echosign_sign_order'));

			if (!agreement.getFieldValue('custrecord_echosign_sign_order')) sigOrder.setDefaultValue('3');
			else {
				sigOrder.setDefaultValue(agreement.getFieldValue('custrecord_echosign_sign_order'));
			}

			var progress = form.addField('custpage_echosign_progress', 'inlinehtml', 'Process');
			progress.setDefaultValue('<h3 style="display:none">Processing Agreement</h3><br/>' + '<img style="display:none" src="https://system.netsuite.com/core/media/media.nl?id=5827&c=TSTDRV1332459&h=91aae45dce95ca820e0f" />');
			var reminder = form.addField('custpage_echosign_reminder', 'select', 'Remind Recipients To Sign');
			reminder.addSelectOption('1', 'Never');
			reminder.addSelectOption('2', 'Daily');
			reminder.addSelectOption('3', 'Weekly');

			if (!agreement.getFieldValue('custrecord_echosign_reminder')) reminder.setDefaultValue('1');
			else {
				reminder.setDefaultValue(agreement.getFieldValue('custrecord_echosign_reminder'));
			}

			var password = form.addField('custpage_echosign_password', 'password', 'Password');
			if (typeStr === 'view') password.setDefaultValue('hidden');

			var confirmPass = form.addField('custpage_echosign_confirm', 'password', 'Confirm Password');
			if (typeStr === 'view') confirmPass.setDefaultValue('hidden');

			// insert some space
			var space1 = form.addField('custpage_space1', 'label', '');
			form.insertField(space1, 'custrecord_echosign_protect_view');

			// security opt fields
			var secOpts = getSecurityOptions();
			if (secOpts.length === 1) {
				// add a checkbox
				var secOpt0 = form.addField('custpage_echosign_security_option', 'checkbox', secOpts[0].label);
				if (nlapiGetFieldValue('custrecord_echosign_protect_sign') === 'T') secOpt0.setDefaultValue('T');

				form.insertField(secOpt0, 'custrecord_echosign_protect_view');
			} else if (secOpts.length > 1) {
				// verify identity checkbox
				var useSecOpt = form.addField('custpage_echosign_use_security_options', 'checkbox', getSecurityAppliesTo());

				form.insertField(useSecOpt, 'custrecord_echosign_protect_view');
				useSecOpt.setDefaultValue('F');//bug#4054182
				// use radio button
				for (var x = 0, xlen = secOpts.length; x < xlen; x++) {
					var secOptx = form.addField('custpage_echosign_security_option', 'radio', secOpts[x].label, secOpts[x].value);
					// default value
					if (nlapiGetFieldValue(secOpts[x].field) === 'T') {
						form.setFieldValues({
							'custpage_echosign_security_option': secOpts[x].value
						});
						useSecOpt.setDefaultValue('T');
					}
					if (nlapiGetFieldValue('custpage_echosign_use_security_options') === 'F') secOptx.setDisplayType('disabled');

					form.insertField(secOptx, 'custrecord_echosign_protect_view');
				}
			}

			if (nlapiGetFieldValue('custrecord_echosign_protect_sign') === 'F' && nlapiGetFieldValue('custrecord_echosign_protect_view') === 'F') {
				password.setDisplayType('disabled');
				confirmPass.setDisplayType('disabled');
			}

			// }
			var dateSent = form.addField('custpage_echosign_sent', 'date', 'Date Sent');
			dateSent.setDisplayType('disabled');
			if (agreement.getFieldValue('custrecord_echosign_date_sent')) {
				dateSent.setDefaultValue(agreement.getFieldValue('custrecord_echosign_date_sent'));
			}

			var dateSigned = form.addField('custpage_echosign_signed', 'date', 'Date Signed');
			dateSigned.setDisplayType('disabled');
			if (agreement.getFieldValue('custrecord_echosign_date_signed')) dateSigned.setDefaultValue(agreement.getFieldValue('custrecord_echosign_date_signed'));
			
			form.insertField(dateSigned, 'custrecord_echosign_created');
			form.insertField(dateSent, 'custpage_echosign_signed');

			form.insertField(reminder, 'custrecord_celigo_agreement_language');

			form.insertField(password, 'custpage_echosign_reminder');
			form.insertField(confirmPass, 'custpage_echosign_reminder');

			// insert some space
			var space2 = form.addField('custpage_space2', 'label', '');
			form.insertField(space2, 'custpage_echosign_reminder');

			form.insertField(sigOrder, 'custrecord_echosign_senddocinteractive');

			form.insertField(sigType, 'custrecord_echosign_sender_signs');

			form.insertField(progress, 'custpage_echosign_sigtype');

			
			if (!agreement.getFieldValue('custrecord_celigo_agreement_link') || agreement.getFieldValue('custrecord_celigo_agreement_link') === '' || agreement.getFieldValue('custrecord_celigo_host_agreement_signer') !== 'T') {
				form.getField('custrecord_celigo_agreement_link').setDisplayType('hidden');
			}
		};

		this.addEventTab = function(type, form) {
			if (type === 'view' || type === 'edit') {
				form.addTab('custpage_echosign_event_tab', 'Events');
				var agreementId = nlapiGetRecordId();
				var eventColumns = [];
				eventColumns.push(new nlobjSearchColumn('internalid'));
				eventColumns[0].setSort();
				eventColumns.push(new nlobjSearchColumn('custrecord_echosign_event_type'));
				eventColumns.push(new nlobjSearchColumn('custrecord_echosign_event_date')); // OLD
				eventColumns.push(new nlobjSearchColumn('custrecord_echosign_time')); // OLD
				eventColumns.push(new nlobjSearchColumn('custrecord_echosign_event_date_time'));
				var events = nlapiSearchRecord('customrecord_echosign_event', null, new nlobjSearchFilter('custrecord_echosign_agreem', null, 'is', agreementId), eventColumns);
				if (events) {
					// we added new field Event Date Time and deprecated the old
					// fields Event Date & Event Time
					// for that reason and backward compatibility, we have to
					// check if the events are in the new format
					// or the old format. If old format, then we display the old
					// fields, if new format then we display the new field
					var isNewFormat = true;
					for (var i = 0; i < events.length; i++) {
						if (!events[i].getValue('custrecord_echosign_event_date_time')) {
							isNewFormat = false;
							break;
						}
					}

					var eventList = form.addSubList('custpage_echosign_eventlist', 'staticlist', 'Events', 'custpage_echosign_event_tab');
					eventList.addField('custpage_echosign_event_desc', 'text', 'Event Description');
					if (isNewFormat) {
						eventList.addField('custpage_echosign_event_date_time', 'text', 'Event Date Time');
					} else {
						eventList.addField('custpage_echosign_event_date', 'text', 'Event Date');
						eventList.addField('custpage_echosign_event_time', 'text', 'Event Time');
					}

					var rows = [];
					for (var i = 0; i < events.length; i++) {
						var eventTitle = events[i].getValue('custrecord_echosign_event_type') || '';
						if (eventTitle.indexOf('Document created by') === 0) {
							continue;
						}
						try {
							if (events[i]) {
								var newRow = [];
								newRow.custpage_echosign_event_desc = events[i].getValue('custrecord_echosign_event_type') || ' ';
								if (isNewFormat) {
									newRow.custpage_echosign_event_date_time = events[i].getValue('custrecord_echosign_event_date_time') || ' ';
								} else {
									newRow.custpage_echosign_event_date = events[i].getValue('custrecord_echosign_event_date') || ' ';
									newRow.custpage_echosign_event_time = events[i].getValue('custrecord_echosign_time') || ' ';
								}
								rows.push(newRow);
							}
						} catch (e) {
							log('Unable to load line ' + i);
						}
					}
					eventList.setLineItemValues(rows);
				}
			}
			return form;
		};

		this.addRecipientsTab = function(type, form) {
			form.addTab('custpage_echosign_recip_tab', 'Recipients');
			if (type !== 'create') {
				var agreement = nlapiGetNewRecord();
				var agreementId = agreement.getId();
				var recColumns = [];
				recColumns.push(new nlobjSearchColumn('custrecord_echosign_signer_order'));
				recColumns.push(new nlobjSearchColumn('custrecord_echosign_email'));
				recColumns.push(new nlobjSearchColumn('custrecord_echosign_signer'));
				recColumns.push(new nlobjSearchColumn('custrecord_echosign_role'));
				recColumns.push(new nlobjSearchColumn('custrecord_echosign_entityid'));

				var recipients = nlapiSearchRecord('customrecord_echosign_signer', null, new nlobjSearchFilter('custrecord_echosign_agree', null, 'is', agreementId), recColumns);
				if (agreement.getFieldText('custrecord_echosign_status') !== 'Draft' || type === 'view') {
					var recList = form.addSubList('custpage_echosign_reclist', 'staticlist', 'Recipients', 'custpage_echosign_recip_tab');
					recList.addField('custpage_echosign_signer', 'text', 'Signer');

					var emailRecField = recList.addField('custpage_echosign_signer_email', 'email', 'Email');
					emailRecField.setMandatory(true);
					var signRec = recList.addField('custpage_echosign_sign_record', 'select', 'SignRecord', 'customrecord_echosign_signer');
					signRec.setDisplayType('hidden');
					var roleField = recList.addField('custpage_echosign_signer_role', 'text', 'Role');
					if (recipients) {
						log("Loading " + recipients.length + " Recipients");
						var rows = [];
						for (var i = 0; i < recipients.length; i++) {
							var lineItem = recipients[i].getValue('custrecord_echosign_signer_order') - 1;
							rows[lineItem] = [];
							rows[lineItem].custpage_echosign_sign_record = recipients[i].getId();
							rows[lineItem].custpage_echosign_signer = recipients[i].getValue('custrecord_echosign_entityid') || recipients[i].getText('custrecord_echosign_signer') || ' ';
							rows[lineItem].custpage_echosign_signer_email = recipients[i].getValue('custrecord_echosign_email') || '';
							rows[lineItem].custpage_echosign_signer_role = recipients[i].getText('custrecord_echosign_role') || ' ';
						}
						recList.setLineItemValues(rows);
					} else log("No Recipients Found");
				} else {
					var recList = form.addSubList('custpage_echosign_reclist', 'inlineeditor', 'Recipients', 'custpage_echosign_recip_tab');
					recList.addField('custpage_echosign_signer', 'select', 'Signer', 'contact');
					// recList.addField('custpage_echosign_signer_email',
					// 'email', 'Email');
					var emailRecField = recList.addField('custpage_echosign_signer_email', 'email', 'Email');
					emailRecField.setMandatory(true);
					var signRec = recList.addField('custpage_echosign_sign_record', 'select', 'SignRecord', 'customrecord_echosign_signer');
					signRec.setDisplayType('hidden');
					var roleField = recList.addField('custpage_echosign_signer_role', 'select', 'Role');
					roleField.addSelectOption('1', 'Signer', true);
					roleField.addSelectOption('2', 'CC');
					if (nlapiGetContext().getSetting('script', 'custscript_echosign_allow_approver_role') === 'T') {
						roleField.addSelectOption('5', 'Approver');
					}
					if (recipients) {
						var rows = [];
						for (var i = 0; i < recipients.length; i++) {
							var lineItem = recipients[i].getValue('custrecord_echosign_signer_order') - 1;
							rows[lineItem] = [];
							rows[lineItem].custpage_echosign_sign_record = recipients[i].getId();
							rows[lineItem].custpage_echosign_signer = recipients[i].getValue('custrecord_echosign_signer') || '';
							rows[lineItem].custpage_echosign_signer_email = recipients[i].getValue('custrecord_echosign_email') || '';
							rows[lineItem].custpage_echosign_signer_role = recipients[i].getValue('custrecord_echosign_role') || '';
						}
						recList.setLineItemValues(rows);
					}
				}
			} else if (type === 'create') {
				var recList = form.addSubList('custpage_echosign_reclist', 'inlineeditor', 'Recipients', 'custpage_echosign_recip_tab');
				recList.addField('custpage_echosign_signer', 'select', 'Signer', 'contact');
				// recList.addField('custpage_echosign_signer_email', 'email',
				// 'Email');
				var emailRecField = recList.addField('custpage_echosign_signer_email', 'email', 'Email');
				emailRecField.setMandatory(true);
				var signRec = recList.addField('custpage_echosign_sign_record', 'select', 'SignRecord', 'customrecord_echosign_signer');
				signRec.setDisplayType('hidden');
				var roleField = recList.addField('custpage_echosign_signer_role', 'select', 'Role');
				roleField.addSelectOption('1', 'Signer', true);
				roleField.addSelectOption('2', 'CC');
				if (nlapiGetContext().getSetting('script', 'custscript_echosign_allow_approver_role') === 'T') {
					roleField.addSelectOption('5', 'Approver');
				}
			}
			return form;
		};

		this.addDocumentsTab = function(type, form) {
			form.addTab('custpage_echosign_doc_tab', 'Documents');
			if (type !== 'create') {

				var agreement = nlapiGetNewRecord();
				var agreementId = agreement.getId();
				var docColumns = [];
				docColumns.push(new nlobjSearchColumn('custrecord_echosign_file'));
				var documents = nlapiSearchRecord('customrecord_echosign_document', null, new nlobjSearchFilter('custrecord_echosign_agreement', null, 'is', agreementId), docColumns);
				if (agreement.getFieldText('custrecord_echosign_status') !== 'Draft' || type === 'view') {
					var docList = form.addSubList('custpage_echosign_doclist', 'staticlist', 'Documents', 'custpage_echosign_doc_tab');
					var docFile = docList.addField('custpage_echosign_doc_file', 'text', 'File');
					docFile.setMandatory(true);
					var docRec = docList.addField('custpage_echosign_doc_record', 'select', 'DocRecord', 'customrecord_echosign_document');
					docRec.setDisplayType('hidden');
					if (documents) {
						var rows = [];
						for (var i = 0; i < documents.length; i++) {
							rows[i] = [];
							rows[i].custpage_echosign_doc_record = documents[i].getId();
							rows[i].custpage_echosign_doc_file = documents[i].getText('custrecord_echosign_file') || ' ';
						}
						docList.setLineItemValues(rows);
					}
				} else {
					var docList = form.addSubList('custpage_echosign_doclist', 'inlineeditor', 'Documentss', 'custpage_echosign_doc_tab');
					var docFile = docList.addField('custpage_echosign_doc_file', 'file', 'File');
					docFile.setMandatory(true);
					var docRec = docList.addField('custpage_echosign_doc_record', 'select', 'DocRecord', 'customrecord_echosign_document');
					docRec.setDisplayType('hidden');
					if (documents) {
						var rows = [];
						for (var i = 0; i < documents.length; i++) {
							rows[i] = [];
							rows[i].custpage_echosign_doc_record = documents[i].getId();
							rows[i].custpage_echosign_doc_file = documents[i].getValue('custrecord_echosign_file') || ' ';
						}
						docList.setLineItemValues(rows);
					}
				}
			} else if (type === 'create') {
				var docList = form.addSubList('custpage_echosign_doclist', 'inlineeditor', 'Documents', 'custpage_echosign_doc_tab');
				var docFile = docList.addField('custpage_echosign_doc_file', 'select', 'File', 'file');
				docFile.setMandatory(true);
				var docRec = docList.addField('custpage_echosign_doc_record', 'select', 'DocRecord', 'customrecord_echosign_document');
				docRec.setDisplayType('hidden');
			}
			return form;
		};

		this.addThumbnails = function(type, form) {
			if (type === 'view' || type === 'edit') {
				var agreement = nlapiGetNewRecord();
				if (agreement.getFieldText('custrecord_echosign_status') === 'Signed' || agreement.getFieldText('custrecord_echosign_status') === 'Approved') {
					if( nlapiGetFieldValue('custrecord_echosign_protect_view') === 'T'){
						form.addTab('custpage_thumbnails', 'Signed Document');
						var images = form.addField('custpage_echosign_image', 'inlinehtml', 'Signatures', null, 'custpage_thumbnails');
						html = "<img src= '" + "https://system.netsuite.com/core/media/media.nl?id=5828&c=TSTDRV1332459&h=8a2205ed3258a1ffe6de&fcts=20150823112600" + "'/>";
						images.setDefaultValue(html);
					}
					else{
					
						var columns = [];
						columns.push(new nlobjSearchColumn('custrecord_echosign_thumbnail'));
						var thumbs = nlapiSearchRecord('customrecord_echosign_signed', null, new nlobjSearchFilter('custrecord_echosign_agreeme', null, 'is', agreement.getId()), columns);
						if (thumbs && thumbs.length > 0) {
								for (var i = 0; i < thumbs.length; i++) {
								var tempLow = parseInt(thumbs[i].getId());
								var lower = false;
								var thumbIndex = i;
								for (var j = i; j < thumbs.length; j++) {
									if (parseInt(thumbs[j].getId()) < tempLow) {
										lower = true;
										tempLow = thumbs[j].getId();
										thumbIndex = j;
									}
								}
								if (lower === true) {
									var tempThumb = thumbs[i];
									thumbs[i] = thumbs[thumbIndex];
									thumbs[thumbIndex] = tempThumb;
								}
							}
							form.addTab('custpage_thumbnails', 'Signed Document');
							var images = form.addField('custpage_echosign_image', 'inlinehtml', 'Signatures', null, 'custpage_thumbnails');
							html = '';
							for (var i = 0; i < thumbs.length; i++) {
								html += "<img src= '" + thumbs[i].getValue('custrecord_echosign_thumbnail') + "'/>";
								html += "<br/>";
								log('Image Url ' + thumbs[i].getId(), thumbs[i].getValue('custrecord_echosign_thumbnail'));
							}
							images.setDefaultValue(html);
						}
						else{
						
							var url = nlapiResolveURL('SUITELET', 'customscript_echosign_service_manager', 'customdeploy_echosign_service_manager_de', true);
							url += '&echoaction=getAgreementImageUrls';
							url += '&recid=' + nlapiGetRecordId();
							url += '&senderid=' + nlapiGetUser();
							var responseBody = JSON.parse(nlapiRequestURL(url).getBody());
							if (responseBody.imageUrls){
								form.addTab('custpage_thumbnails', 'Signed Document');
								var images = form.addField('custpage_echosign_image', 'inlinehtml', 'Signatures', null, 'custpage_thumbnails');
								html = '';
								for (var i = 0; i < responseBody.imageUrls.length; i++) {
									html += "<img src= '" + responseBody.imageUrls[i] + "'/>";
									html += "<br/>";
									log('Image Url ' + responseBody.imageUrls[i]);
								}
								images.setDefaultValue(html);
							}
						}
						
					}
				}
			}
		};

		this.submitForm = function(form) {
			log("Submit Form");

			if (nlapiGetFieldValue('custpage_echosign_sigtype')) {
				nlapiSetFieldValue('custrecord_echosign_sign_type', nlapiGetFieldValue('custpage_echosign_sigtype'));
			}
			if (nlapiGetFieldValue('custpage_echosign_reminder')) {
				nlapiSetFieldValue('custrecord_echosign_reminder', nlapiGetFieldValue('custpage_echosign_reminder'));
			}

			nlapiLogExecution('debug', 'sign order field from UI', nlapiGetFieldValue('custpage_echosign_sigorder'));

			if (nlapiGetFieldValue('custrecord_echosign_sender_signs') === 'T' && nlapiGetContext().getExecutionContext() === 'userinterface') {

				nlapiLogExecution('debug', 'sign order field was', nlapiGetFieldValue('custrecord_echosign_sign_order'));
				nlapiLogExecution('debug', 'writing sign order field from UI', nlapiGetFieldValue('custpage_echosign_sigorder'));
				nlapiSetFieldValue('custrecord_echosign_sign_order', nlapiGetFieldValue('custpage_echosign_sigorder'));
			}
			if (nlapiGetFieldValue('custpage_echosign_password')) {
				nlapiSetFieldValue('custrecord_echosign_password', nlapiGetFieldValue('custpage_echosign_password'));
			} else log('No Password');

		};

		this.submitLists = function(type, form) {
			log("Submit Lists");
			var agreement = nlapiGetNewRecord();
			if (type.toLowerCase() === 'create' || type.toLowerCase() === 'edit') {
				log('Agreement Status', agreement.getFieldText('custrecord_echosign_status'));
				if (agreement.getFieldText('custrecord_echosign_status') == 'Draft') {
					var toIndex = 0;
					var ccIndex = 0;

                    var numberOfRecipients = agreement.getLineItemCount('custpage_echosign_reclist');
                    log('Number of Recipients', numberOfRecipients);
                    if (numberOfRecipients <= 0)
                    	return;
                    
                    for (var i = 1; i <= agreement.getLineItemCount('custpage_echosign_reclist'); i++) {
						if (agreement.getLineItemValue('custpage_echosign_reclist', 'custpage_echosign_sign_record', i) !== null && agreement.getLineItemValue('custpage_echosign_reclist', 'custpage_echosign_sign_record', i) !== '' && agreement.getLineItemValue('custpage_echosign_reclist', 'custpage_echosign_sign_record', i).length > 0) {
							var signerId = agreement.getLineItemValue('custpage_echosign_reclist', 'custpage_echosign_sign_record', i);
							log("Signer " + i + " Exists", signerId);
							var signer = nlapiLoadRecord('customrecord_echosign_signer', signerId);
							signer.setFieldValue('custrecord_echosign_role', agreement.getLineItemValue('custpage_echosign_reclist', 'custpage_echosign_signer_role', i));
							signer.setFieldValue('custrecord_echosign_email', agreement.getLineItemValue('custpage_echosign_reclist', 'custpage_echosign_signer_email', i).replace(/^\s+|\s+$/g, ""));
							if (agreement.getLineItemValue('custpage_echosign_reclist', 'custpage_echosign_signer_role', i) === '2') {
								signer.setFieldValue('custrecord_echosign_cc_order', ccIndex);
								signer.setFieldValue('custrecord_echosign_to_order', '');
								ccIndex++;
							} else {
								signer.setFieldValue('custrecord_echosign_to_order', toIndex);
								signer.setFieldValue('custrecord_echosign_cc_order', '');
								toIndex++;
							}
							signer.setFieldValue('custrecord_echosign_signer_order', i);
							if (agreement.getLineItemValue('custpage_echosign_reclist', 'custpage_echosign_signer', i) !== null && agreement.getLineItemValue('custpage_echosign_reclist', 'custpage_echosign_signer', i) != '' && agreement.getLineItemValue('custpage_echosign_reclist', 'custpage_echosign_signer', i).length > 0) {
								signer.setFieldValue('custrecord_echosign_signer', agreement.getLineItemValue('custpage_echosign_reclist', 'custpage_echosign_signer', i));
							}
							nlapiSubmitRecord(signer);
							log("Finished Updating Signer", signerId);
						} else {
							log("Signer " + i + " Doesn't Exist");
							var signer = nlapiCreateRecord('customrecord_echosign_signer');
							signer.setFieldValue('custrecord_echosign_agree', agreement.getId());
							signer.setFieldValue('custrecord_echosign_signer_order', i);
							signer.setFieldValue('custrecord_echosign_role', agreement.getLineItemValue('custpage_echosign_reclist', 'custpage_echosign_signer_role', i));
							if (agreement.getLineItemValue('custpage_echosign_reclist', 'custpage_echosign_signer_role', i) === '2') {
								signer.setFieldValue('custrecord_echosign_cc_order', ccIndex);
								ccIndex++;
							} else {
								signer.setFieldValue('custrecord_echosign_to_order', toIndex);
								toIndex++;
							}
							signer.setFieldValue('custrecord_echosign_email', agreement.getLineItemValue('custpage_echosign_reclist', 'custpage_echosign_signer_email', i).replace(/^\s+|\s+$/g, ""));
							if (agreement.getLineItemValue('custpage_echosign_reclist', 'custpage_echosign_signer', i) !== null && agreement.getLineItemValue('custpage_echosign_reclist', 'custpage_echosign_signer', i) !== '' && agreement.getLineItemValue('custpage_echosign_reclist', 'custpage_echosign_signer', i).length > 0) {
								signer.setFieldValue('custrecord_echosign_signer', agreement.getLineItemValue('custpage_echosign_reclist', 'custpage_echosign_signer', i));
							}
							var signerId = nlapiSubmitRecord(signer);
							log('New Signer Created', signerId);
						}
					}
					var signerColumns = [];
					signerColumns.push(new nlobjSearchColumn('custrecord_echosign_role'));
					signerColumns.push(new nlobjSearchColumn('custrecord_echosign_email'));
					var signers = nlapiSearchRecord('customrecord_echosign_signer', null, new nlobjSearchFilter('custrecord_echosign_agree', null, 'is', agreement.getId()), signerColumns);
					if (signers) {
						for (var i = 0; i < signers.length; i++) {
							var found = false;
							for (var j = 1; j <= agreement.getLineItemCount('custpage_echosign_reclist'); j++) {
								if (signers[i].getValue('custrecord_echosign_role') === 
											agreement.getLineItemValue('custpage_echosign_reclist', 'custpage_echosign_signer_role', j) && 
										signers[i].getValue('custrecord_echosign_email') === 
											agreement.getLineItemValue('custpage_echosign_reclist', 'custpage_echosign_signer_email', j).replace(/^\s+|\s+$/g, "")) {
									found = true;
								}
							}
							if (found === false) {
								nlapiDeleteRecord('customrecord_echosign_signer', signers[i].getId());
								log('Deleted Record', signers[i].getId());
							}
						}
					}
				}
			}
		};
	}

	function Redirecter() {
		this.redirect = function() {
			var agreeId = nlapiGetNewRecord().getId();
			var url = nlapiResolveURL('RECORD', 'customrecord_echosign_agreement', agreeId, 'VIEW');
			var html = '';
			html += '<html>';
			html += '<head>';
			html += '<script>';
			html += 'window.location.href = "' + url + '";';
			html += '</script>';
			html += '</head>';
			html += '</html>';
			window.location.href = url;
		};
	}

	function Deleter() {
		this.deleteChildren = function() {
			var agreeId = nlapiGetRecordId();
			var signerResults = nlapiSearchRecord('customrecord_echosign_signer', null, new nlobjSearchFilter('custrecord_echosign_agree', null, 'is', agreeId));
			if (signerResults) {
				for (var i = 0; i < signerResults.length; i++) {
					nlapiDeleteRecord('customrecord_echosign_signer', signerResults[i].getId());
				}
			}

			var docResults = nlapiSearchRecord('customrecord_echosign_document', null, new nlobjSearchFilter('custrecord_echosign_agreement', null, 'is', agreeId));
			if (docResults) {
				for (var i = 0; i < docResults.length; i++) {
					nlapiDeleteRecord('customrecord_echosign_document', docResults[i].getId());
				}
			}

			var eventResults = nlapiSearchRecord('customrecord_echosign_event', null, new nlobjSearchFilter('custrecord_echosign_agreem', null, 'is', agreeId));
			if (eventResults) {
				for (var i = 0; i < eventResults.length; i++) {
					nlapiDeleteRecord('customrecord_echosign_event', eventResults[i].getId());
				}
			}

			var thumbResults = nlapiSearchRecord('customrecord_echosign_signed', null, new nlobjSearchFilter('custrecord_echosign_agreeme', null, 'is', agreeId));
			if (thumbResults) {
				for (var i = 0; i < thumbResults.length; i++) {
					nlapiDeleteRecord('customrecord_echosign_signed', thumbResults[i].getId());
				}
			}
			var agreement = nlapiGetNewRecord();
			if (agreement.getFieldText('custrecord_echosign_status') === 'Out For Signature' || agreement.getFieldText('custrecord_echosign_status') === 'Expired') {
				var url = nlapiResolveURL('SUITELET', 'customscript_echosign_service_manager', 'customdeploy_echosign_service_manager_de', true);
				url += '&echoaction=cancelAgreement';
				url += '&recid=' + agreement.getId();
				log('Cancel Agreement', url);
				nlapiRequestURL(url);
			}
			if (agreement.getFieldText('custrecord_echosign_status') === 'Signed' || agreement.getFieldText('custrecord_echosign_status') === 'Cancelled') {
				var url = nlapiResolveURL('SUITELET', 'customscript_echosign_service_manager', 'customdeploy_echosign_service_manager_de', true);
				url += '&echoaction=removeAgreement';
				url += '&recid=' + agreement.getId();
				log('Remove Agreement', url);
				nlapiRequestURL(url);
			}
		};
	}
	return { // public members
		beforeLoad: function(type, form, request) {
			try {
				log("Before Load");

				//show message if disAllowEdit is false
				if (type.toLowerCase() === 'view' && request.getParameter('disAllowEdit') === 'false') {
					var html = '<table cellpadding="0" cellspacing="0" border="0" bgcolor="#FFB6C1"><tbody>' + '<tr><td><img src="/images/icons/messagebox/msgbox_corner_tl.png" alt="" width="7" height="7" border="0"></td><td width="40"><img src="/images/icons/reporting/x.gif" width="1" height="1" alt="" hspace="20"></td><td width="100%"></td><td><img src="/images/icons/messagebox/msgbox_corner_tr.png" alt="" width="7" height="7" border="0"></td></tr>' + '<tr><td align="left" valign="top"></td><td width="100%" valign="top">' + '<table width="240px" cellpadding="0" cellspacing="0" border="0" style="line-height:18px;font-color:#000000;font-size:12px;"><tbody>' + '<tr><td>' + 'This agreement can no longer be edited.' + '</td></tr>' + '</tbody></table>' + '</td><td></td></tr>' + '<tr><td><img src="/images/icons/messagebox/msgbox_corner_bl.png" alt="" width="7" height="7" border="0"></td><td></td><td width="100%"></td><td><img src="/images/icons/messagebox/msgbox_corner_br.png" alt="" width="7" height="7" border="0"></td></tr>' + '</tbody></table>';

					var f = form.addField('custpage_no_edit', 'inlinehtml', null);
					f.setLayoutType('outsideabove', 'startrow');
					form.setFieldValues({
						'custpage_no_edit': html
					});
				}

				if (nlapiGetContext().getExecutionContext() !== 'userinterface') {
					log("Before Load - not userinterface, returned");
					return;
				}

				var statusObj = eds.getStatusByNSValue(nlapiGetFieldText('custrecord_echosign_status'));

				// redirect, no editing
				if (type.toLowerCase() === 'edit' && (
				(statusObj && statusObj.apiValue === 'OUT_FOR_SIGNATURE') || (statusObj && statusObj.isFinal === true) || isCurrentlyPendingSendCallback())) {
					nlapiSetRedirectURL('record', nlapiGetRecordType(), nlapiGetRecordId(), false, {
						disAllowEdit: false
					});
					return;
				}

				var am = new AgreementManager();
				am.hideNew(form);
				var typeStr = type.toLowerCase();
				am.addRecipientsTab(typeStr, form);
				am.addEventTab(typeStr, form);
				if (type.toLowerCase() === 'view') {
					// buttons should only appear for non final status
					if (!statusObj || statusObj.isFinal === false) {
						am.addSendButton(form);
						am.addReminderButton(form);
					}

				}

				if (type.toLowerCase() === 'view' || type.toLowerCase() === 'edit' || type.toLowerCase() === 'create') {
					am.addFields(form, type.toLowerCase());
					if (nlapiGetNewRecord().getFieldText('custrecord_echosign_status') != 'Draft') form.getField('custrecord_celigo_agreement_language').setDisplayType('disabled');
				}


				if (type.toLowerCase() === 'view' || type.toLowerCase() === 'edit') {
					am.addThumbnails(type.toLowerCase(), form);
				}

				
				// remove signing url link if status is signed
				if (nlapiGetFieldText('custrecord_echosign_status') === 'Signed') {
					var oldUrl = nlapiGetFieldValue('custrecord_celigo_agreement_link');
					if (oldUrl) {
						nlapiSubmitField('customrecord_echosign_agreement', nlapiGetRecordId(), 'custrecord_celigo_agreement_link', '');
						nlapiSetRedirectURL('RECORD', 'customrecord_echosign_agreement', nlapiGetRecordId(), false);
					}
				}

				// retrieve signing url every the agreement is loaded so that
				// the user always has the latest signing url
				else if (nlapiGetFieldText('custrecord_echosign_status') === 'Out For Signature' && nlapiGetFieldValue('custrecord_celigo_host_agreement_signer') === 'T') {
					nlapiLogExecution('DEBUG', 'getting signing url', nlapiGetRecordId());
					var url = nlapiResolveURL('SUITELET', 'customscript_echosign_service_manager', 'customdeploy_echosign_service_manager_de', true);
					url += '&echoaction=getSigningUrl';
					url += '&recid=' + nlapiGetRecordId();
					var responseBody = JSON.parse(nlapiRequestURL(url).getBody());
					if (responseBody.url) {
						var signingUrl = '<a onclick="EchoSign.showHostSigningModal(\''+ agreementLink + '\');" href="#">Host Signing for the Current Signer</a>';
						var oldUrl = nlapiGetFieldValue('custrecord_celigo_agreement_link');
						if (signingUrl !== oldUrl) {
							nlapiSubmitField('customrecord_echosign_agreement', nlapiGetRecordId(), 'custrecord_celigo_agreement_link', signingUrl);
							nlapiSetRedirectURL('RECORD', 'customrecord_echosign_agreement', nlapiGetRecordId(), false);
						}
					}
				}
			} catch (e) {
				nlapiLogExecution('ERROR', e.name || e.getCode(), e.message || e.getDetails());
				nlapiLogExecution('ERROR', 'check line', Util.getLineNumber(e));
				Util.handleError(e, 'EchoSign_Agreement_AddButton.js', ['client@client.com, client@client.com'], nlapiGetUser());
				if (e.getCode && e.getCode() === 'INSUFFICIENT_PERMISSION') throw e;
				pr = null;
			}
		},

		beforeSubmit: function(type, form) {
			try {
				log("Before Submit");
				var am = new AgreementManager();
				if (type.toLowerCase() === 'edit' || type.toLowerCase() === 'create') am.submitForm(form);
				if (type.toLowerCase() === 'delete') {
					var deleter = new Deleter();
					deleter.deleteChildren();
				}
			} catch (e) {
				nlapiLogExecution('ERROR', e.name || e.getCode(), e.message || e.getDetails());
				nlapiLogExecution('ERROR', 'check line', Util.getLineNumber(e));
				Util.handleError(e, 'EchoSign_Agreement_AddButton.js', ['client@client.com, client@client.com'], nlapiGetUser());
			}
		},

		afterSubmit: function(type, form) {
			try {
				log("After Submit");
				log('Type', type);
				var am = new AgreementManager();
				am.submitLists(type, form);

				new Redirecter();
			} catch (e) {
				nlapiLogExecution('ERROR', e.name || e.getCode(), e.message || e.getDetails());
				nlapiLogExecution('ERROR', 'check line', Util.getLineNumber(e));
				Util.handleError(e, 'EchoSign_Agreement_AddButton.js', ['client@client.com, client@client.com'], nlapiGetUser());
			}
		}
	};
})();