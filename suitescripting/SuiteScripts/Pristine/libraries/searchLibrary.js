define(['N/search'],
	function(search) {
		/**
		 * Takes a Search.ResultSet object and grabs all the results by cycling through using getRange()
		 * @param  {Object} resultSet The results of a NetSuite saved search (Search.ResultSet object)
		 */
		var filename = "searchLibrary.js-->"

		//=====================================================================================================
		//=====================================================================================================
		function getSearchResultData(resultSet) {
			var funcname = filename + "getSearchResultData";
			log.debug({title:funcname ,	details: 'typeof='+ typeof(resultSet) +' resultSet='+ JSON.stringify(resultSet) });

			if ( resultSet == undefined ) { log.debug({	title:'resultSet == undefined'	}); }
			if ( resultSet == null)       {	log.debug({	title:'resultSet == null'		});	}

			var all = [],
				results = [],
				batchSize = 1000,
				startIndex = 0,
				endIndex = batchSize;

			do {
				try {results = resultSet.getRange({ start:startIndex ,end:endIndex }); }
				catch(e){ log.error({ title:funcname ,details:'error: ' + e.message }); }
				
				all         = all.concat(results);
				startIndex += batchSize;
				endIndex   += batchSize;
			} while (results.length == batchSize);

			log.debug({ title:funcname ,details:'All Results Length=' + all.length });	

			return all;
		}

		
		//=====================================================================================================
		// returns results as array of simple objects without methods that can be stringify'd and then
		// later parsed back into an array of objects
		//=====================================================================================================
		function getSearchResultDataAsArrayOfSimpleObjects(resultSet) {
			var funcname = filename + "getSearchResultDataAsArrayOfSimpleObjects";

			if ( resultSet == undefined ) { log.debug({	title:'resultSet == undefined'	}); }
			if ( resultSet == null)       {	log.debug({	title:'resultSet == null'		});	}

			var all = [],
				results = [],
				batchSize = 1000,
				startIndex = 0,
				endIndex = batchSize;

			do {
				try {results = resultSet.getRange({ start:startIndex ,end:endIndex }); }
				catch(e){ log.error({ title:funcname ,details:'error: ' + e.message }); }
				
				for (var i = 0; i < results.length; i++) {
					var result = results[i];
					var objResult = {};
					
					//objResult["value"] = "";
					for (var j = 0; j < resultSet.columns.length; j++) {
						log.debug({ title:funcname ,details:JSON.stringify(resultSet.columns[j]) });	
						var name = resultSet.columns[j]["name"]
						var objResultData = {};
						try { objResultData["value"] = result.getValue(name); } catch(ev) {}
						try { 
							var text = result.getText(name);
							if (text) { objResultData["text"]  = text; }
							} catch(et) {}
						objResult[name] = objResultData; 						
					}
					
					all.push(objResult);
				}

				startIndex += batchSize;
				endIndex   += batchSize;
			} while (results.length == batchSize);

			log.debug({ title:funcname ,details:'All Results Length=' + all.length });	

			return all;
		}
		
		return {
			getSearchResultData: getSearchResultData
			,getSearchResultDataAsArrayOfSimpleObjects: getSearchResultDataAsArrayOfSimpleObjects
		};
	});