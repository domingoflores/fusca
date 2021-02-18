/**
 * Set modified time for dimension to current date & time when user makes a modification.
 * Accounting Period, Term, and Vendor Category do not expose custom field over SuiteTalk,
 * and therefore do not have this customization.
 * 
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record'],
  function (record) {
    function beforeSubmit(context) {
      var customerRecord = context.newRecord;
      var datetime = new Date().getTime();
      switch (customerRecord.type) {
        case record.Type.ACCOUNT:
          customerRecord.setValue("custrecord_mtacctmodtime", datetime);
          break;
        case record.Type.CLASSIFICATION:
          customerRecord.setValue("custrecord_mtclassmodtime", datetime);
          break;
        case record.Type.DEPARTMENT:
          customerRecord.setValue("custrecord_mtdeptmodtime", datetime);
          break;
        case record.Type.LOCATION:
          customerRecord.setValue("custrecord_mtlocationmodtime", datetime);
          break;
        default:
          break;
      }
    }
    return {
      beforeSubmit: beforeSubmit
    };
  }
);
