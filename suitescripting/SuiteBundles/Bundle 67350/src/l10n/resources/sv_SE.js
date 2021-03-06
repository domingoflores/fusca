/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       11 Jun 2018     jmarimla         Initial
 * 2.00       19 Jun 2018     justaris         Added Strings
 * 3.00       29 Jun 2018     jmarimla         Added Strings
 * 4.00       06 Jul 2018     jmarimla         Added Strings
 * 5.00       17 Jul 2018     rwong            Added Strings
 * 6.00       26 Jul 2018     jmarimla         Added Strings
 * 7.00       30 Jul 2018     justaris         Added Strings
 * 8.00       26 Oct 2018     jmarimla         Added Strings
 * 9.00       07 Dec 2018     jmarimla         Added Strings
 * 10.00      22 Aug 2019     erepollo         Added Strings
 *
 */
/**
 * @NModuleScope Public
 */
define(function() {
    var translation = {
		//latest update from masterlist: 07 Dec 2018 7:00AM
		
    	//REQUESTED	
		"apm.cd.button.back" : "Tillbaka",
		"apm.cd.label.concurrencydetails" : "Samtidighetsuppgifter",
		"apm.cd.label.detailedconcurrency" : "Detaljerad samtidighet",
		"apm.cd.label.exceededconcurrency" : "Överskred samtidighet",
		"apm.cd.label.instancedetails" : "Detaljer om instans",
		"apm.cd.label.max" : "Max – {0}",
		"apm.cd.label.sec" : "sek",
		"apm.cd.label.secs" : "sekunder",
		"apm.cd.label.viewrequests" : "Visa begäranden",
		"apm.cd.label.webservices" : "Webbtjänster",
		"apm.cm.label._101andabove" : "101 % och högre",
		"apm.cm.label.concurrencylimit" : "Samtidighetsbegränsning",
		"apm.cm.label.concurrencymonitor" : "Samtidighetsövervakning",
		"apm.cm.label.concurrencyusage" : "Samtidig användning",
		"apm.cm.label.generalconcurrency" : "Allmän samtidighet",
		"apm.cm.label.highestexceededconcurrency" : "Högsta överskridna samtidighet",
		"apm.cm.label.note" : "Anteckning",
		"apm.cm.label.peakconcurrency" : "Samtidig höjdpunkt",
		"apm.cm.label.percentvaluesareapproximate" : "Värden i procent är uppskattade värden",
		"apm.cm.label.requestexceedinglimit" : "Begäran överskrider gränsen",
		"apm.cm.label.requestswithinlimit" : "Begäranden är inom gränsen (%)",
		"apm.cm.label.totalexceededconcurrency" : "Total överskriden samtidighet",
		"apm.cm.label.valuesareexact" : "Värdena är exakta.",
		"apm.common.alert.daterange._30days" : "Datumintervallet får inte överstiga 30 dagar",
		"apm.common.alert.daterange._3days" : "Datumintervallet ska inte vara under 3 dagar",
		"apm.common.alert.enablefeatures" : "Funktionerna [Anpassade poster], [Kund SuiteScript], och [Server-SuiteScript] måste vara aktiverade. Vänligen aktivera funktionerna och försök igen.",
		"apm.common.alert.endaterequired" : "Slutdatum krävs",
		"apm.common.alert.entervalidenddate" : "Var god ange ett giltigt slutdatum.",
		"apm.common.alert.entervalidstartdate" : "Vänligen ange ett giltigt startdatum.",
		"apm.common.alert.errorinsearch" : "Fel uppstod vid sökning",
		"apm.common.alert.errorinsuitelet" : "Fel uppstod i suitelet",
		"apm.common.alert.invalidenddate" : "Ogiltigt slutdatum",
		"apm.common.alert.invalidstartdate" : "Ogiltigt startdatum",
		"apm.common.alert.nocontent" : "Inget innehåll",
		"apm.common.alert.startdateearlierthanenddate" : "Startdatum måste vara tidigare än slutdatumet.",
		"apm.common.alert.startdaterequired" : "Startdatum krävs",
		"apm.common.button.cancel" : "Avbryt",
		"apm.common.button.done" : "Klart",
		"apm.common.button.refresh" : "Uppdatera",
		"apm.common.button.reset" : "Återställ",
		"apm.common.button.set" : "Ange",
		"apm.common.highcharts.drilluptext" : "Tillbaka till",
		"apm.common.highcharts.nodata" : "Inga data att visa",
		"apm.common.highcharts.resetzoom" : "Återställ zoom",
		"apm.common.highcharts.resetzoomtitle" : "Återställ zoomnivå 1:1",
		"apm.common.label._95th" : "95:e",
		"apm.common.label._95thpercentile" : "95:e percentilen",
		"apm.common.label.all" : "Alla",
		"apm.common.label.asof" : "Från och med {0}",
		"apm.common.label.client" : "Kund",
		"apm.common.label.close" : "Stäng",
		"apm.common.label.companyid" : "Företags-ID",
		"apm.common.label.completed" : "Slutförd",
		"apm.common.label.concurrency" : "Samtidighet",
		"apm.common.label.concurrencycount" : "Samtidighetsantal",
		"apm.common.label.context" : "Kontext",
		"apm.common.label.csvimport" : "CSV-import",
		"apm.common.label.custom" : "Anpassat",
		"apm.common.label.customdaterange" : "Anpassat datumintervall",
		"apm.common.label.customerdebugsettings" : "Debug-inställningar för kund",
		"apm.common.label.dashboard" : "Instrumentpanel",
		"apm.common.label.daterange" : "Datumintervall",
		"apm.common.label.datetime" : "Datum och tid",
		"apm.common.label.deploymentname" : "Produktionssättningsnamn",
		"apm.common.label.edit" : "Redigera",
		"apm.common.label.elevatedpriority" : "Förhöjd prioritet",
		"apm.common.label.email" : "E-post",
		"apm.common.label.enddate" : "Slutdatum",
		"apm.common.label.enddatetime" : "Slutdatum/-tid",
		"apm.common.label.endtimerequired" : "Sluttid krävs",
		"apm.common.label.errorrate" : "Felfrekvens",
		"apm.common.label.exceededconcurrencycount" : "Överskred samtidighetsantal",
		"apm.common.label.executioncontext" : "Expedieringskontext",
		"apm.common.label.executiontime" : "Expedieringstid",
		"apm.common.label.exportcsv" : "Exportera - CSV",
		"apm.common.label.failed" : "Misslyckades",
		"apm.common.label.failedrequests" : "Misslyckade begäranden",
		"apm.common.label.filters" : "Filter",
		"apm.common.label.from" : "Från",
		"apm.common.label.histogram" : "Histogram",
		"apm.common.label.hr" : "tim",
		"apm.common.label.hrs" : "timmar",
		"apm.common.label.instancecount" : "Instansräknare",
		"apm.common.label.integration" : "Integrering",
		"apm.common.label.last12hours" : "Senaste 12 timmarna",
		"apm.common.label.last14days" : "Senaste 14 dagarna",
		"apm.common.label.last1hour" : "Senaste timmen",
		"apm.common.label.last24hours" : "Senaste 24 timmarna",
		"apm.common.label.last30days" : "Senaste 30 dagarna",
		"apm.common.label.last3days" : "Senaste 3 dagarna",
		"apm.common.label.last3hours" : "Senaste 3 timmarna",
		"apm.common.label.last6hours" : "Senaste 6 timmarna",
		"apm.common.label.last7days" : "Senaste 7 dagarna",
		"apm.common.label.loading" : "Laddar",
		"apm.common.label.mapreduce" : "Mappa/minska",
		"apm.common.label.median" : "Median",
		"apm.common.label.min" : "min",
		"apm.common.label.mins" : "minuter",
		"apm.common.label.mostusers" : "De flesta användare",
		"apm.common.label.name" : "Namn",
		"apm.common.label.network" : "Nätverk",
		"apm.common.label.new" : "Ny",
		"apm.common.label.nodataavailable" : "Ingen data tillgänglig",
		"apm.common.label.nodrilldowndata" : "Ingen vidaresökningsdata returnerad",
		"apm.common.label.none" : "Ingen",
		"apm.common.label.norecordstoshow" : "Inga poster att visa",
		"apm.common.label.notiledatavailable" : "Inga tillgängliga data för den här panelen",
		"apm.common.label.numberoflogs" : "Antal loggar",
		"apm.common.label.numberofusers" : "Antal användare",
		"apm.common.label.operation" : "Drift",
		"apm.common.label.overview" : "Översikt",
		"apm.common.label.pageinit" : "pageinit",
		"apm.common.label.percentage" : "Procent",
		"apm.common.label.queue" : "Kö",
		"apm.common.label.recordoperations" : "Postdrift",
		"apm.common.label.records" : "Poster",
		"apm.common.label.recordsperminute" : "Poster per minut",
		"apm.common.label.recordtype" : "Typ av post",
		"apm.common.label.rejectedaccountconcurrency" : "Avvisad kontosamtidighet",
		"apm.common.label.rejecteduserconcurrency" : "Avvisad användarsammanfattning",
		"apm.common.label.requests" : "Begäranden",
		"apm.common.label.responsetime" : "Svarstid",
		"apm.common.label.restlet" : "RESTlet",
		"apm.common.label.role" : "Roll",
		"apm.common.label.roles" : "Roller",
		"apm.common.label.save" : "Spara",
		"apm.common.label.scheduled" : "Schemalagd",
		"apm.common.label.scriptname" : "Skriptnamn",
		"apm.common.label.selectionaffectallportlets" : "Urval påverkar alla portlets",
		"apm.common.label.server" : "Server",
		"apm.common.label.setup" : "Konfigurera",
		"apm.common.label.sorting" : "Sortering",
		"apm.common.label.startdate" : "Startdatum",
		"apm.common.label.startdatetime" : "Startdatum och starttid",
		"apm.common.label.status" : "Status",
		"apm.common.label.timeline" : "Tidslinje",
		"apm.common.label.timeout" : "Tidsgränsen uppnåddes",
		"apm.common.label.timeoutrate" : "Hastighet för tidsgräns",
		"apm.common.label.to" : "Till",
		"apm.common.label.total" : "Totalt",
		"apm.common.label.totalrecords" : "Totala poster",
		"apm.common.label.totalrequests" : "Totalt antal begäranden",
		"apm.common.label.totaltime" : "Total tid",
		"apm.common.label.type" : "Typ",
		"apm.common.label.urlrequests" : "Webbadressbegäranden",
		"apm.common.label.user" : "ANVÄNDARE",
		"apm.common.label.userevent" : "Användarhändelse",
		"apm.common.label.users" : "Användare",
		"apm.common.label.view" : "Visa",
		"apm.common.label.viewdetails" : "Visa detaljer",
		"apm.common.label.viewfrhtdetails" : "Visa FRHT-information",
		"apm.common.label.viewing" : "Visar",
		"apm.common.label.waittime" : "Väntetid",
		"apm.common.label.webservice" : "Webbtjänst",
		"apm.common.month.april" : "April",
		"apm.common.month.august" : "Augusti",
		"apm.common.month.december" : "December",
		"apm.common.month.february" : "Februari",
		"apm.common.month.january" : "Januari",
		"apm.common.month.july" : "Juli",
		"apm.common.month.june" : "Juni",
		"apm.common.month.march" : "Mars",
		"apm.common.month.may" : "Maj",
		"apm.common.month.november" : "November",
		"apm.common.month.october" : "Oktober",
		"apm.common.month.september" : "September",
		"apm.common.priority.high" : "Hög",
		"apm.common.priority.low" : "Låg",
		"apm.common.priority.standard" : "Standard",
		"apm.common.shortmonth.april" : "Apr",
		"apm.common.shortmonth.august" : "Aug",
		"apm.common.shortmonth.december" : "Dec",
		"apm.common.shortmonth.february" : "Feb",
		"apm.common.shortmonth.january" : "Jan",
		"apm.common.shortmonth.july" : "Jul",
		"apm.common.shortmonth.june" : "Jun",
		"apm.common.shortmonth.march" : "Mar",
		"apm.common.shortmonth.may" : "Maj",
		"apm.common.shortmonth.november" : "Nov",
		"apm.common.shortmonth.october" : "Okt",
		"apm.common.shortmonth.september" : "Sep",
		"apm.common.shortweekday.friday" : "F",
		"apm.common.shortweekday.monday" : "M",
		"apm.common.shortweekday.saturday" : "S",
		"apm.common.shortweekday.sunday" : "S",
		"apm.common.shortweekday.thursday" : "T",
		"apm.common.shortweekday.tuesday" : "T",
		"apm.common.shortweekday.wednesday" : "O",
		"apm.common.time.am" : "FM",
		"apm.common.time.pm" : "EM",
		"apm.common.tooltip.percentfromtotal" : "% av total",
		"apm.common.weekday.friday" : "Fredag",
		"apm.common.weekday.monday" : "Måndag",
		"apm.common.weekday.saturday" : "Lördag",
		"apm.common.weekday.sunday" : "Söndag",
		"apm.common.weekday.thursday" : "Torsdag",
		"apm.common.weekday.tuesday" : "Tisdag",
		"apm.common.weekday.wednesday" : "Onsdag",
		"apm.db.alert.entervalidhistograminterval" : "Vänligen ange ett giltigt histogramintervall",
		"apm.db.alert.entervalidresponsetime" : "Vänligen ange en giltig svarstid",
		"apm.db.alert.operationrequired" : "Drift krävs",
		"apm.db.alert.recordtyperequired" : "Posttypen krävs",
		"apm.db.alert.starttimerequired" : "Starttid krävs",
		"apm.db.alert.watchlist10items" : "Du kan bara ha upp till 10 objekt i bevakningslistan.",
		"apm.db.label.adddatetime" : "Lägg till datum och tid",
		"apm.db.label.addwatchlist" : "Lägg till bevakningslista",
		"apm.db.label.chartpreferences" : "Diagraminställningar",
		"apm.db.label.customdatetime" : "Anpassat datum och tid",
		"apm.db.label.duplicaterecordtypeoperation" : "Dubblett av posttyp och drift",
		"apm.db.label.endtime" : "Sluttid",
		"apm.db.label.export" : "Exportera",
		"apm.db.label.general" : "Allmänt",
		"apm.db.label.highestresponsetime" : "Högsta svarstid",
		"apm.db.label.mostutilized" : "Mest utnyttjad",
		"apm.db.label.outof" : "{0} av {1}",
		"apm.db.label.recordinstance" : "Postinstans",
		"apm.db.label.recordinstances" : "Postinstanser",
		"apm.db.label.recordpages" : "Postsidor",
		"apm.db.label.recordtiles" : "Postpaneler",
		"apm.db.label.removeall" : "Ta bort alla",
		"apm.db.label.setuprecordpages" : "Ställ in postsidor",
		"apm.db.label.showallrecordtiles" : "Visa alla postpaneler",
		"apm.db.label.showwatchlistonly" : "Visa endast bevakningslista",
		"apm.db.label.starttime" : "Starttid",
		"apm.db.label.throughput" : "Genomströmning",
		"apm.db.label.unknown" : "Okänd",
		"apm.db.label.usereventworkflow" : "Användarhändelse och arbetsflöde",
		"apm.db.label.watchlist" : "Bevakningslista",
		"apm.db.responsetimechart.clientnetworkserver" : "Kund, nätverk och server",
		"apm.db.setup.interval" : "Intervall",
		"apm.ns.client.fieldchanged" : "fieldChanged",
		"apm.ns.client.lineinit" : "lineInit",
		"apm.ns.client.postsourcing" : "postSourcing",
		"apm.ns.client.recalc" : "recalc",
		"apm.ns.client.saverecord" : "saveRecord",
		"apm.ns.client.validatedelete" : "validateDelete",
		"apm.ns.client.validatefield" : "validateField",
		"apm.ns.client.validateinsert" : "validateInsert",
		"apm.ns.client.validateline" : "validateLine",
		"apm.ns.common.add" : "Lägg till",
		"apm.ns.context.backend" : "BACKEND",
		"apm.ns.context.customfielddefault" : "ANPASSAT FÄLT STANDARD",
		"apm.ns.context.emailalert" : "E-POSTAVISERING",
		"apm.ns.context.emailscheduled" : "E-POST SCHEMALAGD",
		"apm.ns.context.machine" : "MASKIN",
		"apm.ns.context.other" : "ANNAT",
		"apm.ns.context.reminder" : "PÅMINNELSE",
		"apm.ns.context.snapshot" : "ÖGONBLICKSBILD",
		"apm.ns.context.suitescript" : "SuiteScript",
		"apm.ns.context.website" : "WEBBPLATS",
		"apm.ns.context.workflow" : "Arbetsflöde",
		"apm.ns.status.finished" : "Slutfört",
		"apm.ns.triggertype.aftersubmit" : "aftersubmit",
		"apm.ns.triggertype.beforeload" : "beforeload",
		"apm.ns.triggertype.beforesubmit" : "beforesubmit",
		"apm.ns.wsa.delete" : "Radera",
		"apm.ns.wsa.update" : "Uppdatering",
		"apm.ptd.label.clientheader" : "Kund: Rubrik",
		"apm.ptd.label.clientinit" : "Kund: Init",
		"apm.ptd.label.clientrender" : "Kund: Rendering",
		"apm.ptd.label.deploymentid" : "Produktionssättnings-ID",
		"apm.ptd.label.page" : "Sida",
		"apm.ptd.label.pagetimedetails" : "Sidtidsinformation",
		"apm.ptd.label.script" : "Skript",
		"apm.ptd.label.scriptaftersubmit" : "Skript: aftersubmit: {0}",
		"apm.ptd.label.scriptbeforeload" : "Skript: beforeload: {0}",
		"apm.ptd.label.scriptbeforesubmit" : "Skript: beforesubmit: {0}",
		"apm.ptd.label.scriptpageinit" : "Skript: pageinit: {0}",
		"apm.ptd.label.scripttypeworkflow" : "Skripttyp/arbetsflöde",
		"apm.ptd.label.searches" : "Sökningar",
		"apm.ptd.label.suitescriptworkflowdetails" : "SuiteScript- och arbetsflödesinformation",
		"apm.ptd.label.time" : "Tid",
		"apm.ptd.label.usage" : "Användning",
		"apm.ptd.label.userevent" : "ANVÄNDARHÄNDELSE",
		"apm.pts.description._95thpercentile" : "Värdet (eller poängen) under vilken 95 procent av observationerna kan hittas",
		"apm.pts.description.average" : "Medeltalet av siffrorna",
		"apm.pts.description.median" : "Mellannumret (i en sorterad lista med siffror)",
		"apm.pts.description.standarddeviation" : "Måttet på hur utspridda siffror är",
		"apm.pts.label.aggregation" : "Aggregation",
		"apm.pts.label.and" : "Och",
		"apm.pts.label.between" : "Mellan",
		"apm.pts.label.bundle" : "Paket",
		"apm.pts.label.columnname" : "Kolumnnamn",
		"apm.pts.label.description" : "Beskrivning",
		"apm.pts.label.details" : "Uppgifter",
		"apm.pts.label.greaterthan" : "Större än",
		"apm.pts.label.lessthan" : "Mindre än",
		"apm.pts.label.meanaverage" : "Medelvärde/genomsnitt",
		"apm.pts.label.netsuitesystem" : "NetSuite-system",
		"apm.pts.label.pagetimesummary" : "Sidtidssammanställning",
		"apm.pts.label.performancelogs" : "Effektloggar",
		"apm.pts.label.responsetimeinseconds" : "Svarstid (i s)",
		"apm.pts.label.scriptworkflowtimebreakdown" : "Tidsnedbrytning för skript/arbetsflöde",
		"apm.pts.label.setupsummary" : "Konfigurationssammanfattning",
		"apm.pts.label.show" : "Visa",
		"apm.pts.label.standarddeviation" : "Standardavvikelse",
		"apm.pts.label.summary" : "Sammanfattning",
		"apm.scpm.alert.startdate30dayscurrentdate" : "Startdatumet får inte överstiga 30 dagar från det aktuella datumet.",
		"apm.scpm.label.available" : "Tillgänglig",
		"apm.scpm.label.availabletime" : "Tillgänglig tid",
		"apm.scpm.label.aveexecutiontime" : "Gnmsnitt körningstid",
		"apm.scpm.label.averagewaittime" : "Genomsnittlig väntetid",
		"apm.scpm.label.avewaittime" : "Gnmsnitt väntetid",
		"apm.scpm.label.cancelled" : "Avbruten",
		"apm.scpm.label.complete" : "Slutför",
		"apm.scpm.label.deferred" : "Uppskjuten",
		"apm.scpm.label.elevated" : "Förhöjd",
		"apm.scpm.label.elevationinterval" : "Förhöjningsintervall",
		"apm.scpm.label.jobs" : "Jobb",
		"apm.scpm.label.jobscompleted" : "Slutförda jobb",
		"apm.scpm.label.jobsfailed" : "Misslyckade jobb",
		"apm.scpm.label.jobstatus" : "Jobbstatus",
		"apm.scpm.label.noofreservedprocessors" : "Antal reserverade processorer.",
		"apm.scpm.label.original" : "Original",
		"apm.scpm.label.pending" : "Väntande",
		"apm.scpm.label.priority" : "Prioritet",
		"apm.scpm.label.priorityelevation" : "Upphöjning av prioritering",
		"apm.scpm.label.processing" : "Bearbetning",
		"apm.scpm.label.processorconcurrency" : "Processorsamtidighet",
		"apm.scpm.label.processorreservation" : "Processorreservering",
		"apm.scpm.label.processors" : "Processorer",
		"apm.scpm.label.processorsettings" : "Processorinställningar",
		"apm.scpm.label.processorutilization" : "Processorutnyttjande",
		"apm.scpm.label.queueprocessordetails" : "Kö/processorinformation",
		"apm.scpm.label.queues" : "Köer",
		"apm.scpm.label.reservedprocessorsinuse" : "Reserverade processorer som används",
		"apm.scpm.label.retry" : "Försök igen",
		"apm.scpm.label.reuseidleprocessors" : "Återanvänd inaktiva processorer",
		"apm.scpm.label.totalnoofprocessors" : "Totalt antal processorer",
		"apm.scpm.label.totalwaittime" : "Total väntetid",
		"apm.scpm.label.utilization" : "Utnyttjande",
		"apm.scpm.label.utilized" : "Utnyttjad",
		"apm.scpm.label.utilizedtime" : "Utnyttjad tid",
		"apm.scpm.label.waittimebypriority" : "Väntetid enligt prioritet",
		"apm.setup.label.apmsetup" : "APM-inställningar",
		"apm.setup.label.employee" : "Anställd",
		"apm.setup.label.employees" : "Anställda",
		"apm.setup.label.setuppermissionlabel" : "Ställ in behörighet för SuiteApp för hantering av applikationsprestanda",
		"apm.setup.top10mostutilized" : "Topp 10 mest utnyttjade",
		"apm.spa.label.highestexecutiontime" : "Högsta expedieringstid",
		"apm.spa.label.mostrequested" : "Mest begärd",
		"apm.spa.label.mosttimeouts" : "Flest pauser",
		"apm.spa.label.savedsearches" : "Sparade sökningar",
		"apm.spa.label.searchperformanceanalysis" : "Söka prestandaanalys",
		"apm.spd.alert.searchloadingwait" : "Dina sökningar laddas. Vänligen vänta.",
		"apm.spd.label.date" : "DATUM",
		"apm.spd.label.isfalse" : "falskt",
		"apm.spd.label.istrue" : "sant",
		"apm.spd.label.savedsearch" : "SPARAD SÖKNING",
		"apm.spd.label.savedsearchbycontext" : "Spara sökning enligt kontext",
		"apm.spd.label.savedsearchdetails" : "Information om sparad sökning",
		"apm.spd.label.savedsearchlogs" : "Sparad sökloggar",
		"apm.spd.label.searchperformancedetails" : "Sök prestandainformation",
		"apm.spjd.label.alldeployments" : "Alla produktionssättningar",
		"apm.spjd.label.alltasktypes" : "Alla uppgiftstyper",
		"apm.spjd.label.datecreated" : "Skapandedatum",
		"apm.spjd.label.deployment" : "Produktionssättning",
		"apm.spjd.label.jobdetails" : "Jobbinformation",
		"apm.spjd.label.jobdetailstimeline" : "Tidslinje för jobbinformation",
		"apm.spjd.label.mapreduceexecutiontime" : "Mappa/minska expedieringstid",
		"apm.spjd.label.mapreducestage" : "Mappa/minska steg",
		"apm.spjd.label.mapreducewaittime" : "Mappa/minska väntetid",
		"apm.spjd.label.originalpriority" : "Ursprunglig prioritet",
		"apm.spjd.label.scheduledexecutiontime" : "Schemalagd expedieringstid",
		"apm.spjd.label.scheduledwaittime" : "Schemalagd väntetid",
		"apm.spjd.label.suitecouldprocessorsjobdetails" : "SuiteCloud-processorer jobbinformation",
		"apm.spjd.label.taskid" : "Aktivitets-ID",
		"apm.spjd.label.tasktype" : "Aktivitetstyp",
		"apm.spm.label.suitecloudprocessormonitor" : "SuiteCloud-processorövervakare",
		"apm.ssa.alert.enterclienteventtype" : "Välj en kundhändelsetyp.",
		"apm.ssa.alert.enterscriptid" : "Ange ett skript-ID.",
		"apm.ssa.alert.enterscripttype" : "Välj en skripttyp.",
		"apm.ssa.alert.selectscriptname" : "Välj ett skriptnamn",
		"apm.ssa.label.clienteventtype" : "Klienthändelsetyp",
		"apm.ssa.label.errorcount" : "Antal fel",
		"apm.ssa.label.performancechart" : "Prestandadiagram",
		"apm.ssa.label.recordid" : "Post-ID",
		"apm.ssa.label.scriptid" : "Skript-ID",
		"apm.ssa.label.scripttype" : "Skripttyp",
		"apm.ssa.label.search" : "Sök",
		"apm.ssa.label.searchcalls" : "Sök samtal",
		"apm.ssa.label.suitelet" : "Suitelet",
		"apm.ssa.label.suitescriptanalysis" : "SuiteScript Analysis",
		"apm.ssa.label.suitescriptdetails" : "SuiteScript-information",
		"apm.ssa.label.suitescriptexecutionovertime" : "SuiteScript-expediering över tid",
		"apm.ssa.label.usagecount" : "Användningsräknare",
		"apm.ssa.label.usereventaftersubmit" : "Användarhändelse (efter sändning)",
		"apm.ssa.label.usereventbeforeload" : "Användarhändelse (före laddning)",
		"apm.ssa.label.usereventbeforesubmit" : "Användarhändelse (före skickande)",
		"apm.ssa.label.userinterface" : "Användargränssnitt",
		"apm.ssa.label.value" : "Värde",
		"apm.ssa.label.viewlogs" : "Visa loggar",
		"apm.ssa.label.webstore" : "Webbutik",
		"apm.wsa.apiversion.notreleased" : "Ej publicerad",
		"apm.wsa.apiversion.notsupported" : "Stöds ej",
		"apm.wsa.apiversion.supported" : "Stöds",
		"apm.wsa.apiversionusage.retired" : "Pensionerad",
		"apm.wsa.label.apiversionusage" : "API-versionsanvändning",
		"apm.wsa.label.executiontimeperrecordtype" : "Expedieringstid per posttyp",
		"apm.wsa.label.instancecountperrecordtype" : "Instansantal per posttyp",
		"apm.wsa.label.requestcount" : "Begärandeantal",
		"apm.wsa.label.statusbreakdown" : "Statusnedbrytning",
		"apm.wsa.label.topwebservicesoperations" : "Främsta webbtjänstdrift",
		"apm.wsa.label.topwebservicesrecordprocessing" : "Främsta behandling av webbtjänstposter",
		"apm.wsa.label.webservicesanalysis" : "Webbtjänstanalys",
		"apm.wsa.label.webservicesoperationstatus" : "Status för webbtjänstdrift",
		"apm.wsa.label.webservicesrecordprocessing" : "Behandling av webbtjänstposter",
		"apm.wsa.label.webservicesrecordprocessingstatus" : "Status för behandling av webbtjänstposter",
		"apm.wsod.label.performancedetails" : "Prestandainformation",
		"apm.wsod.label.timerange" : "Tidsintervall",
		"apm.wsod.label.toprecordsperformance" : "Främsta postprestanda",
		"apm.wsod.label.webservicesoperationdetails" : "Information om webbtjänstdrift",
		"apm.wsod.label.webservicesoperationlogs" : "Loggar för webbtjänstdrift",
		"apm.wsod.label.webservicesrecordprocessinglogs" : "Loggar för behandling av webbtjänstdrift",
		"apm.common.label.performance" : "Prestanda",

    	//NEW
		"apm.r2019a.profilerdetails": "Profiluppgifter",
		"apm.r2019a.viewprofilerdetails": "Visa profiluppgifter",
		"apm.r2019a.averageexecutiontime": "Genomsnittlig körtid",
		"apm.r2019a.medianexecutiontime": "Mediankörtid",
		"apm.r2019a.average": "Genomsnittlig",
		"apm.r2019a.important": "Viktigt",
		"apm.r2019a.concurrencynote1": "Den allmänna samtidighetsportleten behöver samtidighetsgränsen för att beräkna värdena.",
		"apm.r2019a.concurrencynote2": "När värdet på samtidighetsgränsen inte är tillgängligt (-) antar den allmänna samtidighetsportleten en generisk gräns, vilket kan leda till att opålitliga värden visas.",
		"apm.r2019a.profiler": "Profil",
		"apm.r2019a.timingdetails": "Tidsinformation",
		"apm.r2019a.datetime": "Datum och tid",
		"apm.r2019a.workflows": "Arbetsflöden",
		"apm.r2019a.recordsfromscriptsworkflows": "Poster från skript/arbetsflöden",
		"apm.r2019a.requesturls": "Begär webbadresser",
		"apm.r2019a.entrypoint": "Registreringspunkt",
		"apm.r2019a.triggertype": "Typ av utlösare",
		"apm.r2019a.method": "Metod",
		"apm.r2019a.webserviceoperation": "Webbtjänståtgärd",
		"apm.r2019a.apiversion": "API-version",
		"apm.r2019a.profileroperationid": "Profilens drifts-id",
		"apm.r2019a.starttimeanddate": "Starttid och -datum",
		"apm.r2019a.scripts": "Skript",
		"apm.r2019a.profilertype": "Profiltyp",
		"apm.r2019a.record": "Post",
		"apm.r2019a.requesturl": "Begär webbadress",
		"apm.r2019a.unclassified": "Oklassificerad",
		"apm.r2019a.url": "Webbadress",
		"apm.r2019a.apicalls": "Samtal",
		"apm.r2019a.profilerdetailsalert": "Profiluppgifter i APM kan inte visa information om kundskript för närvarande. Gå tillbaka och välj ett annat skript för att öppna profiluppgifter.",
		"apm.r2019a.top": "högst upp",
		"apm.r2019a.actionhistoryon": "{0} Åtgärdshistorik på {1} från {2}",
		"apm.r2019a.fromtopacifictime": "{0} från {1} till {2} (Stillahavstid)",
		"apm.r2019a.onpacifictime": "{0} på {1} kl. {2} (Stillahavstid)",
		"apm.r2019a.actions": "Åtgärder",
		"apm.r2019a.alldevices": "Alla enheter",
		"apm.r2019a.alllocations": "Alla platser",
		"apm.r2019a.allsubsidiaries": "Alla dotterbolag",
		"apm.r2019a.allusers": "Alla användare",
		"apm.r2019a.asofat": "Från och med {0} kl. {1}",
		"apm.r2019a.averageduration": "genomsnittlig varaktighet",
		"apm.r2019a.clickanddragtozoom": "Klicka och dra för att zooma",
		"apm.r2019a.moreinformation": "Klicka här för mer information",
		"apm.r2019a.clientscripturl": "Klientskript webbadress",
		"apm.r2019a.customcsurlrequests": "Begäran om webbadress till anpassat klientskript",
		"apm.r2019a.customizationaverage": "Anpassningsgenomsnitt",
		"apm.r2019a.lastupdatedon": "Anpassade data senast uppdaterade på {0} kl. {1}",
		"apm.r2019a.notavailable": "Anpassade data ej tillgängliga",
		"apm.r2019a.customizationperformance": "Anpassningsprestanda",
		"apm.r2019a.customizationtime": "Anpassningstid",
		"apm.r2019a.device": "Enhet",
		"apm.r2019a.devicelistisloading": "Enhetslistan laddas. Vänta.",
		"apm.r2019a.devicename": "Enhetsnamn",
		"apm.r2019a.devices": "Enheter",
		"apm.r2019a.enddatetime": "Slutdatum och -tid",
		"apm.r2019a.event": "Händelse",
		"apm.r2019a.executioncount": "Antal utföranden",
		"apm.r2019a.filter": "Filter",
		"apm.r2019a.instances": "Instanserna",
		"apm.r2019a.location": "Plats",
		"apm.r2019a.locationid": "Plats-id",
		"apm.r2019a.locationlistisloading": "Platslistan laddas. Vänta.",
		"apm.r2019a.locations": "Platser",
		"apm.r2019a.logid": "Logg-id",
		"apm.r2019a.mostfrequent": "Vanligast",
		"apm.r2019a.nonbundle": "Opaketerade",
		"apm.r2019a.nonbundledcomponents": "Opaketerade komponenter",
		"apm.r2019a.operations": "Operationer",
		"apm.r2019a.overheadtime": "Omkostnadstid",
		"apm.r2019a.pacifictime": "Stillahavstid",
		"apm.r2019a.performancedataprocessing": "Prestandauppgifter behandlas fortfarande. För att se fullständiga uppgifter: vänta på att värdena i användaråtgärdsskript- och arbetsflödeskolumnerna visas innan du klickar på den här ikonen.",
		"apm.r2019a.enteravalidtotalduration": "Ange en giltig total varaktighet",
		"apm.r2019a.enteravalidusereventtime": "Ange en giltig användaråtgärdstid",
		"apm.r2019a.enteravalidworkflowtime": "Ange en giltig arbetsflödestid",
		"apm.r2019a.scisappothers": "SCIS-app och andra",
		"apm.r2019a.scisbundle": "SCIS-paket",
		"apm.r2019a.servertime": "Servertid",
		"apm.r2019a.scispermissions": "Ställ in behörighet till SuiteCommerce InStore APM SuiteApp för roller.",
		"apm.r2019a.startdatetime": "Startdatum och -tid",
		"apm.r2019a.subsidiary": "Dotterbolag",
		"apm.r2019a.subsidiaryid": "Dotterbolags-id",
		"apm.r2019a.subsidiarylistisloading": "Dotterbolagslistan laddas. Vänta.",
		"apm.r2019a.scisactionhistorydetail": "SuiteCommerce InStore-historikuppgift",
		"apm.r2019a.scisperformancediagnostics": "SuiteCommerce InStore-prestandadiagnostik",
		"apm.r2019a.scisperformancesetup": "Inställning av SuiteCommerce InStore-prestandadiagnostik",
		"apm.r2019a.timebybundle": "Tid, per paket",
		"apm.r2019a.timesources": "Tidskällor",
		"apm.r2019a.total95th": "95:e totalt",
		"apm.r2019a.totalaverage": "Genomsnitt totalt",
		"apm.r2019a.totalduration": "Varaktighet totalt",
		"apm.r2019a.totaldurationandcustomizationperformance": "Varaktighet totalt och anpassningsprestanda över tid (Stillahavstid)",
		"apm.r2019a.totalmedian": "Median totalt",
		"apm.r2019a.uninstalledbundle": "Avinstallerade paket",
		"apm.r2019a.usereventscripts": "Skript för användarhändelser",
		"apm.r2019a.usereventtime": "Användarhändelsetid",
		"apm.r2019a.userlistisloading": "Användarlistan laddas. Vänta.",
		"apm.r2019a.valuesarestillprocessing": "Värden med ett streck (-) behandlas fortfarande. Vänta tills värdena visas innan du visar uppgifter.",
		"apm.r2019a.viewchart": "Visa diagram",
		"apm.r2019a.workflowname": "Arbetsflöde, namn",
		"apm.r2019a.workflowtime": "Arbetsflöde, tid",
		"apm.r2019a.youcannotopenthispage": "Du får inte öppna denna sida därför att Application Performance (APM) SuiteApp inte är installerad.Installera APM SuiteApp och försök igen.",
		"apm.r2019a.fieldhelp": "Fälthjälp",
		"apm.r2019a.whatsthis": "Vad är detta?",
		"apm.r2019a.daterangefieldhelp": "Välj en tidsperiod för att visa SCIS-prestandadata. Datumintervallet får omfatta högst 30 dagar.",
		"apm.r2019a.locationfieldhelp": "Välj en plats för att fokusera på prestandauppgifter som samlats in från en viss butik.",
		"apm.r2019a.subsidiaryfieldhelp": "Välj ett dotterbolag för att visa prestandauppgifter baserade på åtgärder i ett visst dotterbolag, eller alla dotterbolag.",
		"apm.r2019a.devicefieldhelp": "Visa prestandadata som hämtats från en viss enhet eller alla enheter som kör SCIS.",
		"apm.r2019a.employeefieldhelp": "Välj namnet på en anställd för att visa prestandauppgifter i samband med transaktioner som skickats in av en viss försäljningspartner.",
		"apm.r2019a.sortfieldhelp": "Du kan sortera åtgärdsrutorna efter Vanligast eller Längst utförandetid. Vanligast visar de åtgärder som uppträder oftast. Åtgärderna med längsta utförandetiden har den längsta totala varaktigheten."
    };

    return translation;
});