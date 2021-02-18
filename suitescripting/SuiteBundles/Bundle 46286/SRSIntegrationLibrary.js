/*******************************************************************************
 *******************************************************************************
 **		IntegrationLibrary.js / Nov 15, 2012 / Updated July 30, 2014
 **
 **		@author sbuttgereit
 **		@version 1.1 
 *				 Updated and added Exchange Record, Exchange Hash Record, and
 **				 LOT Certificate to the _updateIntegrationFlag (smccurry)
 **		@requires
 **		@fileOverview  Contains functions that facilitate the integration layer.
 **
 **		Copyright (c) 2012 SRS | Shareholder Representative Services LLC
 **		Confidential and Proprietary
 ** 
 *******************************************************************************
 ******************************************************************************/

////////////////////////////////////////////////////////////////////////////////
//
//	@namespace Integration support logic.
//
////////////////////////////////////////////////////////////////////////////////

if (!this.SRS) {
	this.SRS = {};
}

SRS.IntegrationLibrary = function(){

	/////////////////////////////////////////
	//
	//	Private Business Logic Members
	//
	/////////////////////////////////////////
	function _updateIntegrationFlag(type) {
		var dateStamp = _getDateBasedIntegrationSeq();

		//If a record is being deleted, we may implement a 'delete' queue for integration, but for now ignore.
		if(nlapiGetContext().getExecutionContext() != 'webservices' && (nlapiGetContext().getUser() != 239331 || nlapiGetContext().getEnvironment() == 'SANDBOX')) {
			if(type != 'delete') {
				nlapiLogExecution('DEBUG',"SRS.IntegrationLibrary._updateIntegrationFlag","Evaluating flags/integration_seq for. Context =  "+nlapiGetContext().getExecutionContext()+" by = "+nlapiGetContext().getName()+"  for record type = "+nlapiGetRecordType()+" of ID "+nlapiGetRecordId());
				try {
						//Old style integration flags.  This big IF statement should go away in favor of the integration sequence.
						if(nlapiGetNewRecord().getField('custentity_srs_mcp_export_flag')) {
							nlapiGetNewRecord().setFieldValue('custentity_srs_mcp_export_flag','T');
						} else if(nlapiGetNewRecord().getField('custrecord_srs_mcp_export_flag')) {
							nlapiGetNewRecord().setFieldValue('custrecord_srs_mcp_export_flag','T');
						} else if(nlapiGetNewRecord().getField('custbody_srs_mcp_export_flag')) {
							nlapiGetNewRecord().setFieldValue('custbody_srs_mcp_export_flag','T');
						} else if(nlapiGetNewRecord().getField('custevent_srs_mcp_export_flag')) {
							nlapiGetNewRecord().setFieldValue('custevent_srs_mcp_export_flag','T');
						} else if(nlapiGetNewRecord().getField('custrecord_srs_mcp_export_flag_etxn')) {
							nlapiGetNewRecord().setFieldValue('custrecord_srs_mcp_export_flag_etxn','T');
                        } else if(nlapiGetNewRecord().getField('custrecord_srs_mcp_export_flag_dar')) {
							nlapiGetNewRecord().setFieldValue('custrecord_srs_mcp_export_flag_dar','T');
                        } else if(nlapiGetNewRecord().getField('custrecord_srs_mcp_export_flag_dacppae')) {
							nlapiGetNewRecord().setFieldValue('custrecord_srs_mcp_export_flag_dacppae','T');
                        } else if(nlapiGetNewRecord().getField('custrecord_srs_mcp_export_flag_sda')) {
							nlapiGetNewRecord().setFieldValue('custrecord_srs_mcp_export_flag_sda','T');
                        } else if(nlapiGetNewRecord().getField('custrecord_srs_mcp_export_flag_esn')) {
							nlapiGetNewRecord().setFieldValue('custrecord_srs_mcp_export_flag_esn','T');
                        } else if(nlapiGetNewRecord().getField('custrecord_srs_mcp_export_flag_prorata')) {
							nlapiGetNewRecord().setFieldValue('custrecord_srs_mcp_export_flag_prorata','T');
                        } else if(nlapiGetNewRecord().getField('custrecord_srs_mcp_export_flag_psd')) {
							nlapiGetNewRecord().setFieldValue('custrecord_srs_mcp_export_flag_psd','T');
						} else if(nlapiGetNewRecord().getField('custrecord_srs_mcp_export_flag_pej')) {
							nlapiGetNewRecord().setFieldValue('custrecord_srs_mcp_export_flag_pej','T');
                        } else if(nlapiGetNewRecord().getField('custrecord_srs_mcp_export_flag_pe')) {
							nlapiGetNewRecord().setFieldValue('custrecord_srs_mcp_export_flag_pe','T');
						}else {
							nlapiLogExecution('AUDIT',"SRS.IntegrationLibrary._updateIntegrationFlag","Trying to process integration flags, we couldn't find a record type so we can't set the flags.");
							nlapiLogExecution('DEBUG',"SRS.IntegrationLibrary._updateIntegrationFlag","Did't find any flags, trying int seq. for Context =  "+nlapiGetContext().getExecutionContext()+" by = "+nlapiGetContext().getName()+"  for record type = "+nlapiGetRecordType()+" of ID "+nlapiGetRecordId());

						}

						//New style integration sequences.  This big IF statement should go away in favor of a better, cleaner approach to manage the field, but for now it will work.
						if(nlapiGetNewRecord().getField('custentity_srs_mcp_int_seq')) {
							nlapiGetNewRecord().setFieldValue('custentity_srs_mcp_int_seq',dateStamp);
						} else if(nlapiGetNewRecord().getField('custrecord_srs_mcp_int_seq')) {
							nlapiGetNewRecord().setFieldValue('custrecord_srs_mcp_int_seq',dateStamp);
						} else if(nlapiGetNewRecord().getField('custbody_srs_mcp_int_seq')) {
							nlapiGetNewRecord().setFieldValue('custbody_srs_mcp_int_seq',dateStamp);
						} else if(nlapiGetNewRecord().getField('custevent_srs_mcp_int_seq')) {
							nlapiGetNewRecord().setFieldValue('custevent_srs_mcp_int_seq',dateStamp);
						} else if(nlapiGetNewRecord().getField('custrecord_srs_mcp_int_seq_etxn')) {
							nlapiGetNewRecord().setFieldValue('custrecord_srs_mcp_int_seq_etxn',dateStamp);
                        } else if(nlapiGetNewRecord().getField('custrecord_srs_mcp_int_seq_dar')) {
							nlapiGetNewRecord().setFieldValue('custrecord_srs_mcp_int_seq_dar',dateStamp);
                        } else if(nlapiGetNewRecord().getField('custrecord_srs_mcp_int_seq_dacppae')) {
							nlapiGetNewRecord().setFieldValue('custrecord_srs_mcp_int_seq_dacppae',dateStamp);
                        } else if(nlapiGetNewRecord().getField('custrecord_srs_mcp_int_seq_sda')) {
							nlapiGetNewRecord().setFieldValue('custrecord_srs_mcp_int_seq_sda',dateStamp);
                        } else if(nlapiGetNewRecord().getField('custrecord_srs_mcp_int_seq_esn')) {
							nlapiGetNewRecord().setFieldValue('custrecord_srs_mcp_int_seq_esn',dateStamp);
                        } else if(nlapiGetNewRecord().getField('custrecord_srs_mcp_int_seq_prorata')) {
							nlapiGetNewRecord().setFieldValue('custrecord_srs_mcp_int_seq_prorata',dateStamp);
                        } else if(nlapiGetNewRecord().getField('custrecord_srs_mcp_int_seq_psd')) {
							nlapiGetNewRecord().setFieldValue('custrecord_srs_mcp_int_seq_psd',dateStamp);
						} else if(nlapiGetNewRecord().getField('custrecord_srs_mcp_int_seq_pej')) {
							nlapiGetNewRecord().setFieldValue('custrecord_srs_mcp_int_seq_pej',dateStamp);
                        } else if(nlapiGetNewRecord().getField('custrecord_srs_mcp_int_seq_pe')) {
							nlapiGetNewRecord().setFieldValue('custrecord_srs_mcp_int_seq_pe',dateStamp);
						} else if(nlapiGetNewRecord().getField('custrecord_srs_mcp_int_seq_sie')) {
							nlapiGetNewRecord().setFieldValue('custrecord_srs_mcp_int_seq_sie',dateStamp);
						} else if(nlapiGetNewRecord().getField('custrecord_acq_loth_zzz_zzz_intseq')) {
							nlapiGetNewRecord().setFieldValue('custrecord_acq_loth_zzz_zzz_intseq',dateStamp);
						} else if(nlapiGetNewRecord().getField('custrecord_acq_lotce_zzz_zzz_intseq')) {
							nlapiGetNewRecord().setFieldValue('custrecord_acq_lotce_zzz_zzz_intseq',dateStamp);
						} else if(nlapiGetNewRecord().getField('custrecord_acq_hash_intseq')) {
							nlapiGetNewRecord().setFieldValue('custrecord_acq_hash_intseq',dateStamp);	
						} else if(nlapiGetNewRecord().getField('custrecord_acq_lotce_zzz_zzz_intseq')) {
							nlapiGetNewRecord().setFieldValue('custrecord_acq_lotce_zzz_zzz_intseq',dateStamp);		
						} else if(nlapiGetNewRecord().getField('custrecord_acq_loth_zzz_zzz_intseq')) {
							nlapiGetNewRecord().setFieldValue('custrecord_acq_loth_zzz_zzz_intseq',dateStamp);	
						} else {
							nlapiLogExecution('AUDIT',"SRS.IntegrationLibrary._updateIntegrationFlag","Trying to process integration sequences, we couldn't find a record type so we can't set the sequence.");
							nlapiLogExecution('DEBUG',"SRS.IntegrationLibrary._updateIntegrationFlag","Did't find any any integration seqs, trying int seq. for Context =  "+nlapiGetContext().getExecutionContext()+" by = "+nlapiGetContext().getName()+"  for record type = "+nlapiGetRecordType()+" of ID "+nlapiGetRecordId());

						}

						//Adding to the fun, now we handle deal propogation from the multitude of child records.  Since each child will reference the deal with a different field id, we need to handle each on individually. 

						var cascadeToDealId;  //holds a deal id that is the target of an update.
						if(nlapiGetNewRecord().getRecordType() == 'customrecord_deal_points_study') {
							cascadeToDealId = nlapiGetNewRecord().getFieldValue('custrecord_deal');
							nlapiLogExecution('DEBUG',"SRS.IntegrationLibrary._updateIntegrationFlag","This is a Deal Points Study. (cust record id: "+cascadeToDealId+"). for Context =  "+nlapiGetContext().getExecutionContext()+" by = "+nlapiGetContext().getName()+"  for record type = "+nlapiGetRecordType()+" of ID "+nlapiGetRecordId());
						} else if(nlapiGetNewRecord().getRecordType() == 'customrecord16') {
							cascadeToDealId = nlapiGetNewRecord().getFieldValue('custrecord59');
							nlapiLogExecution('DEBUG',"SRS.IntegrationLibrary._updateIntegrationFlag","This is a customrecord16. (cust record id: "+cascadeToDealId+"). for Context =  "+nlapiGetContext().getExecutionContext()+" by = "+nlapiGetContext().getName()+"  for record type = "+nlapiGetRecordType()+" of ID "+nlapiGetRecordId());
						}

						//Now see if we have something to do, and if so update the appropriate deal.
						if(cascadeToDealId !== null && cascadeToDealId !== undefined) {
							try {
								nlapiLogExecution('DEBUG',"SRS.IntegrationLibrary._updateIntegrationFlag","Trying to update the customer record . (cust record id: "+cascadeToDealId+"). for Context =  "+nlapiGetContext().getExecutionContext()+" by = "+nlapiGetContext().getName()+"  for record type = "+nlapiGetRecordType()+" of ID "+nlapiGetRecordId());
								nlapiSubmitField('customer', cascadeToDealId , ['custentity_srs_mcp_export_flag','custentity_srs_mcp_int_seq'], ['T',dateStamp]);
							} catch (e) {
								nlapiLogExecution('ERROR',"SRS.IntegrationLibrary._updateIntegrationFlag","Failed trying to update the customer record. (cust record id: "+cascadeToDealId+"). for Context =  "+nlapiGetContext().getExecutionContext()+" by = "+nlapiGetContext().getName()+"  for record type = "+nlapiGetRecordType()+" of ID "+nlapiGetRecordId());
								SRS.Utility.processError('ERROR','SRS.IntegrationLibrary._updateIntegrationFlag',e+" ");
							}
							
						}

				} catch (e) {
					SRS.Utility.processError('ERROR','SRS.IntegrationLibrary._updateIntegrationFlag',e);
					nlapiLogExecution('ERROR',"SRS.IntegrationLibrary._updateIntegrationFlag","Error setting export flag. Will not integrate.");
				}
			} else {
				nlapiLogExecution('DEBUG',"SRS.IntegrationLibrary._updateIntegrationFlag","Delete record. No Action");
			}
		} else {
			nlapiLogExecution('DEBUG',"SRS.IntegrationLibrary._updateIntegrationFlag","Web Services Update.  No Action.");
		}
	}

	function _scheduledRecordMerges(recordType) {
		//Check that the script is called for a supported record type.
		if(recordType === null || recordType === undefined) {
			nlapiLogExecution('ERROR','SRS.IntegrationLibrary._scheduledRecordMerges','The function parameter was not defined prior to being called.  This is not a legal call to this function.');
			return null;
		}

		recordType = recordType.toLowerCase();
		if(recordType != 'contact' && recordType != 'customer' && recordType != 'vendor') {
			nlapiLogExecution('ERROR','SRS.IntegrationLibrary._scheduledRecordMerges','The function parameter must be either contact, customer, or vendor.  '+recordType+' is not a valid record type.');
			return null;
		}

		//Set up the System Integration Event search.  We want the highest custrecord_srs_sys_integration_event_sid value, because we'll ask for anything higher since we don't know about it.
		var sieColumns = [];
		var sieFilters = [];
		var sieResult = null;
		var filterType = null;

		switch(recordType) {
			case 'contact':
				filterType = '3';
				break;
			case 'customer':
				filterType = '1,2,4';
				break;
			case 'vendor':
				filterType = '1';
				break;
			default:
				filterType = '@NONE@';
				nlapiLogExecution('ERROR','SRS.IntegrationLibrary._scheduledRecordMerges','The function parameter must be either contact, customer, or vendor.  '+recordType+' is not a valid record type. Somehow we got to the switch statement.');
		}

		sieColumns[0] = new nlobjSearchColumn('custrecord_srs_sys_integration_event_sid',null,'max');

		sieFilters[0] = new nlobjSearchFilter('custrecord_srs_sys_integration_type',null,'anyOf',filterType);

		sieResult = nlapiSearchRecord('customrecord_srs_sys_integration_event',null,sieFilters,sieColumns);

		var maxIntegrationEvent = 0;
		if(sieResult !== null) {
			maxIntegrationEvent = sieResult[0].getValue('custrecord_srs_sys_integration_event_sid',null,'max');
		}

		var targDate = new Date();
		targDate.setTime(maxIntegrationEvent);

		//Set up the search system note search for the appropriate record type.
		var sysColumns = [];
		var sysFilters = [];
		var sysResult = null;

		sysColumns[0] = new nlobjSearchColumn('type','systemnotes');
		sysColumns[1] = new nlobjSearchColumn('newvalue','systemnotes');
		sysColumns[2] = new nlobjSearchColumn('date','systemnotes');
		if(recordType === 'customer') {
			sysColumns[3] = new nlobjSearchColumn('category');
		}

		sysFilters[0] = new nlobjSearchFilter('newvalue','systemnotes','startswith','Merged');
		sysFilters[1] = new nlobjSearchFilter('date','systemnotes','after',nlapiDateToString(targDate));

		sysResult = nlapiSearchRecord(recordType,null,sysFilters,sysColumns);

		if(sysResult !== null) {
			for(var i = 0; i < sysResult.length; i++) {
				//Lets get the date from the record.
				var currDate = nlapiStringToDate(sysResult[i].getValue('date','systemnotes'));
				//Now we need to get new Systems Integration Event instance, set the values and save it.
				var currSIERec = nlapiCreateRecord('customrecord_srs_sys_integration_event');
				var recordMergeXML = '::|SURVIVINGRECID|:|'+sysResult[i].getId()+'|:#'; //I would have used XML, but NetSuite seems to have troubles with it and that's not counting Web Services... so my own custom standard. 
				var integrationEventType = 0;
				switch(recordType) {
					case 'contact':
						recordMergeXML = recordMergeXML+'::|RECORDTYPE|:|CONTACT|:#';
						integrationEventType = '3';
						break;
					case 'customer':
						var currCat = sysResult[i].getValue('category');
						if(currCat == '1') {
							recordMergeXML = recordMergeXML+'::|RECORDTYPE|:|DEAL|:#';
							integrationEventType = '4';
						} else if(currCat == '2') {
							recordMergeXML = recordMergeXML+'::|RECORDTYPE|:|SHAREHOLDER|:#';
							integrationEventType = '2';
						} else {
							recordMergeXML = recordMergeXML+'::|RECORDTYPE|:|FIRM|:#';
							integrationEventType = '1';
						}
						break;
					case 'vendor':
						recordMergeXML = recordMergeXML+'::|RECORDTYPE|:|FIRM|:#';
						integrationEventType = '1';
						break;
					default:
						recordMergeXML = recordMergeXML+'::|RECORDTYPE|:|ERROR|:#';
						integrationEventType = '0';
						nlapiLogExecution('ERROR','SRS.IntegrationLibrary._scheduledRecordMerges','The function parameter must be either contact, customer, or vendor.  '+recordType+' is not a valid record type. Somehow we got to the switch statement.');
				}
				recordMergeXML = recordMergeXML+'::|NETSUITE_MERGE_TEXT|:|'+sysResult[i].getValue('newvalue','systemnotes')+'|:#';
				nlapiLogExecution('DEBUG','SRS.IntegrationLibrary._scheduledRecordMerges','The recordMergeXML value is: '+recordMergeXML);
				currSIERec.setFieldValue('custrecord_srs_sys_integration_payload',recordMergeXML);
				currSIERec.setFieldValue('custrecord_srs_sys_integration_type',integrationEventType);
				var tempTime = nlapiStringToDate(sysResult[i].getValue('date','systemnotes'));
				currSIERec.setFieldValue('custrecord_srs_sys_integration_event_sid',tempTime.getTime());
				//Nasty hack to get the integration sequence set.  Apparently NetSuite doesn't know it's head from it's ass when it comes to consistently firing user event scripts in the context of scheduled scripts. <sigh>
				var dateStamp = _getDateBasedIntegrationSeq();
				currSIERec.setFieldValue('custrecord_srs_mcp_int_seq_sie',dateStamp);
				currSIERec.setFieldValue('custrecord_srs_sys_integration_message','Created by scheduled script run for record type: '+recordType);

				//submit our newly created systems integration event record.
				nlapiSubmitRecord(currSIERec);
			}
		}
	}

	function _getDateBasedIntegrationSeq() {
		var pad2 = '00'; //Padding for the month.
		var pad4 = '0000'; //Padding for the year.
		var currDate = new Date();
		return (pad4+currDate.getFullYear().toString()).slice(-pad4.length)+(pad2+(currDate.getMonth()+1).toString()).slice(-pad2.length)+(pad2+currDate.getDate().toString()).slice(-pad2.length)+(pad2+currDate.getHours().toString()).slice(-pad2.length)+(pad2+currDate.getMinutes().toString()).slice(-pad2.length)+(pad2+currDate.getSeconds().toString()).slice(-pad2.length);
	}
	return {
		/////////////////////////////////////////
		//
		//	Public Members
		//
		/////////////////////////////////////////
		updateIntegrationFlag: _updateIntegrationFlag,
		scheduledRecordMerges: _scheduledRecordMerges,
		getDateBasedIntegrationSeq: _getDateBasedIntegrationSeq
	};
}();