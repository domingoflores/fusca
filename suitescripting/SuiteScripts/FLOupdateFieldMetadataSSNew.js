function setStatField(myvalue)
{
	var spiderDate=nlapiDateToString(new Date());
    var spiderConfigList=nlapiSearchRecord("customrecord_flo_spider_configuration");
    if(spiderConfigList!=null)
    {  
              spiderid=spiderConfigList[0].getId();
              var spiderConfigRec=nlapiLoadRecord('customrecord_flo_spider_configuration',spiderid);
              spiderConfigRec.setFieldText('custrecord_flo_utiliz_metadata',myvalue);
              nlapiSubmitRecord(spiderConfigRec);
    }
 
}

function runSS()
{

//var myDep=nlapiLoadRecord('scriptdeployment','customdeploy_googlemaps_client');

var itemlastinternalid = nlapiGetContext().getSetting('SCRIPT', 'custscript_last_field_process_dlu');

var savedsearch = nlapiGetContext().getSetting('SCRIPT', 'custscript_update_field_metadata_search');

var ssfilters = new Array();
var sscolumns = new Array();	

//sscolumns[0] = new nlobjSearchColumn('internalid');
//sscolumns[0].setSort();
//sscolumns[1]= sscolumns[0].setSort();

if(itemlastinternalid)
ssfilters.push(new nlobjSearchFilter('internalidnumber', null,'greaterthan', itemlastinternalid));
else
ssfilters.push(new nlobjSearchFilter('internalidnumber', null,'greaterthan', 0));

var defaultsearch='customsearch_flo_field_cutomizations';
if(savedsearch) {
	defaultsearch = savedsearch;
}
nlapiLogExecution("debug","defaultsearch ", "defaultsearch.... " + defaultsearch);

setStatField("In Progress");

var custRecs=nlapiSearchRecord("customrecord_flo_customization",defaultsearch,ssfilters,sscolumns);

var context = nlapiGetContext();

	for(cr=0;custRecs[cr]!=null;cr++) //loop through custom records
	{
		var usageRemaining = context.getRemainingUsage();

		var recid=custRecs[cr].getId();

		var rectype='customrecord_flo_customization';

	    nlapiLogExecution("debug","recid1",recid)

	    if(usageRemaining > 1000)
		{
			updateFieldMetadata(rectype,recid)	
			itemlastinternalid = recid;
    	}else{
			var sparams = new Array();
			sparams['custscript_last_field_process_dlu'] = itemlastinternalid;
			var status = nlapiScheduleScript(context.getScriptId(), context.getDeploymentId(),sparams)
			if ( status == 'QUEUED' )
			break;
    	}
    }

   setStatField("Completed");
}

function updateFieldMetadata(rectype,recid)
{
	try
	{

	    nlapiLogExecution("debug","recid",recid)
	    //This function retrieves the date of last use of each field
	    var custRec=nlapiLoadRecord(rectype,recid);
	    var ldu="";//used to track if the date has changed.
		//Get the record type
		var custtype=custRec.getFieldText("custrecord_flo_cust_type");
		//get the field scriptid
		var fieldScriptId=custRec.getFieldValue("custrecord_flo_cust_id");
		
		//Set Defaults
		var filters=[];
		datefield="datecreated";
		
		var xcolumns=[];

	
	var recids="";//The ids of the record types to be searched
	
	//Set record type
	  if(custtype.indexOf('Entity')>=0)
	  {
	       recids="customer,vendor,employee,partner,contact";
	  }
	  else if(custtype.indexOf('Body')>=0) 	  
	  {
	       //recids="salesorder,invoice,purchaseorder,estimate,workorder,assemblybuild,assemblyunbuild,binworksheet,bintransfer,cashrefund,cashsale,charge,check,creditmemo,customerdeposit,customerpayment,customerrefund,deposit,depositapplication,expensereport,intercompanyjournalentry,intercompanycostrevaluation,inventoryadjustment,inventorycostrevaluation,inventorycount,inventorytransfer,itemdemandplan,itemfulfillment,itemreceipt,itemsupplyplan,journalentry,landedcost,manufacturingoperationtask,accountingtransaction,opportunity,paycheckjournal,purchaserequisition,returnauthorization,revenuecommitment,revenuecommitmentreversal,statisticaljournalentry,timebill,timesheet,transferorder,vendorbill,vendorcredit,vendorpayment,vendorreturnauthorization,workorderclose,workordercompletion,workorderissue";
		    recids=getRecIds(custRec.getFieldTexts("custrecord_flo_cust_parent"));

		    nlapiLogExecution('ERROR', 'recids', JSON.stringify(recids));

			filters.push(new nlobjSearchFilter("mainline",null,'is','T'));
	  }
	  else if(custtype.indexOf('Column')>=0 | custtype.indexOf('Option')>=0 | custtype.indexOf('Number')>=0)	  
	  {
	       //recids="salesorder,invoice,purchaseorder,estimate,workorder,assemblybuild,assemblyunbuild,binworksheet,bintransfer,cashrefund,cashsale,charge,check,creditmemo,customerdeposit,customerpayment,customerrefund,deposit,depositapplication,expensereport,intercompanyjournalentry,intercompanycostrevaluation,inventoryadjustment,inventorycostrevaluation,inventorycount,inventorytransfer,itemdemandplan,itemfulfillment,itemreceipt,itemsupplyplan,journalentry,landedcost,manufacturingoperationtask,accountingtransaction,opportunity,paycheckjournal,purchaserequisition,returnauthorization,revenuecommitment,revenuecommitmentreversal,statisticaljournalentry,timebill,timesheet,transferorder,vendorbill,vendorcredit,vendorpayment,vendorreturnauthorization,workorderclose,workordercompletion,workorderissue";
	        recids=getRecIds(custRec.getFieldTexts("custrecord_flo_cust_parent"));
			filters.push(new nlobjSearchFilter("mainline",null,'is','F'));
	  }
	  else if(custtype.indexOf('CRM')>=0)
	  {
		   recids="calendarevent,supportcase,job,phonecall,note,projecttask,message,campaign,solution,projectexpensetype";   
		   datefield="createddate";

	  }
	  else if(custtype.indexOf('Item')>=0)
	  {
		   recids="item";
	  }
	  else if(custtype=="Record")
	  {
		   nlapiLogExecution("debug","custom record id",fieldScriptId)
	       //recids=custRec.getFieldValue("custrecord_flo_cust_id");
			recids=fieldScriptId;
	       fieldScriptId="";
	  }
	  else if(custtype=="Custom Record Field")
	  {
		    
	        parentId=custRec.getFieldValues("custrecord_flo_cust_parent");
		    nlapiLogExecution("debug","parentId",parentId)
	        if(parentId!=null)
	        {parentId=parentId[0]}
	        nlapiLogExecution("debug","parentId",parentId)
			recids=nlapiLookupField("customrecord_flo_customization",parentId,"custrecord_flo_cust_id");
	  }

	

	  nlapiLogExecution("debug","recids",recids)

	  recids=recids.split(",");

	  threemos=nlapiAddMonths(new Date(),-3);

	         var timediff2=0;
	  //loop backward in time to find data
	  time11=new Date();

	  //process for each rectype
	for(r=0;recids[r]!=null && ldu<threemos && nlapiGetContext().getRemainingUsage()>200 && timediff2<40;r++)
	{
		  filters=[];
		  xcolumns=[];
		  //Create filters
		  if(fieldScriptId!="")
		  {
		  	recordfilter=new nlobjSearchFilter('formulatext',null,'isnotempty');
		    recordfilter.setFormula('{'+fieldScriptId+'}');
		    filters[0]=recordfilter;
		    /*recordfilter=new nlobjSearchFilter('formulatext',null,'doesnotstartwith','ERROR');
		    recordfilter.setFormula('"{'+fieldScriptId+'}"');
		    filters.push(recordfilter);*/
		    //nlapiLogExecution("debug","fieldScriptId",fieldScriptId+"--"+nlapiGetContext().getRemainingUsage())
		    //filters.push(new nlobjSearchFilter(fieldScriptId,null,'isnotempty'))
		  }else{
		  	nlapiLogExecution('ERROR', 'no Script id', 'id');
		  	break;
		  }

		  if(recids[r]=="supportcase" | recids[r]=="activity")
		  {datefield="date"}
		  else if(recids[r]=="campaign")
		  {datefield="startdate"}
		  else if(recids[r]=="item")
		  {datefield="modified"}
		  else if(recids[r]=="solution")
		  {datefield="lastmodifieddate"}		
		  else if(recids[r].indexOf("customrecord")>=0)
		  {datefield="lastmodified"}
		  else if(recids[r]=="calendarevent" | recids[r]=="opportunity" | recids[r]=="activity" | recids[r]=="phonecall")
		  {datefield="createddate"}	


		  nlapiLogExecution("debug","datefield",datefield)
	  	  //Add column
		  xcolumns[0]=new nlobjSearchColumn(datefield,null,"max");//.setSort(true);
		  //xcolumns[1]=new nlobjSearchColumn(fieldScriptId,null,"group");

		  /*if(fieldScriptId!="")
		  xcolumns[1]=new nlobjSearchColumn(fieldScriptId,null);}*/
	  	   nlapiLogExecution("debug","ZZrecids",recids[r])
	       var timediff=0;
	  //loop backward in time to find data
	  time1=new Date();		

	  var usesearch;//used to store the results of the search
	  for(p=1;p<2 && usesearch==null && nlapiGetContext().getRemainingUsage()>150 && timediff<20;p++)
	  {
		//time1=new Date();
	    //filters[1]=new nlobjSearchFilter(datefield,null,"onorafter",nlapiAddMonths(new Date(),-p));
	    //filters[2]=new nlobjSearchFilter(datefield,null,"onorbefore",nlapiAddMonths(new Date(),-p+1));
   		/*if(rectype[r].indexOf("customrecord")>=0)
   		{
	 		xcolumns[0]=new nlobjSearchColumn("lastmodified",null).setSort(true);
			filters.push(new nlobjSearchFilter("lastmodified",null,"onorafter",nlapiAddDays(new Date(),-p)));
		}*/
	  	//Create query
	    try
	    {
		  nlapiLogExecution("debug","rectype",recids[r]+"-- Days:"+p)
	  	  usesearch=nlapiSearchRecord(recids[r],null,filters,xcolumns);
	      time2=new Date();
	      timediff=(time2-time1)/1000/60;
	      nlapiLogExecution("debug","timediff",timediff)
	      if(usesearch==null)
	      {
		     //filters[0]=new nlobjSearchFilter(fieldScriptId,null,'noneof','@NONE@');
		     //usesearch=nlapiSearchRecord(recids[r],null,filters,xcolumns);
	      }
        }
        catch(e){
        	nlapiLogExecution("debug","unable to search"+custRec.getId(),e.message);p=20000;usesearch=null;
        }
	  }
	  //Get dates to compare
	  if(usesearch!=null)
	  {
	      	pcolumns=usesearch[0].getAllColumns();
	    	nlapiLogExecution("debug","date",usesearch[0].getValue(pcolumns[0]))
	    	date=nlapiStringToDate(usesearch[0].getValue(pcolumns[0]));
		    nlapiLogExecution("debug","ldate",date)
	   }
	   else
	   {
		    //use default to Dec 31, 1969
		    date=new Date(0);
	   }

	    recdate=custRec.getFieldValue("custrecord_flo_dls");
    	lrecdate=nlapiStringToDate(recdate);

       	nlapiLogExecution("AUDIT","recdate",recdate+"--"+(date-lrecdate))

	    //If the date is after the presently recorded date and not on the same day or if the presently recorded date is blank - update the date
		if(recdate==null | recdate=="" | date-lrecdate>0 )
		{

			//date=usesearch[0].getValue(pcolumns[0]).split(' ')[0];
			date=nlapiDateToString(date,"date").split(' ')[0];
			nlapiLogExecution("debug","updating date",date)
			dateparts=date.split("/");
			newdate="";
			for(d=0;dateparts[d]!=null;d++)
			{
				if(dateparts[d].length==1)
				{dateparts[d]="0"+dateparts[d];}
				if(newdate!=""){newdate+="/"}
				newdate+=dateparts[d];
			}
		    custRec.setFieldValue("custrecord_flo_dls",newdate);
		    if(usesearch!=null)
		    {custRec.setFieldValue("custrecord_flo_num_vals",countVals(usesearch));}
		    ldu=lrecdate;
		}
		date=recdate=lrecdate=null;

		time22=new Date();
	   timediff2=(time22-time11)/1000/60;

	}
		if(ldu!=new Date(0))
     	{nlapiSubmitRecord(custRec);}
     
     }catch(e){nlapiLogExecution("debug","dlu error",e.message)}
}




function countVals(searchres)
{
	var valArray=[];
	for(s=0;searchres[s]!=null && s<100;s++)
	{
		cols=searchres[s].getAllColumns();
		if(valArray.indexOf(searchres[s].getValue(cols[1]))<0)
		{valArray.push(searchres[s].getValue(cols[1]))}
	}
	return valArray.length
}

function getRecIds(parentList)
{
	nlapiLogExecution("debug","parents",parentList.join())

	reclist="";
	var recmap=";SALE:salesorder,invoice,estimate,opportunity,itemfulfillment,cashsale,creditmemo,customerrefund;PURCHASE:purchaseorder,vendorbill,purchaserequisition,vendorcredit;CUSTOMER_PAYMENT:customerpayment;CUSTOMER PAYMENT:customerpayment;JOURNAL:journalentry,intercompanyjounalentry,paycheckjournal,statisticaljournalentry;EXPENSE:expensereport;EXPENSE REPORT:expensereport;CUSTOMER PAYMENT:customerpayment;DEPOSIT:customerdeposit;INV._ADJ.:inventoryadjustment;INV. ADJ.:inventoryadjustment;ITEM_RECPT.:itemreceipt;ITEM RECPT.:itemreceipt;TRANSFER_ORDER:transferorder;TRANSFER ORDER:transferorder;VENDOR_PAYMENT:vendorpayment;VENDOR PAYMENT:vendorpayment;"
	for(p=0;parentList[p]!=null;p++)
	{
		recs="";
		recstart=recmap.indexOf(";"+parentList[p].toUpperCase()+":");
		if(recstart>=0)
		{recs=recmap.split(";"+parentList[p].toUpperCase()+":")[1].split(";")[0]};
		if(recs!="")
		{
			if(reclist!=""){reclist+=","}
			reclist+=recs;
		}else{
			if(recmap.toUpperCase().indexOf(parentList[p].toUpperCase())>=0){
				if(reclist!=""){reclist+=","}
				reclist+=parentList[p].toLowerCase();
			}
		}
		
	}
	return reclist
}