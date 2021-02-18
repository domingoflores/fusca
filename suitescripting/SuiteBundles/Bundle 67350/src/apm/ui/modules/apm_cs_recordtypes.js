/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */ 

/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       15 Jan 2015     jmarimla         Initial
 *
 */

PSGP.APM.recordTypes = [
        { 'name' : 'Account' , 'id' : '/app/accounting/account/account.nl'}
    ,   { 'name' : 'Accounting Period' , 'id' : '/app/setup/period/fiscalperiod.nl'}
    ,   { 'name' : 'All Custom Records' , 'id' : '/app/common/custom/custrecordentry.nl'}
    ,   { 'name' : 'App Definition' , 'id' : '/app/appdef/appdef.nl'}
    ,   { 'name' : 'App Package' , 'id' : '/app/appdef/apppkg.nl'}
    ,   { 'name' : 'Assembly Build' , 'id' : '/app/accounting/transactions/build.nl'}
    ,   { 'name' : 'Assembly UnBuild' , 'id' : '/app/accounting/transactions/unbuild.nl'}
    ,   { 'name' : 'Bin Record' , 'id' : '/app/accounting/transactions/inventory/binnumberrecord.nl'}
    ,   { 'name' : 'Bin Transfer' , 'id' : '/app/accounting/transactions/bintrnfr.nl'}
    ,   { 'name' : 'Bin Worksheet' , 'id' : '/app/accounting/transactions/binwksht.nl'}
    ,   { 'name' : 'Campaign' , 'id' : '/app/crm/marketing/campaign.nl'}
    ,   { 'name' : 'Campaign Response' , 'id' : '/app/crm/marketing/campaignresponse.nl'}
    ,   { 'name' : 'Case' , 'id' : '/app/crm/support/supportcase.nl'}
    ,   { 'name' : 'Cash Refund' , 'id' : '/app/accounting/transactions/cashrfnd.nl'}
    ,   { 'name' : 'Cash Sale' , 'id' : '/app/accounting/transactions/cashsale.nl'}
    ,   { 'name' : 'Check' , 'id' : '/app/accounting/transactions/check.nl'}
    ,   { 'name' : 'Class' , 'id' : '/app/common/otherlists/classtype.nl'}
    ,   { 'name' : 'Competitor' , 'id' : '/app/crm/sales/competitor.nl'}
    ,   { 'name' : 'Contact' , 'id' : '/app/common/entity/contact.nl'}
    ,   { 'name' : 'Contact Category/Role' , 'id' : '/app/common/otherlists/crmotherlist.nl'}
    ,   { 'name' : 'Coupon Code' , 'id' : '/app/crm/sales/couponcode.nl'}
    ,   { 'name' : 'Credit Memo' , 'id' : '/app/accounting/transactions/custcred.nl'}
    ,   { 'name' : 'Currency' , 'id' : '/app/common/multicurrency/currency.nl'}
    ,   { 'name' : 'Customer' , 'id' : '/app/common/entity/custjob.nl'}
    ,   { 'name' : 'Customer Category' , 'id' : '/app/common/otherlists/accountingotherlist.nl'}
    ,   { 'name' : 'Customer Deposit' , 'id' : '/app/accounting/transactions/custdep.nl'}
    ,   { 'name' : 'Customer Payment' , 'id' : '/app/accounting/transactions/custpymt.nl'}
    ,   { 'name' : 'Customer Refund' , 'id' : '/app/accounting/transactions/custrfnd.nl'}
    ,   { 'name' : 'Customer Status' , 'id' : '/app/crm/sales/customerstatus.nl'}
    ,   { 'name' : 'Department' , 'id' : '/app/common/otherlists/departmenttype.nl'}
    ,   { 'name' : 'Deposit Application' , 'id' : '/app/accounting/transactions/depappl.nl'}
    ,   { 'name' : 'Employee' , 'id' : '/app/common/entity/employee.nl'}
    ,   { 'name' : 'Estimate' , 'id' : '/app/accounting/transactions/estimate.nl'}
    ,   { 'name' : 'Event' , 'id' : '/app/crm/calendar/event.nl'}
    ,   { 'name' : 'Expense Category' , 'id' : '/app/accounting/otherlists/expcategory.nl'}
    ,   { 'name' : 'Expense Report' , 'id' : '/app/accounting/transactions/exprept.nl'}
    ,   { 'name' : 'Folder' , 'id' : '/app/common/media/mediaitemfolder.nl'}
    ,   { 'name' : 'Gift Certificate' , 'id' : '/app/accounting/transactions/giftcertificaterecord.nl'}
    ,   { 'name' : 'Intercompany Transfer Order' , 'id' : '/app/accounting/transactions/trnfrord.nl'}
    ,   { 'name' : 'Inventory Adjustment' , 'id' : '/app/accounting/transactions/invadjst.nl'}
    ,   { 'name' : 'Inventory Detail' , 'id' : '/app/accounting/transactions/inventory/numbered/inventorydetail.nl'}
    ,   { 'name' : 'Inventory Number' , 'id' : '/app/accounting/transactions/inventory/inventorynumberrecord.nl'}
    ,   { 'name' : 'Inventory Transfer' , 'id' : '/app/accounting/transactions/invtrnfr.nl'}
    ,   { 'name' : 'Invoice' , 'id' : '/app/accounting/transactions/custinvc.nl'}
    ,   { 'name' : 'Issue' , 'id' : '/app/crm/support/issuedb/issue.nl'}
    ,   { 'name' : 'Item' , 'id' : '/app/common/item/item.nl'}
    ,   { 'name' : 'Item Demand Plan' , 'id' : '/app/accounting/inventory/demandplanning/itemdemandplan.nl'}
    ,   { 'name' : 'Item Fulfillment' , 'id' : '/app/accounting/transactions/itemship.nl'}
    ,   { 'name' : 'Item Receipt' , 'id' : '/app/accounting/transactions/itemrcpt.nl'}
    ,   { 'name' : 'Item Revision' , 'id' : '/app/common/item/itemrevision.nl'}
    ,   { 'name' : 'Item Supply Plan' , 'id' : '/app/accounting/inventory/demandplanning/itemsupplyplan.nl'}
    ,   { 'name' : 'Journal Entry Record' , 'id' : '/app/accounting/transactions/journal.nl'}
    ,   { 'name' : 'Location' , 'id' : '/app/common/otherlists/locationtype.nl'}
    ,   { 'name' : 'Message' , 'id' : '/app/crm/common/crmmessage.nl'}
    ,   { 'name' : 'Nexus' , 'id' : '/app/setup/nexuses.nl'}
    ,   { 'name' : 'Note' , 'id' : '/app/crm/common/note.nl'}
    ,   { 'name' : 'Opportunity' , 'id' : '/app/accounting/transactions/opprtnty.nl'}
    ,   { 'name' : 'Other Name' , 'id' : '/app/common/entity/othername.nl'}
    ,   { 'name' : 'Partner' , 'id' : '/app/common/entity/partner.nl'}
    ,   { 'name' : 'Paycheck Journal' , 'id' : '/app/accounting/transactions/pchkjrnl.nl'}
    ,   { 'name' : 'Payroll Item' , 'id' : '/app/common/item/payrollitem.nl'}
    ,   { 'name' : 'Phone Call' , 'id' : '/app/crm/calendar/call.nl'}
    ,   { 'name' : 'Project Task' , 'id' : '/app/accounting/project/projecttask.nl'}
    ,   { 'name' : 'Promotion' , 'id' : '/app/crm/sales/referralcode.nl'}
    ,   { 'name' : 'Purchase Order' , 'id' : '/app/accounting/transactions/purchord.nl'}
    ,   { 'name' : 'Reallocate Items' , 'id' : '/app/accounting/transactions/reallocitems.nl'}
    ,   { 'name' : 'Resource Allocation' , 'id' : '/app/accounting/project/allocation.nl'}
    ,   { 'name' : 'Return Authorization' , 'id' : '/app/accounting/transactions/rtnauth.nl'}
    ,   { 'name' : 'Rev Rec Schedule' , 'id' : '/app/accounting/otherlists/revrecschedule.nl'}
    ,   { 'name' : 'Revenue Commitment' , 'id' : '/app/accounting/transactions/revcomm.nl'}
    ,   { 'name' : 'Revenue Commitment Reversal' , 'id' : '/app/accounting/transactions/revcomrv.nl'}
    ,   { 'name' : 'Sales Order' , 'id' : '/app/accounting/transactions/salesord.nl'}
    ,   { 'name' : 'Sales Tax Item' , 'id' : '/app/common/item/taxitem.nl'}
    ,   { 'name' : 'Solution' , 'id' : '/app/crm/support/kb/solution.nl'}
    ,   { 'name' : 'Subsidiary' , 'id' : '/app/common/otherlists/subsidiarytype.nl'}
    ,   { 'name' : 'Task' , 'id' : '/app/crm/calendar/task.nl'}
    ,   { 'name' : 'Tax Group' , 'id' : '/app/common/item/taxgroup.nl'}
    ,   { 'name' : 'Tax Period' , 'id' : '/app/setup/period/taxperiod.nl'}
    ,   { 'name' : 'Tax Schedule' , 'id' : '/app/common/item/taxschedules.nl'}
    ,   { 'name' : 'Tax Type' , 'id' : '/app/setup/taxtype.nl'}
    ,   { 'name' : 'Time' , 'id' : '/app/accounting/transactions/timebill.nl'}
    ,   { 'name' : 'Topic' , 'id' : '/app/crm/support/kb/topic.nl'}
    ,   { 'name' : 'Units Type' , 'id' : '/app/common/units/unitstype.nl'}
    ,   { 'name' : 'Vendor' , 'id' : '/app/common/entity/vendor.nl'}
    ,   { 'name' : 'Vendor Bill' , 'id' : '/app/accounting/transactions/vendbill.nl'}
    ,   { 'name' : 'Vendor Credit' , 'id' : '/app/accounting/transactions/vendcred.nl'}
    ,   { 'name' : 'Vendor Payment' , 'id' : '/app/accounting/transactions/vendpymt.nl'}
    ,   { 'name' : 'Vendor Return Authorization' , 'id' : '/app/accounting/transactions/vendauth.nl'}
    ,   { 'name' : 'Work Order' , 'id' : '/app/accounting/transactions/workord.nl'}
];