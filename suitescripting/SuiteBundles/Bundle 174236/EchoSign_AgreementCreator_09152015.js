/*******************************************************************************
 * 
 * ADOBE CONFIDENTIAL ___________________
 * 
 * Copyright [first year code created] Adobe Systems Incorporated All Rights
 * Reserved.
 * 
 * NOTICE: All information contained herein is, and remains the property of
 * Adobe Systems Incorporated and its suppliers, if any. The intellectual and
 * technical concepts contained herein are proprietary to Adobe Systems
 * Incorporated and its suppliers and are protected by trade secret or copyright
 * law. Dissemination of this information or reproduction of this material is
 * strictly forbidden unless prior written permission is obtained from Adobe
 * Systems Incorporated.
 ******************************************************************************/
EchoSign.AgreementCreation = (function() { // private members


    function AgreementCreater() {

        var isEntity = function(type) {
                return {
                    'customer': true,
                    'partner': true,
                    'prospect': true,
                    'lead': true
                }[type] || false;
            };
        // methods
        this.createAgreement = function(request, response) {
            var recType = request.getParameter('recordtype');
            var recId = request.getParameter('recordid');
            var today = new Date();
            var timestamp = ' (';
            timestamp += (today.getFullYear() + '-' + today.getMonth() + 1) + '-' + today.getDate();
            timestamp += ' ' + today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds() + ')';
            log(recType, recId);
            var agreement = nlapiCreateRecord('customrecord_echosign_agreement');
            agreement.setFieldValue('custrecord_echosign_parent_type', recType);
            agreement.setFieldValue('custrecord_echosign_parent_record', recId);
            var agreeId = nlapiSubmitRecord(agreement, true, true);
            log('Agreement Created', agreeId);
            var object = nlapiLoadRecord(recType, recId);
            var entityTypes = Util.getNsEntityTypeIds();
            var transTypes = Util.getNsTransactionTypeIds();

            try {
                if (isEntity(recType)) 
                    nlapiSubmitField('customrecord_echosign_agreement', agreeId, 'custrecord_echosign_entity_id', recId);
                else if (object.getFieldValue('entity')) 
                    nlapiSubmitField('customrecord_echosign_agreement', agreeId, 'custrecord_echosign_entity_id', object.getFieldValue('entity'));
            } catch (ex) {}

            var autoAddSigner = (nlapiGetContext().getSetting('script', 'custscript_echosign_auto_add_signer') === 'T');
            var signer = null;
            
            if (transTypes.indexOf(recType) > -1) {
                nlapiSubmitField('customrecord_echosign_agreement', agreeId, 'name', object.getFieldValue('tranid'));
                // only attach transaction PDF if company setting is true
                nlapiLogExecution('DEBUG', 'custscript_echosign_auto_attach_transpdf', nlapiGetContext().getSetting('SCRIPT', 'custscript_echosign_auto_attach_transpdf'));
                if (nlapiGetContext().getSetting('SCRIPT', 'custscript_echosign_auto_attach_transpdf') !== 'F') {
                    try {
                        var doc = nlapiCreateRecord('customrecord_echosign_document');
                        doc.setFieldValue('custrecord_echosign_agreement', agreeId);
                        log('Document Record');
                        var file = nlapiPrintRecord('TRANSACTION', recId, 'PDF');
                        log('File Created');
                        if (nlapiGetContext().getSetting('SCRIPT', 'custscript_echosign_agreement_folder') !== null) file.setFolder(nlapiGetContext().getSetting('SCRIPT', 'custscript_echosign_agreement_folder'));
                        else file.setFolder(-4);
                        var fileId = nlapiSubmitFile(file);
                        log('File Saved', fileId);
                        doc.setFieldValue('custrecord_echosign_file', fileId);
                        var docId = nlapiSubmitRecord(doc);
                        log('Document Record Created', docId);
                    } catch (e) {
                        nlapiLogExecution('ERROR', 'Error Creating Document');
                        nlapiLogExecution('ERROR', e.name || e.getCode(), e.message || e.getDetails());
                    }
                }

                if (autoAddSigner) {
                    // there is company preference to set the related contact on
					// the transaction as the first signer
                    if (nlapiGetContext().getSetting('script', 'custscript_use_trans_contact_as_signer') === 'T') {
                        // figure out the primary contact on the transaction
						// object
                        var res = nlapiSearchRecord('transaction', null, [
                        new nlobjSearchFilter('internalid', null, 'is', object.getId()), new nlobjSearchFilter('mainline', null, 'is', 'T')], [
                        new nlobjSearchColumn('email', 'contactprimary'), new nlobjSearchColumn('contactrole', 'contactprimary'), new nlobjSearchColumn('internalid', 'contactprimary'), new nlobjSearchColumn('entityid', 'contactprimary')]);

                        if (res && res.length && res[0].getValue('email', 'contactprimary')) {
                            signer = nlapiCreateRecord('customrecord_echosign_signer');
                            signer.setFieldValue('custrecord_echosign_signer', res[0].getValue('internalid', 'contactprimary'));
                            signer.setFieldValue('custrecord_echosign_entityid', res[0].getValue('entityid', 'contactprimary'));
                            signer.setFieldValue('custrecord_echosign_agree', agreeId);
                            signer.setFieldValue('custrecord_echosign_email', res[0].getValue('email', 'contactprimary'));
                            signer.setFieldValue('custrecord_echosign_to_order', 0);
                            signer.setFieldValue('custrecord_echosign_signer_order', 1);

                            nlapiSubmitRecord(signer);
                        }
                    }

                    // use email of the entity on the transaction object
                    // if the setting is not set or setting is set but no
					// contact found on transaction
                    if (!signer) {
                        if (nlapiLookupField('entity', object.getFieldValue('entity'), 'email') !== null && nlapiLookupField('entity', object.getFieldValue('entity'), 'email').length !== 0) {
                            signer = nlapiCreateRecord('customrecord_echosign_signer');
                            signer.setFieldValue('custrecord_echosign_agree', agreeId);
                            try {
                                var entityFlds = nlapiLookupField('entity', object.getFieldValue('entity'), ['email', 'entityid']);
                                // signer.setFieldValue('custrecord_echosign_signer',
								// object.getFieldValue('entity'));
                                signer.setFieldValue('custrecord_echosign_entityid', entityFlds['entityid']);
                                signer.setFieldValue('custrecord_echosign_email', entityFlds['email']);
                                signer.setFieldValue('custrecord_echosign_to_order', 0);
                                signer.setFieldValue('custrecord_echosign_signer_order', 1);
                            } catch (e) {
                                nlapiLogExecution('ERROR', 'Invalid Email', nlapiLookupField('entity', object.getFieldValue('entity'), 'email'));
                            }

                            signer.setFieldValue('custrecord_echosign_role', 1);
                            nlapiSubmitRecord(signer);
                        }
                    }
                }
                
            } else if (entityTypes.indexOf(recType) > -1) {
                var agreementName = 'Agreement for ';
                if (object.getFieldValue('companyname') !== null && object.getFieldValue('companyname').length !== 0) {
                    agreementName += object.getFieldValue('companyname');
                } else {
                    if (object.getFieldValue('firstname') !== null && object.getFieldValue('firstname').length !== 0) 
                        agreementName += object.getFieldValue('firstname');
                    if (object.getFieldValue('lastname') !== null && object.getFieldValue('lastname').length !== 0) 
                        agreementName += ' ' + object.getFieldValue('lastname');
                }
                if (recType === 'contact')
                    nlapiSubmitField('customrecord_echosign_agreement', agreeId, 'custrecord_echosign_signer', recId);

                nlapiSubmitField('customrecord_echosign_agreement', agreeId, 'name', agreementName);
                
                if (autoAddSigner) {
                    if (object.getFieldValue('email') !== null && object.getFieldValue('email').length !== 0) {
                        try {
                            signer = nlapiCreateRecord('customrecord_echosign_signer');
                            signer.setFieldValue('custrecord_echosign_agree', agreeId);
                            signer.setFieldValue('custrecord_echosign_entityid', object.getFieldValue('entityid'));
                            signer.setFieldValue('custrecord_echosign_email', object.getFieldValue('email'));
                            signer.setFieldValue('custrecord_echosign_to_order', 0);
                            signer.setFieldValue('custrecord_echosign_signer_order', 1);
                            signer.setFieldValue('custrecord_echosign_role', 1);
                            nlapiSubmitRecord(signer);
                        } catch (e) {
                            nlapiLogExecution('ERROR', 'Invalid Email', object.getFieldValue('email'));
                        }
                    }
                }
            }

            // nlapiLogExecution('debug', 'default sign order to',
			// nlapiLookupField('customrecord_echosign_agreement',
			// agreeId,'custrecord_echosign_sign_order'));
            var url = nlapiResolveURL('RECORD', 'customrecord_echosign_agreement', agreeId, 'VIEW');
            var html = '';
            html += '<html>';
            html += '<head>';
            html += '<script>';
            html += 'window.location.href = "' + url + '";';
            html += '</script>';
            html += '</head>';
            html += '</html>';
            response.write(html);
        };

    }

    return { // public members
        main: function(request, response) {
            try {
                var ac = new AgreementCreater();
                ac.createAgreement(request, response);
            } catch (e) {
                response.write((e.name || e.getCode()) + ': ' + (e.message || e.getDetails()) + ' check line ' + Util.getLineNumber(e));
                nlapiLogExecution('ERROR', e.name || e.getCode(), e.message || e.getDetails());
                nlapiLogExecution('ERROR', 'check line', Util.getLineNumber(e));
            }
        }
    };
})();
main = function(request, response) {
    EchoSign.AgreementCreation.main(request, response);
};
/** @ignoreNlapi */