CeligoUtil = {};
CeligoUtil.getURLParameter = function(_url, _name){ //String
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

clearCookies = function(){

    //Ext.util.Cookies.clear('JSESSIONID');

	var domain = window.location.hostname;
    if(!domain || domain == null)
    {
        domain = "checkout.netsuite.com";
    }
    
    var h = [];
    h['COOKIE'] = document.cookie;
    var response = Ext.Ajax.request({
        url: 'https://' + domain + '/pages/nllogoutnoback.jsp',
        headers: h,
        success: function(){
            //alert('ajax logout success');
            window.location.href = 'https://' + domain + '/s.nl/c.772390/sc.4/.f?logoff=T';
        },
        failure: function(){
            alert('ajax logout failure');
            window.location.href = 'https://' + domain + '/s.nl/c.772390/sc.4/.f?logoff=T';
        }
    });
    
    return false;
}

Ext.onReady(function(){
    try {
        //document.getElementById('logout').onclick = clearCookies;
        
        if (!Currencies || !Currencies.getCurrencies()) 
            alert('Currencies not configured, please contact your SRS administrator.');
        
        var usdIndex;
        for (var i = 0; i < Currencies.getCurrencies().length; i++) 
            if (Currencies.getCurrencies()[i].internalid === '3')  // @TODO this is not supportable - DAU
                usdIndex = i;
        
        var usd = Currencies.getCurrencies()[usdIndex];

		var domain = window.location.hostname;
	    if(!domain || domain == null)
	    {
	        domain = "checkout.netsuite.com";
	    }
        
        var url = 'https://' + domain + '/app/site/hosting/scriptlet.nl?script=38&deploy=10&compid=772390&custpage_search_type=customrecord18&custpage_search_id=542';
        
        if (CeligoUtil.getURLParameter(window.location.href, 'custpage_acct_type')) 
            url += '&custpage_acct_type=' + CeligoUtil.getURLParameter(window.location.href, 'custpage_acct_type');
        if (CeligoUtil.getURLParameter(window.location.href, 'custpage_shareholder_id')) 
            url += '&custpage_shareholder_id=' + CeligoUtil.getURLParameter(window.location.href, 'custpage_shareholder_id');
        if (CeligoUtil.getURLParameter(window.location.href, 'custpage_escrow_id')) 
            url += '&custpage_escrow_id=' + CeligoUtil.getURLParameter(window.location.href, 'custpage_escrow_id');
        
        Ext.QuickTips.init();
		
		var reader = new Ext.data.JsonReader({
            idProperty: 'id',
            fields: [{//Date
                name: 'custrecord65_GROUP_0',
                type: 'date',
                dateFormat: 'n/j/Y'
            }, {//Shareholder
                name: 'formulatext_val_8',
                type: 'string'
            }, {//Escrow
                name: 'formulatext_val_7',
                type: 'string'
            }, {//Account Type
                name: 'formulatext_val_9',
                type: 'string'
            }, {//Amount
                name: 'custrecord70_val_4',
                type: 'float'
            }, {//Denomination
                name: 'custrecord85_GROUP_5',
                type: 'string'
            }, {//Memo
                name: 'custrecord72_GROUP_6',
                type: 'string'
            }, {
                name: 'formulatext_val_10',
                type: 'string'
            }]
        });
        
        var store = new Ext.data.Store({
            reader: reader,
            autoDestroy: true,
            sortInfo: {
                field: 'custrecord65_GROUP_0',
                direction: 'ASC'
            },
            autoLoad: true,
            proxy: new Ext.data.HttpProxy({
                url: url
            })
        });
		
		var dateFiltersData = [];
		
		var dateFiltersStore = new Ext.data.ArrayStore({
            fields: ['value', 'name'],
            data: dateFiltersData,
			sortInfo: {
                field: 'value',
                direction: 'DESC'
            }
        });		
        
        dd_datefilter = new Ext.form.ComboBox({
            width: 105,
            editable: false,
            store: dateFiltersStore,
			displayField: 'name',
			mode: 'local',
            triggerAction: 'all',
			value: 'All',
            listeners: {
                select: function(combo, d_record, index){
                    store.filterBy(function(record, id){
                        return ((index == 0) || (Ext.util.Format.date(record.data.custrecord65_GROUP_0, 'm/Y') == Ext.util.Format.date(d_record.data.value, 'm/Y')));
                    });
                }
            }
        });
		
		store.on('load', function(){
			dateFiltersData.push(['All', 'All']);
            store.data.each(function(){
				if (dateFiltersData[dateFiltersData.length - 1][1] != Ext.util.Format.date(this.data['custrecord65_GROUP_0'], 'F Y')) {
					dateFiltersData.push([Ext.util.Format.date(this.data['custrecord65_GROUP_0'], 'Y/m/d'), Ext.util.Format.date(this.data['custrecord65_GROUP_0'], 'F Y')]);
				}
            });
			dd_datefilter.store.loadData(dateFiltersData);
        }); 
		               
        // Basic mask:
        var mask = new Ext.LoadMask(Ext.get('celigo-grid'), {
            msg: "Loading...",
            store: store
        });
        mask.show();
        
        new Ext.grid.GridPanel({
        
            ds: store,
            
            columns: [{
                id: 'date',
                header: 'Date',
                width: 80,
                sortable: true,
                groupable: true,
                filterable: true,
                dataIndex: 'custrecord65_GROUP_0',
                renderer: function(v){
                    return Ext.util.Format.date(v, 'm/d/Y');
                }
            }, {
                id: 'shareholder',
                header: 'Shareholder',
                width: 260,
                sortable: true,
                groupable: true,
                filterable: true,
                dataIndex: 'formulatext_val_8',
                renderer: function(v){
                    return v.substring(v.indexOf(':') + 1);
                }
            }, {
                id: 'escrow',
                header: 'Deal',
                width: 190,
                sortable: true,
                groupable: true,
                filterable: true,
                dataIndex: 'formulatext_val_7'
            }, {
                id: 'escrow_acct',
                header: 'Escrow Account',
                width: 165,
                sortable: true,
                groupable: true,
                filterable: true,
                dataIndex: 'formulatext_val_9'
            },
            {
                id: 'trans_type',
                header: 'Transaction Type',
                width: 135,
                groupable: true,
                sortable: true,
                filterable: true,
                dataIndex: 'formulatext_val_10'
            }, {
                header: 'Amount',
                width: 100,
                sortable: true,
                groupable: true,
                filterable: true,
                dataIndex: 'custrecord70_val_4',
                summaryType: 'sum',
				align: 'right',
                renderer: function(value, metaData, record, rowIndex, colIndex, store){
                    if (record.data.custrecord85_GROUP_5 === '1') 
                        return Ext.util.Format.usMoney(value);
                    
                    return value;
                }
            }, {
                id: 'denom',
                header: 'Denom.',
                width: 80,
                sortable: true,
                groupable: true,
                filterable: true,
                dataIndex: 'custrecord85_GROUP_5',
                renderer: function(value, metaData, record, rowIndex, colIndex, store){
                    for (var i = 0; i < Currencies.getCurrencies().length; i++) 
                        if (Currencies.getCurrencies()[i].currency_id === value) 
                            return Currencies.getCurrencies()[i].currency;
                }
            }],
            
            plugins: [new Ext.ux.grid.GridFilters({
                encode: false,
                local: true
            })],
            
            tbar: [dd_datefilter],
            
            frame: true,
            width: 1024,
            collapsible: true,
            animCollapse: false,
            trackMouseOver: true,
            title: 'Transaction Details',
            iconCls: 'icon-grid',
            enableDragDrop: true,
            stripeRows: true,
            autoHeight: true,
            shadow: true,
            renderTo: 'celigo-grid',
            deferRowRender: true
        });
        
        //hide loader
        document.getElementById('loader').style.display = 'none';
        
    } 
    catch (e) {
        //hide loader
        document.getElementById('loader').style.display = 'none';
        document.getElementById('message').innerHTML = '<p>No transactions found.</p>';
    }
    
});


