/**
 *@NApiVersion 2.x
 * @NModuleScope Public
 */

//------------------------------------------------------------------
// Copyright 2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------

define(['N/record', 'N/task', 'N/search', 'N/runtime', 'N/log'],
		
	function(record, task, search, runtime, log) {
	
		var scriptName = 'PRI_FM_Common ';
		
        /**
        *
        * Get all results
        *
        */
        function searchResults(data){
            var results = [];
            var indx = 0;
            var max = 1000;

            if(!data.type){
                return results;
            }

            var filters = (data.filters=='' && data.filters==null) ? null : data.filters;
            var columns = (data.columns=='' && data.columns==null) ? null : data.columns;

            var s = search.create({
                'type': data.type,
                'filters': filters,
                'columns': columns
            }).run();

            var searchresult = null;
            while(true){
                var searchresult = s.getRange(indx,max);
                if(searchresult == null || searchresult.length <= 0){
                    break;
                }

                indx    +=1000;
                max     +=1000;

                for(var i = 0; i < searchresult.length; i++){
                    results.push(searchresult[i]);
                }
            }
            return results;
        }

        function isempty(val){
            return (val == '' || val == null || val == undefined) ? true : false;
        }

		return {
            searchResults:searchResults,
            isempty:isempty
		}
	}	
);