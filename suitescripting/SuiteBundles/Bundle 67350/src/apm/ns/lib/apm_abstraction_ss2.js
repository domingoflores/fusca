/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       05 Oct 2017     jmarimla         Initial
 *
 */

/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */

define(['N/format', 'N/file', 'N/search', 'N/runtime'],
        
function(format, file, search, runtime) {

    return {
        getFormat : function () {
            return format;
        },
        
        getFile : function () {
            return file;
        },
        
        getSearch : function () {
            return search;
        },
        
        getRuntime : function () {
            return runtime;
        }
    }
});