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
		"apm.cd.button.back" : "Tilbake",
		"apm.cd.label.concurrencydetails" : "Tilfeldighetsdetaljer",
		"apm.cd.label.detailedconcurrency" : "Detaljert tilfeldighet",
		"apm.cd.label.exceededconcurrency" : "Overskredet tilfeldighet",
		"apm.cd.label.instancedetails" : "Forekomstdetaljer",
		"apm.cd.label.max" : "Maks – {0}",
		"apm.cd.label.sec" : "sek",
		"apm.cd.label.secs" : "sekunder",
		"apm.cd.label.viewrequests" : "Vis forespørsler",
		"apm.cd.label.webservices" : "Nettjenester",
		"apm.cm.label._101andabove" : "101 % og høyere",
		"apm.cm.label.concurrencylimit" : "Tilfeldighetsgrense",
		"apm.cm.label.concurrencymonitor" : "Tilfeldighetsovervåking",
		"apm.cm.label.concurrencyusage" : "Tilfeldighetsbruk",
		"apm.cm.label.generalconcurrency" : "Generell tilfeldighet",
		"apm.cm.label.highestexceededconcurrency" : "Høyeste overskredet tilfeldighet",
		"apm.cm.label.note" : "Merk",
		"apm.cm.label.peakconcurrency" : "Topp tilfeldighet",
		"apm.cm.label.percentvaluesareapproximate" : "Prosentverdier er omtrentlige.",
		"apm.cm.label.requestexceedinglimit" : "Forespørsler overskrider grense",
		"apm.cm.label.requestswithinlimit" : "Forespørsler innen grensen (%)",
		"apm.cm.label.totalexceededconcurrency" : "Total overskredet tilfeldighet",
		"apm.cm.label.valuesareexact" : "Verdier er eksakte.",
		"apm.common.alert.daterange._30days" : "Datointervall må ikke overstige 30 dager",
		"apm.common.alert.daterange._3days" : "Datointervall må ikke være under 3 dager",
		"apm.common.alert.enablefeatures" : "Funksjonene [Egendefinerte oppføring], [SuiteScript for klient] og [Server-SuiteScript] må være aktivert. Aktiver denne funksjonen og prøv igjen.",
		"apm.common.alert.endaterequired" : "Sluttdato er påkrevd",
		"apm.common.alert.entervalidenddate" : "Angi en gyldig dato.",
		"apm.common.alert.entervalidstartdate" : "Skriv inn en gyldig startdato.",
		"apm.common.alert.errorinsearch" : "Feil oppstått i søk",
		"apm.common.alert.errorinsuitelet" : "Feil oppstått i suitelet",
		"apm.common.alert.invalidenddate" : "Ugyldig sluttdato",
		"apm.common.alert.invalidstartdate" : "Ugyldig startdato",
		"apm.common.alert.nocontent" : "Ikke noe innhold",
		"apm.common.alert.startdateearlierthanenddate" : "Startdatoen må være tidligere enn sluttdatoen.",
		"apm.common.alert.startdaterequired" : "Startdato er påkrevd",
		"apm.common.button.cancel" : "Avbryt",
		"apm.common.button.done" : "Fullført",
		"apm.common.button.refresh" : "Oppdater",
		"apm.common.button.reset" : "Tilbakestill",
		"apm.common.button.set" : "Angi",
		"apm.common.highcharts.drilluptext" : "Tilbake til",
		"apm.common.highcharts.nodata" : "Ingen data å vise",
		"apm.common.highcharts.resetzoom" : "Tilbakestill zoom",
		"apm.common.highcharts.resetzoomtitle" : "Tilbakestill zoomnivå til 1:1",
		"apm.common.label._95th" : "95",
		"apm.common.label._95thpercentile" : "95. persentil",
		"apm.common.label.all" : "Alle",
		"apm.common.label.asof" : "Som av {0}",
		"apm.common.label.client" : "Kunde",
		"apm.common.label.close" : "Lukk",
		"apm.common.label.companyid" : "Selskaps-ID",
		"apm.common.label.completed" : "Fullført",
		"apm.common.label.concurrency" : "Tilfeldighet",
		"apm.common.label.concurrencycount" : "Tilfeldighetsantall",
		"apm.common.label.context" : "Kontekst",
		"apm.common.label.csvimport" : "CSV-import",
		"apm.common.label.custom" : "Egendefinert",
		"apm.common.label.customdaterange" : "Egendefinert datointervall",
		"apm.common.label.customerdebugsettings" : "Kundefeilinnstillinger",
		"apm.common.label.dashboard" : "Dashbord",
		"apm.common.label.daterange" : "Datointervall",
		"apm.common.label.datetime" : "Dato og klokkeslett",
		"apm.common.label.deploymentname" : "Navn på produksjonssetting",
		"apm.common.label.edit" : "Rediger",
		"apm.common.label.elevatedpriority" : "Forhøyet prioritet",
		"apm.common.label.email" : "E-post",
		"apm.common.label.enddate" : "Sluttdato",
		"apm.common.label.enddatetime" : "Sluttdato/-tid",
		"apm.common.label.endtimerequired" : "Sluttid er obligatorisk",
		"apm.common.label.errorrate" : "Feil pris",
		"apm.common.label.exceededconcurrencycount" : "Overskredet tilfeldighetsantall",
		"apm.common.label.executioncontext" : "Utføringskontekst",
		"apm.common.label.executiontime" : "Kjøretid",
		"apm.common.label.exportcsv" : "Eksport – CSV",
		"apm.common.label.failed" : "Mislykket",
		"apm.common.label.failedrequests" : "Mislykkede forespørsler",
		"apm.common.label.filters" : "Filtre",
		"apm.common.label.from" : "Fra",
		"apm.common.label.histogram" : "Histogram",
		"apm.common.label.hr" : "time",
		"apm.common.label.hrs" : "timer",
		"apm.common.label.instancecount" : "Forekomstantall",
		"apm.common.label.integration" : "Integrasjon",
		"apm.common.label.last12hours" : "Siste 12 timer",
		"apm.common.label.last14days" : "Siste 14 dager",
		"apm.common.label.last1hour" : "Siste 1 time",
		"apm.common.label.last24hours" : "Siste 24 timer",
		"apm.common.label.last30days" : "Siste 30 dager",
		"apm.common.label.last3days" : "Siste 3 dager",
		"apm.common.label.last3hours" : "Siste 3 timer",
		"apm.common.label.last6hours" : "Siste 6 timer",
		"apm.common.label.last7days" : "Siste 7 dager",
		"apm.common.label.loading" : "Laster inn",
		"apm.common.label.mapreduce" : "Kartlegg/reduser",
		"apm.common.label.median" : "Median",
		"apm.common.label.min" : "minutt",
		"apm.common.label.mins" : "minutter",
		"apm.common.label.mostusers" : "Flest brukere",
		"apm.common.label.name" : "Navn",
		"apm.common.label.network" : "Nettverk",
		"apm.common.label.new" : "Ny",
		"apm.common.label.nodataavailable" : "Ingen data tilgjengelig",
		"apm.common.label.nodrilldowndata" : "Ingen flere detaljer for data returnert",
		"apm.common.label.none" : "Ingen",
		"apm.common.label.norecordstoshow" : "Ingen oppføringer å vise",
		"apm.common.label.notiledatavailable" : "Ingen data tilgjengelig for denne flisen",
		"apm.common.label.numberoflogs" : "Antall logger",
		"apm.common.label.numberofusers" : "Antall brukere",
		"apm.common.label.operation" : "Drift",
		"apm.common.label.overview" : "Oversikt",
		"apm.common.label.pageinit" : "pageinit",
		"apm.common.label.percentage" : "Prosent",
		"apm.common.label.queue" : "Kø",
		"apm.common.label.recordoperations" : "Oppføringsoperasjoner",
		"apm.common.label.records" : "Oppføringer",
		"apm.common.label.recordsperminute" : "Oppføringer per minutt",
		"apm.common.label.recordtype" : "Oppføringstype",
		"apm.common.label.rejectedaccountconcurrency" : "Avvist kontotilfeldighet",
		"apm.common.label.rejecteduserconcurrency" : "Avvis brukertilfeldighet",
		"apm.common.label.requests" : "Forespørsler",
		"apm.common.label.responsetime" : "Responstid",
		"apm.common.label.restlet" : "RESTlet",
		"apm.common.label.role" : "Rolle",
		"apm.common.label.roles" : "Roller",
		"apm.common.label.save" : "Lagre",
		"apm.common.label.scheduled" : "Planlagt",
		"apm.common.label.scriptname" : "Skriptnavn",
		"apm.common.label.selectionaffectallportlets" : "Valg påvirker alle portleter",
		"apm.common.label.server" : "Server",
		"apm.common.label.setup" : "Oppsett",
		"apm.common.label.sorting" : "Sortering",
		"apm.common.label.startdate" : "Startdato",
		"apm.common.label.startdatetime" : "Startdato/-klokkeslett",
		"apm.common.label.status" : "Status",
		"apm.common.label.timeline" : "Tidslinje",
		"apm.common.label.timeout" : "Tidsavbrudd",
		"apm.common.label.timeoutrate" : "Tidsavbruddhastighet",
		"apm.common.label.to" : "Til",
		"apm.common.label.total" : "Totalt",
		"apm.common.label.totalrecords" : "Totalt antall oppføringer",
		"apm.common.label.totalrequests" : "Totalt antall forespørsler",
		"apm.common.label.totaltime" : "Totaltid",
		"apm.common.label.type" : "Type",
		"apm.common.label.urlrequests" : "Nettadresse-forespørsler",
		"apm.common.label.user" : "BRUKER",
		"apm.common.label.userevent" : "Brukerhendelse",
		"apm.common.label.users" : "Brukere",
		"apm.common.label.view" : "Vis",
		"apm.common.label.viewdetails" : "Vis detaljer",
		"apm.common.label.viewfrhtdetails" : "Vis FRHT-detaljer",
		"apm.common.label.viewing" : "Viser",
		"apm.common.label.waittime" : "Ventetid",
		"apm.common.label.webservice" : "Nettjeneste",
		"apm.common.month.april" : "april",
		"apm.common.month.august" : "august",
		"apm.common.month.december" : "desember",
		"apm.common.month.february" : "februar",
		"apm.common.month.january" : "januar",
		"apm.common.month.july" : "juli",
		"apm.common.month.june" : "juni",
		"apm.common.month.march" : "mars",
		"apm.common.month.may" : "mai",
		"apm.common.month.november" : "november",
		"apm.common.month.october" : "oktober",
		"apm.common.month.september" : "september",
		"apm.common.priority.high" : "Høy",
		"apm.common.priority.low" : "Lav",
		"apm.common.priority.standard" : "Standard",
		"apm.common.shortmonth.april" : "Apr",
		"apm.common.shortmonth.august" : "Aug",
		"apm.common.shortmonth.december" : "Des",
		"apm.common.shortmonth.february" : "Feb",
		"apm.common.shortmonth.january" : "Jan",
		"apm.common.shortmonth.july" : "Jul",
		"apm.common.shortmonth.june" : "Jun",
		"apm.common.shortmonth.march" : "Mar",
		"apm.common.shortmonth.may" : "Mai",
		"apm.common.shortmonth.november" : "Nov",
		"apm.common.shortmonth.october" : "Okt",
		"apm.common.shortmonth.september" : "Sep",
		"apm.common.shortweekday.friday" : "F",
		"apm.common.shortweekday.monday" : "M",
		"apm.common.shortweekday.saturday" : "L",
		"apm.common.shortweekday.sunday" : "L",
		"apm.common.shortweekday.thursday" : "T",
		"apm.common.shortweekday.tuesday" : "T",
		"apm.common.shortweekday.wednesday" : "O",
		"apm.common.time.am" : "AM",
		"apm.common.time.pm" : "PM",
		"apm.common.tooltip.percentfromtotal" : "% av total",
		"apm.common.weekday.friday" : "fredag",
		"apm.common.weekday.monday" : "mandag",
		"apm.common.weekday.saturday" : "lørdag",
		"apm.common.weekday.sunday" : "søndag",
		"apm.common.weekday.thursday" : "torsdag",
		"apm.common.weekday.tuesday" : "tirsdag",
		"apm.common.weekday.wednesday" : "onsdag",
		"apm.db.alert.entervalidhistograminterval" : "Skriv inn et gyldig histogramintervall",
		"apm.db.alert.entervalidresponsetime" : "Skriv inn en gyldig responstid",
		"apm.db.alert.operationrequired" : "Drift er obligatorisk",
		"apm.db.alert.recordtyperequired" : "Oppføringstype kreves",
		"apm.db.alert.starttimerequired" : "Starttid er obligatorisk",
		"apm.db.alert.watchlist10items" : "Du kan bare ha opptil 10 artikler i visningslisten.",
		"apm.db.label.adddatetime" : "Legg til dato og klokkeslett",
		"apm.db.label.addwatchlist" : "Legg til visningsliste",
		"apm.db.label.chartpreferences" : "Diagrampreferanser",
		"apm.db.label.customdatetime" : "Egendefinert dato og klokkeslett",
		"apm.db.label.duplicaterecordtypeoperation" : "Duplisert oppføringstype og drift",
		"apm.db.label.endtime" : "Sluttid",
		"apm.db.label.export" : "Eksport",
		"apm.db.label.general" : "Generell",
		"apm.db.label.highestresponsetime" : "Høyest responstid",
		"apm.db.label.mostutilized" : "Mest utnyttet",
		"apm.db.label.outof" : "{0} av {1}",
		"apm.db.label.recordinstance" : "Oppføringsforekomst",
		"apm.db.label.recordinstances" : "Oppføringsforekomster",
		"apm.db.label.recordpages" : "Oppføringssider",
		"apm.db.label.recordtiles" : "Oppføringsfliser",
		"apm.db.label.removeall" : "Fjern alle",
		"apm.db.label.setuprecordpages" : "Oppsett av oppføringssider",
		"apm.db.label.showallrecordtiles" : "Vis alle oppføringsfliser",
		"apm.db.label.showwatchlistonly" : "Vis kun visningsliste",
		"apm.db.label.starttime" : "Starttid",
		"apm.db.label.throughput" : "Gjennomstrømming",
		"apm.db.label.unknown" : "Ukjent",
		"apm.db.label.usereventworkflow" : "Brukerhendelse og arbeidsflyt",
		"apm.db.label.watchlist" : "Visningsliste",
		"apm.db.responsetimechart.clientnetworkserver" : "Klient, nettverk og server",
		"apm.db.setup.interval" : "Intervall",
		"apm.ns.client.fieldchanged" : "fieldChanged",
		"apm.ns.client.lineinit" : "lineInit",
		"apm.ns.client.postsourcing" : "postSourcing",
		"apm.ns.client.recalc" : "omberegn",
		"apm.ns.client.saverecord" : "saveRecord",
		"apm.ns.client.validatedelete" : "validateDelete",
		"apm.ns.client.validatefield" : "validateField",
		"apm.ns.client.validateinsert" : "validateInsert",
		"apm.ns.client.validateline" : "validateLine",
		"apm.ns.common.add" : "Legg til",
		"apm.ns.context.backend" : "BACKEND",
		"apm.ns.context.customfielddefault" : "EGENDEFINERT FELTSTANDARD",
		"apm.ns.context.emailalert" : "E-POSTVARSEL",
		"apm.ns.context.emailscheduled" : "E-POST PLANLAGT",
		"apm.ns.context.machine" : "MASKIN",
		"apm.ns.context.other" : "ANNET",
		"apm.ns.context.reminder" : "PÅMINNELSE",
		"apm.ns.context.snapshot" : "ØYEBLIKKSBILDE",
		"apm.ns.context.suitescript" : "SuiteScript",
		"apm.ns.context.website" : "NETTSTED",
		"apm.ns.context.workflow" : "Arbeidsflyt",
		"apm.ns.status.finished" : "Fullført",
		"apm.ns.triggertype.aftersubmit" : "aftersubmit",
		"apm.ns.triggertype.beforeload" : "beforeload",
		"apm.ns.triggertype.beforesubmit" : "beforesubmit",
		"apm.ns.wsa.delete" : "Slett",
		"apm.ns.wsa.update" : "Oppdater",
		"apm.ptd.label.clientheader" : "Kunde: Overskrift",
		"apm.ptd.label.clientinit" : "Kunde: Init",
		"apm.ptd.label.clientrender" : "Kunde: Gjengi",
		"apm.ptd.label.deploymentid" : "Produksjonssetting-ID",
		"apm.ptd.label.page" : "Side",
		"apm.ptd.label.pagetimedetails" : "Detaljer for sideklokkeslett",
		"apm.ptd.label.script" : "Skript",
		"apm.ptd.label.scriptaftersubmit" : "Skript: aftersubmit: {0}",
		"apm.ptd.label.scriptbeforeload" : "Skript: beforeload: {0}",
		"apm.ptd.label.scriptbeforesubmit" : "Skript: beforesubmit: {0}",
		"apm.ptd.label.scriptpageinit" : "Skript: pageinit: {0}",
		"apm.ptd.label.scripttypeworkflow" : "Skripttype/arbeidsflyt",
		"apm.ptd.label.searches" : "Søk",
		"apm.ptd.label.suitescriptworkflowdetails" : "SuiteScript og arbeidsflytdetaljer",
		"apm.ptd.label.time" : "Klokkeslett",
		"apm.ptd.label.usage" : "Bruk",
		"apm.ptd.label.userevent" : "BRUKERHENDELSE",
		"apm.pts.description._95thpercentile" : "Verdien (eller poengsummen) hvor under 95 prosent av observasjonene kan bli funnet",
		"apm.pts.description.average" : "Gjennomsnittet av tallene",
		"apm.pts.description.median" : "Mediantallet (i en sortert liste over tall)",
		"apm.pts.description.standarddeviation" : "Målet på hvor spredt tallene er",
		"apm.pts.label.aggregation" : "Aggregering",
		"apm.pts.label.and" : "og",
		"apm.pts.label.between" : "mellom",
		"apm.pts.label.bundle" : "Pakke",
		"apm.pts.label.columnname" : "Kolonnenavn",
		"apm.pts.label.description" : "Beskrivelse",
		"apm.pts.label.details" : "Detaljer",
		"apm.pts.label.greaterthan" : "Større enn",
		"apm.pts.label.lessthan" : "Mindre enn",
		"apm.pts.label.meanaverage" : "Gjennomsnitt/gjennomsnittlig",
		"apm.pts.label.netsuitesystem" : "NetSuite System",
		"apm.pts.label.pagetimesummary" : "Tidssammendrag for side",
		"apm.pts.label.performancelogs" : "Ytelseslogger",
		"apm.pts.label.responsetimeinseconds" : "Responstid (i s)",
		"apm.pts.label.scriptworkflowtimebreakdown" : "Tidssammendrag for skript/arbeidsflyt",
		"apm.pts.label.setupsummary" : "Oppsettssammendrag",
		"apm.pts.label.show" : "Vis",
		"apm.pts.label.standarddeviation" : "Standardavvik",
		"apm.pts.label.summary" : "Sammendrag",
		"apm.scpm.alert.startdate30dayscurrentdate" : "Startdato kan ikke overstige 30 dager fra gjeldende dato.",
		"apm.scpm.label.available" : "Tilgjengelig",
		"apm.scpm.label.availabletime" : "Tilgjengelig klokkeslett",
		"apm.scpm.label.aveexecutiontime" : "Gj.snittlig utføringstid",
		"apm.scpm.label.averagewaittime" : "Gjennomsnittlig ventetid",
		"apm.scpm.label.avewaittime" : "Gj.snittlig ventetid",
		"apm.scpm.label.cancelled" : "Avbrutt",
		"apm.scpm.label.complete" : "Fullført",
		"apm.scpm.label.deferred" : "Utsatt",
		"apm.scpm.label.elevated" : "Forhøyet",
		"apm.scpm.label.elevationinterval" : "Forhøyningsintervall",
		"apm.scpm.label.jobs" : "Oppgaver",
		"apm.scpm.label.jobscompleted" : "Oppgaver fullført",
		"apm.scpm.label.jobsfailed" : "Oppgaver mislykket",
		"apm.scpm.label.jobstatus" : "Oppgavestatus",
		"apm.scpm.label.noofreservedprocessors" : "Antall reserverte prosessorer",
		"apm.scpm.label.original" : "Original",
		"apm.scpm.label.pending" : "Venter",
		"apm.scpm.label.priority" : "Prioritet",
		"apm.scpm.label.priorityelevation" : "Prioritetsforhøyning",
		"apm.scpm.label.processing" : "Behandler",
		"apm.scpm.label.processorconcurrency" : "Prosessortilfeldighet",
		"apm.scpm.label.processorreservation" : "Prosessorreservasjon",
		"apm.scpm.label.processors" : "Prosessorer",
		"apm.scpm.label.processorsettings" : "Prosessorinnstillinger",
		"apm.scpm.label.processorutilization" : "Prosessorutnyttelse",
		"apm.scpm.label.queueprocessordetails" : "Kø/prosessordetaljer",
		"apm.scpm.label.queues" : "Køer",
		"apm.scpm.label.reservedprocessorsinuse" : "Reserverte prosessorer i bruk",
		"apm.scpm.label.retry" : "Prøv igjen",
		"apm.scpm.label.reuseidleprocessors" : "Gjenbruk uvirksomme prosessorer",
		"apm.scpm.label.totalnoofprocessors" : "Totalt antall prosessorer",
		"apm.scpm.label.totalwaittime" : "Total ventetid",
		"apm.scpm.label.utilization" : "Utnyttelse",
		"apm.scpm.label.utilized" : "Utnyttet",
		"apm.scpm.label.utilizedtime" : "Utnyttet tid",
		"apm.scpm.label.waittimebypriority" : "Ventetid etter prioritet",
		"apm.setup.label.apmsetup" : "APM-oppsett",
		"apm.setup.label.employee" : "Ansatt",
		"apm.setup.label.employees" : "Ansatte",
		"apm.setup.label.setuppermissionlabel" : "Konfigurer tillatelse til Application Performance Management SuiteApp",
		"apm.setup.top10mostutilized" : "Topp 10 mest utnyttede",
		"apm.spa.label.highestexecutiontime" : "Høyeste utføringstid",
		"apm.spa.label.mostrequested" : "Mest forespurt",
		"apm.spa.label.mosttimeouts" : "Flest tidsavbrudd",
		"apm.spa.label.savedsearches" : "Lagrede søk",
		"apm.spa.label.searchperformanceanalysis" : "Søk ytelsesanalyse",
		"apm.spd.alert.searchloadingwait" : "Dine søk laster inn. Vent.",
		"apm.spd.label.date" : "DATO",
		"apm.spd.label.isfalse" : "usann",
		"apm.spd.label.istrue" : "sann",
		"apm.spd.label.savedsearch" : "LAGRET SØK",
		"apm.spd.label.savedsearchbycontext" : "Lagret søk etter kontekst",
		"apm.spd.label.savedsearchdetails" : "Lagrede søkedetaljer",
		"apm.spd.label.savedsearchlogs" : "Lagrede søkelogger",
		"apm.spd.label.searchperformancedetails" : "Ytelsesdetaljer for søk",
		"apm.spjd.label.alldeployments" : "Alle produksjonssettinger",
		"apm.spjd.label.alltasktypes" : "Alle oppgavetyper",
		"apm.spjd.label.datecreated" : "Dato opprettet",
		"apm.spjd.label.deployment" : "Produksjonssetting",
		"apm.spjd.label.jobdetails" : "Oppgavedetaljer",
		"apm.spjd.label.jobdetailstimeline" : "Tidslinje for oppgavedetaljer",
		"apm.spjd.label.mapreduceexecutiontime" : "Kartlegg / reduser utførelsestid",
		"apm.spjd.label.mapreducestage" : "Kartlegg / reduser trinn",
		"apm.spjd.label.mapreducewaittime" : "Kartlegg / reduser ventetid",
		"apm.spjd.label.originalpriority" : "Opprinnelig prioritet",
		"apm.spjd.label.scheduledexecutiontime" : "Planlagt utførelsestid",
		"apm.spjd.label.scheduledwaittime" : "Planlagt ventetid",
		"apm.spjd.label.suitecouldprocessorsjobdetails" : "Oppgavedetaljer for SuiteCloud-prosessorer",
		"apm.spjd.label.taskid" : "Oppgave-ID",
		"apm.spjd.label.tasktype" : "Oppgavetype",
		"apm.spm.label.suitecloudprocessormonitor" : "Monitor for SuiteCloud-prosessorer",
		"apm.ssa.alert.enterclienteventtype" : "Velg en kundehendelsestype.",
		"apm.ssa.alert.enterscriptid" : "Skriv inn en skript-ID.",
		"apm.ssa.alert.enterscripttype" : "Velg en skripttype.",
		"apm.ssa.alert.selectscriptname" : "Velg et skriptnavn",
		"apm.ssa.label.clienteventtype" : "Klienthendelsestype",
		"apm.ssa.label.errorcount" : "Feilantall",
		"apm.ssa.label.performancechart" : "Ytelsesdiagram",
		"apm.ssa.label.recordid" : "Oppførings-ID",
		"apm.ssa.label.scriptid" : "Skript-ID",
		"apm.ssa.label.scripttype" : "Skripttype",
		"apm.ssa.label.search" : "Søk",
		"apm.ssa.label.searchcalls" : "Søk anrop",
		"apm.ssa.label.suitelet" : "Suitelet",
		"apm.ssa.label.suitescriptanalysis" : "SuiteScript-analyse",
		"apm.ssa.label.suitescriptdetails" : "SuiteScript-detaljer",
		"apm.ssa.label.suitescriptexecutionovertime" : "Utførelse på overtid for SuiteScript",
		"apm.ssa.label.usagecount" : "Bruksantall",
		"apm.ssa.label.usereventaftersubmit" : "Brukerhendelse (etter innsendelse)",
		"apm.ssa.label.usereventbeforeload" : "Brukerhendelse (før innlasting)",
		"apm.ssa.label.usereventbeforesubmit" : "Brukerhendelse (før innsendelse)",
		"apm.ssa.label.userinterface" : "Brukergrensesnitt",
		"apm.ssa.label.value" : "Verdi",
		"apm.ssa.label.viewlogs" : "Vis logger",
		"apm.ssa.label.webstore" : "Nettbutikk",
		"apm.wsa.apiversion.notreleased" : "Ikke utgitt",
		"apm.wsa.apiversion.notsupported" : "Støttes ikke",
		"apm.wsa.apiversion.supported" : "Støttet",
		"apm.wsa.apiversionusage.retired" : "Trukket tilbake",
		"apm.wsa.label.apiversionusage" : "API-versjonsbruk",
		"apm.wsa.label.executiontimeperrecordtype" : "Utførelsestid per oppføringstype",
		"apm.wsa.label.instancecountperrecordtype" : "Forekomstantall per oppføringstype",
		"apm.wsa.label.requestcount" : "Forespørselsantall",
		"apm.wsa.label.statusbreakdown" : "Statussammendrag",
		"apm.wsa.label.topwebservicesoperations" : "Topp nettjenesteoperasjoner",
		"apm.wsa.label.topwebservicesrecordprocessing" : "Topp nettjenesteoppføringer som behandles",
		"apm.wsa.label.webservicesanalysis" : "Nettjenesteanalyser",
		"apm.wsa.label.webservicesoperationstatus" : "Operasjonsstatus for nettjenester",
		"apm.wsa.label.webservicesrecordprocessing" : "Nettjenesteoppføringer behandles",
		"apm.wsa.label.webservicesrecordprocessingstatus" : "Behandlingsstatus for nettjenesteoppføringer",
		"apm.wsod.label.performancedetails" : "Ytelsesdetaljer",
		"apm.wsod.label.timerange" : "Tidsintervall",
		"apm.wsod.label.toprecordsperformance" : "Topp oppføringsytelse",
		"apm.wsod.label.webservicesoperationdetails" : "Detaljer for nettjenesteoperasjon",
		"apm.wsod.label.webservicesoperationlogs" : "Logger for nettjenesteoperasjon",
		"apm.wsod.label.webservicesrecordprocessinglogs" : "Behandlingslogger for nettjenesteoppføring",
		"apm.common.label.performance" : "Ytelse",

    	//NEW
        "apm.r2019a.profilerdetails": "Profildetaljer",
        "apm.r2019a.viewprofilerdetails": "Vis profildetaljer",
        "apm.r2019a.averageexecutiontime": "Gjennomsnittlig utførelsestid",
        "apm.r2019a.medianexecutiontime": "Median utførelsestid",
        "apm.r2019a.average": "Gjennomsnitt",
        "apm.r2019a.important": "Viktig",
        "apm.r2019a.concurrencynote1": "Portleten General Concurrency trenger tilfeldighetsgrensen for å beregne verdiene.",
        "apm.r2019a.concurrencynote2": "Når verdien av tilfeldighetsgrensen ikke er tilgjengelig (-), antar portleten General Concurrency en generisk grense, som kan føre til at den viser upålitelige verdier.",
        "apm.r2019a.profiler": "Profiler",
        "apm.r2019a.timingdetails": "Tidspunktdetaljer",
        "apm.r2019a.datetime": "Dato og tid",
        "apm.r2019a.workflows": "Arbeidsflyter",
        "apm.r2019a.recordsfromscriptsworkflows": "Oppføringer fra skripter/arbeidsflyter",
        "apm.r2019a.requesturls": "Forespør nettadresser",
        "apm.r2019a.entrypoint": "Oppføringspunkt",
        "apm.r2019a.triggertype": "Utløsertype",
        "apm.r2019a.method": "Metode",
        "apm.r2019a.webserviceoperation": "WebService-operasjon",
        "apm.r2019a.apiversion": "API-versjon",
        "apm.r2019a.profileroperationid": "Profiler Operajons-ID",
        "apm.r2019a.starttimeanddate": "Starttidspunkt og -dato",
        "apm.r2019a.scripts": "Skripter",
        "apm.r2019a.profilertype": "Profiltype",
        "apm.r2019a.record": "Oppføring",
        "apm.r2019a.requesturl": "Forespør nettadresse",
        "apm.r2019a.unclassified": "Uklassifisert",
        "apm.r2019a.url": "Nettadresse",
        "apm.r2019a.apicalls": "API-anrop",
        "apm.r2019a.profilerdetailsalert": "Profildetaljer i APM kan ikke vise informasjon om klientskript på dette tidspunktet. For å åpne Profildetaljer, gå tilbake og velg et annet skript.",
        "apm.r2019a.top": "topp",
        "apm.r2019a.actionhistoryon": "{0} Handlingshistorikk på {1} fra {2}",
        "apm.r2019a.fromtopacifictime": "{0} fra {1} til {2} (Stillehavstid)",
        "apm.r2019a.onpacifictime": "{0} på {1} kl. {2} (Stillehavstid)",
        "apm.r2019a.actions": "Handlinger",
        "apm.r2019a.alldevices": "Alle enheter",
        "apm.r2019a.alllocations": "Alle",
        "apm.r2019a.allsubsidiaries": "Alle datterselskaper/underavdelinger",
        "apm.r2019a.allusers": "Alle brukere",
        "apm.r2019a.asofat": "Den {0} kl. {1}",
        "apm.r2019a.averageduration": "gjennomsnittlig varighet",
        "apm.r2019a.clickanddragtozoom": "Klikk og dra for å zoome",
        "apm.r2019a.moreinformation": "Klikk her for mer informasjon",
        "apm.r2019a.clientscripturl": "Nettadresse for klientskript",
        "apm.r2019a.customcsurlrequests": "Nettadresseforespørsler om tilpasset klientskript",
        "apm.r2019a.customizationaverage": "Tilpasningsgjennomsnitt",
        "apm.r2019a.lastupdatedon": "Tilpasningsdata sist oppdatert den {0} kl. {1}",
        "apm.r2019a.notavailable": "Tilpasningsdata er ikke tilgjengelig",
        "apm.r2019a.customizationperformance": "Tilpasningsytelse",
        "apm.r2019a.customizationtime": "Tilpasningstid",
        "apm.r2019a.device": "Enhet",
        "apm.r2019a.devicelistisloading": "Enhetslisten lastes inn. Vent litt.",
        "apm.r2019a.devicename": "Enhetsnavn",
        "apm.r2019a.devices": "Enheter",
        "apm.r2019a.enddatetime": "Sluttdato og -tid",
        "apm.r2019a.event": "Hendelse",
        "apm.r2019a.executioncount": "Gjennomføringsantall",
        "apm.r2019a.filter": "Filter",
        "apm.r2019a.instances": "Forekomster",
        "apm.r2019a.location": "Plassering",
        "apm.r2019a.locationid": "Plasserings-ID",
        "apm.r2019a.locationlistisloading": "Plasseringslisten lastes inn. Vent litt.",
        "apm.r2019a.locations": "Plasseringer",
        "apm.r2019a.logid": "Logg-ID",
        "apm.r2019a.mostfrequent": "Hyppigste",
        "apm.r2019a.nonbundle": "Ikke-pakke",
        "apm.r2019a.nonbundledcomponents": "Ikke-pakkekomponenter",
        "apm.r2019a.operations": "Operasjoner",
        "apm.r2019a.overheadtime": "Administrasjonstid",
        "apm.r2019a.pacifictime": "Stillehavstid",
        "apm.r2019a.performancedataprocessing": "Resultatdata behandles fortsatt. For å se de komplette dataene, må du vente til verdiene i kolonnene Skripter for brukerhendelser og Arbeidsflyt vises, før du klikker på dette ikonet.",
        "apm.r2019a.enteravalidtotalduration": "Skriv inn en gyldig total varighet",
        "apm.r2019a.enteravalidusereventtime": "Angi en gyldig brukerhendelsestid",
        "apm.r2019a.enteravalidworkflowtime": "Angi en gyldig arbeidsflyttid",
        "apm.r2019a.scisappothers": "SCIS-app + andre",
        "apm.r2019a.scisbundle": "SCIS-pakke",
        "apm.r2019a.servertime": "Servertid",
        "apm.r2019a.scispermissions": "Angi SuiteCommerce InStore APM SuiteApp-tillatelser for roller.",
        "apm.r2019a.startdatetime": "Startdato og -tidspunkt",
        "apm.r2019a.subsidiary": "Datterselskap/underavdeling",
        "apm.r2019a.subsidiaryid": "Datterselskap/underavdeling-ID",
        "apm.r2019a.subsidiarylistisloading": "Datterselskap-/underavdelingslisten lastes inn. Vent litt.",
        "apm.r2019a.scisactionhistorydetail": "Detaljert handlingshistorikk for SuiteCommerce InStore",
        "apm.r2019a.scisperformancediagnostics": "Ytelsesdiagnostikk for SuiteCommerce InStore",
        "apm.r2019a.scisperformancesetup": "Ytelsesinnstilllinger for SuiteCommerce InStore",
        "apm.r2019a.timebybundle": "Tid etter pakke",
        "apm.r2019a.timesources": "Tidskilder",
        "apm.r2019a.total95th": "Totalt 95.",
        "apm.r2019a.totalaverage": "Totalt gjennomsnitt",
        "apm.r2019a.totalduration": "Total varighet",
        "apm.r2019a.totaldurationandcustomizationperformance": "Total varighet og tilpasningsytelse over tid (Stillehavstid)",
        "apm.r2019a.totalmedian": "Total median",
        "apm.r2019a.uninstalledbundle": "Avinstallert pakke",
        "apm.r2019a.usereventscripts": "Skripter for brukerhendelser",
        "apm.r2019a.usereventtime": "Brukerhendelsestid",
        "apm.r2019a.userlistisloading": "Brukerlisten lastes inn. Vent litt.",
        "apm.r2019a.valuesarestillprocessing": "Verdier med en tankestrek (–) behandles fortsatt. Vent til verdiene vises før du ser detaljer.",
        "apm.r2019a.viewchart": "Vis diagram",
        "apm.r2019a.workflowname": "Navn på arbeidsflyt",
        "apm.r2019a.workflowtime": "Arbeidsflyttid",
        "apm.r2019a.youcannotopenthispage": "Du kan ikke åpne denne siden fordi Application Performance (APM) SuiteApp ikke er installert. Installer APM SuiteApp, og prøv deretter på nytt.",
        "apm.r2019a.fieldhelp": "Felthjelp",
        "apm.r2019a.whatsthis": "Hva er dette?",
        "apm.r2019a.daterangefieldhelp": "Velg en periode for å se SCIS-ytelsesdata. Datointervallet kan ikke være mer enn 30 dager.",
        "apm.r2019a.locationfieldhelp": "Velg en plassering for å fokusere på ytelsesdata registrert fra en bestemt butikk.",
        "apm.r2019a.subsidiaryfieldhelp": "Velg et datterselskap / en underavdeling for å se resultatdata basert på handlinger som skjedde i et/en bestemt datterselskap/underavdeling, eller alle datterselskaper/underavdelinger.",
        "apm.r2019a.devicefieldhelp": "Se ytelsesdata som er fanget på en bestemt enhet eller på alle enheter som kjører SCIS.",
        "apm.r2019a.employeefieldhelp": "Velg et ansattnavn for å se resultatdata knyttet til transaksjoner som er sendt inn av en bestemt salgsmedarbeider.",
        "apm.r2019a.sortfieldhelp": "Du kan sortere handlingsfliser etter hyppigste og høyeste utførelsestid. Hyppigste viser handlingene som forekommer hyppigst. Handlingene med den lengste utførelsestiden har den lengste totale varighetstiden."
    };

    return translation;
});