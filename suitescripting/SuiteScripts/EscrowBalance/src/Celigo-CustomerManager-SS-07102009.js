/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * @ FILENAME      : SRSCustomer.js
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
/*
 * 2005-2008 Celigo, Inc. All Rights Reserved.
 * 
 * Consultant: Clinton Blackburn
 * Version:    1.4
 * Type:       User Event
 * 
 * Revision to original noted above:
 *    07/10/2009 - Initial version
 *
 */
var SRS = {};
SRS.Customer = (function(){ //private members
    function CustomerManager(){
    	
		var that = this;
		
        //Use the following if we are dealing with an entity defined with the category as anything other than 'Investor Group' or 'Shareholder'
        this.getTransactionBalance = function(rec, cat){ //Number
            var bal = 0.0-0.0;
            var custbal = 0.0-0.0;
            var childbal = 0.0-0.0;
            
			if(rec.getFieldValue('balance'))
            	bal = parseFloat(rec.getFieldValue('balance'));
    
            if (rec.getFieldValue('depositbalance')) 
                custbal = parseFloat(rec.getFieldValue('depositbalance'));
            
            // for each child, get its balance
            childbal = that.getChildBalance(rec.getId());
            
            // add the child balance to this balance
            bal += (childbal + custbal);
            
            // Added by DAU, 3/17/2009 to account for switch to debiting and crediting bank deposits, etc. correctly.
            if (rec.getFieldValue('category') === '1' && bal < 0) 
                bal = bal * -1;
            
            return bal;
        }; 
        
		//Called by getTransactionBalance
		this.getChildBalance = function(id){ //Number
            var retval = 0.0-0.0;
            
            var searchresults = nlapiSearchRecord('customer', null, 
				new nlobjSearchFilter('parent', null, 'is', id), 
				new nlobjSearchColumn('balance'));
            
            for (var i = 0; searchresults && i < searchresults.length; i++) 
				if (id !== searchresults[i].getId() && searchresults[i].getValue('balance')) 
					retval += parseFloat(searchresults[i].getValue('balance'));
               
            return retval;
        };
     
        //Used if the category of customer is 'Investor Group' or 'Shareholder'
        this.getEscrowTransactionBalance = function(rec, cat){
            var bal = 0.0-0.0;
          
            // get the sum of the escrow transactions for the current id
            var filters = [];
            if (cat === '7') { // investor group
				var family = [rec.getId()];
				var childFilters = [new nlobjSearchFilter('parent', null, 'is', rec.getId()), new nlobjSearchFilter('isinactive', null, 'is', 'F')];
				var childs = nlapiSearchRecord('customer', null, childFilters);
				for (var i = 0; childs && i < childs.length; i++) 
					family.push(childs[i].getId());
				
				filters[0] = new nlobjSearchFilter('internalid', 'custrecord67', 'anyof', family);
			}
			else 
				if (cat === '2') // shareholder	
					filters[0] = new nlobjSearchFilter('companyname', 'custrecord67', 'startswith', rec.getFieldValue('companyname'), null);                  
            var results = nlapiSearchRecord('customrecord18', null, filters, 
				new nlobjSearchColumn('custrecord70', null, 'sum')); // escrow transactions
			if (results) {
				Util.log('found escrow sum', results[0].getValue('custrecord70', null, 'sum'));
				return results[0].getValue('custrecord70', null, 'sum') ? parseFloat(results[0].getValue('custrecord70', null, 'sum')) : 0.0;
			}
            return bal;
        };
     
    }
    return { //public members
        beforeSubmit: function(type, form, request){
            try {
            
            } 
            catch (e) {
                Util.log(e.name || e.getCode(), e.message || e.getDetails());
				Util.log('check line', Util.getLineNumber(e));
            	Util.handleError(e, 'Celigo-CustomerManager-SS.js', ['clinton.blackburn@celigo.com'], 6367);
            }
        },
        afterSubmit: function(type){
            try {
            
            } 
            catch (e) {
                Util.log(e.name || e.getCode(), e.message || e.getDetails());
				Util.log('check line', Util.getLineNumber(e));
            	Util.handleError(e, 'Celigo-CustomerManager-SS.js', ['clinton.blackburn@celigo.com'], 6367);
            }
        },
        beforeLoad: function(type, form, request){
            try {
				Util.log('beforeLoad', type);
				if (type.toLowerCase() === 'view' || type.toLowerCase() === 'edit') {
					
					var bal = 0.0 - 0.0;
					var rec = nlapiGetNewRecord();
					if (!rec) 
						return;
					
					var cm = new CustomerManager();
					
					// Get the customer category: 1 = Escrow; 2 = Shareholder; 7 = Investor Group
					var cat = rec.getFieldValue('category');
					Util.log('Category', rec.getFieldText('category'));
					
					if (cat === '7' || cat === '2') 
						bal = cm.getEscrowTransactionBalance(rec, cat);
					else 
						bal = cm.getTransactionBalance(rec);
					
					Util.log('Total Transaction Balance', bal);	
					//var balance = form.addField('custpage_escrow_balance', 'currency', 'Test Escrow Balance', null, 'main');
					//balance.setDefaultValue(nlapiFormatCurrency(bal));
					//balance.setDisplayType('inline');
					
					// set the 'Escrow Balance' for the account
					rec.setFieldValue('custentity7', nlapiFormatCurrency(bal));
				}
            } 
            catch (e) {
                Util.log(e.name || e.getCode(), e.message || e.getDetails());
				Util.log('check line', Util.getLineNumber(e));
            	Util.handleError(e, 'Celigo-CustomerManager-SS.js', ['clinton.blackburn@celigo.com'], 6367);
            }
        }
    }
})();


