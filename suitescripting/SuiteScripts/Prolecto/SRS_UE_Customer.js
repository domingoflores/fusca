//-----------------------------------------------------------------------------------------------------------
// Copyright 2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
* @NApiVersion 2.x
* @NScriptType UserEventScript
* @NModuleScope Public
*/

/*
 * code related to the CUSTOMER record
 * 
 */

define(['N/record', 'N/search', 'N/runtime', 'N/error', 'N/format', 'N/url', 'N/ui/serverWidget', './Shared/SRS_Constants', './Shared/SRS_Functions', '/.bundle/132118/PRI_ServerLibrary', '/.bundle/132118/PRI_AS_Engine', '/.bundle/132118/PRI_ShowMessageInUI', 'N/email'],
				
		function(record, search, runtime, error, format, url, serverWidget, srsConstants, srsFunctions, priLibrary, appSettings, priMessage, email) {
	
			var scriptName = "SRS_UE_Customer.";
			
    		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

			function beforeLoad(context) {

		    	var funcName = scriptName + "beforeLoad " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);
		    
		    	// once we establish a relationship, don't allow user to change the key information

                var REC = context.newRecord;

				var otEmailAddress = appSettings.readAppSetting(srsConstants.LUNA_APP_NAME, "OT Email Address"); 
				
    			if (context.type == context.UserEventType.VIEW) {
    				
    				if ( (runtime.executionContext == 'USERINTERFACE' && REC.getValue("category") == srsConstants.CUSTOMER_CATEGORY.DEAL ) ) { // ATP-547
    				    var linkURL = "/app/common/custom/custrecordentry.nl?rectype=674&record.custrecord_de_deal=" + context.newRecord.id;
    			        var setWindow = "window.location = '" + linkURL + "','Deal Escrow','';";
    	 				context.form.addButton({ id:'custpage_new_deal_escrow' ,label:'New Deal Escrow' ,functionName:setWindow });
					}
					
					
                    /******* <ATP-503> ********/  

                    log.debug('cat='+ REC.getValue("category") +' * '+context.type+' '+runtime.executionContext+'***USER KYC Vars*** for '+runtime.getCurrentUser().name , 'usr dept='+runtime.getCurrentUser().department + ' req dept='+srsConstants.DEPT.LEGAL_AND_CORPORATE_DEVELOPMENT+' custentity_kyc_approved_by='+REC.getValue("custentity_kyc_approved_by")+' KYC allowed='+srsFunctions.userCanApproveKYC() );

                    if ( (runtime.executionContext == 'USERINTERFACE' && REC.getValue("category") == srsConstants.CUSTOMER_CATEGORY.DEAL ) ){   // only run for form "SRS Deal Form (copy 082213" which is always on the DEAL category
                        if (REC.getValue("category") == srsConstants.CUSTOMER_CATEGORY.DEAL && runtime.getCurrentUser().department == srsConstants.DEPT.LEGAL_AND_CORPORATE_DEVELOPMENT && !REC.getValue("custentity_kyc_approved_by")  && srsFunctions.userCanApproveKYC()) {
                            var utilURL = url.resolveScript({
                                scriptId:			srsConstants.SCRIPT_NAMES.UTILITIES_SUITELET,
                                deploymentId:		srsConstants.SCRIPT_DEPLOYMENTS.UTILITIES_SUITELET,
                                returnExternalUrl: 	false,
                                params:{"action": "approveKYC", "custId": REC.id}});

                            var scr = 'if (confirm("Are you sure you want to indicate \'KYC Approval\' for this deal?")) window.location.href="' + utilURL + '"; console.log';
                            
                            var objForm = context.form.getSublist({id : 'custom85'}) || context.form;
                            if (objForm)
                                objForm.addButton({
                                    id : "custpage_kyc_approval",
                                    label : "KYC Approved",
                                    functionName: scr
                                });    				                    	
                        }



                        if (REC.getValue("category") == srsConstants.CUSTOMER_CATEGORY.DEAL && runtime.getCurrentUser().department == srsConstants.DEPT.LEGAL_AND_CORPORATE_DEVELOPMENT && REC.getValue("custentity_kyc_approved_by")  && srsFunctions.userCanApproveKYC()) {

                            var utilURL = url.resolveScript({
                                scriptId:			srsConstants.SCRIPT_NAMES.UTILITIES_SUITELET,
                                deploymentId:		srsConstants.SCRIPT_DEPLOYMENTS.UTILITIES_SUITELET,
                                returnExternalUrl: 	false,
                                params:{"action": "UNapproveKYC", "custId": REC.id}});

                            var scr = 'if (confirm("Are you sure you want to remove \'KYC Approval\' for this deal?")) window.location.href="' + utilURL + '"; console.log';
                            
                            var objForm = context.form.getSublist({id : 'custom85'}) || context.form;
                            if (objForm)
                                objForm.addButton({
                                    id : "custpage_kyc_approval",
                                    label : "Undo KYC Approval",
                                    functionName: scr
                                });    				                    	
                        }
                    }

					/******* </ATP-503> *******/
					

					if (runtime.getCurrentUser().role != srsConstants.USER_ROLE.SRS_LEGAL_DOCKET_ENTERER && REC.getValue("custentity_enterprisedps") && !srsFunctions.customerEmailSent(REC.id, otEmailAddress)) {
	                    var utilURL = url.resolveScript({
	                           scriptId:			srsConstants.SCRIPT_NAMES.UTILITIES_SUITELET,
	                           deploymentId:		srsConstants.SCRIPT_DEPLOYMENTS.UTILITIES_SUITELET,
	                           returnExternalUrl: 	false,
	                           params:{"action": "sendForExternalEntry", "custId": REC.id}});

	                    
	                    var scr = "if (confirm('Are you sure you want to Send Record for DPS Entry?')) window.location.href='" + utilURL + "'; console.log";
	                    
	                    context.form.addButton({
	                        id : "custpage_send_dps_entry",
	                        label : "Send for DPS Entry",
	                        functionName: scr
	                    });    				                    	
					}

					if ((runtime.getCurrentUser().role == srsConstants.USER_ROLE.SRS_LEGAL_DOCKET_ENTERER_RRD || srsFunctions.userIsAdmin()) 
							&& REC.getValue("custentity_enterprisedps") 
							&& !REC.getValue("custentity_deal_point_study_completed_by")
							&& srsFunctions.customerEmailSent(REC.id, otEmailAddress)) {
	                    var utilURL = url.resolveScript({
	                           scriptId:			srsConstants.SCRIPT_NAMES.UTILITIES_SUITELET,
	                           deploymentId:		srsConstants.SCRIPT_DEPLOYMENTS.UTILITIES_SUITELET,
	                           returnExternalUrl: 	false,
	                           params:{"action": "markOTDPSComplete", "custId": REC.id}});

	                    
	                    var scr = "if (confirm('Are you sure you want to mark this Deal Point Study as complete?')) window.location.href='" + utilURL + "'; console.log";
	                    
	                    context.form.addButton({
	                        id : "custpage_otdps_complete",
	                        label : "OT - Deal Point Study Complete",
	                        functionName: scr
	                    });    				                    	
					}
    				
					if ((runtime.getCurrentUser().role == srsConstants.USER_ROLE.SRS_LEGAL|| srsFunctions.userIsAdmin()) 
							&& REC.getValue("custentity_enterprisedps") 
							&& REC.getValue("custentity_deal_point_study_completed_by")
							&& !REC.getValue("custentity_dps_reviewed_by")) {
	                    var utilURL = url.resolveScript({
	                           scriptId:			srsConstants.SCRIPT_NAMES.UTILITIES_SUITELET,
	                           deploymentId:		srsConstants.SCRIPT_DEPLOYMENTS.UTILITIES_SUITELET,
	                           returnExternalUrl: 	false,
	                           params:{"action": "markDPSComplete", "custId": REC.id}});

	                    
	                    var scr = "if (confirm('Are you sure you want to mark this Deal Point Study as complete?')) window.location.href='" + utilURL + "'; console.log";
	                    
	                    context.form.addButton({
	                        id : "custpage_dps_complete",
	                        label : "DPS Review Complete",
	                        functionName: scr
	                    });    				                    	
					}
    				

					
				}


					
				/******* <ATP-768> *******/
                log.debug( context.type+' '+runtime.executionContext+'***USER KYC Vars*** for '+runtime.getCurrentUser().name , 'usr dept='+runtime.getCurrentUser().department + ' req dept='+srsConstants.DEPT.LEGAL_AND_CORPORATE_DEVELOPMENT+' custentity_kyc_approved_by='+REC.getValue("custentity_kyc_approved_by")+' KYC allowed='+srsFunctions.userCanApproveKYC() );
                if ( (runtime.executionContext == 'USERINTERFACE' && REC.getValue("category") == srsConstants.CUSTOMER_CATEGORY.DEAL ) ){   // only run for form "SRS Deal Form (copy 082213" which is always on the DEAL category
                    try {
                        if (context.type == context.UserEventType.EDIT && runtime.executionContext == 'USERINTERFACE') {
                            var form = context.form;
                            var fld = form.getField({
                                id: 'custentity_kyc_parties'
                            });
                            
                            if (REC.getValue("category") == srsConstants.CUSTOMER_CATEGORY.DEAL && runtime.getCurrentUser().department == srsConstants.DEPT.LEGAL_AND_CORPORATE_DEVELOPMENT && srsFunctions.userCanApproveKYC()) {
                                fld.updateDisplayType({displayType: serverWidget.FieldDisplayType.NORMAL});
                            } else {
                                fld.updateDisplayType({
                                    displayType : serverWidget.FieldDisplayType.INLINE
                                });						
                            }
                        }
                    } catch(e){
                        log.error('ATP-768', e.message);
                    }
                }
				/******* </ATP-768> *******/
    			    			
			}


    		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

			function afterSubmit(context) {

		    	var funcName = scriptName + "afterSubmit " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);
		    
				var REC = context.newRecord;
				var oldREC = context.oldRecord;

    			if (context.type != context.UserEventType.DELETE) 
    			{
    				//ATP-1132
    				//On Deal, monitor fields "COUNSEL APPROVED TO PAY - COMPLIANCE" (Deal920) and 
    				// PAYING BANK COMPANY (Deal930) and if changed, queue related DER records for re-evaluation
    				if (priLibrary.fieldChanged(context, "custentity_acq_finaldealapproval")
    					||  priLibrary.fieldChanged(context, "custentity_acq_deal_financial_bank_compa"))
    				{
    					log.audit("writing DER reocrds to queue");
    					srsFunctions.writeDERRecordsToRSMQueue([["custrecord_pay_import_deal",search.Operator.ANYOF,[REC.id]]])
    				}
	    			
    				//montitor Deal's "PHYSICAL DOCUMENTS REQUIRED FOR PAYMENT" (DEAL940) and if it changed
    				//re-evaluate all exchange records related to this Deal
    				if (priLibrary.fieldChanged(context, "custentity_acq_deal_lot_requirements"))
	    			{
    					srsFunctions.writeExchangeRecordsToRSMQueue([["custrecord_acq_loth_zzz_zzz_deal",search.Operator.ANYOF,REC.id]]);
    					log.audit("submitting Deal's related exchange record to the RSM queue", records);
	    			}
	    			
    				var records = [];
    				var children = [];
    				//monitor Shareholder's parent "CHILD OF" field if it changed (Note, this is not a Deal)
    				//if field changed, queue all shareholder's exchange records for re-evaluation
	    			if (priLibrary.fieldChanged(context, "parent"))
	    			{
	    				records = srsFunctions.addRecordsToArray(context.oldRecord, REC, "parent", records);
	    				log.audit("submitting shareholder related exchange records to the RSM queue", records);
	    				
	    				children = srsFunctions.getChildShareholders(records);
	    				for (i = 0; i < children.length; i+=1) 
	    				{
	    					records.push(children[i]);
	    				}
	    				log.audit("records", JSON.stringify(records));
	    				srsFunctions.writeExchangeRecordsToRSMQueue([["custrecord_acq_loth_zzz_zzz_shareholder",search.Operator.ANYOF,records]]);
	    				
	    			}
	    		}
                // ATP-555 Logic - This is superceded by ATO-70 and Alex is commenting it out at Sara O's request
    			//if (context.type != context.UserEventType.DELETE) 
    			//	if (priLibrary.fieldChanged(context, "custentity_acq_escrow_agent")) {
    			//		if (REC.getValue("custentity_acq_escrow_agent")) {
    			//			// if no Escrow Agent Document already exists, create one
    			//			if (!recordExists("customrecord_document_management",[["isinactive",search.Operator.IS,false],"AND",["custrecord_escrow_customer",search.Operator.ANYOF,[REC.id]],"AND",["custrecord_doc_type",search.Operator.ANYOF,[srsConstants.CUSTOM_DOCUMENT_TYPE.ACQUIOM_ESCROW_AGENT]]])) {
    			//				var DOC = record.create({type: "customrecord_document_management", isDynamic: true});
    			//				DOC.setValue("custrecord_escrow_customer", REC.id); 
    			//				DOC.setValue("custrecord_doc_type", srsConstants.CUSTOM_DOCUMENT_TYPE.ACQUIOM_ESCROW_AGENT); 
    			//				DOC.setValue("custrecord_dm_status", srsConstants.CUSTOM_DOCUMENT_STATUS.NOT_RECEIVED);
    			//				DOC.setValue("name","Acquiom Escrow Agent Agreement"); 
    			//				DOC.setValue("altname","Acquiom Escrow Agent Agreement");
    			//				DOC.setValue("custrecord_file", 5691869); 		// internal ID of the placeholder file.  this is the same in Sandbox and Production
    			//				DOC.save();    							
    			//				if (context.type == context.UserEventType.EDIT ) 
    			//					priMessage.prepareMessage("Document Created","Document of type 'Acquiom Escrow Agent' has been automatically created.", priMessage.TYPE.CONFIRMATION); 
    			//			} else
    			//				log.debug(funcName, "doc already exists");    						
    			//		} else
    			//			log.debug(funcName, "field has no value");
    			//	} else
				//		log.debug(funcName, "field was not changed");
                
                        
				/******* <ATP-709> ********/
					var kycStatus = '';
                    var kycLookup = search.lookupFields({
                        type:  search.Type.CUSTOMER,
                        id: context.newRecord.getValue("id"),
                        columns: ['custentityacqdea_relationship_associate', 'companyname', 'custentity_kyc_approved_by', 'category' ]
                    });
              		//if (!kycLookup.category[0]){kycLookup.category[0].value = null;}
                    if ( (context.type != context.UserEventType.DELETE && context.newRecord.getValue("category") == srsConstants.CUSTOMER_CATEGORY.DEAL ) ){   // only run for form "SRS Deal Form (copy 082213" which is always on the DEAL category
                        try{
                            var sendTo = kycLookup.custentityacqdea_relationship_associate[0].value;
                        } catch(e) {
                            var sendTo = null;
                        }
                        //log.debug('KYC FIELDS-'+JSON.stringify(runtime.executionContext) , 'cat='+kycLookup.category[0].value +' reqcat='+ srsConstants.CUSTOMER_CATEGORY.DEAL + ' in '+runtime.executionContext+ ' oldREC_approve_by='+oldREC.getValue("custentity_kyc_approved_by").length +' --- NEWrec_approved_by='+kycLookup.custentity_kyc_approved_by.length + ' **sendTo='+sendTo  );

                        // if these fields changed from before & after submit then the KYC button worked
                        if ( (oldREC.getValue("custentity_kyc_approved_by").length>0 && kycLookup.custentity_kyc_approved_by.length<=0 ) || (oldREC.getValue("custentity_kyc_approved_by").length<=0 && kycLookup.custentity_kyc_approved_by.length>0 ) ){	
                        
                            // see if its being approved or revoked
                            if (oldREC.getValue("custentity_kyc_approved_by") && !REC.getValue("custentity_kyc_approved_by")){ kycStatus = 'unapproved';}
                            if (!oldREC.getValue("custentity_kyc_approved_by") && REC.getValue("custentity_kyc_approved_by")){ kycStatus = 'approved';}
                            log.debug('ATP-709 sendTo='+sendTo, 'kycLookup.custentity_kyc_approved_by='+kycLookup.custentity_kyc_approved_by+' kycStatus='+kycStatus + ' new kyc='+ kycLookup['custentityacqdea_relationship_associate'].value + ' old kyc='+oldREC.getValue("custentity_kyc_approved_by")+' newcompany='+ kycLookup['companyname']  );
                            
                            // when KYC fields changed send email to RA, if none then send to ra@srsacquiom.com
                            if ( sendTo ){
                                sendEmailToRA( sendTo, REC.getValue("id"), kycLookup['companyname'], kycStatus );
                            } else { 	//send email to ra@srsacquiom.com
                                sendEmailToRA( "ra@srsacquiom.com", REC.getValue("id"), kycLookup['companyname'], kycStatus );
                            }
                        }
                    }
				/******* </ATP-709> *******/
			}
			
    		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

			function recordExists(recType, filters) {				
				return (search.create({type: recType, filters: filters}).run().getRange(0,1).length > 0);  				
			}

    		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

			/******* <ATP-709> ********/
			function sendEmailToRA(sendTo, customerId, dealName, kycStatus){
				var emailSubject = '';
				var emailBody = '';
				if (kycStatus == 'unapproved'){
					emailSubject = 'KYC approval has been revoked for '+dealName;
					emailBody = 'KYC approval has been revoked for '+dealName+'. If this email was delivered to ra@srsacquiom.com then no Relationship Associate is assigned to this deal in NetSuite.';
				} else {
					emailSubject = 'KYC has been approved for '+dealName;
					emailBody = 'KYC has been approved for '+dealName+'. If this email was delivered to ra@srsacquiom.com then no Relationship Associate is assigned to this deal in NetSuite.';
				}

				try{
					email.send({
						author: runtime.getCurrentUser().id,
						recipients: sendTo,
						subject: emailSubject,
						body: emailBody,
						relatedRecords: {
							entityId: customerId
						}
					});
					log.debug("sendEmailToRA-success", "KYC status="+ kycStatus +" author:"+runtime.getCurrentUser().id +", sendTo:"+sendTo+", dealName:"+dealName+", custid:"+customerId );
				}catch(e){
					log.error("sendEmailToRA-ERROR", e.message+ " *KYC status="+ kycStatus +" author:"+runtime.getCurrentUser().id +", sendTo:"+sendTo+", dealName:"+dealName+", custid:"+customerId);
				}

			}
			/******* </ATP-709> *******/


		return {
			beforeLoad: 	beforeLoad,
			afterSubmit:	afterSubmit
		}
});
