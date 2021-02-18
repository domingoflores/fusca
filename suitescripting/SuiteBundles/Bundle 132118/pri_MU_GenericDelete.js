//-----------------------------------------------------------------------------------------------------------
//Copyright 2016, All rights reserved, Prolecto Resources, Inc.
//
//No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/*
 *	this is a generic delete which is capable of recursively deleting child records as well 
 */


/**
* @NApiVersion 2.x
* @NScriptType MassUpdateScript
*/

define(['N/record', 'N/search', 'N/runtime'],
	function(record, search, runtime) {

		var scriptName = "pri_MU_GenericDelete.";
		
		var _transactionList = [];
		
		
		function each(params) {
	
			var funcName = scriptName + "each " + params.type + " | " + params.id;
			
			try {


				// check the "recursive" script parameter to determine whether to perform a more advanced process

				var deleteRecursively = runtime.getCurrentScript().getParameter({name:"custscript_pri_delete_recursively"});

				log.debug(funcName, "MU called to delete this record.  Recursive=" + deleteRecursively);

				if (deleteRecursively) {					
					if (isTransaction(params.id))
						deleteTransaction(params.type,params.id);
					else
						if (isEntity(params.id))
							deleteEntity(params.type, params.id);
						else {
							record.delete({type: params.type, id: params.id});
							log.audit(funcName, "deleted.");	
						}
					
				} else {
					record.delete({type: params.type, id: params.id});
					log.audit(funcName, "deleted.");
				}
				
				
			} catch (e) {
	    		log.error(funcName, "Unable to delete: " + e.toString());				
			}
		}

		function deleteEntity(entityType, entityId) {
			// check whether there are transactions linked to this entity

			var funcName = scriptName + "deleteEntity " + entityType | " " + entityId;

			log.debug(funcName, "entering");

			try {
				var s = search.create({
			        type: "transaction",
			        'filters': [['entity',search.Operator.ANYOF,entityId]]
			    }).run();
				
			    s.each(function (result) {
			    	deleteTransaction(result.recordType, result.id);
			    	return true;
			    })

			    record.delete({type: entityType, id: entityId});
			    log.audit(funcName, "deleted");
				
			} catch (e) {
	    		log.error(funcName, "Unable to delete: " + e.toString());				
			}
		    
		}

		
		function deleteTransaction(tranType, tranId) {
			
			// check whether there are any transactions which were created from this one

			var funcName = scriptName + "deleteTransaction " + tranType + " | " + tranId;
		
			if (_transactionList.indexOf(tranId) >= 0)
				return;
			
			log.debug(funcName, "entering");
			
			_transactionList.push(tranId);
			
			try {
				var s = search.create({
			        type: "transaction",
			        'filters': [
			                    ['createdfrom',search.Operator.ANYOF,tranId]
			                    ,'OR',['applyingtransaction',search.Operator.ANYOF,tranId]
			                    ]
			    }).run();
				
			    s.each(function (result) {
			    	deleteTransaction(result.recordType, result.id);
			    	return true;
			    })
	
			    // if this is a customer deposit, delete all deposit applications underneath it
			    
			    if (tranType == record.Type.CUSTOMER_DEPOSIT) {
					var s = search.create({
				        type: "transaction",
				        'filters': [
				                    ['deposittransaction',search.Operator.ANYOF,tranId]
				                    ]
				    }).run();
					
				    s.each(function (result) {
				    	deleteTransaction(result.recordType, result.id);
				    	return true;
				    })			    	
			    }
			    
			    log.debug(funcName, "Attempting to delete " + tranType + " " + tranId);

			    try {
				    record.delete({type: tranType, id: tranId});			    	
				    log.audit(funcName, "deleted");
			    } catch (e2) {
				    if (tranType == record.Type.CUSTOMER_REFUND) {
				    	// submit it to be voided?
				    	var CD = record.load({type: tranType, id: tranId});
				    	CD.setValue("voiced", true);
				    	CD.save();
				    } else
				    	log.error(funcName, "Unable to delete: " + e2.toString());			    	
			    }
				
			} catch (e) {
	    		log.error(funcName, "Unable to delete: " + e.toString());				
			}
		}

		function isEntity(id) {
			var sr = search.create({type: "ENTITY", filters: ["internalid",search.Operator.IS,id]}).run().getRange(0,1);
			return (sr.length > 0);
		}

		function isTransaction(id) {
			try {
				var objTranCol = search.lookupFields({
					type : 'transaction',
					id : id,
					columns : ['type' ]
				});
				
				// log.debug("isTransaction",JSON.stringify(objTranCol));
				
				if (objTranCol['type'])
					return true;
				else
					return false;
			} catch (e) {
				return false;
			}

		}
		
		return {
			each: each
		};
	}



);
