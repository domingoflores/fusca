/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(['N/record', 'N/runtime', 'N/search'],

    function(record, runtime, search) {

        const FIELDS = {
            'newsDate'              : 'custrecord89',
            'finalNewsDate'         : 'custrecord_esn_final_news_date',
            'escrow'                : 'custrecord88',
            'majorSHnewsOld'        : 'custrecord90_old',
            'commonSHnewsOld'       : 'custrecordcom_sh_news_old',
            'sameAsMajorCheckbox'   : 'custrecordsameasmajor',
            'majorSHnewsNew'        : 'custrecord90',
            'commonSHnewsNew'       : 'custrecordcom_sh_news',
            'VIPmessage'            : 'custrecord_esn_vip_message'
        };



        /**
         * Marks the beginning of the Map/Reduce process and generates input data.
         */
        function getInputData() {

            log.audit({title: 'START', details: 'START OF RUN'});

            // add code here
            //var customrecord28SearchObj = 

            var mySearch =  search.create({
                type: "customrecord28",
                filters:
                [
                    //["internalid","anyof","15290"]
                ],
                columns:
                [
                    search.createColumn({name: "internalid", label: "Internal ID"}),
                    search.createColumn({
                        name: "scriptid",
                        sort: search.Sort.ASC,
                        label: "Script ID"
                    }),
                    search.createColumn({name: FIELDS.escrow, label: "Escrow"}),
                    search.createColumn({name: FIELDS.newsDate, label: "News Date"}),
                    search.createColumn({name: FIELDS.commonSHnewsNew, label: "Common Shareholder News Temp"}),
                    search.createColumn({name: FIELDS.commonSHnewsOld, label: "Common Shareholder News"}),
                    search.createColumn({name: FIELDS.majorSHnewsNew, label: "Major Shareholder News"}),
                    search.createColumn({name: FIELDS.majorSHnewsOld, label: "Major Shareholder News OLD"}),
                    search.createColumn({name: FIELDS.sameAsMajorCheckbox, label: "Same as Major news"}),
                        search.createColumn({ name: FIELDS.VIPmessage, label: "VIP Message" }),
                        search.createColumn({
                            name: "formuladate",
                            formula: "ADD_MONTHS({custrecord89}, 3)"
                        })
                ]
            });

            var searchResultCount = mySearch.runPaged().count;


            /*
                var searchResultCount = customrecord28SearchObj.runPaged().count;
                log.debug("customrecord28SearchObj result count",searchResultCount);
                customrecord28SearchObj.run().each(function(result){
                // .run().each has a limit of 4,000 results
                    return true;
                });
            */
            log.debug("search object: ", JSON.stringify(mySearch));
            log.debug("search object 2: ", searchResultCount);

            return mySearch;
        }

        /**
         * Executes when the map entry point is triggered and applies to each key/value pair.
         *
         * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
         * @since 2015.1
         */
        function map(context) {

            //log.debug("JSON.stringify(context)", JSON.stringify(context) );
            //log.debug("JSON.stringify(context.value)", JSON.parse(context.value.values) );

            var result = JSON.parse(context.value)
            //log.debug("JSON.stringify(result)", JSON.stringify(result) );

            result = result.values;
            //log.debug("JSON.stringify(result) --2", JSON.stringify(result) );
            //var recResult = result.values.custrecord88.value


            var myId = result.internalid.value;            // id = 14991
            var myEscrow = result.custrecord88.value; //result.getValue( FIELDS.escrow );
            var sameAsMajorCheckbox = result.custrecordsameasmajor;
            var majorSHnewsOld = result.custrecord90_old;
            var newsDate = result.custrecord89;
            var finalnewsDate = result.formuladate;
            log.debug( "myId",myId);
            log.debug( "myEscrow",myEscrow);
            log.debug( "sameAsMajorCheckbox",sameAsMajorCheckbox);
            log.debug( "majorSHnewsOld",majorSHnewsOld);

            // The substituted value will be contained in the result variable
            // replace <br> with " "
            var regex = /<br\s*[\/]?>/gim
            var subst = ' ';
            var cleanResult = majorSHnewsOld.replace(regex, subst); // <br> becomes " "
            var regex = /<.*?>/gm;
            var subst = ' ';
            cleanResult = cleanResult.replace(regex, subst); // any <tag> becomes ""
            var regex = /[^\x00-\x7F]/gmi;
            var subst = ' ';
            cleanResult = cleanResult.replace(regex, subst); // any non-ASCII char becomes ""
            cleanResult = cleanResult.replace("&nbsp;", "");
            cleanResult = cleanResult.replace("$ ", "$");
            cleanResult = cleanResult.replace("  ", " ");

            //var regex = /  +/gm;
            //var subst = ' ';
            //cleanResult = cleanResult.replace(regex, subst); // any "    " becomes " "
            //cleanResult = toString(cleanResult);

/*
            var objRecord = record.load({ 
                type: 'customrecord28', 
                id: myId,
                isDynamic: false
            });
                
            objRecord.setValue({ 
                fieldId: 'custrecord_major_shareholder_temp', 
                value: cleanResult, 
                ignoreFieldChange: true
            });
*/


            // new Major SH News cleaned
            record.submitFields({ 
                type: 'customrecord28', 
                id: myId,
                values: {
                    'custrecord90' : cleanResult
                },
                options: {
                    enableSourcing: false, 
                    ignoreMandatoryFields : true
                }
            });

            log.debug('custrecord_major_shareholder_temp = cleanResult TYPEOF='+typeof(cleanResult), cleanResult);      


            // VIP msg -- if escrow = "Shareholder Representative Services LLC (Corporate Record)"
            if (myEscrow == 591324){
                record.submitFields({ 
                    type: 'customrecord28', 
                    id: myId,
                    values: {
                        'custrecord_esn_vip_message': majorSHnewsOld
                    },
                    options: {
                        enableSourcing: false, 
                        ignoreMandatoryFields : true
                    } 
                });
                log.debug("VIP for "+myId)
            }

            // checkbox to copy "sameAsMajorCheckbox" cleaned Maj SH to Common SH 
            if (sameAsMajorCheckbox == 'T'){
                record.submitFields({
                    type: 'customrecord28', 
                    id: myId,
                    values: {
                        'custrecordcom_sh_news': cleanResult
                    },
                    options: {
                        enableSourcing: false, 
                        ignoreMandatoryFields : true
                    } 
                });
                log.debug("sameAsMajorCheckbox for "+myId)
            }



            // add Final Date
            try {
                record.submitFields({
                    type: 'customrecord28', 
                    id: myId,
                    values: {
                        'custrecord_esn_final_news_date': finalnewsDate
                    },
                    options: {
                        enableSourcing: false, 
                        ignoreMandatoryFields : true
                    } 
                });
            } catch(e){
                log.error('newsdate id='+myId);
            }




            /*
            var recordId = objRecord.save({
                enableSourcing: false,
                ignoreMandatoryFields: true 
            });
            */



            context.write({
                key: context.key,
                value: context.values
            });
        }






        /**
         * Executes when the summarize entry point is triggered and applies to the result set.
         *
         * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
         * @since 2015.1
         */
        function summarize(summary) {

            var mapKeys = [];
            summary.mapSummary.keys.iterator().each(function(key){
                mapKeys.push(key);
                return true;
            });

            // Log any errors that occurred
            summary.mapSummary.errors.iterator().each(function (key, error) {
                log.error({
                    title: 'Map Error for key: ' + key,
                    details: error
                });
            });

            log.debug('summarize','end');
        }

        return {
            getInputData: getInputData,
            map: map,
            summarize: summarize
        };

    });
