Ext.onReady(function(){
    try {
    
        //debugger;
        Ext.QuickTips.init();

		var domain = window.location.hostname;
	    if(!domain || domain == null)
	    {
	        domain = "checkout.netsuite.com";
	    }
        
        var url = 'https://'+domain+'/app/site/hosting/scriptlet.nl?script=38&deploy=10&compid=772390&custpage_search_type=customrecord28&custpage_search_id=707';
        
        var reader = new Ext.data.JsonReader({
            idProperty: 'id',
            fields: [{//EscrowID
                name: 'custrecord88_val_1',
                type: 'string'
            }, {//Escrow
                name: 'custrecord88_txt_1',
                type: 'string'
            }, {//Major Shareholder News
                name: 'custrecord90_val_2',
                type: 'string'
            }, {//Common Shareholder News
                name: 'custrecordcom_sh_news_val_3',
                type: 'string'
            }, {//News Date
                name: 'custrecord89_val_0',
                type: 'date'
            }, {// Alternative for Common Shareholder News
				name: 'formulatext_val_4',
				type: 'string'
			}]
        });
        
        var store = new Ext.data.Store({
            reader: reader,
            autoDestroy: true,
            sortInfo: {
                field: 'custrecord89_val_0',
                direction: 'DESC'
            },
            autoLoad: true,
            proxy: new Ext.data.HttpProxy({
                url: url
            })
        });
        
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
        
        var dealIds = [];
        var deals = [];
        
        var IsMajorShareHolder = function(escrowid){
            for (var i = 0; CeligoMajorShareHolders.get751() && i < CeligoMajorShareHolders.get751().length; i++) {
                if (CeligoMajorShareHolders.get751()[i].custrecord15_val_0 == escrowid) {
                    return true;
                }
            }
            return false;
        };
        
        store.on('load', function(){
            store.data.each(function(){
                if (dealIds.indexOf(this.data['custrecord88_val_1']) == -1) {
                    //if (IsMajorShareHolder(this.data['custrecord88_val_1'])) {
                    dealIds.push(this.data['custrecord88_val_1']);
                    deals.push({
                        "id": this.data['custrecord88_val_1'],
                        "text": this.data['custrecord88_txt_1'],
                        "leaf": true,
                        "cls": "feed"
                    });
                    //}
                }
            });
            deals.sort(sortDeals);
            
            /*
             deals.splice(0, 0, {
             "id": -1,
             "text": "Escrow/Deal's news",
             "leaf": true,
             "cls": "feed"
             });
             */
            Ext.getCmp('tree_deals').root.reload();
            
            store.filterBy(function(record, id){
                if (IsMajorShareHolder(record.data.custrecord88_val_1)) {
                    return record.data.custrecord90_val_2 ? true : false;
                }
                else {
                    return record.data.custrecordcom_sh_news_val_3 ? true : false;
					//return record.data.formulatext_val_4 ? true : false;
                }
            });
        });
        
        var sortDeals = function(a, b){
            return (a.text.toLowerCase() < b.text.toLowerCase() ? -1 : (a.text.toLowerCase() > b.text.toLowerCase() ? 1 : 0));
        };
        
        // Basic mask:
        var mask = new Ext.LoadMask(Ext.get('celigo-grid'), {
            msg: "Loading...",
            store: store
        });
        mask.show();
        
        var tree1 = new Ext.tree.TreePanel({
            id: 'tree_deals',
            width: 200,
            minSize: 175,
            maxSize: 400,
            margins: '0 0 0 0',
            rootVisible: false,
            lines: false,
            autoScroll: true,
            root: new Ext.tree.AsyncTreeNode({
                text: 'Deals',
                children: deals,
                expanded: true
            }),
            listeners: {
                click: function(node, event){
                    var grid_news = Ext.getCmp("grid_news");
                    grid_news.store.filterBy(function(record, id){
                       // return (((node.id == -1) || (record.data.custrecord88_val_1 == node.id)) && (IsMajorShareHolder(record.data.custrecord88_val_1)));
                        if (((node.id == -1) || (record.data.custrecord88_val_1 == node.id))) {
                            if (IsMajorShareHolder(record.data.custrecord88_val_1)) {
                                return record.data.custrecord90_val_2 ? true : false;
                            }
                            else {
                                return record.data.custrecordcom_sh_news_val_3 ? true : false;
								//return record.data.formulatext_val_4 ? true : false;
                            }
                        }
                        return false;
                    });
                }
            }
        });
        
        var newsGrid = new Ext.grid.GridPanel({
            id: 'grid_news',
            ds: store,
            columns: [{
                id: 'date',
                header: 'Date',
                width: 80,
                sortable: true,
                dataIndex: 'custrecord89_val_0',
                renderer: function(v){
                    return Ext.util.Format.date(v, 'm/d/Y');
                }
            },
			{
				id: 'deal',
				header: 'Deal',
				width: 150,
				sortable: true,
				dataIndex: 'custrecord88_txt_1'
			},
			 {
                id: 'news',
                header: 'News',
                width: 550,
                sortable: true,
                dataIndex: 'custrecord90_val_2',
                renderer: function(value, metaData, record, rowIndex, colIndex, store){
                    metaData.css = 'multilineColumn';
                    if (IsMajorShareHolder(record.data.custrecord88_val_1)) {
                        return value;
                    }
					return record.data.custrecordcom_sh_news_val_3;
					//return record.data.formulatext_val_4;
                }
            }],
            frame: false,
            height: 400,
            trackMouseOver: true,
            title: '',
            stripeRows: true,
            autoHeight: false,
            autoscroll: true,
            shadow: true
        });
        
        var panel = new Ext.Panel({
            id: 'pnael_escrow_news',
            layout: 'border',
            height: 500,
            renderTo: 'celigo-grid',
            items: [{
                title: 'News',
                region: 'center',
                layout: 'fit',
                frame: true,
                border: false,
                items: [newsGrid]
            }, {
                title: 'Deals',
                region: 'west',
                layout: 'fit',
                frame: true,
                border: false,
                width: 200,
                split: true,
                items: [tree1]
            }]
        });
        document.getElementById('loader').style.display = 'none';
    } 
    catch (e) {
        //hide loader
        document.getElementById('loader').style.display = 'none';
        document.getElementById('message').innerHTML = '<p>No news found.</p>';
    }
    
});


