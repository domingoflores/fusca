/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
*/
define(['N/record', 'N/search', 'N/runtime', 'N/email', 'N/format', 'N/url', 'N/https', '/.bundle/132118/PRI_AS_Engine', '/SuiteScripts/Pristine/libraries/searchLibrary', '/SuiteScripts/Pristine/libraries/paymtInstrListLibrary.js'],

/**
 * -----------------------------------------------------------
 *              DuplicatePIandPISBdetection.js
 * ___________________________________________________________
 *
 * Version 1.0 (ATP-856) --last updated 7/18/2019
 * Author: Robert Bender    rbender@shareholderrep.com
 * Description: Detects duplicate PIs and PISBs, emails an alert, places them on hold.
         
-PISBs- DUPLICATE DETECTION
  PISB 1. Run dupe PI & PISB script  *Order of Operations = Process PISBs first then PIs)
  PISB 2. Search for PISBs dupes ( > 1 )
  PISB 3. Store the search results = all PISBs are tagged to a Ex Rec ( do a search for all ACTIVE & UNPAID (unpaid = no Credit Memo) ExRec's with ID of the PISB)
  PISB 4. Cancel PISBs (this clears the ExRec's reason && removes PISB # from ExRec field)
  PISB 5. Using the results from the PISBs search from #3, for each Exchange Rec and ADD Suspense Reason "Duplicate PI Submissions" (Dont add PISB reference because its Cenceled)
-PIs- DUPLICATE DETECTION
    PI 6. Search Dupe PIs
    PI 7. Create Dupe PI array from search ( adds if its on dupe hold reason or not)
    PI 8. Search for ExRecs matching the PI    -NOT REALLY NEEDED; Just for debugging; Utilizing Kens Library instead for functionality
    PI 9. Put dupe PIs on Hold via create Hold record of "Duplicate Detected"
    PI 10. Add the Suspense Reason "Canceled PI Submission (Cust Merge)" in addition to the suspense reason "Duplicate Paymt Instr" this will alert the business that PISBs have been canceled
-Email-
 Email 11. email business to alert them of dupes

        PI Types:
        Acquiom Deal Specific = 10
        Exchange Record = 11 (we are now filtering out these because they will never be a dupe of this type)

* ___________________________________________________________
*/

function(record, search, runtime, email, format, url, https, appSettings, searchLibrary, piListLib) {
    function execute(context){
        log.audit('GOVERNANCE, -SCRIPT START-', runtime.getCurrentScript().getRemainingUsage() );

        // ********************************* PARAMETERS *********************************
        var createHoldRecords = true; // Turn on/off creating the hold records for testing purposes
        var cancelPISBs = true;
        var emailList = JSON.parse(appSettings.readAppSetting("General Settings", "Duplicate PI and PISB email list") );
        var savedSearchIdJSON = JSON.parse(appSettings.readAppSetting("General Settings", "PI and PISB Duplicates Saved Searches") );
        var emailFrom = emailList.emailFrom //268072; //FROM: SRS Acquiom statements@srsacquiom.com
        var domainURL = url.resolveDomain({ 
            hostType: url.HostType.APPLICATION
        });
        var PaymentInstructionURL = "";
        var emailDupePIs = "";
        var subSts = piListLib.piEnum.subSts;
        var payInstrHoldSts = piListLib.piEnum.payInstrHoldSts;
        var paymtSuspenseReason = piListLib.piEnum.paymtSuspenseReason;
        var paymtInstrHoldReason = piListLib.piEnum.paymtInstrHoldReason;
        var paymtInstrHoldSrc = piListLib.piEnum.paymtInstrHoldSrc;
        var piType = piListLib.piEnum.piType;
        // ********************************* /PARAMETERS ********************************
        

        // LOAD SEARCHES
        try{
            var PIsavedSearch = search.load({
                id: savedSearchIdJSON.PI    // customsearch_dupe_pi_scripted
            });
            var PISBsavedSearch = search.load({
                id: savedSearchIdJSON.PISB  // customsearch_dupe_pisb_scripted
            });                    
            log.debug('DUPLICATE DETECTION-start',' PI='+savedSearchIdJSON.PI+' PISB='+savedSearchIdJSON.PISB + ' emailTo='+emailList);
        } catch(e) {
            log.error('SAVED SEARCHES MISSING', e.message);
        }



        // ******************************************************************
        // now start the PI SUBMISSION DUPLICATE DETECTION here
        // ******************************************************************

        // PISB 1. 
        // RUN SEARCH : PISB
        var searchResults = PISBsavedSearch.run();
        searchResults = searchLibrary.getSearchResultData(searchResults)
        log.debug({
            title: 'loadAndRunSearch-PISB',
            details: 'searchResults.length='+searchResults.length
        });
        var searchResultsLength = searchResults.length;


        // PISB 2. 
        // Create JSON array of saved search data
        var PISBdupes = [];
        for (var i=0; i<searchResultsLength; i++){
            // this part is so stupid, you cannot get values of multiple formula fields so I must manipulate the JSON data to get the data
            var searchResultsJSON = searchResults[i].toJSON();
            var searchResultsJSONstring = JSON.stringify(searchResultsJSON);
            var searchResultsJSONparse = JSON.parse( searchResultsJSONstring.replace("MIN(formulatext)","internal_ids").replace("MIN(formulatext)_1", "payment_methods") );
            var internal_ids = searchResultsJSONparse.values.internal_ids;
            var payment_methods = searchResultsJSONparse.values.payment_methods;

            PISBdupes.push({
                'custrecord_pisb_shareholder'            :   searchResults[i].getValue({"name": "custrecord_pisb_shareholder", "summary": search.Summary.GROUP}),
                'custrecord_pisb_paymt_instr_type'      :   searchResults[i].getValue({"name": "custrecord_pisb_paymt_instr_type", "summary": search.Summary.GROUP}),
                'custrecord_pisb_deal'                  :   searchResults[i].getValue({"name": "custrecord_pisb_deal", "summary": search.Summary.GROUP}),
                'custrecord_pisb_exchange'              :   searchResults[i].getValue({"name": "custrecord_pisb_exchange", "summary": search.Summary.GROUP}),
                'id_count'                              :   searchResults[i].getValue({"name": "id", "summary": search.Summary.COUNT}),
                'internal_ids'                          :   internal_ids, // ex: 1,2,3
                'payment_method'                        :   payment_methods,
                'PISB_send_email'                       :   [true],
                'custrecord_pisb_shareholderTEXT'       :   searchResults[i].getText({"name": "custrecord_pisb_shareholder", "summary": search.Summary.GROUP}),
                'custrecord_pisb_paymt_instr_typeTEXT'  :   searchResults[i].getText({"name": "custrecord_pisb_paymt_instr_type", "summary": search.Summary.GROUP}),
                'custrecord_pisb_dealTEXT'              :   searchResults[i].getText({"name": "custrecord_pisb_deal", "summary": search.Summary.GROUP}),
            });  
    
        } // end searchResults[i] loop



        // PISB 3.
        // Ex Rec Search for these PISBs store into "exRecSearchData" array
        // MAKE SURE THIS IS ONLY FOR PISBs, NOT PIs, add FILTER to ExRec Search
        var exRecSearchData = [];
        // get all PISB internal Ids into a 1-D array called internalIDsOfPISBdupes
        var internalIDsOfPISBdupes = [];
        for (var i=0; i<PISBdupes.length; i++){
            var setOfInternalIDs = PISBdupes[i].internal_ids.split(",");
            for (var ii=0; ii<setOfInternalIDs.length; ii++){
                internalIDsOfPISBdupes.push(setOfInternalIDs[ii]);
            }
        }
        if ( internalIDsOfPISBdupes.length != 0){
            log.debug('PISB 3. - RUNNING EXREC SEARCH', 'internalIDsOfPISBdupes='+internalIDsOfPISBdupes);
            // search the ExRecs and store the data for use in #5
            var customrecord_acq_lotSearchObj = search.create({
                type: "customrecord_acq_lot",
                filters:
                [
                   ["custrecord_exrec_paymt_instr_sub","anyof",internalIDsOfPISBdupes], 
                   "AND", 
                   ["isinactive","is","F"], 
                   "AND", 
                   ["custrecord_acq_loth_related_trans","anyof","@NONE@"], 
                   "AND", 
                   ["custrecord_suspense_reason","noneof",paymtSuspenseReason.DuplicatePISubm]     // @TODO eNum SUSPENSE REASON LIB paymtSuspenseReason.DuplicatePISubm=20
                ],
                columns:
                [
                   search.createColumn({name: "internalid", label: "Internal ID"}),
                   search.createColumn({
                      name: "id",
                      sort: search.Sort.ASC,
                      label: "ID"
                   }),
                   search.createColumn({name: "custrecord_acq_loth_related_trans", label: "Related Credit Memo Transaction"}),
                   search.createColumn({name: "custrecord_suspense_reason", label: "Payment Suspense Reason"}),
                   search.createColumn({name: "custrecord_exrec_paymt_instr_sub", label: "Payment Instruction Submission"})
                ]
             });
            var searchResultCount = customrecord_acq_lotSearchObj.runPaged().count;
            log.debug("PISB 3. - FINISH EXREC SEARCH-customrecord_acq_lotSearchObj result count",searchResultCount);
            
            // if any of these ExRecs w/ PISB #'s are found then update the ExRec's reason
            if (searchResultCount > 0){
                customrecord_acq_lotSearchObj.run().each(function(result){

                    // add Suspense Reason "Duplicate PI Submissions
                    var ExRecInternalID = result.getValue({ name : 'internalid' });
                    var ExRecSuspenseReason = [result.getValue({ name : 'custrecord_suspense_reason' })];      
                    var ExRecPISBinternalID = result.getValue({name: "custrecord_exrec_paymt_instr_sub"})
                    ExRecSuspenseReason = [paymtSuspenseReason.DuplicatePISubm];   // @TODO suspense reason 20 = "Canceled PI Submissions (Cust Merge)" 

                    //store all this data in an array to update the ExRecs in #5
                    exRecSearchData.push({
                        'ExRecInternalID'       :   ExRecInternalID,
                        'ExRecSuspenseReason'   :   ExRecSuspenseReason,
                        'ExRecPISBinternalID'   :   ExRecPISBinternalID
                    })

                    return true;
                });            
            }
            log.debug("PISB 3. - FINISH EXREC SEARCH" );
            log.audit('JSON.stringify(exRecSearchData)',JSON.stringify(exRecSearchData) )
        } // internalIDsOfPISBdupes loop




        // PISB 4. 
        // Cancel the PISBs & Cancel it's Hold
        log.debug('ATP-856 : PISB 4A. Cancel PISBs=');
        log.audit('JSON.stringify(PISBdupes)', JSON.stringify(PISBdupes) );
        if ( cancelPISBs == true){
            for (var i=0; i<PISBdupes.length; i++){
                log.audit('GOVERNANCE, -PISB 4.- i='+i, runtime.getCurrentScript().getRemainingUsage() );
                var internalIDsOfPISBdupes = PISBdupes[i].internal_ids.split(",");
                log.debug('ATP-856 : PISB 4B. Cancel PISBs', 'Batch '+ i +' of PISBs to Cancel = '+internalIDsOfPISBdupes);
                for (var ii=0; ii<internalIDsOfPISBdupes.length; ii++){

                    // Get PISB fields
                    try{
                        var PISBlookup = search.lookupFields({
                            type:   'customrecord_paymt_instr_submission' ,
                            id:     internalIDsOfPISBdupes[ii],
                            columns: ["custrecord_pisb_shareholder" ,"custrecord_pisb_paymt_instr_type" ,"custrecord_pisb_deal" ,"custrecord_pisb_exchange", "custrecord_pisb_updating_paymt_instr"]
                        });

                        if ( !Boolean(PISBlookup.custrecord_pisb_shareholder[0]) ){PISBlookup.custrecord_pisb_shareholder[0] = '';}
                        if ( !Boolean(PISBlookup.custrecord_pisb_paymt_instr_type[0]) ){PISBlookup.custrecord_pisb_paymt_instr_type[0] = '';}
                        if ( !Boolean(PISBlookup.custrecord_pisb_deal[0]) ){PISBlookup.custrecord_pisb_deal[0] = '';}
                        if ( !Boolean(PISBlookup.custrecord_pisb_exchange[0]) ){PISBlookup.custrecord_pisb_exchange[0] = '';}
                        if ( !Boolean(PISBlookup.custrecord_pisb_updating_paymt_instr[0]) ){PISBlookup.custrecord_pisb_updating_paymt_instr[0] = '';}
                        log.debug('PISBlookup', 'SH='+PISBlookup.custrecord_pisb_shareholder[0].value +' Type='+PISBlookup.custrecord_pisb_paymt_instr_type[0].value+' Deal='+ PISBlookup.custrecord_pisb_deal[0].value+' ExRec='+PISBlookup.custrecord_pisb_exchange[0].value+' targetPI='+PISBlookup.custrecord_pisb_updating_paymt_instr[0] );

                        // Check to see which HOLD the PISB is related to
                        var customrecord_paymt_instr_holdSearchObj = search.create({
                            type: "customrecord_paymt_instr_hold",
                            filters:
                            [
                                ["custrecord_pihd_submission","anyof", internalIDsOfPISBdupes[ii] ], 
                                "AND", 
                                ["custrecord_pihd_hold_status","anyof", payInstrHoldSts.Open ]  // open status
                            ],
                            columns:
                            [
                                search.createColumn({
                                    name: "id",
                                    sort: search.Sort.ASC
                                }),
                                "internalid",
                                "custrecord_pihd_paymt_instr",
                                "custrecord_pihd_hold_reason",
                                "custrecord_pihd_hold_status"
                            ]
                            });
                        var searchResultCount = customrecord_paymt_instr_holdSearchObj.runPaged().count;
                        log.debug("customrecord_paymt_instr_holdSearchObj result count",searchResultCount);
                        var PISBholdInternalid = null;
                        var PISBholdStatus = null;
                        customrecord_paymt_instr_holdSearchObj.run().each(function(result){
                            PISBholdInternalid = result.getValue({name:'internalid'})
                            PISBholdStatus = result.getValue({name:'custrecord_pihd_hold_status'})
                            return true;
                        });
                    }catch(e){
                        log.error('PISB 4B-2. ERR', e.message);
                    }


                    // CANCEL THE PISB
                    log.debug('ATP-856 : PISB 4C - hold status BEFORE', 'status='+ PISBholdStatus + ' id='+PISBholdInternalid+' internalIDsOfPISBdupes[ii]='+internalIDsOfPISBdupes[ii]);
                    try{
                        record.submitFields({   // doing this clears the ExRec's PISB # and Suspense Reason
                            type:   'customrecord_paymt_instr_submission', 
                            id:     internalIDsOfPISBdupes[ii], 
                            values: {
                                'custrecord_pisb_submission_status'   :   subSts.Canceled  // Canceled = 8
                            },
                            options: {
                                enableSourcing          : false,
                                ignoreMandatoryFields   : true
                            }
                        });
                    }catch(e){
                        log.error('PISB 4C. ERROR Canceling PISB', e.message);
                    }



                    // Get HOLD status
                    try{
                        var PISBholdlookup = search.lookupFields({
                            type:   'customrecord_paymt_instr_hold' ,
                            id:     PISBholdInternalid,
                            columns: ["custrecord_pihd_hold_status"]
                        });
                        if (PISBholdlookup.custrecord_pihd_hold_status[0] == null){ PISBholdlookup.custrecord_pihd_hold_status[0] = ''}
                        log.debug('ATP-856 : PISB 4C - hold status AFTER', 'status='+ JSON.stringify(PISBholdlookup.custrecord_pihd_hold_status[0]) );


                        // CANCEL THE PISB's HOLD ( checking if it created one )
                        if (PISBlookup.custrecord_pisb_updating_paymt_instr[0] != null){    //if PISB has a related PI

                            // CANCEL THE HOLD
                            if (PISBholdInternalid){
                                try {

                                    // CANCEL the Hold
                                    record.submitFields({
                                        type: 'customrecord_paymt_instr_hold',
                                        id: PISBholdInternalid,
                                        values: {
                                            custrecord_pihd_hold_status: payInstrHoldSts.Canceled
                                        },
                                        options: {
                                            enableSourcing: false,
                                            ignoreMandatoryFields: true
                                        }
                                    });
                                    log.debug('PISB 4D : ATP-856 - CANCELED HOLD', 'hold id='+PISBholdInternalid );
                                } catch (e) {
                                    log.error('ATP-856 - PISB 4D hold', e.message);
                                }                            
                            }
                        }
                    } catch(e){
                        log.error('ATP-856 PISB 4.', 'error probably because theres no holds for this PISB e=' + e.message );
                    }

                }
            }
        }



        // PISB 5. 
        // For each Exchange Record add Suspense Reason "Duplicate PI Submissions"
        // if any of these ExRecs w/ PISB #'s are found in #3 then update the ExRec's reason
        if (exRecSearchData.length > 0){
            for ( var i in exRecSearchData){
                log.debug('ATP-856 : PISB 5. - ExRec', 'setting ExRec '+exRecSearchData[i].ExRecInternalID+' suspense reason='+exRecSearchData[i].ExRecSuspenseReason );
                try{
                    record.submitFields({
                        type: 'customrecord_acq_lot',
                        id:  exRecSearchData[i].ExRecInternalID,
                        values: {
                            'custrecord_suspense_reason'        :   exRecSearchData[i].ExRecSuspenseReason
                        },
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields : true
                        }
                    });      
                } catch(e){
                    log.error('ATP-856 : PISB 5. - ExRec trying to submitField', 'ERROR='+e.message );
                }
            }
        }


        // PISB finished!
        log.debug('TASK COMPLETED 1/3 (PISB) total sets of PISB dupes='+searchResultsLength );
        log.audit('JSON.stringify(PISBdupes)',JSON.stringify(PISBdupes));






        // ******************************************************************
        // *        Now Start the PI DUPLICATE DETECTION here               *
        // ******************************************************************

        // PI 6. 
        // RUN SEARCH : PI
        var searchResults = PIsavedSearch.run();
        searchResults = searchLibrary.getSearchResultData(searchResults)
        log.debug({
            title: 'loadAndRunSearch-PI',
            details: 'searchResults.length='+searchResults.length
        });
        var searchResultsLength = searchResults.length;

        // Create JSON array of saved search data
        var PIdupes = [];
        for (var i=0; i<searchResultsLength; i++){
            var PI_send_email = [];
            // this part is so stupid, you cannot get values of multiple formula fields so I must manipulate the JSON data
            var searchResultsJSON = searchResults[i].toJSON();
            var searchResultsJSONstring = JSON.stringify(searchResultsJSON);
            var searchResultsJSONparse = JSON.parse( searchResultsJSONstring.replace("MIN(formulatext)","internal_ids").replace("MIN(formulatext)_1", "payment_methods").replace("MIN(formulatext)_2", "payment_type").replace("MIN(formulatext)_3", "deal").replace("MIN(formulatext)_4", "exchange_record") ); //.replace("MIN(formulatext)_2", "PI_type").replace("MIN(formulatext)_3", "PI_deal")
            var internal_ids = searchResultsJSONparse.values.internal_ids;
            var payment_methods = searchResultsJSONparse.values.payment_methods;
            var payment_type = searchResultsJSONparse.values.payment_type;
            var exchange_record = searchResultsJSONparse.values.exchange_record;
            var deal = searchResultsJSONparse.values.deal;

            if (Boolean(internal_ids)){ internal_ids = internal_ids.split(","); }
            if (Boolean(payment_methods)){ payment_methods = payment_methods.split(","); }
            if (Boolean(payment_type)){ payment_type = payment_type.split(","); }
            if (Boolean(exchange_record)){ exchange_record = exchange_record.split(","); }
            if (Boolean(deal)){ deal = deal.split(","); }
            var custrecord_pi_paymt_instr_type = searchResults[i].getValue({"name": "custrecord_pi_paymt_instr_type", "summary": search.Summary.GROUP});
            
            if (custrecord_pi_paymt_instr_type == piType.ExchangeRecord ){  //@TODO payment type eNum  11=ExchangeRecord -- map the dupes for ExRecs
                var counts = {}
                // code below is to count the times we see the ame exRec link to see if its a dupe, the array looks like this = {exRec Internal ID, Number of times we see it}
                exchange_record.forEach(function(ex) { counts[ex] = (counts[ex] || 0)+1; });    // ex: {"644694" : 2}
                var counts = Object.keys(counts).map(function(key) {                            // 0: Array(2)
                    return [Number(key), counts[key]];                                          //      0: 644694
                });                                                                             //      1: 2
                var ExRecOrDealDupe = [];
                for (var z = 0; z < exchange_record.length; z++) {
                    var match = false;
                    for (var j = 0; j < counts.length; j++) {
                        if (exchange_record[z] == counts[j][0] && counts[j][1] > 1 ) {
                            match = true;
                            break;
                        }
                    }
                    if (!match) {
                        ExRecOrDealDupe.push(false);
                        PI_send_email.push(false);
                    } else 
                    { 
                        ExRecOrDealDupe.push(true);
                        PI_send_email.push(true);
                    }
                }
            } else if (custrecord_pi_paymt_instr_type == piType.AcquiomDeal ){  // @TODO eNum map dupes for AcquiomDeals = 10
                // count the Deals like we counted the ExRecs
                var counts = {}
                deal.forEach(function(ex) { counts[ex] = (counts[ex] || 0)+1; });   // ex: {"644694" : 2}
                var counts = Object.keys(counts).map(function(key) {                // 0: Array(2)
                    return [key, counts[key]];                                      //      0: DealABC
                });                                                                 //      1: 2
                var ExRecOrDealDupe = [];
                for (var z = 0; z < deal.length; z++) {
                    var match = false;
                    for (var j = 0; j < counts.length; j++) {
                        if (deal[z] == counts[j][0] && counts[j][1] > 1 ) {
                            match = true;
                            break;
                        }
                    }
                    if (!match) {
                        ExRecOrDealDupe.push(false);
                        PI_send_email.push(false);
                    } else 
                    { 
                        ExRecOrDealDupe.push(true);
                        PI_send_email.push(true);
                    }
                }
            } else {
                var ExRecOrDealDupe = [];
                PI_send_email.push(true);
            }

            // all the PIs we will process will be stored in this array
            PIdupes.push({
                'custrecord_pi_shareholder'     :   searchResults[i].getValue({"name": "custrecord_pi_shareholder", "summary": search.Summary.GROUP}),
                'custrecord_pi_paymt_instr_type':   custrecord_pi_paymt_instr_type,
                'custrecord_pi_deal'            :   searchResults[i].getValue({"name": "custrecord_pi_deal", "summary": search.Summary.GROUP}),
                'id_count'                      :   searchResults[i].getValue({"name": "id", "summary": search.Summary.COUNT}),
                'internal_ids'                  :   internal_ids,
                'payment_method'                :   payment_methods,
                'payment_type'                  :   payment_type,
                'exchange_record'               :   exchange_record,
                'deal'                          :   deal,
                'ExRecOrDealDupe'               :   ExRecOrDealDupe,
                'PI_send_email'                 :   PI_send_email,
                'ON_DUPE_HOLD'                  :   [],
                'CREATED_DUPE_HOLD'             :   [],
                'custrecord_pi_shareholderTEXT'     :   searchResults[i].getText({"name": "custrecord_pi_shareholder", "summary": search.Summary.GROUP}),
                'custrecord_pi_paymt_instr_typeTEXT':   searchResults[i].getText({"name": "custrecord_pi_paymt_instr_type", "summary": search.Summary.GROUP}),
                'custrecord_pi_dealTEXT'            :   searchResults[i].getText({"name": "custrecord_pi_deal", "summary": search.Summary.GROUP}),
            });                
        }
        log.audit('PI 6. FINISHED **********', '******************');
        log.audit('PI 6. PIdupes len='+PIdupes.length , JSON.stringify( PIdupes ) );
        log.audit('PI 6. FINISHED **********', '******************');



        // PI 7. - Add 'ON_DUPE_HOLD' to array (true/false) if the PI's hold rec contains Dupe Reason
        // concatinate array of all the PIs form the search
        var allPIinternalIDs = [];
        for (var i=0; i<PIdupes.length; i++){
            allPIinternalIDs.push(PIdupes[i].internal_ids)
        }
        // flatten array
        var allPIinternalIDs = [].concat.apply([], allPIinternalIDs);
        var holdPIID = [];
      
      log.debug('allPIinternalIDs',allPIinternalIDs);
      log.debug('BOOLEAN allPIinternalIDs', Boolean(allPIinternalIDs) );

        // find Open Dupe Holds and add their hold status 
     if ( allPIinternalIDs.length > 0){
        var customrecord_paymt_instr_holdSearchObj = search.create({
            type: "customrecord_paymt_instr_hold",
            filters:
            [
               ["custrecord_pihd_paymt_instr","anyof", allPIinternalIDs], 
               "AND", 
               ["custrecord_pihd_hold_reason","anyof",paymtInstrHoldReason.Duplicate],     // @TODO eNUm 7 = paymtInstrHoldReason.Duplicate
               "AND", 
               ["custrecord_pihd_hold_status","anyof",payInstrHoldSts.Open]      // @TODO eNum 1 = payInstrHoldSts.Open
            ],
            columns:
            [
               search.createColumn({
                  name: "custrecord_pihd_paymt_instr",
                  summary: "GROUP"
               })
            ]
         });
         var searchResultCount = customrecord_paymt_instr_holdSearchObj.runPaged().count;
         log.debug("customrecord_paymt_instr_holdSearchObj result count",searchResultCount);
         customrecord_paymt_instr_holdSearchObj.run().each(function(result){
            // loop thru and add to matching PI
            log.debug( 'holdPIID.push', result.getValue({"name": "custrecord_pihd_paymt_instr", "summary": search.Summary.GROUP}));
            holdPIID.push( result.getValue({"name": "custrecord_pihd_paymt_instr", "summary": search.Summary.GROUP}) );
            return true;
         });          
        }



        // PI 7A. Update the ON_DUPE_HOLD from the above search
        for (var i=0; i<PIdupes.length; i++){                       // i = PIdupes array
            for (var x=0; x<PIdupes[i].internal_ids.length; x++){   // x = internal IDs
                for (var y=0; y<holdPIID.length; y++){              // y = array of ids with dupe holds
                    if ( PIdupes[i].internal_ids[x] == holdPIID[y] ){
                        PIdupes[i].ON_DUPE_HOLD[x] = holdPIID[y];
                    }
                }
            }
        }

        // PI 7B. clean up our array by removing any of those already on dupe hold
        // now remove all the PIdupes that Are All ON_DUPE_HOLD = true
        for (var i=0; i<PIdupes.length; i++){
            var totalDupeHoldCount = 0;

            // count where all the ON_DUPE_HOLD = an internal id
            for (var x=0; x<PIdupes[i].internal_ids.length; x++){
                if ( Boolean(PIdupes[i].ON_DUPE_HOLD[x]) ){
                    totalDupeHoldCount++
                }
            }

            // if all the internal ids ON_DUPE_HOLDs then its OK to delete from array
            log.audit('PI 7B. end ****** i='+i+' totalDupeHoldCount='+totalDupeHoldCount, 'PIdupes[i].ON_DUPE_HOLD.length == totalDupeHoldCount -> '+(PIdupes[i].ON_DUPE_HOLD.length == totalDupeHoldCount) + '   ----PIdupes[i].internal_ids.length='+PIdupes[i].internal_ids.length + ' PIdupes[i].ON_DUPE_HOLD.length='+PIdupes[i].ON_DUPE_HOLD.length );
            if (PIdupes[i].ON_DUPE_HOLD.length == totalDupeHoldCount && PIdupes[i].ON_DUPE_HOLD.length == PIdupes[i].internal_ids.length ){
                PIdupes.splice(i,1);
                i-- // we modified the array with splice, so accounting for that
            }

        }

         log.audit('PI 7. FINISHED **********', '******************');
         log.audit('PI 7. PIdupes len='+PIdupes.length , JSON.stringify( PIdupes ) );
         log.audit('PI 7. FINISHED **********', '******************');



        // PI 8. 
        // for each Shareholder we will get their ExRecs with matching PI
        // Ex Rec Search for these PIs store into "exRecSearchData" array
        for (var i=0; i<PIdupes.length; i++){
            log.audit('GOVERNANCE, -PI 7.- i='+i, runtime.getCurrentScript().getRemainingUsage() );
            log.debug('PI 7. PIdupes array i='+i+' PIdupes.length='+PIdupes.length);
            log.audit('JSON.stringify(PIdupes) ',JSON.stringify(PIdupes) );

            var exRecSearchData = [];
            if ( PIdupes[i].internal_ids.length != 0 && PIdupes[i].payment_type.indexOf("Exchange Record") != -1 ){
                log.debug('PI 8. - RUNNING EXREC SEARCH', 'PIdupes[i].internal_ids='+PIdupes[i].internal_ids);
                
                // search the ExRecs and store the data for use in #5
                var customrecord_acq_lotSearchObj_2 = search.create({
                    type: "customrecord_acq_lot",
                    filters:
                    [
                    ["custrecord_exrec_payment_instruction","anyof", PIdupes[i].internal_ids ], 
                    "AND",
                    ["isinactive","is","F"], 
                    "AND", 
                    ["custrecord_acq_loth_related_trans","anyof","@NONE@"], 
                    "AND", 
                    ["custrecord_suspense_reason","noneof", paymtSuspenseReason.DuplicatePISubm ]    // 20 = paymtSuspenseReason.DuplicatePISubm
                    ],
                    columns:
                    [
                    search.createColumn({name: "internalid", label: "Internal ID"}),
                    search.createColumn({
                        name: "id",
                        sort: search.Sort.ASC,
                        label: "ID"
                    }),
                    search.createColumn({name: "custrecord_acq_loth_related_trans", label: "Related Credit Memo Transaction"}),
                    search.createColumn({name: "custrecord_suspense_reason", label: "Payment Suspense Reason"}),
                    search.createColumn({name: "custrecord_exrec_paymt_instr_sub", label: "Payment Instruction Submission"})
                    ]
                });
                var searchResultCount = customrecord_acq_lotSearchObj_2.runPaged().count;
                log.debug("PI 8. - FINISH EXREC SEARCH-customrecord_acq_lotSearchObj_2 result count",searchResultCount);
                
                // if any of these ExRecs w/ PISB #'s are found then update the ExRec's reason
                if (searchResultCount > 0){
                    customrecord_acq_lotSearchObj_2.run().each(function(result){

                        // add Suspense Reason "Duplicate PI Submissions"
                        var ExRecInternalID = result.getValue({ name : 'internalid' });
                        var ExRecSuspenseReason = [result.getValue({ name : 'custrecord_suspense_reason' })];
                        var ExRecPIinternalID = result.getValue({name: "custrecord_exrec_paymt_instr_sub"})
                        ExRecSuspenseReason = [paymtSuspenseReason.DuplicatePI];   // @TODO suspense reason 19 = paymtSuspenseReason.DuplicatePI "Duplicate Paymt Instrs"

                        //store all this data in an array to update the ExRecs in #5
                        exRecSearchData.push({
                            'ExRecInternalID'       :   ExRecInternalID,
                            'ExRecSuspenseReason'   :   ExRecSuspenseReason,
                            'ExRecPIinternalID'     :   ExRecPIinternalID
                        })

                        return true;
                    });            
                }
                log.audit("PI 8. - FINISH EXREC SEARCH-exRecSearchData=", JSON.stringify(exRecSearchData) );
            }



            // PI 9. Create HOLD records for EACH of these dupes (extra checks for Pi type of ExRec & AcquiomDeal)
            log.audit('PI 9. PIdupes JSON', JSON.stringify(PIdupes) );
            log.audit('PI 9. dupe Internal IDs i='+i, 'PIdupes[i].internal_ids='+JSON.stringify(PIdupes[i].internal_ids) );
            for (var x=0; x<PIdupes[i].internal_ids.length; x++){
                
                log.audit('PI 9. PIdupes['+ i +'].ON_DUPE_HOLD['+x+']', PIdupes[i].ON_DUPE_HOLD[x] );
                    var holdRecord = record.create({
                        type: 'customrecord_paymt_instr_hold'
                    });

                    // Submit the HOLD record
                    try{
                        // PI type of exchange record || acquiom deal = check if same ExRec on these PIs
                        if (PIdupes[i].custrecord_pi_paymt_instr_type == piType.ExchangeRecord || PIdupes[i].custrecord_pi_paymt_instr_type == piType.AcquiomDeal && PIdupes[i].ON_DUPE_HOLD[x] != PIdupes[i].internal_ids[x] ){   //@TODO eNum 10=piType.AcquiomDeal  11=piType.ExchangeRecord
                            if ( PIdupes[i].ExRecOrDealDupe[x] == true ){
                                if (createHoldRecords == true && !Boolean(PIdupes[i].ON_DUPE_HOLD[x])  ){
                                    var holdRecordFields = {
                                        custrecord_pihd_paymt_instr : PIdupes[i].internal_ids[x],
                                        custrecord_pihd_hold_reason : paymtInstrHoldReason.Duplicate,   //@TODO eNum    7 = paymtInstrHoldReason.Duplicate
                                        custrecord_pihd_hold_status : payInstrHoldSts.Open,             //@TODO eNum    1 = payInstrHoldSts.Open
                                        custrecord_pihd_hold_src : paymtInstrHoldSrc.Script             //@TODO eNum    4 = paymtInstrHoldSrc.Script
                                    };
                                    for (var prop in holdRecordFields) {
                                        holdRecord.setValue({
                                            fieldId: prop,
                                            value: holdRecordFields[prop]
                                        });
                                    }
                                    holdRecord.save();                                    
                                    PIdupes[i].ON_DUPE_HOLD[x] = PIdupes[i].internal_ids[x];    // update the array now that its on hold
                                    PIdupes[i].CREATED_DUPE_HOLD[x] = PIdupes[i].internal_ids[x];   // make sure to know to email it later
                                    log.debug('PI 9. CREATING HOLD REC','PI='+PIdupes[i].internal_ids[x]+' TYPE='+PIdupes[i].custrecord_pi_paymt_instr_type);
                                }
                            }
                        }
                        // *****************************************************************************
                        //                             SAVE THE HOLD RECORD
                        // *****************************************************************************
                        if (createHoldRecords == true && PIdupes[i].custrecord_pi_paymt_instr_type != piType.AcquiomDeal && PIdupes[i].custrecord_pi_paymt_instr_type != piType.ExchangeRecord && PIdupes[i].ON_DUPE_HOLD[x] != PIdupes[i].internal_ids[x]){   //@TODO eNum
                            var holdRecordFields = {
                                custrecord_pihd_paymt_instr : PIdupes[i].internal_ids[x],
                                custrecord_pihd_hold_reason : paymtInstrHoldReason.Duplicate,   //@TODO eNum 7=paymtInstrHoldReason.Duplicate
                                custrecord_pihd_hold_status : payInstrHoldSts.Open,             //@TODO eNum 1=payInstrHoldSts.Open
                                custrecord_pihd_hold_src : paymtInstrHoldSrc.Script             //@TODO eNum 4=paymtInstrHoldSrc.Script
                            };
                            for (var prop in holdRecordFields) {
                                holdRecord.setValue({
                                    fieldId: prop,
                                    value: holdRecordFields[prop]
                                });
                            }
                            holdRecord.save();
                            // very important we update the arrays we created at the beginning now that we just put it on dupe hold
                            PIdupes[i].ON_DUPE_HOLD[x] = PIdupes[i].internal_ids[x];    // update ON_DUPE_HOLD Array now that we created the hold rec
                            PIdupes[i].CREATED_DUPE_HOLD[x] = PIdupes[i].internal_ids[x];   // want to know that we created a hold via script so we know to email it out later
                            log.debug('PI 9. DUPLICATE PI DETECTION- saved hold rec for PI '+ PIdupes[i].internal_ids[x] +' as dupe', 'saved holdrec='+holdRecord.getValue({fieldId : 'internalid'}) );
                        }
                        // *****************************************************************************
                    } catch(e){
                        log.error('DUPLICATE PI DETECTION-marking PI as dupe', e.message );
                    }

                // Aggreagte info for the email
                PaymentInstructionURL = url.resolveRecord({
                    recordType: 'customrecord_paymt_instr',
                    recordId: PIdupes[i].internal_ids[x]
                });
                if ( !PIdupes[i].custrecord_pi_dealTEXT ){ var PIdeal = "" } else { var PIdeal = ", for Deal: "+ PIdupes[i].custrecord_pi_dealTEXT; }
                var emailDupePIs = emailDupePIs + "<a href='https://"+ domainURL + PaymentInstructionURL + "'> Duplicate PI: "+ PIdupes[i].internal_ids[x] +"</a> for Payment Instruction Type: "+ PIdupes[i].custrecord_pi_paymt_instr_typeTEXT +", using Payment Method: "+ PIdupes[i].payment_method[x] + PIdeal + "<br/><br/>";                    

            }   // end loop of "x" internal ids


            // PI 10. ADD Suspense Reason if there's a PISB canceled for these PIs
            // This code here was an attempt to add the canceled PISB suspense reason
            log.debug('PI 11.A checking to add suspense', 'internalIDsOfPIdupes='+PIdupes[i].internal_ids );

            // PI 10.A check to see if there are PISBs related to these PIs that are CANCELED
            var PISBsCanceled = [];
            var customrecord_paymt_instr_submissionSearchObj_suspense = search.create({
                type: "customrecord_paymt_instr_submission",
                filters:
                [
                   ["custrecord_pisb_updating_paymt_instr","anyof", PIdupes[i].internal_ids ], 
                   "AND", 
                   ["custrecord_pisb_submission_status","anyof", subSts.Canceled ]  // 8 = Substs.Canceled
                ],
                columns:
                [
                   search.createColumn({
                      name: "id",
                      sort: search.Sort.ASC
                   }),
                   "custrecord_pisb_submission_status"
                ]
             });
             var searchResultCount = customrecord_paymt_instr_submissionSearchObj_suspense.runPaged().count;
             log.debug("customrecord_paymt_instr_submissionSearchObj result count",searchResultCount);
             customrecord_paymt_instr_submissionSearchObj_suspense.run().each(function(result){
                PISBsCanceled.push(result.getValue({name:'id'}));
                return true;
             });

             // PI 10.B we found canceled PISBs related to these PIs, see what ExRecs we got then
             if (searchResultCount>0){
                var ExRecData = [];

                // PI 10.C get the ExRec's internal id & suspense reason
                var customrecord_acq_lotSearchObj_suspense = search.create({
                    type: "customrecord_acq_lot",
                    filters:
                    [
                       ["custrecord_exrec_payment_instruction","anyof", PIdupes[i].internal_ids], 
                       "OR", 
                       ["custrecord_exrec_paymt_instr_sub","anyof", PISBsCanceled ]
                    ],
                    columns:
                    [
                       search.createColumn({
                          name: "id",
                          sort: search.Sort.ASC
                       }),
                       "custrecord_suspense_reason",
                       "custrecord_exrec_payment_instruction",
                       "custrecord_exrec_paymt_instr_sub"
                    ]
                 });
                 var searchResultCount = customrecord_acq_lotSearchObj_suspense.runPaged().count;
                 log.debug("customrecord_acq_lotSearchObj_suspense result count",searchResultCount);
                 customrecord_acq_lotSearchObj_suspense.run().each(function(result){
                    ExRecData.push({
                        ExRecID         :  result.getValue({name:'id'}),
                        ExRecSuspense   :  result.getValue({name:'custrecord_suspense_reason'})
                    });

                    return true;
                 });

                 log.audit('PI 10.C add suspense', 'ExRecData='+JSON.stringify(ExRecData) );


                // PI 10.D ADD the suspense reason to each ExRec we found
                if (ExRecData.length > 0){
                    for (var s=0; s < ExRecData.length; s++){

                        // Add the suspense reason if it's not already there
                        var newSuspenseReason = [];
                        newSuspenseReason.push(ExRecData[s].ExRecSuspense);
                        if (newSuspenseReason[0].indexOf(paymtSuspenseReason.DuplicatePISubm) == -1 ){     //@TODO eNum 20 = paymtSuspenseReason.DuplicatePISubm
                            newSuspenseReason.push(paymtSuspenseReason.DuplicatePISubm);                   //@TODO eNum 20 = paymtSuspenseReason.DuplicatePISubm
                        }

                        log.debug('PI 10.D add suspense', 'ExRecData[s].ExRecID='+ExRecData[s].ExRecID + ' newSuspenseReason='+newSuspenseReason+ ' ExRecData[s].ExRecSuspense==newSuspenseReason is '+(ExRecData[s].ExRecSuspense == newSuspenseReason) );

                        if (ExRecData[s].ExRecSuspense != newSuspenseReason){
                            try{
                                record.submitFields({
                                    type: 'customrecord_acq_lot',
                                    id:  ExRecData[s].ExRecID ,
                                    values: {
                                        'custrecord_suspense_reason'    :   newSuspenseReason
                                    },
                                    options: {
                                        enableSourcing: false,
                                        ignoreMandatoryFields : true
                                    }
                                });
                            }catch(e){
                                log.error('PI 10.D - ERROR adding suspense reason',e.message)
                            }

                        }

                    }
                }

             } // canceled PISB found

        } // end searchResults[i] loop ( main PI loop )
        log.debug('COMPLETED 2/3! i='+i+' total sets of PI dupes='+searchResultsLength );
        log.audit('JSON.stringify(PIdupes)', JSON.stringify(PIdupes))







        // ***************************************************************
        // *         Now, Email the PI & PISB to each shareholder        *
        // ***************************************************************
        // Combine the PI and PISB arrays
        // PIdupes
        // PISBdupes

        // Email 11.
        // remove the duplicates so its one shareholder per set of PI & PISB
        var allData = [];
        for (var i=0; i<PIdupes.length; i++){
            PIdupes[i]['type'] = 'PI';
            PIdupes[i]['SH'] = PIdupes[i]['custrecord_pi_shareholder'];
            PIdupes[i]['SHtext'] = PIdupes[i]['custrecord_pi_shareholderTEXT'];
            PIdupes[i]['hasDupeHoldRecord'] = true; //these are all true
        }

        for (var i=0; i<PISBdupes.length; i++){
            PISBdupes[i]['type'] = 'PISB';
            PISBdupes[i]['SH'] = PISBdupes[i]['custrecord_pisb_shareholder'];
            PISBdupes[i]['SHtext'] = PISBdupes[i]['custrecord_pisb_shareholderTEXT'];


            for (var pi=0; pi<PIdupes.length; pi++){
                if (PISBdupes[i]['SH'] == PIdupes[pi]['SH'] ){   //matching ShareHolder from PI
                    PISBdupes[i]['hasDupeHoldRecord'] = true;
                } else {
                    PISBdupes[i]['hasDupeHoldRecord'] = false;
                }
            }

        }

        // allData will contain all the PI and PISB dupes so we can send 1 email per Shareholder
        allData = PIdupes.concat(PISBdupes);

        // helper function
        var groupBy = function(xs, key) {
            return xs.reduce(function(rv, x) {
            (rv[x[key]] = rv[x[key]] || []).push(x);
            return rv;
            }, {});
        };

        // Group all PI and PISBs by Shareholder & convert to Array
        var allData = groupBy(allData, 'SH')
        var allData = Object.keys(allData).map(function (i) {
            return allData[i];
        });

        // now, we create email message for PI & PISBs and send each ShareHolder an email
        var emailDupeMessage = "";
        var totalEmailsSent = 0;
        var allDataLength = allData.length;
        log.audit('@@@@@@@ allData, -Email- i=', JSON.stringify(allData) );

        for (var i=0; i<allDataLength; i++){    // loop thru EACH SHAREHOLDER
            log.audit('GOVERNANCE, -Email- i='+i, runtime.getCurrentScript().getRemainingUsage() );

            // Get the PI data together first
            var shareholderName = allData[i][0].SHtext;
            var shareholderURL = url.resolveRecord({
                recordType:         record.Type.CUSTOMER,
                params:{
                        "id": allData[i][0].SH
                }
            });
            var shareholderLink = "<a href='https://"+ domainURL + shareholderURL + "' >" + shareholderName + "</a>";
            var emailTo = emailList.emailTo; //"rbender@shareholderrep.com"; //["analysts@srsacquiom.com"]; // ADD APP SETTING PPL HERE: "analysts@srsacquiom.com",591101, 277600,72196,206497    (Matt Prestridge, Jason Morris, Glen Colthup and Mitch Eckberg)
            var emailSubject = "Duplicate PI or PI Submission Detected";
            var PIinternalids = [];
            var PISBinternalids = [];

            // i = each SH
            // x = each PI or PISB
            // y = each internal ID per PI or PISB
            // z = each internal ID inside DUPE HOLD
            var sendTheEmail = [];

            for (var x=0; x<allData[i].length; x++){ //loop thru each PI & PISB of the shareholder

                if (allData[i][x].type == "PI" ){
                    PIinternalids = allData[i][x].internal_ids
                    var payment_method = allData[i][x].payment_method
                    log.debug('Email 11. Creating Record Links', 'batch of: internal_ids='+internal_ids+' payment_methods='+payment_methods+' allData[i][x].ExRecOrDealDupe.indexOf(true)='+allData[i][x].ExRecOrDealDupe.indexOf(true) );
                    for (var y=0; y<PIinternalids.length; y++){

                        if ( allData[i][x].PI_send_email[y] != false ) {    // may be true, false, or undefined; we just care if its false, as to not include it in the email.

                            recordURL = url.resolveRecord({
                                recordType: 'customrecord_paymt_instr',
                                recordId: PIinternalids[y]
                            });
                            if (payment_method[y] == null || payment_method[y] == ''){ payment_method[y] = '- None -';}
                            if (Boolean(allData[i][x].custrecord_pi_dealTEXT) == false ){ allData[i][x].custrecord_pi_dealTEXT = '- None -'; }
                            emailDupeMessage = emailDupeMessage + "<a href='https://"+ domainURL + recordURL + "'> Duplicate PI: "+ PIinternalids[y] +"</a> for Payment Instruction Type: <b>"+ allData[i][x].custrecord_pi_paymt_instr_typeTEXT +"</b>, using Payment Method: <b>"+ payment_method[y] + '</b> for Deal <b>' + allData[i][x].custrecord_pi_dealTEXT + "</b><br/>";
                        }
                    }
                }

                if (allData[i][x].type == "PISB"){  // we need to check that we only mail out to the SH's listed on the PI array (because I cant see the HOLD rec from the PISB search, I dont want to send PISB alerts if they already have dupe HOLD recs)

                    PISBinternalids = allData[i][x].internal_ids.split(",");
                    var payment_method = allData[i][x].payment_method.split(",");
                    
                    for (var y=0; y<PISBinternalids.length; y++)
                    {
                        recordURL = url.resolveRecord({
                            recordType: 'customrecord_paymt_instr_submission',
                            recordId: PISBinternalids[y]
                        });
                        if (payment_method[y] == null || payment_method[y] == ''){ payment_method[y] = '- None -';}
                        emailDupeMessage = emailDupeMessage + "<a href='https://"+ domainURL + recordURL + "'> Duplicate PI Submission: "+ PISBinternalids[y] +"</a> for Payment Instruction Type: <b>"+ allData[i][x].custrecord_pisb_paymt_instr_typeTEXT +"</b>, using Payment Method: <b>"+ payment_method[y] + '</b> for Deal <b>' + allData[i][x].custrecord_pisb_dealTEXT + "</b><br/>";  
                    }        
                }


                // determine if we want to include each dupe in an email (e.g. dont include those already on dupe hold, unless we just put it on dupe hold in this script.)
                if (allData[i][x].type == "PISB"  ){
                    sendTheEmail.push(allData[i][x].PISB_send_email);  
                } else { 
                    sendTheEmail.push(false); 
                }

                if (allData[i][x].type == "PI"    ){
                    sendTheEmail.push(allData[i][x].PI_send_email);
                } else { 
                    sendTheEmail.push(false); 
                }

            } // end loop thru of each PI & PISB ( allData[i][y] )


            // Prepare and email the SH here
            var emailBody = "The following duplicate Payment Instruction and/or Payment Instr Submission records have been detected for <b>"+ shareholderLink +"</b>. For duplicate Payment Instructions, please create Paymt Instr Submission record(s) to inactivate the duplicate Payment Instruction(s). For duplicate Paymt Instr Submission records, please cancel the duplicate records.<br/><br/>" + emailDupeMessage;
            log.audit('SH='+ allData[i][0].SHtext+' sendemail='+sendTheEmail, emailBody);
            
                try{
                    var sendTheEmail = JSON.stringify(sendTheEmail)
                    log.audit('11. DUPLICATE PI DETECTION --- CHECKING to send email #'+parseInt(i+1), 'should we send this = '+sendTheEmail+ ' emailDupeMessage.len='+emailDupeMessage.length );
                    if ( sendTheEmail.indexOf(true) > -1 || sendTheEmail == true ){ //check to see if SH is ok to email
                        email.send({
                            author      : emailFrom,
                            recipients  : emailTo,
                            subject     : emailSubject,
                            body        : emailBody
                        });
                        totalEmailsSent = totalEmailsSent + 1;
                        log.debug('11. DUPLICATE PI DETECTION- SENT EMAIL #'+parseInt(i+1), 'for ShareHolder='+ allData[i][0].SHtext + ' for PI/PISB internalid(s)='+ allData[i][0].internal_ids + ' @@@ ExRecOrDealDupe='+ allData[i][0].ExRecOrDealDupe );
                        log.audit('**** EMAIL BODY ****', JSON.stringify(emailBody) )
                    }

                    var emailDupePIs = "";
                    var emailDupeMessage = "";
                } catch(e){
                    log.error('DUPLICATE PI DETECTION- ERROR sending email', e.message );
                }                        
            
        }   // loops thru each Shareholder ( allData[i] )
        log.audit('GOVERNANCE, -SCRIPT END-', runtime.getCurrentScript().getRemainingUsage() );
        log.debug('COMPLETED 3/3! (emailing) FINISHED DUPLICATE DETECTION, HOLD, & EMAIL - end' )        
        log.audit('JSON.stringify(allData)',JSON.stringify(allData))
        log.debug('totalEmailsSent='+totalEmailsSent);

    }

    return {
        execute: execute
    };	


}
);
