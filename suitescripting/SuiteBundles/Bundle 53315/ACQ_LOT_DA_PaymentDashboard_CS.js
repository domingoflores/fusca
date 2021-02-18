//==============================================================================================================================
// CHANGE HISTORY
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Developer   Story        Date       Description
// AFodor      ATP-254   2018.07.19    Changes to prevent duplicate payments when an exchange record is submitted twice
// AFodor      ATP-353   2018.10.04    Changes to use Queue Manager for processing payment approvals 
//                                     This change makes the processing completely asynchronous and moves it all to 
//                                     Queue Manager based scheduled scripts. The new process is summarized here.
//                                     1) This client script will create a list of all selected exchange record id's
//                                        Each exchange record on the form will be designated as QUEUED as its added to the list
//                                     2) The list will be passed to a Suitelet which will create a single Queue Manager
//                                        queue entry of type ApprovePamentsRequest. The entry will have the list as a parameter
//                                     3) The ApprovePamentsRequest scheduled script will iterate through the list and create
//                                        a processpayment record for each exchange record in the list. It replaces the restlet
//                                        that was called to create the processpayment rec once per exchange record by this script
//                                        As each processpayment record is created by the ApprovePamentsRequest script it will 
//                                        also write an ApprovePayment queue manager entry for that individual processpayment
//                                        record. A 2nd Queue Manager script processes that individual processpayment record.
//                                     4) The ApprovePayment script which will have 10 deployments will process each payment
//                                        with up to 10 processing simultaneously based on the number of available queues.
//                                        As each "queue entry/process payment" record is finished the script will do a search
//                                        to see if there are any remaining unprocessed ApprovePayment queue entries for the
//                                        ApprovePamentsRequest from which this queue entry was spawned. If there are no longer
//                                        any unprocessed entries an email will be sent to the user to inform them processing
//                                        is complete and the script will then perform the check for duplicates saved search.
//                                        If duplicates are found an email will be sent to the user. 
//==============================================================================================================================

//====================================================================================================================
//====================================================================================================================
var objToday;
	
function payNextBusinessDayChanged() { 
	
	var userId   = nlapiGetContext().getUser();
	var userRole = nlapiGetContext().getRole(); // 1025 for SRS Operations Manager, 3 for administrator		
	var userDept = nlapiGetDepartment();   // 35 for Operations & Technology : Client Operations : Acquiom Operations	

	var searchresults = [];
    var arrayUsers    = [];
	try {
		var filters = [];
		var columns = [];
		filters[0] = new nlobjSearchFilter('name', null, 'is', 'Users with Administrator override in sandbox');
		columns[0] = new nlobjSearchColumn('custrecord_pri_as_value');
		searchresults = nlapiSearchRecord('customrecord_pri_app_setting', null, filters, columns );
		arrayUsers = JSON.parse(searchresults[0].getValue('custrecord_pri_as_value'));
        console.log("arrayUsers: " + JSON.stringify(arrayUsers));
	}
	catch(e0) { console.log("exception encountered:" + e0.message) }
	
	var userHasAccess = false;
	if( userRole == 1025 && userDept == 35 ) { userHasAccess = true; } 
	if( userRole == 3    && String(nlapiGetContext().getEnvironment()) === "SANDBOX" ) {
		if (arrayUsers.indexOf(parseInt(userId)) > -1) { userHasAccess = true; }
	} 
	
	if (!userHasAccess) {  
		document.getElementById("chkNextBusinessDay").checked = false;
		alert("You do not have authority to use this feature.");
		return;
	}
	
	if (!window.confirm('Are you sure you want to change the Payment Effective Date?')) {
		if (document.getElementById("chkNextBusinessDay").checked) 
		     { document.getElementById("chkNextBusinessDay").checked = false; }
		else { document.getElementById("chkNextBusinessDay").checked = true;  }
		return; 
	}
	
	var txtPaymentsEffectiveDate = document.getElementById("txtPaymentsEffectiveDate");
	var chkNextBusinessDay = document.getElementById("chkNextBusinessDay");
	if (!chkNextBusinessDay.checked) {
		var sToday = (objToday.getMonth() + 1) + "/" + objToday.getDate() + "/" + objToday.getFullYear();
		txtPaymentsEffectiveDate.value = sToday;
		return;
	}
	
	//var testDate = new Date(2019 ,4, 24);
	var objNextBusinessDay = getNextBusinessDay(objToday);
	var nbd = (objNextBusinessDay.getMonth() + 1) + "/" + objNextBusinessDay.getDate() + "/" + objNextBusinessDay.getFullYear();
	
	txtPaymentsEffectiveDate.value = nbd;
}


var millisecs24Hours; 
var searchHolidaysResults;
//====================================================================================================================
//====================================================================================================================
function getNextBusinessDay(objToday) { 
	
	var objNextBusinessDay = new Date(objToday.getTime());
	var nbrMillisecs;
	var nbd0 = (objNextBusinessDay.getMonth() + 1) + "/" + objNextBusinessDay.getDate() + "/" + objNextBusinessDay.getFullYear(); 

	var col_name           = new nlobjSearchColumn('name');
	var col_dateObserved   = new nlobjSearchColumn('custrecord_date_observed');

	try {
		if (!searchHolidaysResults) {
			var arrColumns         = new Array();
			col_dateObserved.setSort();
			arrColumns.push(col_name);
			arrColumns.push(col_dateObserved);
			var arrFilters   = [         ['isinactive'                        ,'IS'              ,false ]
	                            ,'AND'  ,['custrecord_date_observed'          ,'after'           ,["today"] ]
	                           ];
			var searchHolidaysObj = nlapiCreateSearch('customrecord_bank_holiday' ,arrFilters ,arrColumns);
			var searchHolidaysResultSet = searchHolidaysObj.runSearch();
			searchHolidaysResults = searchHolidaysResultSet.getResults(0,1000);
			millisecs24Hours = 24 * 60 * 60 * 1000; // 1 day = 24 hours * 60 minutes * 60 seconds * 1000 milliseconds
		}
		
		var tryAnotherDay = true;
		while (tryAnotherDay) {
			nbrMillisecs = objNextBusinessDay.getTime() + millisecs24Hours; //Add 1 day
			objNextBusinessDay.setTime(nbrMillisecs); // Update datetime variable using new milliseconds value
			var nbd = (objNextBusinessDay.getMonth() + 1) + "/" + objNextBusinessDay.getDate() + "/" + objNextBusinessDay.getFullYear(); 
			var dayOfWeek = objNextBusinessDay.getDay();
			if (dayOfWeek>0 && dayOfWeek<6) {
				var skipThisDate = false;
				for (var i=0; i<searchHolidaysResults.length; i++) { if (searchHolidaysResults[i].getValue(col_dateObserved) == nbd) { skipThisDate = true; break; } }
				if (!skipThisDate) { tryAnotherDay = false; }
			} // if (dayOfWeek>0 && dayOfWeek<6)
		} // while (tryAnotherDay)
	} 
	catch(e) { alert(e.message) }
    return objNextBusinessDay;
}


//====================================================================================================================
//====================================================================================================================
function main(){
	initFee();
	initDashboard();
	objToday = new Date();
	getNextBusinessDay(objToday); // ATO-112: This causes the holidays search to occur during page load so there is no delay when checkbox is clicked later
}


//====================================================================================================================
//====================================================================================================================
function initFee(){
	!function(window, document, $, undefined) {
	    var constructor = function() {
	        var isFeeEdit = false,
	            self = this;
	        
	        this.dashboardTable = $('#payment-dashboard');
	        this.feeWrapper = this.dashboardTable.find('.feeamt');
	        this.feeContainer = this.dashboardTable.find('.fee-container');
	        this.feeField = this.dashboardTable.find('.fee');
	        this.feeInput = this.dashboardTable.find('input.feeamt_freetext');

	        this.getIsFeeEdit = function(el) {
	        	return el;
	        };
	        
	        this.getFee = function(){
	        	return self.feeInput.val() || '';
	        };

	        this.getDefaultFee = function(el){
	        	return self.feeInput.data('default-fee') || '';
	        };
	        
	        //Validate fee using regex and value range
	        this.validateFee = function(el) {
	            var regEx = /^(\d+|\d+\.\d\d)$/,
	            	fee = el.val(),
	            	gross = el.closest('tr').find('.gross').attr('data-gross'),
	            	feeFloat = parseFloat(fee, 10) || 0,
	            	grossFloat = parseFloat(gross, 10) || 0;
	            
	            if (fee == '' || (regEx.test(fee) && feeFloat >= 0 && feeFloat <= 100 && feeFloat <= grossFloat)) {
	            	return true;
	            }
	            else {
	                return false;
	            }
	        };
	        
	        this.updateFeeLabel = function(el){
	        	var feeField = el.siblings('.fee');
	        	
	        	feeField.text('$' + parseFloat(Math.abs(el.val())).toFixed(2));
	        	console.log('el: ' + el.val());
	        };
	        
	        this.hideEditFee = function(el){
	        	el.siblings('.fa-pencil-square').toggleClass('hide');
	        	el.attr('type', 'hidden');
	        	el.siblings('.fee').toggleClass('hide');
	        };
	        
	        //Alert that the fee was invalid; no validation logic
	        this.alertFee = function(){
	        	alert('Invalid fee. Please enter a value of ## or ##.## between 0 and 100 and less than the Payment Gross.');
	        };
	        
	        //Launch confirmation screen for fee editing
	        this.feeEditConfirmation = function(el) {
	            if (window.confirm('Are you sure you want to edit Fee?')) {
	            	self.editFee(el);
	            }
	        };
	        
	        this.isOverDefaultFee = function(el){
	        	if(el.val() > el.data('default-fee')){
	        		return true;
	        	}
	        	
	        	return false;
	        };
	        
	      //Launch confirmation screen for fee editing
	        this.feeOverchargeConfirmation = function(el) {
	            if (!window.confirm('Are you sure you want to raise the fee?')) {
	            	var previousFee = el.data('prev-fee');
	            	el.val(previousFee);
	            	el.siblings('.fee').text(previousFee);
	            }
	        };

	        //Make the the fee editable; hides label, shows input, and highlights/selects input value.
	        this.editFee = function(el) {
	        	var feeInput = el.siblings('input.feeamt_freetext');

	            if (!feeInput.is(':visible')) {
	                el.closest('.fee').toggleClass('hide');
	                el.closest('.fa-pencil-square').toggleClass('hide');
	                
	                feeInput.attr('type', 'text').attr('data-prev-fee', feeInput.val());//.select();
	            }
	        };

	        //Show edit icon when entering fee
	        this.feeContainer.on('mouseenter', function(e) {
	        	var el = $(this);
	        	
	        	if (!el.find('input.feeamt_freetext').is(':visible')) {
	                el.find('.fa-pencil-square').toggleClass('hide');
	            }
	        });

	        //Hide edit icon when leaving fee
	        this.feeContainer.on('mouseleave', function(e) {
	            var el = $(this);
	            
	        	if (!el.find('input.feeamt_freetext').is(':visible')) {
	        		el.find('.fa-pencil-square').toggleClass('hide');
	            }
	        });

	        //Launch fee edit when clicking on fee label
	        this.feeField.on('click', function(e) {
	            var el = $(this);
	            
	        	if(el.is(':visible')){
	            	self.feeEditConfirmation(el);
	            }
	        });
	        
	        //Validate fee input when it loses focus
	        this.feeInput.on('blur', function(e){
	        	var	el = $(this),
	        		validFee = self.validateFee(el);
	        	
	        	if(!validFee){
	        		//Alert user that fee is invalid and reset fee to default value
	        		self.alertFee(el);
	        		el.val(el.attr('data-default-fee'));
	        		el.attr('data-prev-fee', el.val());
	        	}
	        	
	        	//Confirm to user that fee is value but higher than fee set in the Deal for payment type
	        	if(validFee && self.isOverDefaultFee(el)){
	        		self.feeOverchargeConfirmation(el);
	        	}
	        	
	        	//Handle empty input
	        	if(self.feeInput.val() === ''){
	        		self.feeInput.val(0);
	        	}
	        	
	        	self.updateFeeLabel(el);
	        	self.hideEditFee(el);
	        });
	        
	        this.feeInput.on('keypress', function(e){
	        	if(e.which == 13){
	        		e.preventDefault();
		        	e.stopPropagation();
	        		$(this).blur();
	        	}
	        });
	    };

	    //Expose module to window
	    window.DAFeeValidator = new constructor();

	}(window, document, jQuery);
}

//====================================================================================================================
//====================================================================================================================
function initDashboard(){
	!function(window, $){
		var constructor = function(){
			var self = this;
          
			
			$('.table_fields').closest('td').attr('width', '100%');
			this.paymentForm = $('form#main_form');
			this.paymentTable = $('table#payment-dashboard');
			this.voidButtons = this.paymentTable.find('.voidBtn');
			this.selectApprovalCheckboxes = this.paymentTable.find('.btn-approve-selected');
			this.selectApproveAll = this.paymentTable.find('th input#approve-selected-all');
			this.submitApprovalSelectedQM = this.paymentForm.find('.approve-selected-qm');
			this.approvalErrors = this.paymentTable.find('.approval-error');
			this.nextButton = $('.next-page');
			this.previousButton = $('.previous-page');
			this.currentPage = $('#dashboard-page');
			this.filterButton = $('#filterdashboard');
			this.requestCount = 0;
			
			var user = nlapiGetUser();
			var param_UseQueueManger =  nlapiGetContext().getSetting('SCRIPT', 'custscript_pmt_dash_uses_queue_manager');

			this.submitButtonsQM = this.paymentTable.find('.approveBtn');
			this.reprocessButtonsQM = this.paymentTable.find('.reprocessBtn');

			//==============================================================================================================
			//==============================================================================================================
			this.initTable = function(){
				//Fix for poor UI html from NetSuite
				self.paymentTable
				  .parents('#detail_table_lay')
				  .children('tbody')
				    .children('tr')
				    .eq(2)
				      .children('td')
				      .eq(0)
				      .attr('colspan', '3');
				
				//Remove sibling <td> generated by NetSuite, that is throwing off layout.
				self.paymentTable.parents('.uir-fieldgroup-content').parent().parent().parent().siblings('td').remove();
				
				var enabled = self.paymentTable.find('tbody td:last-child input:not([disabled])').length;
				
				if(!enabled){
					this.paymentTable.find('thead th:last-child input').attr('disabled', 'disabled');
				}
			};
			
			
			
			//==============================================================================================================
			//==============================================================================================================
			this.voidApproval = function(cb, data, el){
				var overlay = '<div class="overlay"><div class="custom-loader"></div></div>',
				request = null;
				
				if(el){
					el.each(function(){
						var _el = $(this).closest('tr'),
							refund = _el.find('.refund a'),
							refundid = refund.data('refundid') || 0,
							lotid = (data && data.data && data.data.id) ? data.data.id : 0;

						_el.addClass('active');
						_el.find('.btn-approve-selected').remove();
						_el.find('td.approval-column').prepend(overlay);

						_el.find('td.approval-column button').hide( 'fast', function() {
							if(refundid){
								try{
									//Void the refund
									nlapiVoidTransaction('customerrefund', refundid);
									
									//Set the specified LOT's related refund to null/empty and set it's Acquiom Status to 5
									nlapiSubmitField('customrecord_acq_lot', lotid, ['custrecord_acq_loth_related_refund', 'custrecord_acq_loth_zzz_zzz_acqstatus'], ['', 5], false);
									
									//Remove the refund link from the dashboard
									refund.remove();
									//_el.find('td.approval-column button').remove();
									_el.find('td.approval-column').append( 'VOIDED' );
								}
								catch(err){
									nlapiLogExecution('ERROR', 'UNABLE TO VOID CUSTOMER REFUND ON PAYMENTS DASHBOARD', refundid);
									nlapiLogExecution('ERROR', 'VOID ERROR FOR REFUND', err.toString() );
									alert( 'System responded with an error: ' + err.toString() );
								}
							}
							
							_el.find('.overlay').remove();
							
						});
					});
				}
			};

			

			//=====================================================================================================
			//=====================================================================================================
			this.confirmSelectedApprovalsQM = function(el){
				if (window.confirm('Approval Confirmation - Are you certain you want to approve these records?')) {
					self.submitSelectedApprovalsQM(el);
	            }
			};
			
			
			
			//=====================================================================================================
			// New Queue Manager version of submitSelectedApprovals
			//=====================================================================================================
			this.submitSelectedApprovalsQM = function(el){
				var _inputs = {userid: nlapiGetUser(), type: 'GROUP', userid: nlapiGetUser()},   //KEN - THIS APPEARS TO BE A HARMLESS BUG - userid declared twice. The second assign overwrites the first
				_data = [],
				selected = self.paymentTable.find('tr input:checked'),
				_feeInput = null,
				_input = {},
				el = null;
			
				if(selected.length == 0){
					return;
				}
				
				var rows = self.paymentTable.find('tbody tr input:checked').closest('tr');
				
				rows.each(function(){
					el = $(this);
					_input.id = el.find('td:first > a').attr('data-exrecid');
					
					var arrExchangeRecordIds = [];
					var thisRecordCanBeProcessed = true;
                    var fields = ['custrecord_acq_loth_zzz_zzz_acqstatus'];
                    var action = 'QUEUED'; 
                    
    		        el.find('.btn-approve-selected').remove(); // we remove the button here now 
            		el.find('.overlay').remove();
            		el.removeClass('active');
        			approveCell = el.find('td.approval-column');
        			approveCell.html('<span class="approval-status">' + action + '</span>');
                    
                    _input.acqStatus = status;  // Save original status, pass it to sched script
                  
                    if (thisRecordCanBeProcessed) {
                    	
					   _feeInput = el.find('td.feeAmt input');
					
					   if(_feeInput && _feeInput.val() != _feeInput.attr('data-default-fee')){
					     _input.fee = _feeInput.val();
					   }
					
					   _data.push(_input);
					
					   _feeInput = null;
					   _input = {};
					   el = null;
                      
                    }
                  
				});
				
				_inputs.data = _data;
				
				// ATP-353 Here is where the Queue Manager entry will be created
				// It is not possible to do that from this Client Script, so here we call a SuiteLet to do that for us
	  			try {
	    			var sData = JSON.stringify(_data);
	                var suiteletUrl = nlapiResolveURL("SUITELET" ,"customscript_acq_lot_da_qm_addqueueentry" ,"customdeploy_acq_lot_da_qm_addqueueentry");
	   	            
	                var thisUser = nlapiGetUser();
	                var batchNbr = Math.floor(Math.random() * 10 + 1);
	                
	                // ATO-112
	                var paymentsEffectiveDate = "";
	            	var chkNextBusinessDay = document.getElementById("chkNextBusinessDay");
	            	if (chkNextBusinessDay) {
		            	var vPaymentsEffectiveDate = document.getElementById("txtPaymentsEffectiveDate");
		            	if (chkNextBusinessDay.checked) {
		            		var txtPaymentsEffectiveDate = document.getElementById("txtPaymentsEffectiveDate");
		            		paymentsEffectiveDate = "&paymentsEffectiveDate=" + txtPaymentsEffectiveDate.value;
		            	}
	            	}
	                var fullSuiteletUrl = suiteletUrl + "&user=" + thisUser + "&batchNbr=" + batchNbr + "&type=" + "GROUP" + "&queueName=" + "ApprovePaymentsRequest" + paymentsEffectiveDate + "&exchangeRecordList=" + sData;
	                // end ATO-112
	                console.log(fullSuiteletUrl);
	                
	                var response = nlapiRequestURL(fullSuiteletUrl ,null ,null ,null ,'GET');
	                if (response.getBody()) { var body =response.getBody(); console.log(body);  }
	  			} 
	  			catch (ee) { console.log("Submit Q Manager Request Exception: " + ee); }
				
			};
			
			
			
			
			//=====================================================================================================
			//=====================================================================================================
			this.submitApprovalSelectedQM.on('click', function(e){
				e.preventDefault();
				e.stopPropagation();
				self.confirmSelectedApprovalsQM($(this));
			});
			
			
			
			
			//=====================================================================================================
			//=====================================================================================================
			// New Queue Manager Event listener on the individual submit buttons.
			this.submitButtonsQM.on('click', function(e){
				e.preventDefault();
				e.stopPropagation();
				var _input = {};
				var _data = [];
				
				var el = $(this),
					userID = nlapiGetUser(),
					exrec = el.closest('tr').find('td:first-child a'),
					_feeInput = el.closest('tr').find('td.feeAmt input');
				
				_input.id = (exrec ? exrec.attr('data-exrecid') : -1);
				
				if(_feeInput && _feeInput.val() != _feeInput.attr('data-default-fee')){
				    _input.fee = _feeInput.val();
				}
				
                var action = 'QUEUED'; 
                _input.acqStatus = status;  // Save original status, pass it to sched script

                var row = el.closest('tr');
                row.find('.btn-approve-selected').remove(); // we remove the button here now 
                row.find('.overlay').remove();
                row.removeClass('active');
    			approveCell = row.find('td.approval-column');
    			approveCell.html('<span class="approval-status">' + action + '</span>');

				_data.push(_input);
                
                // Here is the new Queue Manager based logic ATP-353
	  			try {
	    			var sData = JSON.stringify(_data);
	                var suiteletUrl = nlapiResolveURL("SUITELET" ,"customscript_acq_lot_da_qm_addqueueentry" ,"customdeploy_acq_lot_da_qm_addqueueentry");
	   	            
	                var thisUser = nlapiGetUser();
	                var batchNbr = Math.floor(Math.random() * 10 + 1);
	                
	                // ATO-112
	                var paymentsEffectiveDate = "";
	            	var chkNextBusinessDay = document.getElementById("chkNextBusinessDay");
	            	if (chkNextBusinessDay) {
		            	if (chkNextBusinessDay.checked) {
		            		var txtPaymentsEffectiveDate = document.getElementById("txtPaymentsEffectiveDate");
		            		paymentsEffectiveDate = "&paymentsEffectiveDate=" + txtPaymentsEffectiveDate.value;
		            	}
	            	}
	                var fullSuiteletUrl = suiteletUrl + "&user=" + thisUser + "&batchNbr=" + batchNbr + "&type=" + "GROUP" + "&queueName=" + "ApprovePaymentsRequest" + paymentsEffectiveDate + "&exchangeRecordList=" + sData;
	                // end ATO-112
	                console.log(fullSuiteletUrl);
	                var response = nlapiRequestURL(fullSuiteletUrl ,null ,null ,null ,'GET');
	                if (response.getBody()) { var body =response.getBody(); console.log(body);  }
	  			} 
	  			catch (ee) { console.log("Submit Q Manager Request Exception: " + ee); }
			});
			
			
			
			
			//=====================================================================================================
			//=====================================================================================================
			//Event listener on the individual Re-Process submit buttons.
			this.reprocessButtonsQM.on('click', function(e){
				e.preventDefault();
				e.stopPropagation();

				var _input = {};
				var _data = [];
				
				var el = $(this),
					userID = nlapiGetUser(),
					exrec = el.closest('tr').find('td:first-child a'),
					_feeInput = el.closest('tr').find('td.feeAmt input');

				_input.id = (exrec ? exrec.attr('data-exrecid') : -1);
				_input.reprocess = true;
					
				if(_feeInput && _feeInput.val() != _feeInput.attr('data-default-fee')){
					_input.fee = _feeInput.val();
				}
				
                var action = 'QUEUED'; 
                _input.acqStatus = status;  // Save original status, pass it to sched script

                var row = el.closest('tr');
                row.find('.btn-approve-selected').remove(); // we remove the button here now 
                row.find('.overlay').remove();
                row.removeClass('active');
    			approveCell = row.find('td.approval-column');
    			approveCell.html('<span class="approval-status">' + action + '</span>');

				_data.push(_input);
			
                // Here is the new Queue Manager based logic ATP-353
	  			try {
	    			var sData = JSON.stringify(_data);
	                var suiteletUrl = nlapiResolveURL("SUITELET" ,"customscript_acq_lot_da_qm_addqueueentry" ,"customdeploy_acq_lot_da_qm_addqueueentry");
	   	            
	                var thisUser = nlapiGetUser();
	                var batchNbr = Math.floor(Math.random() * 10 + 1);
	                
	                // ATO-112
	                var paymentsEffectiveDate = "";
	            	var chkNextBusinessDay = document.getElementById("chkNextBusinessDay");
	            	if (chkNextBusinessDay) {
		            	if (chkNextBusinessDay.checked) {
		            		var txtPaymentsEffectiveDate = document.getElementById("txtPaymentsEffectiveDate");
		            		paymentsEffectiveDate = "&paymentsEffectiveDate=" + txtPaymentsEffectiveDate.value;
		            	}
	            	}
	                var fullSuiteletUrl = suiteletUrl + "&user=" + thisUser + "&batchNbr=" + batchNbr + "&type=" + "GROUP" + "&queueName=" + "ApprovePaymentsRequest" + paymentsEffectiveDate + "&exchangeRecordList=" + sData;
	                // END ATO-112
	                console.log(fullSuiteletUrl);
	                var response = nlapiRequestURL(fullSuiteletUrl ,null ,null ,null ,'GET');
	                if (response.getBody()) { var body =response.getBody(); console.log(body);  }
	  			} 
	  			catch (ee) { console.log("Submit Q Manager Request Exception: " + ee); }
			
			});
			
			
			
			//=====================================================================================================
			//=====================================================================================================
			this.voidButtons.on('click', function(e){
				e.preventDefault();
				e.stopPropagation();
				
				var el = $(e.target),
					userID = nlapiGetUser(),
					exrec = el.closest('tr').find('td:first-child a'),
					_data = {id: (exrec ? exrec.attr('data-exrecid') : 0)},
					_inputs = {userid: userID, data: _data};
				
				self.voidApproval(function(data){}, _inputs, el);
			});

			
			
			//=====================================================================================================
			//=====================================================================================================
			//Event listener for the approve all checkbox in the table head.
			this.selectApproveAll.on('change', function(e){
				var el = $(this);
				
				if(el.is(':checked')){
					self.selectApprovalCheckboxes.prop('checked', true);
				}
				else{
					self.selectApprovalCheckboxes.prop('checked', false);
				}
			});
			
			
			
			//=====================================================================================================
			//=====================================================================================================
			this.selectApprovalCheckboxes.on('click', function(e){
				console.log(e);
				self.selectApproveAll.prop('checked', false);
			});
			
			
			
			//=====================================================================================================
			//=====================================================================================================
			//Event listener for the filter button.
			this.filterButton.on('click', function(e){
				e.preventDefault();
				e.stopPropagation();
				
				//Reset pagination to page 1
				self.currentPage.val(1);
				
				//Submit form after any data/filter massaging.
				self.paymentForm.submit();
			});
			
			
			
			//=====================================================================================================
			//=====================================================================================================
			this.approvalErrors.on('click', function(e){
				var el = $(this),
					error = el.attr('data-error'),
					modal = '<div class="approval-error-body">{err}</div>';
				
				$(modal.replace('{err}', !error || error == ' ' ? 'Approval is in invalid state' : error)).dialog({
					title: 'Approval Error',
					buttons: [{
						text: 'Close',
						click: function(e){
							$(this).dialog("close");
						}
					}],
					width: 300,
					height: 200,
					position: { my: 'center', at: 'center', of: 'body'},
					closeOnEscape: true
				});
			});
			
			
			
			//=====================================================================================================
			//=====================================================================================================
			this.nextButton.on('click', function(e){
				e.preventDefault();
				e.stopPropagation();
				
				if(self.paymentTable.find('.overlay').length == 0){
					self.currentPage.val(parseInt(self.currentPage.val()) + 1);
					self.paymentForm.submit();
				}
			});
			
			
			
			//=====================================================================================================
			//=====================================================================================================
			this.previousButton.on('click', function(e){
				e.preventDefault();
				e.stopPropagation();

				if(parseInt(self.currentPage.val()) > 1 && self.paymentTable.find('.overlay').length == 0){
					self.currentPage.val(parseInt(self.currentPage.val()) - 1);
					self.paymentForm.submit();
				}
			});
			
			
			
			//=====================================================================================================
			//=====================================================================================================
			$(window).on('beforeunload', function(e){
				if(self.requestCount > 0){
					return 'There are active approvals. Are you sure you want to continue?';
				}
	        });
		};
		
		window.SRS = window.SRS || {};
		window.SRS.PaymentDashboard = new constructor();
		
		window.SRS.PaymentDashboard.initTable();
	}(window, jQuery, undefined);
}