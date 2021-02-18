//------------------------------------------------------------------
// Copyright 2017, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//
// Script: CabinetDuplicatesApi.js
// Module: CabinetDuplicatesApi.js
// Description: Supports duplicate filename search in predefined cabinet folders.   
//
// Developer: borko     
// Date: Sep 23, 2017            
//------------------------------------------------------------------

/**
 * @NApiVersion 2.x
 * 
 * @NScriptType Restlet
 * 
 * @NModuleScope Public
 * 
 */

/*
Checks if duplicate filenames exists in supplied folders (Cabinet).

Intention is to see is it possible to do a copy fileName from source to target.

Folder Ids are specified in folderSource and folderTarget respectively.

HTTP: POST

example:

    request
    {
        folderSource : "folderSourceId",
        folderTarget : "folderTargetId",
        renamePrefix : "DUP_" // optional, if supplied rename is done on server side
        fileNames : ["fileName1", "fileName2"]
    }
    
example:
    response
    {
        "success": true,
        "result": {
            "nodup": {
                "ring3pl-error.log": {
                    "isDuplicate": false,
                    "folderSource": "1434869"
                },
                "SHPCON_PT_201708020720446.csv": {
                    "isDuplicate": false,
                    "folderTarget": "1509760"
                }
            }
        }
      }

*/


define(["N/file", "N/search"],

function(file, search) {
    
    var createError = function(name, message, notifyOff) {
        return error.create({
            "name" : name = name || "",
            "message" : message = message || "", 
            "notifyOff" : notifyOff || true
        });
    };
    
    var formatException = function(exception) {
        var result = {};
        result.message = exception.message;
        result.code = exception.name;
        return result;
    };
    
    var formatResponse = function(result, exception) {
        var response = {};
        if (exception) {
            response.success = false;
            response.exception = formatException(exception);
        } else {
            response.success = true;
            response.result = result;
        }
        return response;
    };
    
    function checkDuplicates(dataIn) {
        
        if (!dataIn.folderSource) {
            throw createError("DUP_CHECK_ERROR","Folder source [folderSource] is not specified.");
        }
        
        if (!dataIn.folderTarget) {
            throw createError("DUP_CHECK_ERROR","Folder target [folderTarget] is not specified.");
        }
        
        if (!dataIn.fileNames) {
            throw createError("DUP_CHECK_ERROR","File names [fileNames] are not specified.");
        }
        
        if (dataIn.fileNames.length == 0) {
            return {};
        }
        
        var filterNameList = [];
        if (dataIn.fileNames.length > 0) {
            for (var i = 0; i < dataIn.fileNames.length - 1; i++) {
                filterNameList.push(["name", "is", dataIn.fileNames[i]]);
                filterNameList.push("or");
            }
            filterNameList.push(["name", "is", dataIn.fileNames[dataIn.fileNames.length - 1]]);
        }
        
        var searchfilter;
        if (filterNameList.length == 0) {
            searchfilter = ["folder", "anyof", [dataIn.folderSource, dataIn.folderTarget]];
        } else {
            searchfilter = [["folder", "anyof", [dataIn.folderSource, dataIn.folderTarget]], "and", filterNameList];
        }
        
        var cabDupSearch = search.create({
            type : "file",
            filters : searchfilter,
            columns: ["name", "folder", "internalid"]
        });
        
        var searchResults = cabDupSearch.run();
        
        var data = [];
        searchResults.each(function(result) {
            var row = {};
            result.columns.forEach(function(column) {
                row[column.name] = result.getValue(column);
            });
            data.push(row);
            return true;
        });
        
        // group by filename
        var dataMap = {};
        for (var i = 0; i < data.length; i++) {
            if (data[i].name in dataMap) {
                dataMap[data[i].name].isDuplicate = true;
                dataMap[data[i].name][data[i].folder == dataIn.folderSource ? "folderSource" : "folderTarget"] = data[i].internalid;
            } else {
                dataMap[data[i].name] = {};
                dataMap[data[i].name].isDuplicate = false;
                dataMap[data[i].name][data[i].folder == dataIn.folderSource ? "folderSource" : "folderTarget"] = data[i].internalid;
            }
        }
        
        var dataMapRename = {};
        for (var fileName in dataMap) {
            if (dataMap[fileName].isDuplicate) {
                if (!dataMapRename.dup) {
                    dataMapRename.dup = {}; 
                }
                
                // do rename
                var newFileName = fileName;
                if (dataIn.renamePrefix) {
                    var fileId = dataMap[fileName].folderSource;
                    var fileRec = file.load({id : fileId});
                    if (fileName.indexOf(".") > -1) {
                        newFileName = dataIn.renamePrefix + fileName.substring(0, fileName.lastIndexOf(".")) + "_" + new Date().getTime() + fileName.substring(fileName.lastIndexOf("."), fileName.length);
                    } else {
                        newFileName = dataIn.renamePrefix + fileName + new Date().getTime();
                    }
                    fileRec.name = newFileName;
                    fileRec.save();
                }
                dataMapRename.dup[newFileName] = dataMap[fileName];
            } else {
                if (!dataMapRename.nodup) {
                    dataMapRename.nodup = {}; 
                }
                dataMapRename.nodup[fileName] = dataMap[fileName];
            }
        }
        return dataMapRename;
    }
    
    function cabinetDuplicatesApiEndpointPOST(dataIn) {
        var result = {};
        try {
            log.debug('cabinetDuplicatesApiEndpointPOST', dataIn);
            var dataMapRename = checkDuplicates(dataIn);
            result = formatResponse(dataMapRename);
        } catch (e) {
            log.error(e.message);
            result = formatResponse(result, e);
        }
        return result;
    }
    
    return {
        "checkDuplicates" : checkDuplicates,
        "post": cabinetDuplicatesApiEndpointPOST
    };
    
});
