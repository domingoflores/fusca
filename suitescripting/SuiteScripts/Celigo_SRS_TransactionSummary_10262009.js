/**
 * @author Shiva
 */
var SRS = {};
SRS.WWW = (function(){ //private members
    
	function EscrowTransactionsSummary(){
    
        //instance vars
		var that = this;
		this.value = '';
		
		//used in client scriptgrove
		this.send = function(){
			
			var escrowTransactions = nlapiSearchRecord('customrecord18', 558, null, null);
			
			//JSON data struct
			var data = {
					escrowTransactions:[]		
			};

			if(escrowTransactions && escrowTransactions.length > 0)
			{
				var escrowTransactionColumns = escrowTransactions[0].getAllColumns();

				for(var i=0; i< escrowTransactions.length; i++)
				{					
					data.escrowTransactions.push({
						Ecsrow: escrowTransactions[i].getValue(escrowTransactionColumns[0]),
						EcsrowAccount: escrowTransactions[i].getValue(escrowTransactionColumns[1]),
						Shareholder: escrowTransactions[i].getValue(escrowTransactionColumns[2]),
						Denomination: escrowTransactions[i].getText(escrowTransactionColumns[3]),
						Deposits: escrowTransactions[i].getValue(escrowTransactionColumns[4]),
						Holdbacks: escrowTransactions[i].getValue(escrowTransactionColumns[5]),
						InvestmentEarnings: escrowTransactions[i].getValue(escrowTransactionColumns[6]),
						ClaimsPaid: escrowTransactions[i].getValue(escrowTransactionColumns[7]),
						Expenses: escrowTransactions[i].getValue(escrowTransactionColumns[8]),
						Disbursements: escrowTransactions[i].getValue(escrowTransactionColumns[9]),
						PendingClaims: escrowTransactions[i].getValue(escrowTransactionColumns[10]),
						InternalID: escrowTransactions[i].getValue(escrowTransactionColumns[11])
					});
				}
			}

			var ser = JSON.stringify(data);				
			response.setContentType('JAVASCRIPT', 'data.js');
			response.write('function getCeligoData() {return '+ser+'}');			
        };	
    }
    return { //public members
        main: function(request, response){
            try {			
				var timer = new Date().getTime();
	
                var ETS = new EscrowTransactionsSummary();
				ETS.send();				
				nlapiLogExecution('AUDIT', 'Total Execution Time (in milliseconds)', (new Date().getTime()) - timer);
            } 
            catch (e) {
				response.write(e.name || e.getCode()+' - '+ e.message || e.getDetails());
				response.write(' check line '+ Util.getLineNumber(e));
            }
        }
    }
})();