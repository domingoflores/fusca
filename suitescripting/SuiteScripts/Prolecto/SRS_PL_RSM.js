//------------------------------------------------------------------
// Copyright 2019, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------


/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 * @NScriptType plugintypeimpl
 */



//------------------------------------------------------------------
//Script: 		SRS Plugin for RSM
//Description:  SRS Record State Manager (RSM) holds coded rules 
//				
//Developer: 	Boban
//				Marko Obradovic
//Date: 		12/12/2018
//------------------------------------------------------------------

define(["N/runtime","N/log","N/record","N/search", "./SRS_PL_RSM_Constants.js", "/.bundle/132118/PRI_AS_Engine"
	,"./Shared/SRS_Functions"],
	function(runtime,log,record,search, constants, appSettings
			, srsFunctions) {
		"use strict";
		

		function nickMatchRemainder(shArray, irsArray, anyArray) 
		{
			log.debug("nickMatchRemainder starts");
		    shArray[0] = "";
		    irsArray[0] = "";
		    anyArray[0] = "";
		    if (shArray.join(" ") == irsArray.join(" ") && shArray.join(" ") == anyArray.join(" ")) 
		    {
		    	log.debug("nickMatchRemainder ends true");
		        return true;
		    }
		    log.debug("nickMatchRemainder ends false");
		    return false;
		}


		function nickNameMatch(shareholderName, irsName, paymtName, FFCName) {
			
			log.debug("nickNameMatch starts");
			log.debug("nickNameMatch shareholderName", shareholderName);
			log.debug("nickNameMatch irsName", irsName);
			log.debug("nickNameMatch paymtName", paymtName);
			
			log.debug("nickNameMatch FFCName", FFCName);
			
			
		    var payFailed = false;
		    
		    // arrays of the input strings split by space
		    var sh;
		    var irs;
		    var pay;
		    var ffc;
		    
		    // if found, array of formal names based on the nickname lookup
		    var shMap;
		    var irsMap;
		    var payMap;
		    var ffcMap;
		    
		    // merge of shared formal names between sh and irs
		    var commonMap = [];
		    var overlappingNames = false;
		    
		    // string of the formal name selected
		    var shFormal = "";
		    var irsFormal = "";
		    var payFormal = "";
		    var ffcFormal = "";
		    
		    // indication that multiple formal names are possible
		    var shMultiple = false;
		    var irsMultiple = false;
		    var payMultiple = false;
		    var ffcMultiple = false;
		    
		    var saveSH0 = "";
		    var saveIRS0 = "";
		    var i = 0;
		    var idx = 0;
		    
		    if (FFCName)
		    {
		    	ffc = FFCName.split(" ");
		    }
		    
		    
		    // this should have been caught earlier before this function, but 
		    // if these are not ALL populated, then indicate a match failure
		    if (shareholderName && irsName) 
		    {
		        sh = shareholderName.split(" ");
		        irs = irsName.split(" ");
	            if (sh.length == irs.length && (sh.length == 2 || sh.length == 3) ) 
		        {
	            	if (paymtName)	//only evaluate if payment name is present 
			        {
			            // same number of tokens for these, so evaluate the pay/ffc inputs
			            pay = paymtName.split(" ");
			            if (pay.length != sh.length) 
			            {
			                // Payment Name does not match on number of tokens, so
			                //    try the FFC before we fail out
			                if (FFCName) 
			                {
			                    if (ffc.length != sh.length) {
			                        // token count mismatch
			                        //aqua.console.println("FAIL 100");
			                    	log.debug("nickNameMatch ends false 1");
			                        return false;
			                    }
			                    payFailed = true;
			                } 
			                else 
			                {
			                    // paymtName token count is a mismatch and we have no FFC supplied
			                    //aqua.console.println("FAIL 110");   
			                	log.debug("nickNameMatch ends false 2");
			                    return false;
			                }
			            } 
			        }
		            // token counts the same in sh / irs / pay (which holds pay or ffc)
		            // only later if no match on pay and isPayFFC == false then we have to look at FFC again
		        } 
		        else 
		        {
		            // number of tokens for sh and irs do not match
		            //aqua.console.println("FAIL 120");
		        	log.debug("nickNameMatch ends false 3");
		            return false;
		        }
		        ////aqua.console.println("first name in shareholder is: " + sh[0]);
		        
		        
	            log.debug("nickNameMatch shMap 0");
		        // get shareholder first name information
		        shMap = getNickNameMap(sh[0]);
		        
		        if (!shMap) 
		        {
		        	log.debug("nickNameMatch shMap 1");
		            // there is not a nickname for this, so accept the given value AS the formal name
		            shFormal = sh[0];
		        } else {
		            if (shMap.length == 1) {
		                // there is a nick name and only ONE mapping to a formal name (simple use case)
		            	log.debug("nickNameMatch shMap 2");
		                shFormal = shMap[0];
		            } else {
		                shMultiple = true;
		            }
		        }
		        ////aqua.console.println(shMap);
		        log.debug("nickNameMatch shMap 3");
		        irsMap = getNickNameMap(irs[0]);
		        if (!irsMap) {
		            // there is not a nickname for this, so accept the given value AS the formal name
		        	log.debug("nickNameMatch shMap 4");
		            irsFormal = irs[0];
		        } else {
		            if (irsMap.length == 1) {
		                // there is a nick name and only ONE mapping to a formal name (simple use case)
		            	log.debug("nickNameMatch shMap 5");
		                irsFormal = irsMap[0];
		            } else {
		                irsMultiple = true;
		            }
		        }

		        // we dont know if there is a match yet, but we might be able to prove the match FAILS
		        //  so FAIL as soon as we know there is no match
		        if (shFormal && irsFormal && shFormal != irsFormal) {
		            // Use Case 1: we already have formal name for sh and irs and they do NOT match
		            //aqua.console.println("FAIL 130");  
		        	log.debug("nickNameMatch ends false 4");         
		            return false;
		        }
		        
		        if (shFormal && irsMultiple) {
		            // Use Case 2: we have shareholder formal, but irs name is a nick name list
		            idx = irsMap.indexOf(shFormal);
		            if (idx >= 0) {
		                // shareholder and irs FIRST names now match!!  (but maybe entire names does not)
		                irsFormal = shFormal;
		            } else {
		                // shareholder formal name not found as a possible formal name in irs formal list
		                //aqua.console.println("FAIL 140");       
		            	log.debug("nickNameMatch ends false 5");
		                return false;
		            }
		        }
		        
		        if (irsFormal && shMultiple) {
		            // Use Case 3: we have the irs formal name, but shareholder is a nick name list
		            idx = shMap.indexOf(irsFormal);
		            if (idx >= 0) {
		                // shareholder and irs FIRST names now match!!  (but maybe entire names does not)
		                shFormal = irsFormal;
		            } else {
		                // shareholder formal name not found as a possible formal name in irs formal list
		                //aqua.console.println("FAIL 150");     
		            	log.debug("nickNameMatch ends false 6");
		                return false;
		            }            
		        }
		        
		        if (irsMultiple && shMultiple) {
		            // Use Case 4: both sh and irs were nicknames
		        	log.debug("nickNameMatch shMap 7");
		            if (sh[0] != irs[0]) {
		                // however, the nicknames were NOT the same, so we must generate a list
		                // of formal names where the formal names exist in both sh and irs 
		                // lists; if there are no formal names in common, this isnt a match
		                for (i = 0; i < shMap.length; i+=1) {
		                    if (irsMap.indexOf(shMap[i]) >= 0) {
		                        commonMap.push(shMap[i]);
		                    }
		                }
		          
		                if (commonMap.length == 0) {
		                    // both sh and irs used nick names, however, there are NO formal names shared in
		                    // common with both of those nick names
		                    // e.g.  Bob Smith / Bobby Smith both share formal name Robert
		                    //       Tim Smith / Joey Smith have NO formal names in common (thus will never be a match)
		                    //aqua.console.println("FAIL 160");   
		                	log.debug("nickNameMatch ends false 7");
		                    return false;                
		                }
		            } else {
		                // exactly the same nicknames, so put the formal names in the shared map
		                commonMap = shMap;
		            }
		        }
		        ////aqua.console.println("commonMap: " + commonMap);
		        
		        ////////////////
		        //  After this point, sh first name and irs first name MATCH
		        //  in UC 1,2,3 and we have BOTH the formal names.
		        //
		        //  In UC4 both use nicknames that are either the same nickname or
		        //  there is at least one formal name shared by both sh/irs nick names
		        ////////////////
		        
		        // CAUTION: nickMatchRemainder destorys values in first element of passed arrays
		        // so save them
		        log.debug("nickNameMatch shMap 8");
		        saveSH0 = sh[0];
		        saveIRS0 = irs[0];
		        
		        if (!payFailed && paymtName) 
		        {
		        	//if paymtName exists then pay has already been populated
		            // try to evaluate the paymtName information
		            // (but it could have failed already because its token count did not match)
		        	log.debug("nickNameMatch shMap 9");
		            payMap = getNickNameMap(pay[0]);
		            if (!payMap) {
		                // there is not a nickname for this, so accept the given value AS the formal name
		            	log.debug("nickNameMatch shMap 10");
		                payFormal = pay[0];
		            } else {
		                if (payMap.length == 1) {
		                    // there is a nick name and only ONE mapping to a formal name (simple use case)
		                    payFormal = payMap[0];
		                } else {
		                    payMultiple = true;
		                }
		            }        
		        
		            // if we fall through all these tests without returning true, then attempt to
		            // match with pay name failed (and we will try FFC below if we have one)
		            if (shMultiple && irsMultiple) {
		                // we do not yet know a formal name for EITHER sh or irs
		                if (payFormal) {
		                    // but since we DO have a payFormal, then see if it is a possibility in the nickname list
		                    idx = commonMap.indexOf(payFormal);
		                    if (idx >= 0) {
		                        // this MATCHES a formal name for our shareholder nickname                        
		                        // OK, so does SH, IRS and PAY tokens 2+ all match?
		                        if (nickMatchRemainder(sh,irs,pay)) {
		                            // these are equivalent!
		                        	log.debug("nickNameMatch ends true 8");
		                            return true;
		                        }
		                    }                    
		                } 
		                else 
		                {
		                	log.debug("nickNameMatch shMap 11");
		                    // all three of these are nicknames -- does the nickname match?
		                	log.debug("pay[0]", pay);
		                	log.debug("sh[0]", sh);
		                    if (pay[0] == sh[0]) 
		                    {
		                    	log.debug("nickNameMatch shMap 11.1");
		                        // OK, so does SH, IRS and PAY are ALL nicknames and nicknames match
		                        // do the rest of the name parts in these also match?
		                        if (nickMatchRemainder(sh,irs,pay)) {
		                            // these are equivalent!
		                        	log.debug("nickNameMatch ends true 9");
		                            return true;
		                        }                    
		                    } else {
		                        // the nick names themselves do not match, but
		                        // see if any formal names of payMap overlap with 
		                        // formal names shared by sh and irs
		                    	log.debug("nickNameMatch shMap 11.2");
		                        overlappingNames = false;
		                        for (i = 0; i < payMap.length; i+=1) {
		                            if (commonMap.indexOf(payMap[i]) >= 0) {
		                                overlappingNames = true;
		                                break;
		                            }
		                        }
		                        if (overlappingNames) {
		                            if (nickMatchRemainder(sh,irs,pay)) {
		                                // these are equivalent!
		                            	log.debug("nickNameMatch ends true 10");
		                                return true;
		                            }                        
		                        }                                                
		                    }                                      
		                }
		            } else {
		                // we know a formal name for sh or irs (and sh == irs)
		                // but from logic above this block, now we have BOTH sh / irs!
		                // so we only need to test against one of these
		                if (payFormal) {
		                    if (  payFormal == shFormal  )  {             
		                        // all three first names now match, what about the rest??
		                        if (nickMatchRemainder(sh,irs,pay)) {
		                            // these are equivalent!
		                        	log.debug("nickNameMatch ends true 11");
		                            return true;
		                        }                
		                    }
		                } else {
		                    // we do NOT know a payFormal, but we DO know at BOTH sh or irs formal (at this point)
		                    // does this payMap list of formal names contain the sh/irs formal name
		                    if (payMap.indexOf(shFormal) >= 0) {
		                        // yes, one of the formal names possible with this pay name matchs our shFormal
		                        if (nickMatchRemainder(sh,irs,pay)) {
		                            // these are equivalent!
		                        	log.debug("nickNameMatch ends true 12");
		                            return true;
		                        }
		                    }
		                }
		            }
		        }
		        // restore array values since nickMatchRemainder is destructive to first element values
		        sh[0] = saveSH0;
		        irs[0] = saveIRS0;
		        
		        // if we get here, sh and irs first names match but pay first name does NOT match...
		        if (FFCName) 
		        {
		        	log.debug("nickNameMatch shMap 11.0", ffc);
		            // we can attempt to match on the FFCName
		            ffcMap = getNickNameMap(ffc[0]);
		            if (!ffcMap) {
		            	log.debug("nickNameMatch shMap 12");
		                // there is not a nickname for this, so accept the given value AS the formal name
		                ffcFormal = ffc[0];
		            } else {
		                if (ffcMap.length == 1) {
		                	log.debug("nickNameMatch shMap 13");
		                    // there is a nick name and only ONE mapping to a formal name (simple use case)
		                    ffcFormal = ffcMap[0];
		                } else {
		                    ffcMultiple = true;
		                }
		            }

		                         
		            if (shMultiple && irsMultiple) {
		                // we do not yet know a formal name for EITHER sh or irs
		                if (ffcFormal) {
		                    // but since we DO have a ffcFormal, then see if it is a possibility in the nickname list
		                    idx = commonMap.indexOf(ffcFormal);
		                    if (idx >= 0) {
		                        // this MATCHES a formal name for our shareholder nickname                        
		                        // OK, so does SH, IRS and PAY tokens 2+ all match?
		                        if (nickMatchRemainder(sh,irs,ffc)) {
		                            // these are equivalent!
		                        	log.debug("nickNameMatch ends true 13");
		                            return true;
		                        }
		                    } 
		                } else {
		                	log.debug("nickNameMatch shMap 14");
		                    // all three of these are nicknames -- does the nickname match?
		                    if (ffc[0] == sh[0]) {
		                        // OK, so does SH, IRS and FFC are ALL nicknames and nicknames match
		                        // do the rest of the name parts in these also match?
		                        if (nickMatchRemainder(sh,irs,ffc)) {
		                            // these are equivalent!
		                        	log.debug("nickNameMatch ends true 14");
		                            return true;
		                        }                    
		                    } else {
		                        // the nick names themselves do not match, but
		                        // see if any formal names of ffcMap overlap with 
		                        // formal names shared by sh and irs
		                        overlappingNames = false;
		                        for (i = 0; i < ffcMap.length; i+=1) {
		                            if (commonMap.indexOf(ffcMap[i]) >= 0) {
		                                overlappingNames = true;
		                                break;
		                            }
		                        }
		                        if (overlappingNames) {
		                            if (nickMatchRemainder(sh,irs,ffc)) {
		                                // these are equivalent!
		                            	log.debug("nickNameMatch ends true 15");
		                                return true;
		                            }                        
		                        }                     
		                    }
		                }
		            } else {
		                // we know a formal name for sh or irs (and sh == irs)
		                // but because of logic above shFormal == irsFormal
		                if (ffcFormal) {
		                    if (ffcFormal == shFormal ) {
		                        // our ffcFormal name matched what we had for sh or irs
		                        if (nickMatchRemainder(sh,irs,ffc)) {
		                            // these are equivalent!
		                        	log.debug("nickNameMatch ends true 16");
		                            return true;
		                        }
		                    } 
		                } else {
		                    // we do NOT know a ffcFormal, but we DO know at BOTH sh or irs formal (at this point)
		                    // does this ffcMap list of formal names contain the sh/irs formal name
		                    if (ffcMap.indexOf(shFormal) >= 0) {
		                        // yes, one of the formal names possible with this ffc name matchs our shFormal
		                        if (nickMatchRemainder(sh,irs,ffc)) {
		                            // these are equivalent!
		                        	log.debug("nickNameMatch ends true 17");
		                            return true;
		                        }
		                    }                    
		                }
		            }
		        }        
		    }
		    log.debug("nickNameMatch ends false");
		    ////aqua.console.println("FAIL 900");
		    return false;

		}

		function getNickNameMap(nickName) {
			log.debug("getNickNameMap starts ", nickName);
			if (nickName && typeof nickName == "string") 
		    {
		    	
		    	var nicknames = appSettings.readAppSetting("RSM", "RSM Name Match Nicknames");
		    	if (nicknames)
				{
		    		nicknames = JSON.parse(nicknames);
					log.debug("nicknames[nickName]", nicknames[nickName]);
					return nicknames[nickName];
				}
		    }
		    log.debug("getNickNameMap ends null");
		    return null;
		}

		function parseint (value)
		{
			return parseInt(value,10);
		}
		// use the REAL cleanName function already coded rather than this place holder!!!
		function cleanName(input) {
		    if (input) {
		        return input.toUpperCase();    
		    }
		    return "";
		}

		var scriptName = "SRS_PL_RSM.";
		
		//glo bal common applicable types. Specific function may override these values 
		
		//given record and field id, retrieve detail about this field for printing to 
		//log or html field 
		function getLabel(REC,id, useFormatting, useValue)
		{
			log.debug("getLabel starts");
			var retValue = "";
			var field = REC.getField({
				fieldId: id
			});
			if (!field)
			{
				log.debug ("Field " + id + " could not loaded");
				return;
			}
			var fieldvalue = REC.getValue(id);
			
			if (useFormatting === false)
			{
				//must pass false. Empty or undefined will not trigger this.
				retValue = field.label;
			}
			else 
			{
				//default. Render formatting, render it:
				retValue = "<span class=\"customlabel smallgraytextnolink\">" + field.label + "</span>";
			}
			log.debug("fieldtype ", (field && field.type)||"");
			if (useValue)
			{
				retValue = retValue + ": '" + useValue +"'";
			}
			else 
			{
				if (field.type ==="multiselect" || field.type ==="select")
				{
					retValue = retValue + ": '" + REC.getText({
					fieldId: id
					}).toString()+"'";
					log.debug("field texts ", REC.getText({
					fieldId: id
					}).toString());
				}
				else if (field.type ==="checkbox")
				{
					if (fieldvalue === true)
					{
						retValue = retValue + " 'true'";
					}
					else 
					{
						retValue = retValue + " 'false'";
					}
					
				}
				else 
				{
						retValue = retValue + ": '" + REC.getValue({
						fieldId: id
						})+"'";
				}
			}
			log.debug("getLabel ends");
			return retValue;
		}
		
		function Pass(ruleStatus, value)
		{
			log.debug("Rule passed", value);
			//success
			if (ruleStatus.passed)	//passed property is managed outside of this function
			{
				//only append message if this is success and no other rule passed=false
				//turns out, other sub-rules may have flipped rulestatus to False. In that case, don't 
				//append successes. 
				ruleStatus.message += value;
			}
		}
		function Fail(ruleStatus, value)
		{
			log.debug("Rule Failed", value);
			if (ruleStatus.passed === true)
			{
				//remove all previously stored successfully passed rules 
				if (ruleStatus.message.indexOf("-->")>0)
				{
					ruleStatus.message = ruleStatus.message.substr(0, ruleStatus.message.indexOf("-->"));
				}
			}
			ruleStatus.passed = false;	//faile will always set passed to false. 
			ruleStatus.message += value;
		}
		
		//retrieves label AND value
		function getLabelValue(REC,id)
		{
			log.debug("getLabelValue starts");
			var retValue = "";
			var field = REC.getField({
				fieldId: id
			});
			var value = REC.getValue(id);
			
			retValue = field.label + ": " + value;
			
			if ((field.type ==="multiselect") || (field.type ==="select"))
			{
				retValue = retValue + " (" + REC.getText({
				fieldId: id
				}).toString() + ")";
//				log.debug("field texts ", REC.getText({
//				fieldId: id
//				}).toString());
			}
			log.debug("getLabelValue ends");
			return retValue;
		}

		function evaluateRule(ruleName, ruleParams, ruleMsg, REC){
			var funcName = scriptName + "evaluateRule " + REC.type + ":" + REC.id + " | " +  ruleName + " | " + ruleParams;
			
			log.debug(funcName, "starting");
			
			var ruleStatus = {
					notChecked: false, 
					notApplicable: false, 
					passed: false, 
					message: ""
			};
			
			switch(REC.type.toString().toLowerCase() + "." + ruleName.toString().toLowerCase()){

			
				case "customrecord_document_management.doc001":
					doc001(ruleStatus, ruleParams, ruleMsg, REC);
					break;
				case "customrecord_document_management.doc002":
					doc002(ruleStatus, ruleParams, ruleMsg, REC);
					break;
				case "customrecord_document_management.doc003":
					doc003(ruleStatus, ruleParams, ruleMsg, REC);
					break;
				case "customrecord_document_management.doc004":
					doc004(ruleStatus, ruleParams, ruleMsg, REC);
					break;
				case "customrecord_document_management.doc005":
					doc005(ruleStatus, ruleParams, ruleMsg, REC);
					break;
				case "customrecord_document_management.doc006":
					doc006(ruleStatus, ruleParams, ruleMsg, REC);
					break;
				case "customrecord_document_management.doc007":
					doc007(ruleStatus, ruleParams, ruleMsg, REC);
					break;
				case "customrecord_document_management.doc008":
					doc008(ruleStatus, ruleParams, ruleMsg, REC);
					break;
				case "customrecord_document_management.doc009":
					doc009(ruleStatus, ruleParams, ruleMsg, REC);
					break;
				case "customrecord_document_management.doc010":
					doc010(ruleStatus, ruleParams, ruleMsg, REC);
					break;
				case "customrecord_document_management.doc011":
					doc011(ruleStatus, ruleParams, ruleMsg, REC);
					break;
				case "customrecord_acq_lot.er110":
					er110(ruleStatus, ruleParams, ruleMsg, REC);
					break;
				case "customrecord_acq_lot.er220":
					er220(ruleStatus, ruleParams, ruleMsg, REC);
					break;
				case "customrecord_acq_lot.er230":
					er230(ruleStatus, ruleParams, ruleMsg, REC);
					break;
				case "customrecord_acq_lot.er240":
					er240(ruleStatus, ruleParams, ruleMsg, REC);
					break;
				case "customrecord_acq_lot.er250":
					er250(ruleStatus, ruleParams, ruleMsg, REC);
					break;
				case "customrecord_acq_lot.er310":
					er310(ruleStatus, ruleParams, ruleMsg, REC);
					break;
				case "customrecord_acq_lot.er320":
					er320(ruleStatus, ruleParams, ruleMsg, REC);
					break;
				case "customrecord_acq_lot.er330":
					er330(ruleStatus, ruleParams, ruleMsg, REC);
					break;
				case "customrecord_acq_lot.er340":
					er340(ruleStatus, ruleParams, ruleMsg, REC);
					break;
				case "customrecord_acq_lot.er350":
					er350(ruleStatus, ruleParams, ruleMsg, REC);
					break;
				case "customrecord_acq_lot.er360":
					er360(ruleStatus, ruleParams, ruleMsg, REC);
					break;
				case "customrecord_acq_lot.er370":
					er370(ruleStatus, ruleParams, ruleMsg, REC);
					break;
				case "customrecord_acq_lot.er380":
					er380(ruleStatus, ruleParams, ruleMsg, REC);
					break;
				case "customrecord_acq_lot.er390":
					er390(ruleStatus, ruleParams, ruleMsg, REC);
					break;
				case "customrecord_acq_lot.er400":
					er400(ruleStatus, ruleParams, ruleMsg, REC);
					break;
				case "customrecord_acq_lot.er410":
					er410(ruleStatus, ruleParams, ruleMsg, REC);
					break;
				case "customrecord_acq_lot.er420":
					er420(ruleStatus, ruleParams, ruleMsg, REC);
					break;
					
				case "customrecord_acq_lot.er280":
					er280(ruleStatus, ruleParams, ruleMsg, REC);
					break;
				case "customrecord_acq_lot.er290":
					er290(ruleStatus, ruleParams, ruleMsg, REC);
					break;
				case "customrecord_acq_lot.er160":
					er160(ruleStatus, ruleParams, ruleMsg, REC);
					break;
				case "customrecord_acq_lot.er130":
					er130(ruleStatus, ruleParams, ruleMsg, REC);
					break;
				case "customrecord_acq_lot.er150":
					er150(ruleStatus, ruleParams, ruleMsg, REC);
					break;
				case "customrecord_acq_lot.er155":
					er155(ruleStatus, ruleParams, ruleMsg, REC);
					break;
				case "customrecord_payment_import_record.der900":
					der900(ruleStatus, ruleParams, ruleMsg, REC);
					break;
						
				case "customrecord_payment_import_record.der910":
					der910(ruleStatus, ruleParams, ruleMsg, REC);
					break;
				case "customrecord_payment_import_record.der920":
					der920(ruleStatus, ruleParams, ruleMsg, REC);
					break;
				case "customrecord_payment_import_record.deal920":
					deal920(ruleStatus, ruleParams, ruleMsg, REC);
					break;
//				case "customrecord_payment_import_record.deal930":
//					deal930(ruleStatus, ruleParams, ruleMsg, REC);
//					break;
				case "customrecord_acq_lot.deal940":
					deal940(ruleStatus, ruleParams, ruleMsg, REC);
					break;
						
					
				default:
					log.error(funcName, "no rule handler found for rule '" + ruleName + "'");
					ruleStatus.notChecked = true;
					ruleStatus.message = "No rule handler found for this rule.";
        	}	
			return ruleStatus;
		}

		//from requirements:
		//If Document Template IS NOT EMPTY
//		AND
//		JSON Reporting required (document template field) is NOT Equal to "No"
//		Then FAIL

		function doc001(ruleStatus, ruleParams, ruleMsg, REC) {
			
			//ruleStatus.message = ruleMsg;
			
			ruleStatus.message = "Is JSON reporting required?";
			
			log.debug("doc001.D1");
			ruleStatus.passed = true;
			
			var doctemplate = REC.getValue("custrecord_doc_template");
			var jsonReportingRequired = REC.getValue("custrecord_doc_json_req");
			log.debug("doctemplate ", doctemplate);
			
			log.debug("Value of No ", constants["Custom List Yes/No"]["No"]);
			log.debug("jsonReportingRequired ", jsonReportingRequired);
			if (doctemplate)
			{
				log.debug("doc001.D2");
				if (parseint(jsonReportingRequired) !== parseint(constants["Custom List Yes/No"]["No"]))
				{
					log.debug("doc001.d2, ", "JSON Required is not No");
					ruleStatus.message += "<br><!--doc001.1-->"+getLabel(REC, "custrecord_doc_json_req");
					ruleStatus.passed = false;
					//if suspense reason is defined, rule fails 
				}
			}
			
		}
		
//		IF Doc Template field Shareholder Required Action in (Required, Optional)
//		AND
//		( Signed Status IS NOT "Signed"
//		OR 
//		Signed Date/Time IS NOT Populate )
//		Then FAIL
		
		function doc002(ruleStatus, ruleParams, ruleMsg, REC) {
			
			//ruleStatus.message = ruleMsg;
			
			ruleStatus.message = "Is Document Signed?";
			
			log.debug("doc002");
			ruleStatus.passed = true;
			var doctemplate = REC.getValue("custrecord_doc_template");
			if (doctemplate)
			{
				var shareholderAction = REC.getValue("custrecord_doc_sh_req_action");
				var signedStatus = REC.getValue("custrecord_doc_signed_status");
				var signedDateTime = REC.getValue("custrecord_doc_signed_datetime");
				log.debug("shareholderAction ", shareholderAction);
				
				if (
						(parseint(shareholderAction) === parseint(constants["Shareholder Required Action"]["Required"])) ||
						(parseint(shareholderAction) === parseint(constants["Shareholder Required Action"]["Optional"]))
				)
				{
						if (parseint(signedStatus) !== parseint(constants["Document Signed Status"]["Signed"])) 
						{
							log.debug("doc002.1, ", "Document not signed");
							ruleStatus.message += "<br><!--doc002.1-->"+getLabel(REC, "custrecord_doc_signed_status");
							ruleStatus.passed = false;
							//if suspense reason is defined, rule fails 
						}
						if (!signedDateTime) 
						{
							log.debug("doc002.2, ", "Signed Date Time empty");
							ruleStatus.message += "<br><!--doc002.2-->"+getLabel(REC, "custrecord_doc_signed_datetime");
							ruleStatus.passed = false;
							
						}
						
				}
				
			}
			else 
			{
					ruleStatus.notApplicable = true;
			}
			
		}
		function isJSONString (str) 
		{
			var retvalue = false; 
			try
			{
			   var json = JSON.parse(str);
			   retvalue = true; 
			}
			catch(e)
			{
			   //invalid json 
				log.debug("parsign json failed", str + "  " + e);
			}
			return retvalue; 
		}
		
		function getSpouseEmail(json)
		{
			var retValue = "";
			var key = "";
			if (json && json["0"])
			{
				 var entry = json["0"];
				 var name = "Spouse Email".toLowerCase();
				 for(key in entry)
				 {
				     if(entry.hasOwnProperty(key))
				     {
				    	 if (name === (key+ "").toLowerCase())
				    	 {
				    		 retValue = entry[key];
				    		 break;
				    	 }
				     }
				 }
				
			}
			return retValue;
			
			
		}
		//If Doc Template field Shareholder Required Action in (Required, Optional)
//		AND 
//		ECHOSIGN JSON has a value defined for Spouse Email. (e.g "Spouse Email":ierson@gmail.com)
//		Then FAIL

		function doc003(ruleStatus, ruleParams, ruleMsg, REC) {
			
			//ruleStatus.message = ruleMsg;
			
			ruleStatus.message = "Is spousal consent omitted?";
			
			log.debug("doc003");
			ruleStatus.passed = true;
			var doctemplate = REC.getValue("custrecord_doc_template");
			if (doctemplate)
			{
				var shareholderAction = REC.getValue("custrecord_doc_sh_req_action");
				var echosignjson = REC.getValue("custrecord_echosign_json");
				log.debug("shareholderAction ", shareholderAction);
				if (
						(parseint(shareholderAction) === parseint(constants["Shareholder Required Action"]["Required"])) ||
						(parseint(shareholderAction) === parseint(constants["Shareholder Required Action"]["Optional"]))
				)
				{
						log.debug("doc003 checking echo sign json");
						if (echosignjson)
						{
							log.debug("doc003 found ecosign json");
							if (isJSONString(echosignjson))
							{
								log.debug("doc003 ecosign json is valid");
								echosignjson = JSON.parse(echosignjson);
								var spouseemail = getSpouseEmail(echosignjson) || "";
								log.debug("doc003 spouseemail", spouseemail);
								if (spouseemail) 
								{
									log.debug("doc003.1, ", "Spouse Email has value");
									ruleStatus.message += "<br><!--doc003.1-->"+getLabel(REC, "custrecord_echosign_json",null,"Spouse Email':'"+spouseemail);
									ruleStatus.passed = false;
									//if suspense reason is defined, rule fails 
								}
							}
							else
							{
								log.debug("doc003.1, ", "Invalid Echosign json");
								ruleStatus.message += "<br><!--doc003.0--> EchoSign JSON is Invalid "+getLabel(REC, "custrecord_echosign_json");
								ruleStatus.passed = false;
								
							}
							
								
							
						}
				}
			}
			else 
			{
					ruleStatus.notApplicable = true;
			}
			
		}
		
//		If Doc Template field Shareholder Required Action in (Required, Optional)
//		AND 
//		Backup Link IS EMPTY
//		Then FAIL

		function doc004(ruleStatus, ruleParams, ruleMsg, REC) {
			
			//ruleStatus.message = ruleMsg;
			
			ruleStatus.message = "Is backup link set?";
			
			log.debug("doc004");
			ruleStatus.passed = true;
			var doctemplate = REC.getValue("custrecord_doc_template");
			if (doctemplate)
			{
				var shareholderAction = REC.getValue("custrecord_doc_sh_req_action");
				var backuplink = REC.getValue("custrecord_doc_backup_link");
				log.debug("shareholderAction ", shareholderAction);
				var signedStatus = REC.getValue("custrecord_doc_signed_status");
				if (
				(parseint(shareholderAction) === parseint(constants["Shareholder Required Action"]["Required"])) 
				&& 
				(parseint(signedStatus) === parseint(constants["Document Signed Status"]["Signed"]))
				)
				{
						if (!backuplink) 
						{
							log.debug("doc004.1, ", "(1) Backup link is empty");
							ruleStatus.message += "<br><!--doc004.1-->"+getLabel(REC, "custrecord_doc_backup_link") + " when " + getLabel(REC, "custrecord_doc_sh_req_action") + " and when " + getLabel(REC, "custrecord_doc_signed_status");
							ruleStatus.passed = false;
							//if suspense reason is defined, rule fails 
						}
				}
				else if (
						(parseint(shareholderAction) === parseint(constants["Shareholder Required Action"]["Optional"])) 
						&& 
						(parseint(signedStatus) !== parseint(constants["Document Signed Status"]["Declined"]))
						)
						{
								if (!backuplink) 
								{
									log.debug("doc004.2, ", "(2) Backup link is empty");
									ruleStatus.message += "<br><!--doc004.2-->"+getLabel(REC, "custrecord_doc_backup_link") + " when " + getLabel(REC, "custrecord_doc_sh_req_action") + " and when " + getLabel(REC, "custrecord_doc_signed_status");
									ruleStatus.passed = false;
									//if suspense reason is defined, rule fails 
								}
						}
						else 
						{
								ruleStatus.notApplicable = true;
						}
			}
			else 
			{
					ruleStatus.notApplicable = true;
			}
			
		}
		
		
		
//		If Doc Template field Shareholder Required Action in (Informational)
//		AND
//		Signed Status IS NOT "Viewed"
//		Then FAIL
		function doc005(ruleStatus, ruleParams, ruleMsg, REC) {
			
			//ruleStatus.message = ruleMsg;
			
			ruleStatus.message = "Is Signed Status Viewed?";
			
			log.debug("doc005");
			ruleStatus.passed = true;
			var doctemplate = REC.getValue("custrecord_doc_template");
			if (doctemplate)
			{
				var shareholderAction = REC.getValue("custrecord_doc_sh_req_action");
				var signedStatus = REC.getValue("custrecord_doc_signed_status");
				log.debug("shareholderAction ", shareholderAction);
				if (parseint(shareholderAction) === parseint(constants["Shareholder Required Action"]["Informational"]))
				{
						if (parseint(signedStatus) !== parseint(constants["Document Signed Status"]["Viewed"])) 
						{
							log.debug("doc005.1, ", "Signed Status is not Viewed");
							ruleStatus.message += "<br><!--doc005.1-->"+getLabel(REC, "custrecord_doc_signed_status") + " when " + getLabel(REC, "custrecord_doc_sh_req_action");
							ruleStatus.passed = false;
							//if suspense reason is defined, rule fails 
						}
						
				}
				else 
				{
						ruleStatus.notApplicable = true;
				}
			}
			else 
			{
					ruleStatus.notApplicable = true;
			}
			
		}

//		Document Template IS EMPTY
//		AND
//		NAME is not in ("Letter of Transmittal", "Form W9")
//		Then FAIL
		function doc006(ruleStatus, ruleParams, ruleMsg, REC) {
			
			//ruleStatus.message = ruleMsg;
			
			ruleStatus.message = "Is Document Name valid?";
			
			log.debug("doc006");
			ruleStatus.passed = true;
			var doctemplate = REC.getValue("custrecord_doc_template");
			if (!doctemplate)
			{
				var name = REC.getValue("altname");
				if (!(name === "Letter of Transmittal" ||  name === "Form W9"))
				{
						log.debug("doc006.1, ", "Name is not valid " + name);
						ruleStatus.message += "<br><!--doc006.1-->"+getLabel(REC, "altname");
						ruleStatus.passed = false;
						//if suspense reason is defined, rule fails 
				}
			}
			else 
			{
					ruleStatus.notApplicable = true;
			}
			
		}
//		If Document Template IS EMPTY
//		AND
//		NAME = "Letter of Transmittal" or "Form W9"
//		AND 
//		FILE IS EMPTY
//		Then FAIL

		function doc007(ruleStatus, ruleParams, ruleMsg, REC) 
		{
			//ruleStatus.message = ruleMsg;
			ruleStatus.message = "Is file or backup link set?";
			
			log.debug("doc007");
			ruleStatus.passed = true;
			var doctemplate = REC.getValue("custrecord_doc_template");
			if (!doctemplate)
			{
				var name = REC.getValue("altname");
				var backuplink = REC.getValue("custrecord_doc_backup_link");
				if (name === "Letter of Transmittal")
				{
						var file = REC.getValue("custrecord_file");
						if ((!file) && (!backuplink))
						{
							log.debug("doc007.1, ", "File or backup link is missing");
							ruleStatus.message += "<br><!--doc007.1--> File or backup link is missing. "+getLabel(REC, "custrecord_file") + ", " + getLabel(REC, "custrecord_doc_backup_link");
							ruleStatus.passed = false;
							//if suspense reason is defined, rule fails 
						}
				}
			}
			else 
			{
					ruleStatus.notApplicable = true;
			}
			
		}	
		
		
//		If Document Template IS EMPTY
//		AND
//		NAME = "Letter of Transmittal" or "Form W9"
//		AND 
//		Backup Link IS EMPTY
//		Then FAIL

		function doc008(ruleStatus, ruleParams, ruleMsg, REC) 
		{
			//ruleStatus.message = ruleMsg;
			ruleStatus.message = "Is file or backup link set?";
			
			log.debug("doc008");
			ruleStatus.passed = true;
			var doctemplate = REC.getValue("custrecord_doc_template");
			if (!doctemplate)
			{
				var name = REC.getValue("altname");
				if (name === "Form W9")
				{
						var file = REC.getValue("custrecord_file");
						var backuplink = REC.getValue("custrecord_doc_backup_link");
						if ((!file) && (!backuplink))
						{
							log.debug("doc008.1, ", "File or backup link is missing");
							ruleStatus.message += "<br><!--doc008.1--> File or backup link is missing. "+getLabel(REC, "custrecord_file") + ", " + getLabel(REC, "custrecord_doc_backup_link");
							ruleStatus.passed = false;
							//if suspense reason is defined, rule fails 
						}
				}
			}
			else 
			{
					ruleStatus.notApplicable = true;
			}
			
		}	
		
//		If Document Template IS EMPTY
//		AND
//		NAME = "Letter of Transmittal" or "Form W9"
//		AND 
//		ECHOSIGN JSON IS EMPTY
//		Then FAIL

		function doc009(ruleStatus, ruleParams, ruleMsg, REC) 
		{
			//ruleStatus.message = ruleMsg;
			ruleStatus.message = "Is ECHOSIGN JSON set?";
			
			log.debug("doc009");
			ruleStatus.passed = true;
			var doctemplate = REC.getValue("custrecord_doc_template");
			if (!doctemplate)
			{
				var name = REC.getValue("altname");
				var echosignjson = REC.getValue("custrecord_echosign_json");
				if (name === "Letter of Transmittal" ||  name === "Form W9")
				{
						if (!echosignjson)
						{
							log.debug("doc009.1, ", "ECHOSIGN JSON is empty");
							ruleStatus.message += "<br><!--doc009.1-->"+getLabel(REC, "custrecord_echosign_json");
							ruleStatus.passed = false;
							//if suspense reason is defined, rule fails 
						}
				}
			}
			else 
			{
					ruleStatus.notApplicable = true;
			}
			
		}	
		
//		If Document Template IS EMPTY
//		AND
//		NAME = "Letter of Transmittal" or "Form W9"
//		AND
//		(Signed Status IS NOT "Signed"
//		OR 
//		Signed Date/Time IS NOT Populated)
//		Then FAIL

		function doc010(ruleStatus, ruleParams, ruleMsg, REC) 
		{
			//ruleStatus.message = ruleMsg;
			ruleStatus.message = "Is Document Signed?";
			
			log.debug("doc010");
			ruleStatus.passed = true;
			var doctemplate = REC.getValue("custrecord_doc_template");
			if (!doctemplate)
			{
				var name = REC.getValue("altname");
				if (name === "Letter of Transmittal" ||  name === "Form W9")
				{
					var signedStatus = REC.getValue("custrecord_doc_signed_status");
					var signedDateTime = REC.getValue("custrecord_doc_signed_datetime");
					
					if (parseint(signedStatus) !== parseint(constants["Document Signed Status"]["Signed"])) 
					{
						log.debug("doc010.1, ", "Document not signed");
						ruleStatus.message += "<br><!--doc010.1-->"+getLabel(REC, "custrecord_doc_signed_status");
						ruleStatus.passed = false;
						//if suspense reason is defined, rule fails 
					}
					if (!signedDateTime) 
					{
						log.debug("doc010.2, ", "Signed Date Time empty");
						ruleStatus.message += "<br><!--doc002.2-->"+getLabel(REC, "custrecord_doc_signed_datetime");
						ruleStatus.passed = false;
						
					}
							
				}
			}
			else 
			{
					ruleStatus.notApplicable = true;
			}
			
		}	
//		If Document Template IS EMPTY
//		AND
//		NAME = "Letter of Transmittal" or "Form W9"
//		AND
//		Linked Exchange.Clearinghouse datetime IS EMPTY
//		Then FAIL

		function doc011(ruleStatus, ruleParams, ruleMsg, REC) 
		{
			//ruleStatus.message = ruleMsg;
			ruleStatus.message = "Is Exchange Record CH DateTime set?";
			
			log.debug("doc011");
			ruleStatus.passed = true;
			var doctemplate = REC.getValue("custrecord_doc_template");
			if (!doctemplate)
			{
				var name = REC.getValue("altname");
				if (name === "Letter of Transmittal" ||  name === "Form W9")
				{
					
					var linkedER = REC.getValue("custrecord_acq_lot_exrec");
					log.debug("linkedER ", linkedER);
					var erFields = search.lookupFields({type: "customrecord_acq_lot", 
						id: linkedER, 
						columns: ["isinactive","custrecord_ch_completed_datetime"]}); 
					
					var chc_dt = erFields["custrecord_ch_completed_datetime"];
					
					log.debug("chc_dt", chc_dt);
					log.debug("erFields", JSON.stringify(erFields));
					
					if (erFields.isinactive)
					{
						message = "<br><!--doc011.1-->ER is inactive";
	 					Fail(ruleStatus, message);
					}
					else if (!chc_dt)
					{
						message = "<br><!--doc011.2-->CHC DateTime is empty";
	 					Fail(ruleStatus, message);
						
					}
							
				}
			}
			else 
			{
					ruleStatus.notApplicable = true;
			}
			
		}
		

		
		//-------------------------------------------------------------------------------------------------------------------------------------------
		//ER110	No Payment Suspense Reasons
		//		both match and failure for each rule will produce
		//			message - bringing to light all evaluated rules
		function er110(ruleStatus, ruleParams, ruleMsg, REC) {
			
			//ruleStatus.message = ruleMsg;
			
			ruleStatus.message = "Any Payment Suspense reasons?";
			
			log.debug("er110.D1");
			ruleStatus.passed = true;
			
			var suspense_reason = REC.getValue("custrecord_suspense_reason");	//PAYMENT SUSPENSE REASON
			log.debug("suspense_reason ", suspense_reason);
//				log.debug("suspense_reason.length", suspense_reason.length);
			ruleStatus.message += "<br><!--er110.1-->"+getLabel(REC, "custrecord_suspense_reason"); 	//PAYMENT SUSPENSE REASON
			if (suspense_reason && suspense_reason.length>0)
			{
				log.debug("er110.D2");
				ruleStatus.passed = false;
				//if suspense reason is defined, rule fails 
			}
			
		}

		//-------------------------------------------------------------------------------------------------------------------------------------------
		//ER220	Verify Holdings
		//From Requirement:
		//"Field custrecord_acq_loth_zzz_zzz_vrfy_hldngs
//		; consider list ACQ Verify Holdings value below:
//			Yes/1 /greenYes/RSM Pass
//			Changes/2 /redChanges/RSM Fail
//			New Form 3 Received/3 /orangeNewForm3Received/RSM Fail
//			Changes Approved/4 /greenChangesApproved/RSM Pass
//			Changes Rejected/5/redChangesRejected/RSM Fail"
		function er220(ruleStatus, ruleParams, ruleMsg, REC) {
			
			//ruleStatus.message = ruleMsg;
			
			ruleStatus.message = "Have holdings been verified?";
			
			log.debug("er220.D1");
			ruleStatus.passed = true;
			
			var holdings = parseInt(REC.getValue("custrecord_acq_loth_zzz_zzz_vrfy_hldngs"),10);	
			var der = REC.getValue("custrecord_acq_lot_payment_import_record");
			
			log.debug("holdings ", holdings);
			
			var message = "<br><!--er220.1-->"+getLabel(REC, "custrecord_acq_loth_zzz_zzz_vrfy_hldngs");
			
			if (
					(holdings ===  constants["ACQ Verify Holdings"]["Yes"])
					||(holdings ===  constants["ACQ Verify Holdings"]["Changes Approved"])
				) 
			{
				log.debug("er220.D2");
				Pass(ruleStatus, message);
			}
			else if ((!holdings) && der)
			{
				log.debug("er220.D3");
				log.debug("holdings is not set and der exists");
				//custom logic for when holdings are not set and der exists
				//from requirements
				//when <blank> then:
				//a) query associated DER record (likely via ER.custrecord_acq_lot_payment_import_record or ER.custrecord_acq.lot_payment_import_mpr_id)
				//b) if DER.custrecord_de_ch_section_config is null/blank then RSM Fail    (CHC considered "standard" which requires verify holdings)
				//c) when DER.custrecord_de_ch_section_config populated, query associated CHC record
				//d) when CHC.custrecord_chsc_verify_holdings = false or NULL then RSM Not Applicable; when true then RSM Fail
				

//					a) query associated DER record (likely via ER.custrecord_acq_lot_payment_import_record or ER.custrecord_acq.lot_payment_import_mpr_id)
				var derFields = search.lookupFields({type: "customrecord_payment_import_record", 
					id: REC.getValue("custrecord_acq_lot_payment_import_record"), 
					columns: ["isinactive","custrecord_de_ch_section_config"]}); 
				
				var csc = (derFields.custrecord_de_ch_section_config && derFields.custrecord_de_ch_section_config[0] 
				&& derFields.custrecord_de_ch_section_config[0].value) || null;
				
				if (derFields.isinactive)
				{
					message = "<br><!--er220.20-->DER is inactive";
 					Fail(ruleStatus, message);
				}
				else if (!csc)
				{
					log.debug("er220.D4");
					log.debug("DER is active (not inactive) and Clearinghouse Config is empty", "Rule fails.");
					
					//b) if DER.custrecord_de_ch_section_config is null/blank then RSM Fail   
					message = "<br><!--er220.2-->DER CLEARINGHOUSE SECTION CONFIGURATION is empty";
 					Fail(ruleStatus, message);
				}
				else
				{
					log.debug("er220.D5");	
					
					//log.debug("csc" , csc);
					
					//log.debug("derFields.custrecord_de_ch_section_config" , derFields.custrecord_de_ch_section_config);
					//c) when DER.custrecord_de_ch_section_config populated, query associated CHC record
					var chcFields = search.lookupFields({type: "customrecord_ch_section_config", 
						id: csc, 
						columns: ["isinactive","custrecord_chsc_verify_holdings"]}); 
					log.debug("derFields.custrecord_chsc_verify_holdings ", "expected to be T/true " + derFields.custrecord_chsc_verify_holdings);
					
					
					
					//d) when CHC.custrecord_chsc_verify_holdings = false or NULL then RSM Not Applicable; when true then RSM Fail
					if (chcFields.isinactive) 
					{
						log.debug("er220.D55");
						message = "<br><!--er220.21-->CSC is inactive";
 												
						Fail(ruleStatus, message);						
					}
					else if (chcFields.custrecord_chsc_verify_holdings)
					{
						log.debug("er220.D6");
						//custrecord_chsc_verify_holdings is true
						Fail(ruleStatus, message);
					}
					else 
					{
						log.debug("er220.D7");
						//if custrecord_chsc_verify_holdings is not checked, rule is not applicable
						ruleStatus.notApplicable = true;
					}
				}
			}
			else 
			{
				log.debug("er220.D8");
				//fail in all other cases 
				Fail(ruleStatus, message);
			}
			
		}
		
		//-------------------------------------------------------------------------------------------------------------------------------------------
//		IF "CONTACT INFO" FIELD IS BLANK AND "DE1-TIMESTAMP" IS BLANK, THEN FAIL.
//		If "Contact Info" field IS NOT IN (YES, Offline, Offline Received, Offline Approved) , then fail.
//
//		IF "DE1-A8 COUNTRY" = 'UNITED STATES' AND "DE1-TIMESTAMP" FIELD IS POPULATED AND USPS FIELD IS NOT "MATCHED", THEN FAIL.
//		If "DE1-A8 Country" = 'United States' and "Contact Info" field IS IN (YES, Offline, Offline Received, Offline Approved) And USPS field is NOT "Matched", then fail.
//
//		IF "DE1-A8 COUNTRY" IS POPULATED AND NOT ('UNITED STATES') AND ANY ONE OF { DE1-A1) HOLDER NAME, DE-A2) ADDRESS 1, DE1-A8 COUNTRY, DE-A9) EMAIL ADDRESS } DATA ITEMS ARE BLANK, THEN FAIL
//		IF "DE1-A8 COUNTRY" IS BLANK, THEN FAIL
		function er230(ruleStatus, ruleParams, ruleMsg, REC) 
		{
			
			//ruleStatus.message = ruleMsg;
			
			ruleStatus.message = "Is user online or what is offline contact status?";
			
			
			log.debug("er230.D1");
			ruleStatus.passed = true;
			var message = "";
			var de1timestamp = REC.getValue("custrecord_acq_loth_zzz_zzz_de1timestmp");
			var usps_result = REC.getValue("custrecord_exrec_usps_result");
			var contact_info = parseInt(REC.getValue("custrecord_acq_loth_zzz_zzz_cntct_info"),10);
			var shareholder_country = parseInt(REC.getValue("custrecord_acq_loth_1_de1_shrhldcountry"),10);
			var shareholder_name = REC.getValue("custrecord_acq_loth_1_de1_shrhldname");
			var shareholder_address = REC.getValue("custrecord_acq_loth_1_de1_shrhldaddr1");
			var shareholder_email = REC.getValue("custrecord_acq_loth_1_de1_shrhldemail");

			/*log.debug("usps_result", usps_result);
			log.debug("de1timestamp", de1timestamp);
			log.debug("contact_info", contact_info);
			log.debug("shareholder_country", shareholder_country);
			log.debug("shareholder_name", shareholder_name);
			log.debug("shareholder_address", shareholder_address);
			log.debug("shareholder_email", shareholder_email);
			*/
			if ((!de1timestamp) && (!contact_info))
			{
				
				message = "<Br><br><!--er230.1-->"+getLabel(REC, "custrecord_acq_loth_zzz_zzz_de1timestmp") + " and " + getLabel(REC, "custrecord_acq_loth_zzz_zzz_cntct_info");
				Fail(ruleStatus, message);
			}
		    if (!shareholder_country)
			{
				message = "<Br><br><!--er230.2-->"+getLabel(REC, "custrecord_acq_loth_1_de1_shrhldcountry");
				Fail(ruleStatus, message);
			}
			
		    if (de1timestamp || contact_info)
		    {
					
		    	if (contact_info)
		    	{
		    		//if contact info is provided, then expected values are these
		    		if (
						  (parseInt(contact_info,10) !==  parseInt(constants["ACQ Online Offline Status"]["Yes"],10))
					&& (parseInt(contact_info,10) !==  parseInt(constants["ACQ Online Offline Status"]["Offline"],10))
					&& (parseInt(contact_info,10) !==  parseInt(constants["ACQ Online Offline Status"]["Offline Received"],10))
					&& (parseInt(contact_info,10) !==  parseInt(constants["ACQ Online Offline Status"]["Offline Approved"],10))
					)
					{
						message = "<Br><br><!--er230.3-->"+getLabel(REC, "custrecord_acq_loth_zzz_zzz_cntct_info");
						Fail(ruleStatus, message);
					}
		    	}
				if (
						(parseInt(shareholder_country,10) ===  parseInt(constants["Country List"]["United States"],10))
						&& de1timestamp
						&& usps_result !== "Matched"
					)
					{
								message = "<Br><br><!--er230.4-->"+getLabel(REC, "custrecord_exrec_usps_result") + " when " + getLabel(REC, "custrecord_acq_loth_1_de1_shrhldcountry") + " and when " + getLabel(REC, "custrecord_acq_loth_zzz_zzz_de1timestmp");
								Fail(ruleStatus, message);
					}
				
				if (
						(parseInt(shareholder_country,10) ===  parseInt(constants["Country List"]["United States"],10))
						&& 
						(
						(parseInt(contact_info,10) ===  parseInt(constants["ACQ Online Offline Status"]["Yes"],10))
						|| (parseInt(contact_info,10) ===  parseInt(constants["ACQ Online Offline Status"]["Offline"],10))
						|| (parseInt(contact_info,10) ===  parseInt(constants["ACQ Online Offline Status"]["Offline Received"],10))
						|| (parseInt(contact_info,10) ===  parseInt(constants["ACQ Online Offline Status"]["Offline Approved"],10))
		    			)
						&& usps_result !== "Matched"
					)
					{
								message = "<Br><br><!--er230.5-->"+getLabel(REC, "custrecord_exrec_usps_result") + " when " + getLabel(REC, "custrecord_acq_loth_1_de1_shrhldcountry") + " and when " + getLabel(REC, "custrecord_acq_loth_zzz_zzz_cntct_info");
								Fail(ruleStatus, message);
					}
				
				if (parseInt(shareholder_country,10) !==  parseInt(constants["Country List"]["United States"],10))
				{
						if (!shareholder_name)
						{
							message = "<Br><br><!--er230.6-->"+getLabel(REC, "custrecord_acq_loth_1_de1_shrhldname") + " when " + getLabel(REC, "custrecord_acq_loth_1_de1_shrhldcountry");
							Fail(ruleStatus, message);
						}
						if (!shareholder_address)
						{
							message = "<Br><br><!--er230.6-->"+getLabel(REC, "custrecord_acq_loth_1_de1_shrhldaddr1") + " when " + getLabel(REC, "custrecord_acq_loth_1_de1_shrhldcountry");
							Fail(ruleStatus, message);
						}
						if (!shareholder_email)
						{
							message = "<Br><br><!--er230.6-->"+getLabel(REC, "custrecord_acq_loth_1_de1_shrhldemail") + " when " + getLabel(REC, "custrecord_acq_loth_1_de1_shrhldcountry");
							Fail(ruleStatus, message);
						}
				}
		    }
							
		}
		
		//-------------------------------------------------------------------------------------------------------------------------------------------
		//ER240	Tax Status
		//From Requirement:
//		If "TAX FORM E-SIGNED" (custrecord_acq_loth_zzz_zzz_tax_doc_stas) is not in "Yes", "Offline W8", "Offline W9", "Offline Received", "Offline Tax Form Approved", then 
		//if fail ER.
		function er240(ruleStatus, ruleParams, ruleMsg, REC) {
			
			//ruleStatus.message = ruleMsg;
			
			ruleStatus.message = "Have we received Tax Info?";
			
			log.debug("er240.D1");
			ruleStatus.passed = true;
			
			var tax_status = parseInt(REC.getValue("custrecord_acq_loth_zzz_zzz_tax_doc_stas"),10);	
			var signaturePresent = REC.getValue("custrecord_acq_loth_2_de1_taxsigpresent");

			var message = "<br><!--er240.1-->"+getLabel(REC, "custrecord_acq_loth_zzz_zzz_tax_doc_stas");
			if (
					(tax_status ===  constants["TAX FORM E-SIGNED"]["Yes"])
			||		(tax_status ===  constants["TAX FORM E-SIGNED"]["Offline W8"])
			||		(tax_status ===  constants["TAX FORM E-SIGNED"]["Offline W9"])
			||		(tax_status ===  constants["TAX FORM E-SIGNED"]["Offline Received"])
			||		(tax_status ===  constants["TAX FORM E-SIGNED"]["Offline Tax Form Approved"])
			
			)
			{
				if (parseint(signaturePresent) !== parseint(constants["Custom List Yes/No"]["Yes"]))
				{
					message = "<br><!--er240.2-->"+getLabel(REC, "custrecord_acq_loth_2_de1_taxsigpresent");
					Fail(ruleStatus, message);
				}
			}
			else 
			{
				Fail(ruleStatus, message);
			}	
		}
		
		//-------------------------------------------------------------------------------------------------------------------------------------------
		//ER250	Medallion Status
		//From Requirement:
		//Only applies to Local ER PI; when an Alpha PI applies to this exchange record (either Payment Instruction or Payment Instruction Submission populated), this rule is Not Applicable.
//		(Both Payment Instruction and Payment Instruction Submission must be ""blank"" for it to be a Local ER PI)"	"Field custrecord_acq_loth_zzz_zzz_mdlin_status; consider list ACQ Medallion Status values below:
//		Yes/2/redOffline/RSM Fail
//		Offline Received/3 /orangeOfflinereceived/RSM Fail
//		Medallion Approved/4 /greenMedallionApproved/RSM Pass
//		No Medallion Needed/5 /greenNoMedallionNeeded/RSM Pass
//		Medallion Rejected/6 /redMedallionRejected/RSM Fail
//		Customer Elects - No Medallion/7/redCustElectNoMedallion/RSM Fail
//		<blank>/ELSE<noValue>/<blank>/RSM is Not Applicable
//		"
		function er250(ruleStatus, ruleParams, ruleMsg, REC) {
			
			//ruleStatus.message = ruleMsg;
			
			ruleStatus.message = "Is Medallion Required?";
			
			var paymentinstruction_alphapi = REC.getValue("custrecord_exrec_payment_instruction");
			var inprogress = REC.getValue("custrecord_exrec_paymt_instr_sub");
			var medallion_status = parseInt(REC.getValue("custrecord_acq_loth_zzz_zzz_mdlin_status"),10);	

			
			if ((!paymentinstruction_alphapi) && (!inprogress)	//alpha pi should not be set, and should not be in progress
			   		&&
			   		medallion_status							//medalion status value should exist
				)  
			{
				log.debug("er250.D1");
				ruleStatus.passed = true;
				
				
				var message = "<br><!--er250.1-->"+getLabel(REC, "custrecord_acq_loth_zzz_zzz_mdlin_status");
				((medallion_status ===  constants["ACQ Medallion Status"]["Medallion Approved"])
				||(medallion_status ===  constants["ACQ Medallion Status"]["No Medallion Needed"])) ? Pass(ruleStatus, message) : Fail(ruleStatus, message);
				
			} 
			else 
			{		
				log.debug("er250.D2");
				ruleStatus.notApplicable = true;
			}
		}
		
		//-------------------------------------------------------------------------------------------------------------------------------------------
		//ER280	Dual Entry Status
		//From Requirement:
//		"Field custrecord_acq_loth_zzz_zzz_de_status; consider list ACQ Dual Entry Status values below:
//		N/A/1 /greenNA/RSM Not Applicable
//		Not Started/2/orangeInProcess/RSM Fail
//		In Process/3 /orangeNotStarted/RSM Fail
//		Completed/4/greenCompleted/RSM Pass/
//		<noValue>/ELSE<blank>/<blank>/RSM Not Applicable"
		function er280(ruleStatus, ruleParams, ruleMsg, REC) 
		{
			//ruleStatus.message = ruleMsg;
			
			ruleStatus.message = "Is Dual Entry Complete?";
			
			var dual_status = parseInt(REC.getValue("custrecord_acq_loth_zzz_zzz_de_status"),10);	
			log.debug("Dual Entry Status");
			
			//dual status value should exist
			//and must not be n/a	
			if (	(dual_status) 								
					&& (dual_status !==	constants["ACQ Dual Entry Status"]["N/A"])	
				)  
			{
				log.debug("er280.D1");
				ruleStatus.passed = true;
				
				
				var message = "<br><!--er280.1-->"+getLabel(REC, "custrecord_acq_loth_zzz_zzz_de_status");
				
				(dual_status ===  constants["ACQ Dual Entry Status"]["Completed"]) ? Pass(ruleStatus, message) : Fail(ruleStatus, message);
				
			} 
			else 
			{	
				log.debug("er280.D2");			
				ruleStatus.notApplicable = true;
			}
		}
		
		
		//-------------------------------------------------------------------------------------------------------------------------------------------
		//ER290	Amount Final
		//From Requirement:
//		FIELD custrecord_acq_loth_zzz_zzz_isamtfinal (CHECKBOX) must be ON = RSM Pass  (OFF = RSM Fail)
		
		function er290(ruleStatus, ruleParams, ruleMsg, REC) {
			
			ruleStatus.message = "Is Amount Final?";
			
			log.debug("er290.D1");
			ruleStatus.passed = true;
			var isAmountFinal = REC.getValue("custrecord_acq_loth_zzz_zzz_isamtfinal");	

			
			var message = "<br><!--er290.1-->"+getLabel(REC, "custrecord_acq_loth_zzz_zzz_isamtfinal");
			
			(isAmountFinal) ? Pass(ruleStatus, message) : Fail(ruleStatus, message);
				
		}
		
		
		//-------------------------------------------------------------------------------------------------------------------------------------------
//		Transfer Case
		//		"1) Read ONE NS native field (parent) from customer record pointed to by ER.custrecord_acq_loth_zzz_zzz_shareholder
//		2) if the parent field on customer (shareholder) is populated, remember / capture that customer internal id
//		3) Search CASES where 
//		a) Company EQUAL ER.custrecord_acq_loth_zzz_zzz_shareholder OR company EQUAL <capturedParentID>
//		b) Case Queue ANYOF ""Transfer (CRM)"" ""Transfer (Client Operations)""
//		c) Status NONEOF Completed,Duplicate,Closed
//		4) If you get ANY rows in your search result, the RSM rule FAILS, otherwise the rule PASSES"
		function er155(ruleStatus, ruleParams, ruleMsg, REC) 
		{
			//ruleStatus.message = ruleMsg;
			
			ruleStatus.message = "Transfer Case?";
			log.debug("er155.D0");
			
			log.debug("er155.D1");
			ruleStatus.passed = true;
			
			var shareholder = REC.getValue("custrecord_acq_loth_zzz_zzz_shareholder");
			var i = 0;
			var message = "";
			var fields = search.lookupFields({type: "customer", 
				id: shareholder, 
				columns: ["parent"]}); 
			//[{"value":"928206","text":"# 422174011 Stratevest (Carolyn C. Wieczoreck)"}]
			//console.log(" fields.parent " +  JSON.stringify(fields.parent)); 
			var case_companylookuplist = [];
			case_companylookuplist.push(shareholder);
			
			if (fields && fields.parent && fields.parent[0] && fields.parent[0].value !== shareholder)
			{
				//if parent is different internal id than shareholder, then indeed, shareholder is sub customer
				case_companylookuplist.push(fields.parent[0].value);
				var children = srsFunctions.getChildShareholders(fields.parent[0].value);
				for (i = 0; i < children.length; i+=1) 
				{
					case_companylookuplist.push(children[i]);
				}
			}
			
			log.debug("case_companylookuplist ", JSON.stringify(case_companylookuplist));
			
			
			var supportcaseSearchObj = search.create({
				   type: "supportcase",
				   filters:
				   [
				      ["company.internalid","anyof",case_companylookuplist], 
				      "AND", 
				      ["custevent_case_queue","anyof"
				    	  	,constants["Case Queue"]["Transfer (Client Operations)"]
				      		,constants["Case Queue"]["Transfer (CRM)"]
				      ], 
				      "AND", 
				      ["status","noneof"
				    	,constants["Case Status"]["Closed"]
				      	,constants["Case Status"]["Completed"]
				      	,constants["Case Status"]["Duplicate"]
				      ]
				   ],
				   columns:
				   [
				      "casenumber"
				   ]
				});
				var searchResultCount = supportcaseSearchObj.runPaged().count;
				log.debug("Support Case searchResultCount ", searchResultCount);
				
				if (searchResultCount>0)
				{
					log.debug("er155.D2");
					message = "<br><!--er155.1--> " + searchResultCount + " Transfer Case(s) found for shareholder / parent <br><!--" + JSON.stringify(case_companylookuplist) + "-->";
					Fail(ruleStatus, message);
					
				}
				var customrecord_import_recordSearchObj = search.create({
					   type: "customrecord_import_record",
					   filters:
					   [
					      ["custrecord_imp_transferor","anyof",case_companylookuplist], 
					      "AND", 
					      ["custrecord_imp_tab1_approved","anyof",constants["Yes/No/NA/On Hold"]["No"]
					      ]
					   ],
					   columns:
					   [
					      search.createColumn({name: "internalid"})
					   ]
					});
					searchResultCount = customrecord_import_recordSearchObj.runPaged().count;
					log.debug("customrecord_import_recordSearchObj result count",searchResultCount);
					if (searchResultCount>0)
					{
						log.debug("er155.D1");
						message = "<br><!--er155.1--> " + searchResultCount + " Import found for shareholder / parent <br><!--" + JSON.stringify(case_companylookuplist) + "-->";
						Fail(ruleStatus, message);
						
					}
			
		}
		
		//-------------------------------------------------------------------------------------------------------------------------------------------
		//From REquirements, updated 2019/10/20
		//If the DE1-LPM1 Payment Method is equal to payroll, and the sum of 
//		certificate payment amounts is not equal to 0, Fail the rule.
//		If the sum of the certificate amount is between or equal to $0.01 and $1,000,000.00, then Pass.
		function er160(ruleStatus, ruleParams, ruleMsg, REC) {
			
			ruleStatus.message = "Is Amount for Payment Reasonable?";
			var paySum = REC.getValue("custrecord_cert_pay_sum");	
			var paymentmethod = REC.getValue("custrecord_acq_loth_4_de1_lotpaymethod");	
			
			log.debug("er160.D1");
			ruleStatus.passed = true;
			var oneMillion = 1000000;
			
			var message = "<br><!--er160.1-->"+getLabel(REC, "custrecord_cert_pay_sum");
			var failMessage = "";
//				log.debug("paySum ", typeof paySum);
//				log.debug("paySum converted to int ", typeof parseInt(paySum,10));
//				log.debug("paySum converted to int ", parseInt(paySum,10));
//				log.debug("paysum less than 1B ", (paySum && (parseInt(paySum,10)<oneBillion)));

			log.debug("paymentmethod", paymentmethod);
			log.debug("parseInt(paymentmethod,10) ", parseInt(paymentmethod,10));
			log.debug("payroll", constants["DE1-LPM1) LOT PAYMENT METHOD"]["Payroll"]);
			
			if (isNaN(parseFloat(paySum)))
			{
				//if value is empty, then this is a fail as requirements expect at least 0
				failMessage = "<br><!--er160.1-->"+getLabel(REC, "custrecord_cert_pay_sum")+ " not set.";
				Fail(ruleStatus, failMessage);
			}
			else 
			{
				if (parseInt(paymentmethod,10) === parseInt(constants["DE1-LPM1) LOT PAYMENT METHOD"]["Payroll"],10))
				{	
						log.debug("paySum", paySum);
						if (parseFloat(paySum) !== 0)
						{
							failMessage = "<br><!--er160.1-->"+getLabel(REC, "custrecord_cert_pay_sum")+ " is not 0 when payment method " +getLabel(REC, "custrecord_acq_loth_4_de1_lotpaymethod");
							Fail(ruleStatus, failMessage);
						}
					
				}
				else 
				{
					
					log.debug("payment method is not payroll");
					if (parseFloat(paySum)>oneMillion) 
					{
						failMessage = "<br><!--er160.2-->"+getLabel(REC, "custrecord_cert_pay_sum")+ " > '1 Million'.";
						Fail(ruleStatus, failMessage);
					}
					else if (parseFloat(paySum)<0.01)
					{
						failMessage = "<br><!--er160.3-->"+getLabel(REC, "custrecord_cert_pay_sum")+ " < '0.01'";
						Fail(ruleStatus, failMessage);
					}
				}
			}
		}
		
		function cleanString(value)
		{
			if (value)
			{
				value = String(value).trim(); //convert to string and trim
				value = value.toUpperCase().trim();	//convert to upper case
				
				
				var colonindex = value.indexOf(":");
				if (colonindex>0)
				{
					value = value.substring(colonindex, value.length); //use everything after first column 
				}
				
				var brackedindexstart = value.indexOf("[");
				var brackedindexend = value.indexOf("]");
				if ((brackedindexstart>0) && (brackedindexend>0) && (brackedindexstart<brackedindexend))
				{
					value = value.substring(0, brackedindexstart) +  value.substring(brackedindexend+1, value.length);
					//throw value;
				}
				
				
				
				//begening of the string , remove dr, mrs 
				
				//***********
				//replace ' with empty
//				var value = "George D. O'Neill";
//				value = value.replace(/'/g, '');
//				console.log(value);
				//*********
				value = value.replace(/'/g, "");	//remove ' , don't replace them with space
				
				
				//replace & with and globally 
				//var value = "George D.&  O'Neill";
//				value = value.replace(/&/g, 'and');
//				console.log(value);
				value = value.replace(/&/g, "and");
				
				//Special Handling on LP LLC
				value = value.replace(/L\.*L\.*C\.*/ig, "LLC");
				value = value.replace(/L\.*L\.*P\.*/ig, "LLP");
				value = value.replace(/L\.*P\.*/ig, "LP");
				
				
				//*************************
				//Eliminate Titles:  
//				var value = "Dr. George D. O'Neill";
//				value = value.replace(/^(Dr|Mr|Mrs|Ms)(\.|\s)+\s*/ig, '');
//				console.log("'"+value+"'");
//				//*************************
				value = value.replace(/^(Dr|Mr|Mrs|Ms)(\.|\s)+\s*/ig, "");
				
				
				//\bword\b
				//*************************
				//Eliminate suffix titles:  
//				var value = "Dr. George D. O'Neill";
//				value = value.replace(/(\bDDS\b|\bPhD\b)/ig, '');
//				console.log("'"+value+"'");
//				//*************************
				value = value.replace(/(\bDDS\b|\bPhD\b)/ig, "");
				
				value = value.replace(/[^0-9A-Z]/g, " ");	//replace non alpha numeric upper only, as string is uppered already
				value = value.replace(/\s\s+/g, " ");	//replace one or more spaces with single space
			
				//value = replaceCanonicalValues(value);
				
				value = value.trim();
			
			}
			return value;
		}
//		var a = ".406 Ventures : Point 406 Ventures - Co-Invest II LLC"
//		console.log(cleanString(a));
			
			
		//-------------------------------------------------------------------------------------------------------------------------------------------
		
		// ER130	Name Matches
		//			both match and failure for each rule will produce
		//			message - bringing to light all evaluated rules
		function er130(ruleStatus, ruleParams, ruleMsg, REC) {

			ruleStatus.message = ruleMsg; 
			var message = "";
		
			log.debug("LOT ", REC.getValue("custrecord_acq_loth_zzz_zzz_lotdelivery"));
			log.debug("er130.D1");
			
			log.debug("Name Match");
			
			//retrieve variables needed for this rule 
			var de0_name = cleanString(REC.getValue("custrecord_acq_loth_1_src_shrhldname"));
			
			var irs_name = cleanString(REC.getValue("custrecord_acq_loth_2_de1_irsname")); 							//DE1-W1) IRS NAME
			var ach_name = cleanString(REC.getValue("custrecord_acq_loth_5a_de1_nameonbnkacct"));					//ACH: DE1-E1) NAME(S) ON BANK ACCOUNT
			var wire_name = cleanString(REC.getValue("custrecord_acq_loth_5b_de1_nameonbnkacct"));					//Wire: DE1-E1) WIRE NAME(S) ON BANK ACCOUNT
			var wire_name_ffc = cleanString(REC.getValue("custrecord_acq_loth_5b_de1_frthrcrdtname"));
			var check_name = cleanString(REC.getValue("custrecord_acq_loth_5c_de1_checkspayto"));					//Check: DE1-C1) MAKE CHECKS PAYABLE TO
			var paymentmethod = parseInt(REC.getValue("custrecord_acq_loth_4_de1_lotpaymethod"),10);	//DE1-LPM1) LOT PAYMENT METHOD
			var paymentInstruction = REC.getValue("custrecord_exrec_payment_instruction"); 				//PAYMENT INSTRUCTION
			var paymentInstructionSubmission = REC.getValue("custrecord_exrec_paymt_instr_sub"); 
			var detail = "";
			var paymtName = "";
			var shareholderName = cleanString(REC.getValue("custrecord_acq_loth_1_src_shrhldname"));
			ruleStatus.passed = true; //start with passed true for easier reading
			
			ruleStatus.message = "Does name match?";
			
			log.debug("Name Fields" , 
			"DE0 " + de0_name + ", \n" +
			"irs_name " + irs_name + ",\n" +
			"ach_name " + ach_name + ",\n" +
			"wire_name " + wire_name + ",\n" +
			"wire_name_ffc " + wire_name_ffc + ",\n" +
			"check_name " + check_name + ",\n" +
			"shareholderName " + shareholderName + ",\n"
			);
			log.debug("irs_name" , irs_name);
			//confrim share holder name matches irs name 
			
			//if irs name matches shareholder name 
			//From requirements: The Shareholder Name (customer.companyname link from ER.custrecord_acq_loth_1_src_shrhldname):
			//a) MUST match the ER.IRS Name

			switch(paymentmethod)
			{
				//handle ACH
				case constants["DE1-LPM1) LOT PAYMENT METHOD"]["ACH"]:
					 /* falls through */
				case constants["DE1-LPM1) LOT PAYMENT METHOD"]["AES ACH"]:
					paymtName = ach_name;
					wire_name_ffc = "";
					break;
				//handle ALL Wire
				case constants["DE1-LPM1) LOT PAYMENT METHOD"]["Domestic Wire"]:
					 /* falls through */
				case constants["DE1-LPM1) LOT PAYMENT METHOD"]["International Wire"]:
					 /* falls through */
				case constants["DE1-LPM1) LOT PAYMENT METHOD"]["AES DOMESTIC WIRE"]:
					 /* falls through */
				case constants["DE1-LPM1) LOT PAYMENT METHOD"]["AES INTERNATIONAL WIRE"]:
					 /* falls through */
				case constants["DE1-LPM1) LOT PAYMENT METHOD"]["International Wire to Brokerage"]:
					 /* falls through */
				case constants["DE1-LPM1) LOT PAYMENT METHOD"]["International Wire to Bank"]:
					 /* falls through */
				case constants["DE1-LPM1) LOT PAYMENT METHOD"]["Domestic Wire to Brokerage"]:
					 /* falls through */
				case constants["DE1-LPM1) LOT PAYMENT METHOD"]["Domestic Wire to Bank"]:
					paymtName = wire_name;
					break;
				//handle Check
				case constants["DE1-LPM1) LOT PAYMENT METHOD"]["Domestic Check"]:
					 /* falls through */
				case constants["DE1-LPM1) LOT PAYMENT METHOD"]["International Check"]:
					 /* falls through */
				case constants["DE1-LPM1) LOT PAYMENT METHOD"]["AES DOMESTIC CHECK"]:
					 /* falls through */
				case constants["DE1-LPM1) LOT PAYMENT METHOD"]["AES INTERNATIONAL CHECK"]:
					paymtName = check_name;
					wire_name_ffc = "";
					break;
				case constants["DE1-LPM1) LOT PAYMENT METHOD"]["Payroll"]:
					break;
			}	
			
			//20190128 Turning off due to enhanced three name matching function
			message = "<br><!--er130.1-->"+getLabel(REC, "custrecord_acq_loth_2_de1_irsname");
			if (paymentInstruction && paymentInstructionSubmission)
			{
				paymtName = "";
			}

			(shareholderName ===  irs_name) ? Pass(ruleStatus, message) : (nickNameMatch(shareholderName, irs_name, paymtName, wire_name_ffc) ? Pass(ruleStatus, message) : Fail(ruleStatus, message));
			
			//From Requirements: If LOCAL ER PI [Alpha PI and Alpha Submission PI must be NULL], then:
			if ((!paymentInstruction) && (!paymentInstructionSubmission))
			{
				log.debug("er130.D3");
				//payment instruction does not exist AND payment instruction submission does not exist
				log.debug(" payment method ",  paymentmethod + ", " + getLabel(REC, "custrecord_acq_loth_4_de1_lotpaymethod"));
				
				//From Requirements: determine the "common metatype" Payment Method type (common metatypes: ACH, domestic check, international check, domestic wire, international wire)
				//ii) based on the ER Payment Method, if corresponding populated 
				//		[ACH: ER.nameon bank acct 5a 
				//--OR-- WIRE: wire on bankacct5b 
				//--OR-- CHECK: 5cmake check payable to] based on the payment method
				switch(paymentmethod)
				{
					//handle ACH
					case constants["DE1-LPM1) LOT PAYMENT METHOD"]["ACH"]:
						 /* falls through */
					case constants["DE1-LPM1) LOT PAYMENT METHOD"]["AES ACH"]:
						log.debug("er130.D31");
						message = "<Br>ACH: <!--er130.2-->"+getLabel(REC, "custrecord_acq_loth_5a_de1_nameonbnkacct")
						+ ", " +getLabel(REC, "custrecord_acq_loth_2_de1_irsname")
						+ ", " +getLabel(REC, "custrecord_acq_loth_1_src_shrhldname");
					
						if (!ach_name)
						{
							//if ach name is not provided, fail
							Fail(ruleStatus, message);
						}
						else 
						{
							(shareholderName === ach_name) ? Pass(ruleStatus, message) :  nickNameMatch(shareholderName, irs_name, ach_name, "") ? Pass(ruleStatus, message) : Fail(ruleStatus, message);
						}
						break;
					//handle ALL Wire
					case constants["DE1-LPM1) LOT PAYMENT METHOD"]["Domestic Wire"]:
						 /* falls through */
					case constants["DE1-LPM1) LOT PAYMENT METHOD"]["International Wire"]:
						 /* falls through */
					case constants["DE1-LPM1) LOT PAYMENT METHOD"]["AES DOMESTIC WIRE"]:
						 /* falls through */
					case constants["DE1-LPM1) LOT PAYMENT METHOD"]["AES INTERNATIONAL WIRE"]:
						 /* falls through */
					case constants["DE1-LPM1) LOT PAYMENT METHOD"]["International Wire to Brokerage"]:
						 /* falls through */
					case constants["DE1-LPM1) LOT PAYMENT METHOD"]["International Wire to Bank"]:
						 /* falls through */
					case constants["DE1-LPM1) LOT PAYMENT METHOD"]["Domestic Wire to Brokerage"]:
						 /* falls through */
					case constants["DE1-LPM1) LOT PAYMENT METHOD"]["Domestic Wire to Bank"]:
						
						
						log.debug("er130.D32");
						log.debug("shareholderName ", shareholderName);
						log.debug("irs_name ", irs_name);
						log.debug("paymtName ", paymtName);
						log.debug("wire_name_ffc ", wire_name_ffc);
						
						message = "<Br>Wire:<!--er130.3-->"+getLabel(REC, "custrecord_acq_loth_5b_de1_nameonbnkacct");
						if (!wire_name) 
						{
							Fail(ruleStatus, message);
						}
						else if (shareholderName !==  wire_name ) 
						{
//								message += ",<Br><!--er130.3.1-->"+getLabel(REC, "custrecord_acq_loth_5b_de1_frthrcrdtname");
							message = "<Br>Wire: <!--er130.2-->"+getLabel(REC, "custrecord_acq_loth_5b_de1_nameonbnkacct")
							+ ", " +getLabel(REC, "custrecord_acq_loth_2_de1_irsname")
							+ ", " +getLabel(REC, "custrecord_acq_loth_1_src_shrhldname")
							+ ", " +getLabel(REC, "custrecord_acq_loth_5b_de1_frthrcrdtname");
							(shareholderName === wire_name_ffc) ? Pass(ruleStatus, message) : (nickNameMatch(shareholderName, irs_name, paymtName, wire_name_ffc) ? Pass(ruleStatus, message) : Fail(ruleStatus, message));
						}
						else
						{
							Pass(ruleStatus, message);
						}
					
						break;
					//handle Check
					case constants["DE1-LPM1) LOT PAYMENT METHOD"]["Domestic Check"]:
						 /* falls through */
					case constants["DE1-LPM1) LOT PAYMENT METHOD"]["International Check"]:
						 /* falls through */
					case constants["DE1-LPM1) LOT PAYMENT METHOD"]["AES DOMESTIC CHECK"]:
						 /* falls through */
					case constants["DE1-LPM1) LOT PAYMENT METHOD"]["AES INTERNATIONAL CHECK"]:
						log.debug("er130.D33");
//							message = "<Br>Check: <!--er130.4-->"+getLabel(REC, "custrecord_acq_loth_5c_de1_checkspayto");
//							(shareholderName ===  check_name ) ? Pass(ruleStatus, message) : Fail(ruleStatus, message);
						message = "<Br>Check: <!--er130.2-->"+getLabel(REC, "custrecord_acq_loth_5c_de1_checkspayto")
						+ ",<br>" +getLabel(REC, "custrecord_acq_loth_2_de1_irsname")
						+ ",<br> " +getLabel(REC, "custrecord_acq_loth_1_src_shrhldname");
						if (!check_name) 
						{
							Fail(ruleStatus, message);
						}
						else 
						{
							(shareholderName === check_name) ? Pass(ruleStatus, message) : nickNameMatch(shareholderName, irs_name, check_name, "") ? Pass(ruleStatus, message) : Fail(ruleStatus, message);
						}
						
						break;
					case constants["DE1-LPM1) LOT PAYMENT METHOD"]["Payroll"]:
						log.debug("er130.D34");
						//no additional logic for Payroll
						ruleStatus.message += "<Br><!--er130.5-->Payment Method is Payroll";
						ruleStatus.passed = false;
						ruleStatus.notApplicable = true;
						break;
				}	

			}
				
			log.debug("er130 rulestatus ", JSON.stringify(ruleStatus));
			
		}
		//this function has been created so that Broker FFC can be 
		// called for both domestic and international wire
		function checkbrokerFFCrules(REC, ruleStatus)
		{
			var message = "<Br><!--er150.20-->Wire: "+getLabel(REC, "custrecord_acq_loth_5b_de1_frthrcrdtacct");
			if (REC.getValue("custrecord_acq_loth_5b_de1_frthrcrdtname"))
			{
				if (!REC.getValue("custrecord_acq_loth_5b_de1_frthrcrdtacct"))
				{
					Fail(ruleStatus, message);
				}
				else 
				{
					Pass(ruleStatus, message);
				}
			}
			
			message = "<Br><!--er150.21-->Wire: "+getLabel(REC, "custrecord_acq_loth_5b_de1_frthrcrdtname");
			if (REC.getValue("custrecord_acq_loth_5b_de1_frthrcrdtacct"))
			{
				if (!REC.getValue("custrecord_acq_loth_5b_de1_frthrcrdtname"))
				{
					Fail(ruleStatus, message);
				}
				else 
				{
					Pass(ruleStatus, message);
				}
				
			}
		}
		
		// 		ER150	Payment Instruction Populated
		//		both match and failure for each rule will produce
		//		message - bringing to light all evaluated rules
		function er150(ruleStatus, ruleParams, ruleMsg, REC) 
		{

			ruleStatus.message = ruleMsg; 
			
			
			log.debug("er150 custrecord_acq_loth_zzz_zzz_lotdelivery", REC.getValue("custrecord_acq_loth_zzz_zzz_lotdelivery"));
			
			log.debug("er150.D1");
			ruleStatus.passed = true;
			
			var paymentinstruction_alphapi = REC.getValue("custrecord_exrec_payment_instruction");
			var erpaymentmethod = parseInt(REC.getValue("custrecord_acq_loth_4_de1_lotpaymethod"),10);
			var inprogress = REC.getValue("custrecord_exrec_paymt_instr_sub");
			var message = "";
			ruleStatus.message = "PI Defined?";
			
			log.debug("er150 erpaymentmethod", erpaymentmethod);
			log.debug("er150 paymentinstruction_alphapi", paymentinstruction_alphapi);
			log.debug("paymentinstruction_alphapi" + paymentinstruction_alphapi);
			
			//From requirements: 1) Either a Valid Alpha PI Applies or ER has a local PI specified
			//ER.custrecord_exrec_payment_instruction is NOT NULL (Alpha PI applies)
			//OR custrecord_acq_loth_4_de1_lotpaymethod is NOT NULL (Local ER PI)
			
			var failmessage = "<Br><!--er150.1-->ER does not use Alpha PI and Payment method blank on ER";
			
			var passmessage = "<Br><!--er150.1-->"+getLabel(REC, "custrecord_exrec_payment_instruction");
			passmessage += "<Br><!--er150.1-->"+getLabel(REC, "custrecord_acq_loth_4_de1_lotpaymethod");
			
			((!paymentinstruction_alphapi) && (!erpaymentmethod)) ? Fail(ruleStatus, failmessage) : Pass(ruleStatus, passmessage);
			//reversing:
			//(paymentinstruction_alphapi || erpaymentmethod) ? Pass(ruleStatus, passmessage) : Fail(ruleStatus, failmessage);
			
			
			//From requirements: 
			//2) When there is not Alpha PI Submission in progress
			//ER.custrecord_exrec_paymt_instr_sub is NULL
			
			failmessage = "<Br><!--er150.3-->Alpha PI Submission in progress";
			passmessage = "<Br><!--er150.3-->"+getLabel(REC, "custrecord_exrec_paymt_instr_sub");
			(inprogress) ? Fail(ruleStatus, failmessage) : Pass(ruleStatus, passmessage) ;
			
			//if there is no submission in progress, and local pi is set, validate it
			if (erpaymentmethod && (!paymentinstruction_alphapi) && (!inprogress))
			{
				log.debug("er150.D2");
				//validate payment method. Alpha PI takes precedence. If Alpha PI is defined ignore this section.
				switch(erpaymentmethod)
				{
					//handle ACH
					case constants["DE1-LPM1) LOT PAYMENT METHOD"]["ACH"]:
						 /* falls through */
					case constants["DE1-LPM1) LOT PAYMENT METHOD"]["AES ACH"]:
						log.debug("er150.D3");
						message = "<Br><!--er150.4-->ACH: "+getLabel(REC, "custrecord_acq_loth_5a_de1_abaswiftnum");
						(REC.getValue("custrecord_acq_loth_5a_de1_abaswiftnum")) ? Pass(ruleStatus, message) : Fail(ruleStatus, message);
					
					
						message = "<Br><!--er150.5-->ACH: "+getLabel(REC, "custrecord_acq_loth_5a_de1_bankaccttype");
						(REC.getValue("custrecord_acq_loth_5a_de1_bankaccttype")) ? Pass(ruleStatus, message) : Fail(ruleStatus, message);
					
						message = "<Br><!--er150.6-->ACH: "+getLabel(REC, "custrecord_acq_loth_5a_de1_bankname");
						(REC.getValue("custrecord_acq_loth_5a_de1_bankname")) ? Pass(ruleStatus, message) : Fail(ruleStatus, message);
					
						message = "<Br><!--er150.7-->ACH: "+getLabel(REC, "custrecord_acq_loth_5a_de1_nameonbnkacct");
						(REC.getValue("custrecord_acq_loth_5a_de1_nameonbnkacct")) ? Pass(ruleStatus, message) : Fail(ruleStatus, message);
					
						message = "<Br><!--er150.8-->ACH: "+getLabel(REC, "custrecord_acq_loth_5a_de1_bankacctnum");
						(REC.getValue("custrecord_acq_loth_5a_de1_bankacctnum")) ? Pass(ruleStatus, message) : Fail(ruleStatus, message);
					
						break;
					//handle ALL Wire
					case constants["DE1-LPM1) LOT PAYMENT METHOD"]["Domestic Wire"]:
						 /* falls through */
					case constants["DE1-LPM1) LOT PAYMENT METHOD"]["AES DOMESTIC WIRE"]:
						 /* falls through */
					case constants["DE1-LPM1) LOT PAYMENT METHOD"]["Domestic Wire to Brokerage"]:
						 /* falls through */
					case constants["DE1-LPM1) LOT PAYMENT METHOD"]["Domestic Wire to Bank"]:
						log.debug("er150.D4");
						message = "<Br><!--er150.16-->Wire: "+getLabel(REC, "custrecord_acq_loth_5b_de1_nameonbnkacct");
						(REC.getValue("custrecord_acq_loth_5b_de1_nameonbnkacct")) ? Pass(ruleStatus, message) : Fail(ruleStatus, message);
				
						message = "<Br><!--er150.17-->Wire: "+getLabel(REC, "custrecord_acq_loth_5b_de1_bankname");
						(REC.getValue("custrecord_acq_loth_5b_de1_bankname")) ? Pass(ruleStatus, message) : Fail(ruleStatus, message);
				
						message = "<Br><!--er150.18-->Wire: "+getLabel(REC, "custrecord_acq_loth_5b_de1_bankacctnum");
						(REC.getValue("custrecord_acq_loth_5b_de1_bankacctnum")) ? Pass(ruleStatus, message) : Fail(ruleStatus, message);
				
						message = "<Br><!--er150.19-->Wire: "+getLabel(REC, "custrecord_acq_loth_5b_de1_abaswiftnum");
						(REC.getValue("custrecord_acq_loth_5b_de1_abaswiftnum")) ? Pass(ruleStatus, message) : Fail(ruleStatus, message);
				
						checkbrokerFFCrules(REC, ruleStatus);
						
						//custrecord_acq_loth_5b_de1_abaswiftnum or custrecord_acq_loth_5b_de1_bankacctnum must be pouplated, 
						//	or both must be populated, but both cannot be blank, in the case of both domestic and intrnational wire. 
						ruleStatus.message += "<Br><!--er150.25-->Wire: "+getLabel(REC, "custrecord_acq_loth_5b_de1_abaswiftnum")+ "," + getLabel(REC, "custrecord_acq_loth_5b_de1_bankacctnum");
						if ((!REC.getValue("custrecord_acq_loth_5b_de1_abaswiftnum")) && (!REC.getValue("custrecord_acq_loth_5b_de1_bankacctnum")))
						{
							log.debug("er150.D5");
							Fail(ruleStatus, message);
						}
						else 
						{
							log.debug("er150.D6");
							Pass(ruleStatus, message);
						}
						
						break;
					case constants["DE1-LPM1) LOT PAYMENT METHOD"]["AES INTERNATIONAL WIRE"]:
						 /* falls through */
					case constants["DE1-LPM1) LOT PAYMENT METHOD"]["International Wire"]:
						 /* falls through */
					case constants["DE1-LPM1) LOT PAYMENT METHOD"]["International Wire to Brokerage"]:
						 /* falls through */
					case constants["DE1-LPM1) LOT PAYMENT METHOD"]["International Wire to Bank"]:
						log.debug("er150.D7");
						message = "<Br><!--er150.23-->Wire: "+getLabel(REC, "custrecord_acq_loth_5b_de1_bankname");
						(REC.getValue("custrecord_acq_loth_5b_de1_bankname")) ? Pass(ruleStatus, message) : Fail(ruleStatus, message);
						
						message = "<Br><!--er150.24-->Wire: "+getLabel(REC, "custrecord_acq_loth_5b_de1_bankcountry");
						(REC.getValue("custrecord_acq_loth_5b_de1_bankcountry")) ? Pass(ruleStatus, message) : Fail(ruleStatus, message);
				
						message = "<Br><!--er150.25-->Wire: "+getLabel(REC, "custrecord_acq_loth_5b_de1_abaswiftnum")+ "," + getLabel(REC, "custrecord_acq_loth_5b_de1_bankacctnum");
						(REC.getValue("custrecord_acq_loth_5b_de1_abaswiftnum")) ? Pass(ruleStatus, message) : Fail(ruleStatus, message);
				
						checkbrokerFFCrules(REC, ruleStatus);
						
						//custrecord_acq_loth_5b_de1_abaswiftnum or custrecord_acq_loth_5b_de1_bankacctnum must be pouplated, 
						//	or both must be populated, but both cannot be blank, in the case of both domestic and intrnational wire. 
						ruleStatus.message += "<Br><!--er150.25-->Wire: "+getLabel(REC, "custrecord_acq_loth_5b_de1_abaswiftnum")+ "," + getLabel(REC, "custrecord_acq_loth_5b_de1_bankacctnum");
						if ((!REC.getValue("custrecord_acq_loth_5b_de1_abaswiftnum")) && (!REC.getValue("custrecord_acq_loth_5b_de1_bankacctnum")))
						{
							log.debug("er150.D8");
							Fail(ruleStatus, message);
						}
						else 
						{
							log.debug("er150.D9");
							Pass(ruleStatus, message);
						}
						break;
					//handle Check
					case constants["DE1-LPM1) LOT PAYMENT METHOD"]["Domestic Check"]:
						 /* falls through */
					case constants["DE1-LPM1) LOT PAYMENT METHOD"]["International Check"]:
						 /* falls through */
					case constants["DE1-LPM1) LOT PAYMENT METHOD"]["AES DOMESTIC CHECK"]:
						 /* falls through */
					case constants["DE1-LPM1) LOT PAYMENT METHOD"]["AES INTERNATIONAL CHECK"]:
						log.debug("er150.D10");
						message = "<Br><!--er150.9-->Check: "+getLabel(REC, "custrecord_acq_loth_5c_de1_checkspayto");
						(REC.getValue("custrecord_acq_loth_5c_de1_checkspayto")) ? Pass(ruleStatus, message) : Fail(ruleStatus, message);
				
						
						message = "<Br><!--er150.10-->Check: "+getLabel(REC, "custrecord_acq_loth_5c_de1_checksmailto");
						(REC.getValue("custrecord_acq_loth_5c_de1_checksmailto")) ? Pass(ruleStatus, message) : Fail(ruleStatus, message);
				
						message = "<Br><!--er150.11-->Check: "+getLabel(REC, "custrecord_acq_loth_5c_de1_checksaddr1");
						(REC.getValue("custrecord_acq_loth_5c_de1_checksaddr1")) ? Pass(ruleStatus, message) : Fail(ruleStatus, message);
				
						message = "<Br><!--er150.12-->Check: "+getLabel(REC, "custrecord_acq_loth_5c_de1_checkscity");
						(REC.getValue("custrecord_acq_loth_5c_de1_checkscity")) ? Pass(ruleStatus, message) : Fail(ruleStatus, message);
				
						message = "<Br><!--er150.13-->Check: "+getLabel(REC, "custrecord_acq_loth_5c_de1_checkszip");
						(REC.getValue("custrecord_acq_loth_5c_de1_checkszip")) ? Pass(ruleStatus, message) : Fail(ruleStatus, message);
						
						message = "<Br><!--er150.14-->Check: "+getLabel(REC, "custrecord_acq_loth_5c_de1_checkscountry");
						(REC.getValue("custrecord_acq_loth_5c_de1_checkscountry")) ? Pass(ruleStatus, message) : Fail(ruleStatus, message);
						
						
						if ((erpaymentmethod === constants["DE1-LPM1) LOT PAYMENT METHOD"]["Domestic Check"])
							|| (erpaymentmethod === constants["DE1-LPM1) LOT PAYMENT METHOD"]["AES DOMESTIC CHECK"]))
						{
							log.debug("er150.D11");
							message = "<Br><!--er150.15-->Check: "+getLabel(REC, "custrecord_acq_loth_5c_de1_checksstate");
							(REC.getValue("custrecord_acq_loth_5c_de1_checksstate")) ? Pass(ruleStatus, message) : Fail(ruleStatus, message);
						}
						break;
					case constants["DE1-LPM1) LOT PAYMENT METHOD"]["Payroll"]:
						log.debug("er150.D12");
						//no additional logic for Payroll
						ruleStatus.passed = false;
						ruleStatus.notApplicable = true;
						break;
				}	
			}
				
			log.debug("er150 rulestatus ", JSON.stringify(ruleStatus));
			
		}

		
		//-------------------------------------------------------------------------------------------------------------------------------------------

		// Ops Approved to Pay
		//DER900	Ops Approved to Pay
		//From Requirements:
		//"DER is active
//		DER.custrecord_pay_import_approved_pay is checked"
		function der900(ruleStatus, ruleParams, ruleMsg, REC) 
		{
			var message = "";
			
			log.debug("der900.D1");
			ruleStatus.message = "Is Operations Approved to Pay Checked?";
			
			ruleStatus.passed = true;
			if (REC.getValue("custrecord_pay_import_approved_pay")) 
			{
				log.debug("der900.D2");
				Pass(ruleStatus, message);
				
			}
			else 
			{
				message = "<Br><!--der900.1-->" +getLabel(REC, "custrecord_pay_import_approved_pay");
				Fail(ruleStatus, message);
			}
			log.debug("der900 rulestatus ", JSON.stringify(ruleStatus));
		}

		//-------------------------------------------------------------------------------------------------------------------------------------------

		//DER910	Acquiom Approved to Pay
		//from Requirements:
//		"DER is active
//		DER.custrecord_pay_import_acq_approved_pay checkbox is checked"
		function der910(ruleStatus, ruleParams, ruleMsg, REC) 
		{
			
			ruleStatus.message = ruleMsg; 
			var message = "";
			ruleStatus.passed = true;
			ruleStatus.message = "Is Acquiom Approved to Pay Checked?";
			
			if (REC.getValue("isinactive")) 
			{
				message = "<Br><!--der910.1-->" +getLabel(REC, "isinactive");
				Fail(ruleStatus, message);
			}
			
			if (!REC.getValue("custrecord_pay_import_acq_approved_pay")) 
			{
				message = "<Br><!--der910.2-->" +getLabel(REC, "custrecord_pay_import_acq_approved_pay");
				Fail(ruleStatus, message);
			}
			
			log.debug("der910 rulestatus ", JSON.stringify(ruleStatus));
		}
		
		//DER920	DER is Standard => Clearinghouse Configuration
		//from Requirements:
		//"CH Configuration on DER is Standard (blank also means standard currently) (custrecord_de_ch_section_config)
		function der920(ruleStatus, ruleParams, ruleMsg, REC) 
		{
			
			ruleStatus.message = ruleMsg; 
			var message = "";
			
			ruleStatus.passed = true;
			ruleStatus.message = "Is DER Standard?";
			
			
			var cscvalue = REC.getValue("custrecord_de_ch_section_config");
			log.debug("cscvalue", cscvalue);
			if //if it's anything else than standard, fail the rule
			(!
				((!cscvalue) || //if CHC is empty, DER is standard
				(parseInt(cscvalue, 10) === parseInt(constants["CLEARINGHOUSE SECTION CONFIGURATION"]["Standard"],10))) //(ch house der is standard)
			)
			{
				message = "<Br><!--der920.1 customrecord_payment_import_record.custrecord_de_ch_section_config -->" +getLabel(REC, "custrecord_de_ch_section_config");
				Fail(ruleStatus, message);
			}
			
			log.debug("der920 rulestatus ", JSON.stringify(ruleStatus));
		}


		//-------------------------------------------------------------------------------------------------------------------------------------------

		//DEAL920	Counsel Approved to Pay
		//from Requirements:
		//"Customer is active
//		DEAL(custrecord_acq_loth_zzz_zzz_deal).custentity_acq_finaldealapproval is checked"
		function deal920(ruleStatus, ruleParams, ruleMsg, REC) 
		{
			
			ruleStatus.message = ruleMsg; 
			var message = "";
			
			log.debug("deal920.D1");
			if (REC.getValue("custrecord_pay_import_deal")) 
			{
				log.debug("deal920.D2");
				ruleStatus.passed = true;
				ruleStatus.message = "Is Counsel Approved to Pay Checked?";
						
				var dealFields = search.lookupFields({type: record.Type.CUSTOMER, 
					id: REC.getValue("custrecord_pay_import_deal"), 
					columns: ["isinactive","custentity_acq_finaldealapproval"]}); 
				
				message = "<Br><!--deal920.1-->"+dealFields.custentity_acq_finaldealapproval;
				(!dealFields.isinactive && dealFields.custentity_acq_finaldealapproval) ? Pass(ruleStatus, message) : Fail(ruleStatus, message);
					
			}
			else 
			{
				log.debug("deal920.D3");
				ruleStatus.notApplicable = true;
			}
			
			log.debug("deal920 rulestatus ", JSON.stringify(ruleStatus));
		}
		
		//DEAL930	Bank is SunTrust Bank(custentity_acq_deal_financial_bank_compa)	If ST then pass 
//		Bank is Suntrust DER Rule - Mark inactive. This is no longer applicable.
		function deal930(ruleStatus, ruleParams, ruleMsg, REC) 
		{
			
			ruleStatus.message = ruleMsg; 
			var message = "";
			
			log.debug("deal930.D1");
			ruleStatus.passed = true;
			ruleStatus.message = "Is Bank SunTrust?";
			if (REC.getValue("custrecord_pay_import_deal")) 
			{
				var dealFields = search.lookupFields({type: record.Type.CUSTOMER, 
					id: REC.getValue("custrecord_pay_import_deal"), 
					columns: ["isinactive","custentity_acq_deal_financial_bank_compa"]}); 
				
	
	
				log.debug("dealFields.isinactive ", dealFields.isinactive);
				log.debug("dealFields.custentity_acq_deal_financial_bank_compa ", dealFields.custentity_acq_deal_financial_bank_compa);
				
				var bankvalue = (dealFields.custentity_acq_deal_financial_bank_compa[0] && dealFields.custentity_acq_deal_financial_bank_compa[0].value) 
				|| null;
				var banktext = (dealFields.custentity_acq_deal_financial_bank_compa[0] && dealFields.custentity_acq_deal_financial_bank_compa[0].text) || "";
				
				log.debug("bankvalue ", bankvalue);
				
				if (dealFields.isinactive)
				{
					message = "<br><!--deal930.1-->Deal is inactive";
					Fail(ruleStatus, message);
				}
				else if 
				(
					parseInt(bankvalue, 10) != parseInt(constants["SUNTRUST_BANK_INTERNAL_ID"],10) 
				)
				{
					message = "<Br><!--deal930.2 customer.custentity_acq_deal_financial_bank_compa --> ("+bankvalue + ":"+ banktext +")";
					Fail(ruleStatus, message);
				}
			}
			else 
			{
				log.debug("deal930.D3");
				ruleStatus.notApplicable = true;
			}
					
			log.debug("deal930 rulestatus ", JSON.stringify(ruleStatus));
		}
		
		//DEAL940	(CERT NEEDED)On Deal Record "Physical Document Required for Payment" 
		//field MUST either be populated or NOT APPLICABLE (custentity_acq_deal_lot_requirements) BLANK FAILS	
		//IF IT SAYS NOT APPLICABLE THEN PASS 
		function deal940(ruleStatus, ruleParams, ruleMsg, REC) 
		{
			
			ruleStatus.message = ruleMsg; 
			var message = "";
			
			log.debug("deal940.D1");
			ruleStatus.passed = true;
			ruleStatus.message = "Is Deal's Physical Document Set?";
					
			var dealFields = search.lookupFields({type: record.Type.CUSTOMER, 
				id: REC.getValue("custrecord_acq_loth_zzz_zzz_deal"), 
				columns: ["isinactive","custentity_acq_deal_lot_requirements"]}); 
			


//			log.debug("dealFields.isinactive ", dealFields.isinactive);
//			log.debug("dealFields.custentity_acq_deal_lot_requirements ", dealFields.custentity_acq_deal_lot_requirements);
//			
//			log.debug("dealFields.custentity_acq_deal_lot_requirements length", dealFields.custentity_acq_deal_lot_requirements.length);
			
//			var lotvalue = (dealFields.custentity_acq_deal_lot_requirements[0] && dealFields.custentity_acq_deal_lot_requirements[0].value) 
//			|| null;
//			var lottext = (dealFields.custentity_acq_deal_lot_requirements[0] && dealFields.custentity_acq_deal_lot_requirements[0].text) || "";
			log.debug("test1");
			if (dealFields.isinactive)
			{
				message = "<br><!--der940.1-->Deal is inactive";
				Fail(ruleStatus, message);
			}
			else if (dealFields.custentity_acq_deal_lot_requirements.length === 1 )
			{
				
				if (parseInt(dealFields.custentity_acq_deal_lot_requirements[0].value,10) !== parseInt(constants["Acquiom LOT Requirements"]["NOT APPLICABLE"],10))
				{
//					if it says "Not Applicable" we want it to pass. ANY other value including BLANK should fail.
					message = "<Br><!--der940.2 customer.custentity_acq_deal_lot_requirements --> '" + dealFields.custentity_acq_deal_lot_requirements[0].text + "' (ID: " + dealFields.custentity_acq_deal_lot_requirements[0].value + ")";
					Fail(ruleStatus, message);
				}
			}
			else
			{
				//fail if 0 or more than 1 is selected as this is multiselect.
				message = "<Br><!--der940.3 customer.custentity_acq_deal_lot_requirements --> " + dealFields.custentity_acq_deal_lot_requirements.length + " options set in Deal's PHYSICAL DOCUMENTS REQUIRED FOR PAYMENT.";
				Fail(ruleStatus, message);
			}
					
			log.debug("deal940 rulestatus ", JSON.stringify(ruleStatus));
		}
		
		
//		When the Tax Form Collected field is equal to W-8BEN, W-8BEN-E, W-8IMY, W-8ECI, W-8EXP, or W-8CE, then the following must be true to pass:
//		"W-8" Validated checkbox must be selected.
//		If Tax Status = Yes, then we must have something populated in the field W9 eSign Document. If blank, this field doesn"t matter.
//		IRS Tin Check must be one of the following:
//		Code 6: Match! These are Social Security Numbers SSNs.
//		Code 7: Match! These are Employer ID Numbers EINs.
//		Code 8: TIN and name combination matches SSN and EIN Records.
//		Code 0: TIN and Name combination matches IRS records.
		
		function er310(ruleStatus, ruleParams, ruleMsg, REC) 
		{
			
			//ruleStatus.message = ruleMsg;
			
			ruleStatus.message = "Tax Form, Tin Check, and W9 set?";
			
			var taxmethod = parseInt(REC.getValue("custrecordacq_loth_2_de1_taxidmethod"),10);
			var irs_tin_check_result = parseInt(REC.getValue("custrecord_irs_tin_status"),10);
			var w9signed = REC.getValue("custrecord_acq_loth_zzz_w9esigndoc");	
			var taxformcollected = parseInt(REC.getValue("custrecord_exrec_tax_form_collected"),10);
			var w8Validated = REC.getValue("custrecord_exrec_w8_validated");
			var tax_form_esigned = REC.getValue("custrecord_acq_loth_zzz_zzz_tax_doc_stas");
			ruleStatus.passed = true;
			
			switch(taxformcollected)
			{
				case constants["Tax Form Collected"]["W-8BEN"]:
				case constants["Tax Form Collected"]["W-8BEN-E"]:
				case constants["Tax Form Collected"]["W-8IMY"]:
				case constants["Tax Form Collected"]["W-8ECI"]:
				case constants["Tax Form Collected"]["W-8EXP"]:
				case constants["Tax Form Collected"]["W-8CE"]:
					if (!w8Validated)
					{
						message = "<Br><Br><!--er310.1-->" +getLabel(REC, "custrecord_exrec_w8_validated") + " when " +getLabel(REC, "custrecord_exrec_tax_form_collected");
						Fail(ruleStatus, message);
					}
					break
			}
			
			switch(taxformcollected)
			{
				case constants["Tax Form Collected"]["W-8BEN"]:
				case constants["Tax Form Collected"]["W-8BEN-E"]:
				case constants["Tax Form Collected"]["W-8IMY"]:
				case constants["Tax Form Collected"]["W-8ECI"]:
				case constants["Tax Form Collected"]["W-8EXP"]:
				case constants["Tax Form Collected"]["W-8CE"]:
				case constants["Tax Form Collected"]["W-4"]:
				case constants["Tax Form Collected"]["W-9"]:
					log.debug("tax_form_esigned", tax_form_esigned);
					log.debug("TAX FORM E-SIGNED", constants["TAX FORM E-SIGNED"]["Yes"]);
					log.debug("w9signed", w9signed);
					if (parseInt(tax_form_esigned,10) ===  parseInt(constants["TAX FORM E-SIGNED"]["Yes"],10))
					{
						log.debug("signed yes");
						if (!w9signed)
						{
							log.debug("w9signed no")
							message = "<Br><Br><!--er310.1-->" +getLabel(REC, "custrecord_acq_loth_zzz_w9esigndoc") + " when " +getLabel(REC, "custrecord_acq_loth_zzz_zzz_tax_doc_stas")  + " and when " +getLabel(REC, "custrecord_exrec_tax_form_collected");
							Fail(ruleStatus, message);
						}
					}
					if (
							(irs_tin_check_result !== constants["IRS TIN CHECK RESULT"]["Code 6: Match! These are Social Security Numbers SSNs"])
							&& 
							(irs_tin_check_result !== constants["IRS TIN CHECK RESULT"]["Code 7: Match! These are Employer ID Numbers EINs"])
							&& 
							(irs_tin_check_result !== constants["IRS TIN CHECK RESULT"]["Code 8: TIN and name combination Matches SSN and EIN Records"])
							&& 
							(irs_tin_check_result !== constants["IRS TIN CHECK RESULT"]["Code 0: TIN and Name combination matches IRS records"])
							&& 
							(irs_tin_check_result !== constants["IRS TIN CHECK RESULT"]["GIACT Match"])
							&& 
							(irs_tin_check_result !== constants["IRS TIN CHECK RESULT"]["Taxpayer Assertion"])
							&& 
							(irs_tin_check_result !== constants["IRS TIN CHECK RESULT"]["Compliance Waiver"])
							&& 
							(irs_tin_check_result !== constants["IRS TIN CHECK RESULT"]["Not Applicable - Non US Taxpayer"])
					)
						
					{
						message = "<Br><Br><!--er310.2-->" +getLabel(REC, "custrecord_irs_tin_status") + " when " +getLabel(REC, "custrecord_exrec_tax_form_collected");
						Fail(ruleStatus, message);
						
					}
					var signaturePresent = REC.getValue("custrecord_acq_loth_2_de1_taxsigpresent");
					if (parseint(signaturePresent) !== parseint(constants["Custom List Yes/No"]["Yes"]))
					{
						message = "<br><!--er310.3-->"+getLabel(REC, "custrecord_acq_loth_2_de1_taxsigpresent");
						Fail(ruleStatus, message);
					}
					break;
				
			}
			
		}
		
//		Payment Method (custrecord_acq_loth_4_de1_lotpaymethod) must be ACH or Domestic Check  
//		- IF ACH then BANK NAME (custrecord_acq_loth_5a_de1_bankname)  must be populated
		
		function er320(ruleStatus, ruleParams, ruleMsg, REC) 
		{
			
			//ruleStatus.message = ruleMsg;
			ruleStatus.passed = true;
			ruleStatus.message = "Is Payment Method Valid?";
			
			var paymentmethod = parseInt(REC.getValue("custrecord_acq_loth_4_de1_lotpaymethod"),10);
						
			if 
			(
				(paymentmethod !== constants["DE1-LPM1) LOT PAYMENT METHOD"]["ACH"])
				&& (paymentmethod !== constants["DE1-LPM1) LOT PAYMENT METHOD"]["Domestic Check"])
				&& (paymentmethod !== constants["DE1-LPM1) LOT PAYMENT METHOD"]["Payroll"])
			)
			{
				message = "<Br><!--er320.1-->" +getLabel(REC, "custrecord_acq_loth_4_de1_lotpaymethod");
				Fail(ruleStatus, message);
			}
			
			if (paymentmethod === constants["DE1-LPM1) LOT PAYMENT METHOD"]["ACH"])
			{
				var bankname = REC.getValue("custrecord_acq_loth_5a_de1_bankname");
				
				if (!bankname)
				{
					message = "<Br><!--er320.2-->" +getLabel(REC, "custrecord_acq_loth_5a_de1_bankname");
					Fail(ruleStatus, message);
				}
			}
			
		}
		
//		Priority Payment Type field (custrecord_acq_lot_priority_payment) is NULL, then pass
		function er330(ruleStatus, ruleParams, ruleMsg, REC) 
		{
			var i = 0;
			var arr = [];
			var field = "";
			var result = [];
			//ruleStatus.message = ruleMsg;
			ruleStatus.passed = true;
			ruleStatus.message = "Is Priority Payment Set?";
			
			var prioritypayment = parseInt(REC.getValue("custrecord_acq_lot_priority_payment"),10);
						
			if(prioritypayment)
			{
				message = "<Br><!--er330.1-->" +getLabel(REC, "custrecord_acq_lot_priority_payment");
				Fail(ruleStatus, message);
			}
		}
		
		function getNonASCIIcharacters(str, id) 
		{
			var i = 0;
			var retValue = [];
		    for (i = 0; i < str.length; i+=1)
		    {
		        if (str.charCodeAt(i) < 32 || str.charCodeAt(i) > 127)
		        {
		        	log.debug ("Found Non ASCII or out of range ASCII character" , "ER: " + id + ", character: '" + str[i] + "', position: " + i + ", character code: " + str.charCodeAt(i) + ", string: " + str);
		        	retValue.push(str[i]);
		        }
		    }
		    return retValue;
		}
//		Validate that no bad characters are in the payment instructions.
		function er340(ruleStatus, ruleParams, ruleMsg, REC) 
		{
			var i = 0;
			var arr = [];
			var field = "";
			var result = [];
			//ruleStatus.message = ruleMsg;
			ruleStatus.passed = true;
			ruleStatus.message = "Are non-ASCII characters found?";
			
			var asciifields = JSON.parse(appSettings.readAppSetting("RSM", "ASCII Fields"));
			if (asciifields && asciifields.ascii_fields && asciifields.ascii_fields.length>0)
			{
				arr = asciifields.ascii_fields;
				for (i = 0; i < arr.length; i+=1)
				{
					field = arr[i];
//					log.debug("processing field " + field);
					result = getNonASCIIcharacters(REC.getValue(field));
					if (result.length>0)
					{
						log.debug("found special characters " + result.toString());
						message = "<Br><!--er340.1-->" +getLabel(REC, field) + " " + result.toString();
						Fail(ruleStatus, message);
					}
				}
			}
			
		}
		
//		Payout Type is Closing Payment
		function er350(ruleStatus, ruleParams, ruleMsg, REC) 
		{
			var i = 0;
			//ruleStatus.message = ruleMsg;
			ruleStatus.passed = true;
			ruleStatus.message = "Is Payout Type Valid?";
			
			var payouttype = parseInt(REC.getValue("custrecord_acq_lot_payout_type"),10);
						
			if(payouttype !== constants["PAYOUT TYPE"]["Closing Payment"])
			{
				message = "<Br><!--er350.1-->" +getLabel(REC, "custrecord_acq_lot_payout_type");
				Fail(ruleStatus, message);
			}
		}
		
//		Does it have a CREDIT MEMO linked to the ER (note - this may not just be the ones that show 
//		on the ER and could include the transactions in the sublist to the ER 
		function er360(ruleStatus, ruleParams, ruleMsg, REC) 
		{
			var i = 0;
			//ruleStatus.message = ruleMsg;
			ruleStatus.passed = true;
			ruleStatus.message = "Is Credit Memo Linked?";
			
			var relatedCreditMemo = parseInt(REC.getValue("custrecord_acq_loth_related_trans"),10);
						
			if(relatedCreditMemo)
			{
				message = "<Br><!--er360.1-->" +getLabel(REC, "custrecord_acq_loth_related_trans");
				Fail(ruleStatus, message);
			}
			else 
			{
//				//find any credit memos that may have been created from this ER
				var creditmemoSearchObj = search.create({
					   type: "creditmemo",
					   filters:
					   [
					      ["type","anyof","CustCred"], 
					      "AND", 
					      ["custbody_acq_lot_createdfrom_exchrec","anyof",REC.getValue("id")], 
					      "AND", 
					      ["mainline","is","T"]
					   ],
					   columns:[]
					});
					var searchResultCount = creditmemoSearchObj.runPaged().count;
//					log.debug("creditmemoSearchObj result count",searchResultCount);
//					creditmemoSearchObj.run().each(function(result){
//					   // .run().each has a limit of 4,000 results
//					   return true;
//					});
				if (searchResultCount>0)
				{
					message = "<Br><!--er360.2--> " + searchResultCount + " Credit Memo transaction found " ;
					Fail(ruleStatus, message);
				}
			}
			
			
		}
		
//		IF OWNING DER -> CLEARINGHOUSE SECTION CONFIGURATION . LETTER OF TRANSMITTAL IS CHECKED AND EXCHANGE "ESIGN DOCUMENT" (CUSTRECORD_ACQ_LOTH_ZZZ_ESIGNDOCLINK) IS EMPTY, FAIL ER.
//		IF OWNING DER -> CLEARINGHOUSE SECTION CONFIGURATION . LETTER OF TRANSMITTAL IS UNCHECKED, RULE IS NOT APPLICABLE.
//		IF OWNING DER -> CLEARINGHOUSE SECTION CONFIGURATION IS BLANK AND "ESIGN DOCUMENT" (CUSTRECORD_ACQ_LOTH_ZZZ_ESIGNDOCLINK) IS EMPTY, FAIL ER.
		function er370(ruleStatus, ruleParams, ruleMsg, REC) 
		{
			var i = 0;
			//ruleStatus.message = ruleMsg;
			ruleStatus.passed = true;
			ruleStatus.message = "Is ESIGN Document Set?";
			
			var esigndoc = REC.getValue("custrecord_acq_loth_zzz_esigndoclink");
			var der = REC.getValue("custrecord_acq_lot_payment_import_record");
			
			if (der)
			{
			var derFields = search.lookupFields({type: "customrecord_payment_import_record", 
				id: REC.getValue("custrecord_acq_lot_payment_import_record"), 
				columns: ["isinactive","custrecord_de_ch_section_config"]}); 
			
			var csc = (derFields.custrecord_de_ch_section_config && derFields.custrecord_de_ch_section_config[0] 
			&& derFields.custrecord_de_ch_section_config[0].value) || null;
			log.debug("csc ", csc);
			if (derFields.isinactive)
			{
				message = "<br><!--er370.1-->DER is inactive";
					Fail(ruleStatus, message);
			}
			else if (!csc)
			{
				log.debug("er370.2");
				log.debug("DER is active and Clearinghouse Config is empty", "");
				
				if(!esigndoc)
				{
					message = "<Br><!--er370.2-->" +getLabel(REC, "custrecord_acq_loth_zzz_esigndoclink") + " when related DER CHC is empty";
					Fail(ruleStatus, message);
				}
			}
			else
			{
				var chcFields = search.lookupFields({type: "customrecord_ch_section_config", 
					id: csc, 
					columns: ["isinactive","custrecord_chsc_sign_submit"]}); 
				
				if (chcFields.isinactive) 
				{
					log.debug("er370.3");
					message = "<br><!--er370.3-->CSC is inactive";
												
					Fail(ruleStatus, message);						
				}
				else if (chcFields.custrecord_chsc_sign_submit)
				{
					log.debug("er370.4");
					if(!esigndoc)
					{
						message = "<Br><!--er370.4-->" +getLabel(REC, "custrecord_acq_loth_zzz_esigndoclink") + " when related DER CHC  LETTER OF TRANSMITTAL is checked";
						Fail(ruleStatus, message);
					}
				}
				else 
				{
					log.debug("er370.5");
					ruleStatus.notApplicable = true;
				}
			}
		}
			else 
			{
				message = "<Br><!--er370.5-->" +getLabel(REC, "custrecord_acq_lot_payment_import_record") + " is empty. Could not check eSign Document.";
				Fail(ruleStatus, message);
			}
		}
		
//		IF there is a void record attached to the ER Fail
		function er380(ruleStatus, ruleParams, ruleMsg, REC) 
		{
			var i = 0;
			//ruleStatus.message = ruleMsg;
			ruleStatus.passed = true;
			ruleStatus.message = "Is Void Record Attached?";
			
			//find any credit memos that may have been created from this ER
			var voidPaymentsSearch = search.create({
				   type: "customrecord_void_tracking",
				   filters:
				   [
				      ["custrecord_vt_exchange_record","anyof",REC.getValue("id")] 
				      
				   ],
				   columns:[]
				});
				var searchResultCount = voidPaymentsSearch.runPaged().count;
//				log.debug("creditmemoSearchObj result count",searchResultCount);
//				creditmemoSearchObj.run().each(function(result){
//				   // .run().each has a limit of 4,000 results
//				   return true;
//				});
			if (searchResultCount>0)
			{
				message = "<Br><!--er380.1--> " + searchResultCount + " Void Record found " ;
				Fail(ruleStatus, message);
			}
		}
		
//		If ACH (LOT Payment Method) and ABA  routing (custrecord_acq_loth_5a_de1_abaswiftnum) is 026009593 the type of account 
//		(custrecord_acq_loth_5a_de1_bankaccttype) MUST be commercial checking or Commercial Savings otherwise fail
		function er390(ruleStatus, ruleParams, ruleMsg, REC) 
		{
			var i = 0;
			//ruleStatus.message = ruleMsg;
			ruleStatus.passed = true;
			ruleStatus.message = "Is Bank Type Correct?";
			
			var lot = parseInt(REC.getValue("custrecord_acq_loth_4_de1_lotpaymethod"),10);
			var routingnumber = REC.getValue("custrecord_acq_loth_5a_de1_abaswiftnum");
			
			if ((lot === constants["DE1-LPM1) LOT PAYMENT METHOD"]["ACH"])
			&& (routingnumber === constants["COMMERCIAL_BANK_ROUTING_NUMBER"]))
			{
				var accounttype = parseInt(REC.getValue("custrecord_acq_loth_5a_de1_bankaccttype"),10);
				if ((accounttype !== constants["BANK_ACCOUNT_TYPE"]["Commercial Checking"])
						&& (accounttype !== constants["BANK_ACCOUNT_TYPE"]["Commercial Savings"]))
				{
					message = "<Br><!--er390.1-->" +getLabel(REC, "custrecord_acq_loth_5a_de1_bankaccttype");
					Fail(ruleStatus, message);
				}
			}
			else 
			{
				ruleStatus.notApplicable = true;
			}

		}
		
//		If domestic Check (LOT Payment Method) 5C zip code, state, address 1, and city must all not be null 
//		- be careful here as field names do not match
//		If in 5c any address is populated then fail if any parts are not populated as stated in current 214. 
//		If none of those fields are populated then pass is USPS is Matched.
		function er400(ruleStatus, ruleParams, ruleMsg, REC) 
		{
			var i = 0;
			//ruleStatus.message = ruleMsg;
			ruleStatus.passed = true;
			
			var lot = parseInt(REC.getValue("custrecord_acq_loth_4_de1_lotpaymethod"),10);
			var usps_result = REC.getValue("custrecord_exrec_usps_result");
			
			if (lot === constants["DE1-LPM1) LOT PAYMENT METHOD"]["Domestic Check"])
			{
				ruleStatus.message = "Are Domestic Check fields Set?";
			}
			if (lot === constants["DE1-LPM1) LOT PAYMENT METHOD"]["AES DOMESTIC CHECK"])
			{
				ruleStatus.message = "Are AES Domestic Check fields Set?";
			}
			
			if ((lot === constants["DE1-LPM1) LOT PAYMENT METHOD"]["Domestic Check"])
					||
					(lot === constants["DE1-LPM1) LOT PAYMENT METHOD"]["AES DOMESTIC CHECK"]))
			{
				var zipcode = REC.getValue("custrecord_acq_loth_5c_de1_checkszip");
				var state = REC.getValue("custrecord_acq_loth_5c_de1_checksstate");
				var addr1 = REC.getValue("custrecord_acq_loth_5c_de1_checksaddr1");
				var city = REC.getValue("custrecord_acq_loth_5c_de1_checkscity");
				
				if (usps_result !=="Matched")
				{
					if (!zipcode)
					{
						message = "<Br><!--er400.1-->" +getLabel(REC, "custrecord_acq_loth_5c_de1_checkszip");
						Fail(ruleStatus, message);
					}
					
					if (!state)
					{
						message = "<Br><!--er400.2-->" +getLabel(REC, "custrecord_acq_loth_5c_de1_checksstate");
						Fail(ruleStatus, message);
					}
					
					
					if (!addr1)
					{
						message = "<Br><!--er400.3-->" +getLabel(REC, "custrecord_acq_loth_5c_de1_checksaddr1");
						Fail(ruleStatus, message);
					}
					
					
					if (!city)
					{
						message = "<Br><!--er400.4-->" +getLabel(REC, "custrecord_acq_loth_5c_de1_checkscity");
						Fail(ruleStatus, message);
					}
				}
			}
			else 
			{
				ruleStatus.notApplicable = true;
			}

		}
		
//		If there is a PI attached to the ER fail the record custrecord_exrec_paymt_instr_sub, custrecord_exrec_payment_instruction
		function er410(ruleStatus, ruleParams, ruleMsg, REC) 
		{
			var i = 0;
			//ruleStatus.message = ruleMsg;
			ruleStatus.passed = true;
			ruleStatus.message = "Is a PI Attached?";
			
			var instruction_submission = parseInt(REC.getValue("custrecord_exrec_paymt_instr_sub"),10);
			var instruction = parseInt(REC.getValue("custrecord_exrec_payment_instruction"),10);
			if (instruction_submission)
			{
				message = "<Br><!--er410.1-->" +getLabel(REC, "custrecord_exrec_paymt_instr_sub");
				Fail(ruleStatus, message);
			}
			if (instruction)
			{
				message = "<Br><!--er410.2-->" +getLabel(REC, "custrecord_exrec_payment_instruction");
				Fail(ruleStatus, message);
			}
		}
		
		function er420(ruleStatus, ruleParams, ruleMsg, REC) 
		{
			var i = 0;
			//ruleStatus.message = ruleMsg;
			ruleStatus.passed = true;
			ruleStatus.message = "Have Documents Passed RSM?";
			
			var validstates = [];
			validstates.push(constants["RSM Evaluation Result"]["Passed"]);
			
			var customrecord_document_managementSearchObj = search.create({
				   type: "customrecord_document_management",
				   filters:
				   [
				      ["custrecord_acq_lot_exrec","anyof",REC.getValue("id")], 
				      "AND", 
				      ["custrecord_doc_rsm_result","noneof",validstates],
				      "AND", 
				      ["isinactive","is","F"]
				   ],
				   columns:
				   [
				      search.createColumn({
				         name: "name",
				         sort: search.Sort.ASC,
				         label: "ID"
				      }),
				      search.createColumn({name: "internalid", label: "Internal ID"}),
				      search.createColumn({name: "custrecord_doc_rsm_result", label: "RSM Evaluation Result"}),
				      search.createColumn({name: "custrecord_doc_deficiencies", label: "Deficiencies"})
				   ]
				});
				var searchResultCount = customrecord_document_managementSearchObj.runPaged().count;
				//log.debug("customrecord_document_managementSearchObj result count",searchResultCount);
				
				var documents = "";
				if (searchResultCount>0)
				{
					customrecord_document_managementSearchObj.run().each(function(result)
					{
						
						if (documents)
						{
							documents += ", " + srsFunctions.getAnchor("customrecord_document_management", result.getValue("internalid"));
						}
						else 
						{
							documents = srsFunctions.getAnchor("customrecord_document_management", result.getValue("internalid"));
						}
					   // .run().each has a limit of 4,000 results
					   return true;
					});
					
					log.debug("er420.D1");
					var message = "<br><!--er420.1--> " + searchResultCount + " documents did not pass RSM: " + documents;
					Fail(ruleStatus, message);
					
				}
		}
		
		

		/* ======================================================================================================================================== */
    	/* ======================================================================================================================================== */
    	/* ======================================================================================================================================== */

		// determines whether this record has been fully processed, and doesn't need to be evaluated any further
		//	return TRUE or FALSE
		function checkComplete(REC, executionType) {
			var funcName = scriptName + "checkComplete " + REC.type + ":" + REC.id + ", executionType " + executionType;
			var internalid = "";
			log.debug("checkcomplete", funcName)
			switch(REC.type.toString().toLowerCase())
			{
				case "customrecord_acq_lot":
					internalid = REC.getValue("id");
					// if the record is inactive, or already paid, we are DONE
					log.debug("test" );
					//From Requirements: RSM will never run when NetSuite ER Inactive flag is ON
					if (REC.getValue("isinactive"))
					{
						log.debug("ER checkComplete #1: RSM will not run.", "ER " + internalid + " is inactive");
						return true;
					}
					
					if (
							!(	//if below rules produce false, negate it to cause RSM not to run
								REC.getValue("custrecord_ch_completed_datetime")	//must have ch timestamp
								&& !REC.getValue("custrecord_acq_loth_related_trans") // must not have credit memo 
							 )		
					)
					{
						log.debug("ER checkComplete #2: RSM will not run.", "It only runs when With Time Stamp CH and No Credit Memo ");
						return true;
					}
					log.debug("custrecord_acq_loth_zzz_zzz_acqstatus ", REC.getValue("custrecord_acq_loth_zzz_zzz_acqstatus"))
					log.debug("5f. Payment Processing ", constants["Acquiom LOT Status"]["5f. Payment Processing"])
					if (parseInt(REC.getValue("custrecord_acq_loth_zzz_zzz_acqstatus"),10)===parseInt(constants["Acquiom LOT Status"]["5f. Payment Processing"],10))
					{
						log.debug("ER checkComplete #3: RSM will not run.", "It only runs when Acquiom Lot Status is not 5f");
						return true;
					}
					break;
				case "customrecord_document_management":
					internalid = REC.getValue("id");
					// if the record is inactive, or already paid, we are DONE
					log.debug("Document (Custom) test" );
					
					//From Requirements: RSM will never run when NetSuite ER Inactive flag is ON
					if (REC.getValue("isinactive"))
					{
						log.debug("Document (Custom) checkComplete #1: RSM will not run.", "Document (Custom) " + internalid + " is inactive");
						return true;
					}
					
					if (!REC.getValue("custrecord_acq_lot_exrec"))
					{
						log.debug("Document (Custom) checkComplete #2: RSM will not run.", "No Linked Exchange Record");
						return true;
					}
					
					
					log.debug("executionType", executionType)
					log.debug("RECORD_CREATE", constants.RULE_STATUS_CHECK_TYPE.RECORD_CREATE)
					if (executionType === constants.RULE_STATUS_CHECK_TYPE.RECORD_CREATE)
					{
						//from specifications:
//						On Record Create, check Document Template field (custrecord_doc_template)
//						-	If the new Document (Custom) has a Document Template, 
//						then DO NOT CHECK THE RSM RULES, EXIT OUT OF THE RSM SCRIPT
//
//						-	If the new Document (Custom) DOES NOT have Document Template,
//						then CONTINUE with the RSM Script.
//
						
						if (REC.getValue("custrecord_doc_template"))
						{
							log.debug("On Create, Document (Custom) checkComplete #3: RSM will not run.", "Document Template Present.");
							return true;
						}
						
					}
					
					
					
					
					break;
				case "customrecord_payment_import_record":
					internalid = REC.getValue("id");
					// if the record is inactive, or already paid, we are DONE
					log.debug("der test" );
					//From Requirements: RSM will never run when NetSuite ER Inactive flag is ON
					if (REC.getValue("isinactive"))
					{
						log.debug("DER checkComplete #1: RSM will not run.", "DER " + internalid + " is inactive");
						return true;
					}
					
					break;
				default:
					log.debug(funcName, "Script not ready for this record type: " + REC.type.toString().toLowerCase());
					return true;
			}	

		}
		
    	/* ======================================================================================================================================== */

		// called when all rules have passed (eg passed, overridden, or inapplicable)
		//	this function should then perform whatever action needs to be done, and/or otherwise mark the record complete so that the "checkComplete" function 
		//	will know to return TRUE on the next invocation
		function markComplete(REC) {
			var funcName = scriptName + "markComplete " + REC.type + ":" + REC.id;
			var internalid = "";
			
			log.debug("funcName", funcName);
			
			switch(REC.type.toString().toLowerCase()){

				case "customer": 
				case "customrecord_acq_lot": 
					break;
				case "customrecord_document_management":
					log.debug("Complete: custrecord_doc_rsm_result " + REC.getValue("id"), REC.getValue("custrecord_doc_rsm_result"));
					
					if (parseint(REC.getValue("custrecord_doc_rsm_result")) === parseint(constants["RSM Evaluation Result"]["Never Run"]) ||
							parseint(REC.getValue("custrecord_doc_rsm_result"))	=== parseint(constants["RSM Evaluation Result"]["Failed"])
						|| (!REC.getValue("custrecord_doc_rsm_result"))
					)
					{
						//if rsm successful checkbox has not been checked
						//do it now, as markComplete means it's completed with success
						//1. update RSM successful checkbox
						//2. submit related ER for re-processing
						var internalid = REC.getValue("id");
						record.submitFields({
			                type: "customrecord_document_management",
			                id: internalid,
			                values: {"custrecord_doc_rsm_result": constants["RSM Evaluation Result"]["Passed"]
			                }
			            });
					
						var records = [];
						records.push(REC.getValue("custrecord_acq_lot_exrec"));
						
						log.audit("Complete: submitting ERs for re-evaluation ", JSON.stringify(records));
						
						srsFunctions.writeExchangeRecordsToRSMQueue([["internalid",search.Operator.ANYOF,records]]);
					}
					else 
					{
						log.debug("markComplete was already successful. Remains successful. Nothing to do. " + REC.getValue("id"));
						//since RSM successful is checked already, and markComplete
						//is reporting successful processing, we don't need to do anything
					
					}
					break;
				default:
					log.debug(funcName, "Script not ready for this record type: " + REC.type.toString().toLowerCase());
			}	

		}
		
		function markIncomplete(REC) {
			var funcName = scriptName + "markIncomplete " + REC.type + ":" + REC.id;
			var internalid = "";
			
			log.debug("funcName", funcName);
			
			switch(REC.type.toString().toLowerCase()){

				case "customer": 
				case "customrecord_acq_lot": 
					break;
				case "customrecord_document_management":
					log.debug("Incomplete: custrecord_doc_rsm_result " + REC.getValue("id"), REC.getValue("custrecord_doc_rsm_result"));
					if (parseint(REC.getValue("custrecord_doc_rsm_result")) === parseint(constants["RSM Evaluation Result"]["Never Run"])
						||	parseint(REC.getValue("custrecord_doc_rsm_result")) === parseint(constants["RSM Evaluation Result"]["Passed"])
						|| (!REC.getValue("custrecord_doc_rsm_result"))
					)
					{
						var internalid = REC.getValue("id");
						log.debug("unchecking successful box");
						//if rsm successful checkbox has was checked
						//and markIncomplete means it hasn't completed with success
						//1. update RSM successful checkbox to false
						//2. submit related ER for re-processing
						record.submitFields({
			                type: "customrecord_document_management",
			                id: internalid,
			                values: {"custrecord_doc_rsm_result": constants["RSM Evaluation Result"]["Failed"]
			                }
			            });
						var records = [];
						records.push(REC.getValue("custrecord_acq_lot_exrec"));
						
						log.audit("Incomplete: submitting ERs for re-evaluation ", JSON.stringify(records));
						
						srsFunctions.writeExchangeRecordsToRSMQueue([["internalid",search.Operator.ANYOF,records]]);
					}
					else 
					{
						log.debug("markIncomplete was already false. Remains false. Nothing to do. " + REC.getValue("id"));
						//since RSM successful is checked already, and markComplete
						//is reporting successful processing, we don't need to do anything
					
					}
					
					break;
				default:
					log.debug(funcName, "Script not ready for this record type: " + REC.type.toString().toLowerCase());
			}	

		}
		

    	/* ======================================================================================================================================== */

		// called whenever the RSM engine moves one of the status fields to another state
		//	this function may not need to do anything ... it depends on the context
		function changeStatus(REC, statusField, oldStatus, newStatus, finalStatus) {
			var funcName = scriptName + "changeStatus " + REC.type + ":" + REC.id + " | " + statusField + " | " + oldStatus + " | " + newStatus + " | " + finalStatus;
			
			log.debug(funcName, "Updating status");
			/*
			
			var fieldValues = {};
			fieldValues[statusField] = newStatus;
			
			record.submitFields({
                type: REC.type,
                id: REC.id,
                values: fieldValues
            });
            */
		}
		
		//-------------------------------------------------------------------------------------------------------------------------------------------
		//-------------------------------------------------------------------------------------------------------------------------------------------
		//-------------------------------------------------------------------------------------------------------------------------------------------

		function exchangeTypeIsApplicable(REC, exchangeTypes) 
		{
			log.debug("Applicable Types", JSON.stringify(exchangeTypes));
			log.debug("ER Lot", REC.getValue("custrecord_acq_loth_zzz_zzz_lotdelivery"));
			
			var i = 0;
			for (i = 0; i < exchangeTypes.length; i+=1)
			{
				if (parseInt(exchangeTypes[i],10) === parseInt(REC.getValue("custrecord_acq_loth_zzz_zzz_lotdelivery"),10))
				{
					return true;
				}
			}
		}
    	/* ======================================================================================================================================== */

		// called whenever the RSM engine has been asked to manually override a rule; the engine will first call this function, and if the function 
		//		returns TRUE, then RSM will NOT do anythiing (in other words, it will assume that this function has performed the necessary "override"
		//		otherwise, RSM will override the rule
		function manualOverride(REC, ruleName) {
			var funcName = scriptName + "manualOverride " + REC.type + ":" + REC.id + " | " + ruleName;

			log.debug(funcName, "starting");
			
			/*
			if (REC.type == "customer" && ruleName == "phone") {
				record.submitFields({
	                type: REC.type,
	                id: REC.id,
	                values: {phone: "800-555-1212"}
	            });
				return true;
			} else
				
			*/
				return false;
			
		}
		
    	/* ======================================================================================================================================== */

    return {
        evaluateRule: evaluateRule,        
        checkComplete : checkComplete,
        markComplete : markComplete,
        markIncomplete : markIncomplete,
        changeStatus : changeStatus,
        manualOverride : manualOverride 
    };
});