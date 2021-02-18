/**
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/task'],

    function(task) {

        const scriptId = 'customscript_srs_mr_document_rec_updates';

        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        function onRequest(context) {

            var recId = context.request.parameters.recid;
            var newAudience = context.request.parameters.newaudience;

            var paramValues = {
                'custscript_template_id': recId,
                'custscript_doc_template_audience': newAudience
            };

            try {

                var taskObj = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: scriptId,
                    params: paramValues
                }).submit();

                var summary = task.checkStatus(taskObj);

                if (summary.status === 'COMPLETE') {

                    context.response.write('complete');
                }

            } catch (e) {

                log.error({title: 'Error Deploying Map/Reduce Script', details: e});

                context.response.write('failed');
            }
        }

        return {
            onRequest: onRequest
        };

    });
