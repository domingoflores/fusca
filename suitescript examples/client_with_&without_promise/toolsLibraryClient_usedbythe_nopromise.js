/**
 * toolsLibraryClient.js
 * @NApiVersion 2.x
 * @NModuleScope public
 * A library of utilities 
 * 
 *
 * Version    Date            Author           Remarks
 *	1.0		  				  Ken Crossman	   Meant to be a receptacle for useful scripting tools/functions/utilities on the Client side
 *  2.0       Dec 2019        Ken C            ATP-1350	
 *  3.0       Feb 2020        Ken C            ATP-1461
 */
define(['N/search', 'N/runtime', 'N/ui/message', 'N/https', 'N/url'
    , '/.bundle/132118/PRI_AS_Engine'
],

    function (search, runtime, message, https, url
        , appSettings
    ) {


        //===========================================================================================================================
        //===========================================================================================================================
        function alertAlex(msg) {
            var userAlexFodor = 1047697;
            if (runtime.accountId.toLowerCase() == "772390_sb3") { if (runtime.getCurrentUser().id == userAlexFodor) { alert(msg); } }
        }

        //==================================================================================================
        //==================================================================================================
        function lookupABA(ach_wire, routingNbr) {
            var searchobj;
            var objReturn = { "success": false };
            var objABAStatusLookup;

            var obj_ABA_Status = {
                "FedWire": {
                    "recordId": "customrecord415"
                    , "fieldRoutingNumber": "custrecord153"
                    , "fieldBankName": "custrecord155"
                    , "fieldABAStatus": "custrecord_fedwire_aba_status_code"
                }
                , "FedACH": {
                    "recordId": "customrecord416"
                    , "fieldRoutingNumber": "custrecord162"
                    , "fieldBankName": "custrecord168"
                    , "fieldABAStatus": "custrecord_fedach_aba_status_code"
                }
            };

            if (ach_wire.toLowerCase() == "a") {
                objABAStatusLookup = obj_ABA_Status.FedACH;
            }
            else if (ach_wire.toLowerCase() == "w") {
                objABAStatusLookup = obj_ABA_Status.FedWire;
            }
            else { return objReturn; }

            var arrFilters = [[objABAStatusLookup.fieldRoutingNumber, 'IS', routingNbr]
                , 'AND', ['isinactive', 'IS', false]
            ];

            searchObj = search.create({
                type: objABAStatusLookup.recordId
                , filters: arrFilters
                , columns: [search.createColumn({ name: objABAStatusLookup.fieldBankName })
                    , search.createColumn({ name: objABAStatusLookup.fieldABAStatus })
                    , search.createColumn({ name: 'internalid' })
                    , search.createColumn({ name: 'lastmodified', "type": "datetime", "sortdir": "DESC" })
                ]
            });


            log.debug("toolsClient", "searchObj: " + JSON.stringify(searchObj));

            var searchRun = searchObj.run(); //returns search object
            var searchResults = searchRun.getRange(0, 1);

            if (searchResults.length > 0) {
                objReturn.success = true;
                objReturn["internalId"] = searchResults[0].getValue('internalid');
                objReturn["bankName"] = searchResults[0].getValue(objABAStatusLookup.fieldBankName);
                objReturn["abaStatusCode"] = searchResults[0].getValue(objABAStatusLookup.fieldABAStatus);
                objReturn["abaStatusCodeText"] = searchResults[0].getText(objABAStatusLookup.fieldABAStatus);
            }

            return objReturn;
        }


        //==================================================================================================
        //==================================================================================================
        function getQueryParameter(parmName) {
            var queryString = window.location.href;

            var parms = queryString.split("&");
            for (var i = 0; i < parms.length; i++) {
                if (parms[i].toLowerCase().startsWith(parmName.toLowerCase() + "=")) {
                    return parms[i].substring(parmName.length + 1);
                }
            }
        }


        //==================================================================================================
        //==================================================================================================
        function addUserNote(rcdId, rcdType, noteTitle, noteText) {
            try {
                var objHeader = {};
                var objBody = {};
                objBody.rcdId = rcdId;
                objBody.rcdType = rcdType;
                objBody.noteTitle = noteTitle;
                objBody.noteText = noteText;
                objBody.noteType = 7;
                var body = JSON.stringify(objBody);
                var suitletURL = url.resolveScript({ scriptId: 'customscript_addusernote_sl', deploymentId: 'customdeploy_addusernote_sl', returnExternalUrl: false });
                var response = https.post({ url: suitletURL, headers: objHeader, body: body });
                if (response.body != "OK") { return false; }
            }
            catch (e) { console.log(e.message); return false; }
            return true;
        }

        //=================================================================================================================================================
        // checks the current user against a "standard" permission object to determine whether they match
        //          the standard object is either a single object, or an array of objects
        //          each element can contain any combination of userId, userRole, userDept, and environment
        //          example: [{"userDept":"35" ,"userRole":"1025"} ,{"userDept":"35" ,"userRole":"1032"} ,{"userRole":"3" ,"environment":"SANDBOX" }]
        //     
        //          alternatively a single object can be passed that contains a reference to an appSetting where the list of 
        //          permission objects will be stored example: {"appName":"PaymentsProcessing" ,"settingName":"accessPermission"}
        //=================================================================================================================================================    
        function checkPermission(permissionObj) {
            if (!permissionObj) return false;

            if (typeof permissionObj == "string") {
                try { permissionObj = JSON.parse(permissionObj); }
                catch (e) { return false; }
            }

            if ((permissionObj instanceof Array)) {
                var tempObj = permissionObj[0];
                if (tempObj.hasOwnProperty("appName") && tempObj.hasOwnProperty("settingName")) {
                    permissionObj = tempObj;
                }
            }

            // instead of passing in a permission object, user can also pass in an app setting reference; in that case, this function will read the app setting and do the rest of the work
            if (permissionObj.hasOwnProperty("appName") && permissionObj.hasOwnProperty("settingName")) {
                // they didn't pass in a permission object; they passed in a reference to an App Setting
                var permissionObjAsString = appSettings.readAppSetting(permissionObj.appName, permissionObj.settingName);
                try {
                    if (permissionObjAsString) { permissionObj = JSON.parse(permissionObjAsString); }
                    else { return false; }
                }
                catch (e) { return false; }
            }

            // If permission object is just a simple object place it in an array so it is a list     
            if (!(permissionObj instanceof Array)) permissionObj = [permissionObj];

            // if any row of the permission list passes, then user is permitted
            for (var i = 0; i < permissionObj.length; i++) {
                var permissionObjRow = permissionObj[i];

                var userMatchesAllProperties = true;
                for (var property in permissionObjRow) {
                    var propertyValue = permissionObjRow[property];

                    switch (property) {
                        case "userId":
                            if (propertyValue != runtime.getCurrentUser().id) userMatchesAllProperties = false;
                            break;
                        case "userRole":
                            if (propertyValue != runtime.getCurrentUser().role) userMatchesAllProperties = false;
                            break;
                        case "userDept":
                            if (propertyValue != runtime.getCurrentUser().department) userMatchesAllProperties = false;
                            break;
                        case "environment":
                            if (propertyValue != runtime.envType) userMatchesAllProperties = false;
                            break;
                        default:
                            userMatchesAllProperties = false; // Unsupported properties will result in a failure
                    } // switch(property)

                } // for(var property in permissionObjRow)

                if (userMatchesAllProperties) return true;
            } // for (var i = 0; i < permissionObj.length; i++)

            return false;
        }

        function validateEmail(email) {
            var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(String(email).toLowerCase());
        }

        // ================================================================================================================================
        function areArraysEqual(array1, array2) {
            var funcName = "toolsLibraryClient.js==>areArraysEqual";

            var matchFound = false;
            log.debug(funcName, 'array1: ' + JSON.stringify(array1));
            log.debug(funcName, 'array2: ' + JSON.stringify(array2));
            if (array1.length == array2.length) {
                for (var i = 0; i < array1.length; i++) {
                    matchFound = false;
                    for (var j = 0; j < array2.length; j++) {
                        if (array1[i] == array2[j]) {
                            //Found a match 
                            matchFound = true;
                            break;
                        }
                    }
                    if (!matchFound) {
                        break;
                    }
                }
            }

            log.debug(funcName, 'Are arrays equal? ' + matchFound);
            return matchFound;
        }
        // ================================================================================================================================
        function isJSONValid(JSONObj) {
            var funcName = 'toolsLibraryClient.js==>' + 'isJSONValid';
            var success = false;
            var message = '';

            try {
                if (JSONObj) {
                    var a = JSON.parse(JSONObj);
                }
                if (!message) {
                    success = true;
                }
            }
            catch (e) {
                message = e.message;
            }
            return {
                success: success,
                message: message
            }
        }
        //given an account, usually parent/sub-account value, 
        //returns true if this account is subaccount of given array of accounts, e.g. 200000/300000
        function isSubAccountOf(parent, parentAccountsArray) {
            var retValue = false;

            log.audit("parent ", parent);
            if (parent && parentAccountsArray && parentAccountsArray.length) //account must have a parent to proceed 
            {
                var filters = [];
                var columns = [];
                var accountNames = [];
                //check to see if this account or this account's parent is a child of 200k 300k
                filters.push(search.createFilter({ name: "parent", operator: "anyof", values: parentAccountsArray }));
                filters.push(search.createFilter({ name: "internalidnumber", operator: "equalto", values: parent }));

                columns.push(search.createColumn({ name: "name" }));
                log.audit("filters ", JSON.stringify(filters));
                var SearchObj = search.create({
                    type: "account"
                    , filters: filters
                    , columns: columns
                });
                var searchresult = SearchObj.run();
                var searchresults = searchresult.getRange(0, 1000);

                log.audit("searchresults  ", searchresults.length);

                if (searchresults.length > 0) {
                    retValue = true;
                }
            }
            return retValue;
        }

        //returns true if multiple select has changed, even in xedit
        function multiSelecthasChanged(context, fieldId) {
            var retValue = false;
            if (context.type == context.UserEventType.XEDIT) {
                // if field is not in the list, then it didn't change
                var fieldList = context.newRecord.getFields();
                log.audit("fieldList.indexOf(fieldId)", fieldList.indexOf(fieldId));
                if (fieldList.indexOf(fieldId) < 0) {
                    retValue = false;
                    return retValue;	//for xedit, exit if not found 
                }
            }
            var oldvalue = (context.oldRecord
                && context.oldRecord.getValue(fieldId)
                && context.oldRecord.getValue(fieldId).toString()) || "";
            var newvalue = (context.newRecord
                && context.newRecord.getValue(fieldId)
                && context.newRecord.getValue(fieldId).toString()) || "";
            //    		log.audit("oldvalue ", oldvalue);
            //    		
            //    		log.audit("new record ", JSON.stringify(context.newRecord));
            //    		log.audit("newvalue ", newvalue);
            if (oldvalue !== newvalue) {
                retValue = true;
            }
            return retValue;
        }

        return {
            getQueryParameter: getQueryParameter
            , validateEmail: validateEmail
            , areArraysEqual: areArraysEqual
            , isJSONValid: isJSONValid
            , addUserNote: addUserNote
            , checkPermission: checkPermission
            , lookupABA: lookupABA
            , alertAlex: alertAlex
            , isSubAccountOf: isSubAccountOf
            , multiSelecthasChanged: multiSelecthasChanged
        };
    });