/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       05 Dec 2014     jmarimla         Initial
 * 2.00       07 Mar 2015     jmarimla         Added refresh button
 * 3.00       19 Mar 2015     jyeh             Action details column
 * 4.00       27 Mar 2015     jmarimla         Added number field
 * 5.00       21 Apr 2015     jmarimla         Added tabPanel
 * 6.00       01 Jul 2015     jmarimla         Object for mask configuration
 * 7.00       25 Aug 2015     jmarimla         Page Toolbar component
 * 8.00       05 Nov 2015     jmarimla         Components for personalize panel
 * 9.00       01 Dec 2015     jmarimla         CSV Export button component
 * 10.00      08 Apr 2016     jmarimla         Added tooltip component
 * 11.00      29 Jun 2018     jmarimla         Translation readiness
 * 12.00      06 Jul 2018     jmarimla         Uppercase filters
 * 13.00      24 May 2019     erepollo         Added new portlet container.
 * 
 */

var MASK_CONFIG = {};

function APMExtJSCommon() {
	MASK_CONFIG = {
	        cls: 'apm-loadmask',
	        msgCls: 'apm-loadmask-msg',
	        msg: APMTranslation.apm.common.label.loading(),
	        shadow: false
	};

	Ext4.define('PSGP.APM.Component.PageToolbar', {
	   extend: 'Ext4.toolbar.Toolbar',
	   height: 55,
	   cls: 'apm-toolbar-page'
	});

	Ext4.define('PSGP.APM.Component.PageTitle', {
	    extend : 'Ext4.form.field.Display',
	    labelSeparator: '',
	    labelWidth: 0,
	    fieldCls: 'apm-display-pagetitle',
	    margin: '10 20 10 20'
	});

	Ext4.define('PSGP.APM.Component.PageToolbarButton', {
	    extend: 'Ext4.button.Button',
	    cls: 'apm-pagetoolbar-btn',
	    padding: '0 15 0 15',
	    height: 28,
	    handler: function () {
	        if (Ext4.getCmp(this.targetMenu).isVisible()) {
	            Ext4.getCmp(this.targetMenu).hide();
	        } else {
	            Ext4.getCmp(this.targetMenu).showBy(this.getEl(), 'tr-br?');
	        }
	    }
	});

	Ext4.define('PSGP.APM.Component.QuickSelectorMenu', {
	    extend: 'Ext4.container.Container',
	    floating: true,
	    cls: 'apm-quickselectormenu'
	});

	Ext4.define('PSGP.APM.Component.Container', {
	    extend: 'Ext4.container.Container',
	    border: false,
	    defaults: {
	        margin: '0 0 0 0',
	        bodyPadding: 0
	    },
	    cls: 'apm-container'
	});

	Ext4.define('PSGP.APM.Component.BlueButton', {
	    extend: 'Ext4.button.Button',
	    cls: 'apm-rect-btn apm-rect-btn-blue',
	    padding: '0 12 0 12',
	    height: 28
	});

	Ext4.define('PSGP.APM.Component.GrayButton', {
	    extend: 'Ext4.button.Button',
	    cls: 'apm-rect-btn apm-rect-btn-gray',
	    padding: '0 12 0 12',
	    height: 28
	});

	Ext4.define('PSGP.APM.Component.FiltersPanel', {
	    extend: 'Ext4.panel.Panel',
	    cls: 'apm-panel-filters',
	    bodyCls: 'apm-panel-filters-body',
	    title: APMTranslation.apm.common.label.filters().toUpperCase(),
	    layout : 'column',
	    border: true,
	    align: 'center',
	    collapsible : true,
	    titleCollapse : true,
	    animCollapse : false,
	    header : {
	        height: 26
	    },
	    bodyPadding: '10 20 10 20'
	});

	Ext4.define('PSGP.APM.Component.Display', {
	    extend : 'Ext4.form.field.Display',
	    labelSeparator: '',
	    labelWidth: 150,
	    labelCls: 'apm-display-label',
	    fieldCls: 'apm-display-field',
	    margin: '0 0 0 0'
	});

	Ext4.define('PSGP.APM.Component.DatePicker', {
	    extend: 'Ext4.picker.Date',
	    floating: true,
	    hidden: true,
	    focusOnShow: true,
	    renderTo: Ext4.getBody(),
	    showToday: false,
	    width: 194,
	    monthYearFormat: 'M Y'
	});

	Ext4.define('PSGP.APM.Component.Date', {
	    extend: 'Ext4.form.field.Date',
	    editable: true,
	    allowBlank: false,
	    cls: 'apm-date',
	    fieldCls: 'apm-date-field',
	    overCls: 'apm-date-field-over',
	    width: 120,
	    showToday: false,
	    createPicker: function () {
	        var me = this;
	        var datepicker = Ext4.create('PSGP.APM.Component.DatePicker', {
	            pickerField: me,
	            ownerCt: me.ownerCt,
	            listeners: {
	                scope: me,
	                select: me.onSelect
	            },
	            keyNavConfig: {
	                esc: function() {
	                    me.collapse();
	                }
	            }
	        });
	        return datepicker;
	    }
	});

	Ext4.define('PSGP.APM.Component.Time', {
	    extend: 'Ext4.form.field.Time',
	    width: 100,
	    editable: false,
	    cls: 'apm-combo',
	    fieldCls: 'apm-combo-field',
	    overCls: 'apm-combo-over'
	});

	Ext4.define('PSGP.APM.Component.DateSeparator', {
	    extend : 'Ext4.toolbar.Spacer',
	    width : 19
	});

	Ext4.define('PSGP.APM.Component.ComboBox', {
	    extend : 'Ext4.form.field.ComboBox',
	    labelAlign : 'left',
	    valueField : 'id',
	    displayField : 'name',
	    forceSelection : true,
	    editable: true,
	    allowBlank: false,
	    cls: 'apm-combo',
	    fieldCls: 'apm-combo-field',
	    overCls: 'apm-combo-over',
	    typeAhead: true,
	    typeAheadDelay: 0,
	    minChars: 1,
	    selectOnFocus: true,
	    listConfig: {
	        loadMask: MASK_CONFIG
	    }
	});

	Ext4.define('PSGP.APM.Component.TextField', {
	    extend : 'Ext4.form.field.Text',
	    labelAlign : 'left',
	    cls: 'apm-input',
	    fieldCls: 'apm-input-field',
	    overCls: 'apm-input-over'
	});

	Ext4.define('PSGP.APM.Component.TextField.Email', {
	    extend: 'PSGP.APM.Component.TextField',
	    width: 208
	});

	Ext4.define('PSGP.APM.Component.NumberField', {
	    extend : 'Ext4.form.field.Number',
	    labelAlign : 'left',
	    cls: 'apm-input',
	    fieldCls: 'apm-input-field',
	    overCls: 'apm-input-over',
	    spinDownEnabled: false,
	    spinUpEnabled: false,
	    hideTrigger: true,
	    width: 70
	});

	Ext4.define('PSGP.APM.Component.EmptyPanel', {
	    extend: 'Ext4.panel.Panel',
	    border: false,
	    header: false
	});

	Ext4.define('PSGP.APM.Component.PortletContainer', {
        extend: 'Ext4.panel.Panel',
        border: false,
        header: false,
        cls: 'apm-portlet-container'
    });

    Ext4.define('PSGP.APM.Component.PortletPanel', {
        extend: 'Ext4.panel.Panel',
        cls: 'apm-panel-portlet',
        header : {
            height: 51
        }
    });

	Ext4.define('PSGP.APM.Component.Grid', {
	    extend: 'Ext4.grid.Panel',
	    cls: 'apm-grid',
	    border: false
	});

	Ext4.define('PSGP.APM.Component.GridToolbar', {
	    extend: 'Ext4.toolbar.Toolbar',
	    border: false,
	    cls: 'apm-toolbar-grid'
	});

	Ext4.define('PSGP.APM.Component.ExportCSVButton', {
	    extend: 'Ext4.button.Button',
	    cls: 'apm-export-csv-btn',
	    tooltip: '<p>' + APMTranslation.apm.common.label.exportcsv() + '</p>',
	    height: 18,
	    width: 16
	});

	Ext4.define('PSGP.APM.Component.ComboBox.PagingDropDown', {
	    extend: 'PSGP.APM.Component.ComboBox',
	    labelWidth: 75,
	    queryMode: 'local',
	    matchFieldWidth: false,
	    pickerAlign: 'tr-br',
	    height: 30,
	    margin: '0 20 0 15',
	    grow: true,
	    cls: 'apm-input-pagingdropdown',
	    fieldCls: 'apm-input-pagingdropdown-field',
	    overCls: 'apm-input-pagingdropdown-over',
	    listConfig: {
	        cls: 'apm-list-pagingdropdown'
	    }
	});

	Ext4.define('PSGP.APM.Component.PagingToolbar', {
	   extend: 'Ext4.toolbar.Paging',
	   border: false,
	   cls: 'apm-toolbar-paging',
	   margin: '0 5 0 5',
	   getPagingItems: function() {
	       var me = this;
	       return [
	            {
	                itemId: 'prev',
	                tooltip: me.prevText,
	                overflowText: me.prevText,
	                iconCls: Ext4.baseCSSPrefix + 'tbar-page-prev',
	                disabled: true,
	                handler: me.movePrevious,
	                scope: me
	            },
	            {
	                itemId: 'next',
	                tooltip: me.nextText,
	                overflowText: me.nextText,
	                iconCls: Ext4.baseCSSPrefix + 'tbar-page-next',
	                disabled: true,
	                handler: me.moveNext,
	                scope: me
	            }
	       ];
	   }
	});

	Ext4.define('PSGP.APM.Component.TotalPagesField', {
	    extend : 'Ext4.form.field.Display',
	    fieldLabel: APMTranslation.apm.common.label.total(),
	    value: 0,
	    labelWidth: 32,
	    labelSeparator : ':',
	    margin: '0 5 0 5',
	    labelCls : 'apm-display-totalpages-label',
	    fieldCls : 'apm-display-totalpages-field'
	});

	Ext4.define('PSGP.APM.Component.SubPanel', {
	    extend: 'Ext4.panel.Panel',
	    cls: 'apm-panel-subpanel',
	    collapsible : true,
	    titleCollapse : true,
	    animCollapse : false,
	    header : {
	        height: 25
	    }
	});

	Ext4.define('PSGP.APM.Component.SummaryField', {
	    extend : 'Ext4.form.field.Display',
	    labelSeparator: '',
	    labelWidth: 150,
	    labelCls: 'apm-display-label',
	    fieldCls: 'apm-display-field',
	    labelAlign: 'top',
	    border: false,
	    fieldLabel: '',
	    value: 0
	});

	Ext4.define('PSGP.APM.Component.PortletMenuButton', {
	    extend: 'Ext4.button.Button',
	    cls: 'apm-menu-btn',
	    height: 20,
	    width: 36,
	    menuAlign: 'tr-br?'
	});

	Ext4.define('PSGP.APM.Component.PortletRefreshButton', {
	    extend: 'Ext4.button.Button',
	    cls: 'apm-refresh-btn',
	    height: 20,
	    width: 36
	});

	Ext4.define('PSGP.APM.Component.PortletMenu', {
	    extend: 'Ext4.menu.Menu',
	    cls: 'apm-menu',
	    overCls: 'apm-menu-over'
	});

	Ext4.define('PSGP.APM.Component.Window', {
	    extend : 'Ext4.window.Window',
	    padding : 0,
	    closeAction : 'hide',
	    autoHeight : true,
	    plain : true,
	    modal : true,
	    resizable : false,
	    border: false,
	    header : {
	        height: 30
	    },
	    cls : 'apm-window',
	    bodyCls : 'apm-window-body'
	});

	Ext4.define('PSGP.APM.Component.ChartTitle', {
	    extend: 'Ext4.panel.Panel',
	    cls: 'apm-suitescriptdetail-chart-panel',
	    bodyBorder: false,
	    border : false,
	    titleAlign: 'center',
	    width: '100%',
	    header: {
	        border: false,
	        height: 40
	    },
	});

	Ext4.define('PSGP.APM.Component.ColumnAction.Details', {
	    extend: 'Ext4.grid.column.Action',
	    text: APMTranslation.apm.common.label.viewdetails(),
	    tooltip: APMTranslation.apm.common.label.viewdetails(),
	    iconCls: 'apm-column-action-details',
	    width: 20,
	    menuDisabled: true,
	    sortable: false
	});

	Ext4.define('PSGP.APM.Component.TabPanel', {
	    extend: 'Ext4.tab.Panel',
	    cls: 'apm-tabpanel'
	});

	Ext4.define('PSGP.APM.Component.PersonalizePanel.Card', {
	    extend: 'Ext4.container.Container',
	    layout: 'card'
	});

	Ext4.define('PSGP.APM.Component.PersonalizePanel.CardTab', {
	    extend: 'Ext4.container.Container',
	    cls: 'apm-personalizepanel-cardtab',
	    padding: '14 14 14 14',
	    height: 53,
	    targetCardItem: '', //required
	    listeners: {
	        afterrender: function (c) {
	            var element = c.getEl();
	            var targetCardContainer = this.targetCardContainer;
	            var targetCardItem = this.targetCardItem;

	            element.on('mouseover', function() {
	                c.addCls('apm-personalizepanel-cardtab-hover');
	            });

	            element.on('mouseout', function() {
	                c.removeCls('apm-personalizepanel-cardtab-hover');
	            });

	            element.on('click', function() {
	                var allTabs = c.up().items.items;
	                for (var i in allTabs) {
	                    allTabs[i].removeCls('apm-personalizepanel-cardtab-selected');
	                } 
	                c.addCls('apm-personalizepanel-cardtab-selected');
	                var card = Ext4.getCmp(targetCardContainer).getLayout();
	                card.setActiveItem(targetCardItem);
	            });
	        }
	    }
	});

	Ext4.define('PSGP.APM.Component.PersonalizePanel.ItemButton', {
	   extend: 'Ext4.button.Button',
	   height: '50%',
	   width: 160,
	   itemButtonId: '', //required
	   cardId: '', //required
	   buttonIcon: '', //required
	   handlerMode: '', //required ('add' or 'remove')
	   handler: function () {
	       var personalizePanel = Ext4.ComponentQuery.query('[id=' + this.id + '] ^ #personalizepanel-main')[0];
	       var portletIdPrefix = personalizePanel.portletIdPrefix;
	       var personalizePanelIdPrefix = personalizePanel.personalizePanelIdPrefix;
	       var personalizePanelUsedCard = personalizePanel.personalizePanelUsedCard;
	       switch (this.handlerMode) {
	       case 'add':
	           Ext4.getCmp(portletIdPrefix + this.itemButtonId).show();
	           var targetCardRow = Ext4.ComponentQuery.query('[id='+ personalizePanelIdPrefix + personalizePanelUsedCard + '] #personalizepanel-cardcontent')[0];
	           personalizePanel.createIconButton(
	                   targetCardRow
	                 , this.cardId
	                 , this.itemButtonId
	                 , this.buttonIcon
	                 , this.text
	                 , 'remove'
	           );
	           break;
	       case 'remove':
	           Ext4.getCmp(portletIdPrefix + this.itemButtonId).hide();
	           var targetCardRow = Ext4.ComponentQuery.query('[id='+ personalizePanelIdPrefix + this.cardId + '] #personalizepanel-cardcontent')[0];
	           personalizePanel.createIconButton(
	                   targetCardRow
	                 , this.cardId
	                 , this.itemButtonId
	                 , this.buttonIcon
	                 , this.text
	                 , 'add'
	           );
	           break;
	       default:
	           return;
	       }
	       this.destroy();
	   }
	});

	Ext4.define('PSGP.APM.Component.PersonalizePanel.CardItem', {
	    extend: 'Ext4.container.Container',
	    cls: 'apm-personalizepanel-carditem',
	    layout: 'hbox',
	    items: [
	        {
	            xtype: 'button',
	            cls: 'apm-personalizepanel-carditem-nav',
	            itemId: 'personalizepanel-btn-prev',
	            width: 50,
	            height: '100%',
	            text: '<'
	        },
	        {
	            xtype: 'container',
	            flex: 1,
	            height: '100%',
	            layout: 'vbox',
	            items: [
	                {
	                    xtype: 'container',
	                    itemId: 'personalizepanel-cardcontent',
	                    flex: 1,
	                    width: '100%',
	                    layout: 'column'
	                }
	            ]
	        }, 
	        {
	            xtype: 'button',
	            cls: 'apm-personalizepanel-carditem-nav',
	            itemId: 'personalizepanel-btn-next',
	            width: 50,
	            height: '100%',
	            text: '>'
	        }
	    ]
	});

	Ext4.define('PSGP.APM.Component.PersonalizePanel', {
	    extend: 'Ext4.panel.Panel',
	    cls: 'apm-personalizepanel',
	    border: false,
	    collapsed: true,
	    collapseMode: 'mini',
	    height: 240,
	    layout:'vbox',
	    itemId: 'personalizepanel-main',
	    portletIdPrefix: '', //required
	    personalizePanelIdPrefix: '', //required
	    personalizePanelUsedCard: '', //required
	    personalizePanelStore: {}, //required
	    personalizePanelTabs: [], //required
	    personalizePanelCards: [], //required
	    listeners: {
	        beforerender: function () {
	            
	            var personalizePanel = this;
	            //NOTE: create cards first before tabs for dependency
	            var personalizePanelCards = this.personalizePanelCards;
	            var cardItemsContainer = Ext4.ComponentQuery.query('[id='+ this.id + '] #personalizepanel-carditem-container')[0];
	            for (var i in personalizePanelCards) {
	                var cardItem = Ext4.create('PSGP.APM.Component.PersonalizePanel.CardItem', personalizePanelCards[i]);
	                cardItemsContainer.add(cardItem);
	            }
	            
	            var personalizePanelTabs = this.personalizePanelTabs;
	            var cardTabContainer = Ext4.ComponentQuery.query('[id='+ this.id + '] #personalizepanel-cardtab-container')[0];
	            for (var i in personalizePanelTabs) {
	                personalizePanelTabs[i].targetCardContainer = cardItemsContainer.id;
	                var cardTab = Ext4.create('PSGP.APM.Component.PersonalizePanel.CardTab', personalizePanelTabs[i])
	                if (i == 0) cardTab.addCls('apm-personalizepanel-cardtab-selected'); //select first tab
	                cardTabContainer.add(cardTab);
	            }
	            
	            var personalizePanelStore = this.personalizePanelStore;
	            var personalizePanelIdPrefix = this.personalizePanelIdPrefix;
	            var personalizePanelUsedCard = this.personalizePanelUsedCard;
	            personalizePanelStore.each(function (record, index) {
	                var cardId = record.get('cardId');
	                var show = record.get('show');
	                if (show) {
	                    var targetCardRow = Ext4.ComponentQuery.query('[id='+ personalizePanelIdPrefix + personalizePanelUsedCard + '] #personalizepanel-cardcontent')[0];
	                    personalizePanel.createIconButton(
	                            targetCardRow
	                          , cardId
	                          , record.get('id')
	                          , record.get('buttonIcon')
	                          , record.get('buttonText')
	                          , 'remove'
	                    );
	                } else {
	                    var targetCardRow = Ext4.ComponentQuery.query('[id='+ personalizePanelIdPrefix + cardId + '] #personalizepanel-cardcontent')[0];
	                    personalizePanel.createIconButton(
	                            targetCardRow
	                          , cardId
	                          , record.get('id')
	                          , record.get('buttonIcon')
	                          , record.get('buttonText')
	                          , 'add'
	                    );
	                }
	            });
	            
	        }
	    },
	    items: [
	            {
	                xtype: 'container',
	                cls: 'apm-personalizepanel-header',
	                height: 34,
	                width: '100%',
	                layout: {
	                    type: 'hbox',
	                    align: 'middle'
	                },
	                items: [
	                    {
	                        xtype: 'container',
	                        cls: 'apm-personalizepanel-header-title',
	                        html: 'Personalize Dashboard',
	                        margin: '0 0 0 5',
	                        flex: 1
	                    },
	                    {
	                        xtype: 'button',
	                        cls: 'apm-personalizepanel-header-close',
	                        text: '\u00D7',
	                        width: 25,
	                        height: 25,
	                        margin: '0 15 0 15',
	                        handler: function (btn) {
	                            var mainPanel = Ext4.ComponentQuery.query('#' + btn.id + ' ^ #personalizepanel-main')[0];
	                            mainPanel.toggleCollapse();
	                        }
	                    }
	                ]
	            },
	            {
	                xtype: 'container',
	                cls: 'apm-personalizepanel-body',
	                flex: 1,
	                width: '100%',
	                layout: {
	                    type: 'hbox'
	                },
	                items: [
	                    {
	                        xtype: 'container',
	                        width: 250,
	                        itemId: 'personalizepanel-cardtab-container',
	                        items: []
	                    },
	                    {
	                        xtype: 'container',
	                        flex: 1,
	                        height: '100%',
	                        layout: 'fit',
	                        items: [
	                            Ext4.create('PSGP.APM.Component.PersonalizePanel.Card', {
	                                itemId: 'personalizepanel-carditem-container',
	                                flex: 1,
	                                items: []
	                            })
	                        ]
	                    }
	                ]
	            }
	    ],
	    createIconButton : function ( targetCardRow, cardId, buttonId, buttonIcon, buttonText, handlerMode) {
	        var cssClasses = 'apm-personalizepanel-itembutton'
	                       + ' ' + 'apm-personalizepanel-itembutton-' + buttonId
	                       + ' ' + 'apm-personalizepanel-itemicon-' + buttonIcon
	                       + ' ' + 'apm-personalizepanel-itemicon-' + buttonIcon + '-' + handlerMode;
	        targetCardRow.add(
	                Ext4.create('PSGP.APM.Component.PersonalizePanel.ItemButton', {
	                        text: buttonText
	                      , itemButtonId: buttonId
	                      , buttonIcon: buttonIcon
	                      , cls: cssClasses
	                      , cardId: cardId
	                      , handlerMode: handlerMode
	                })
	        );
	    }
	});

	Ext4.define('PSGP.APM.Component.ToolTip', {
	    extend: 'Ext4.tip.ToolTip',
	    cls: 'apm-tooltip',
	    dismissDelay: 0,
	    showDelay: 200
	});
}

