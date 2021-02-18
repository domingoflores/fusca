/**
 * @NApiVersion 2.x
 * @NModuleScope public
 * Library for Payment File Creation
 */

define(['N/search', 'N/url'],
       
    function (search, url) {

        function isFinraReq(pftrcdId) {
            if (!pftrcdId) { return }
            var objPFTfinra = search.lookupFields({
                type: 'customrecord_pay_file_type', id: pftrcdId
                , columns: ["custrecord_pft_finra_lic_app_req"
                ]
            });
            var PFTfieldValue = objPFTfinra.custrecord_pft_finra_lic_app_req;
            return PFTfieldValue;
        }

        function finraApproverList() {
            var finraApprovers = [];
            var employeeSearchObj = search.create({
                type: "employee",
                filters:
                    [
                        ["isinactive", "is", "F"],
                        "AND",
                        ["custentity_em_is_finra_licensed", "is", "T"],
                        "AND",
                        ["custentity_pay_file_approver", "is", "T"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "entityid", label: "Name" }),
                        search.createColumn({ name: "internalid", label: "Internal ID" })
                    ]
            });
            var searchResultCount = employeeSearchObj.runPaged().count;
            log.debug("employeeSearchObj result count", searchResultCount);
            employeeSearchObj.run().each(function (result) {
                finraApprovers.push({
                    name: result.getValue({
                        'name': "entityid",
                    }),
                    internalid: result.getValue({
                        'name': "internalid",
                    })
                })
                return true;
            });
            return finraApprovers;
        }

        function finalApproverList() {
            var finalApprovers = [];
            var employeeSearchObj = search.create({
                type: "employee",
                filters:
                    [
                        ["isinactive", "is", "F"],
                        "AND",
                        ["custentity_pay_file_approver", "is", "T"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "entityid", label: "Name" }),
                        search.createColumn({ name: "internalid", label: "Internal ID" })
                    ]
            });
            var searchResultCount = employeeSearchObj.runPaged().count;
            log.debug("employeeSearchObj result count", searchResultCount);
            employeeSearchObj.run().each(function (result) {
                finalApprovers.push({
                    name: result.getValue({
                        'name': "entityid",
                    }),
                    internalid: result.getValue({
                        'name': "internalid",
                    })
                })
                return true;
            });
            return finalApprovers;
        }
        function getAnchor(recordtype, internalid, text, bEditMode) {
        	if (bEditMode !== true)
        	{
        		bEditMode = false;
        	}
	     	var link = url.resolveRecord({
				    recordType: recordtype,
				    recordId: internalid,
				    isEditMode: bEditMode
				});
	     	link = "<a href=\""+link+"\" target=\"_blank\">"+(text||internalid)+"</a>";
	     	return link;
		}
        return {
            isFinraReq: isFinraReq,
            finraApproverList: finraApproverList,
            finalApproverList: finalApproverList,
            getAnchor : getAnchor
        };
    });