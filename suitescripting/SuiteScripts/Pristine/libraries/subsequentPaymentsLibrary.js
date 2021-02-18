/**
 * subsequentPaymentsLibrary.js
 * @NApiVersion 2.x
 * @NModuleScope public
 */

define(['N/format', 'N/search', 'N/email', 'N/url', 'N/runtime', '/SuiteScripts/Pristine/libraries/searchResultsLibrary.js'],

    /**
     * -----------------------------------------------------------
     * subsequentPaymentsLibrary.js
     * ___________________________________________________________
     * Offers helper functions for the Subsequent Payments creation process
     *
     * Version 1.0
     * Author: Alana Thomas
     * ___________________________________________________________
     */

    function(format, search, email, url, runtime, searchResultsLibrary) {


        function findDERsByDeal(deal, filters, columns) {
            // accepts a Deal ID, an array of nlobjFilter objects, and an array of nlobjColumn objects
            var myFilters = [];
            // default filters are (A) belonging to specified deal and (B) active
            myFilters.push(search.createFilter({
                name: 'custrecord_pay_import_deal',
                operator: 'is',
                values: deal
            }));
            myFilters.push(search.createFilter({
                name: 'isinactive',
                operator: 'is',
                values: 'F'
            }));
            for(var i = 0; i < filters.length; i++) {
                myFilters.push(filters[i]);
            }

            return search.create({
                type: 'customrecord_payment_import_record',
                columns: columns,
                filters: myFilters
            });
        }

        function findValidReleaseApprovals(thisDeal) {
            // first find all release records attached to DERS related to this deal
            var customFilters = [];
            customFilters.push(search.createFilter({
                name: 'custrecord_release_approval_record',
                operator: search.Operator.NONEOF,
                values: '@NONE@'
            }));
            var derSearch = findDERsByDeal(thisDeal, customFilters, ['custrecord_release_approval_record']).run();
            var derResults = searchResultsLibrary.getSearchResultData(derSearch);
            var usedReleases = [];
            for(var i = 0; i < derResults.length; i++) {
                var releaseResult = derResults[i].getValue({
                    name: 'custrecord_release_approval_record'
                });
                usedReleases.push(releaseResult);
            }

            // then find the unattached ones that fulfill the other criteria
            // (A) they are not attached to other DERs
            // (B) they are in 'Completed' status
            // filters
            var customFilters = [];
            if(usedReleases.length > 0) {
                customFilters.push(search.createFilter({
                    name: 'internalid',
                    operator: 'noneof',
                    values: usedReleases
                }));
            }
            customFilters.push(search.createFilter({
                name: 'custrecord_escrow_payment_status',
                operator: 'anyof',
                values: 6           // Release Approvals Status in 'COMPLETED' status from customlist_escrow_payment_app_status
            }));
            var releaseApprovalSearch = findReleaseApprovalsByDeal(thisDeal, customFilters, 
                ['internalid', 'name', 'custrecord_release_journals']).run(),
                releaseApprovals = searchResultsLibrary.getSearchResultData(releaseApprovalSearch); 

            // make list of all viable releases after checking statuses of all their journal entries
            // TODO: There has got to be a better way! How to get search to work with this 
            var releaseList = [];
            for(var i = 0; i < releaseApprovals.length; i++) {
                var journalEntries = releaseApprovals[i].getValue({
                    name: 'custrecord_release_journals'
                });
                var releasedFlag = false;

                if(journalEntries != '') {
                    var journalEntries = journalEntries.split(',');
                    for(var j = 0; j < journalEntries.length; j++) {    // ALL journal entries must be in COMPLETED status
                        var status = search.lookupFields({
                            type: search.Type.JOURNAL_ENTRY,
                            id: journalEntries[j],
                            columns: 'custbody_esc_tx_status'
                        }).custbody_esc_tx_status;
                        if(status == 'RELEASED') {
                            releasedFlag = true; 
                        } else {
                            releasedFlag = false;
                            break;
                        }
                    }            
                }

                if(releasedFlag) { // we got one that met the criteria! Add it to our viable release list.
                    var release = {};
                    release.internalid = releaseApprovals[i].getValue({
                        name: 'internalid'
                    });
                    release.name = releaseApprovals[i].getValue({
                        name: 'name'
                    });
                    releaseList.push(release);
                }
            }
            return releaseList;               
        }

        function findReleaseApprovalsByDeal(deal, filters, columns) {
            // accepts a Deal ID, an array of nlobjFilter objects, and an array of nlobjColumn objects
            // filters
            var myFilters = [];
            // default filters are (A) Release Approval is attached to the specified deal and (B) active
            myFilters.push(search.createFilter({
                name: 'custrecord_escrow_payment_deal',
                operator: 'is',
                values: deal
            }));
            myFilters.push(search.createFilter({
                name: 'isinactive',
                operator: 'is',
                values: 'F'
            }));  
            for(var i = 0; i < filters.length; i++) {
                myFilters.push(filters[i]);
            }  
            
            return search.create({
                type: 'customrecord_escrow_payment_approvals',
                columns: columns,
                filters: myFilters
            });       
        }

        function getDERbyExRec(exRecId) {
            var relatedDerLookup = search.lookupFields({
                type: 'customrecord_acq_lot',
                id: exRecId,
                columns: 'custrecord_acq_lot_payment_import_mpr_id'
            });
            return relatedDerLookup.custrecord_acq_lot_payment_import_mpr_id;
        }

        function getDealbyDER(derId) {
            var relatedDealLookup = search.lookupFields({
                type: 'customrecord_payment_import_record',
                id: derId,
                columns: 'custrecord_pay_import_deal'
            });
            return relatedDealLookup.custrecord_pay_import_deal;
        }

        function getDerURL(relatedDer) {
            var domainURL = url.resolveDomain({
                hostType: url.HostType.APPLICATION
            });
            var recordURL = url.resolveRecord({
                recordType: 'customrecord_payment_import_record',
                recordId: relatedDer
            });
            return domainURL + recordURL;
        }

        function sendCertCompletionEmail(subject, body, attachments, relatedDer) {
            var doubleNewLine = '\n\n';

            body += doubleNewLine;
            body += 'View DER here: ' + getDerURL(relatedDer) + doubleNewLine;
            body += 'View results here: ' + getSearchLink(relatedDer) + doubleNewLine;

            sendCompletionEmail(subject, body, attachments, relatedDer);     
        }

        function sendAmountCompletionEmail(subject, body, attachments, relatedDer) {
            var doubleNewLine = '\n\n';

            body += doubleNewLine;
            body += 'View DER here: ' + getDerURL(relatedDer) + doubleNewLine;
            body += 'View results here: ' + getSearchLink(relatedDer) + doubleNewLine;
            body += 'Subsequent Payment SRS DER Release Record Tie Out: ' + getTieOutSearchLink(relatedDer) + doubleNewLine;

            sendCompletionEmail(subject, body, attachments, relatedDer);        
        }

        function sendCompletionEmail(subject, body, attachments, relatedDer) {
            var paymentAnalyst = getPaymentAnalyst(relatedDer),
            clicker = getButtonClicker();

            email.send({
                author: 28154,  // 'Operations Group' operations@shareholderrep.com
                recipients: [clicker, paymentAnalyst],
                subject: subject,
                body: body,
                attachments: attachments
            });          
        }

        function getTieOutSearchLink(derId) {
            var delimiter = '%05';

            var releaseApproval = search.lookupFields({
                type: 'customrecord_payment_import_record',
                id: derId,
                columns: 'custrecord_release_approval_record'
            }).custrecord_release_approval_record[0].value;
            var journalEntryLookup = search.lookupFields({
                type: 'customrecord_escrow_payment_approvals',
                id: releaseApproval,
                columns: 'custrecord_release_journals'
            }).custrecord_release_journals;

            var i = 0,
                journalEntries = '';
            for(i; i < (journalEntryLookup.length-1); i++) {
                journalEntries += journalEntryLookup[i].value + delimiter;
            }
            journalEntries += journalEntryLookup[i].value;

            var searchLink;
            if(runtime.envType == 'PRODUCTION') {
                searchLink = 'https://system.na2.netsuite.com/app/common/search/searchresults.nl?searchtype=Customer&BEH_CUSTRECORD_ACQ_LOT_PAYMENT_IMPORT_RECORD=$$$$&ABI_CUSTRECORD_JOURNAL_ID=####&style=NORMAL&report=&grid=&searchid=15921&sortcol=Entity_ENTITYID_raw&sortdir=ASC&csv=HTML&OfficeXML=F&pdf=&size=1000&twbx=F';
            } else {
                searchLink = 'https://system.sandbox.netsuite.com/app/common/search/searchresults.nl?searchtype=Customer&BEH_CUSTRECORD_ACQ_LOT_PAYMENT_IMPORT_RECORD=$$$$&ABI_CUSTRECORD_JOURNAL_ID=####&style=NORMAL&report=&grid=&searchid=16276&sortcol=Entity_ENTITYID_raw&sortdir=ASC&csv=HTML&OfficeXML=F&pdf=&size=1000&twbx=F&c=772390_SB3';
            }
            searchLink = searchLink.replace('$$$$', derId);
            return searchLink.replace('####', journalEntries);
        }

        function getSearchLink(derId) {
            var searchLink;
            if(runtime.envType == 'PRODUCTION') {
                searchLink = 'https://system.na2.netsuite.com/app/common/search/searchresults.nl?rectype=382&searchtype=Custom&CUSTRECORD_ACQ_LOT_PAYMENT_IMPORT_RECORD=$$$$&style=NORMAL&report=&grid=&searchid=15696&sortcol=Custom_ID_raw&sortdir=ASC&csv=HTML&OfficeXML=F&pdf=&size=1000&twbx=F';
            } else {
                searchLink =  'https://system.sandbox.netsuite.com/app/common/search/searchresults.nl?rectype=382&searchtype=Custom&CUSTRECORD_ACQ_LOT_PAYMENT_IMPORT_RECORD=$$$$&style=NORMAL&report=&grid=&searchid=16231&sortcol=Custom_ID_raw&sortdir=ASC&csv=HTML&OfficeXML=F&pdf=&size=1000&twbx=F&c=772390_SB3';
            }
            return searchLink.replace('$$$$', derId);
        }

        function cleanSearchData(temp) {
            // cleans search data to be friendly for uploading to NetSuite
            if(temp != '') {
                if(Date.parse(temp).toString() !== 'NaN') { // it is a date
                    if(temp.length > 10) { // format is longer than mm/dd/yyyy, so it is DATETIME
                        return (format.parse({
                            value: temp,
                            type: format.Type.DATETIME
                        }));
                    } else {
                        return (format.parse({
                            value: temp,
                            type: format.Type.DATE
                        }));
                    }
                }
                if(temp == 'T') {
                    return true;
                }
                if(temp == 'F') {
                    return false;
                }
            }
            return temp;
        }

        function getPaymentAnalyst(relatedDer) {
            // returns the ID of the payment analyst on the DER
            var paymentAnalystLookUp = search.lookupFields({
                type: 'customrecord_payment_import_record',
                id: relatedDer,
                columns: 'custrecord_pay_import_analyst'
            });
            return paymentAnalystLookUp.custrecord_pay_import_analyst[0].value;
        }

        function getButtonClicker() {
            // returns the ID of the person who clicked the button to begin either the Create ExRecs/Certs
            // or the Populate Amounts process.
            var clickerSearch = search.create({
                type: 'scriptexecutionlog',
                filters: getClickerSearchFilters(),
                columns: getClickerSearchColumns()
            }).run();
            var clickerResults = clickerSearch.getRange({
                start: 0,
                end: 1
            });
            return clickerResults[0].getValue({
                name: 'internalid',
                join: 'user'
            });
        }

        function getClickerSearchFilters() {
            var filters = [];
            filters.push(search.createFilter({
                name: 'date',
                operator: 'within',
                values: ['today']
            }));
            filters.push(search.createFilter({
                name: 'scripttype',
                operator: 'anyof',
                values: [runtime.getCurrentScript().id]
            }));
            return filters;
        }

        function getClickerSearchColumns() {
            var columns = [];
            columns.push(search.createColumn({
                name: 'internalid',
                sort: search.Sort.DESC
            }));
            columns.push(search.createColumn({
                name: 'internalid',
                join: 'user'
            }));
            return columns;
        }

        function findCertsByExRec(exRecList, columns) {
            // accepts an array of ExRec IDs and an array of nlapiColumn objects
            // returns a list of Certs attached to this IDs
            var certSearch = search.create({
                type: 'customrecord_acq_lot_cert_entry',
                columns: columns,
                filters: [
                    ['custrecord_acq_lotce_zzz_zzz_parentlot', 'anyof', exRecList]
                ]
            }).run();
            return searchResultsLibrary.getSearchResultData(certSearch);
        }

        function handleObjectResults(temp) {
            // accepts NetSuite search result formatted like [{...}] or [{...},{...}] and returns formatted values for
            // uploading to NetSuite
            if(temp.length > 1) {
                var tempArray = [];
                for(var i = 0; i < temp.length; i++) {
                    tempArray.push(JSON.parse(temp[i].value));
                }
                return tempArray;
            } else {
                if(temp[0] == null) {
                    return '';
                } else {
                    return JSON.parse(temp[0].value);
                }
            }
        }

    return {
        cleanSearchData: cleanSearchData
        , getDERbyExRec: getDERbyExRec
        , sendCertCompletionEmail: sendCertCompletionEmail
        , sendAmountCompletionEmail: sendAmountCompletionEmail
        , getDerURL: getDerURL
        , findDERsByDeal: findDERsByDeal
        , findReleaseApprovalsByDeal: findReleaseApprovalsByDeal
        , findValidReleaseApprovals: findValidReleaseApprovals
        , findCertsByExRec: findCertsByExRec
        , getDealbyDER: getDealbyDER
        , handleObjectResults: handleObjectResults
    };
});