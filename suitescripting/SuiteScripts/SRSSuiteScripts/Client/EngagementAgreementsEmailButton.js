/**
 * @author Scott Streule / TJ Tyrell
 * Created:    7/9/2016 (Yeah, It's Saturday.  We are that DEDICATED)
 * 
 * This Script acts as an onClick for the Email Engagement Agreement Contacts button on the Customer / Deal record.
 * Main purpose of this script is to move the search that builds the email list for Engagement Agreement Contacts to an onClick rather an onLoad of the record.
 * Why load the email list if you aren't going to click on the button.  This saves up to 2 seconds on Record Load.
 */

function Button( searchRecord, savedSearchID ){
	this.filters = [];
	this.results = null;
	this.searchRecord = searchRecord;
	this.savedSearchID = savedSearchID;
};

Button.prototype.init = function(){
	this.addFilters([{
		column: 'internalid',
		join: 'custrecord59',
		operator: 'is',
		value: this.getDealID()
	}])
		.getResults();

	this.emailShareholders();
};

Button.prototype.getDealID = function(){
	var recordID = nlapiGetRecordId();
	return nlapiLookupField('customer', recordID, 'internalID');
};

Button.prototype.addFilters = function(filters){
	for(var filter in filters){
		this.filters.push(new nlobjSearchFilter(filters[filter].column, filters[filter].join, filters[filter].operator, filters[filter].value));
	}
	return this;
};

Button.prototype.getResults = function(){
	this.results = nlapiSearchRecord(this.searchRecord, this.savedSearchID, this.filters, null);
};

Button.prototype.emailShareholders = function(){
	var emailSuccess = false,
		email = '',
		emailList = '';
	if(this.results != null){
		for(var i = 0; i < this.results.length; i++){
			emailSuccess = true;
			email = this.results[i].getValue('email','custrecord60',null)
			emailList += (email != '' && email != null && email != '- None -') ? email + ',' :'';
		}
		window.location = 'mailto:' + emailList;
	}
	if(!emailSuccess){
		alert('There are no engagement agreement contacts to email.');
	}
};

var emailButton = new Button('customrecord16', 'customsearch_engagement_agreement_cnct'); //Deal Contact Record