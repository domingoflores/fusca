/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * @ FILENAME      : SRSCaseEmail.js 
 * @ AUTHOR        : Kapil Agarwal
 * @ DATE          : 2008/03/07
 *
 * Copyright (c) 2007 Upaya - The Solution Inc. 
 * 10530 N. Portal Avenue, Cupertino CA 95014
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of 
 * Upaya - The Solution Inc. ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with Upaya.
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */


//Function to Update Customer Balance

var fx = 'EmailNotif';


function EmailNotif(type) {

	var currentRecord;
	var txt;

	var email;
	var id;
	var escrow;

	var by;

	var msg;
	var subj;
	var id;
	var name;
	var mergerecord = new Array();
	var entity = 1;
	var searchid;

	var vcont;
	var vcust;

	try {
		if ((type == 'create') || (type == 'edit')) {
			currentRecord = nlapiGetNewRecord();

			if ((currentRecord.getFieldValue('helpdesk') == 'T') && (type == 'create')) {

				//Send Initial Email
				var caseid = currentRecord.getId();
				var casetype = currentRecord.getRecordType();
				email = currentRecord.getFieldValue('email');

				nlapiLogExecution('DEBUG', fx + ' 100', 'Case: ' + casetype + ', ' + caseid);

				msg = nlapiMergeRecord(147, casetype, caseid).getValue();

				nlapiLogExecution('DEBUG', fx + ' 150', 'Msg: ' + msg);

				subj = 'Update RE: IT Request, ' + currentRecord.getFieldValue('title');
				//'[#' + currentRecord.getFieldValue('casenumber') + '], ' +

				mergerecord['activity'] = caseid;

				var emp = currentRecord.getFieldValue('company');
				if (emp != 1) {
					mergerecord['entity'] = emp;
					email = emp;
				}

				nlapiSendEmail(41186, email, subj, msg, null, null, mergerecord, null);

				return;

			}


			if (currentRecord.getFieldValue('custevent_send_email') == 'T') {
				vcont = currentRecord.getFieldValue('contact');

				if (vcont) {
					if (validateContact(vcont) == 0) {
						email = vcont;
					}
				}

				if (!(email)) {
					vcust = currentRecord.getFieldValue('company');

					if ((vcust) && (vcust != 1)) {
						if (validateCustomer(vcust) == 0) {
							email = vcust;
						}
					}
				}

				if (!(email)) {
					entity = 0;
					email = currentRecord.getFieldValue('email');

					if (email) {
						searchid = searchEntity(email);
						if (searchid != -1) {
							email = searchid;
							entity = 1;

						} else {
							email = currentRecord.getFieldValue('email');
							entity = 0;
						}
					} else {
						return;

					}
				} //if


				nlapiLogExecution('DEBUG', fx + ' 200', 'Email: ' + email);

				subj = 'Re: Your Inquiry to SRS';

				msg = nlapiMergeTemplate(25, 'supportcase', currentRecord.getId(), null, null);

				mergerecord['activity'] = currentRecord.getId();

				if (entity == 1) {
					mergerecord['entity'] = email;
				}

				nlapiLogExecution('DEBUG', fx + ' 300', 'Msg: ' + msg);

				id = currentRecord.getFieldValue('custevent1');

				nlapiLogExecution('DEBUG', fx + ' 310', 'Msg: ' + id);

				if (id) {
					escrow = getEscrow(id);
					if (escrow == -1) {
						by = nlapiGetUser();
					} else {
						by = setemployee(escrow.getValue('email'), escrow.getValue('companyname'));
					}
				} else {
					by = nlapiGetUser();
				}

				nlapiLogExecution('DEBUG', fx + ' 320', 'By: ' + by);

				nlapiSendEmail(by, email, subj, msg, null, null, mergerecord);
			}

		} // if type
	} //try 
	catch (e) {
		if (e instanceof nlobjError)
			nlapiLogExecution('ERROR', fx + ' 900', e.getCode() + '\n' + e.getDetails());
		else
			nlapiLogExecution('ERROR', fx + ' 950', e.toString());
	} //catch

	// call setEscrowField()
	//setEscrowField(type);

} //end

function setEscrowField(type) {
	try {
		if ((type == 'create') || (type == 'edit')) {
			var currentRecord = nlapiGetNewRecord();

			var formId = currentRecord.getFieldValue('customform');

			nlapiLogExecution('ERROR', fx + ' 500', 'formId = ' + formId);

			// if formId == 'SRS Matter Form', e.g. formId 27
			if (formId == '27') {
				nlapiLogExecution('ERROR', fx + ' 501', 'formId triggered');
				var recordCompany = currentRecord.getFieldValue("company");
				nlapiLogExecution('ERROR', fx + ' 502', 'recordCompany = ' + recordCompany);

				// set the escrow field to be the same as the Company/Deal field
				currentRecord.setFieldValue('custevent1', recordCompany);

				nlapiLogExecution('ERROR', fx + ' 503', 'recordCompany recorded?');
			}
		}
	} //try 
	catch (e) {
		if (e instanceof nlobjError)
			nlapiLogExecution('ERROR', fx + ' 900', e.getCode() + '\n' + e.getDetails());
		else
			nlapiLogExecution('ERROR', fx + ' 950', e.toString());
	} //catch
}

function settext(type) {

	fx = 'SETTEXT';

	var currentRecord;
	var txt;
	var id;


	var escrowid;
	var email;
	var owner;


	try {
		if ((type == 'create') || (type == 'edit')) {
			currentRecord = nlapiGetNewRecord();

			//Get Inbound Email
			//if it is itrequests@shareholderrep.com then set the helpdesk

			if ((currentRecord.getFieldValue('inboundemail') == 'itrequests@shareholderrep.com') && (type == 'create')) {
				currentRecord.setFieldValue('helpdesk', 'T');
				currentRecord.setFieldValue('customform', 34);
			}

			if (currentRecord.getFieldValue('helpdesk') == 'T') {
				return;
			}

			txt = currentRecord.getFieldValue('custevent_reply');


			nlapiLogExecution('DEBUG', fx + ' 100', 'Reply: ' + txt);

			if (currentRecord.getFieldValue('custevent_send_email') == 'T') {
				currentRecord.setFieldValue('custevent_case_email_text', txt);
				currentRecord.setFieldValue('internalonly', 'F');

				//Set Status
				if ((currentRecord.getFieldValue('status') != 5) && (currentRecord.getFieldValue('status') != 3)) {
					currentRecord.setFieldValue('status', 2);

					if (!(currentRecord.getFieldValue('assigned'))) {
						id = validatesupport(nlapiGetUser());
						if (id != -1) {
							currentRecord.setFieldValue('assigned', id);
						}
					}
				}

			} else {
				currentRecord.setFieldValue('outgoingmessage', txt);

			}

			// set Escrow

			if (currentRecord.getFieldValue('custevent1')) {
				//Escrow 
				nlapiLogExecution('DEBUG', fx + ' 500', 'Escrow Present');
			} else {
				// check to see if this is an 'SRS Matter', and if so, be sure to set the company and escrow/deal to be the same
				var formId = currentRecord.getFieldValue('customform');

				// if formId == 'SRS Matter Form', e.g. formId 27
				if (formId == '27') {
					var recordCompany = currentRecord.getFieldValue("company");

					// set the escrow field to be the same as the Company/Deal field
					currentRecord.setFieldValue('custevent1', recordCompany);
				}

				// reset escrow in case it conflicts with the inboundemail or email field
				email = currentRecord.getFieldValue('inboundemail');
				if (email) {
					escrowid = getEscrowbyEmail(email);

					if (escrowid != -1) {
						currentRecord.setFieldValue('custevent1', escrowid);
					} else {
						email = currentRecord.getFieldValue('email');
						if (email) {
							escrowid = getEscrowbyEmail(email);

							if (escrowid != -1) {
								currentRecord.setFieldValue('custevent1', escrowid);
							}

						} // email 2
					} // escrow id
				} // email 1
			} // set escrow

			//set assigned to on create

			if ((type == 'create') && (currentRecord.getFieldValue('custevent1'))) {
				if (!(currentRecord.getFieldValue('assigned'))) {
					//get escrow primary
					owner = getprimary(currentRecord.getFieldValue('custevent1'));
					//if(owner != -1)
					//{
					//	currentRecord.setFieldValue('assigned', owner);
					//}
				}
			}



		} // if type
	} //try 
	catch (e) {
		if (e instanceof nlobjError)
			nlapiLogExecution('ERROR', fx + ' 900', e.getCode() + '\n' + e.getDetails());
		else
			nlapiLogExecution('ERROR', fx + ' 950', e.toString());
	} //catch

} //end



function getprimary(id) {
	var retval = -1;
	var email;

	var filters = new Array();
	filters[0] = new nlobjSearchFilter('internalid', null, 'anyof', id, null);

	var columns = new Array();
	columns[0] = new nlobjSearchColumn('email');
	columns[1] = new nlobjSearchColumn('companyname');
	columns[2] = new nlobjSearchColumn('custentity42');

	var searchresults = nlapiSearchRecord('customer', null, filters, columns);

	if (searchresults) {
		if (searchresults[0].getValue('custentity42')) {
			retval = searchresults[0].getValue('custentity42');
		}
	}
	return retval;
} //end


function getEscrow(id) {
	var retval = -1;
	var email;

	var filters = new Array();
	filters[0] = new nlobjSearchFilter('internalid', null, 'anyof', id, null);

	var columns = new Array();
	columns[0] = new nlobjSearchColumn('email');
	columns[1] = new nlobjSearchColumn('companyname');
	columns[2] = new nlobjSearchColumn('custentity42');

	var searchresults = nlapiSearchRecord('customer', null, filters, columns);

	if (searchresults) {
		if (searchresults[0].getValue('email')) {
			retval = searchresults[0];
		}
	}
	return retval;
} //end


function setemployee(email, name) {
	var retval = -1;
	var sup;
	var supemail;

	var record;

	var filters = new Array();
	filters[0] = new nlobjSearchFilter('email', null, 'is', email, null);

	var columns = new Array();
	columns[0] = new nlobjSearchColumn('internalid');

	var searchresults = nlapiSearchRecord('employee', null, filters, columns);

	if (searchresults) {
		retval = searchresults[0].getValue('internalid');
	} else {
		record = nlapiCreateRecord('employee');
		record.setFieldValue('email', email);
		record.setFieldValue('firstname', 'Escrow');
		record.setFieldValue('lastname', name);
		record.setFieldValue('entityid', name);
		record.setFieldValue('billpay', 'F');
		record.setFieldValue('employeetype', 7);
		try {
			retval = nlapiSubmitRecord(record, true);
			nlapiLogExecution('DEBUG', 'Success creating Case record: ', JSON.stringify(retval));
		} catch (e) {
			nlapiLogExecution('ERROR', 'ERROR creating Case record', JSON.stringify(e));
		}

	}

	return retval;
}

function searchEntity(email) {
	var retval = -1;

	var filters = new Array();
	filters[0] = new nlobjSearchFilter('email', null, 'is', email, null);

	var columns = new Array();
	columns[0] = new nlobjSearchColumn('internalid');

	var searchresults = nlapiSearchRecord('contact', null, filters, columns);

	if (searchresults) {
		retval = searchresults[0].getValue('internalid');
	} else {
		// Search customer

		filters = new Array();
		filters[0] = new nlobjSearchFilter('email', null, 'is', email, null);

		columns = new Array();
		columns[0] = new nlobjSearchColumn('internalid');

		searchresults = nlapiSearchRecord('customer', null, filters, columns);

		if (searchresults) {
			retval = searchresults[0].getValue('internalid');
		}
	}

	return retval;
} //end


function validateContact(id) {
	var retval = -1;

	var filters = new Array();
	filters[0] = new nlobjSearchFilter('internalid', null, 'anyof', id, null);

	var columns = new Array();
	columns[0] = new nlobjSearchColumn('email');

	var searchresults = nlapiSearchRecord('contact', null, filters, columns);

	if (searchresults) {
		if (searchresults[0].getValue('email')) {
			retval = 0;
		}
	}

	return retval;
} //end

function validateCustomer(id) {
	var retval = -1;

	var filters = new Array();
	filters[0] = new nlobjSearchFilter('internalid', null, 'anyof', id, null);

	var columns = new Array();
	columns[0] = new nlobjSearchColumn('email');

	var searchresults = nlapiSearchRecord('customer', null, filters, columns);

	if (searchresults) {
		if (searchresults[0].getValue('email')) {
			retval = 0;
		}
	}

	return retval;
} //end

function validatesupport(id) {
	var retval = -1;
	var record;

	var filters = new Array();
	filters[0] = new nlobjSearchFilter('internalid', null, 'anyof', id, null);
	filters[1] = new nlobjSearchFilter('isinactive', null, 'is', 'F', null);
	filters[2] = new nlobjSearchFilter('issupportrep', null, 'is', 'T', null);

	var columns = new Array();
	columns[0] = new nlobjSearchColumn('internalid');

	var searchresults = nlapiSearchRecord('employee', null, filters, columns);

	if (searchresults) {
		retval = searchresults[0].getValue('internalid');
	}

	return retval;
}


function getEscrowbyEmail(email) {
	var retval = -1;

	var filters = new Array();
	filters[0] = new nlobjSearchFilter('email', null, 'is', email, null);
	filters[1] = new nlobjSearchFilter('category', null, 'is', 1, null);

	var columns = new Array();
	columns[0] = new nlobjSearchColumn('internalid');

	var searchresults = nlapiSearchRecord('customer', null, filters, columns);

	if (searchresults) {
		retval = searchresults[0].getValue('internalid');
	} else {
		filters = new Array();
		filters[0] = new nlobjSearchFilter('custentity4', null, 'is', email, null);
		filters[1] = new nlobjSearchFilter('category', null, 'is', 1, null);

		columns = new Array();
		columns[0] = new nlobjSearchColumn('internalid');

		searchresults = nlapiSearchRecord('customer', null, filters, columns);
		if (searchresults) {
			retval = searchresults[0].getValue('internalid');
		}
	}

	return retval;
} //end

function onInit() {
	if (!(nlapiGetFieldValue('custevent1'))) {
		var email = nlapiGetFieldValue('inboundemail');
		if (email) {
			var escrowid = getEscrowbyEmail(email);

			if (escrowid != -1) {
				nlapiSetFieldValue('custevent1', escrowid);
			} else {
				email = nlapiGetFieldValue('email');
				if (email) {
					escrowid = getEscrowbyEmail(email);

					if (escrowid != -1) {
						nlapiSetFieldValue('custevent1', escrowid);
					}

				} // email 2
			} // escrow id
		} // email 1
	} // set escrow
}