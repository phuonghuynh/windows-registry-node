var advApi = require('./adv_api'),
    assert = require('assert'),
    shell32 = require('./shell32'),
    types = require('../../lib/types');

module.exports = {
    Library: function (libFile, funcs) {
        var lib;
        switch (libFile) {
            case 'Advapi32':
                assert(funcs.RegOpenKeyExW.constructor === Array);
                if(funcs.RegOpenKeyExW[1][0].indirection === types.HKEY.indirection &&
                   funcs.RegOpenKeyExW[1][0].name === types.HKEY.name) {
                    // this is redefition for the library only specifying
                    // a different key type
                    lib = advApi;
                    break;
                }
                assert(funcs.RegQueryValueExW.constructor === Array);
                assert(funcs.RegCreateKeyExW.constructor === Array);
                assert(funcs.RegDeleteTreeW.constructor === Array);
                assert(funcs.RegCloseKey.constructor === Array);
                assert(funcs.RegSetValueExW.constructor === Array);
                assert(typeof funcs === 'object');
                lib = advApi;
                break;
            case 'Shell32':
                lib = shell32;
                break;
            default:
                throw 'Please add asserts for this new library file';
        }
        return lib;
    }
};
