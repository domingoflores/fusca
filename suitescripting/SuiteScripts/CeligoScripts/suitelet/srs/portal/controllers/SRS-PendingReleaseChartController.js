/**
 * @author durbano
 */
SRSUtil = {};
SRSUtil.getURLParameter = function(_url, _name){ //String
    var regexS;
    var regex;
    var results;
    _name = _name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    regexS = "[\\?&]" + _name + "=([^&#]*)";
    regex = new RegExp(regexS);
    results = regex.exec(_url);
    if (results === null) {
        return "";
    }
    else {
        return results[1];
    }
}

// main function
Ext.onReady(function(){
    try
	{
		var releaseData  = generateData();
		
		var releaseStore = loadData(releaseData);

		// render table
		renderTable(releaseStore);
		        
        //hide loader
        document.getElementById('loader').style.display = 'none';
    } 
    catch (e) {
        //hide loader
        document.getElementById('loader').style.display = 'none';
        document.getElementById('message').innerHTML = '<p>No transactions found.</p>' + e;
    }
    
});

// major functions
function generateData()
{
	// make sure we have data to process
	if(SRSBalances == null || SRSBalances.get708().length == 0)
		document.getElementById('message').innerHTML = '<p>No balances found to display.</p>';

	// calculate the total balances that must be accounted for
	var releaseData = new Array();
	var denomId, denom;
	for(var i = 0; i < SRSBalances.get708().length; i++)
	{
		var balance 	= eval('SRSBalances.get708()[i].custrecord70_val_4');
		var payable		= eval('SRSBalances.get708()[i].formulacurrency_val_7');
		if(balance <= 0) continue; // skip any zero balances
		if(payable <= 0) continue;

		var cumulativeEscrowRelease = 0.0;
		var acctId		= eval('SRSBalances.get708()[i].custrecord_glaccount_val_0');
		var acctName 	= eval('SRSBalances.get708()[i].custrecord_glaccount_GROUP_txt');
		denomId		= eval('SRSBalances.get708()[i].custrecord85_GROUP_1');
		denom		= eval('SRSBalances.get708()[i].custrecord85_GROUP_txt');
		
		// loop over release events
		for(var j = 0; SRSEvents.get709() != null && j < SRSEvents.get709().length; j++)
		{
			var eAcctId = eval('SRSEvents.get709()[j].custevent_gl_account_val_1');
			if(eAcctId != acctId) continue;
			
			var relPct 	= eval('SRSEvents.get709()[j].custevent29_val_3');
			relPct = relPct ? parseFloat(relPct) : 0;
						
			var relDate	= eval('SRSEvents.get709()[j].startdate_val_2');
			var relAmt	= (parseFloat(relPct) * parseFloat(payable)) / 100;
			
			cumulativeEscrowRelease += parseFloat(relAmt);
			
			// add new release row
			releaseData.push({
				 "release_date":relDate
				,"deal_account_id":acctId
				,"deal_account_name":acctName
				,"denomination_id":denomId
				,"denomination":denom
				,"release_amount":relAmt
			});
		}

		if((balance - cumulativeEscrowRelease).toFixed(2) > 0){
			releaseData.push({
				 "release_date": new Date(3000, 11, 31)
				,"deal_account_id":acctId
				,"deal_account_name":acctName + "**"
				,"denomination_id":denomId
				,"denomination":denom
				,"release_amount":(balance - cumulativeEscrowRelease).toFixed(2)
			});	
		}

		//cumulativeRelease += cumulativeEscrowRelease;
	}
	
	/*if((totalBalance - cumulativeRelease).toFixed(2) > 0){
		releaseData.push({
			 "release_date": new Date(3000, 11, 31)
			,"deal_account_id":0
			,"deal_account_name":"Unknown**"
			,"denomination_id":denomId
			,"denomination":denom
			,"release_amount":(totalBalance - cumulativeRelease).toFixed(2)
		});	
	}*/
	
	return releaseData;
}

function loadData(releaseData)
{
	var reader = new Ext.data.JsonReader({
        idProperty: 'id',
        fields: [{	//Release Date
            name: 'release_date',
            type: 'date'			
        }, {		//Deal Account ID
            name: 'deal_account_id',
            type: 'int'
        }, {		//Deal Account Name
            name: 'deal_account_name',
            type: 'string'
        }, {		//Denomination ID
            name: 'denomination_id',
            type: 'int'
        }, {		//Denomination
            name: 'denomination',
            type: 'string'
        }, {		// Release Amount
        	name: 'release_amount',
			type: 'float'
        }]
    });

    return new Ext.data.Store({
            reader: reader,
            autoDestroy: true,
            sortInfo: {
                field: 'release_date',
                direction: 'ASC'
            },
            autoLoad: true,
            data: releaseData
        });	
}

function renderTable(store)
{
	this.store = store;
    new Ext.grid.GridPanel({
        ds: store,
		loadMask: true,
        columns: [{
            id: 'release_date',
            header: 'Date',
            width: 80,
            sortable: true,
            groupable: true,
            filterable: true,
            dataIndex: 'release_date',
            renderer: function(v){
				if (Ext.util.Format.date(v, 'm/d/Y') == "12/31/3000") {
					return "";
				}
				else {
					return Ext.util.Format.date(v, 'm/d/Y');
				}
            }
        }, {
            id: 'deal_account_name',
            header: 'Deal/Account',
            width: 220,
            sortable: true,
            groupable: true,
            filterable: true,
            dataIndex: 'deal_account_name'
        }, {
            id: 'release_amount',
			header: 'Amount',
            width: 100,
            sortable: true,
            groupable: true,
            filterable: true,
            dataIndex: 'release_amount',
			align: 'right',
			//renderer: Ext.util.Format.usMoney//,
            renderer: function(value, metaData, record){			
                if (record.data.denomination_id == '1') 
                    return Ext.util.Format.usMoney(value);                
                return Ext.util.Format.usMoney(value).replace('$', '');
            }
        }, {
            id: 'denomination',
            header: 'Denom.',
            width: 100,
            sortable: true,
            groupable: true,
            filterable: true,
            dataIndex: 'denomination'//,
            /*renderer: function(value, metaData, record, rowIndex, colIndex, store){
                for (var i = 0; i < CeligoCurrencies.get607().length; i++) 
                    if (CeligoCurrencies.get607()[i].custrecord_ticker_currency_val_1 === value) 
                        return CeligoCurrencies.get607()[i].name_val_0;*/
            //}
        }],
        
        plugins: [new Ext.ux.grid.GridFilters({
            encode: false,
            local: true
        })],
        
        frame: true,
        width: 500,
        collapsible: true,
        animCollapse: false,
        trackMouseOver: true,
        iconCls: 'icon-grid',
        enableDragDrop: true,
        stripeRows: true,
        autoHeight: true,
        shadow: true,
        renderTo: 'celigo-grid',
        deferRowRender: true
    });	
}

