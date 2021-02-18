function updatePiraclePayInProcess() {
	//newValue = true or false
	//Load transactions to get entity that needs to be updated
    var newValue = "F";
	var originatingTrans = nlapiGetNewRecord(); 
	var currentID = originatingTrans.getId();
	var custrefundRec = nlapiLoadRecord("customerrefund", currentID);
nlapiLogExecution("DEBUG", "updatePiraclePayInProcess", "current ID custrefund: " + currentID);
	var pirPayIsPrinted = custrefundRec.getFieldValue("custbody_pp_is_printed");
	var pirPayApproval = custrefundRec.getFieldValue("custbody_pp_approval_status");
	nlapiLogExecution("DEBUG", "updatePiraclePayInProcess", "pirPayIsPrinted: " + pirPayIsPrinted);
	nlapiLogExecution("DEBUG", "updatePiraclePayInProcess", "pirPayApproval: " + pirPayApproval);
	var createdFromType = custrefundRec.getLineItemValue('apply', "type", 1);
	nlapiLogExecution("DEBUG", "updatePiraclePayInProcess", "created from type: " + createdFromType);

	var rmaRecID = custrefundRec.getLineItemValue('apply', "createdfrom", 1)
	nlapiLogExecution("DEBUG", "updatePiraclePayInProcess", "RMA ID: " + rmaRecID);

	var rmaRec = nlapiLoadRecord("returnauthorization", rmaRecID);
	var entityID = rmaRec.getFieldValue("entity");
	
	if ((pirPayIsPrinted == "F") && (pirPayApproval == 2))
		{
		newValue = "T";

		}
	else
		{
		newValue = "F";
		}

	//load entity record
	var entityRec = nlapiLoadRecord("customer", entityID);
	//Set Payment In Process field
	entityRec.setFieldValue("custentity_pir_pay_in_process", newValue);

	nlapiSubmitRecord(entityRec);
}