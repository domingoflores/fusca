//------------------------------------------------------------------
// Copyright 2016, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------

//------------------------------------------------------------------
//Script: PriRestLog.js
//Module: PriRestLog         
//Description: Simple logging/tracing with log persistance
//Developer: borko      
//Date: Apr 18, 2016            
//------------------------------------------------------------------

/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */

define(["N/record", "N/runtime", "N/url"], function(record, runtime, url) {
    
    "use strict";
    
    Level = {
      ERROR : "error",      
      DEBUG : "debug",      
      INFO : "info"      
    };
    
    function PriRestLog(name, method, recordId) {
        if (arguments.length == 3) {
            this.priRestLogRec = record.load({type: 'customrecord_pri_rest_log', id: recordId});
             var logStore = this.priRestLogRec.getValue('custrecord_pri_rest_log_trace');
             this.logStore = JSON.parse(logStore);
        } else {
            this.priRestLogRec = record.create({type: 'customrecord_pri_rest_log'});
            this.priRestLogRec.setValue('custrecord_pri_rest_log_ts', new Date());
            this.priRestLogRec.setValue('custrecord_pri_rest_log_method', method);
            this.priRestLogRec.setValue('custrecord_pri_rest_log_userid', runtime.getCurrentUser().id);
            this.priRestLogRec.setValue('custrecord_pri_rest_log_user_role', runtime.getCurrentUser().roleId);
            this.priRestLogRec.setValue('custrecord_pri_rest_log_scriptid', runtime.getCurrentScript().id);
            this.logStore = [];
        }
        
    }
    
    function LogEvent(level, text) {
        this.level = level;
        this.text = text;
    }
    
    LogEvent.prototype.toString = function() {
        return JSON.stringify(this);
    };
    
    PriRestLog.prototype.set = function(name, value) {
        this.priRestLogRec.setValue(name, value);
    };
    
    PriRestLog.prototype.setRequestPayload = function(value) {
        this.set('custrecord_pri_api_rest_req_payload', JSON.stringify(value));
    };
    
    PriRestLog.prototype.setResponsePayload = function(value) {
        this.set('custrecord_pri_api_rest_res_payload', JSON.stringify(value));
    };
    
    PriRestLog.prototype.setStatus = function(value) {
        this.set('custrecord_pri_rest_log_succ_status', value);
    };
    
    PriRestLog.prototype.setTransactionId = function(value) {
        this.set('custrecord_pri_rest_log_transactionid', value);
    };
    
    PriRestLog.prototype.setEntityId = function(value) {
        this.set('custrecord_pri_rest_log_entityid', value);
    };
    
    PriRestLog.prototype.setCustomRecordId = function(type, value) {
        this.set('custrecord_pri_rest_log_customrecid', value);
        
        var recUrl = url.resolveRecord({
            recordType: type,
            recordId: value,
            isEditMode: false
        });
        
        var recTypeId = /rectype=(\d*)/.exec(recUrl)[1];
        this.set('custrecord_pri_rest_log_customrectype', recTypeId);
        this.set('custrecord_pri_rest_log_customrecref', recUrl);
        
    };
    
    PriRestLog.prototype.save = function() {
        this.set('custrecord_pri_rest_log_trace', JSON.stringify(this.logStore));
        var internalid = this.priRestLogRec.save();
        return internalid;
    };
    
    PriRestLog.prototype.log = function(level, text) {
        this.logStore.push(new LogEvent(level, text));
    };
    
    // Utils
    function addLogNote(title, recordId, noteValue) {
        var note = record.create({type: record.Type.NOTE});
        note.setValue('title', title);
        note.setValue('record', recordId);
        note.setValue('recordtype', 79);
        note.setValue('note', noteValue.substring(0, 3998));
        note.save();
    }
    
    // Factory
    function createLog(name, method) {
        return new PriRestLog(name, method);
    }
    
    function loadLogById(id) {
        return new PriRestLog("", "", id);
    }
    
    return {
        createLog : createLog,
        loadLogById : loadLogById,
        Level : Level
    };
}); 