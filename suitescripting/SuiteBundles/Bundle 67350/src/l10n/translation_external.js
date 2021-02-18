/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * PSG SuiteSuccess Translation Module v.1.00.0
 * @NModuleScope Public
 */
define([
    'require'
], function (
    require
) {
    var _resourceFolder = './resources/'; // path of folder where <locale>.js files are located. path is relative to this module
                                         // and can be set to a different location
    var _namespaces = null;
    var _locales = null;

    var util = (function () {
        function isObjectWithProperty(value) {
            throwErrorWhenInvalidParameter();

            var ret = false;
            if(typeof(value) === 'object') {
                ret = !(value === null ||
                    value instanceof Array ||
                    value instanceof Date ||
                    value instanceof String ||
                    value instanceof Number ||
                    value instanceof Boolean);

                if(hasConstructor()) {
                    if (hasOwnKeys()) ret = true;
                    else ret = hasKeysInPrototype();
                }
                else ret = false;
            }

            return ret;

            function throwErrorWhenInvalidParameter() {
                if (value === undefined) throw new Error('value is required.');
            }

            function hasConstructor() {
                return ret && value.constructor;
            }

            function hasOwnKeys() {
                return Object.keys(value).length > 0;
            }

            function hasKeysInPrototype() {
                return Object.keys(value.constructor.prototype).length > 0;
            }
        }

        function isPlainObject(value) {
            throwErrorWhenInvalidParameter();

            var ret = false;
            if(typeof(value) === 'object') {
                ret = !(value === null ||
                    value instanceof Array ||
                    value instanceof Date ||
                    value instanceof String ||
                    value instanceof Number ||
                    value instanceof Boolean);

                if(hasConstructor() && !isConstructedFromObject()) ret = false;
            }

            return ret;

            function throwErrorWhenInvalidParameter() {
                if (value === undefined) throw new Error('value is required.');
            }

            function hasConstructor() {
                return ret && value.constructor;
            }

            function isConstructedFromObject() {
                return value.constructor === Object
            }
        }

        function isArray(value) {
            throwErrorWhenInvalidParameter();

            return Object.prototype.toString.call(value) === '[object Array]';

            function throwErrorWhenInvalidParameter() {
                if (value === undefined) throw new Error('value is required.');
            }
        }

        function convertDotDelimitedStringToObject(keyString) {
            throwErrorWhenInvalidParameter(arguments);

            var ret = {};
            var keyArr = keyString.split('.');
            var keyArrCopy = [].concat(keyArr);
            var firstKey = keyArrCopy[0];

            if(keyArr.length === 1) {
                if(firstKey === '*' || firstKey === '') ret = {};
                else ret[firstKey] = {};
            }
            else {
                keyArr.shift();
                ret[firstKey] = convertDotDelimitedStringToObject(keyArr.join('.'));
            }
            return ret;

            function throwErrorWhenInvalidParameter(arguments) {
                if (arguments.length === 0) throw new Error('keyString is required.');
                if (typeof(keyString) !== 'string') throw new Error('keyString must be a string.');
                var whitespaceRegex = /\s/;
                if (whitespaceRegex.test(keyString)) throw new Error('keyString must not have a whitespace.');
            }
        }

        function upsertDotDelimitedKeyOfObject(objectToUpdate, keyString, valueForKey) {
            throwErrorWhenInvalidParameter(arguments);

            var keyArr = keyString.split('.');
            var keyArrCopy = [].concat(keyArr);
            var firstKey = keyArrCopy[0];

            if(keyArr.length === 1) {
                objectToUpdate[firstKey] = valueForKey;
            }
            else {
                keyArr.shift();
                objectToUpdate[firstKey] = upsertDotDelimitedKeyOfObject(objectToUpdate[firstKey] || {},
                    keyArr.join('.'), valueForKey);
            }

            return objectToUpdate;

            function throwErrorWhenInvalidParameter(arguments) {
                if (arguments.length === 0) throw new Error('objectToUpdate is required.');
                if (!isPlainObject(objectToUpdate)) throw new Error('objectToUpdate must be an object.');
                if (arguments.length === 1) throw new Error('keyString is required.');
                if (typeof(keyString) !== 'string') throw new Error('keyString must be a string.');
                var whitespaceRegex = /\s/;
                if (whitespaceRegex.test(keyString)) throw new Error('keyString must not have a whitespace.');
                if (arguments.length === 2) throw new Error('valueForKey is required.');
            }
        }

        return {
            isObjectWithProperty: isObjectWithProperty,
            isPlainObject: isPlainObject,
            isArray: isArray,
            convertDotDelimitedStringToObject: convertDotDelimitedStringToObject,
            upsertDotDelimitedKeyOfObject: upsertDotDelimitedKeyOfObject
        };
    })();

    function load(options) {
        _throwErrorWhenInvalidParameter();

        _locales = options.locales;
        _namespaces = options.keys;

        // only support one locale for now
        var firstLocale = _locales[0];

        return _generateTextRepository(firstLocale);

        function _throwErrorWhenInvalidParameter() {
            if (_hasPromise()) throw new Error('Can be invoked from server scripts only.');
            if (!options) throw new Error('options is required.');
            if (!util.isObjectWithProperty(options)) throw new Error('options must be an object with a property.');
            if (!options.keys) throw new Error('options.keys is required.');
            if (!util.isArray(options.keys)) throw new Error('options.keys must be an array.');
            if (options.keys.length !== 1) throw new Error('options.keys must have one key.');
            if (!_isValidKey(options.keys[0])) throw new Error('options.keys must end with \'.*\'.');
            if (!options.locales) throw Error('options.locales is required.');
            if (!util.isArray(options.locales)) throw new Error('options.locales must be an array.');
            if (options.locales.length !== 1) throw new Error('options.locales must have one locale.');
        }
    }

    function _hasPromise() {
        var ret = true;
        try {
            new Promise(function () {});
        } catch (e) {
            ret = false;
        }

        return ret;
    }

    function _isValidKey(key) {
        return /\.\*$/.test(key) || key === '' || key === '*';
    }

    function _generateTextRepository(locale) {
        var namespaceObj = _parseResourceModuleAndInsertNamespace(_loadResourceViaServerSideRequire(locale));
        return new TextRepository(namespaceObj);
    }

    function _loadResourceViaServerSideRequire(locale) {
        var resourceObj = null;

        // require() is synchronous in server scripts
        require([_resourceFolder + locale], function (module) {
            resourceObj = module;
        });

        return resourceObj;
    }

    function _parseResourceModuleAndInsertNamespace(resourceObj) {
        var namespaceObj;

        // only one namespace is supported for now
        var firstNamespace = _namespaces[0];
        firstNamespace = _stripAsteriskKey(firstNamespace);
        namespaceObj = util.convertDotDelimitedStringToObject(firstNamespace);

        if(resourceObj) {
            var leafNode = _findLeafObject(namespaceObj);
            Object.keys(resourceObj).map(function (value) {
                leafNode = util.upsertDotDelimitedKeyOfObject(leafNode, value, resourceObj[value]);
            });
        }

        return namespaceObj;
    }

    function _stripAsteriskKey(namespaceString) {
        namespaceString = namespaceString.substring(0, namespaceString.length - 2);
        return namespaceString;
    }

    function _findLeafObject(parentObject) {
        var leafObject = null;

        var parentKeys = Object.keys(parentObject);
        if(parentKeys.length === 0) return parentObject;

        parentKeys.map(function (value) {
            var childObject = parentObject[value];
            if(util.isPlainObject(childObject)) {
                var childKeys = Object.keys(childObject);
                if(childKeys.length === 0) leafObject = childObject;
                else leafObject = _findLeafObject(childObject);
            }
        });

        return leafObject;
    }

    var TextRepository = (function () {
        function TextRepository(namespaceObj) {
            _throwErrorWhenInvalidParameter(arguments);

            var me = this;
            me._keyCount = 0;

            _traverseObjectAndConvertLeafKeysToFunction(namespaceObj);
            _attachConvertedObjectToThis(namespaceObj);

            function _throwErrorWhenInvalidParameter(textRepositoryArguments) {
                if (textRepositoryArguments.length === 0) throw new Error('namespaceObj is required.');
                if (!util.isPlainObject(namespaceObj)) throw new Error('namespaceObj must be a plain object.');
            }

            function _traverseObjectAndConvertLeafKeysToFunction(outputNamespaceObj) {
                Object.keys(outputNamespaceObj).map(function (value) {
                    var node = outputNamespaceObj[value];
                    if(util.isPlainObject(node))
                        _traverseObjectAndConvertLeafKeysToFunction.call(me, node);
                    else {
                        me._keyCount++;
                        outputNamespaceObj[value] = _convertLeafNodeToFunction(node);
                    }
                });
            }

            function _attachConvertedObjectToThis(outputNamespaceObj) {
                var arrMainKeys = Object.keys(outputNamespaceObj);
                for(var i in arrMainKeys) {
                    var key = arrMainKeys[i];
                    me[key] = outputNamespaceObj[key];
                }
            }
        }

        function _convertLeafNodeToFunction(actualString) {
            return _replaceString(actualString);
        }

        // this is the function set to the keys of the leaf objects
        function _replaceString(actualString) {
            return function getString(options) {
                _throwErrorWhenInvalidParameter();

                var displayString = actualString;

                if (_hasReplacementTag(actualString)) displayString = _formatString(actualString, options.params);

                return displayString;

                function _throwErrorWhenInvalidParameter() {
                    if (options && !util.isPlainObject(options)) throw new Error('options must be an object.');
                    if (options && !options.params) throw new Error('options.params is required.');
                    if (options && !util.isArray(options.params)) throw new Error('options.params must be an array.');
                }

                function _hasReplacementTag(inputString) {
                    var regex = /{\d+}/g;
                    return regex.test(inputString);
                }

                function _formatString(inputString, arguments) {
                    var outputString = inputString;
                    for (var i = 0; i < arguments.length; i++) {
                        var regex = new RegExp('{[' + i + ']}', 'g');
                        outputString = outputString.replace(regex, arguments[i]);
                    }

                    return outputString;
                }
            };
        }

        TextRepository.prototype.countKeys = function () {
            return this._keyCount;
        };

        return TextRepository;
    })();

    load.promise = function (options) {
        _throwErrorWhenInvalidParameter();

        return new Promise(function(resolve) {

            _locales = options.locales;
            _namespaces = options.keys;

            // only support one locale for now
            var firstLocale = _locales[0];

            try {
                // require() is asynchronous in client scripts
                require([_resourceFolder + firstLocale], function (resourceModule) {
                    resolve(new TextRepository(_parseResourceModuleAndInsertNamespace(resourceModule)));
                });
            } catch(e) {
                throw new Error(firstLocale + '.js is not found.');
            }
        });

        function _throwErrorWhenInvalidParameter() {
            if (!_hasPromise()) throw new Error('Can be invoked from client scripts only.');
            if (!options) throw new Error('options is required.');
            if (!util.isObjectWithProperty(options)) throw new Error('options must be an object with a property.');
            if (!options.keys) throw new Error('options.keys is required.');
            if (!util.isArray(options.keys)) throw new Error('options.keys must be an array.');
            if (options.keys.length !== 1) throw new Error('options.keys must have one key.');
            if (!_isValidKey(options.keys[0])) throw new Error('options.keys must end with \'.*\'.');
            if (!options.locales) throw new Error('options.locales is required.');
            if (!util.isArray(options.locales)) throw new Error('options.locales must be an array.');
            if (options.locales.length !== 1) throw new Error('options.locales must have one locale.');
        }
    };

    return {
        TextRepository: TextRepository,
        load: load,
        __util__: util
    };
});