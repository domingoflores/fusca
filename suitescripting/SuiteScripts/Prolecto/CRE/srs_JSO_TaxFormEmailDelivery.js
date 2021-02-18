

var DELIVERY_TYPE = {
    EMAIL:      "1",
    MAIL:       "2"
};

var BATCH_DETAIL_STATUS = {
    DRAFT:          "1",
    REMOVED:        "2",
    FINAL:          "3",
    DELIVERED:      "4",
    INACTIVE:       "5",
    FAILED:         "6",
    FILED:          "7",
    GENERATED:      "8"
};

var scriptName = "srs_JSO_TaxForMDelivery.";

this.javaScriptOverride = function ()
{

    var  ANSWER_SALES_CHANNEL = 3;


    var funcName = scriptName;

    creRecord = this;


    if (creRecord.RawData)
    {

        logAudit(funcName, "Starting");

        var DIST = nlapiLoadRecord("customrecord_tax_distribution", creRecord.RawData.RECORD.id);


        logAudit(funcName, "parm1=" + creRecord.CustomParam1);

        if (!creRecord.CustomParam1)
            throw "CustomParam1 is missing.  This field must contain the internal ID of a Shareholder related to this Tax Distribution";


        creRecord.RawData.shareholderId = creRecord.CustomParam1;
        creRecord.RawData.shareholderEmail = nlapiLookupField("customer",creRecord.CustomParam1,"custentity4");

        var docList = findDocuments(creRecord.RawData.RECORD.id,creRecord.CustomParam1);

        logAudit(funcName, JSON.stringify(docList));

        //
        // // find the Custom Text that was entered on the Tax Distribution record.  Search for Tax Form Deal records that reference this Batch/Deal, which are queued/approved for email, and connect to their Tax Distribution records
        // var distSearch = nlapiSearchRecord("customrecord_tax_form_deal",null,
        //     [
        //         ["custrecord_tfd_batch_id","anyof",DETAIL.getFieldValue("custrecord_txfm_detail_batch_id")]
        //         ,"AND",["custrecord_tfd_deal","anyof",DETAIL.getFieldValue("custrecord_txfm_detail_deal")]
        //         ,"AND",["custrecord_tfd_email_distribution","noneof","@NONE@"]
        //         ,"AND",["custrecord_tfd_approved_for_email","is","T"]
        //     ],
        //     [
        //         new nlobjSearchColumn("custrecord_td_custom_text","custrecord_tfd_email_distribution",null),
        //     ]
        // ) || [];
        //
        creRecord.RawData.customText = DIST.getFieldValue("custrecord_td_custom_text");

        creRecord.RawData.Documents = docList;


    } // if (creRecord.RawData)

};


/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

function findDocuments(taxDistId, shareholderId) {
    var funcName = scriptName + "findDocuments " + taxDistId + " " + shareholderId;

    // given a Tax Form Batch Detail record, find all other Tax Form Batch Detail records for the same Shareholder and same Batch ID
    //      and retrieve some information from the Tax Documents join


    var dealSearch = nlapiSearchRecord("customrecord_tax_form_deal",null,
        [
            ["isinactive","is","F"]
            ,"AND",["custrecord_tfd_email_distribution","anyof",taxDistId]
        ],
        [
            new nlobjSearchColumn("custrecord_tfd_batch_id"),
            new nlobjSearchColumn("custrecord_tfd_deal"),
        ]
    ) || [];

    if (dealSearch.length == 0)
        throw "Could not find any Tax Form Deals linked to Tax Distribution " + taxDistId;

    // and find all Tax Form Batch Detail record which , which points to a Tax Document (Document/Custom), which has a LINKED FILE attached to it

    var detailFilter = [
        ["isinactive","is",false]
        ,"AND",["custrecord_txfm_detail_shareholder","anyof",shareholderId]
        ,"AND",["custrecord_txfm_detail_status","anyof",BATCH_DETAIL_STATUS.GENERATED]
        ,"AND",["custrecord_txfm_detail_delivery","anyof",DELIVERY_TYPE.EMAIL]
        ,"AND",["CUSTRECORD_TXFM_DETAIL_DOCUMENT.custrecord_file","isnotempty",null]
        ,"AND",
    ];

    var dealList = [];
    for (var x in dealSearch) {
        var result = dealSearch[x];
        if (dealList.length > 0)
            dealList.push("OR");

        dealList.push([["custrecord_txfm_detail_batch_id","anyof",result.getValue("custrecord_tfd_batch_id")],"AND",["custrecord_txfm_detail_deal","anyof",result.getValue("custrecord_tfd_deal")]])
    };

    detailFilter.push(dealList);

    logAudit(funcName, JSON.stringify(detailFilter));



    var docSearch = nlapiSearchRecord("customrecord_tax_form_batch_detail",null,detailFilter,
        // [
        //     ["custrecord_txfm_detail_shareholder","anyof",DETAIL.getFieldValue("custrecord_txfm_detail_shareholder")]
        //     ,"AND",["custrecord_txfm_detail_batch_id","anyof",DETAIL.getFieldValue("custrecord_txfm_detail_batch_id")]
        //     ,"AND",["custrecord_txfm_detail_status","anyof",BATCH_DETAIL_STATUS.GENERATED]
        //     ,"AND",["custrecord_txfm_detail_delivery","anyof",DELIVERY_TYPE.EMAIL]
        // ],
        [
            new nlobjSearchColumn("id").setSort(false),
            // new nlobjSearchColumn("custrecord_txfm_detail_batch_id"),
            // new nlobjSearchColumn("custrecord_txfm_detail_shareholder"),
            // new nlobjSearchColumn("custrecord_txfm_detail_sh_name"),
            // new nlobjSearchColumn("custrecord_txfm_detail_status"),
            // new nlobjSearchColumn("custrecord_txfm_detail_version"),
            new nlobjSearchColumn("custrecord_txfm_detail_deal"),
            new nlobjSearchColumn("altname","CUSTRECORD_TXFM_DETAIL_DOCUMENT",null),
            new nlobjSearchColumn("custrecord104","CUSTRECORD_TXFM_DETAIL_DOCUMENT",null),
            new nlobjSearchColumn("custrecord_file","CUSTRECORD_TXFM_DETAIL_DOCUMENT",null)
        ]
    ) || [];

    var docList = [];

    for (var x in docSearch) {
        var result = docSearch[x];

        var obj = {
            tranName: result.getText("custrecord_txfm_detail_deal"), //  result.getValue("custrecord104","CUSTRECORD_TXFM_DETAIL_DOCUMENT"),
            url: "https://" + nlapiGetContext().getCompany().replace("_","-") + ".app.netsuite.com" + nlapiLookupField("file", result.getValue("custrecord_file","CUSTRECORD_TXFM_DETAIL_DOCUMENT"), "url"),
            docName: result.getValue("altname","CUSTRECORD_TXFM_DETAIL_DOCUMENT")
        };

        obj.docName = obj.docName.replace("- E-MAIL","");

        if (obj.url)
            docList.push(obj);
    }

    return docList;

}
/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */


/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */


function logDebug(funcName, s) {
    nlapiLogExecution("DEBUG", funcName, s);
}

function logAudit(funcName, s) {
    nlapiLogExecution("AUDIT", funcName, s);
}

function logError(funcName, s) {
    nlapiLogExecution("ERROR", funcName, s);
}

