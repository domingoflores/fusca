/*************************************************************************
*
* ADOBE CONFIDENTIAL
* ___________________
*
*  Copyright [first year code created] Adobe Systems Incorporated
*  All Rights Reserved.
*
* NOTICE:  All information contained herein is, and remains
* the property of Adobe Systems Incorporated and its suppliers,
* if any.  The intellectual and technical concepts contained
* herein are proprietary to Adobe Systems Incorporated and its
* suppliers and are protected by trade secret or copyright law.
* Dissemination of this information or reproduction of this material
* is strictly forbidden unless prior written permission is obtained
* from Adobe Systems Incorporated.
**************************************************************************/

EchoSign.DocumentStatus = (function(){
	var statuses = {
			'OUT_FOR_SIGNATURE': {
				'name': 'Out For Signature',
				'apiValue':'OUT_FOR_SIGNATURE',
				'desc': 'Out for signature',
				'show': true,
				'isFinal': false
			},
			'OUT_FOR_APPROVAL': {
				'name': 'Out For Approval',
				'apiValue':'OUT_FOR_APPROVAL',
				'desc': 'The document is currently waiting to be approved.',
				'show': true,
				'isFinal': false
			},
			'WAITING_FOR_REVIEW': {
				'name': 'Waiting for Sender to Review Document Edits',
				'apiValue':'WAITING_FOR_REVIEW',
				'desc': 'Waiting for Sender to Review Document Edits',
				'show': false,
				'isFinal': false
			},
			'SIGNED': {
				'name': 'Signed',
				'apiValue':'SIGNED',
				'desc': 'The document has been signed by all the requested parties',
				'show': true,
				'isFinal': true
			},
			'APPROVED': {
				'name': 'Approved',
				'apiValue':'APPROVED',
				'desc': 'The document has been approved by all requested parties',
				'show': true,
				'isFinal': true
			},
			'ABORTED': {
				'name': 'Cancelled',
				'apiValue':'ABORTED',
				'desc': 'The signature workflow has been cancelled by either the sender or the recipient',
				'show': true,
				'isFinal': true
			},
			'DOCUMENT_LIBRARY': {
				'name': 'Document is in the EchoSign Library',
				'apiValue':'DOCUMENT_LIBRARY',
				'desc': 'Document is in the EchoSign Library',
				'show': false,
				'isFinal': true
			},
			'WIDGET': {
				'name': 'Document is a Widget',
				'apiValue':'WIDGET',
				'desc': '',
				'show': false,
				'isFinal': false
			},
			'EXPIRED': {
				'name': 'Expired',
				'apiValue':'EXPIRED',
				'desc': 'The document has passed the expiration date and can no longer be signed',
				'show': true,
				'isFinal': true
			},
			'ARCHIVED': {
				'name': 'Document is Archived in EchoSign',
				'apiValue':'ARCHIVED',
				'desc': 'The document uploaded by the user into their document archive',
				'show': false,
				'isFinal': true
			},
			'PREFILL': {
				'name': 'Not Yet Sent for Signature',
				'apiValue':'PREFILL',
				'desc': 'The document is waiting for the sender to fill out fields before it can be sent for signature',
				'show': true,
				'isFinal': false
			},
			'AUTHORING': {
				'name': 'Not Yet Sent for Signature',
				'apiValue':'AUTHORING',
				'desc': 'The document is waiting for the sender to position fields before it can be sent for signature',
				'show': true,
				'isFinal': false
			},
			'WAITING_FOR_FAXIN': {
				'name': 'Waiting for Sender to Fax in Agreement',
				'apiValue':'WAITING_FOR_FAXIN',
				'desc': 'The document is waiting for the sender to fax in the document contents before it can be sent for signature',
				'show': false,
				'isFinal': false
			},
			'WAITING_FOR_VERIFICATION': {
				'name': 'Waiting for Email Verification',
				'apiValue':'WAITING_FOR_VERIFICATION',
				'desc': 'The document is currently waiting to be verified',
				'show': false,
				'isFinal': false
			},
			'WIDGET_WAITING_FOR_VERIFICATION': {
				'name': 'Widget Waiting for Email Verification',
				'apiValue':'WIDGET_WAITING_FOR_VERIFICATION',
				'desc': 'The widget is currently waiting to be verified',
				'show': false,
				'isFinal': false
			},
			'WAITING_FOR_PAYMENT': {
				'name': 'Widget Waiting for Email Verification',
				'apiValue':'WAITING_FOR_PAYMENT',
				'desc': 'The document is waiting for payment in order to proceed',
				'show': false,
				'isFinal': false
			},
			'OTHER': {
				'name': 'Other',
				'desc': '',
				'show': true,
				'isFinal': false
			}
		};
	
	var defaultStatus = statuses['OTHER'];
	
	return{
		
		getDefaultStatus : function(){
			return defaultStatus;
		},
		
		getStatusByAPIValue : function(st){
			return statuses[st] || null;
		},
		
		getStatusByNSValue : function(txt){
			for(var p in statuses){
				if( statuses[p]['name'].toLowerCase() === txt.toLowerCase())
					return statuses[p];
			}
			
			return null;
		}
	};
})();