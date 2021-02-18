/**
 * @NApiVersion 2.x
 * @NModuleScope public
 * Library for Contact Record
 */

define(['N/search'],

    function (search) {

        function duplicateEmailSearch(email, contactID) {
            var filters = [];

            filters.push(search.createFilter({ name:'isinactive' ,operator:"is" ,values: "F" }));
            filters.push(search.createFilter({ name:'email' ,operator:"is" ,values: email }));

            if(contactID){
                filters.push(search.createFilter({ name:'internalid' ,operator:"noneof" ,values:[contactID] }));
            }

            var contactSearchObj = search.create({
                type: "contact",
                filters: filters
            });
            var searchResultCount = contactSearchObj.runPaged().count;
            log.debug("contactSearchObj result count", searchResultCount);
            return searchResultCount;
        }

        return {
            duplicateEmailSearch: duplicateEmailSearch
        };
    });