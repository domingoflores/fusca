Ext.onReady(function(){
    try {
    
        //debugger;
        Ext.QuickTips.init();
        
        if (!Array.indexOf) {
            Array.prototype.indexOf = function(obj){
                for (var i = 0; i < this.length; i++) {
                    if (this[i] == obj) {
                        return i;
                    }
                }
                return -1;
            }
        }
        
        var getDaysInMonth = function(month, year){
            var daysInMonth = [31, ((year % 400 == 0 || (year % 4 == 0 && year % 100 != 0)) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            return daysInMonth[month - 1];
        };
        
        var xg = Ext.grid;
        
        var reader = new Ext.data.JsonReader({
            idProperty: 'id',
            fields: [{//Escrow Company
                name: 'companyname_val_0',
                type: 'string'
            }, {//Escrow Account
                name: 'custrecord68_GROUP_txt',
                type: 'string'
            }, {//Shareholder
                name: 'companyname_val_2',
                type: 'string'
            }, {//Denomination
                name: 'custrecord85_val_3',
                type: 'int'
            }, {//Deposits/Holdbacks
                name: 'custrecord74_val_4',
                type: 'float'
            }, {//Investment Earnings
                name: 'custrecord76_val_5',
                type: 'float'
            }, {//Claims Paid
                name: 'custrecord77_val_6',
                type: 'float'
            }, {//Expenses
                name: 'custrecord78_val_7',
                type: 'float'
            }, {//Disbursements
                name: 'custrecord103_val_8',
                type: 'float'
            }, {//Balance
                name: 'custrecord70_val_9',
                type: 'float'
            }, {//Balance SUM
                name: 'custrecord70_SUM_9',
                type: 'float'
            }, {//Account Type Id
                name: 'custrecord68_val_1',
                type: 'string'
            }, {//Escrow Id
                name: 'internalid_val_10',
                type: 'int'
            }, {//Shareholder Id
                name: 'internalid_val_11',
                type: 'int'
            }, {//Escrow Date
                name: 'custrecord65_val_12',
                type: 'date'
            }]
        });
        
        /* Column Models */
        var colModelSummaryUSD = new Ext.grid.ColumnModel([{
            header: 'Deal',
            width: 175,
            sortable: true,
            groupable: true,
            filterable: true,
            dataIndex: 'companyname_val_0'
        }, {
            header: 'Shareholder',
            width: 175,
            sortable: true,
            groupable: true,
            filterable: true,
            dataIndex: 'companyname_val_2',
            renderer: function(value, metaData, record, rowIndex, colIndex, store){
                //debugger;
				var domain = window.location.hostname;
			    if(!domain || domain == null)
			    {
			        domain = "checkout.netsuite.com";
			    }

                if (record.data.custrecord68_val_1 && record.data.internalid_val_10 && record.data.internalid_val_11) 
                    return '<a href="https://'+domain+'/app/site/hosting/scriptlet.nl?script=42&deploy=1&custpage_acct_type=' + record.data.custrecord68_val_1 + '&custpage_escrow_id=' + record.data.internalid_val_10 + '&custpage_shareholder_id=' + record.data.internalid_val_11 + '" ><u>' + value + '</u></a>';
                else 
                    return '<a href="https://'+domain+'/app/site/hosting/scriptlet.nl?script=42&deploy=1"><u>' + value + '</u></a>';
            }
        }, {
            header: 'Escrow Account',
            width: 175,
            sortable: true,
            groupable: true,
            filterable: true,
            dataIndex: 'custrecord68_GROUP_txt'
        }, {
            header: 'Balance',
            width: 110,
            sortable: true,
            groupable: true,
            filterable: true,
            renderer: Ext.util.Format.usMoney,
            summaryType: 'sum',
            summaryRenderer: Ext.util.Format.usMoney,
            dataIndex: 'custrecord70_val_9',
			align: 'right'
        }]);
        
        var colModelDetailUSD = new Ext.grid.ColumnModel([{
            header: 'Deal',
            width: 175,
            sortable: true,
            groupable: true,
            filterable: true,
            dataIndex: 'companyname_val_0'
        }, {
            header: 'Shareholder',
            width: 175,
            sortable: true,
            groupable: true,
            filterable: true,
            dataIndex: 'companyname_val_2',
            renderer: function(value, metaData, record, rowIndex, colIndex, store){
				var domain = window.location.hostname;
			    if(!domain || domain == null)
			    {
			        domain = "checkout.netsuite.com";
			    }

                //debugger;
                if (record.data.custrecord68_val_1 && record.data.internalid_val_10 && record.data.internalid_val_11) 
                    return '<a href="https://'+domain+'/app/site/hosting/scriptlet.nl?script=42&deploy=1&custpage_acct_type=' + record.data.custrecord68_val_1 + '&custpage_escrow_id=' + record.data.internalid_val_10 + '&custpage_shareholder_id=' + record.data.internalid_val_11 + '" ><u>' + value + '</u></a>';
                else 
                    return '<a href="https://'+domain+'/app/site/hosting/scriptlet.nl?script=42&deploy=1"><u>' + value + '</u></a>';
            }
        }, {
            header: 'Escrow Account',
            width: 175,
            sortable: true,
            groupable: true,
            filterable: true,
            dataIndex: 'custrecord68_GROUP_txt'
        }, {
            header: 'Deposits / Holdbacks',
            width: 110,
            sortable: true,
            filterable: true,
            dataIndex: 'custrecord74_val_4',
            renderer: Ext.util.Format.usMoney,
            summaryType: 'sum',
            summaryRenderer: Ext.util.Format.usMoney,
			align: 'right'
        }, {
            header: 'Invst Earnings',
            width: 110,
            sortable: true,
            filterable: true,
            dataIndex: 'custrecord76_val_5',
            renderer: Ext.util.Format.usMoney,
            summaryType: 'sum',
            summaryRenderer: Ext.util.Format.usMoney,
			align: 'right'
        }, {
            header: 'Claims Paid',
            width: 110,
            sortable: true,
            filterable: true,
            dataIndex: 'custrecord77_val_6',
            renderer: Ext.util.Format.usMoney,
            summaryType: 'sum',
            summaryRenderer: Ext.util.Format.usMoney,
			align: 'right'
        }, {
            header: 'Expenses',
            width: 100,
            sortable: true,
            filterable: true,
            renderer: Ext.util.Format.usMoney,
            dataIndex: 'custrecord78_val_7',
            summaryType: 'sum',
            summaryRenderer: Ext.util.Format.usMoney,
			align: 'right'
        }, {
            header: 'Disbursements',
            width: 110,
            sortable: true,
            filterable: true,
            dataIndex: 'custrecord103_val_8',
            renderer: Ext.util.Format.usMoney,
            summaryType: 'sum',
            summaryRenderer: Ext.util.Format.usMoney,
			align: 'right'
        }, {
            header: 'Balance',
            width: 110,
            sortable: true,
            groupable: true,
            filterable: true,
            renderer: Ext.util.Format.usMoney,
            summaryType: 'sum',
            summaryRenderer: Ext.util.Format.usMoney,
            dataIndex: 'custrecord70_val_9',
			align: 'right'
        }]);
        
        var colModelSummary = new Ext.grid.ColumnModel([{
            header: 'Deal',
            width: 175,
            sortable: true,
            groupable: true,
            filterable: true,
            dataIndex: 'companyname_val_0'
        }, {
            header: 'Shareholder',
            width: 175,
            sortable: true,
            groupable: true,
            filterable: true,
            dataIndex: 'companyname_val_2',
            renderer: function(value, metaData, record, rowIndex, colIndex, store){
				var domain = window.location.hostname;
			    if(!domain || domain == null)
			    {
			        domain = "checkout.netsuite.com";
			    }
                //debugger;
                if (record.data.custrecord68_val_1 && record.data.internalid_val_10 && record.data.internalid_val_11) 
                    return '<a href="https://'+domain+'/app/site/hosting/scriptlet.nl?script=42&deploy=1&custpage_acct_type=' + record.data.custrecord68_val_1 + '&custpage_escrow_id=' + record.data.internalid_val_10 + '&custpage_shareholder_id=' + record.data.internalid_val_11 + '" ><u>' + value + '</u></a>';
                else 
                    return '<a href="https://'+domain+'/app/site/hosting/scriptlet.nl?script=42&deploy=1"><u>' + value + '</u></a>';
            }
        }, {
            header: 'Escrow Account',
            width: 175,
            sortable: true,
            groupable: true,
            filterable: true,
            dataIndex: 'custrecord68_GROUP_txt'
        }, {
            header: 'Balance',
            width: 110,
            sortable: true,
            groupable: true,
            filterable: true,
            renderer: Ext.util.Format.numberRenderer('123,456'),
            summaryType: 'sum',
            summaryRenderer: Ext.util.Format.numberRenderer('123,456 shs'),
            dataIndex: 'custrecord70_val_9',
			align: 'right'
        }, {
            header: 'USD Balance',
            width: 100,
            sortable: true,
            groupable: true,
            filterable: true,
            renderer: Ext.util.Format.usMoney,
            summaryType: 'sum',
            summaryRenderer: Ext.util.Format.usMoney,
            dataIndex: 'custrecord70_SUM_9',
			align: 'right'
        }]);
        
        var colModelDetail = new Ext.grid.ColumnModel([{
            header: 'Deal',
            width: 175,
            sortable: true,
            groupable: true,
            filterable: true,
            dataIndex: 'companyname_val_0'
        }, {
            header: 'Shareholder',
            width: 175,
            sortable: true,
            groupable: true,
            filterable: true,
            dataIndex: 'companyname_val_2',
            renderer: function(value, metaData, record, rowIndex, colIndex, store){
				var domain = window.location.hostname;
			    if(!domain || domain == null)
			    {
			        domain = "checkout.netsuite.com";
			    }

                //debugger;
                if (record.data.custrecord68_val_1 && record.data.internalid_val_10 && record.data.internalid_val_11) 
                    return '<a href="https://'+domain+'/app/site/hosting/scriptlet.nl?script=42&deploy=1&custpage_acct_type=' + record.data.custrecord68_val_1 + '&custpage_escrow_id=' + record.data.internalid_val_10 + '&custpage_shareholder_id=' + record.data.internalid_val_11 + '" ><u>' + value + '</u></a>';
                else 
                    return '<a href="https://'+domain+'/app/site/hosting/scriptlet.nl?script=42&deploy=1"><u>' + value + '</u></a>';
            }
        }, {
            header: 'Escrow Account',
            width: 175,
            sortable: true,
            groupable: true,
            filterable: true,
            dataIndex: 'custrecord68_GROUP_txt'
        }, {
            header: 'Deposits / Holdbacks',
            width: 110,
            sortable: true,
            filterable: true,
            dataIndex: 'custrecord74_val_4',
            renderer: Ext.util.Format.numberRenderer('123,456'),
            summaryType: 'sum',
            summaryRenderer: Ext.util.Format.numberRenderer('123,456 shs'),
			align: 'right'
        }, {
            header: 'Invst Earnings',
            width: 110,
            sortable: true,
            filterable: true,
            dataIndex: 'custrecord76_val_5',
            renderer: Ext.util.Format.numberRenderer('123,456'),
            summaryType: 'sum',
            summaryRenderer: Ext.util.Format.numberRenderer('123,456 shs'),
			align: 'right'
        }, {
            header: 'Claims Paid',
            width: 110,
            sortable: true,
            filterable: true,
            dataIndex: 'custrecord77_val_6',
            renderer: Ext.util.Format.numberRenderer('123,456'),
            summaryType: 'sum',
            summaryRenderer: Ext.util.Format.numberRenderer('123,456 shs'),
			align: 'right'
        }, {
            header: 'Expenses',
            width: 100,
            sortable: true,
            filterable: true,
            renderer: Ext.util.Format.numberRenderer('123,456'),
            dataIndex: 'custrecord78_val_7',
            summaryType: 'sum',
            summaryRenderer: Ext.util.Format.numberRenderer('123,456 shs'),
			align: 'right'
        }, {
            header: 'Disbursements',
            width: 110,
            sortable: true,
            filterable: true,
            dataIndex: 'custrecord103_val_8',
            renderer: Ext.util.Format.numberRenderer('123,456'),
            summaryType: 'sum',
            summaryRenderer: Ext.util.Format.numberRenderer('123,456 shs'),
			align: 'right'
        }, {
            header: 'Balance',
            width: 110,
            sortable: true,
            groupable: true,
            filterable: true,
            renderer: Ext.util.Format.numberRenderer('123,456'),
            summaryType: 'sum',
            summaryRenderer: Ext.util.Format.numberRenderer('123,456 shs'),
            dataIndex: 'custrecord70_val_9',
			align: 'right'
        }, {
            header: 'USD Balance',
            width: 100,
            sortable: true,
            groupable: true,
            filterable: true,
            renderer: Ext.util.Format.usMoney,
            summaryType: 'sum',
            summaryRenderer: Ext.util.Format.usMoney,
            dataIndex: 'custrecord70_SUM_9',
			align: 'right'
        }]);
        
        /* /Column Models */
        
        // conversion factor -- [check for the latest quote that is on or before the tranDate]			
		var getConversionFactor = function(currencyId, tranDate){
                var cf = 1;
                var prev_diff = 0;
                var diff = 0;
                var dateMatchFound = false;
				
				for (var i = 0; i < Currencies.getCurrencies().length; i++)
				{
                    if (Currencies.getCurrencies()[i].currency_id == currencyId)
					{
						var quotes = Currencies.getCurrencies()[i].values;
						for(var j = 0; j < quotes.length; j++)
						{
	                        diff = new Date(tranDate) - new Date(quotes[j].quote_date);
	                        if (diff >= 0 && (prev_diff == 0 || (diff <= prev_diff))) {
	                            dateMatchFound = true;
	                            cf = quotes[j].usd_quote_value;
	                            prev_diff = diff;
	                        }
						}
                    }
                }
                if (dateMatchFound) {
                    return cf;
                }
                else {
                    return 1;
                }
            };
                
        if (!Currencies || !Currencies.getCurrencies()) 
            alert('Currencies not configured, please contact your SRS administrator.');
        
        var shareSummaries = [];
        var shareGrids = [];
        var conversionFactor;
        var emptyDataSets = 0;
        var currencyIds = [];
        
        for (var i = 0; Currencies.getCurrencies && i < Currencies.getCurrencies().length; i++) {
        	if(Currencies.getCurrencies()[i].currency_id == null) continue;
            if (currencyIds.indexOf(Currencies.getCurrencies()[i].currency_id) > -1) {
                continue;
            }
            currencyIds.push(Currencies.getCurrencies()[i].currency_id);
                        
            var data_first_last_dates = eval('CeligoDataCurr_FirstLast_Date' + Currencies.getCurrencies()[i].currency_id).get752();
            
            if (!data_first_last_dates || data_first_last_dates.length < 1 || (!data_first_last_dates[0].custrecord65_val_0)) {
                emptyDataSets++;
                continue;
            }

            var first_date_year = data_first_last_dates[0].custrecord65_val_0.split("/")[2];
            var first_date_month = data_first_last_dates[0].custrecord65_val_0.split("/")[0];
            
            var last_date_year = data_first_last_dates[0].custrecord65_val_1.split("/")[2];
            var last_date_month = data_first_last_dates[0].custrecord65_val_1.split("/")[0];
            
            var dateFiltersData = [];
            
            /*var lastDate = new Date();
            lastDate.setDate(getDaysInMonth(last_date_month, last_date_year));
            lastDate.setMonth(last_date_month - 1);
            lastDate.setYear(last_date_year);
			dateFiltersData.push([Ext.util.Format.date(lastDate, 'm/d/Y'), 'Most Current']);*/
			
            for (var year = last_date_year; year >= first_date_year; year--) {
                for (var month = 12; month >= 1; month--) {
                    if (year == last_date_year) {
                        if (month > last_date_month) 
                            continue;
                    }                    
                    if (year == first_date_year) {
                        if (month < first_date_month) 
                            continue;
                    }
					      
                    var cDate = new Date();
					cDate.setDate(1);				// set it to the first day of the month
					cDate.setYear(year);
					cDate.setMonth(month - 1);
					cDate.setDate(getDaysInMonth(month, year));	// now set it to the last day of the month
					
                    dateFiltersData.push([Ext.util.Format.date(cDate, 'm/d/Y'), Ext.util.Format.date(cDate, 'F Y')]);                    
                }
            }
            
            var dateFiltersStore = new Ext.data.ArrayStore({
                fields: ['value', 'name'],
                data: dateFiltersData
            });
            
            var dd_datefilter = new Ext.form.ComboBox({
                id: 'dd_datefilter' + i,
                width: 105,
                editable: false,
                store: dateFiltersStore,
                displayField: 'name',
                valueField: 'value',
                typeAhead: true,
                mode: 'local',
                forceSelection: true,
                loadingText: 'Loading...',
                triggerAction: 'all',
                selectOnFocus: true,
                allowBlank: false,
                value: dateFiltersData[0][0],
                listeners: {
                    select: function(combo, d_record, index){
                        var thisCurrencyIndex = this.id.replace("dd_datefilter", "");
                        var thisGrid = Ext.getCmp(this.id.replace("dd_datefilter", "tsGrid"));
                        thisGrid.store.proxy.api.read.url = "/app/site/hosting/scriptlet.nl?script=38&deploy=10&compid=772390&custpage_search_type=customrecord18&custpage_search_id=290&custpage_currencies=" + Currencies.getCurrencies()[thisCurrencyIndex].currency_id + "&custpage_date=" + this.value;
                        thisGrid.store.load();
                        Ext.getCmp(this.id.replace("dd_datefilter", "dd_datefilter_detail")).setValue(this.value);
                    }
                }
            });
            
            var dd_datefilter_detail = new Ext.form.ComboBox({
                id: 'dd_datefilter_detail' + i,
                width: 105,
                editable: false,
                store: dateFiltersStore,
                displayField: 'name',
                valueField: 'value',
                typeAhead: true,
                mode: 'local',
                forceSelection: true,
                loadingText: 'Loading...',
                triggerAction: 'all',
                selectOnFocus: true,
                allowBlank: false,
                value: dateFiltersData[0][0],
                listeners: {
                    select: function(combo, d_record, index){
                        var thisCurrencyIndex = this.id.replace("dd_datefilter_detail", "");
                        var thisGrid = Ext.getCmp(this.id.replace("dd_datefilter", "tsGrid"));
                        thisGrid.store.proxy.api.read.url = "/app/site/hosting/scriptlet.nl?script=38&deploy=10&compid=772390&custpage_search_type=customrecord18&custpage_search_id=290&custpage_currencies=" + Currencies.getCurrencies()[thisCurrencyIndex].currency_id + "&custpage_date=" + this.value;
                        thisGrid.store.load();
                        Ext.getCmp(this.id.replace("dd_datefilter_detail", "dd_datefilter")).setValue(this.value);
                    }
                }
            });
            
            var transactionData = new Ext.data.GroupingStore({
                id: 'transactionDataStore' + i,
                reader: reader,
                //autoDestroy: true,
                sortInfo: {
                    field: 'companyname_val_0',
                    direction: 'ASC'
                },
                autoLoad: true,
                proxy: new Ext.data.HttpProxy({
                    url: '/app/site/hosting/scriptlet.nl?script=38&deploy=10&compid=772390&custpage_search_type=customrecord18&custpage_search_id=290&custpage_currencies=' + Currencies.getCurrencies()[i].currency_id + '&custpage_date=' + (this.value == null ? dateFiltersData[0][0] : this.value)
                }),
                groupField: 'companyname_val_0',
				listeners:{
					load: function(store, records, options){
												
						store.filterBy(function(record, id){
                            return parseFloat(record.data.custrecord70_val_9) != 0;
                        });
						                        												
						store.data.each(function(){
                            if (this.data['custrecord85_val_3'] != "1") {
                                this.data['custrecord70_SUM_9'] = parseFloat(this.data['custrecord70_SUM_9']) * getConversionFactor(this.data['custrecord85_val_3'], this.data['custrecord65_val_12']); //custrecord65_val_13
                            }
                        });						                        
					}
				}
            });            
            
            if (Currencies.getCurrencies()[i].currency_id === '1') {
                // utilize custom extension for Group Summary
                var usdSummary = new Ext.ux.grid.GroupSummary();
                var usdDetailSummary = new Ext.ux.grid.GroupSummary();
                new xg.GridPanel({
                    id: 'tsGrid' + i,
                    loadMask: true,
                    ds: transactionData,
                    cm: colModelSummaryUSD,
                    view: new Ext.grid.GroupingView({
                        forceFit: true,
                        showGroupName: true,
                        hideGroupedColumn: true,
                        autoFill: true
                    }),
                    sm: new Ext.grid.RowSelectionModel({
                        singleSelect: true
                    }),
                    plugins: [usdSummary, new Ext.ux.grid.GridFilters({
                        encode: false,
                        local: true
                    })],
                    tbar: [{
                        text: 'Show Details',
						tooltip: 'Display the columns Deposits/Holdbacks, Investment Earnings, Claims Paid, Expenses and Disbursements',
                        id: 'tglShowDetails' + i,
                        enableToggle: true,
                        pressed: true,
                        width: 80,
                        toggleHandler: function(){
                            var thisGrid = Ext.getCmp(this.id.replace("tglShowDetails", "tsGrid"));
                            var thisGrid_detail = Ext.getCmp(this.id.replace("tglShowDetails", "tsGrid_detail"));
                            thisGrid_detail.show();
                            thisGrid.hide();
                            this.toggle(true);
                        }
                    }, {
                        xtype: 'tbseparator',
                        width: 12
                    }, dd_datefilter],
                    frame: true,
                    width: 1024,
                    collapsible: true,
                    animCollapse: true,
                    trackMouseOver: true,
                    title: Currencies.getCurrencies()[i].currency + ' Denominated',
                    iconCls: 'icon-grid',
                    enableDragDrop: true,
                    stripeRows: true,
                    autoHeight: true,
                    shadow: true,
                    renderTo: 'celigo-grid',
                    deferRowRender: false
                });
                
                new xg.GridPanel({
                    id: 'tsGrid_detail' + i,
                    hidden: true,
                    ds: transactionData,
                    loadMask: true,
                    cm: colModelDetailUSD,
                    view: new Ext.grid.GroupingView({
                        forceFit: true,
                        showGroupName: true,
                        hideGroupedColumn: true,
                        autoFill: true
                    }),
                    sm: new Ext.grid.RowSelectionModel({
                        singleSelect: true
                    }),
                    plugins: [usdDetailSummary, new Ext.ux.grid.GridFilters({
                        encode: false,
                        local: true
                    })],
                    tbar: [{
                        text: 'Hide Details',
						tooltip: 'Hide the columns Deposits/Holdbacks, Investment Earnings, Claims Paid, Expenses and Disbursements',
                        id: 'tglShowDetails_detail' + i,
                        enableToggle: true,
                        pressed: false,
                        width: 80,
                        toggleHandler: function(){
                            var thisGrid = Ext.getCmp(this.id.replace("tglShowDetails", "tsGrid"));
                            var thisGrid_summary = Ext.getCmp(this.id.replace("tglShowDetails_detail", "tsGrid"));
                            thisGrid_summary.show();
                            thisGrid.hide();
                            this.toggle(false);
                        }
                    }, {
                        xtype: 'tbseparator',
                        width: 10
                    }, dd_datefilter_detail],
                    frame: true,
                    width: 1024,
                    collapsible: true,
                    animCollapse: true,
                    trackMouseOver: true,
                    title: Currencies.getCurrencies()[i].currency + ' Denominated',
                    iconCls: 'icon-grid',
                    enableDragDrop: true,
                    stripeRows: true,
                    autoHeight: true,
                    shadow: true,
                    renderTo: 'celigo-grid',
                    deferRowRender: false
                });
            }
            else {
                var usdSummary = new Ext.ux.grid.GroupSummary();
                var usdDetailSummary = new Ext.ux.grid.GroupSummary();
                
                new xg.GridPanel({
                    id: 'tsGrid' + i,
                    
                    ds: transactionData,
                    loadMask: true,
                    cm: colModelSummary,
                    
                    view: new Ext.grid.GroupingView({
                        forceFit: true,
                        showGroupName: true,
                        hideGroupedColumn: true,
                        autoFill: true
                    }),
                    
                    sm: new Ext.grid.RowSelectionModel({
                        singleSelect: true
                    }),
                    
                    plugins: [usdSummary, new Ext.ux.grid.GridFilters({
                        encode: false,
                        local: true
                    })],
                    
                    tbar: [{
                        text: 'Show Details',
						tooltip: 'Display the columns Deposits/Holdbacks, Investment Earnings, Claims Paid, Expenses and Disbursements',
                        id: 'tglShowDetails' + i,
                        enableToggle: true,
                        pressed: true,
                        width: 80,
                        toggleHandler: function(){
                            var thisGrid = Ext.getCmp(this.id.replace("tglShowDetails", "tsGrid"));
                            var thisGrid_detail = Ext.getCmp(this.id.replace("tglShowDetails", "tsGrid_detail"));
                            thisGrid_detail.show();
                            thisGrid.hide();
                            this.toggle(true);
                        }
                    }, {
                        xtype: 'tbseparator',
                        width: 12
                    }, dd_datefilter],
                    frame: true,
                    width: 1024,
                    collapsible: true,
                    animCollapse: true,
                    trackMouseOver: true,
                    title: Currencies.getCurrencies()[i].currency + ' Denominated',
                    iconCls: 'icon-grid',
                    enableDragDrop: true,
                    stripeRows: true,
                    autoHeight: true,
                    shadow: true,
                    renderTo: 'celigo-grid',
                    deferRowRender: false
                });
                
                new xg.GridPanel({
                    id: 'tsGrid_detail' + i,
                    hidden: true,
                    ds: transactionData,
                    loadMask: true,
                    cm: colModelDetail,
                    
                    view: new Ext.grid.GroupingView({
                        forceFit: true,
                        showGroupName: true,
                        hideGroupedColumn: true,
                        autoFill: true
                    }),
                    
                    sm: new Ext.grid.RowSelectionModel({
                        singleSelect: true
                    }),
                    
                    plugins: [usdDetailSummary, new Ext.ux.grid.GridFilters({
                        encode: false,
                        local: true
                    })],
                    
                    tbar: [{
                        text: 'Hide Details',
						tooltip: 'Hide the columns Deposits/Holdbacks, Investment Earnings, Claims Paid, Expenses and Disbursements',
                        id: 'tglShowDetails_detail' + i,
                        enableToggle: true,
                        pressed: false,
                        width: 80,
                        toggleHandler: function(){
                            var thisGrid = Ext.getCmp(this.id.replace("tglShowDetails", "tsGrid"));
                            var thisGrid_summary = Ext.getCmp(this.id.replace("tglShowDetails_detail", "tsGrid"));
                            thisGrid_summary.show();
                            thisGrid.hide();
                            this.toggle(false);
                        }
                    }, {
                        xtype: 'tbseparator',
                        width: 12
                    }, dd_datefilter_detail],
                    frame: true,
                    width: 1024,
                    collapsible: true,
                    animCollapse: true,
                    trackMouseOver: true,
                    title: Currencies.getCurrencies()[i].currency + ' Denominated',
                    iconCls: 'icon-grid',
                    enableDragDrop: true,
                    stripeRows: true,
                    autoHeight: true,
                    shadow: true,
                    renderTo: 'celigo-grid',
                    deferRowRender: false
                });
            }
        }
        
        //hide loader
        document.getElementById('loader').style.display = 'none';
        
        if (emptyDataSets == currencyIds.length)
		{
            document.getElementById('message').innerHTML = '<p>No transactions found.</p>';
        }
    } 
    catch (e) {        
        //hide loader
        document.getElementById('loader').style.display = 'none';
        document.getElementById('message').innerHTML = '<p>No transactions found.</p>' + e;
    }
});
