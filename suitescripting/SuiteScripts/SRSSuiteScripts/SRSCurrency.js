/**
 * @author durbano
 */
function onBeforeSubmit(type)
{
    if (type == "create")
    {
        var currentRecord = nlapiGetNewRecord();                                            // get the current record
        var currencyName = currentRecord.getFieldValue("name");
		var currencySymb = currentRecord.getFieldValue("symbol");
		
		// new currency found. Generate an email to notify operations
		nlapiSendEmail("6367","operations@shareholderrep.com","New currency created","New currency created. Please add additional deployment of currency script to avoid problems with the portal.");
    }
}
