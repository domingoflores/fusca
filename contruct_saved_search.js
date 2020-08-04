    		var arrColumns              = new Array();
    		var col_InternalId          = search.createColumn({ "name":"internalid"  });
    		var col_formula_Shareholder_deal = search.createColumn({ "name":"formulatext" ,"type":"text" ,"formula":shareholderDealText });
    		arrColumns.push(col_InternalId);
    		arrColumns.push(col_formula_Shareholder_deal);
    		
    		var arrFilters   = [         ['isinactive'    ,'IS'       ,false ]
    		                    ,'AND'  ,['internalid'    ,'ANYOF'    ,exchangeRecordArray ]
    	                       ];
    		var searchMapReduceObj = search.create({'type':'customrecord_acq_lot'
    		                                           ,'filters':arrFilters 
    	                                               ,'columns':arrColumns 	       });