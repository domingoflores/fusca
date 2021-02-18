/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       10 Mar 2015     rwong            Initial
 *
 *
 */
var onServerLog = true;
var MSG_TITLE = 'APM_DB_SETUP_RECORD_PAGES';
var apmServLib = psgp_apm.serverlibrary;
var logger = new psgp_apm.serverlibrary.logger(MSG_TITLE, false);

function suitelet(request, response) {
    MSG_TITLE = 'suitelet Start';
    if (onServerLog) {
        logger.enable();
    }

    var isReplyInJSON = '';
    var jsonReturnData = new Object();

    try {
        if(request){
            isReplyInJSON = (apmServLib.isValidObject(request.getParameter('is_json')) && request.getParameter('is_json') == 'T') ? request.getParameter('is_json') : 'F';
        }

        logger.debug('suitelet Parameters',
                'getRemainingUsage(): ' + nlapiGetContext().getRemainingUsage() + '\r\n'
                + '************************' + '\r\n'
                + 'Body    : ' + JSON.stringify(request.getBody()) + '\r\n'
        );

        switch (request.getMethod()) {
        case 'GET':
            jsonReturnData = getData(request, jsonReturnData);
            MSG_TITLE = 'getData Return';
            break;
        case 'POST':
            jsonReturnData = postData(request, jsonReturnData);
            MSG_TITLE = 'postData Return';
            break;
        case 'PUT':
            jsonReturnData = putData(request, jsonReturnData);
            MSG_TITLE = 'putData Return';
            break;
        case 'DELETE':
            jsonReturnData = deleteData(request, jsonReturnData);
            MSG_TITLE = 'deleteData Return';
            break;
        }

        /*
         * Return format: Json or String
         */
        logger.debug(MSG_TITLE,
                'getRemainingUsage(): ' + nlapiGetContext().getRemainingUsage() + '\r\n'
                + 'is_json          : ' + isReplyInJSON + '\r\n'
                + '************************' + '\r\n'
                + 'jsonReturnData   : ' + JSON.stringify(jsonReturnData) + '\r\n'
        );
    } catch (ex) {
        var body_message = '';
        if (ex instanceof nlobjError){
            body_message = 'System Error: ' + MSG_TITLE + ': ' + ex.getCode() + ': ' + ex.getDetails();
            logger.error(MSG_TITLE, body_message);
        }else {
            body_message = 'Unexpected Error: ' + MSG_TITLE + ': ' + ex;
            logger.error(MSG_TITLE, body_message);
        }
        jsonReturnData = apmServLib.toJson(apmServLib.getFailMessage (body_message));
    }

    if (isReplyInJSON == 'T') response.write(jsonReturnData);
    else response.write(JSON.stringify(jsonReturnData));
}

function getData(request, jsonReturnData) {

    MSG_TITLE = 'getData start main';
    jsonReturnData = {
            success : true
            , message : 'setup record pages loaded'
    };

    var sf = new Array();
    var sc = new Array();

    var userId = nlapiGetContext().getUser();
    sf.push(new nlobjSearchFilter('custrecord_apm_db_setup_user', null, 'anyof', [userId]));

    sc.push(new nlobjSearchColumn('custrecord_apm_db_setup_record_type'));
    sc.push(new nlobjSearchColumn('custrecord_apm_db_setup_operation'));

    var results = nlapiSearchRecord('customrecord_apm_db_setup_recordpages', null, sf, sc);

    for (var i in results) {
        MSG_TITLE = 'getData format data';
        if(i == 0) {
            jsonReturnData.data = new Array();
        }
        var recordtype = results[i].getValue('custrecord_apm_db_setup_record_type');
        var operation = results[i].getValue('custrecord_apm_db_setup_operation');
        jsonReturnData.data.push({
            internalid : results[i].getId(),
            recordtype : recordtype,
            operation  : operation
        });
    }

    return jsonReturnData;
};

function postData(request, jsonReturnData) {

    MSG_TITLE = 'postData Param Set-up';
    var requestBody = new Array();
    if (request) {
        requestBody = apmServLib.toJson(request.getBody());
    }

    logger.debug('postData Parameters',
            'getRemainingUsage(): ' + nlapiGetContext().getRemainingUsage() + '\r\n'
            + '************************' + '\r\n'
            + 'Request Body     : ' + JSON.stringify(request.getBody()) + '\r\n'
    );

    MSG_TITLE = 'postData start main';
    jsonReturnData = {
            success : true
            , message : 'setup record pages added'
    };

    var recIds = new Array();

    for(var i in requestBody) {
        var record = nlapiCreateRecord('customrecord_apm_db_setup_recordpages');
        record.setFieldValue('custrecord_apm_db_setup_user', nlapiGetContext().getUser());
        record.setFieldValue('custrecord_apm_db_setup_record_type', requestBody[i].recordtype);
        record.setFieldValue('custrecord_apm_db_setup_operation', requestBody[i].operation);
        recIds.push(nlapiSubmitRecord(record));
    }

    logger.debug(MSG_TITLE+' Setup Record Pages', 'recIds: ' + recIds);
    jsonReturnData.data = recIds;

    return jsonReturnData;
};

function putData(request, jsonReturnData) {
    MSG_TITLE = 'putData Param Set-up';
    var requestBody = new Array();
    if (request) {
        requestBody = apmServLib.toJson(request.getBody());
    }

    logger.debug('putData Parameters',
            'getRemainingUsage(): ' + nlapiGetContext().getRemainingUsage() + '\r\n'
            + '************************' + '\r\n'
            + 'Request Body     : ' + JSON.stringify(request.getBody()) + '\r\n'
    );

    MSG_TITLE = 'putData start main';
    jsonReturnData = {
            success : true
            , message : 'setup record pages updated'
    };

    var recIds = new Array();

    for(var i in requestBody) {
        var record = nlapiLoadRecord('customrecord_apm_db_setup_recordpages', requestBody[i].internalid);
        record.setFieldValue('custrecord_apm_db_setup_record_type', requestBody[i].recordtype);
        record.setFieldValue('custrecord_apm_db_setup_operation', requestBody[i].operation);
        recIds.push(nlapiSubmitRecord(record));
    }

    logger.debug(MSG_TITLE+' Setup Record Pages', 'recIds: ' + recIds);
    jsonReturnData.data = recIds;

    return jsonReturnData;
};

function deleteData(request, jsonReturnData) {

    MSG_TITLE = 'deleteData Variables';
    var requestBody = new Array();
    if (request) {
        requestBody = apmServLib.toJson(request.getBody());
    }

    logger.debug('deleteData Parameters',
            'getRemainingUsage(): ' + nlapiGetContext().getRemainingUsage() + '\r\n'
            + '************************' + '\r\n'
            + 'Request Body     : ' + JSON.stringify(request.getBody()) + '\r\n'
    );

    MSG_TITLE = 'deleteData start main';
    jsonReturnData = {
            success : true
            , message : 'setup record pages deleted'
    };

    var internalIds = new Array();
    for(var i in requestBody) {
        internalIds.push(requestBody[i].internalid);
    }

    var sf = new Array();
    sf.push(new nlobjSearchFilter('internalid', null, 'anyof', internalIds));

    var results = nlapiSearchRecord('customrecord_apm_db_setup_recordpages', null, sf, null);

    for(var i in results) {
        nlapiDeleteRecord(results[i].getRecordType(), results[i].getId());
    }

    jsonReturnData.data = internalIds;

    return jsonReturnData;
};