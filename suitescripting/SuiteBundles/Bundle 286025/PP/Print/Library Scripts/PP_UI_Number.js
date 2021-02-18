/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       27 Apr 2015     maxm
 *
 */


var PPPaymentNumberer = function(options){
	
	var defaults = {
		timeoutId : null,
		lastClickDate : null,
		ajaxInProgress: false,
		toNumberQueue: [],
		toUnnumberQueue: [],
		getURL: function(){
			if(typeof this.url == 'undefined'){
				this.url = nlapiResolveURL('SUITELET', 'customscript_pp_sl_numberchecks', 'customdeploy_pp_sl_numberchecks');
			}
			return this.url;
		},
		getNumQueuedItems: function(){
			return this.toNumberQueue.length + this.toUnnumberQueue.length;
		},
		updateInProgressIndicator : function(){
			if(this.ajaxInProgress || this.getNumQueuedItems() > 0){
				jQuery('#numberingStatus').text('Payments numbering/unnumbering in progress. Please be patient, payments may take 2-5 seconds per item to update.');
			}
			else{
				jQuery('#numberingStatus').html('&nbsp;');
			}
			
		},
		addToNumber: function(obj, deferCheeseAndSuch){
			console.log('Adding to number queue');
			for(var i = 0; i < this.toUnnumberQueue.length; i++){
				if(this.toUnnumberQueue[i].id == obj.id){
					this.toUnnumberQueue.splice(i,1);
					this.cheese();
					console.log('Found in unnumbered queue');
					return;
				}
			}
			
			this.toNumberQueue.push(obj);
			if(!deferCheeseAndSuch){
				this.cheese();
				this.lastClickDate = new Date();
				this.updateInProgressIndicator();
			}
		},
		addManyToNumber: function(objArr){
			for(var i = 0; i < objArr.length; i++){
				console.log(objArr);
				this.addToNumber(objArr[i],true);
			}
			this.cheese();
			this.lastClickDate = new Date();
			this.updateInProgressIndicator();
			
		},
		addToUnnumber: function(obj){
			console.log('Adding to number queue');
			for(var i = 0; i < this.toNumberQueue.length; i++){
				if(this.toNumberQueue[i].id == obj.id){
					this.toNumberQueue.splice(i,1);
					this.cheese();
					console.log('Found in numbered queue');
					return;
				}
			}
			
			this.toUnnumberQueue.push(obj);
			this.cheese();
			this.lastClickDate = new Date();
			this.updateInProgressIndicator();
		},
		onSuccess: function(item,i){
			 /*var ids = 'custpage_pp_pc_checknum_id_' + item.i;
			 jQuery('#' + ids).html(item.checknumber);*/
		},
		onFail: function(item,i){
			/*nlapiSetLineItemValue('cust_sublist_unnumbered', "custpage_pp_pc_checkbox", item.i,'F');*/
		},
		cheese: function(now){
			if(!this.ajaxInProgress){
				console.log('Ajax not in progress. Reset timeout');
				if(typeof this.timeoutId == "number"){
					clearTimeout(this.timeoutId);
				}
				var self = this;
				// if 5 or more items are queued up, start ajax now
				var timeoutLength = 1000;
				if(self.getNumQueuedItems() >= 5 || now){
					timeoutLength = 0;
				}
				
				// throttle the queue
				this.timeoutId = setTimeout(function(){
					if(self.getNumQueuedItems() == 0){
						return;
					}
					self.ajaxInProgress = true;
					delete self.timeoutId;
					console.log('Timeout expired. Ajax in progress.');
					
					var items = {
							toNumber: [],
							toUnnumber: []
					};
					
					// Build items to send to server. Only take maxPerRequest items. Unnumber before numbering to possibly save check numbers
					var maxPerRequest = 25;
					var numSliced = 0;
					if(self.toUnnumberQueue.length > 0){
						if(self.toUnnumberQueue.length > maxPerRequest){
							numSliced = maxPerRequest;
						}
						else{
							numSliced = self.toUnnumberQueue.length;
						}
						items.toUnnumber = self.toUnnumberQueue.splice(0,numSliced);
					}
					
					var numSpotsLeft = maxPerRequest - numSliced;
					numSliced = 0;
					if(self.toNumberQueue.length > 0 && numSpotsLeft > 0){
						if(self.toNumberQueue.length > numSpotsLeft){
							numSliced = numSpotsLeft;
						}
						else{
							numSliced = self.toNumberQueue.length;
						}
						items.toNumber = self.toNumberQueue.splice(0,numSliced);
					}
					
					
					jQuery.ajax({
						  type: "POST",
						  url: self.getURL(),
						  data: { 'data': JSON.stringify(items)},
						  success: function(b){
							  try{
								  b = JSON.parse(b);
							  }
							  catch(e){
								  console.log(e);
								  alert('An error occured. Please have your admin verify you have access to customdeploy_pp_sl_numberchecks script deployment and try again.');
								  location.reload();
								  return;
							  }
							  
							  if(b.success == "true"){
								  
								  var succeeded = b.result.succeeded;
								  for(var i = 0; i < succeeded.length; i++){
									  self.onSuccess(succeeded[i],i);
									  /*var ids = 'custpage_pp_pc_checknum_id_' + succeeded[i].i;
									  jQuery('#' + ids).html(succeeded[i].checknumber);*/
								  }
								  
								  var failed = b.result.failed;
								  for(var i = 0; i < failed.length; i++){
									  self.onFail(failed[i],i);
								  }
								  if(b.result.failed.length > 0){
									  alert('One or more payments could not be numbered. Please verfiy you have access to the payment type and try again.');
								  }
								  
								  self.ajaxInProgress = false;
								  self.updateInProgressIndicator();
								  
								  if(self.toNumberQueue.length > 0 || self.toUnnumberQueue.length > 0){
									  self.cheese((new Date() - self.lastClickDate) > 1000);
								  }
								  
							  }
						  },
						  error:function(err){
							  console.log(err);
						  },
						  async:true
						});
					
				},timeoutLength);
			}
			else{
				console.log('Ajax in progress.');
			}
		} 
	};
	
	jQuery.extend(this,defaults,options);
};