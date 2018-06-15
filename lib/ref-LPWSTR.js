'use strict';
var ref = require('ref');

/**
 * This is a simple implementation of a zero-terminated UTF-16 string (Windows LPWSTR) for ref.
 *
 * There is an alternative implementation in the ref-wchar package, ref-wchar.string, but that uses
 * iconv for translation between Node's native UTF-8 and UTF-16, which is a large dependency, and does not
 * providing a UTF-16-from-string method that we need here either. This version uses Buffer's built-in utf16le
 * support.
 */
var LPWSTR = Object.create(ref.types.CString);
LPWSTR.name = 'LPWSTR';

var encoding = 'utf16le';

LPWSTR.toString = function toString(buffer) {
    // Strip trailing nul if present
    var length = buffer.length;
    if ((length > 2) && (buffer.readInt16LE(length - 2) === 0)) {
        length -= 2;
    }
    return buffer.toString(encoding, 0, length);
};

LPWSTR.fromString = function fromString(input) {
    if ((input !== null) && (typeof (input) !== 'undefined')) {
        return Buffer.from(input + '\0', encoding);
    }
    return null;
};

LPWSTR.get = function get(buf, offset) {
    var _buf = buf.readPointer(offset);
    if (_buf.isNull()) {
        return null;
    }
    var stringBuf = _buf.reinterpretUntilZeros(2);
    return LPWSTR.toString(stringBuf);
};

LPWSTR.set = function set(buf, offset, val) {
    var _buf = Buffer.isBuffer(val) ? val : LPWSTR.fromString(val);
    return buf.writePointer(_buf, offset);
};

module.exports = LPWSTR;
