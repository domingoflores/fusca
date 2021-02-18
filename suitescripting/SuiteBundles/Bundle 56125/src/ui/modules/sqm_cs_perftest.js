/**
 * Performance Testing Logger
 * 
 * Version  Date            Author          Remarks
 * 1.00     23 June 2014    jmarimla        Initial version
 * 2.00     08 Aug 2014     jmarimla        exposed stop time variables for performance automation
 * 
 * 
 */

Ext4.define('PSGP.SQM.PerfTestLogger', {
    extend : 'Ext4.Component',
    allowedIds : new Array(54130, 54129),
    isEnabled : true, // set to false to turn off performance test logs
    details : new Array(),
    initComponent : function(args) {
        this.callParent(args);
        this.isProduction = Ext4.Array.indexOf(this.allowedIds, nsBundleId) == -1;
    },
    start : function(event, details) {
        if ((this.isProduction)||(!this.isEnabled)) return;
        this.startTime = new Date().getTime();
        this.event = event;
        this.details = new Array();
        if (details) this.details = this.details.concat(details);
        this.runTime = 0;
    },
    stop : function() {
        if ((this.isProduction)||(!this.isEnabled)) return;
        this.stopTime = new Date().getTime();
        this.runTime = this.stopTime - this.startTime;
        console.info('==================perftestlogger===================');
        console.info(this.event.toUpperCase() + ' : ' + this.runTime + 'ms');
        for ( var detail in this.details) {
            console.info('\t' + this.details[detail]);
        }
        console.info('===================================================');
    },
    startAjax : function() {
        if ((this.isProduction)||(!this.isEnabled)) return;
        this.startTimeAjax = new Date().getTime();
    },
    stopAjax : function() {
        if ((this.isProduction)||(!this.isEnabled)) return;
        this.stopTimeAjax = new Date().getTime();
        var ajaxRuntime = this.stopTimeAjax - this.startTimeAjax;
        this.details.push('AJAX REQUEST: ' + ajaxRuntime + 'ms' );
    }
});

var perfTestLogger = Ext4.create('PSGP.SQM.PerfTestLogger');
perfTestLogger.start('main onload');

Ext4.Ajax.on('beforerequest', function (conn, response, options) {
    perfTestLogger.startAjax();
});

Ext4.Ajax.on('requestcomplete', function (conn, response, options) {
    perfTestLogger.stopAjax();
});

