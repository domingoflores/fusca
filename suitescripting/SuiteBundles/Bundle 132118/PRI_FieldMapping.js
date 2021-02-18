/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 * @NScriptType UserEventScript
 */

// ------------------------------------------------------------------
// Copyright 2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
// ------------------------------------------------------------------
// ------------------------------------------------------------------
// Script: PRI: Field Mapping
// Description:
// Developer: Vanessa Sampang
// Date: 05/05/2018
// ------------------------------------------------------------------
define(
		[ 'N/log', 'N/record', 'N/search', 'N/util', './lib/PRI_FM_Common.js','./lib/PRI_FM_Constants.js'],

		function(log, record, search, util, pCommon, pConstant) {

			/**
			 * 
			 * Before Submit Event
			 * 
			 * @param {Object}
			 *            context
			 */
			function transaction_beforeSubmit(context) {
				if (context.type != context.UserEventType.CREATE
						&& context.type != context.UserEventType.EDIT) {
					return;
				}

				log.debug('Logging...', 'Initiate field mapping on ' + context.type);

				var recordType = context.newRecord.type;
				var recordObj = context.newRecord;

				var filters = [
					[ 'isinactive', 'is', 'F' ], 'AND',
					[ 'custrecord_pri_fmapping_rectype', 'is', recordType ]
				];

				//Check Context execution
				if(context.type == context.UserEventType.CREATE){
					filters.push('AND');
					filters.push(['custrecord_pri_fmapping_oncreate','is',true]);
				}
				else if(context.type == context.UserEventType.EDIT){
					filters.push('AND');
					filters.push(['custrecord_pri_fmapping_onedit','is',true]);
				}

				//Search all available field mapping available given the current record type and context
				var s = pCommon.searchResults({
					'type' : pConstant.CUSTOMRECORD_FIELDMAPPING,
					'filters' : filters,
					'columns' : [ 
						search.createColumn({'name':'custrecord_pri_fmapping_oncreate'}),	//On create
						search.createColumn({'name':'custrecord_pri_fmapping_onedit'}),		//On Edit

						search.createColumn({'name':'custrecord_pri_fmapping_rectype_source'}),	//Record Type of Source
						search.createColumn({'name':'custrecord_pri_fmapping_source'}),		//Record source of fields
						search.createColumn({'name':'custrecord_pri_fmapping_fields'})		//Fields to source
					]
				});

				log.debug('Fields to source', JSON.stringify(s));

				if(s.length <= 0) return;

				for(var i = 0; i < s.length; i++){
					try{
						var recType =  s[i].getValue({'name':'custrecord_pri_fmapping_rectype_source'});

						log.debug('transaction_beforeSubmit.JSON Fields', s[i].getValue({'name':'custrecord_pri_fmapping_source'}));

						var sourceField =  JSON.parse(s[i].getValue({'name':'custrecord_pri_fmapping_fields'}));

						var fieldValue = recordObj.getValue({'fieldId':s[i].getValue({'name':'custrecord_pri_fmapping_source'})});

						//Skip field sourcing when field is empty/null
						if(!fieldValue){
							continue;
						}

						var nsRecord = record.load({'type': recType, 'id': fieldValue});

						for(var s = 0; s < sourceField.length; s++){
							var v = nsRecord.getValue({'fieldId': sourceField[s].from});
							//log.debug('transaction_beforeSubmit.Field Value', sourceField[s].from +' | ' + v);
							var f = recordObj.getValue({'fieldId': sourceField[s].to});

							if(v){	
								if(f.indexOf('[') <= 0){
									var x = [];
									for(var e = 0; e < f.length; e++){
										x.push(f[e]);
									}
									x.push(v);
									v = x;
								}

								recordObj.setValue({'fieldId': sourceField[s].to, 'value': v});
							}
						}

					}catch(e){
						log.debug('transaction_beforeSubmit.E001', e.toString());
					}
				}
			}
			return {
				beforeSubmit : transaction_beforeSubmit
			};
		}
)