/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       20 Oct 2014     TJTyrrell
 *
 */

(function() {

	var restlet = {};
	
restlet.createCall = function( dataIn ) {
		
		var returnPayload,
			record, // nlapiCreateRecord object
			value, // Values of dataIn fields
			sublistCount = 1,
			recordId, // nlapiSubmitRecord id
			recordIds = [],
			nlobj; // nlapiLoadRecord object
		
		public.addExecutionTime( 'startCreateRecord' );
		nlapiLogExecution('DEBUG','createRecord','createRecord');
		
		if (!dataIn.recordtype) {
			
			public.setStatus( 'ERROR' );
			public.addMessage( 1999, 'System Error: Missing RecordType' );
			
			return false;
			
		}
		
		if (!dataIn.records) {
			
			public.setStatus( 'ERROR' );
			public.addMessage( 1998, 'System Error: No Records to create' );
			
			return false;
			
		}
		
		for( var recordItem in dataIn.records ) {
		
			record = nlapiCreateRecord(dataIn.recordtype);
			
			public.addExecutionTime( 'finishCreateRecord' );
			
			
			
			for( var fieldname in dataIn.records[recordItem] ) {
				
				if (dataIn.records[recordItem].hasOwnProperty(fieldname)) {
					if (fieldname != 'recordtype' && fieldname != 'id') {
						value = dataIn.records[recordItem][fieldname];
						if (value != null && typeof value != 'object') {
							
							nlapiLogExecution('DEBUG','createRecord',fieldname + ':' + value);
							record.setFieldValue(fieldname, value);
							
						} else {
							
							if(typeof value == 'object') {
								
								nlapiLogExecution('DEBUG','createRecord', fieldname);
								
								
								for(var listName in value) {
									
									var listvalue = value[listName];
									for(var lv in listvalue) {
										
										var listvalue2 = listvalue[lv];
										nlapiLogExecution('DEBUG','createRecord:'+fieldname,lv + ':' + listvalue2);
										
										if(listvalue2 != null) {
											if(lv == 'selectedOptions') {
												
												var optionslist = '';
												for(var optionValues in listvalue2) {
													if(optionslist != '') {
														optionslist = optionslist + String.fromCharCode(4);
													}
													optionslist = optionslist +  listvalue2[optionValues]['optionId']+String.fromCharCode(3)+'F'+String.fromCharCode(3)+listvalue2[optionValues]['optionText']+String.fromCharCode(3)+listvalue2[optionValues]['optionValue'];
												}
												record.setLineItemValue(fieldname, 'options', sublistCount, optionslist);
												
											} else if(lv == 'addressbookaddress') {
												
												nlapiLogExecution('DEBUG','address loop START', null);
												for(var lv2prop in listvalue2) {
													var listvalue3 = listvalue2[lv2prop];
													nlapiLogExecution('DEBUG','address loop:'+lv,lv2prop + ':' + listvalue3);
													record.setLineItemValue(fieldname, lv2prop, sublistCount, listvalue3);
												}
												
											} else {
												record.setLineItemValue(fieldname, lv, sublistCount, listvalue2);
											}
										}
									}
									sublistCount++;
								}
							}
						}
					}
				}
			} // Record fields loop
			
			try {
				
				nlapiLogExecution('DEBUG','BEFORE SAVE','BEFORE SAVE');
				
				public.addExecutionTime( 'startSubmitRecord: ' + recordItem );
				recordId = nlapiSubmitRecord(record, false, true);
				recordIds.push( recordId );
				public.addExecutionTime( 'finishSubmitRecord: ' + recordItem );
				nlapiLogExecution('DEBUG','id='+recordId);
				
				// 2014-12-31 - Commented out because I am not sure why we need to waste time loading the record we just saved
//				public.addExecutionTime( 'startLoadRecord: ' + recordItem );
//				nlobj = nlapiLoadRecord(dataIn.recordtype,recordId);
//				public.addExecutionTime( 'finishLoadRecord: ' + recordItem );
				
//				public.setReturnPayload( nlobj );
//				public.setStatus( 'SUCCESS' );

			} catch(err) {
				
				nlapiLogExecution('ERROR','createRecord',err);
				public.setStatus( 'ERROR' );
				public.addMessage( 1999, err );
				
			}
			
			if( public.getStatus() != 'Error' ) {
				public.setStatus( 'SUCCESS' );
			}
			public.setReturnPayload( recordIds );
			
		} // Records loop
	};

	restlet.readCall = function( dataIn ) {

		var returnPayload;
		
		public.addExecutionTime( 'startReadRecord' );
		nlapiLogExecution('DEBUG','readRecord','readRecord');
	
		try {
			
			if(dataIn.hasOwnProperty( "customform" ) && dataIn.customform !=null && dataIn.customform !='') {
				returnPayload = nlapiLoadRecord( dataIn.recordtype, dataIn.id, {"customform":dataIn.customform} );
			} else {
				returnPayload = nlapiLoadRecord( dataIn.recordtype, dataIn.id );
			}
		
			public.addExecutionTime( 'finishReadRecord' );
			
			public.setStatus( 'SUCCESS' );
		
			nlapiLogExecution( 'DEBUG', 'readRecord', 'PARAMS: ' + dataIn.recordtype + '~' + dataIn.id );
		
			public.setReturnPayload( returnPayload );
			
		} catch(e) {
			
			var msg = '';
			
			if(e instanceof nlobjError ) {
				
				msg = e.getCode() + '\n' + e.getDetails();
				nlapiLogExecution( 'ERROR', 'system error', e.getCode() + '\n' + e.getDetails());
				
			} else {
				
				msg = e;
				nlapiLogExecution('DEBUG', 'unexpected error', e);
				
			}
			
			public.setStatus( 'ERROR' );
			public.addMessage( 1999, "System Error: " + msg );
			
		}

	};
	
	restlet.updateCall = function( dataIn ) {
		
		var record, // nlapiLoadRecord object
			linesChanged = 0,
			sublistCount = 1,
			recordId,
			recordIds = [],
			nlobj;
		
		nlapiLogExecution('DEBUG','updateRecord','updateRecord');

		if (!dataIn.recordtype) {
			
			public.setStatus( 'ERROR' );
			public.addMessage( 1999, "System Error: Update(Missing RecordType)" );
			return false;
			
		}
		
		if (!dataIn.records) {
			
			public.setStatus( 'ERROR' );
			public.addMessage( 1998, 'System Error: No Records to create' );
			
			return false;
			
		}
		
		for( var recordItem in dataIn.records ) {
		
			try {
				
				if(dataIn.recordtype == 'salesorder') {
					public.setReturnPayload( updateSalesorder( dataIn.records[recordItem]) );
				}
				
				record = nlapiLoadRecord(dataIn.recordtype,dataIn.records[recordItem].id);
				
			} catch(e) {
				
				public.setStatus( 'ERROR' );
				public.addMessage( 1009, e );
				
				return false;
				
			}
			
			if(record == null) {
				
				public.setStatus( 'ERROR' );
				public.addMessage( 1010, 'Unable to load record' );
				return false;
				
			}
			
			for (var fieldname in dataIn.records[recordItem] ) { /* root level properties */
				
				if (dataIn.records[recordItem].hasOwnProperty(fieldname)) {
					if (fieldname != 'recordtype' && fieldname != 'id') {
						var value = dataIn.records[recordItem][fieldname];
						if (typeof value != 'object') {
							if(value != null && record.getFieldValue(fieldname) != value) {
								record.setFieldValue(fieldname, value);
							}
						} else {
							nlapiLogExecution('DEBUG','fieldname: ' + fieldname,'fieldname: ' + fieldname);
							
							for(var listName in value) { /* sublist objects and properties */
								var listvalue = value[listName];
								nlapiLogExecution('DEBUG','fieldname: ' + fieldname,'listvalue: ' + listvalue);
								for(var lv in listvalue) {
									var listvalue2 = listvalue[lv];
									if(listvalue2 != null) {
										nlapiLogExecution('DEBUG','fieldname~listvalue2: ' + fieldname,lv + ' ~ ' + listvalue2);
										if(record.getLineItemValue(fieldname, lv, sublistCount) != listvalue2) {
											if(typeof listvalue2 == 'object') {
												for(var lv2 in listvalue2) {
													var listvalue3 = listvalue2[lv2];
													nlapiLogExecution('AUDIT','fieldname~listvalue3: ' + fieldname,'listvalue3: ' + listvalue3);
												}
											} else if(lv == 'selectedOptions') {
												var optionslist = '';
												for(var optionValues in listvalue2) {
													if(optionslist != '') {
														optionslist = optionslist + String.fromCharCode(4);
													}
													optionslist = optionslist +  listvalue2[optionValues]['optionId']+String.fromCharCode(3)+'F'+String.fromCharCode(3)+listvalue2[optionValues]['optionText']+String.fromCharCode(3)+listvalue2[optionValues]['optionValue'];
												}
												
												record.setLineItemValue(fieldname, 'options', sublistCount, optionslist);
											} else {
												record.setLineItemValue(fieldname, lv, sublistCount, listvalue2);
											}
										}
									}
								}
								sublistCount++;
								linesChanged ++;
							}
							
							var count = record.getLineItemCount(fieldname);
							if(count > linesChanged) {
								for(var i = String; i < count; i++) {
									record.removeLineItem(fieldname, i);
								}
							}
						}
					}
				}
			}
			
			try {
				
				nlapiLogExecution('DEBUG','BEFORE SAVE');
				recordId = nlapiSubmitRecord(record);
				recordIds.push( recordId );
				/* Commented out because I don't see why we need to waste time reloading record if we aren't even validating the data
				nlapiLogExecution('DEBUG','id='+recordId);
				nlobj = nlapiLoadRecord(dataIn.recordtype,recordId);
				
				public.setReturnPayload( nlobj );
				public.setStatus( 'SUCCESS' );*/
				
			} catch(err) {
				
				public.setStatus( 'ERROR' );
				public.addMessage( 1999, "System Error: " + err.code );
				public.addMessage( 1999, "System Error: " + err.message);
				public.addMessage( 1999, "System Error: " + err.description);
				
				nlapiLogExecution('ERROR','record update', err);
				
			}
		
		} // Loop through records to update
		
		if( public.getStatus() != 'Error' ) {
			public.setStatus( 'SUCCESS' );
		}
		
		public.setReturnPayload( recordIds );
		
	}
	
	restlet.deleteCall = function( dataIn ) {
		
		return {};
		
	}

	return restlet;

}());