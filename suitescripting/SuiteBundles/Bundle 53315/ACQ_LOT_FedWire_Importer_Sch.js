/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       25 Sep 2014     smccurry
 * 1.00		  30 Sep 2014	  smccurry		   Installed on Production
 *
 * Important!  This script is not listed as part of Dual Entry, but it does keep records up to date that Dual Entry uses to show valid Fed Wire routing numbers.
 *
 * Description:  This scripts automates a file import of the Fed Wire Routing numbers that was once done manually.  The file had to be manually sliced into columns before importing so this script speeds
 * up that process.  As long as the URL below is active, this 'Scheduled Script' will keep the custom record 'customrecord_fed_wire_routing_codes' in NetSuite up to date.
 * It will run as often as it is deployed.  The unique identifier for each record is the routing number.  The Transfer Status is an important field on this record.  
 * If the new records downloaded from the URL show a difference in this field (custrecord_fed_wire_transfer_status) then all of the fields in the record will be updated.
 */

function importFedWireFile() {
	var context = nlapiGetContext();
	nlapiLogExecution('DEBUG', 'importFedWireFile() started.', '');
	
	// LOAD THE FED WIRE FILE FROM THE FED WEBSITE
	var fedwireURL = 'http://www.fededirectory.frb.org/fpddir.txt';
	var fedWireResponseData = nlapiRequestURL(fedwireURL);	
	var fedWireTxt = fedWireResponseData.getBody();
	
	//ALTERNATIVE TO THE ABOVE URL: DOWNLOAD THE FILE AND REPLACE ON NETSUITE THEN UNCOMMENT THIS CODE TO POINT TO NEW FILE IF NEEDED FOR AN UPDATE, OR JUST REPLACE THE FILE IN FILE CABINET WITH NEW FILE
//	var fedWireDoc = nlapiLoadFile('SuiteScripts/fpddir.txt');
//	var fedWireTxt = fedWireDoc.getValue();

	// SPLIT THE DATA INTO INDIVIDUAL LINES BASED ON THE LINE RETURN CHARACTER \N
	// THIS CREATES AN ARRAY OF THE LINES
	var fedWireLines = fedWireTxt.split('\n');

	// CREATE A NEW ARRAY WITH AN OBJECT FOR EACH LINE, AND EACH DATA FIELD SLICED OUT AND TRIM EXTRA SPACES
	// THE FED WIRE TXT FILE DOES NOT HAVE COMMA OR TAB DELIMINATION SO WE WILL HAVE TO USE .SLICE
	var fedWireObjects = [];
	for(var x = 0; x < fedWireLines.length; x++) {
		var tmpObj = {};
		var oneLine = fedWireLines[x];
		tmpObj.routingNumb = oneLine.slice(0,9).trim();
		tmpObj.teleName = oneLine.slice(9, 27).trim();
		tmpObj.custName = oneLine.slice(27, 63).trim();
		tmpObj.state = oneLine.slice(63, 65).trim();
		tmpObj.city = oneLine.slice(65, 90).trim();
		tmpObj.transferStatus = oneLine.slice(90, 91).trim();
		tmpObj.fundsSettle = oneLine.slice(91,92).trim();
		tmpObj.bookEntryStatus = oneLine.slice(92,93).trim();
		tmpObj.dateLastRev = oneLine.slice(93,101).trim();
		fedWireObjects.push(tmpObj);
	}

	// CREATE A STATE OBJECT TO TRANSLATE STATE ABBREVIATION TO FULL STATE NAME
	var stateAbr = '{"AL": "Alabama","AK": "Alaska","AS": "American Samoa","AZ": "Arizona","AR": "Arkansas","CA": "California","CO": "Colorado","CT": "Connecticut","DE": "Delaware","DC": "District Of Columbia","FM": "Federated States Of Micronesia","FL": "Florida","GA": "Georgia","GU": "Guam","HI": "Hawaii","ID": "Idaho","IL": "Illinois","IN": "Indiana","IA": "Iowa","KS": "Kansas","KY": "Kentucky","LA": "Louisiana","ME": "Maine","MH": "Marshall Islands","MD": "Maryland","MA": "Massachusetts","MI": "Michigan","MN": "Minnesota","MS": "Mississippi","MO": "Missouri","MT": "Montana","NE": "Nebraska","NV": "Nevada","NH": "New Hampshire","NJ": "New Jersey","NM": "New Mexico","NY": "New York","NC": "North Carolina","ND": "North Dakota","MP": "Northern Mariana Islands","OH": "Ohio","OK": "Oklahoma","OR": "Oregon","PW": "Palau","PA": "Pennsylvania","PR": "Puerto Rico","RI": "Rhode Island","SC": "South Carolina","SD": "South Dakota","TN": "Tennessee","TX": "Texas","UT": "Utah","VT": "Vermont","VI": "Virgin Islands","VA": "Virginia","WA": "Washington","WV": "West Virginia","WI": "Wisconsin","WY": "Wyoming"}';
	var stateAbrObj = JSON.parse(stateAbr);
	
	// LOOP THROUGH THE NEW ARRAY AND CREATE THE NEW FED WIRE RECORDS
	context = nlapiGetContext();
//	var y = context.getSetting('SCRIPT', 'customscript_fed_wire_file_importer');
	var y = 0;
//	nlapiLogExecution('DEBUG', 'y value context.getSetting(\'SCRIPT\', \'customscript_fed_wire_file_importer\');', y);
	if(y == 0 || y == '' || y == null) {
		y = 0;
	}
	for(y; y < fedWireObjects.length; y++) {
		var oneRec = fedWireObjects[y];
		// SEARCH FOR AN EXISTING RECORD BEFORE CREATING A NEW ONE.
		var results = searchExistingFedWire(oneRec.routingNumb);
		if(results != null && results.length > 0) {
			var oneResult = results[0];
			if(oneResult.getValue('custrecord_fed_wire_transfer_status') != oneRec.transferStatus) {
				var existFedRec = nlapiLoadRecord('customrecord_fed_wire_routing_codes', oneResult.getId());
				existFedRec.setFieldValue('custrecord_fed_wire_routing_number', oneRec.routingNumb);
				existFedRec.setFieldValue('custrecord_fed_wire_telegraphic_name', oneRec.teleName);
				existFedRec.setFieldValue('custrecord_fed_wire_bank_name', oneRec.custName);
				existFedRec.setFieldValue('custrecord_fed_wire_bank_city', oneRec.city);
				var stateName = stateAbrObj[oneRec.state];
				existFedRec.setFieldText('custrecord_fed_wire_bank_state', stateName);
				existFedRec.setFieldValue('custrecord_fed_wire_transfer_status', oneRec.transferStatus);
				existFedRec.setFieldValue('custrecord_fed_wire_settle_status', oneRec.fundsSettle);
				existFedRec.setFieldValue('custrecord_fed_wire_book_status', oneRec.bookEntryStatus);
				existFedRec.setFieldValue('custrecord_fed_wire_revision_date', oneRec.dateLastRev);
				try {
					var fedRecID = nlapiSubmitRecord(existFedRec);
				} catch (e) {
					var err = e;
					nlapiLogExecution('DEBUG', 'Error on Submit Fed Wire Record', JSON.stringify(err));
				}
			}
		} else {
			var fedRec = nlapiCreateRecord('customrecord_fed_wire_routing_codes');
			fedRec.setFieldValue('custrecord_fed_wire_routing_number', oneRec.routingNumb);
			fedRec.setFieldValue('custrecord_fed_wire_telegraphic_name', oneRec.teleName);
			fedRec.setFieldValue('custrecord_fed_wire_bank_name', oneRec.custName);
			fedRec.setFieldValue('custrecord_fed_wire_bank_city', oneRec.city);
			var stateName = stateAbrObj[oneRec.state];
			fedRec.setFieldText('custrecord_fed_wire_bank_state', stateName);
			fedRec.setFieldValue('custrecord_fed_wire_transfer_status', oneRec.transferStatus);
			fedRec.setFieldValue('custrecord_fed_wire_settle_status', oneRec.fundsSettle);
			fedRec.setFieldValue('custrecord_fed_wire_book_status', oneRec.bookEntryStatus);
			fedRec.setFieldValue('custrecord_fed_wire_revision_date', oneRec.dateLastRev);
			try {
				var recID = nlapiSubmitRecord(fedRec);
			} catch (e) {
				var err = e;
				nlapiLogExecution('DEBUG', 'Error on Submit Fed Wire Record', JSON.stringify(err));
			}
		}
		if (context.getRemainingUsage() <= 100 && (y+1) < fedWireObjects.length) {
			var params = { customscript_fed_wire_file_importer: y };
			var status = nlapiScheduleScript(context.getScriptId(), context.getDeploymentId(), params);
			if (status == 'QUEUED') {
				break; 
			}
	    }
//	context.setSetting('SCRIPT', 'customscript_fed_wire_file_importer', y);
		
	}
}

function searchExistingFedWire(routingNumb) {
//	SEARCH LOT FOR ATTACHED CERTIFICATES.
	var filters = [];
	filters.push(new nlobjSearchFilter('custrecord_fed_wire_routing_number',null,'is',routingNumb));
	filters.push(new nlobjSearchFilter('isinactive',null,'is','F'));	
	var columns = [];
	columns.push(new nlobjSearchColumn('custrecord_fed_wire_routing_number'));
	columns.push(new nlobjSearchColumn('custrecord_fed_wire_telegraphic_name'));
	columns.push(new nlobjSearchColumn('custrecord_fed_wire_bank_name'));
	columns.push(new nlobjSearchColumn('custrecord_fed_wire_bank_city'));
	columns.push(new nlobjSearchColumn('custrecord_fed_wire_bank_state'));
	columns.push(new nlobjSearchColumn('custrecord_fed_wire_transfer_status'));
	columns.push(new nlobjSearchColumn('custrecord_fed_wire_settle_status'));
	columns.push(new nlobjSearchColumn('custrecord_fed_wire_book_status'));
	columns.push(new nlobjSearchColumn('custrecord_fed_wire_revision_date'));
	
	return nlapiSearchRecord('customrecord_fed_wire_routing_codes',null,filters,columns);
}
