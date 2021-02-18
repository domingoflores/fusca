/***************************************************************************
 * This script manages the updates to the Letter of Transmittal - LOT
 * which is the NetSuite's RMA record
 * 
 * @author Herb Joseph - herb.joseph@emergetech.com
 * 
 * 
 *************************************************************************/

	var PRICE_IDS = {};
	PRICE_IDS ['1']='68';
	PRICE_IDS ['2']='67';
	PRICE_IDS ['3']='78';
	PRICE_IDS ['4']='66';
	PRICE_IDS ['5']='79';
function run(){
	try{
		var stageId = '2';
		var dealId = '275559';
		
		var csvArray = getData(stageId, dealId);
		
		if (csvArray == null || csvArray.length < 1){
			nlapiLogExecution('debug', 'run', 'no RMA data found');
			return;
		}
	
		
		nlapiLogExecution('debug', 'run', 'csvArray.length = ' + csvArray.length);
		
		
		
		
		for(var i=0; i<csvArray.length; i++){
			
			try{
				var rma = null;
				nlapiLogExecution('debug', 'run', ' csvData=' + JSON.stringify(csvArray[i]));
				rma = getRMA(csvArray[i].custrecord_aqm_csv_cert_hash_key);
				
				
				if (rma == null){
					nlapiLogExecution('Debug', 'run','could not find rma for cert key - ' +  csvArray[i].custrecord_aqm_csv_cert_hash_key  );
					continue;
				}
				updateRMA(rma, csvArray[i]);
			}catch(e){
				
				nlapiLogExecution('Error', 'run','Unexpected error in RMA for loop - ' + e.message);
				
			}

			
			
		}

		nlapiLogExecution('debug', 'run', ' Script finished');
	}catch(e){
		nlapiLogExecution('Error', 'run', 'Unexpected error - ' + e.message);
	}
	
}
/***********************************************************
 * Update the quantity on the RMA
 * 
 * @param rma
 * @param csvData
 ***********************************************************/
function updateRMA(rma, csvData){
	var paymentId = rma.getFieldValue('custbody_acq_lot_payment_method_3');
	nlapiLogExecution('Debug', 'run','in updateRMA.');
	
	
	for(var i=1; i<= rma.getLineItemCount('item'); i++){
		
		for(var p=0; p<csvData.lineItems.length; p++){
		
			if (csvData.lineItems[p].rowId == rma.getLineItemValue('item','custcol_acq_certhash', i)){
				
				
				rma.setLineItemValue('item', 'quantity', i, csvData.lineItems[p].quantity);
				
			}


		}

	}
	var entryStatus = rma.getFieldValue('custbody_aqm_lotentrystatus');
	nlapiLogExecution('debug', 'run', ' entryStatus = ' + entryStatus);
	var paymentId = rma.getFieldValue('custbody_acq_lot_payment_method_3');
	
	if(entryStatus=='1' && paymentId != null){
		var prices = getLineItemPricing();
		nlapiLogExecution('debug', 'run', ' inside line item addition, paymentId = ' + paymentId);
		//pulls the record that was just submitted for editing

		//pulls the values for the wire and checking amounts and stores in an array, Prices.
		
		//prepares the value to be added to the line item
		
		
		var paymentNum = parseInt(paymentId, 10);
		paymentNum--;
		//adds the amount as a line item
		rma.selectNewLineItem('item');
		rma.setCurrentLineItemValue('item', 'item', PRICE_IDS[paymentId]);
		//sets the checking amount to negative
		nlapiLogExecution('debug', 'run', ' paymentNum = ' + paymentNum + ' - payment ID = '+paymentId + ' price IDs = '+ PRICE_IDS[paymentId]);
		var amountToAdd = -1*prices[paymentNum].amount;
		nlapiLogExecution('debug', 'run', ' amountToAdd = ' + amountToAdd);
		rma.setCurrentLineItemValue('item', 'amount', amountToAdd);
		rma.commitLineItem('item');
		//submits the record
		
		
	}
	
	nlapiLogExecution('Debug', 'run','in updateRMA.');
	
	nlapiSubmitRecord(rma);
	
}

/************************************************************************
 * Search for the RMA (LOT) by Share holder Certificate Hash
 * 
 * 
 * @param certHash
 ***********************************************************************/
function getRMA(certHash){
	try{
		var searchFilters = new Array();
		searchFilters[0] = new nlobjSearchFilter('custbody_acq_shash', null, 'is',certHash );
		var searchResults = nlapiSearchRecord('returnauthorization',null,searchFilters,null);
		if (searchResults == null) return null;
		var rma = nlapiLoadRecord('returnauthorization', searchResults[0].getId());
		return rma;
	}catch(e){
		nlapiLogExecution('Error', 'getRMA', 'Unexpected error - ' + e.message);
		
	}
	
}
/**********************
 * Looks up the amount that a wire or check transfer will cost.
 * 
 * returns a JSON object with the pricing of the money transfer
 */
function getLineItemPricing(){
	var prices = [];
	

			
	var getAmount = function(priceId){
				var priceItem = nlapiLoadRecord('otherchargeitem',priceId);
				var linesTotal = priceItem.getLineItemCount('price');
				
				for(var j = 1; j<=linesTotal;j++){
					
					
					if(priceItem.getLineItemValue('price','currency',j)=='1')
						{
						
						
						return priceItem.getLineItemValue('price','price_1_',j);
						
						}
				}
				
				
				return 0;	
		}
	var counter =0;
	for(var x in PRICE_IDS){
		
			nlapiLogExecution('Debug', 'run', 'Amount being added to amount for '+getAmount(PRICE_IDS[x]));
		prices[counter] = {
				
				internalId :PRICE_IDS[x],
				amount : getAmount(PRICE_IDS[x])
					
			};
		counter++;
	}
	

	
	
	return prices;
	
}



