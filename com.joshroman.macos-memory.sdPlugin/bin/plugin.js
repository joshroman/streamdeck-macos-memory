"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/ws/lib/constants.js
var require_constants = __commonJS({
  "node_modules/ws/lib/constants.js"(exports2, module2) {
    "use strict";
    var BINARY_TYPES = ["nodebuffer", "arraybuffer", "fragments"];
    var hasBlob = typeof Blob !== "undefined";
    if (hasBlob) BINARY_TYPES.push("blob");
    module2.exports = {
      BINARY_TYPES,
      EMPTY_BUFFER: Buffer.alloc(0),
      GUID: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
      hasBlob,
      kForOnEventAttribute: /* @__PURE__ */ Symbol("kIsForOnEventAttribute"),
      kListener: /* @__PURE__ */ Symbol("kListener"),
      kStatusCode: /* @__PURE__ */ Symbol("status-code"),
      kWebSocket: /* @__PURE__ */ Symbol("websocket"),
      NOOP: () => {
      }
    };
  }
});

// node_modules/ws/lib/buffer-util.js
var require_buffer_util = __commonJS({
  "node_modules/ws/lib/buffer-util.js"(exports2, module2) {
    "use strict";
    var { EMPTY_BUFFER } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    function concat(list, totalLength) {
      if (list.length === 0) return EMPTY_BUFFER;
      if (list.length === 1) return list[0];
      const target = Buffer.allocUnsafe(totalLength);
      let offset = 0;
      for (let i = 0; i < list.length; i++) {
        const buf = list[i];
        target.set(buf, offset);
        offset += buf.length;
      }
      if (offset < totalLength) {
        return new FastBuffer(target.buffer, target.byteOffset, offset);
      }
      return target;
    }
    function _mask(source, mask, output, offset, length) {
      for (let i = 0; i < length; i++) {
        output[offset + i] = source[i] ^ mask[i & 3];
      }
    }
    function _unmask(buffer, mask) {
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] ^= mask[i & 3];
      }
    }
    function toArrayBuffer(buf) {
      if (buf.length === buf.buffer.byteLength) {
        return buf.buffer;
      }
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
    }
    function toBuffer(data) {
      toBuffer.readOnly = true;
      if (Buffer.isBuffer(data)) return data;
      let buf;
      if (data instanceof ArrayBuffer) {
        buf = new FastBuffer(data);
      } else if (ArrayBuffer.isView(data)) {
        buf = new FastBuffer(data.buffer, data.byteOffset, data.byteLength);
      } else {
        buf = Buffer.from(data);
        toBuffer.readOnly = false;
      }
      return buf;
    }
    module2.exports = {
      concat,
      mask: _mask,
      toArrayBuffer,
      toBuffer,
      unmask: _unmask
    };
    if (!process.env.WS_NO_BUFFER_UTIL) {
      try {
        const bufferUtil = require("bufferutil");
        module2.exports.mask = function(source, mask, output, offset, length) {
          if (length < 48) _mask(source, mask, output, offset, length);
          else bufferUtil.mask(source, mask, output, offset, length);
        };
        module2.exports.unmask = function(buffer, mask) {
          if (buffer.length < 32) _unmask(buffer, mask);
          else bufferUtil.unmask(buffer, mask);
        };
      } catch (e) {
      }
    }
  }
});

// node_modules/ws/lib/limiter.js
var require_limiter = __commonJS({
  "node_modules/ws/lib/limiter.js"(exports2, module2) {
    "use strict";
    var kDone = /* @__PURE__ */ Symbol("kDone");
    var kRun = /* @__PURE__ */ Symbol("kRun");
    var Limiter = class {
      /**
       * Creates a new `Limiter`.
       *
       * @param {Number} [concurrency=Infinity] The maximum number of jobs allowed
       *     to run concurrently
       */
      constructor(concurrency) {
        this[kDone] = () => {
          this.pending--;
          this[kRun]();
        };
        this.concurrency = concurrency || Infinity;
        this.jobs = [];
        this.pending = 0;
      }
      /**
       * Adds a job to the queue.
       *
       * @param {Function} job The job to run
       * @public
       */
      add(job) {
        this.jobs.push(job);
        this[kRun]();
      }
      /**
       * Removes a job from the queue and runs it if possible.
       *
       * @private
       */
      [kRun]() {
        if (this.pending === this.concurrency) return;
        if (this.jobs.length) {
          const job = this.jobs.shift();
          this.pending++;
          job(this[kDone]);
        }
      }
    };
    module2.exports = Limiter;
  }
});

// node_modules/ws/lib/permessage-deflate.js
var require_permessage_deflate = __commonJS({
  "node_modules/ws/lib/permessage-deflate.js"(exports2, module2) {
    "use strict";
    var zlib = require("zlib");
    var bufferUtil = require_buffer_util();
    var Limiter = require_limiter();
    var { kStatusCode } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    var TRAILER = Buffer.from([0, 0, 255, 255]);
    var kPerMessageDeflate = /* @__PURE__ */ Symbol("permessage-deflate");
    var kTotalLength = /* @__PURE__ */ Symbol("total-length");
    var kCallback = /* @__PURE__ */ Symbol("callback");
    var kBuffers = /* @__PURE__ */ Symbol("buffers");
    var kError = /* @__PURE__ */ Symbol("error");
    var zlibLimiter;
    var PerMessageDeflate = class {
      /**
       * Creates a PerMessageDeflate instance.
       *
       * @param {Object} [options] Configuration options
       * @param {(Boolean|Number)} [options.clientMaxWindowBits] Advertise support
       *     for, or request, a custom client window size
       * @param {Boolean} [options.clientNoContextTakeover=false] Advertise/
       *     acknowledge disabling of client context takeover
       * @param {Number} [options.concurrencyLimit=10] The number of concurrent
       *     calls to zlib
       * @param {(Boolean|Number)} [options.serverMaxWindowBits] Request/confirm the
       *     use of a custom server window size
       * @param {Boolean} [options.serverNoContextTakeover=false] Request/accept
       *     disabling of server context takeover
       * @param {Number} [options.threshold=1024] Size (in bytes) below which
       *     messages should not be compressed if context takeover is disabled
       * @param {Object} [options.zlibDeflateOptions] Options to pass to zlib on
       *     deflate
       * @param {Object} [options.zlibInflateOptions] Options to pass to zlib on
       *     inflate
       * @param {Boolean} [isServer=false] Create the instance in either server or
       *     client mode
       * @param {Number} [maxPayload=0] The maximum allowed message length
       */
      constructor(options, isServer, maxPayload) {
        this._maxPayload = maxPayload | 0;
        this._options = options || {};
        this._threshold = this._options.threshold !== void 0 ? this._options.threshold : 1024;
        this._isServer = !!isServer;
        this._deflate = null;
        this._inflate = null;
        this.params = null;
        if (!zlibLimiter) {
          const concurrency = this._options.concurrencyLimit !== void 0 ? this._options.concurrencyLimit : 10;
          zlibLimiter = new Limiter(concurrency);
        }
      }
      /**
       * @type {String}
       */
      static get extensionName() {
        return "permessage-deflate";
      }
      /**
       * Create an extension negotiation offer.
       *
       * @return {Object} Extension parameters
       * @public
       */
      offer() {
        const params = {};
        if (this._options.serverNoContextTakeover) {
          params.server_no_context_takeover = true;
        }
        if (this._options.clientNoContextTakeover) {
          params.client_no_context_takeover = true;
        }
        if (this._options.serverMaxWindowBits) {
          params.server_max_window_bits = this._options.serverMaxWindowBits;
        }
        if (this._options.clientMaxWindowBits) {
          params.client_max_window_bits = this._options.clientMaxWindowBits;
        } else if (this._options.clientMaxWindowBits == null) {
          params.client_max_window_bits = true;
        }
        return params;
      }
      /**
       * Accept an extension negotiation offer/response.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Object} Accepted configuration
       * @public
       */
      accept(configurations) {
        configurations = this.normalizeParams(configurations);
        this.params = this._isServer ? this.acceptAsServer(configurations) : this.acceptAsClient(configurations);
        return this.params;
      }
      /**
       * Releases all resources used by the extension.
       *
       * @public
       */
      cleanup() {
        if (this._inflate) {
          this._inflate.close();
          this._inflate = null;
        }
        if (this._deflate) {
          const callback = this._deflate[kCallback];
          this._deflate.close();
          this._deflate = null;
          if (callback) {
            callback(
              new Error(
                "The deflate stream was closed while data was being processed"
              )
            );
          }
        }
      }
      /**
       *  Accept an extension negotiation offer.
       *
       * @param {Array} offers The extension negotiation offers
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsServer(offers) {
        const opts = this._options;
        const accepted = offers.find((params) => {
          if (opts.serverNoContextTakeover === false && params.server_no_context_takeover || params.server_max_window_bits && (opts.serverMaxWindowBits === false || typeof opts.serverMaxWindowBits === "number" && opts.serverMaxWindowBits > params.server_max_window_bits) || typeof opts.clientMaxWindowBits === "number" && !params.client_max_window_bits) {
            return false;
          }
          return true;
        });
        if (!accepted) {
          throw new Error("None of the extension offers can be accepted");
        }
        if (opts.serverNoContextTakeover) {
          accepted.server_no_context_takeover = true;
        }
        if (opts.clientNoContextTakeover) {
          accepted.client_no_context_takeover = true;
        }
        if (typeof opts.serverMaxWindowBits === "number") {
          accepted.server_max_window_bits = opts.serverMaxWindowBits;
        }
        if (typeof opts.clientMaxWindowBits === "number") {
          accepted.client_max_window_bits = opts.clientMaxWindowBits;
        } else if (accepted.client_max_window_bits === true || opts.clientMaxWindowBits === false) {
          delete accepted.client_max_window_bits;
        }
        return accepted;
      }
      /**
       * Accept the extension negotiation response.
       *
       * @param {Array} response The extension negotiation response
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsClient(response) {
        const params = response[0];
        if (this._options.clientNoContextTakeover === false && params.client_no_context_takeover) {
          throw new Error('Unexpected parameter "client_no_context_takeover"');
        }
        if (!params.client_max_window_bits) {
          if (typeof this._options.clientMaxWindowBits === "number") {
            params.client_max_window_bits = this._options.clientMaxWindowBits;
          }
        } else if (this._options.clientMaxWindowBits === false || typeof this._options.clientMaxWindowBits === "number" && params.client_max_window_bits > this._options.clientMaxWindowBits) {
          throw new Error(
            'Unexpected or invalid parameter "client_max_window_bits"'
          );
        }
        return params;
      }
      /**
       * Normalize parameters.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Array} The offers/response with normalized parameters
       * @private
       */
      normalizeParams(configurations) {
        configurations.forEach((params) => {
          Object.keys(params).forEach((key) => {
            let value = params[key];
            if (value.length > 1) {
              throw new Error(`Parameter "${key}" must have only a single value`);
            }
            value = value[0];
            if (key === "client_max_window_bits") {
              if (value !== true) {
                const num = +value;
                if (!Number.isInteger(num) || num < 8 || num > 15) {
                  throw new TypeError(
                    `Invalid value for parameter "${key}": ${value}`
                  );
                }
                value = num;
              } else if (!this._isServer) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else if (key === "server_max_window_bits") {
              const num = +value;
              if (!Number.isInteger(num) || num < 8 || num > 15) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
              value = num;
            } else if (key === "client_no_context_takeover" || key === "server_no_context_takeover") {
              if (value !== true) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else {
              throw new Error(`Unknown parameter "${key}"`);
            }
            params[key] = value;
          });
        });
        return configurations;
      }
      /**
       * Decompress data. Concurrency limited.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      decompress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._decompress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Compress data. Concurrency limited.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      compress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._compress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Decompress data.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _decompress(data, fin, callback) {
        const endpoint = this._isServer ? "client" : "server";
        if (!this._inflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._inflate = zlib.createInflateRaw({
            ...this._options.zlibInflateOptions,
            windowBits
          });
          this._inflate[kPerMessageDeflate] = this;
          this._inflate[kTotalLength] = 0;
          this._inflate[kBuffers] = [];
          this._inflate.on("error", inflateOnError);
          this._inflate.on("data", inflateOnData);
        }
        this._inflate[kCallback] = callback;
        this._inflate.write(data);
        if (fin) this._inflate.write(TRAILER);
        this._inflate.flush(() => {
          const err = this._inflate[kError];
          if (err) {
            this._inflate.close();
            this._inflate = null;
            callback(err);
            return;
          }
          const data2 = bufferUtil.concat(
            this._inflate[kBuffers],
            this._inflate[kTotalLength]
          );
          if (this._inflate._readableState.endEmitted) {
            this._inflate.close();
            this._inflate = null;
          } else {
            this._inflate[kTotalLength] = 0;
            this._inflate[kBuffers] = [];
            if (fin && this.params[`${endpoint}_no_context_takeover`]) {
              this._inflate.reset();
            }
          }
          callback(null, data2);
        });
      }
      /**
       * Compress data.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _compress(data, fin, callback) {
        const endpoint = this._isServer ? "server" : "client";
        if (!this._deflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._deflate = zlib.createDeflateRaw({
            ...this._options.zlibDeflateOptions,
            windowBits
          });
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          this._deflate.on("data", deflateOnData);
        }
        this._deflate[kCallback] = callback;
        this._deflate.write(data);
        this._deflate.flush(zlib.Z_SYNC_FLUSH, () => {
          if (!this._deflate) {
            return;
          }
          let data2 = bufferUtil.concat(
            this._deflate[kBuffers],
            this._deflate[kTotalLength]
          );
          if (fin) {
            data2 = new FastBuffer(data2.buffer, data2.byteOffset, data2.length - 4);
          }
          this._deflate[kCallback] = null;
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          if (fin && this.params[`${endpoint}_no_context_takeover`]) {
            this._deflate.reset();
          }
          callback(null, data2);
        });
      }
    };
    module2.exports = PerMessageDeflate;
    function deflateOnData(chunk) {
      this[kBuffers].push(chunk);
      this[kTotalLength] += chunk.length;
    }
    function inflateOnData(chunk) {
      this[kTotalLength] += chunk.length;
      if (this[kPerMessageDeflate]._maxPayload < 1 || this[kTotalLength] <= this[kPerMessageDeflate]._maxPayload) {
        this[kBuffers].push(chunk);
        return;
      }
      this[kError] = new RangeError("Max payload size exceeded");
      this[kError].code = "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH";
      this[kError][kStatusCode] = 1009;
      this.removeListener("data", inflateOnData);
      this.reset();
    }
    function inflateOnError(err) {
      this[kPerMessageDeflate]._inflate = null;
      if (this[kError]) {
        this[kCallback](this[kError]);
        return;
      }
      err[kStatusCode] = 1007;
      this[kCallback](err);
    }
  }
});

// node_modules/ws/lib/validation.js
var require_validation = __commonJS({
  "node_modules/ws/lib/validation.js"(exports2, module2) {
    "use strict";
    var { isUtf8 } = require("buffer");
    var { hasBlob } = require_constants();
    var tokenChars = [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 0 - 15
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 16 - 31
      0,
      1,
      0,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      1,
      1,
      0,
      1,
      1,
      0,
      // 32 - 47
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      // 48 - 63
      0,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 64 - 79
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      1,
      1,
      // 80 - 95
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 96 - 111
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      1,
      0,
      1,
      0
      // 112 - 127
    ];
    function isValidStatusCode(code) {
      return code >= 1e3 && code <= 1014 && code !== 1004 && code !== 1005 && code !== 1006 || code >= 3e3 && code <= 4999;
    }
    function _isValidUTF8(buf) {
      const len = buf.length;
      let i = 0;
      while (i < len) {
        if ((buf[i] & 128) === 0) {
          i++;
        } else if ((buf[i] & 224) === 192) {
          if (i + 1 === len || (buf[i + 1] & 192) !== 128 || (buf[i] & 254) === 192) {
            return false;
          }
          i += 2;
        } else if ((buf[i] & 240) === 224) {
          if (i + 2 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || buf[i] === 224 && (buf[i + 1] & 224) === 128 || // Overlong
          buf[i] === 237 && (buf[i + 1] & 224) === 160) {
            return false;
          }
          i += 3;
        } else if ((buf[i] & 248) === 240) {
          if (i + 3 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || (buf[i + 3] & 192) !== 128 || buf[i] === 240 && (buf[i + 1] & 240) === 128 || // Overlong
          buf[i] === 244 && buf[i + 1] > 143 || buf[i] > 244) {
            return false;
          }
          i += 4;
        } else {
          return false;
        }
      }
      return true;
    }
    function isBlob(value) {
      return hasBlob && typeof value === "object" && typeof value.arrayBuffer === "function" && typeof value.type === "string" && typeof value.stream === "function" && (value[Symbol.toStringTag] === "Blob" || value[Symbol.toStringTag] === "File");
    }
    module2.exports = {
      isBlob,
      isValidStatusCode,
      isValidUTF8: _isValidUTF8,
      tokenChars
    };
    if (isUtf8) {
      module2.exports.isValidUTF8 = function(buf) {
        return buf.length < 24 ? _isValidUTF8(buf) : isUtf8(buf);
      };
    } else if (!process.env.WS_NO_UTF_8_VALIDATE) {
      try {
        const isValidUTF8 = require("utf-8-validate");
        module2.exports.isValidUTF8 = function(buf) {
          return buf.length < 32 ? _isValidUTF8(buf) : isValidUTF8(buf);
        };
      } catch (e) {
      }
    }
  }
});

// node_modules/ws/lib/receiver.js
var require_receiver = __commonJS({
  "node_modules/ws/lib/receiver.js"(exports2, module2) {
    "use strict";
    var { Writable } = require("stream");
    var PerMessageDeflate = require_permessage_deflate();
    var {
      BINARY_TYPES,
      EMPTY_BUFFER,
      kStatusCode,
      kWebSocket
    } = require_constants();
    var { concat, toArrayBuffer, unmask } = require_buffer_util();
    var { isValidStatusCode, isValidUTF8 } = require_validation();
    var FastBuffer = Buffer[Symbol.species];
    var GET_INFO = 0;
    var GET_PAYLOAD_LENGTH_16 = 1;
    var GET_PAYLOAD_LENGTH_64 = 2;
    var GET_MASK = 3;
    var GET_DATA = 4;
    var INFLATING = 5;
    var DEFER_EVENT = 6;
    var Receiver2 = class extends Writable {
      /**
       * Creates a Receiver instance.
       *
       * @param {Object} [options] Options object
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {String} [options.binaryType=nodebuffer] The type for binary data
       * @param {Object} [options.extensions] An object containing the negotiated
       *     extensions
       * @param {Boolean} [options.isServer=false] Specifies whether to operate in
       *     client or server mode
       * @param {Number} [options.maxPayload=0] The maximum allowed message length
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       */
      constructor(options = {}) {
        super();
        this._allowSynchronousEvents = options.allowSynchronousEvents !== void 0 ? options.allowSynchronousEvents : true;
        this._binaryType = options.binaryType || BINARY_TYPES[0];
        this._extensions = options.extensions || {};
        this._isServer = !!options.isServer;
        this._maxPayload = options.maxPayload | 0;
        this._skipUTF8Validation = !!options.skipUTF8Validation;
        this[kWebSocket] = void 0;
        this._bufferedBytes = 0;
        this._buffers = [];
        this._compressed = false;
        this._payloadLength = 0;
        this._mask = void 0;
        this._fragmented = 0;
        this._masked = false;
        this._fin = false;
        this._opcode = 0;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._fragments = [];
        this._errored = false;
        this._loop = false;
        this._state = GET_INFO;
      }
      /**
       * Implements `Writable.prototype._write()`.
       *
       * @param {Buffer} chunk The chunk of data to write
       * @param {String} encoding The character encoding of `chunk`
       * @param {Function} cb Callback
       * @private
       */
      _write(chunk, encoding, cb) {
        if (this._opcode === 8 && this._state == GET_INFO) return cb();
        this._bufferedBytes += chunk.length;
        this._buffers.push(chunk);
        this.startLoop(cb);
      }
      /**
       * Consumes `n` bytes from the buffered data.
       *
       * @param {Number} n The number of bytes to consume
       * @return {Buffer} The consumed bytes
       * @private
       */
      consume(n) {
        this._bufferedBytes -= n;
        if (n === this._buffers[0].length) return this._buffers.shift();
        if (n < this._buffers[0].length) {
          const buf = this._buffers[0];
          this._buffers[0] = new FastBuffer(
            buf.buffer,
            buf.byteOffset + n,
            buf.length - n
          );
          return new FastBuffer(buf.buffer, buf.byteOffset, n);
        }
        const dst = Buffer.allocUnsafe(n);
        do {
          const buf = this._buffers[0];
          const offset = dst.length - n;
          if (n >= buf.length) {
            dst.set(this._buffers.shift(), offset);
          } else {
            dst.set(new Uint8Array(buf.buffer, buf.byteOffset, n), offset);
            this._buffers[0] = new FastBuffer(
              buf.buffer,
              buf.byteOffset + n,
              buf.length - n
            );
          }
          n -= buf.length;
        } while (n > 0);
        return dst;
      }
      /**
       * Starts the parsing loop.
       *
       * @param {Function} cb Callback
       * @private
       */
      startLoop(cb) {
        this._loop = true;
        do {
          switch (this._state) {
            case GET_INFO:
              this.getInfo(cb);
              break;
            case GET_PAYLOAD_LENGTH_16:
              this.getPayloadLength16(cb);
              break;
            case GET_PAYLOAD_LENGTH_64:
              this.getPayloadLength64(cb);
              break;
            case GET_MASK:
              this.getMask();
              break;
            case GET_DATA:
              this.getData(cb);
              break;
            case INFLATING:
            case DEFER_EVENT:
              this._loop = false;
              return;
          }
        } while (this._loop);
        if (!this._errored) cb();
      }
      /**
       * Reads the first two bytes of a frame.
       *
       * @param {Function} cb Callback
       * @private
       */
      getInfo(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        const buf = this.consume(2);
        if ((buf[0] & 48) !== 0) {
          const error = this.createError(
            RangeError,
            "RSV2 and RSV3 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_2_3"
          );
          cb(error);
          return;
        }
        const compressed = (buf[0] & 64) === 64;
        if (compressed && !this._extensions[PerMessageDeflate.extensionName]) {
          const error = this.createError(
            RangeError,
            "RSV1 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_1"
          );
          cb(error);
          return;
        }
        this._fin = (buf[0] & 128) === 128;
        this._opcode = buf[0] & 15;
        this._payloadLength = buf[1] & 127;
        if (this._opcode === 0) {
          if (compressed) {
            const error = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error);
            return;
          }
          if (!this._fragmented) {
            const error = this.createError(
              RangeError,
              "invalid opcode 0",
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error);
            return;
          }
          this._opcode = this._fragmented;
        } else if (this._opcode === 1 || this._opcode === 2) {
          if (this._fragmented) {
            const error = this.createError(
              RangeError,
              `invalid opcode ${this._opcode}`,
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error);
            return;
          }
          this._compressed = compressed;
        } else if (this._opcode > 7 && this._opcode < 11) {
          if (!this._fin) {
            const error = this.createError(
              RangeError,
              "FIN must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_FIN"
            );
            cb(error);
            return;
          }
          if (compressed) {
            const error = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error);
            return;
          }
          if (this._payloadLength > 125 || this._opcode === 8 && this._payloadLength === 1) {
            const error = this.createError(
              RangeError,
              `invalid payload length ${this._payloadLength}`,
              true,
              1002,
              "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH"
            );
            cb(error);
            return;
          }
        } else {
          const error = this.createError(
            RangeError,
            `invalid opcode ${this._opcode}`,
            true,
            1002,
            "WS_ERR_INVALID_OPCODE"
          );
          cb(error);
          return;
        }
        if (!this._fin && !this._fragmented) this._fragmented = this._opcode;
        this._masked = (buf[1] & 128) === 128;
        if (this._isServer) {
          if (!this._masked) {
            const error = this.createError(
              RangeError,
              "MASK must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_MASK"
            );
            cb(error);
            return;
          }
        } else if (this._masked) {
          const error = this.createError(
            RangeError,
            "MASK must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_MASK"
          );
          cb(error);
          return;
        }
        if (this._payloadLength === 126) this._state = GET_PAYLOAD_LENGTH_16;
        else if (this._payloadLength === 127) this._state = GET_PAYLOAD_LENGTH_64;
        else this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+16).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength16(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        this._payloadLength = this.consume(2).readUInt16BE(0);
        this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+64).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength64(cb) {
        if (this._bufferedBytes < 8) {
          this._loop = false;
          return;
        }
        const buf = this.consume(8);
        const num = buf.readUInt32BE(0);
        if (num > Math.pow(2, 53 - 32) - 1) {
          const error = this.createError(
            RangeError,
            "Unsupported WebSocket frame: payload length > 2^53 - 1",
            false,
            1009,
            "WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH"
          );
          cb(error);
          return;
        }
        this._payloadLength = num * Math.pow(2, 32) + buf.readUInt32BE(4);
        this.haveLength(cb);
      }
      /**
       * Payload length has been read.
       *
       * @param {Function} cb Callback
       * @private
       */
      haveLength(cb) {
        if (this._payloadLength && this._opcode < 8) {
          this._totalPayloadLength += this._payloadLength;
          if (this._totalPayloadLength > this._maxPayload && this._maxPayload > 0) {
            const error = this.createError(
              RangeError,
              "Max payload size exceeded",
              false,
              1009,
              "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
            );
            cb(error);
            return;
          }
        }
        if (this._masked) this._state = GET_MASK;
        else this._state = GET_DATA;
      }
      /**
       * Reads mask bytes.
       *
       * @private
       */
      getMask() {
        if (this._bufferedBytes < 4) {
          this._loop = false;
          return;
        }
        this._mask = this.consume(4);
        this._state = GET_DATA;
      }
      /**
       * Reads data bytes.
       *
       * @param {Function} cb Callback
       * @private
       */
      getData(cb) {
        let data = EMPTY_BUFFER;
        if (this._payloadLength) {
          if (this._bufferedBytes < this._payloadLength) {
            this._loop = false;
            return;
          }
          data = this.consume(this._payloadLength);
          if (this._masked && (this._mask[0] | this._mask[1] | this._mask[2] | this._mask[3]) !== 0) {
            unmask(data, this._mask);
          }
        }
        if (this._opcode > 7) {
          this.controlMessage(data, cb);
          return;
        }
        if (this._compressed) {
          this._state = INFLATING;
          this.decompress(data, cb);
          return;
        }
        if (data.length) {
          this._messageLength = this._totalPayloadLength;
          this._fragments.push(data);
        }
        this.dataMessage(cb);
      }
      /**
       * Decompresses data.
       *
       * @param {Buffer} data Compressed data
       * @param {Function} cb Callback
       * @private
       */
      decompress(data, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
        perMessageDeflate.decompress(data, this._fin, (err, buf) => {
          if (err) return cb(err);
          if (buf.length) {
            this._messageLength += buf.length;
            if (this._messageLength > this._maxPayload && this._maxPayload > 0) {
              const error = this.createError(
                RangeError,
                "Max payload size exceeded",
                false,
                1009,
                "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
              );
              cb(error);
              return;
            }
            this._fragments.push(buf);
          }
          this.dataMessage(cb);
          if (this._state === GET_INFO) this.startLoop(cb);
        });
      }
      /**
       * Handles a data message.
       *
       * @param {Function} cb Callback
       * @private
       */
      dataMessage(cb) {
        if (!this._fin) {
          this._state = GET_INFO;
          return;
        }
        const messageLength = this._messageLength;
        const fragments = this._fragments;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._fragmented = 0;
        this._fragments = [];
        if (this._opcode === 2) {
          let data;
          if (this._binaryType === "nodebuffer") {
            data = concat(fragments, messageLength);
          } else if (this._binaryType === "arraybuffer") {
            data = toArrayBuffer(concat(fragments, messageLength));
          } else if (this._binaryType === "blob") {
            data = new Blob(fragments);
          } else {
            data = fragments;
          }
          if (this._allowSynchronousEvents) {
            this.emit("message", data, true);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", data, true);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        } else {
          const buf = concat(fragments, messageLength);
          if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
            const error = this.createError(
              Error,
              "invalid UTF-8 sequence",
              true,
              1007,
              "WS_ERR_INVALID_UTF8"
            );
            cb(error);
            return;
          }
          if (this._state === INFLATING || this._allowSynchronousEvents) {
            this.emit("message", buf, false);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", buf, false);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        }
      }
      /**
       * Handles a control message.
       *
       * @param {Buffer} data Data to handle
       * @return {(Error|RangeError|undefined)} A possible error
       * @private
       */
      controlMessage(data, cb) {
        if (this._opcode === 8) {
          if (data.length === 0) {
            this._loop = false;
            this.emit("conclude", 1005, EMPTY_BUFFER);
            this.end();
          } else {
            const code = data.readUInt16BE(0);
            if (!isValidStatusCode(code)) {
              const error = this.createError(
                RangeError,
                `invalid status code ${code}`,
                true,
                1002,
                "WS_ERR_INVALID_CLOSE_CODE"
              );
              cb(error);
              return;
            }
            const buf = new FastBuffer(
              data.buffer,
              data.byteOffset + 2,
              data.length - 2
            );
            if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
              const error = this.createError(
                Error,
                "invalid UTF-8 sequence",
                true,
                1007,
                "WS_ERR_INVALID_UTF8"
              );
              cb(error);
              return;
            }
            this._loop = false;
            this.emit("conclude", code, buf);
            this.end();
          }
          this._state = GET_INFO;
          return;
        }
        if (this._allowSynchronousEvents) {
          this.emit(this._opcode === 9 ? "ping" : "pong", data);
          this._state = GET_INFO;
        } else {
          this._state = DEFER_EVENT;
          setImmediate(() => {
            this.emit(this._opcode === 9 ? "ping" : "pong", data);
            this._state = GET_INFO;
            this.startLoop(cb);
          });
        }
      }
      /**
       * Builds an error object.
       *
       * @param {function(new:Error|RangeError)} ErrorCtor The error constructor
       * @param {String} message The error message
       * @param {Boolean} prefix Specifies whether or not to add a default prefix to
       *     `message`
       * @param {Number} statusCode The status code
       * @param {String} errorCode The exposed error code
       * @return {(Error|RangeError)} The error
       * @private
       */
      createError(ErrorCtor, message, prefix, statusCode, errorCode) {
        this._loop = false;
        this._errored = true;
        const err = new ErrorCtor(
          prefix ? `Invalid WebSocket frame: ${message}` : message
        );
        Error.captureStackTrace(err, this.createError);
        err.code = errorCode;
        err[kStatusCode] = statusCode;
        return err;
      }
    };
    module2.exports = Receiver2;
  }
});

// node_modules/ws/lib/sender.js
var require_sender = __commonJS({
  "node_modules/ws/lib/sender.js"(exports2, module2) {
    "use strict";
    var { Duplex } = require("stream");
    var { randomFillSync } = require("crypto");
    var PerMessageDeflate = require_permessage_deflate();
    var { EMPTY_BUFFER, kWebSocket, NOOP } = require_constants();
    var { isBlob, isValidStatusCode } = require_validation();
    var { mask: applyMask, toBuffer } = require_buffer_util();
    var kByteLength = /* @__PURE__ */ Symbol("kByteLength");
    var maskBuffer = Buffer.alloc(4);
    var RANDOM_POOL_SIZE = 8 * 1024;
    var randomPool;
    var randomPoolPointer = RANDOM_POOL_SIZE;
    var DEFAULT = 0;
    var DEFLATING = 1;
    var GET_BLOB_DATA = 2;
    var Sender2 = class _Sender {
      /**
       * Creates a Sender instance.
       *
       * @param {Duplex} socket The connection socket
       * @param {Object} [extensions] An object containing the negotiated extensions
       * @param {Function} [generateMask] The function used to generate the masking
       *     key
       */
      constructor(socket, extensions, generateMask) {
        this._extensions = extensions || {};
        if (generateMask) {
          this._generateMask = generateMask;
          this._maskBuffer = Buffer.alloc(4);
        }
        this._socket = socket;
        this._firstFragment = true;
        this._compress = false;
        this._bufferedBytes = 0;
        this._queue = [];
        this._state = DEFAULT;
        this.onerror = NOOP;
        this[kWebSocket] = void 0;
      }
      /**
       * Frames a piece of data according to the HyBi WebSocket protocol.
       *
       * @param {(Buffer|String)} data The data to frame
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @return {(Buffer|String)[]} The framed data
       * @public
       */
      static frame(data, options) {
        let mask;
        let merge = false;
        let offset = 2;
        let skipMasking = false;
        if (options.mask) {
          mask = options.maskBuffer || maskBuffer;
          if (options.generateMask) {
            options.generateMask(mask);
          } else {
            if (randomPoolPointer === RANDOM_POOL_SIZE) {
              if (randomPool === void 0) {
                randomPool = Buffer.alloc(RANDOM_POOL_SIZE);
              }
              randomFillSync(randomPool, 0, RANDOM_POOL_SIZE);
              randomPoolPointer = 0;
            }
            mask[0] = randomPool[randomPoolPointer++];
            mask[1] = randomPool[randomPoolPointer++];
            mask[2] = randomPool[randomPoolPointer++];
            mask[3] = randomPool[randomPoolPointer++];
          }
          skipMasking = (mask[0] | mask[1] | mask[2] | mask[3]) === 0;
          offset = 6;
        }
        let dataLength;
        if (typeof data === "string") {
          if ((!options.mask || skipMasking) && options[kByteLength] !== void 0) {
            dataLength = options[kByteLength];
          } else {
            data = Buffer.from(data);
            dataLength = data.length;
          }
        } else {
          dataLength = data.length;
          merge = options.mask && options.readOnly && !skipMasking;
        }
        let payloadLength = dataLength;
        if (dataLength >= 65536) {
          offset += 8;
          payloadLength = 127;
        } else if (dataLength > 125) {
          offset += 2;
          payloadLength = 126;
        }
        const target = Buffer.allocUnsafe(merge ? dataLength + offset : offset);
        target[0] = options.fin ? options.opcode | 128 : options.opcode;
        if (options.rsv1) target[0] |= 64;
        target[1] = payloadLength;
        if (payloadLength === 126) {
          target.writeUInt16BE(dataLength, 2);
        } else if (payloadLength === 127) {
          target[2] = target[3] = 0;
          target.writeUIntBE(dataLength, 4, 6);
        }
        if (!options.mask) return [target, data];
        target[1] |= 128;
        target[offset - 4] = mask[0];
        target[offset - 3] = mask[1];
        target[offset - 2] = mask[2];
        target[offset - 1] = mask[3];
        if (skipMasking) return [target, data];
        if (merge) {
          applyMask(data, mask, target, offset, dataLength);
          return [target];
        }
        applyMask(data, mask, data, 0, dataLength);
        return [target, data];
      }
      /**
       * Sends a close message to the other peer.
       *
       * @param {Number} [code] The status code component of the body
       * @param {(String|Buffer)} [data] The message component of the body
       * @param {Boolean} [mask=false] Specifies whether or not to mask the message
       * @param {Function} [cb] Callback
       * @public
       */
      close(code, data, mask, cb) {
        let buf;
        if (code === void 0) {
          buf = EMPTY_BUFFER;
        } else if (typeof code !== "number" || !isValidStatusCode(code)) {
          throw new TypeError("First argument must be a valid error code number");
        } else if (data === void 0 || !data.length) {
          buf = Buffer.allocUnsafe(2);
          buf.writeUInt16BE(code, 0);
        } else {
          const length = Buffer.byteLength(data);
          if (length > 123) {
            throw new RangeError("The message must not be greater than 123 bytes");
          }
          buf = Buffer.allocUnsafe(2 + length);
          buf.writeUInt16BE(code, 0);
          if (typeof data === "string") {
            buf.write(data, 2);
          } else {
            buf.set(data, 2);
          }
        }
        const options = {
          [kByteLength]: buf.length,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 8,
          readOnly: false,
          rsv1: false
        };
        if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, buf, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(buf, options), cb);
        }
      }
      /**
       * Sends a ping message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      ping(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 9,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a pong message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      pong(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 10,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a data message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Object} options Options object
       * @param {Boolean} [options.binary=false] Specifies whether `data` is binary
       *     or text
       * @param {Boolean} [options.compress=false] Specifies whether or not to
       *     compress `data`
       * @param {Boolean} [options.fin=false] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Function} [cb] Callback
       * @public
       */
      send(data, options, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
        let opcode = options.binary ? 2 : 1;
        let rsv1 = options.compress;
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (this._firstFragment) {
          this._firstFragment = false;
          if (rsv1 && perMessageDeflate && perMessageDeflate.params[perMessageDeflate._isServer ? "server_no_context_takeover" : "client_no_context_takeover"]) {
            rsv1 = byteLength >= perMessageDeflate._threshold;
          }
          this._compress = rsv1;
        } else {
          rsv1 = false;
          opcode = 0;
        }
        if (options.fin) this._firstFragment = true;
        const opts = {
          [kByteLength]: byteLength,
          fin: options.fin,
          generateMask: this._generateMask,
          mask: options.mask,
          maskBuffer: this._maskBuffer,
          opcode,
          readOnly,
          rsv1
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, this._compress, opts, cb]);
          } else {
            this.getBlobData(data, this._compress, opts, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, this._compress, opts, cb]);
        } else {
          this.dispatch(data, this._compress, opts, cb);
        }
      }
      /**
       * Gets the contents of a blob as binary data.
       *
       * @param {Blob} blob The blob
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     the data
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      getBlobData(blob, compress, options, cb) {
        this._bufferedBytes += options[kByteLength];
        this._state = GET_BLOB_DATA;
        blob.arrayBuffer().then((arrayBuffer) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while the blob was being read"
            );
            process.nextTick(callCallbacks, this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          const data = toBuffer(arrayBuffer);
          if (!compress) {
            this._state = DEFAULT;
            this.sendFrame(_Sender.frame(data, options), cb);
            this.dequeue();
          } else {
            this.dispatch(data, compress, options, cb);
          }
        }).catch((err) => {
          process.nextTick(onError, this, err, cb);
        });
      }
      /**
       * Dispatches a message.
       *
       * @param {(Buffer|String)} data The message to send
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     `data`
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      dispatch(data, compress, options, cb) {
        if (!compress) {
          this.sendFrame(_Sender.frame(data, options), cb);
          return;
        }
        const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
        this._bufferedBytes += options[kByteLength];
        this._state = DEFLATING;
        perMessageDeflate.compress(data, options.fin, (_, buf) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while data was being compressed"
            );
            callCallbacks(this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          this._state = DEFAULT;
          options.readOnly = false;
          this.sendFrame(_Sender.frame(buf, options), cb);
          this.dequeue();
        });
      }
      /**
       * Executes queued send operations.
       *
       * @private
       */
      dequeue() {
        while (this._state === DEFAULT && this._queue.length) {
          const params = this._queue.shift();
          this._bufferedBytes -= params[3][kByteLength];
          Reflect.apply(params[0], this, params.slice(1));
        }
      }
      /**
       * Enqueues a send operation.
       *
       * @param {Array} params Send operation parameters.
       * @private
       */
      enqueue(params) {
        this._bufferedBytes += params[3][kByteLength];
        this._queue.push(params);
      }
      /**
       * Sends a frame.
       *
       * @param {(Buffer | String)[]} list The frame to send
       * @param {Function} [cb] Callback
       * @private
       */
      sendFrame(list, cb) {
        if (list.length === 2) {
          this._socket.cork();
          this._socket.write(list[0]);
          this._socket.write(list[1], cb);
          this._socket.uncork();
        } else {
          this._socket.write(list[0], cb);
        }
      }
    };
    module2.exports = Sender2;
    function callCallbacks(sender, err, cb) {
      if (typeof cb === "function") cb(err);
      for (let i = 0; i < sender._queue.length; i++) {
        const params = sender._queue[i];
        const callback = params[params.length - 1];
        if (typeof callback === "function") callback(err);
      }
    }
    function onError(sender, err, cb) {
      callCallbacks(sender, err, cb);
      sender.onerror(err);
    }
  }
});

// node_modules/ws/lib/event-target.js
var require_event_target = __commonJS({
  "node_modules/ws/lib/event-target.js"(exports2, module2) {
    "use strict";
    var { kForOnEventAttribute, kListener } = require_constants();
    var kCode = /* @__PURE__ */ Symbol("kCode");
    var kData = /* @__PURE__ */ Symbol("kData");
    var kError = /* @__PURE__ */ Symbol("kError");
    var kMessage = /* @__PURE__ */ Symbol("kMessage");
    var kReason = /* @__PURE__ */ Symbol("kReason");
    var kTarget = /* @__PURE__ */ Symbol("kTarget");
    var kType = /* @__PURE__ */ Symbol("kType");
    var kWasClean = /* @__PURE__ */ Symbol("kWasClean");
    var Event2 = class {
      /**
       * Create a new `Event`.
       *
       * @param {String} type The name of the event
       * @throws {TypeError} If the `type` argument is not specified
       */
      constructor(type) {
        this[kTarget] = null;
        this[kType] = type;
      }
      /**
       * @type {*}
       */
      get target() {
        return this[kTarget];
      }
      /**
       * @type {String}
       */
      get type() {
        return this[kType];
      }
    };
    Object.defineProperty(Event2.prototype, "target", { enumerable: true });
    Object.defineProperty(Event2.prototype, "type", { enumerable: true });
    var CloseEvent = class extends Event2 {
      /**
       * Create a new `CloseEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {Number} [options.code=0] The status code explaining why the
       *     connection was closed
       * @param {String} [options.reason=''] A human-readable string explaining why
       *     the connection was closed
       * @param {Boolean} [options.wasClean=false] Indicates whether or not the
       *     connection was cleanly closed
       */
      constructor(type, options = {}) {
        super(type);
        this[kCode] = options.code === void 0 ? 0 : options.code;
        this[kReason] = options.reason === void 0 ? "" : options.reason;
        this[kWasClean] = options.wasClean === void 0 ? false : options.wasClean;
      }
      /**
       * @type {Number}
       */
      get code() {
        return this[kCode];
      }
      /**
       * @type {String}
       */
      get reason() {
        return this[kReason];
      }
      /**
       * @type {Boolean}
       */
      get wasClean() {
        return this[kWasClean];
      }
    };
    Object.defineProperty(CloseEvent.prototype, "code", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "reason", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "wasClean", { enumerable: true });
    var ErrorEvent = class extends Event2 {
      /**
       * Create a new `ErrorEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.error=null] The error that generated this event
       * @param {String} [options.message=''] The error message
       */
      constructor(type, options = {}) {
        super(type);
        this[kError] = options.error === void 0 ? null : options.error;
        this[kMessage] = options.message === void 0 ? "" : options.message;
      }
      /**
       * @type {*}
       */
      get error() {
        return this[kError];
      }
      /**
       * @type {String}
       */
      get message() {
        return this[kMessage];
      }
    };
    Object.defineProperty(ErrorEvent.prototype, "error", { enumerable: true });
    Object.defineProperty(ErrorEvent.prototype, "message", { enumerable: true });
    var MessageEvent = class extends Event2 {
      /**
       * Create a new `MessageEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.data=null] The message content
       */
      constructor(type, options = {}) {
        super(type);
        this[kData] = options.data === void 0 ? null : options.data;
      }
      /**
       * @type {*}
       */
      get data() {
        return this[kData];
      }
    };
    Object.defineProperty(MessageEvent.prototype, "data", { enumerable: true });
    var EventTarget = {
      /**
       * Register an event listener.
       *
       * @param {String} type A string representing the event type to listen for
       * @param {(Function|Object)} handler The listener to add
       * @param {Object} [options] An options object specifies characteristics about
       *     the event listener
       * @param {Boolean} [options.once=false] A `Boolean` indicating that the
       *     listener should be invoked at most once after being added. If `true`,
       *     the listener would be automatically removed when invoked.
       * @public
       */
      addEventListener(type, handler, options = {}) {
        for (const listener of this.listeners(type)) {
          if (!options[kForOnEventAttribute] && listener[kListener] === handler && !listener[kForOnEventAttribute]) {
            return;
          }
        }
        let wrapper;
        if (type === "message") {
          wrapper = function onMessage(data, isBinary) {
            const event = new MessageEvent("message", {
              data: isBinary ? data : data.toString()
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "close") {
          wrapper = function onClose(code, message) {
            const event = new CloseEvent("close", {
              code,
              reason: message.toString(),
              wasClean: this._closeFrameReceived && this._closeFrameSent
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "error") {
          wrapper = function onError(error) {
            const event = new ErrorEvent("error", {
              error,
              message: error.message
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "open") {
          wrapper = function onOpen() {
            const event = new Event2("open");
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else {
          return;
        }
        wrapper[kForOnEventAttribute] = !!options[kForOnEventAttribute];
        wrapper[kListener] = handler;
        if (options.once) {
          this.once(type, wrapper);
        } else {
          this.on(type, wrapper);
        }
      },
      /**
       * Remove an event listener.
       *
       * @param {String} type A string representing the event type to remove
       * @param {(Function|Object)} handler The listener to remove
       * @public
       */
      removeEventListener(type, handler) {
        for (const listener of this.listeners(type)) {
          if (listener[kListener] === handler && !listener[kForOnEventAttribute]) {
            this.removeListener(type, listener);
            break;
          }
        }
      }
    };
    module2.exports = {
      CloseEvent,
      ErrorEvent,
      Event: Event2,
      EventTarget,
      MessageEvent
    };
    function callListener(listener, thisArg, event) {
      if (typeof listener === "object" && listener.handleEvent) {
        listener.handleEvent.call(listener, event);
      } else {
        listener.call(thisArg, event);
      }
    }
  }
});

// node_modules/ws/lib/extension.js
var require_extension = __commonJS({
  "node_modules/ws/lib/extension.js"(exports2, module2) {
    "use strict";
    var { tokenChars } = require_validation();
    function push(dest, name, elem) {
      if (dest[name] === void 0) dest[name] = [elem];
      else dest[name].push(elem);
    }
    function parse(header) {
      const offers = /* @__PURE__ */ Object.create(null);
      let params = /* @__PURE__ */ Object.create(null);
      let mustUnescape = false;
      let isEscaping = false;
      let inQuotes = false;
      let extensionName;
      let paramName;
      let start = -1;
      let code = -1;
      let end = -1;
      let i = 0;
      for (; i < header.length; i++) {
        code = header.charCodeAt(i);
        if (extensionName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (i !== 0 && (code === 32 || code === 9)) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            const name = header.slice(start, end);
            if (code === 44) {
              push(offers, name, params);
              params = /* @__PURE__ */ Object.create(null);
            } else {
              extensionName = name;
            }
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else if (paramName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (code === 32 || code === 9) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            push(params, header.slice(start, end), true);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            start = end = -1;
          } else if (code === 61 && start !== -1 && end === -1) {
            paramName = header.slice(start, i);
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else {
          if (isEscaping) {
            if (tokenChars[code] !== 1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (start === -1) start = i;
            else if (!mustUnescape) mustUnescape = true;
            isEscaping = false;
          } else if (inQuotes) {
            if (tokenChars[code] === 1) {
              if (start === -1) start = i;
            } else if (code === 34 && start !== -1) {
              inQuotes = false;
              end = i;
            } else if (code === 92) {
              isEscaping = true;
            } else {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
          } else if (code === 34 && header.charCodeAt(i - 1) === 61) {
            inQuotes = true;
          } else if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (start !== -1 && (code === 32 || code === 9)) {
            if (end === -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            let value = header.slice(start, end);
            if (mustUnescape) {
              value = value.replace(/\\/g, "");
              mustUnescape = false;
            }
            push(params, paramName, value);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            paramName = void 0;
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        }
      }
      if (start === -1 || inQuotes || code === 32 || code === 9) {
        throw new SyntaxError("Unexpected end of input");
      }
      if (end === -1) end = i;
      const token = header.slice(start, end);
      if (extensionName === void 0) {
        push(offers, token, params);
      } else {
        if (paramName === void 0) {
          push(params, token, true);
        } else if (mustUnescape) {
          push(params, paramName, token.replace(/\\/g, ""));
        } else {
          push(params, paramName, token);
        }
        push(offers, extensionName, params);
      }
      return offers;
    }
    function format(extensions) {
      return Object.keys(extensions).map((extension) => {
        let configurations = extensions[extension];
        if (!Array.isArray(configurations)) configurations = [configurations];
        return configurations.map((params) => {
          return [extension].concat(
            Object.keys(params).map((k) => {
              let values = params[k];
              if (!Array.isArray(values)) values = [values];
              return values.map((v) => v === true ? k : `${k}=${v}`).join("; ");
            })
          ).join("; ");
        }).join(", ");
      }).join(", ");
    }
    module2.exports = { format, parse };
  }
});

// node_modules/ws/lib/websocket.js
var require_websocket = __commonJS({
  "node_modules/ws/lib/websocket.js"(exports2, module2) {
    "use strict";
    var EventEmitter2 = require("events");
    var https = require("https");
    var http = require("http");
    var net = require("net");
    var tls = require("tls");
    var { randomBytes, createHash } = require("crypto");
    var { Duplex, Readable } = require("stream");
    var { URL: URL2 } = require("url");
    var PerMessageDeflate = require_permessage_deflate();
    var Receiver2 = require_receiver();
    var Sender2 = require_sender();
    var { isBlob } = require_validation();
    var {
      BINARY_TYPES,
      EMPTY_BUFFER,
      GUID,
      kForOnEventAttribute,
      kListener,
      kStatusCode,
      kWebSocket,
      NOOP
    } = require_constants();
    var {
      EventTarget: { addEventListener, removeEventListener }
    } = require_event_target();
    var { format, parse } = require_extension();
    var { toBuffer } = require_buffer_util();
    var closeTimeout = 30 * 1e3;
    var kAborted = /* @__PURE__ */ Symbol("kAborted");
    var protocolVersions = [8, 13];
    var readyStates = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"];
    var subprotocolRegex = /^[!#$%&'*+\-.0-9A-Z^_`|a-z~]+$/;
    var WebSocket2 = class _WebSocket extends EventEmitter2 {
      /**
       * Create a new `WebSocket`.
       *
       * @param {(String|URL)} address The URL to which to connect
       * @param {(String|String[])} [protocols] The subprotocols
       * @param {Object} [options] Connection options
       */
      constructor(address, protocols, options) {
        super();
        this._binaryType = BINARY_TYPES[0];
        this._closeCode = 1006;
        this._closeFrameReceived = false;
        this._closeFrameSent = false;
        this._closeMessage = EMPTY_BUFFER;
        this._closeTimer = null;
        this._errorEmitted = false;
        this._extensions = {};
        this._paused = false;
        this._protocol = "";
        this._readyState = _WebSocket.CONNECTING;
        this._receiver = null;
        this._sender = null;
        this._socket = null;
        if (address !== null) {
          this._bufferedAmount = 0;
          this._isServer = false;
          this._redirects = 0;
          if (protocols === void 0) {
            protocols = [];
          } else if (!Array.isArray(protocols)) {
            if (typeof protocols === "object" && protocols !== null) {
              options = protocols;
              protocols = [];
            } else {
              protocols = [protocols];
            }
          }
          initAsClient(this, address, protocols, options);
        } else {
          this._autoPong = options.autoPong;
          this._isServer = true;
        }
      }
      /**
       * For historical reasons, the custom "nodebuffer" type is used by the default
       * instead of "blob".
       *
       * @type {String}
       */
      get binaryType() {
        return this._binaryType;
      }
      set binaryType(type) {
        if (!BINARY_TYPES.includes(type)) return;
        this._binaryType = type;
        if (this._receiver) this._receiver._binaryType = type;
      }
      /**
       * @type {Number}
       */
      get bufferedAmount() {
        if (!this._socket) return this._bufferedAmount;
        return this._socket._writableState.length + this._sender._bufferedBytes;
      }
      /**
       * @type {String}
       */
      get extensions() {
        return Object.keys(this._extensions).join();
      }
      /**
       * @type {Boolean}
       */
      get isPaused() {
        return this._paused;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onclose() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onerror() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onopen() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onmessage() {
        return null;
      }
      /**
       * @type {String}
       */
      get protocol() {
        return this._protocol;
      }
      /**
       * @type {Number}
       */
      get readyState() {
        return this._readyState;
      }
      /**
       * @type {String}
       */
      get url() {
        return this._url;
      }
      /**
       * Set up the socket and the internal resources.
       *
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Object} options Options object
       * @param {Boolean} [options.allowSynchronousEvents=false] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Number} [options.maxPayload=0] The maximum allowed message size
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @private
       */
      setSocket(socket, head, options) {
        const receiver = new Receiver2({
          allowSynchronousEvents: options.allowSynchronousEvents,
          binaryType: this.binaryType,
          extensions: this._extensions,
          isServer: this._isServer,
          maxPayload: options.maxPayload,
          skipUTF8Validation: options.skipUTF8Validation
        });
        const sender = new Sender2(socket, this._extensions, options.generateMask);
        this._receiver = receiver;
        this._sender = sender;
        this._socket = socket;
        receiver[kWebSocket] = this;
        sender[kWebSocket] = this;
        socket[kWebSocket] = this;
        receiver.on("conclude", receiverOnConclude);
        receiver.on("drain", receiverOnDrain);
        receiver.on("error", receiverOnError);
        receiver.on("message", receiverOnMessage);
        receiver.on("ping", receiverOnPing);
        receiver.on("pong", receiverOnPong);
        sender.onerror = senderOnError;
        if (socket.setTimeout) socket.setTimeout(0);
        if (socket.setNoDelay) socket.setNoDelay();
        if (head.length > 0) socket.unshift(head);
        socket.on("close", socketOnClose);
        socket.on("data", socketOnData);
        socket.on("end", socketOnEnd);
        socket.on("error", socketOnError);
        this._readyState = _WebSocket.OPEN;
        this.emit("open");
      }
      /**
       * Emit the `'close'` event.
       *
       * @private
       */
      emitClose() {
        if (!this._socket) {
          this._readyState = _WebSocket.CLOSED;
          this.emit("close", this._closeCode, this._closeMessage);
          return;
        }
        if (this._extensions[PerMessageDeflate.extensionName]) {
          this._extensions[PerMessageDeflate.extensionName].cleanup();
        }
        this._receiver.removeAllListeners();
        this._readyState = _WebSocket.CLOSED;
        this.emit("close", this._closeCode, this._closeMessage);
      }
      /**
       * Start a closing handshake.
       *
       *          +----------+   +-----------+   +----------+
       *     - - -|ws.close()|-->|close frame|-->|ws.close()|- - -
       *    |     +----------+   +-----------+   +----------+     |
       *          +----------+   +-----------+         |
       * CLOSING  |ws.close()|<--|close frame|<--+-----+       CLOSING
       *          +----------+   +-----------+   |
       *    |           |                        |   +---+        |
       *                +------------------------+-->|fin| - - - -
       *    |         +---+                      |   +---+
       *     - - - - -|fin|<---------------------+
       *              +---+
       *
       * @param {Number} [code] Status code explaining why the connection is closing
       * @param {(String|Buffer)} [data] The reason why the connection is
       *     closing
       * @public
       */
      close(code, data) {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this.readyState === _WebSocket.CLOSING) {
          if (this._closeFrameSent && (this._closeFrameReceived || this._receiver._writableState.errorEmitted)) {
            this._socket.end();
          }
          return;
        }
        this._readyState = _WebSocket.CLOSING;
        this._sender.close(code, data, !this._isServer, (err) => {
          if (err) return;
          this._closeFrameSent = true;
          if (this._closeFrameReceived || this._receiver._writableState.errorEmitted) {
            this._socket.end();
          }
        });
        setCloseTimer(this);
      }
      /**
       * Pause the socket.
       *
       * @public
       */
      pause() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = true;
        this._socket.pause();
      }
      /**
       * Send a ping.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the ping is sent
       * @public
       */
      ping(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.ping(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Send a pong.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the pong is sent
       * @public
       */
      pong(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.pong(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Resume the socket.
       *
       * @public
       */
      resume() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = false;
        if (!this._receiver._writableState.needDrain) this._socket.resume();
      }
      /**
       * Send a data message.
       *
       * @param {*} data The message to send
       * @param {Object} [options] Options object
       * @param {Boolean} [options.binary] Specifies whether `data` is binary or
       *     text
       * @param {Boolean} [options.compress] Specifies whether or not to compress
       *     `data`
       * @param {Boolean} [options.fin=true] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when data is written out
       * @public
       */
      send(data, options, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof options === "function") {
          cb = options;
          options = {};
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        const opts = {
          binary: typeof data !== "string",
          mask: !this._isServer,
          compress: true,
          fin: true,
          ...options
        };
        if (!this._extensions[PerMessageDeflate.extensionName]) {
          opts.compress = false;
        }
        this._sender.send(data || EMPTY_BUFFER, opts, cb);
      }
      /**
       * Forcibly close the connection.
       *
       * @public
       */
      terminate() {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this._socket) {
          this._readyState = _WebSocket.CLOSING;
          this._socket.destroy();
        }
      }
    };
    Object.defineProperty(WebSocket2, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket2.prototype, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket2, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket2.prototype, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket2, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket2.prototype, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket2, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    Object.defineProperty(WebSocket2.prototype, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    [
      "binaryType",
      "bufferedAmount",
      "extensions",
      "isPaused",
      "protocol",
      "readyState",
      "url"
    ].forEach((property) => {
      Object.defineProperty(WebSocket2.prototype, property, { enumerable: true });
    });
    ["open", "error", "close", "message"].forEach((method) => {
      Object.defineProperty(WebSocket2.prototype, `on${method}`, {
        enumerable: true,
        get() {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) return listener[kListener];
          }
          return null;
        },
        set(handler) {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) {
              this.removeListener(method, listener);
              break;
            }
          }
          if (typeof handler !== "function") return;
          this.addEventListener(method, handler, {
            [kForOnEventAttribute]: true
          });
        }
      });
    });
    WebSocket2.prototype.addEventListener = addEventListener;
    WebSocket2.prototype.removeEventListener = removeEventListener;
    module2.exports = WebSocket2;
    function initAsClient(websocket, address, protocols, options) {
      const opts = {
        allowSynchronousEvents: true,
        autoPong: true,
        protocolVersion: protocolVersions[1],
        maxPayload: 100 * 1024 * 1024,
        skipUTF8Validation: false,
        perMessageDeflate: true,
        followRedirects: false,
        maxRedirects: 10,
        ...options,
        socketPath: void 0,
        hostname: void 0,
        protocol: void 0,
        timeout: void 0,
        method: "GET",
        host: void 0,
        path: void 0,
        port: void 0
      };
      websocket._autoPong = opts.autoPong;
      if (!protocolVersions.includes(opts.protocolVersion)) {
        throw new RangeError(
          `Unsupported protocol version: ${opts.protocolVersion} (supported versions: ${protocolVersions.join(", ")})`
        );
      }
      let parsedUrl;
      if (address instanceof URL2) {
        parsedUrl = address;
      } else {
        try {
          parsedUrl = new URL2(address);
        } catch (e) {
          throw new SyntaxError(`Invalid URL: ${address}`);
        }
      }
      if (parsedUrl.protocol === "http:") {
        parsedUrl.protocol = "ws:";
      } else if (parsedUrl.protocol === "https:") {
        parsedUrl.protocol = "wss:";
      }
      websocket._url = parsedUrl.href;
      const isSecure = parsedUrl.protocol === "wss:";
      const isIpcUrl = parsedUrl.protocol === "ws+unix:";
      let invalidUrlMessage;
      if (parsedUrl.protocol !== "ws:" && !isSecure && !isIpcUrl) {
        invalidUrlMessage = `The URL's protocol must be one of "ws:", "wss:", "http:", "https:", or "ws+unix:"`;
      } else if (isIpcUrl && !parsedUrl.pathname) {
        invalidUrlMessage = "The URL's pathname is empty";
      } else if (parsedUrl.hash) {
        invalidUrlMessage = "The URL contains a fragment identifier";
      }
      if (invalidUrlMessage) {
        const err = new SyntaxError(invalidUrlMessage);
        if (websocket._redirects === 0) {
          throw err;
        } else {
          emitErrorAndClose(websocket, err);
          return;
        }
      }
      const defaultPort = isSecure ? 443 : 80;
      const key = randomBytes(16).toString("base64");
      const request = isSecure ? https.request : http.request;
      const protocolSet = /* @__PURE__ */ new Set();
      let perMessageDeflate;
      opts.createConnection = opts.createConnection || (isSecure ? tlsConnect : netConnect);
      opts.defaultPort = opts.defaultPort || defaultPort;
      opts.port = parsedUrl.port || defaultPort;
      opts.host = parsedUrl.hostname.startsWith("[") ? parsedUrl.hostname.slice(1, -1) : parsedUrl.hostname;
      opts.headers = {
        ...opts.headers,
        "Sec-WebSocket-Version": opts.protocolVersion,
        "Sec-WebSocket-Key": key,
        Connection: "Upgrade",
        Upgrade: "websocket"
      };
      opts.path = parsedUrl.pathname + parsedUrl.search;
      opts.timeout = opts.handshakeTimeout;
      if (opts.perMessageDeflate) {
        perMessageDeflate = new PerMessageDeflate(
          opts.perMessageDeflate !== true ? opts.perMessageDeflate : {},
          false,
          opts.maxPayload
        );
        opts.headers["Sec-WebSocket-Extensions"] = format({
          [PerMessageDeflate.extensionName]: perMessageDeflate.offer()
        });
      }
      if (protocols.length) {
        for (const protocol of protocols) {
          if (typeof protocol !== "string" || !subprotocolRegex.test(protocol) || protocolSet.has(protocol)) {
            throw new SyntaxError(
              "An invalid or duplicated subprotocol was specified"
            );
          }
          protocolSet.add(protocol);
        }
        opts.headers["Sec-WebSocket-Protocol"] = protocols.join(",");
      }
      if (opts.origin) {
        if (opts.protocolVersion < 13) {
          opts.headers["Sec-WebSocket-Origin"] = opts.origin;
        } else {
          opts.headers.Origin = opts.origin;
        }
      }
      if (parsedUrl.username || parsedUrl.password) {
        opts.auth = `${parsedUrl.username}:${parsedUrl.password}`;
      }
      if (isIpcUrl) {
        const parts = opts.path.split(":");
        opts.socketPath = parts[0];
        opts.path = parts[1];
      }
      let req;
      if (opts.followRedirects) {
        if (websocket._redirects === 0) {
          websocket._originalIpc = isIpcUrl;
          websocket._originalSecure = isSecure;
          websocket._originalHostOrSocketPath = isIpcUrl ? opts.socketPath : parsedUrl.host;
          const headers = options && options.headers;
          options = { ...options, headers: {} };
          if (headers) {
            for (const [key2, value] of Object.entries(headers)) {
              options.headers[key2.toLowerCase()] = value;
            }
          }
        } else if (websocket.listenerCount("redirect") === 0) {
          const isSameHost = isIpcUrl ? websocket._originalIpc ? opts.socketPath === websocket._originalHostOrSocketPath : false : websocket._originalIpc ? false : parsedUrl.host === websocket._originalHostOrSocketPath;
          if (!isSameHost || websocket._originalSecure && !isSecure) {
            delete opts.headers.authorization;
            delete opts.headers.cookie;
            if (!isSameHost) delete opts.headers.host;
            opts.auth = void 0;
          }
        }
        if (opts.auth && !options.headers.authorization) {
          options.headers.authorization = "Basic " + Buffer.from(opts.auth).toString("base64");
        }
        req = websocket._req = request(opts);
        if (websocket._redirects) {
          websocket.emit("redirect", websocket.url, req);
        }
      } else {
        req = websocket._req = request(opts);
      }
      if (opts.timeout) {
        req.on("timeout", () => {
          abortHandshake(websocket, req, "Opening handshake has timed out");
        });
      }
      req.on("error", (err) => {
        if (req === null || req[kAborted]) return;
        req = websocket._req = null;
        emitErrorAndClose(websocket, err);
      });
      req.on("response", (res) => {
        const location = res.headers.location;
        const statusCode = res.statusCode;
        if (location && opts.followRedirects && statusCode >= 300 && statusCode < 400) {
          if (++websocket._redirects > opts.maxRedirects) {
            abortHandshake(websocket, req, "Maximum redirects exceeded");
            return;
          }
          req.abort();
          let addr;
          try {
            addr = new URL2(location, address);
          } catch (e) {
            const err = new SyntaxError(`Invalid URL: ${location}`);
            emitErrorAndClose(websocket, err);
            return;
          }
          initAsClient(websocket, addr, protocols, options);
        } else if (!websocket.emit("unexpected-response", req, res)) {
          abortHandshake(
            websocket,
            req,
            `Unexpected server response: ${res.statusCode}`
          );
        }
      });
      req.on("upgrade", (res, socket, head) => {
        websocket.emit("upgrade", res);
        if (websocket.readyState !== WebSocket2.CONNECTING) return;
        req = websocket._req = null;
        const upgrade = res.headers.upgrade;
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          abortHandshake(websocket, socket, "Invalid Upgrade header");
          return;
        }
        const digest = createHash("sha1").update(key + GUID).digest("base64");
        if (res.headers["sec-websocket-accept"] !== digest) {
          abortHandshake(websocket, socket, "Invalid Sec-WebSocket-Accept header");
          return;
        }
        const serverProt = res.headers["sec-websocket-protocol"];
        let protError;
        if (serverProt !== void 0) {
          if (!protocolSet.size) {
            protError = "Server sent a subprotocol but none was requested";
          } else if (!protocolSet.has(serverProt)) {
            protError = "Server sent an invalid subprotocol";
          }
        } else if (protocolSet.size) {
          protError = "Server sent no subprotocol";
        }
        if (protError) {
          abortHandshake(websocket, socket, protError);
          return;
        }
        if (serverProt) websocket._protocol = serverProt;
        const secWebSocketExtensions = res.headers["sec-websocket-extensions"];
        if (secWebSocketExtensions !== void 0) {
          if (!perMessageDeflate) {
            const message = "Server sent a Sec-WebSocket-Extensions header but no extension was requested";
            abortHandshake(websocket, socket, message);
            return;
          }
          let extensions;
          try {
            extensions = parse(secWebSocketExtensions);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message);
            return;
          }
          const extensionNames = Object.keys(extensions);
          if (extensionNames.length !== 1 || extensionNames[0] !== PerMessageDeflate.extensionName) {
            const message = "Server indicated an extension that was not requested";
            abortHandshake(websocket, socket, message);
            return;
          }
          try {
            perMessageDeflate.accept(extensions[PerMessageDeflate.extensionName]);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message);
            return;
          }
          websocket._extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
        }
        websocket.setSocket(socket, head, {
          allowSynchronousEvents: opts.allowSynchronousEvents,
          generateMask: opts.generateMask,
          maxPayload: opts.maxPayload,
          skipUTF8Validation: opts.skipUTF8Validation
        });
      });
      if (opts.finishRequest) {
        opts.finishRequest(req, websocket);
      } else {
        req.end();
      }
    }
    function emitErrorAndClose(websocket, err) {
      websocket._readyState = WebSocket2.CLOSING;
      websocket._errorEmitted = true;
      websocket.emit("error", err);
      websocket.emitClose();
    }
    function netConnect(options) {
      options.path = options.socketPath;
      return net.connect(options);
    }
    function tlsConnect(options) {
      options.path = void 0;
      if (!options.servername && options.servername !== "") {
        options.servername = net.isIP(options.host) ? "" : options.host;
      }
      return tls.connect(options);
    }
    function abortHandshake(websocket, stream, message) {
      websocket._readyState = WebSocket2.CLOSING;
      const err = new Error(message);
      Error.captureStackTrace(err, abortHandshake);
      if (stream.setHeader) {
        stream[kAborted] = true;
        stream.abort();
        if (stream.socket && !stream.socket.destroyed) {
          stream.socket.destroy();
        }
        process.nextTick(emitErrorAndClose, websocket, err);
      } else {
        stream.destroy(err);
        stream.once("error", websocket.emit.bind(websocket, "error"));
        stream.once("close", websocket.emitClose.bind(websocket));
      }
    }
    function sendAfterClose(websocket, data, cb) {
      if (data) {
        const length = isBlob(data) ? data.size : toBuffer(data).length;
        if (websocket._socket) websocket._sender._bufferedBytes += length;
        else websocket._bufferedAmount += length;
      }
      if (cb) {
        const err = new Error(
          `WebSocket is not open: readyState ${websocket.readyState} (${readyStates[websocket.readyState]})`
        );
        process.nextTick(cb, err);
      }
    }
    function receiverOnConclude(code, reason) {
      const websocket = this[kWebSocket];
      websocket._closeFrameReceived = true;
      websocket._closeMessage = reason;
      websocket._closeCode = code;
      if (websocket._socket[kWebSocket] === void 0) return;
      websocket._socket.removeListener("data", socketOnData);
      process.nextTick(resume, websocket._socket);
      if (code === 1005) websocket.close();
      else websocket.close(code, reason);
    }
    function receiverOnDrain() {
      const websocket = this[kWebSocket];
      if (!websocket.isPaused) websocket._socket.resume();
    }
    function receiverOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket._socket[kWebSocket] !== void 0) {
        websocket._socket.removeListener("data", socketOnData);
        process.nextTick(resume, websocket._socket);
        websocket.close(err[kStatusCode]);
      }
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    function receiverOnFinish() {
      this[kWebSocket].emitClose();
    }
    function receiverOnMessage(data, isBinary) {
      this[kWebSocket].emit("message", data, isBinary);
    }
    function receiverOnPing(data) {
      const websocket = this[kWebSocket];
      if (websocket._autoPong) websocket.pong(data, !this._isServer, NOOP);
      websocket.emit("ping", data);
    }
    function receiverOnPong(data) {
      this[kWebSocket].emit("pong", data);
    }
    function resume(stream) {
      stream.resume();
    }
    function senderOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket.readyState === WebSocket2.CLOSED) return;
      if (websocket.readyState === WebSocket2.OPEN) {
        websocket._readyState = WebSocket2.CLOSING;
        setCloseTimer(websocket);
      }
      this._socket.end();
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    function setCloseTimer(websocket) {
      websocket._closeTimer = setTimeout(
        websocket._socket.destroy.bind(websocket._socket),
        closeTimeout
      );
    }
    function socketOnClose() {
      const websocket = this[kWebSocket];
      this.removeListener("close", socketOnClose);
      this.removeListener("data", socketOnData);
      this.removeListener("end", socketOnEnd);
      websocket._readyState = WebSocket2.CLOSING;
      let chunk;
      if (!this._readableState.endEmitted && !websocket._closeFrameReceived && !websocket._receiver._writableState.errorEmitted && (chunk = websocket._socket.read()) !== null) {
        websocket._receiver.write(chunk);
      }
      websocket._receiver.end();
      this[kWebSocket] = void 0;
      clearTimeout(websocket._closeTimer);
      if (websocket._receiver._writableState.finished || websocket._receiver._writableState.errorEmitted) {
        websocket.emitClose();
      } else {
        websocket._receiver.on("error", receiverOnFinish);
        websocket._receiver.on("finish", receiverOnFinish);
      }
    }
    function socketOnData(chunk) {
      if (!this[kWebSocket]._receiver.write(chunk)) {
        this.pause();
      }
    }
    function socketOnEnd() {
      const websocket = this[kWebSocket];
      websocket._readyState = WebSocket2.CLOSING;
      websocket._receiver.end();
      this.end();
    }
    function socketOnError() {
      const websocket = this[kWebSocket];
      this.removeListener("error", socketOnError);
      this.on("error", NOOP);
      if (websocket) {
        websocket._readyState = WebSocket2.CLOSING;
        this.destroy();
      }
    }
  }
});

// node_modules/ws/lib/stream.js
var require_stream = __commonJS({
  "node_modules/ws/lib/stream.js"(exports2, module2) {
    "use strict";
    var WebSocket2 = require_websocket();
    var { Duplex } = require("stream");
    function emitClose(stream) {
      stream.emit("close");
    }
    function duplexOnEnd() {
      if (!this.destroyed && this._writableState.finished) {
        this.destroy();
      }
    }
    function duplexOnError(err) {
      this.removeListener("error", duplexOnError);
      this.destroy();
      if (this.listenerCount("error") === 0) {
        this.emit("error", err);
      }
    }
    function createWebSocketStream2(ws, options) {
      let terminateOnDestroy = true;
      const duplex = new Duplex({
        ...options,
        autoDestroy: false,
        emitClose: false,
        objectMode: false,
        writableObjectMode: false
      });
      ws.on("message", function message(msg, isBinary) {
        const data = !isBinary && duplex._readableState.objectMode ? msg.toString() : msg;
        if (!duplex.push(data)) ws.pause();
      });
      ws.once("error", function error(err) {
        if (duplex.destroyed) return;
        terminateOnDestroy = false;
        duplex.destroy(err);
      });
      ws.once("close", function close() {
        if (duplex.destroyed) return;
        duplex.push(null);
      });
      duplex._destroy = function(err, callback) {
        if (ws.readyState === ws.CLOSED) {
          callback(err);
          process.nextTick(emitClose, duplex);
          return;
        }
        let called = false;
        ws.once("error", function error(err2) {
          called = true;
          callback(err2);
        });
        ws.once("close", function close() {
          if (!called) callback(err);
          process.nextTick(emitClose, duplex);
        });
        if (terminateOnDestroy) ws.terminate();
      };
      duplex._final = function(callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open() {
            duplex._final(callback);
          });
          return;
        }
        if (ws._socket === null) return;
        if (ws._socket._writableState.finished) {
          callback();
          if (duplex._readableState.endEmitted) duplex.destroy();
        } else {
          ws._socket.once("finish", function finish() {
            callback();
          });
          ws.close();
        }
      };
      duplex._read = function() {
        if (ws.isPaused) ws.resume();
      };
      duplex._write = function(chunk, encoding, callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open() {
            duplex._write(chunk, encoding, callback);
          });
          return;
        }
        ws.send(chunk, callback);
      };
      duplex.on("end", duplexOnEnd);
      duplex.on("error", duplexOnError);
      return duplex;
    }
    module2.exports = createWebSocketStream2;
  }
});

// node_modules/ws/lib/subprotocol.js
var require_subprotocol = __commonJS({
  "node_modules/ws/lib/subprotocol.js"(exports2, module2) {
    "use strict";
    var { tokenChars } = require_validation();
    function parse(header) {
      const protocols = /* @__PURE__ */ new Set();
      let start = -1;
      let end = -1;
      let i = 0;
      for (i; i < header.length; i++) {
        const code = header.charCodeAt(i);
        if (end === -1 && tokenChars[code] === 1) {
          if (start === -1) start = i;
        } else if (i !== 0 && (code === 32 || code === 9)) {
          if (end === -1 && start !== -1) end = i;
        } else if (code === 44) {
          if (start === -1) {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
          if (end === -1) end = i;
          const protocol2 = header.slice(start, end);
          if (protocols.has(protocol2)) {
            throw new SyntaxError(`The "${protocol2}" subprotocol is duplicated`);
          }
          protocols.add(protocol2);
          start = end = -1;
        } else {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
      }
      if (start === -1 || end !== -1) {
        throw new SyntaxError("Unexpected end of input");
      }
      const protocol = header.slice(start, i);
      if (protocols.has(protocol)) {
        throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
      }
      protocols.add(protocol);
      return protocols;
    }
    module2.exports = { parse };
  }
});

// node_modules/ws/lib/websocket-server.js
var require_websocket_server = __commonJS({
  "node_modules/ws/lib/websocket-server.js"(exports2, module2) {
    "use strict";
    var EventEmitter2 = require("events");
    var http = require("http");
    var { Duplex } = require("stream");
    var { createHash } = require("crypto");
    var extension = require_extension();
    var PerMessageDeflate = require_permessage_deflate();
    var subprotocol = require_subprotocol();
    var WebSocket2 = require_websocket();
    var { GUID, kWebSocket } = require_constants();
    var keyRegex = /^[+/0-9A-Za-z]{22}==$/;
    var RUNNING = 0;
    var CLOSING = 1;
    var CLOSED = 2;
    var WebSocketServer2 = class extends EventEmitter2 {
      /**
       * Create a `WebSocketServer` instance.
       *
       * @param {Object} options Configuration options
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Boolean} [options.autoPong=true] Specifies whether or not to
       *     automatically send a pong in response to a ping
       * @param {Number} [options.backlog=511] The maximum length of the queue of
       *     pending connections
       * @param {Boolean} [options.clientTracking=true] Specifies whether or not to
       *     track clients
       * @param {Function} [options.handleProtocols] A hook to handle protocols
       * @param {String} [options.host] The hostname where to bind the server
       * @param {Number} [options.maxPayload=104857600] The maximum allowed message
       *     size
       * @param {Boolean} [options.noServer=false] Enable no server mode
       * @param {String} [options.path] Accept only connections matching this path
       * @param {(Boolean|Object)} [options.perMessageDeflate=false] Enable/disable
       *     permessage-deflate
       * @param {Number} [options.port] The port where to bind the server
       * @param {(http.Server|https.Server)} [options.server] A pre-created HTTP/S
       *     server to use
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @param {Function} [options.verifyClient] A hook to reject connections
       * @param {Function} [options.WebSocket=WebSocket] Specifies the `WebSocket`
       *     class to use. It must be the `WebSocket` class or class that extends it
       * @param {Function} [callback] A listener for the `listening` event
       */
      constructor(options, callback) {
        super();
        options = {
          allowSynchronousEvents: true,
          autoPong: true,
          maxPayload: 100 * 1024 * 1024,
          skipUTF8Validation: false,
          perMessageDeflate: false,
          handleProtocols: null,
          clientTracking: true,
          verifyClient: null,
          noServer: false,
          backlog: null,
          // use default (511 as implemented in net.js)
          server: null,
          host: null,
          path: null,
          port: null,
          WebSocket: WebSocket2,
          ...options
        };
        if (options.port == null && !options.server && !options.noServer || options.port != null && (options.server || options.noServer) || options.server && options.noServer) {
          throw new TypeError(
            'One and only one of the "port", "server", or "noServer" options must be specified'
          );
        }
        if (options.port != null) {
          this._server = http.createServer((req, res) => {
            const body = http.STATUS_CODES[426];
            res.writeHead(426, {
              "Content-Length": body.length,
              "Content-Type": "text/plain"
            });
            res.end(body);
          });
          this._server.listen(
            options.port,
            options.host,
            options.backlog,
            callback
          );
        } else if (options.server) {
          this._server = options.server;
        }
        if (this._server) {
          const emitConnection = this.emit.bind(this, "connection");
          this._removeListeners = addListeners(this._server, {
            listening: this.emit.bind(this, "listening"),
            error: this.emit.bind(this, "error"),
            upgrade: (req, socket, head) => {
              this.handleUpgrade(req, socket, head, emitConnection);
            }
          });
        }
        if (options.perMessageDeflate === true) options.perMessageDeflate = {};
        if (options.clientTracking) {
          this.clients = /* @__PURE__ */ new Set();
          this._shouldEmitClose = false;
        }
        this.options = options;
        this._state = RUNNING;
      }
      /**
       * Returns the bound address, the address family name, and port of the server
       * as reported by the operating system if listening on an IP socket.
       * If the server is listening on a pipe or UNIX domain socket, the name is
       * returned as a string.
       *
       * @return {(Object|String|null)} The address of the server
       * @public
       */
      address() {
        if (this.options.noServer) {
          throw new Error('The server is operating in "noServer" mode');
        }
        if (!this._server) return null;
        return this._server.address();
      }
      /**
       * Stop the server from accepting new connections and emit the `'close'` event
       * when all existing connections are closed.
       *
       * @param {Function} [cb] A one-time listener for the `'close'` event
       * @public
       */
      close(cb) {
        if (this._state === CLOSED) {
          if (cb) {
            this.once("close", () => {
              cb(new Error("The server is not running"));
            });
          }
          process.nextTick(emitClose, this);
          return;
        }
        if (cb) this.once("close", cb);
        if (this._state === CLOSING) return;
        this._state = CLOSING;
        if (this.options.noServer || this.options.server) {
          if (this._server) {
            this._removeListeners();
            this._removeListeners = this._server = null;
          }
          if (this.clients) {
            if (!this.clients.size) {
              process.nextTick(emitClose, this);
            } else {
              this._shouldEmitClose = true;
            }
          } else {
            process.nextTick(emitClose, this);
          }
        } else {
          const server = this._server;
          this._removeListeners();
          this._removeListeners = this._server = null;
          server.close(() => {
            emitClose(this);
          });
        }
      }
      /**
       * See if a given request should be handled by this server instance.
       *
       * @param {http.IncomingMessage} req Request object to inspect
       * @return {Boolean} `true` if the request is valid, else `false`
       * @public
       */
      shouldHandle(req) {
        if (this.options.path) {
          const index = req.url.indexOf("?");
          const pathname = index !== -1 ? req.url.slice(0, index) : req.url;
          if (pathname !== this.options.path) return false;
        }
        return true;
      }
      /**
       * Handle a HTTP Upgrade request.
       *
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @public
       */
      handleUpgrade(req, socket, head, cb) {
        socket.on("error", socketOnError);
        const key = req.headers["sec-websocket-key"];
        const upgrade = req.headers.upgrade;
        const version = +req.headers["sec-websocket-version"];
        if (req.method !== "GET") {
          const message = "Invalid HTTP method";
          abortHandshakeOrEmitwsClientError(this, req, socket, 405, message);
          return;
        }
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          const message = "Invalid Upgrade header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (key === void 0 || !keyRegex.test(key)) {
          const message = "Missing or invalid Sec-WebSocket-Key header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (version !== 13 && version !== 8) {
          const message = "Missing or invalid Sec-WebSocket-Version header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message, {
            "Sec-WebSocket-Version": "13, 8"
          });
          return;
        }
        if (!this.shouldHandle(req)) {
          abortHandshake(socket, 400);
          return;
        }
        const secWebSocketProtocol = req.headers["sec-websocket-protocol"];
        let protocols = /* @__PURE__ */ new Set();
        if (secWebSocketProtocol !== void 0) {
          try {
            protocols = subprotocol.parse(secWebSocketProtocol);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Protocol header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
            return;
          }
        }
        const secWebSocketExtensions = req.headers["sec-websocket-extensions"];
        const extensions = {};
        if (this.options.perMessageDeflate && secWebSocketExtensions !== void 0) {
          const perMessageDeflate = new PerMessageDeflate(
            this.options.perMessageDeflate,
            true,
            this.options.maxPayload
          );
          try {
            const offers = extension.parse(secWebSocketExtensions);
            if (offers[PerMessageDeflate.extensionName]) {
              perMessageDeflate.accept(offers[PerMessageDeflate.extensionName]);
              extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
            }
          } catch (err) {
            const message = "Invalid or unacceptable Sec-WebSocket-Extensions header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
            return;
          }
        }
        if (this.options.verifyClient) {
          const info = {
            origin: req.headers[`${version === 8 ? "sec-websocket-origin" : "origin"}`],
            secure: !!(req.socket.authorized || req.socket.encrypted),
            req
          };
          if (this.options.verifyClient.length === 2) {
            this.options.verifyClient(info, (verified, code, message, headers) => {
              if (!verified) {
                return abortHandshake(socket, code || 401, message, headers);
              }
              this.completeUpgrade(
                extensions,
                key,
                protocols,
                req,
                socket,
                head,
                cb
              );
            });
            return;
          }
          if (!this.options.verifyClient(info)) return abortHandshake(socket, 401);
        }
        this.completeUpgrade(extensions, key, protocols, req, socket, head, cb);
      }
      /**
       * Upgrade the connection to WebSocket.
       *
       * @param {Object} extensions The accepted extensions
       * @param {String} key The value of the `Sec-WebSocket-Key` header
       * @param {Set} protocols The subprotocols
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @throws {Error} If called more than once with the same socket
       * @private
       */
      completeUpgrade(extensions, key, protocols, req, socket, head, cb) {
        if (!socket.readable || !socket.writable) return socket.destroy();
        if (socket[kWebSocket]) {
          throw new Error(
            "server.handleUpgrade() was called more than once with the same socket, possibly due to a misconfiguration"
          );
        }
        if (this._state > RUNNING) return abortHandshake(socket, 503);
        const digest = createHash("sha1").update(key + GUID).digest("base64");
        const headers = [
          "HTTP/1.1 101 Switching Protocols",
          "Upgrade: websocket",
          "Connection: Upgrade",
          `Sec-WebSocket-Accept: ${digest}`
        ];
        const ws = new this.options.WebSocket(null, void 0, this.options);
        if (protocols.size) {
          const protocol = this.options.handleProtocols ? this.options.handleProtocols(protocols, req) : protocols.values().next().value;
          if (protocol) {
            headers.push(`Sec-WebSocket-Protocol: ${protocol}`);
            ws._protocol = protocol;
          }
        }
        if (extensions[PerMessageDeflate.extensionName]) {
          const params = extensions[PerMessageDeflate.extensionName].params;
          const value = extension.format({
            [PerMessageDeflate.extensionName]: [params]
          });
          headers.push(`Sec-WebSocket-Extensions: ${value}`);
          ws._extensions = extensions;
        }
        this.emit("headers", headers, req);
        socket.write(headers.concat("\r\n").join("\r\n"));
        socket.removeListener("error", socketOnError);
        ws.setSocket(socket, head, {
          allowSynchronousEvents: this.options.allowSynchronousEvents,
          maxPayload: this.options.maxPayload,
          skipUTF8Validation: this.options.skipUTF8Validation
        });
        if (this.clients) {
          this.clients.add(ws);
          ws.on("close", () => {
            this.clients.delete(ws);
            if (this._shouldEmitClose && !this.clients.size) {
              process.nextTick(emitClose, this);
            }
          });
        }
        cb(ws, req);
      }
    };
    module2.exports = WebSocketServer2;
    function addListeners(server, map) {
      for (const event of Object.keys(map)) server.on(event, map[event]);
      return function removeListeners() {
        for (const event of Object.keys(map)) {
          server.removeListener(event, map[event]);
        }
      };
    }
    function emitClose(server) {
      server._state = CLOSED;
      server.emit("close");
    }
    function socketOnError() {
      this.destroy();
    }
    function abortHandshake(socket, code, message, headers) {
      message = message || http.STATUS_CODES[code];
      headers = {
        Connection: "close",
        "Content-Type": "text/html",
        "Content-Length": Buffer.byteLength(message),
        ...headers
      };
      socket.once("finish", socket.destroy);
      socket.end(
        `HTTP/1.1 ${code} ${http.STATUS_CODES[code]}\r
` + Object.keys(headers).map((h) => `${h}: ${headers[h]}`).join("\r\n") + "\r\n\r\n" + message
      );
    }
    function abortHandshakeOrEmitwsClientError(server, req, socket, code, message, headers) {
      if (server.listenerCount("wsClientError")) {
        const err = new Error(message);
        Error.captureStackTrace(err, abortHandshakeOrEmitwsClientError);
        server.emit("wsClientError", err, socket, req);
      } else {
        abortHandshake(socket, code, message, headers);
      }
    }
  }
});

// node_modules/@elgato/utils/dist/i18n/language.js
var defaultLanguage = "en";

// node_modules/@elgato/utils/dist/explicit-resource-management/deferred.js
function deferredDisposable(dispose) {
  let isDisposed = false;
  const guardedDispose = () => {
    if (!isDisposed) {
      dispose();
      isDisposed = true;
    }
  };
  return {
    [Symbol.dispose]: guardedDispose,
    dispose: guardedDispose
  };
}

// node_modules/@elgato/utils/dist/event-emitter.js
var EventEmitter = class {
  /**
   * Underlying collection of events and their listeners.
   */
  events = /* @__PURE__ */ new Map();
  /**
   * Adds the event {@link listener} for the event named {@link eventName}.
   * @param eventName Name of the event.
   * @param listener Event handler function.
   * @returns This instance with the {@link listener} added.
   */
  addListener(eventName, listener) {
    return this.add(eventName, listener, (listeners) => listeners.push({ listener }));
  }
  /**
   * Adds the event {@link listener} for the event named {@link eventName}, and returns a disposable capable of removing the event listener.
   * @param eventName Name of the event.
   * @param listener Event handler function.
   * @returns A disposable that removes the listener when disposed.
   */
  disposableOn(eventName, listener) {
    this.add(eventName, listener, (listeners) => listeners.push({ listener }));
    return deferredDisposable(() => this.removeListener(eventName, listener));
  }
  /**
   * Emits the {@link eventName}, invoking all event listeners with the specified {@link args}.
   * @param eventName Name of the event.
   * @param args Arguments supplied to each event listener.
   * @returns `true` when there was a listener associated with the event; otherwise `false`.
   */
  emit(eventName, ...args) {
    const listeners = this.events.get(eventName);
    if (listeners === void 0) {
      return false;
    }
    for (let i = 0; i < listeners.length; ) {
      const { listener, once } = listeners[i];
      if (once) {
        this.remove(eventName, listeners, i);
      } else {
        i++;
      }
      listener(...args);
    }
    return true;
  }
  /**
   * Gets the event names with event listeners.
   * @returns Event names.
   */
  eventNames() {
    return Array.from(this.events.keys());
  }
  /**
   * Gets the number of event listeners for the event named {@link eventName}. When a {@link listener} is defined, only matching event listeners are counted.
   * @param eventName Name of the event.
   * @param listener Optional event listener to count.
   * @returns Number of event listeners.
   */
  listenerCount(eventName, listener) {
    const listeners = this.events.get(eventName);
    if (listeners === void 0 || listener == void 0) {
      return listeners?.length || 0;
    }
    let count = 0;
    listeners.forEach((ev) => {
      if (ev.listener === listener) {
        count++;
      }
    });
    return count;
  }
  /**
   * Gets the event listeners for the event named {@link eventName}.
   * @param eventName Name of the event.
   * @returns The event listeners.
   */
  listeners(eventName) {
    return Array.from(this.events.get(eventName) || []).map(({ listener }) => listener);
  }
  /**
   * Removes the event {@link listener} for the event named {@link eventName}.
   * @param eventName Name of the event.
   * @param listener Event handler function.
   * @returns This instance with the event {@link listener} removed.
   */
  off(eventName, listener) {
    const listeners = this.events.get(eventName) ?? [];
    for (let i = listeners.length - 1; i >= 0; i--) {
      if (listeners[i].listener === listener) {
        this.remove(eventName, listeners, i);
      }
    }
    return this;
  }
  /**
   * Adds the event {@link listener} for the event named {@link eventName}.
   * @param eventName Name of the event.
   * @param listener Event handler function.
   * @returns This instance with the event {@link listener} added.
   */
  on(eventName, listener) {
    return this.add(eventName, listener, (listeners) => listeners.push({ listener }));
  }
  /**
   * Adds the **one-time** event {@link listener} for the event named {@link eventName}.
   * @param eventName Name of the event.
   * @param listener Event handler function.
   * @returns This instance with the event {@link listener} added.
   */
  once(eventName, listener) {
    return this.add(eventName, listener, (listeners) => listeners.push({ listener, once: true }));
  }
  /**
   * Adds the event {@link listener} to the beginning of the listeners for the event named {@link eventName}.
   * @param eventName Name of the event.
   * @param listener Event handler function.
   * @returns This instance with the event {@link listener} prepended.
   */
  prependListener(eventName, listener) {
    return this.add(eventName, listener, (listeners) => listeners.splice(0, 0, { listener }));
  }
  /**
   * Adds the **one-time** event {@link listener} to the beginning of the listeners for the event named {@link eventName}.
   * @param eventName Name of the event.
   * @param listener Event handler function.
   * @returns This instance with the event {@link listener} prepended.
   */
  prependOnceListener(eventName, listener) {
    return this.add(eventName, listener, (listeners) => listeners.splice(0, 0, { listener, once: true }));
  }
  /**
   * Removes all event listeners for the event named {@link eventName}.
   * @param eventName Name of the event.
   * @returns This instance with the event listeners removed
   */
  removeAllListeners(eventName) {
    const listeners = this.events.get(eventName) ?? [];
    while (listeners.length > 0) {
      this.remove(eventName, listeners, 0);
    }
    this.events.delete(eventName);
    return this;
  }
  /**
   * Removes the event {@link listener} for the event named {@link eventName}.
   * @param eventName Name of the event.
   * @param listener Event handler function.
   * @returns This instance with the event {@link listener} removed.
   */
  removeListener(eventName, listener) {
    return this.off(eventName, listener);
  }
  /**
   * Adds the event {@link listener} for the event named {@link eventName}.
   * @param eventName Name of the event.
   * @param listener Event handler function.
   * @param fn Function responsible for adding the new event handler function.
   * @returns This instance with event {@link listener} added.
   */
  add(eventName, listener, fn) {
    let listeners = this.events.get(eventName);
    if (listeners === void 0) {
      listeners = [];
      this.events.set(eventName, listeners);
    }
    fn(listeners);
    if (eventName !== "newListener") {
      const args = [eventName, listener];
      this.emit("newListener", ...args);
    }
    return this;
  }
  /**
   * Removes the listener at the given index.
   * @param eventName Name of the event.
   * @param listeners Listeners registered with the event.
   * @param index Index of the listener to remove.
   */
  remove(eventName, listeners, index) {
    const [{ listener }] = listeners.splice(index, 1);
    if (eventName !== "removeListener") {
      const args = [eventName, listener];
      this.emit("removeListener", ...args);
    }
  }
};

// node_modules/@elgato/utils/dist/objects.js
function freeze(value) {
  if (value !== void 0 && value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(freeze);
  }
}
function get(source, path5) {
  const props = path5.split(".");
  return props.reduce((obj, prop) => obj && obj[prop], source);
}

// node_modules/@elgato/utils/dist/i18n/provider.js
var I18nProvider = class {
  /**
   * Backing field for the default language.
   */
  #language;
  /**
   * Map of localized resources, indexed by their language.
   */
  #translations = /* @__PURE__ */ new Map();
  /**
   * Function responsible for providing localized resources for a given language.
   */
  #readTranslations;
  /**
   * Internal events handler.
   */
  #events = new EventEmitter();
  /**
   * Initializes a new instance of the {@link I18nProvider} class.
   * @param language The default language to be used when retrieving translations for a given key.
   * @param readTranslations Function responsible for providing localized resources for a given language.
   */
  constructor(language, readTranslations) {
    this.#language = language;
    this.#readTranslations = readTranslations;
  }
  /**
   * The default language of the provider.
   * @returns The language.
   */
  get language() {
    return this.#language;
  }
  /**
   * The default language of the provider.
   * @param value The language.
   */
  set language(value) {
    if (this.#language !== value) {
      this.#language = value;
      this.#events.emit("languageChange", value);
    }
  }
  /**
   * Adds an event listener that is called when the language within the provider changes.
   * @param listener Listener function to be called.
   * @returns Resource manager that, when disposed, removes the event listener.
   */
  onLanguageChange(listener) {
    return this.#events.disposableOn("languageChange", listener);
  }
  /**
   * Translates the specified {@link key}, as defined within the resources for the {@link language}.
   * When the key is not found, the default language is checked. Alias of {@link I18nProvider.translate}.
   * @param key Key of the translation.
   * @param language Optional language to get the translation for; otherwise the default language.
   * @returns The translation; otherwise the key.
   */
  t(key, language = this.language) {
    return this.translate(key, language);
  }
  /**
   * Translates the specified {@link key}, as defined within the resources for the {@link language}.
   * When the key is not found, the default language is checked.
   * @param key Key of the translation.
   * @param language Optional language to get the translation for; otherwise the default language.
   * @returns The translation; otherwise the key.
   */
  translate(key, language = this.language) {
    const languages = /* @__PURE__ */ new Set([
      language,
      language.replaceAll("_", "-").split("-").at(0),
      defaultLanguage
    ]);
    for (const language2 of languages) {
      const resource = get(this.getTranslations(language2), key);
      if (resource) {
        return resource.toString();
      }
    }
    return key;
  }
  /**
   * Gets the translations for the specified language.
   * @param language Language whose translations are being retrieved.
   * @returns The translations; otherwise `null`.
   */
  getTranslations(language) {
    let translations = this.#translations.get(language);
    if (translations === void 0) {
      translations = this.#readTranslations(language);
      freeze(translations);
      this.#translations.set(language, translations);
    }
    return translations;
  }
};

// node_modules/@elgato/utils/dist/enumerable.js
var Enumerable = class _Enumerable {
  /**
   * Backing function responsible for providing the iterator of items.
   */
  #items;
  /**
   * Backing function for {@link Enumerable.length}.
   */
  #length;
  /**
   * Captured iterator from the underlying iterable; used to fulfil {@link IterableIterator} methods.
   */
  #iterator;
  /**
   * Initializes a new instance of the {@link Enumerable} class.
   * @param source Source that contains the items.
   * @returns The enumerable.
   */
  constructor(source) {
    if (source instanceof _Enumerable) {
      this.#items = source.#items;
      this.#length = source.#length;
    } else if (Array.isArray(source)) {
      this.#items = () => source.values();
      this.#length = () => source.length;
    } else if (source instanceof Map || source instanceof Set) {
      this.#items = () => source.values();
      this.#length = () => source.size;
    } else {
      this.#items = source;
      this.#length = () => {
        let i = 0;
        for (const _ of this) {
          i++;
        }
        return i;
      };
    }
  }
  /**
   * Gets the number of items in the enumerable.
   * @returns The number of items.
   */
  get length() {
    return this.#length();
  }
  /**
   * Gets the iterator for the enumerable.
   * @yields The items.
   */
  *[Symbol.iterator]() {
    for (const item of this.#items()) {
      yield item;
    }
  }
  /**
   * Transforms each item within this iterator to an indexed pair, with each pair represented as an array.
   * @returns An iterator of indexed pairs.
   */
  asIndexedPairs() {
    return new _Enumerable(function* () {
      let i = 0;
      for (const item of this) {
        yield [i++, item];
      }
    }.bind(this));
  }
  /**
   * Returns an iterator with the first items dropped, up to the specified limit.
   * @param limit The number of elements to drop from the start of the iteration.
   * @returns An iterator of items after the limit.
   */
  drop(limit) {
    if (isNaN(limit) || limit < 0) {
      throw new RangeError("limit must be 0, or a positive number");
    }
    return new _Enumerable(function* () {
      let i = 0;
      for (const item of this) {
        if (i++ >= limit) {
          yield item;
        }
      }
    }.bind(this));
  }
  /**
   * Determines whether all items satisfy the specified predicate.
   * @param predicate Function that determines whether each item fulfils the predicate.
   * @returns `true` when all items satisfy the predicate; otherwise `false`.
   */
  every(predicate) {
    for (const item of this) {
      if (!predicate(item)) {
        return false;
      }
    }
    return true;
  }
  /**
   * Returns an iterator of items that meet the specified predicate..
   * @param predicate Function that determines which items to filter.
   * @returns An iterator of filtered items.
   */
  filter(predicate) {
    return new _Enumerable(function* () {
      for (const item of this) {
        if (predicate(item)) {
          yield item;
        }
      }
    }.bind(this));
  }
  /**
   * Finds the first item that satisfies the specified predicate.
   * @param predicate Predicate to match items against.
   * @returns The first item that satisfied the predicate; otherwise `undefined`.
   */
  find(predicate) {
    for (const item of this) {
      if (predicate(item)) {
        return item;
      }
    }
  }
  /**
   * Finds the last item that satisfies the specified predicate.
   * @param predicate Predicate to match items against.
   * @returns The first item that satisfied the predicate; otherwise `undefined`.
   */
  findLast(predicate) {
    let result = void 0;
    for (const item of this) {
      if (predicate(item)) {
        result = item;
      }
    }
    return result;
  }
  /**
   * Returns an iterator containing items transformed using the specified mapper function.
   * @param mapper Function responsible for transforming each item.
   * @returns An iterator of transformed items.
   */
  flatMap(mapper) {
    return new _Enumerable(function* () {
      for (const item of this) {
        for (const mapped of mapper(item)) {
          yield mapped;
        }
      }
    }.bind(this));
  }
  /**
   * Iterates over each item, and invokes the specified function.
   * @param fn Function to invoke against each item.
   */
  forEach(fn) {
    for (const item of this) {
      fn(item);
    }
  }
  /**
   * Determines whether the search item exists in the collection exists.
   * @param search Item to search for.
   * @returns `true` when the item was found; otherwise `false`.
   */
  includes(search) {
    return this.some((item) => item === search);
  }
  /**
   * Returns an iterator of mapped items using the mapper function.
   * @param mapper Function responsible for mapping the items.
   * @returns An iterator of mapped items.
   */
  map(mapper) {
    return new _Enumerable(function* () {
      for (const item of this) {
        yield mapper(item);
      }
    }.bind(this));
  }
  /**
   * Captures the underlying iterable, if it is not already captured, and gets the next item in the iterator.
   * @param args Optional values to send to the generator.
   * @returns An iterator result of the current iteration; when `done` is `false`, the current `value` is provided.
   */
  next(...args) {
    this.#iterator ??= this.#items();
    const result = this.#iterator.next(...args);
    if (result.done) {
      this.#iterator = void 0;
    }
    return result;
  }
  /**
   * Applies the accumulator function to each item, and returns the result.
   * @param accumulator Function responsible for accumulating all items within the collection.
   * @param initial Initial value supplied to the accumulator.
   * @returns Result of accumulating each value.
   */
  reduce(accumulator, initial) {
    if (this.length === 0) {
      if (initial === void 0) {
        throw new TypeError("Reduce of empty enumerable with no initial value.");
      }
      return initial;
    }
    let result = initial;
    for (const item of this) {
      if (result === void 0) {
        result = item;
      } else {
        result = accumulator(result, item);
      }
    }
    return result;
  }
  /**
   * Acts as if a `return` statement is inserted in the generator's body at the current suspended position.
   *
   * Please note, in the context of an {@link Enumerable}, calling {@link Enumerable.return} will clear the captured iterator,
   * if there is one. Subsequent calls to {@link Enumerable.next} will result in re-capturing the underlying iterable, and
   * yielding items from the beginning.
   * @param value Value to return.
   * @returns The value as an iterator result.
   */
  return(value) {
    this.#iterator = void 0;
    return { done: true, value };
  }
  /**
   * Determines whether an item in the collection exists that satisfies the specified predicate.
   * @param predicate Function used to search for an item.
   * @returns `true` when the item was found; otherwise `false`.
   */
  some(predicate) {
    for (const item of this) {
      if (predicate(item)) {
        return true;
      }
    }
    return false;
  }
  /**
   * Returns an iterator with the items, from 0, up to the specified limit.
   * @param limit Limit of items to take.
   * @returns An iterator of items from 0 to the limit.
   */
  take(limit) {
    if (isNaN(limit) || limit < 0) {
      throw new RangeError("limit must be 0, or a positive number");
    }
    return new _Enumerable(function* () {
      let i = 0;
      for (const item of this) {
        if (i++ < limit) {
          yield item;
        }
      }
    }.bind(this));
  }
  /**
   * Acts as if a `throw` statement is inserted in the generator's body at the current suspended position.
   * @param e Error to throw.
   */
  throw(e) {
    throw e;
  }
  /**
   * Converts this iterator to an array.
   * @returns The array of items from this iterator.
   */
  toArray() {
    return Array.from(this);
  }
  /**
   * Converts this iterator to serializable collection.
   * @returns The serializable collection of items.
   */
  toJSON() {
    return this.toArray();
  }
  /**
   * Converts this iterator to a string.
   * @returns The string.
   */
  toString() {
    return `${this.toArray()}`;
  }
};

// node_modules/@elgato/utils/dist/explicit-resource-management/index.js
Symbol.dispose ??= /* @__PURE__ */ Symbol("Symbol.dispose");

// node_modules/@elgato/utils/dist/lazy.js
var Lazy = class {
  /**
   * Private backing field for {@link Lazy.value}.
   */
  #value = void 0;
  /**
   * Factory responsible for instantiating the value.
   */
  #valueFactory;
  /**
   * Initializes a new instance of the {@link Lazy} class.
   * @param valueFactory The factory responsible for instantiating the value.
   */
  constructor(valueFactory) {
    this.#valueFactory = valueFactory;
  }
  /**
   * Gets the value.
   * @returns The value.
   */
  get value() {
    if (this.#value === void 0) {
      this.#value = this.#valueFactory();
    }
    return this.#value;
  }
};

// node_modules/@elgato/utils/dist/promises.js
function withResolvers() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// node_modules/ws/wrapper.mjs
var import_stream = __toESM(require_stream(), 1);
var import_receiver = __toESM(require_receiver(), 1);
var import_sender = __toESM(require_sender(), 1);
var import_websocket = __toESM(require_websocket(), 1);
var import_websocket_server = __toESM(require_websocket_server(), 1);
var wrapper_default = import_websocket.default;

// node_modules/@elgato/schemas/dist/streamdeck/plugins/index.mjs
var DeviceType;
(function(DeviceType2) {
  DeviceType2[DeviceType2["StreamDeck"] = 0] = "StreamDeck";
  DeviceType2[DeviceType2["StreamDeckMini"] = 1] = "StreamDeckMini";
  DeviceType2[DeviceType2["StreamDeckXL"] = 2] = "StreamDeckXL";
  DeviceType2[DeviceType2["StreamDeckMobile"] = 3] = "StreamDeckMobile";
  DeviceType2[DeviceType2["CorsairGKeys"] = 4] = "CorsairGKeys";
  DeviceType2[DeviceType2["StreamDeckPedal"] = 5] = "StreamDeckPedal";
  DeviceType2[DeviceType2["CorsairVoyager"] = 6] = "CorsairVoyager";
  DeviceType2[DeviceType2["StreamDeckPlus"] = 7] = "StreamDeckPlus";
  DeviceType2[DeviceType2["SCUFController"] = 8] = "SCUFController";
  DeviceType2[DeviceType2["StreamDeckNeo"] = 9] = "StreamDeckNeo";
  DeviceType2[DeviceType2["StreamDeckStudio"] = 10] = "StreamDeckStudio";
  DeviceType2[DeviceType2["VirtualStreamDeck"] = 11] = "VirtualStreamDeck";
})(DeviceType || (DeviceType = {}));
var BarSubType;
(function(BarSubType2) {
  BarSubType2[BarSubType2["Rectangle"] = 0] = "Rectangle";
  BarSubType2[BarSubType2["DoubleRectangle"] = 1] = "DoubleRectangle";
  BarSubType2[BarSubType2["Trapezoid"] = 2] = "Trapezoid";
  BarSubType2[BarSubType2["DoubleTrapezoid"] = 3] = "DoubleTrapezoid";
  BarSubType2[BarSubType2["Groove"] = 4] = "Groove";
})(BarSubType || (BarSubType = {}));

// node_modules/@elgato/streamdeck/dist/api/registration/parameters.js
var RegistrationParameter;
(function(RegistrationParameter2) {
  RegistrationParameter2["Port"] = "-port";
  RegistrationParameter2["Info"] = "-info";
  RegistrationParameter2["PluginUUID"] = "-pluginUUID";
  RegistrationParameter2["RegisterEvent"] = "-registerEvent";
})(RegistrationParameter || (RegistrationParameter = {}));

// node_modules/@elgato/streamdeck/dist/api/target.js
var Target;
(function(Target2) {
  Target2[Target2["HardwareAndSoftware"] = 0] = "HardwareAndSoftware";
  Target2[Target2["Hardware"] = 1] = "Hardware";
  Target2[Target2["Software"] = 2] = "Software";
})(Target || (Target = {}));

// node_modules/@elgato/streamdeck/dist/plugin/common/version.js
var Version = class {
  /**
   * Build version number.
   */
  build;
  /**
   * Major version number.
   */
  major;
  /**
   * Minor version number.
   */
  minor;
  /**
   * Patch version number.
   */
  patch;
  /**
   * Initializes a new instance of the {@link Version} class.
   * @param value Value to parse the version from.
   */
  constructor(value) {
    const result = value.match(/^(0|[1-9]\d*)(?:\.(0|[1-9]\d*))?(?:\.(0|[1-9]\d*))?(?:\.(0|[1-9]\d*))?$/);
    if (result === null) {
      throw new Error(`Invalid format; expected "{major}[.{minor}[.{patch}[.{build}]]]" but was "${value}"`);
    }
    [, this.major, this.minor, this.patch, this.build] = [...result.map((value2) => parseInt(value2) || 0)];
  }
  /**
   * Compares this instance to the {@link other} {@link Version}.
   * @param other The {@link Version} to compare to.
   * @returns `-1` when this instance is less than the {@link other}, `1` when this instance is greater than {@link other}, otherwise `0`.
   */
  compareTo(other) {
    const segments = ({ major, minor, build, patch }) => [major, minor, build, patch];
    const thisSegments = segments(this);
    const otherSegments = segments(other);
    for (let i = 0; i < 4; i++) {
      if (thisSegments[i] < otherSegments[i]) {
        return -1;
      } else if (thisSegments[i] > otherSegments[i]) {
        return 1;
      }
    }
    return 0;
  }
  /** @inheritdoc */
  toString() {
    return `${this.major}.${this.minor}`;
  }
};

// node_modules/@elgato/utils/dist/logging/console-target.js
var ConsoleTarget = class {
  /**
   * @inheritdoc
   */
  write(entry) {
    switch (entry.level) {
      case "error":
        console.error(...entry.data);
        break;
      case "warn":
        console.warn(...entry.data);
        break;
      default:
        console.log(...entry.data);
    }
  }
};

// node_modules/@elgato/utils/dist/logging/format.js
var EOL = "\n";
function stringFormatter(opts) {
  if (opts?.dataOnly) {
    return ({ data }) => `${reduce(data)}`;
  } else {
    return (entry) => {
      const { data, level, scope } = entry;
      let prefix = `${(/* @__PURE__ */ new Date()).toISOString()} ${level.toUpperCase().padEnd(5)} `;
      if (scope) {
        prefix += `${scope}: `;
      }
      return `${prefix}${reduce(data)}`;
    };
  }
}
function reduce(data) {
  let result = "";
  let previousWasError = false;
  for (const value of data) {
    if (typeof value === "object" && value instanceof Error) {
      result += `${EOL}${value.stack}`;
      previousWasError = true;
      continue;
    }
    if (previousWasError) {
      result += EOL;
      previousWasError = false;
    }
    result += typeof value === "object" ? JSON.stringify(value) : value;
    result += " ";
  }
  return result.trimEnd();
}

// node_modules/@elgato/utils/dist/logging/level.js
function defcon(level) {
  switch (level) {
    case "error":
      return 0;
    case "warn":
      return 1;
    case "info":
      return 2;
    case "debug":
      return 3;
    case "trace":
    default:
      return 4;
  }
}

// node_modules/@elgato/utils/dist/logging/logger.js
var Logger = class _Logger {
  /**
   * Backing field for the {@link Logger.level}.
   */
  #level;
  /**
   * Options that define the loggers behavior.
   */
  #options;
  /**
   * Scope associated with this {@link Logger}.
   */
  #scope;
  /**
   * Initializes a new instance of the {@link Logger} class.
   * @param opts Options that define the loggers behavior.
   */
  constructor(opts) {
    this.#options = { minimumLevel: "trace", ...opts };
    this.#scope = this.#options.scope === void 0 || this.#options.scope.trim() === "" ? "" : this.#options.scope;
    if (typeof this.#options.level !== "function") {
      this.setLevel(this.#options.level);
    }
  }
  /**
   * Gets the {@link LogLevel}.
   * @returns The {@link LogLevel}.
   */
  get level() {
    if (this.#level !== void 0) {
      return this.#level;
    }
    return typeof this.#options.level === "function" ? this.#options.level() : this.#options.level;
  }
  /**
   * Creates a scoped logger with the given {@link scope}; logs created by scoped-loggers include their scope to enable their source to be easily identified.
   * @param scope Value that represents the scope of the new logger.
   * @returns The scoped logger, or this instance when {@link scope} is not defined.
   */
  createScope(scope) {
    scope = scope.trim();
    if (scope === "") {
      return this;
    }
    return new _Logger({
      ...this.#options,
      level: () => this.level,
      scope: this.#options.scope ? `${this.#options.scope}->${scope}` : scope
    });
  }
  /**
   * Writes the arguments as a debug log entry.
   * @param data Message or data to log.
   * @returns This instance for chaining.
   */
  debug(...data) {
    return this.write({ level: "debug", data, scope: this.#scope });
  }
  /**
   * Writes the arguments as error log entry.
   * @param data Message or data to log.
   * @returns This instance for chaining.
   */
  error(...data) {
    return this.write({ level: "error", data, scope: this.#scope });
  }
  /**
   * Writes the arguments as an info log entry.
   * @param data Message or data to log.
   * @returns This instance for chaining.
   */
  info(...data) {
    return this.write({ level: "info", data, scope: this.#scope });
  }
  /**
   * Sets the log-level that determines which logs should be written. The specified level will be inherited by all scoped loggers unless they have log-level explicitly defined.
   * @param level The log-level that determines which logs should be written; when `undefined`, the level will be inherited from the parent logger, or default to the environment level.
   * @returns This instance for chaining.
   */
  setLevel(level) {
    if (level !== void 0 && defcon(level) > defcon(this.#options.minimumLevel)) {
      this.#level = "info";
    } else {
      this.#level = level;
    }
    return this;
  }
  /**
   * Writes the arguments as a trace log entry.
   * @param data Message or data to log.
   * @returns This instance for chaining.
   */
  trace(...data) {
    return this.write({ level: "trace", data, scope: this.#scope });
  }
  /**
   * Writes the arguments as a warning log entry.
   * @param data Message or data to log.
   * @returns This instance for chaining.
   */
  warn(...data) {
    return this.write({ level: "warn", data, scope: this.#scope });
  }
  /**
   * Writes the log entry.
   * @param entry Log entry to write.
   * @returns This instance for chaining.
   */
  write(entry) {
    if (defcon(entry.level) <= defcon(this.level)) {
      this.#options.targets.forEach((t) => t.write(entry));
    }
    return this;
  }
};

// node_modules/@elgato/utils/dist/logging/node/file-target.js
var import_node_fs = __toESM(require("node:fs"), 1);
var import_node_path = __toESM(require("node:path"), 1);
var FileTarget = class {
  /**
   * File path where logs will be written.
   */
  #filePath;
  /**
   * Options that defines how logs should be written to the local file system.
   */
  #options;
  /**
   * Current size of the logs that have been written to the {@link FileTarget.#filePath}.
   */
  #size = 0;
  /**
   * Initializes a new instance of the {@link FileTarget} class.
   * @param options Options that defines how logs should be written to the local file system.
   */
  constructor(options) {
    this.#options = options;
    this.#filePath = this.getLogFilePath();
    this.reIndex();
  }
  /**
   * @inheritdoc
   */
  write(entry) {
    const fd = import_node_fs.default.openSync(this.#filePath, "a");
    try {
      const msg = this.#options.format(entry);
      import_node_fs.default.writeSync(fd, msg + "\n");
      this.#size += msg.length;
    } finally {
      import_node_fs.default.closeSync(fd);
    }
    if (this.#size >= this.#options.maxSize) {
      this.reIndex();
      this.#size = 0;
    }
  }
  /**
   * Gets the file path to an indexed log file.
   * @param index Optional index of the log file to be included as part of the file name.
   * @returns File path that represents the indexed log file.
   */
  getLogFilePath(index = 0) {
    return import_node_path.default.join(this.#options.dest, `${this.#options.fileName}.${index}.log`);
  }
  /**
   * Gets the log files associated with this file target, including past and present.
   * @returns Log file entries.
   */
  getLogFiles() {
    const regex = /^\.(\d+)\.log$/;
    return import_node_fs.default.readdirSync(this.#options.dest, { withFileTypes: true }).reduce((prev, entry) => {
      if (entry.isDirectory() || entry.name.indexOf(this.#options.fileName) < 0) {
        return prev;
      }
      const match = entry.name.substring(this.#options.fileName.length).match(regex);
      if (match?.length !== 2) {
        return prev;
      }
      prev.push({
        path: import_node_path.default.join(this.#options.dest, entry.name),
        index: parseInt(match[1])
      });
      return prev;
    }, []).sort(({ index: a }, { index: b }) => {
      return a < b ? -1 : a > b ? 1 : 0;
    });
  }
  /**
   * Re-indexes the existing log files associated with this file target, removing old log files whose index exceeds the {@link FileTargetOptions.maxFileCount}, and renaming the
   * remaining log files, leaving index "0" free for a new log file.
   */
  reIndex() {
    if (!import_node_fs.default.existsSync(this.#options.dest)) {
      import_node_fs.default.mkdirSync(this.#options.dest);
      return;
    }
    const logFiles = this.getLogFiles();
    for (let i = logFiles.length - 1; i >= 0; i--) {
      const log = logFiles[i];
      if (i >= this.#options.maxFileCount - 1) {
        import_node_fs.default.rmSync(log.path);
      } else {
        import_node_fs.default.renameSync(log.path, this.getLogFilePath(i + 1));
      }
    }
  }
};

// node_modules/@elgato/streamdeck/dist/plugin/logging/index.js
var import_node_path3 = __toESM(require("node:path"), 1);
var import_node_process = require("node:process");

// node_modules/@elgato/streamdeck/dist/plugin/common/utils.js
var import_node_path2 = __toESM(require("node:path"), 1);
var __isDebugMode = void 0;
function isDebugMode() {
  if (__isDebugMode === void 0) {
    __isDebugMode = process.execArgv.some((arg) => {
      const name = arg.split("=")[0];
      return name === "--inspect" || name === "--inspect-brk" || name === "--inspect-port";
    });
  }
  return __isDebugMode;
}
function getPluginUUID() {
  const name = import_node_path2.default.basename(process.cwd());
  const suffixIndex = name.lastIndexOf(".sdPlugin");
  return suffixIndex < 0 ? name : name.substring(0, suffixIndex);
}

// node_modules/@elgato/streamdeck/dist/plugin/logging/index.js
var fileTarget = new FileTarget({
  dest: import_node_path3.default.join((0, import_node_process.cwd)(), "logs"),
  fileName: getPluginUUID(),
  format: stringFormatter(),
  maxFileCount: 10,
  maxSize: 50 * 1024 * 1024
});
var targets = [fileTarget];
if (isDebugMode()) {
  targets.splice(0, 0, new ConsoleTarget());
}
var logger = new Logger({
  level: isDebugMode() ? "debug" : "info",
  minimumLevel: isDebugMode() ? "trace" : "debug",
  targets
});
process.once("uncaughtException", (err) => logger.error("Process encountered uncaught exception", err));

// node_modules/@elgato/streamdeck/dist/plugin/connection.js
var Connection = class extends EventEmitter {
  /**
   * Private backing field for {@link Connection.registrationParameters}.
   */
  _registrationParameters;
  /**
   * Private backing field for {@link Connection.version}.
   */
  _version;
  /**
   * Used to ensure {@link Connection.connect} is invoked as a singleton; `false` when a connection is occurring or established.
   */
  canConnect = true;
  /**
   * Underlying web socket connection.
   */
  connection = withResolvers();
  /**
   * Logger scoped to the connection.
   */
  logger = logger.createScope("Connection");
  /**
   * Underlying connection information provided to the plugin to establish a connection with Stream Deck.
   * @returns The registration parameters.
   */
  get registrationParameters() {
    return this._registrationParameters ??= this.getRegistrationParameters();
  }
  /**
   * Version of Stream Deck this instance is connected to.
   * @returns The version.
   */
  get version() {
    return this._version ??= new Version(this.registrationParameters.info.application.version);
  }
  /**
   * Establishes a connection with the Stream Deck, allowing for the plugin to send and receive messages.
   * @returns A promise that is resolved when a connection has been established.
   */
  async connect() {
    if (this.canConnect) {
      this.canConnect = false;
      const webSocket = new wrapper_default(`ws://127.0.0.1:${this.registrationParameters.port}`);
      webSocket.onmessage = (ev) => this.tryEmit(ev);
      webSocket.onopen = () => {
        webSocket.send(JSON.stringify({
          event: this.registrationParameters.registerEvent,
          uuid: this.registrationParameters.pluginUUID
        }));
        this.connection.resolve(webSocket);
        this.emit("connected", this.registrationParameters.info);
      };
    }
    await this.connection.promise;
  }
  /**
   * Sends the commands to the Stream Deck, once the connection has been established and registered.
   * @param command Command being sent.
   * @returns `Promise` resolved when the command is sent to Stream Deck.
   */
  async send(command) {
    const connection2 = await this.connection.promise;
    const message = JSON.stringify(command);
    this.logger.trace(message);
    connection2.send(message);
  }
  /**
   * Gets the registration parameters, provided by Stream Deck, that provide information to the plugin, including how to establish a connection.
   * @returns Parsed registration parameters.
   */
  getRegistrationParameters() {
    const params = {
      port: void 0,
      info: void 0,
      pluginUUID: void 0,
      registerEvent: void 0
    };
    const scopedLogger = logger.createScope("RegistrationParameters");
    for (let i = 0; i < process.argv.length - 1; i++) {
      const param = process.argv[i];
      const value = process.argv[++i];
      switch (param) {
        case RegistrationParameter.Port:
          scopedLogger.debug(`port=${value}`);
          params.port = value;
          break;
        case RegistrationParameter.PluginUUID:
          scopedLogger.debug(`pluginUUID=${value}`);
          params.pluginUUID = value;
          break;
        case RegistrationParameter.RegisterEvent:
          scopedLogger.debug(`registerEvent=${value}`);
          params.registerEvent = value;
          break;
        case RegistrationParameter.Info:
          scopedLogger.debug(`info=${value}`);
          params.info = JSON.parse(value);
          break;
        default:
          i--;
          break;
      }
    }
    const invalidArgs = [];
    const validate = (name, value) => {
      if (value === void 0) {
        invalidArgs.push(name);
      }
    };
    validate(RegistrationParameter.Port, params.port);
    validate(RegistrationParameter.PluginUUID, params.pluginUUID);
    validate(RegistrationParameter.RegisterEvent, params.registerEvent);
    validate(RegistrationParameter.Info, params.info);
    if (invalidArgs.length > 0) {
      throw new Error(`Unable to establish a connection with Stream Deck, missing command line arguments: ${invalidArgs.join(", ")}`);
    }
    return params;
  }
  /**
   * Attempts to emit the {@link ev} that was received from the {@link Connection.connection}.
   * @param ev Event message data received from Stream Deck.
   */
  tryEmit(ev) {
    try {
      const message = JSON.parse(ev.data.toString());
      if (message.event) {
        this.logger.trace(ev.data.toString());
        this.emit(message.event, message);
      } else {
        this.logger.warn(`Received unknown message: ${ev.data}`);
      }
    } catch (err) {
      this.logger.error(`Failed to parse message: ${ev.data}`, err);
    }
  }
};
var connection = new Connection();

// node_modules/@elgato/streamdeck/dist/plugin/events/event.js
var Event = class {
  /**
   * Event that occurred.
   */
  type;
  /**
   * Initializes a new instance of the {@link Event} class.
   * @param source Source of the event, i.e. the original message from Stream Deck.
   */
  constructor(source) {
    this.type = source.event;
  }
};

// node_modules/@elgato/streamdeck/dist/plugin/events/action-event.js
var ActionWithoutPayloadEvent = class extends Event {
  action;
  /**
   * Initializes a new instance of the {@link ActionWithoutPayloadEvent} class.
   * @param action Action that raised the event.
   * @param source Source of the event, i.e. the original message from Stream Deck.
   */
  constructor(action2, source) {
    super(source);
    this.action = action2;
  }
};
var ActionEvent = class extends ActionWithoutPayloadEvent {
  /**
   * Provides additional information about the event that occurred, e.g. how many `ticks` the dial was rotated, the current `state` of the action, etc.
   */
  payload;
  /**
   * Initializes a new instance of the {@link ActionEvent} class.
   * @param action Action that raised the event.
   * @param source Source of the event, i.e. the original message from Stream Deck.
   */
  constructor(action2, source) {
    super(action2, source);
    this.payload = source.payload;
  }
};

// node_modules/@elgato/streamdeck/dist/plugin/manifest.js
var import_node_fs2 = require("node:fs");
var import_node_path4 = require("node:path");
var manifest = new Lazy(() => {
  const path5 = (0, import_node_path4.join)(process.cwd(), "manifest.json");
  if (!(0, import_node_fs2.existsSync)(path5)) {
    throw new Error("Failed to read manifest.json as the file does not exist.");
  }
  try {
    return JSON.parse((0, import_node_fs2.readFileSync)(path5, {
      encoding: "utf-8",
      flag: "r"
    }).toString());
  } catch (e) {
    if (e instanceof SyntaxError) {
      return null;
    } else {
      throw e;
    }
  }
});
var softwareMinimumVersion = new Lazy(() => {
  if (manifest.value === null) {
    return null;
  }
  return new Version(manifest.value.Software.MinimumVersion);
});
function getSDKVersion() {
  return manifest.value?.SDKVersion ?? null;
}
function getSoftwareMinimumVersion() {
  return softwareMinimumVersion.value;
}
function getManifest() {
  return manifest.value;
}

// node_modules/@elgato/streamdeck/dist/plugin/settings.js
var import_node_crypto = require("node:crypto");

// node_modules/@elgato/streamdeck/dist/plugin/actions/store.js
var __items = /* @__PURE__ */ new Map();
var ReadOnlyActionStore = class extends Enumerable {
  /**
   * Initializes a new instance of the {@link ReadOnlyActionStore}.
   */
  constructor() {
    super(__items);
  }
  /**
   * Gets the action with the specified identifier.
   * @param id Identifier of action to search for.
   * @returns The action, when present; otherwise `undefined`.
   */
  getActionById(id) {
    return __items.get(id);
  }
};
var ActionStore = class extends ReadOnlyActionStore {
  /**
   * Deletes the action from the store.
   * @param id The action's identifier.
   */
  delete(id) {
    __items.delete(id);
  }
  /**
   * Adds the action to the store.
   * @param action The action.
   */
  set(action2) {
    __items.set(action2.id, action2);
  }
};
var actionStore = new ActionStore();

// node_modules/@elgato/streamdeck/dist/plugin/events/application-event.js
var ApplicationEvent = class extends Event {
  /**
   * Monitored application that was launched/terminated.
   */
  application;
  /**
   * Initializes a new instance of the {@link ApplicationEvent} class.
   * @param source Source of the event, i.e. the original message from Stream Deck.
   */
  constructor(source) {
    super(source);
    this.application = source.payload.application;
  }
};

// node_modules/@elgato/streamdeck/dist/plugin/events/device-event.js
var DeviceEvent = class extends Event {
  device;
  /**
   * Initializes a new instance of the {@link DeviceEvent} class.
   * @param source Source of the event, i.e. the original message from Stream Deck.
   * @param device Device that event is associated with.
   */
  constructor(source, device) {
    super(source);
    this.device = device;
  }
};

// node_modules/@elgato/streamdeck/dist/plugin/events/deep-link-event.js
var DidReceiveDeepLinkEvent = class extends Event {
  /**
   * Deep-link URL routed from Stream Deck.
   */
  url;
  /**
   * Initializes a new instance of the {@link DidReceiveDeepLinkEvent} class.
   * @param source Source of the event, i.e. the original message from Stream Deck.
   */
  constructor(source) {
    super(source);
    this.url = new DeepLinkURL(source.payload.url);
  }
};
var PREFIX = "streamdeck://";
var DeepLinkURL = class _DeepLinkURL {
  /**
   * Fragment of the URL, with the number sign (#) omitted. For example, a URL of "/test#heading" would result in a {@link DeepLinkURL.fragment} of "heading".
   */
  fragment;
  /**
   * Original URL. For example, a URL of "/test?one=two#heading" would result in a {@link DeepLinkURL.href} of "/test?one=two#heading".
   */
  href;
  /**
   * Path of the URL; the full URL with the query and fragment omitted. For example, a URL of "/test?one=two#heading" would result in a {@link DeepLinkURL.path} of "/test".
   */
  path;
  /**
   * Query of the URL, with the question mark (?) omitted. For example, a URL of "/test?name=elgato&key=123" would result in a {@link DeepLinkURL.query} of "name=elgato&key=123".
   * See also {@link DeepLinkURL.queryParameters}.
   */
  query;
  /**
   * Query string parameters parsed from the URL. See also {@link DeepLinkURL.query}.
   */
  queryParameters;
  /**
   * Initializes a new instance of the {@link DeepLinkURL} class.
   * @param url URL of the deep-link, with the schema and authority omitted.
   */
  constructor(url) {
    const refUrl = new URL(`${PREFIX}${url}`);
    this.fragment = refUrl.hash.substring(1);
    this.href = refUrl.href.substring(PREFIX.length);
    this.path = _DeepLinkURL.parsePath(this.href);
    this.query = refUrl.search.substring(1);
    this.queryParameters = refUrl.searchParams;
  }
  /**
   * Parses the {@link DeepLinkURL.path} from the specified {@link href}.
   * @param href Partial URL that contains the path to parse.
   * @returns The path of the URL.
   */
  static parsePath(href) {
    const indexOf = (char) => {
      const index = href.indexOf(char);
      return index >= 0 ? index : href.length;
    };
    return href.substring(0, Math.min(indexOf("?"), indexOf("#")));
  }
};

// node_modules/@elgato/streamdeck/dist/plugin/events/global-settings-event.js
var DidReceiveGlobalSettingsEvent = class extends Event {
  /**
   * Settings associated with the event.
   */
  settings;
  /**
   * Initializes a new instance of the {@link DidReceiveGlobalSettingsEvent} class.
   * @param source Source of the event, i.e. the original message from Stream Deck.
   */
  constructor(source) {
    super(source);
    this.settings = source.payload.settings;
  }
};

// node_modules/@elgato/streamdeck/dist/plugin/events/ui-message-event.js
var SendToPluginEvent = class extends Event {
  action;
  /**
   * Payload sent from the property inspector.
   */
  payload;
  /**
   * Initializes a new instance of the {@link SendToPluginEvent} class.
   * @param action Action that raised the event.
   * @param source Source of the event, i.e. the original message from Stream Deck.
   */
  constructor(action2, source) {
    super(source);
    this.action = action2;
    this.payload = source.payload;
  }
};

// node_modules/@elgato/streamdeck/dist/plugin/validation.js
function requiresSDKVersion(minimumVersion, feature) {
  const sdkVersion = getSDKVersion();
  if (sdkVersion !== null && minimumVersion > sdkVersion) {
    throw new Error(`[ERR_NOT_SUPPORTED]: ${feature} requires manifest SDK version ${minimumVersion} or higher, but found version ${sdkVersion}; please update the "SDKVersion" in the plugin's manifest to ${minimumVersion} or higher.`);
  }
}
function requiresVersion(minimumVersion, streamDeckVersion, feature) {
  const required = {
    major: Math.floor(minimumVersion),
    minor: Number(minimumVersion.toString().split(".").at(1) ?? 0),
    // Account for JavaScript's floating point precision.
    patch: 0,
    build: 0
  };
  if (streamDeckVersion.compareTo(required) === -1) {
    throw new Error(`[ERR_NOT_SUPPORTED]: ${feature} requires Stream Deck version ${required.major}.${required.minor} or higher, but current version is ${streamDeckVersion.major}.${streamDeckVersion.minor}; please update Stream Deck and the "Software.MinimumVersion" in the plugin's manifest to "${required.major}.${required.minor}" or higher.`);
  }
  const softwareMinimumVersion2 = getSoftwareMinimumVersion();
  if (softwareMinimumVersion2 !== null && softwareMinimumVersion2.compareTo(required) === -1) {
    throw new Error(`[ERR_NOT_SUPPORTED]: ${feature} requires Stream Deck version ${required.major}.${required.minor} or higher; please update the "Software.MinimumVersion" in the plugin's manifest to "${required.major}.${required.minor}" or higher.`);
  }
}

// node_modules/@elgato/streamdeck/dist/plugin/settings.js
var __useExperimentalMessageIdentifiers = false;
var settings = {
  /**
   * Available from Stream Deck 7.1; determines whether message identifiers should be sent when getting
   * action-instance or global settings.
   *
   * When `true`, the did-receive events associated with settings are only emitted when the action-instance
   * or global settings are changed in the property inspector.
   * @returns The value.
   */
  get useExperimentalMessageIdentifiers() {
    return __useExperimentalMessageIdentifiers;
  },
  /**
   * Available from Stream Deck 7.1; determines whether message identifiers should be sent when getting
   * action-instance or global settings.
   *
   * When `true`, the did-receive events associated with settings are only emitted when the action-instance
   * or global settings are changed in the property inspector.
   */
  set useExperimentalMessageIdentifiers(value) {
    requiresVersion(7.1, connection.version, "Message identifiers");
    __useExperimentalMessageIdentifiers = value;
  },
  /**
   * Gets the global settings associated with the plugin.
   * @template T The type of global settings associated with the plugin.
   * @returns Promise containing the plugin's global settings.
   */
  getGlobalSettings: () => {
    return new Promise((resolve) => {
      connection.once("didReceiveGlobalSettings", (ev) => resolve(ev.payload.settings));
      connection.send({
        event: "getGlobalSettings",
        context: connection.registrationParameters.pluginUUID,
        id: (0, import_node_crypto.randomUUID)()
      });
    });
  },
  /**
   * Occurs when the global settings are requested, or when the the global settings were updated in
   * the property inspector.
   * @template T The type of settings associated with the action.
   * @param listener Function to be invoked when the event occurs.
   * @returns A disposable that removes the listener.
   */
  onDidReceiveGlobalSettings: (listener) => {
    return connection.disposableOn("didReceiveGlobalSettings", (ev) => {
      if (settings.useExperimentalMessageIdentifiers && ev.id) {
        return;
      }
      listener(new DidReceiveGlobalSettingsEvent(ev));
    });
  },
  /**
   * Occurs when the settings associated with an action instance are requested, or when the the settings
   * were updated in the property inspector.
   * @template T The type of settings associated with the action.
   * @param listener Function to be invoked when the event occurs.
   * @returns A disposable that removes the listener.
   */
  onDidReceiveSettings: (listener) => {
    return connection.disposableOn("didReceiveSettings", (ev) => {
      if (settings.useExperimentalMessageIdentifiers && ev.id) {
        return;
      }
      const action2 = actionStore.getActionById(ev.context);
      if (action2) {
        listener(new ActionEvent(action2, ev));
      }
    });
  },
  /**
   * Sets the global settings associated the plugin; these settings are only available to this plugin,
   * and should be used to persist information securely.
   * @param settings Settings to save.
   * @example
   * streamDeck.settings.setGlobalSettings({
   *   apiKey,
   *   connectedDate: new Date()
   * })
   */
  setGlobalSettings: async (settings2) => {
    await connection.send({
      event: "setGlobalSettings",
      context: connection.registrationParameters.pluginUUID,
      payload: settings2
    });
  }
};

// node_modules/@elgato/streamdeck/dist/plugin/ui.js
var UIController = class {
  /**
   * Action associated with the current property inspector.
   */
  #action;
  /**
   * To overcome event races, the debounce counter keeps track of appear vs disappear events, ensuring
   * we only clear the current ui when an equal number of matching disappear events occur.
   */
  #appearanceStackCount = 0;
  /**
   * Initializes a new instance of the {@link UIController} class.
   */
  constructor() {
    this.onDidAppear((ev) => {
      if (this.#isCurrent(ev.action)) {
        this.#appearanceStackCount++;
      } else {
        this.#appearanceStackCount = 1;
        this.#action = ev.action;
      }
    });
    this.onDidDisappear((ev) => {
      if (this.#isCurrent(ev.action)) {
        this.#appearanceStackCount--;
        if (this.#appearanceStackCount <= 0) {
          this.#action = void 0;
        }
      }
    });
  }
  /**
   * Gets the action associated with the current property.
   * @returns The action; otherwise `undefined` when a property inspector is not visible.
   */
  get action() {
    return this.#action;
  }
  /**
   * Occurs when the property inspector associated with the action becomes visible, i.e. the user
   * selected an action in the Stream Deck application..
   * @template T The type of settings associated with the action.
   * @param listener Function to be invoked when the event occurs.
   * @returns A disposable that, when disposed, removes the listener.
   */
  onDidAppear(listener) {
    return connection.disposableOn("propertyInspectorDidAppear", (ev) => {
      const action2 = actionStore.getActionById(ev.context);
      if (action2) {
        listener(new ActionWithoutPayloadEvent(action2, ev));
      }
    });
  }
  /**
   * Occurs when the property inspector associated with the action disappears, i.e. the user unselected
   * the action in the Stream Deck application.
   * @template T The type of settings associated with the action.
   * @param listener Function to be invoked when the event occurs.
   * @returns A disposable that, when disposed, removes the listener.
   */
  onDidDisappear(listener) {
    return connection.disposableOn("propertyInspectorDidDisappear", (ev) => {
      const action2 = actionStore.getActionById(ev.context);
      if (action2) {
        listener(new ActionWithoutPayloadEvent(action2, ev));
      }
    });
  }
  /**
   * Occurs when a message was sent to the plugin _from_ the property inspector.
   * @template TPayload The type of the payload received from the property inspector.
   * @template TSettings The type of settings associated with the action.
   * @param listener Function to be invoked when the event occurs.
   * @returns A disposable that, when disposed, removes the listener.
   */
  onSendToPlugin(listener) {
    return connection.disposableOn("sendToPlugin", (ev) => {
      const action2 = actionStore.getActionById(ev.context);
      if (action2) {
        listener(new SendToPluginEvent(action2, ev));
      }
    });
  }
  /**
   * Sends the payload to the property inspector; the payload is only sent when the property inspector
   * is visible for an action provided by this plugin.
   * @param payload Payload to send.
   */
  async sendToPropertyInspector(payload) {
    if (this.#action) {
      await connection.send({
        event: "sendToPropertyInspector",
        context: this.#action.id,
        payload
      });
    }
  }
  /**
   * Determines whether the specified action is the action for the current property inspector.
   * @param action Action to check against.
   * @returns `true` when the actions are the same.
   */
  #isCurrent(action2) {
    return this.#action?.id === action2.id && this.#action?.manifestId === action2.manifestId && this.#action?.device?.id === action2.device.id;
  }
};
var ui = new UIController();

// node_modules/@elgato/streamdeck/dist/plugin/actions/action.js
var import_node_crypto2 = require("node:crypto");

// node_modules/@elgato/streamdeck/dist/plugin/devices/store.js
var __items2 = /* @__PURE__ */ new Map();
var ReadOnlyDeviceStore = class extends Enumerable {
  /**
   * Initializes a new instance of the {@link ReadOnlyDeviceStore}.
   */
  constructor() {
    super(__items2);
  }
  /**
   * Gets the Stream Deck {@link Device} associated with the specified {@link deviceId}.
   * @param deviceId Identifier of the Stream Deck device.
   * @returns The Stream Deck device information; otherwise `undefined` if a device with the {@link deviceId} does not exist.
   */
  getDeviceById(deviceId) {
    return __items2.get(deviceId);
  }
};
var DeviceStore = class extends ReadOnlyDeviceStore {
  /**
   * Adds the device to the store.
   * @param device The device.
   */
  set(device) {
    __items2.set(device.id, device);
  }
};
var deviceStore = new DeviceStore();

// node_modules/@elgato/streamdeck/dist/plugin/actions/context.js
var ActionContext = class {
  /**
   * Device the action is associated with.
   */
  #device;
  /**
   * Source of the action.
   */
  #source;
  /**
   * Initializes a new instance of the {@link ActionContext} class.
   * @param source Source of the action.
   */
  constructor(source) {
    this.#source = source;
    const device = deviceStore.getDeviceById(source.device);
    if (!device) {
      throw new Error(`Failed to initialize action; device ${source.device} not found`);
    }
    this.#device = device;
  }
  /**
   * Type of the action.
   * - `Keypad` is a key.
   * - `Encoder` is a dial and portion of the touch strip.
   * @returns Controller type.
   */
  get controllerType() {
    return this.#source.payload.controller;
  }
  /**
   * Stream Deck device the action is positioned on.
   * @returns Stream Deck device.
   */
  get device() {
    return this.#device;
  }
  /**
   * Action instance identifier.
   * @returns Identifier.
   */
  get id() {
    return this.#source.context;
  }
  /**
   * Manifest identifier (UUID) for this action type.
   * @returns Manifest identifier.
   */
  get manifestId() {
    return this.#source.action;
  }
  /**
   * Converts this instance to a serializable object.
   * @returns The serializable object.
   */
  toJSON() {
    return {
      controllerType: this.controllerType,
      device: this.device,
      id: this.id,
      manifestId: this.manifestId
    };
  }
};

// node_modules/@elgato/streamdeck/dist/plugin/actions/action.js
var REQUEST_TIMEOUT = 15 * 1e3;
var Action = class extends ActionContext {
  /**
   * Gets the resources (files) associated with this action; these resources are embedded into the
   * action when it is exported, either individually, or as part of a profile.
   *
   * Available from Stream Deck 7.1.
   * @returns The resources.
   */
  async getResources() {
    requiresVersion(7.1, connection.version, "getResources");
    const res = await this.#fetch("getResources", "didReceiveResources");
    return res.payload.resources;
  }
  /**
   * Gets the settings associated this action instance.
   * @template U The type of settings associated with the action.D
   * @returns Promise containing the action instance's settings.
   */
  async getSettings() {
    const res = await this.#fetch("getSettings", "didReceiveSettings");
    return res.payload.settings;
  }
  /**
   * Determines whether this instance is a dial.
   * @returns `true` when this instance is a dial; otherwise `false`.
   */
  isDial() {
    return this.controllerType === "Encoder";
  }
  /**
   * Determines whether this instance is a key.
   * @returns `true` when this instance is a key; otherwise `false`.
   */
  isKey() {
    return this.controllerType === "Keypad";
  }
  /**
   * Sets the resources (files) associated with this action; these resources are embedded into the
   * action when it is exported, either individually, or as part of a profile.
   *
   * Available from Stream Deck 7.1.
   * @example
   * action.setResources({
   *   fileOne: "c:\\hello-world.txt",
   *   anotherFile: "c:\\icon.png"
   * });
   * @param resources The resources as a map of file paths.
   * @returns `Promise` resolved when the resources are saved to Stream Deck.
   */
  setResources(resources) {
    requiresVersion(7.1, connection.version, "setResources");
    return connection.send({
      event: "setResources",
      context: this.id,
      payload: resources
    });
  }
  /**
   * Sets the {@link settings} associated with this action instance. Use in conjunction with {@link Action.getSettings}.
   * @param settings Settings to persist.
   * @returns `Promise` resolved when the {@link settings} are sent to Stream Deck.
   */
  setSettings(settings2) {
    return connection.send({
      event: "setSettings",
      context: this.id,
      payload: settings2
    });
  }
  /**
   * Temporarily shows an alert (i.e. warning), in the form of an exclamation mark in a yellow triangle, on this action instance. Used to provide visual feedback when an action failed.
   * @returns `Promise` resolved when the request to show an alert has been sent to Stream Deck.
   */
  showAlert() {
    return connection.send({
      event: "showAlert",
      context: this.id
    });
  }
  /**
   * Fetches information from Stream Deck by sending the command, and awaiting the event.
   * @param command Name of the event (command) to send.
   * @param event Name of the event to await.
   * @returns The payload from the received event.
   */
  async #fetch(command, event) {
    const { resolve, reject, promise } = withResolvers();
    const timeoutId = setTimeout(() => {
      listener.dispose();
      reject("The request timed out");
    }, REQUEST_TIMEOUT);
    const listener = connection.disposableOn(event, (ev) => {
      if (ev.context == this.id) {
        clearTimeout(timeoutId);
        listener.dispose();
        resolve(ev);
      }
    });
    await connection.send({
      event: command,
      context: this.id,
      id: (0, import_node_crypto2.randomUUID)()
    });
    return promise;
  }
};

// node_modules/@elgato/streamdeck/dist/plugin/actions/dial.js
var DialAction = class extends Action {
  /**
   * Private backing field for {@link DialAction.coordinates}.
   */
  #coordinates;
  /**
   * Initializes a new instance of the {@see DialAction} class.
   * @param source Source of the action.
   */
  constructor(source) {
    super(source);
    if (source.payload.controller !== "Encoder") {
      throw new Error("Unable to create DialAction; source event is not a Encoder");
    }
    this.#coordinates = Object.freeze(source.payload.coordinates);
  }
  /**
   * Coordinates of the dial.
   * @returns The coordinates.
   */
  get coordinates() {
    return this.#coordinates;
  }
  /**
   * Sets the feedback for the current layout associated with this action instance, allowing for the visual items to be updated. Layouts are a powerful way to provide dynamic information
   * to users, and can be assigned in the manifest, or dynamically via {@link Action.setFeedbackLayout}.
   *
   * The {@link feedback} payload defines which items within the layout will be updated, and are identified by their property name (defined as the `key` in the layout's definition).
   * The values can either by a complete new definition, a `string` for layout item types of `text` and `pixmap`, or a `number` for layout item types of `bar` and `gbar`.
   * @param feedback Object containing information about the layout items to be updated.
   * @returns `Promise` resolved when the request to set the {@link feedback} has been sent to Stream Deck.
   */
  setFeedback(feedback) {
    return connection.send({
      event: "setFeedback",
      context: this.id,
      payload: feedback
    });
  }
  /**
   * Sets the layout associated with this action instance. The layout must be either a built-in layout identifier, or path to a local layout JSON file within the plugin's folder.
   * Use in conjunction with {@link Action.setFeedback} to update the layout's current items' settings.
   * @param layout Name of a pre-defined layout, or relative path to a custom one.
   * @returns `Promise` resolved when the new layout has been sent to Stream Deck.
   */
  setFeedbackLayout(layout) {
    return connection.send({
      event: "setFeedbackLayout",
      context: this.id,
      payload: {
        layout
      }
    });
  }
  /**
   * Sets the {@link image} to be display for this action instance within Stream Deck app.
   *
   * NB: The image can only be set by the plugin when the the user has not specified a custom image.
   * @param image Image to display; this can be either a path to a local file within the plugin's folder, a base64 encoded `string` with the mime type declared (e.g. PNG, JPEG, etc.),
   * or an SVG `string`. When `undefined`, the image from the manifest will be used.
   * @returns `Promise` resolved when the request to set the {@link image} has been sent to Stream Deck.
   */
  setImage(image) {
    return connection.send({
      event: "setImage",
      context: this.id,
      payload: {
        image
      }
    });
  }
  /**
   * Sets the {@link title} displayed for this action instance.
   *
   * NB: The title can only be set by the plugin when the the user has not specified a custom title.
   * @param title Title to display.
   * @returns `Promise` resolved when the request to set the {@link title} has been sent to Stream Deck.
   */
  setTitle(title) {
    return this.setFeedback({ title });
  }
  /**
   * Sets the trigger (interaction) {@link descriptions} associated with this action instance. Descriptions are shown within the Stream Deck application, and informs the user what
   * will happen when they interact with the action, e.g. rotate, touch, etc. When {@link descriptions} is `undefined`, the descriptions will be reset to the values provided as part
   * of the manifest.
   *
   * NB: Applies to encoders (dials / touchscreens) found on Stream Deck + devices.
   * @param descriptions Descriptions that detail the action's interaction.
   * @returns `Promise` resolved when the request to set the {@link descriptions} has been sent to Stream Deck.
   */
  setTriggerDescription(descriptions) {
    return connection.send({
      event: "setTriggerDescription",
      context: this.id,
      payload: descriptions || {}
    });
  }
  /**
   * @inheritdoc
   */
  toJSON() {
    return {
      ...super.toJSON(),
      coordinates: this.coordinates
    };
  }
};

// node_modules/@elgato/streamdeck/dist/plugin/actions/key.js
var KeyAction = class extends Action {
  /**
   * Private backing field for {@link KeyAction.coordinates}.
   */
  #coordinates;
  /**
   * Source of the action.
   */
  #source;
  /**
   * Initializes a new instance of the {@see KeyAction} class.
   * @param source Source of the action.
   */
  constructor(source) {
    super(source);
    if (source.payload.controller !== "Keypad") {
      throw new Error("Unable to create KeyAction; source event is not a Keypad");
    }
    this.#coordinates = !source.payload.isInMultiAction ? Object.freeze(source.payload.coordinates) : void 0;
    this.#source = source;
  }
  /**
   * Coordinates of the key; otherwise `undefined` when the action is part of a multi-action.
   * @returns The coordinates.
   */
  get coordinates() {
    return this.#coordinates;
  }
  /**
   * Determines whether the key is part of a multi-action.
   * @returns `true` when in a multi-action; otherwise `false`.
   */
  isInMultiAction() {
    return this.#source.payload.isInMultiAction;
  }
  /**
   * Sets the {@link image} to be display for this action instance.
   *
   * NB: The image can only be set by the plugin when the the user has not specified a custom image.
   * @param image Image to display; this can be either a path to a local file within the plugin's folder, a base64 encoded `string` with the mime type declared (e.g. PNG, JPEG, etc.),
   * or an SVG `string`. When `undefined`, the image from the manifest will be used.
   * @param options Additional options that define where and how the image should be rendered.
   * @returns `Promise` resolved when the request to set the {@link image} has been sent to Stream Deck.
   */
  setImage(image, options) {
    return connection.send({
      event: "setImage",
      context: this.id,
      payload: {
        image,
        ...options
      }
    });
  }
  /**
   * Sets the current {@link state} of this action instance; only applies to actions that have multiple states defined within the manifest.
   * @param state State to set; this be either 0, or 1.
   * @returns `Promise` resolved when the request to set the state of an action instance has been sent to Stream Deck.
   */
  setState(state) {
    return connection.send({
      event: "setState",
      context: this.id,
      payload: {
        state
      }
    });
  }
  /**
   * Sets the {@link title} displayed for this action instance.
   *
   * NB: The title can only be set by the plugin when the the user has not specified a custom title.
   * @param title Title to display; when `undefined` the title within the manifest will be used.
   * @param options Additional options that define where and how the title should be rendered.
   * @returns `Promise` resolved when the request to set the {@link title} has been sent to Stream Deck.
   */
  setTitle(title, options) {
    return connection.send({
      event: "setTitle",
      context: this.id,
      payload: {
        title,
        ...options
      }
    });
  }
  /**
   * Temporarily shows an "OK" (i.e. success), in the form of a check-mark in a green circle, on this action instance. Used to provide visual feedback when an action successfully
   * executed.
   * @returns `Promise` resolved when the request to show an "OK" has been sent to Stream Deck.
   */
  showOk() {
    return connection.send({
      event: "showOk",
      context: this.id
    });
  }
  /**
   * @inheritdoc
   */
  toJSON() {
    return {
      ...super.toJSON(),
      coordinates: this.coordinates,
      isInMultiAction: this.isInMultiAction()
    };
  }
};

// node_modules/@elgato/streamdeck/dist/plugin/actions/service.js
var manifest2 = new Lazy(() => getManifest());
var ActionService = class extends ReadOnlyActionStore {
  /**
   * Initializes a new instance of the {@link ActionService} class.
   */
  constructor() {
    super();
    connection.prependListener("willAppear", (ev) => {
      const action2 = ev.payload.controller === "Encoder" ? new DialAction(ev) : new KeyAction(ev);
      actionStore.set(action2);
    });
    connection.prependListener("willDisappear", (ev) => actionStore.delete(ev.context));
  }
  /**
   * Occurs when the user presses a dial (Stream Deck +).
   * @template T The type of settings associated with the action.
   * @param listener Function to be invoked when the event occurs.
   * @returns A disposable that, when disposed, removes the listener.
   */
  onDialDown(listener) {
    return connection.disposableOn("dialDown", (ev) => {
      const action2 = actionStore.getActionById(ev.context);
      if (action2?.isDial()) {
        listener(new ActionEvent(action2, ev));
      }
    });
  }
  /**
   * Occurs when the user rotates a dial (Stream Deck +).
   * @template T The type of settings associated with the action.
   * @param listener Function to be invoked when the event occurs.
   * @returns A disposable that, when disposed, removes the listener.
   */
  onDialRotate(listener) {
    return connection.disposableOn("dialRotate", (ev) => {
      const action2 = actionStore.getActionById(ev.context);
      if (action2?.isDial()) {
        listener(new ActionEvent(action2, ev));
      }
    });
  }
  /**
   * Occurs when the user releases a pressed dial (Stream Deck +).
   * @template T The type of settings associated with the action.
   * @param listener Function to be invoked when the event occurs.
   * @returns A disposable that, when disposed, removes the listener.
   */
  onDialUp(listener) {
    return connection.disposableOn("dialUp", (ev) => {
      const action2 = actionStore.getActionById(ev.context);
      if (action2?.isDial()) {
        listener(new ActionEvent(action2, ev));
      }
    });
  }
  /**
   * Occurs when the resources were updated within the property inspector.
   * @param listener Function to be invoked when the event occurs.
   * @returns A disposable that, when disposed, removes the listener.
   */
  onDidReceiveResources(listener) {
    return connection.disposableOn("didReceiveResources", (ev) => {
      if (ev.id !== void 0) {
        return;
      }
      const action2 = actionStore.getActionById(ev.context);
      if (action2) {
        listener(new ActionEvent(action2, ev));
      }
    });
  }
  /**
   * Occurs when the user presses a action down.
   * @template T The type of settings associated with the action.
   * @param listener Function to be invoked when the event occurs.
   * @returns A disposable that, when disposed, removes the listener.
   */
  onKeyDown(listener) {
    return connection.disposableOn("keyDown", (ev) => {
      const action2 = actionStore.getActionById(ev.context);
      if (action2?.isKey()) {
        listener(new ActionEvent(action2, ev));
      }
    });
  }
  /**
   * Occurs when the user releases a pressed action.
   * @template T The type of settings associated with the action.
   * @param listener Function to be invoked when the event occurs.
   * @returns A disposable that, when disposed, removes the listener.
   */
  onKeyUp(listener) {
    return connection.disposableOn("keyUp", (ev) => {
      const action2 = actionStore.getActionById(ev.context);
      if (action2?.isKey()) {
        listener(new ActionEvent(action2, ev));
      }
    });
  }
  /**
   * Occurs when the user updates an action's title settings in the Stream Deck application. See also {@link Action.setTitle}.
   * @template T The type of settings associated with the action.
   * @param listener Function to be invoked when the event occurs.
   * @returns A disposable that, when disposed, removes the listener.
   */
  onTitleParametersDidChange(listener) {
    return connection.disposableOn("titleParametersDidChange", (ev) => {
      const action2 = actionStore.getActionById(ev.context);
      if (action2) {
        listener(new ActionEvent(action2, ev));
      }
    });
  }
  /**
   * Occurs when the user taps the touchscreen (Stream Deck +).
   * @template T The type of settings associated with the action.
   * @param listener Function to be invoked when the event occurs.
   * @returns A disposable that, when disposed, removes the listener.
   */
  onTouchTap(listener) {
    return connection.disposableOn("touchTap", (ev) => {
      const action2 = actionStore.getActionById(ev.context);
      if (action2?.isDial()) {
        listener(new ActionEvent(action2, ev));
      }
    });
  }
  /**
   * Occurs when an action appears on the Stream Deck due to the user navigating to another page, profile, folder, etc. This also occurs during startup if the action is on the "front
   * page". An action refers to _all_ types of actions, e.g. keys, dials,
   * @template T The type of settings associated with the action.
   * @param listener Function to be invoked when the event occurs.
   * @returns A disposable that, when disposed, removes the listener.
   */
  onWillAppear(listener) {
    return connection.disposableOn("willAppear", (ev) => {
      const action2 = actionStore.getActionById(ev.context);
      if (action2) {
        listener(new ActionEvent(action2, ev));
      }
    });
  }
  /**
   * Occurs when an action disappears from the Stream Deck due to the user navigating to another page, profile, folder, etc. An action refers to _all_ types of actions, e.g. keys,
   * dials, touchscreens, pedals, etc.
   * @template T The type of settings associated with the action.
   * @param listener Function to be invoked when the event occurs.
   * @returns A disposable that, when disposed, removes the listener.
   */
  onWillDisappear(listener) {
    return connection.disposableOn("willDisappear", (ev) => listener(new ActionEvent(new ActionContext(ev), ev)));
  }
  /**
   * Registers the action with the Stream Deck, routing all events associated with the {@link SingletonAction.manifestId} to the specified {@link action}.
   * @param action The action to register.
   * @example
   * ＠action({ UUID: "com.elgato.test.action" })
   * class MyCustomAction extends SingletonAction {
   *     export function onKeyDown(ev: KeyDownEvent) {
   *         // Do some awesome thing.
   *     }
   * }
   *
   * streamDeck.actions.registerAction(new MyCustomAction());
   */
  registerAction(action2) {
    if (action2.manifestId === void 0) {
      throw new Error("The action's manifestId cannot be undefined.");
    }
    if (manifest2.value !== null && !manifest2.value.Actions.some((a) => a.UUID === action2.manifestId)) {
      throw new Error(`The action's manifestId was not found within the manifest: ${action2.manifestId}`);
    }
    const { manifestId } = action2;
    const route = (fn, listener) => {
      const boundedListener = listener?.bind(action2);
      if (boundedListener === void 0) {
        return;
      }
      fn.bind(action2)(async (ev) => {
        if (ev.action.manifestId == manifestId) {
          await boundedListener(ev);
        }
      });
    };
    route(this.onDialDown, action2.onDialDown);
    route(this.onDialUp, action2.onDialUp);
    route(this.onDialRotate, action2.onDialRotate);
    route(ui.onSendToPlugin, action2.onSendToPlugin);
    route(this.onDidReceiveResources, action2.onDidReceiveResources);
    route(settings.onDidReceiveSettings, action2.onDidReceiveSettings);
    route(this.onKeyDown, action2.onKeyDown);
    route(this.onKeyUp, action2.onKeyUp);
    route(ui.onDidAppear, action2.onPropertyInspectorDidAppear);
    route(ui.onDidDisappear, action2.onPropertyInspectorDidDisappear);
    route(this.onTitleParametersDidChange, action2.onTitleParametersDidChange);
    route(this.onTouchTap, action2.onTouchTap);
    route(this.onWillAppear, action2.onWillAppear);
    route(this.onWillDisappear, action2.onWillDisappear);
  }
};
var actionService = new ActionService();

// node_modules/@elgato/streamdeck/dist/plugin/devices/device.js
var Device = class {
  /**
   * Private backing field for {@link Device.isConnected}.
   */
  #isConnected = false;
  /**
   * Private backing field for the device's information.
   */
  #info;
  /**
   * Unique identifier of the device.
   */
  id;
  /**
   * Initializes a new instance of the {@link Device} class.
   * @param id Device identifier.
   * @param info Information about the device.
   * @param isConnected Determines whether the device is connected.
   */
  constructor(id, info, isConnected) {
    this.id = id;
    this.#info = info;
    this.#isConnected = isConnected;
    connection.prependListener("deviceDidConnect", (ev) => {
      if (ev.device === this.id) {
        this.#info = ev.deviceInfo;
        this.#isConnected = true;
      }
    });
    connection.prependListener("deviceDidChange", (ev) => {
      if (ev.device === this.id) {
        this.#info = ev.deviceInfo;
      }
    });
    connection.prependListener("deviceDidDisconnect", (ev) => {
      if (ev.device === this.id) {
        this.#isConnected = false;
      }
    });
  }
  /**
   * Actions currently visible on the device.
   * @returns Collection of visible actions.
   */
  get actions() {
    return actionStore.filter((a) => a.device.id === this.id);
  }
  /**
   * Determines whether the device is currently connected.
   * @returns `true` when the device is connected; otherwise `false`.
   */
  get isConnected() {
    return this.#isConnected;
  }
  /**
   * Name of the device, as specified by the user in the Stream Deck application.
   * @returns Name of the device.
   */
  get name() {
    return this.#info.name;
  }
  /**
   * Number of action slots, excluding dials / touchscreens, available to the device.
   * @returns Size of the device.
   */
  get size() {
    return this.#info.size;
  }
  /**
   * Type of the device that was connected, e.g. Stream Deck +, Stream Deck Pedal, etc. See {@link DeviceType}.
   * @returns Type of the device.
   */
  get type() {
    return this.#info.type;
  }
};

// node_modules/@elgato/streamdeck/dist/plugin/devices/service.js
var DeviceService = class extends ReadOnlyDeviceStore {
  /**
   * Initializes a new instance of the {@link DeviceService}.
   */
  constructor() {
    super();
    connection.once("connected", (info) => {
      info.devices.forEach((dev) => deviceStore.set(new Device(dev.id, dev, false)));
    });
    connection.on("deviceDidConnect", ({ device: id, deviceInfo }) => {
      if (!deviceStore.getDeviceById(id)) {
        deviceStore.set(new Device(id, deviceInfo, true));
      }
    });
    connection.on("deviceDidChange", ({ device: id, deviceInfo }) => {
      if (!deviceStore.getDeviceById(id)) {
        deviceStore.set(new Device(id, deviceInfo, false));
      }
    });
  }
  /**
   * Occurs when a Stream Deck device changed, for example its name or size.
   *
   * Available from Stream Deck 7.0.
   * @param listener Function to be invoked when the event occurs.
   * @returns A disposable that, when disposed, removes the listener.
   */
  onDeviceDidChange(listener) {
    requiresVersion(7, connection.version, "onDeviceDidChange");
    return connection.disposableOn("deviceDidChange", (ev) => listener(new DeviceEvent(ev, this.getDeviceById(ev.device))));
  }
  /**
   * Occurs when a Stream Deck device is connected. See also {@link DeviceService.onDeviceDidConnect}.
   * @param listener Function to be invoked when the event occurs.
   * @returns A disposable that, when disposed, removes the listener.
   */
  onDeviceDidConnect(listener) {
    return connection.disposableOn("deviceDidConnect", (ev) => listener(new DeviceEvent(ev, this.getDeviceById(ev.device))));
  }
  /**
   * Occurs when a Stream Deck device is disconnected. See also {@link DeviceService.onDeviceDidDisconnect}.
   * @param listener Function to be invoked when the event occurs.
   * @returns A disposable that, when disposed, removes the listener.
   */
  onDeviceDidDisconnect(listener) {
    return connection.disposableOn("deviceDidDisconnect", (ev) => listener(new DeviceEvent(ev, this.getDeviceById(ev.device))));
  }
};
var deviceService = new DeviceService();

// node_modules/@elgato/streamdeck/dist/plugin/i18n.js
var import_node_fs3 = __toESM(require("node:fs"), 1);
var import_node_path5 = __toESM(require("node:path"), 1);
function fileSystemLocaleProvider(language) {
  const filePath = import_node_path5.default.join(process.cwd(), `${language}.json`);
  if (!import_node_fs3.default.existsSync(filePath)) {
    return null;
  }
  try {
    const contents = import_node_fs3.default.readFileSync(filePath, { flag: "r" })?.toString();
    return parseLocalizations(contents);
  } catch (err) {
    logger.error(`Failed to load translations from ${filePath}`, err);
    return null;
  }
}
function parseLocalizations(contents) {
  const json = JSON.parse(contents);
  if (json !== void 0 && json !== null && typeof json === "object" && "Localization" in json) {
    return json["Localization"];
  }
  throw new TypeError(`Translations must be a JSON object nested under a property named "Localization"`);
}

// node_modules/@elgato/streamdeck/dist/plugin/profiles.js
var profiles_exports = {};
__export(profiles_exports, {
  switchToProfile: () => switchToProfile
});
function switchToProfile(deviceId, profile, page) {
  if (page !== void 0) {
    requiresVersion(6.5, connection.version, "Switching to a profile page");
  }
  return connection.send({
    event: "switchToProfile",
    context: connection.registrationParameters.pluginUUID,
    device: deviceId,
    payload: {
      page,
      profile
    }
  });
}

// node_modules/@elgato/streamdeck/dist/plugin/system.js
var system_exports = {};
__export(system_exports, {
  getSecrets: () => getSecrets,
  onApplicationDidLaunch: () => onApplicationDidLaunch,
  onApplicationDidTerminate: () => onApplicationDidTerminate,
  onDidReceiveDeepLink: () => onDidReceiveDeepLink,
  onSystemDidWakeUp: () => onSystemDidWakeUp,
  openUrl: () => openUrl
});
function onApplicationDidLaunch(listener) {
  return connection.disposableOn("applicationDidLaunch", (ev) => listener(new ApplicationEvent(ev)));
}
function onApplicationDidTerminate(listener) {
  return connection.disposableOn("applicationDidTerminate", (ev) => listener(new ApplicationEvent(ev)));
}
function onDidReceiveDeepLink(listener) {
  requiresVersion(6.5, connection.version, "Receiving deep-link messages");
  return connection.disposableOn("didReceiveDeepLink", (ev) => listener(new DidReceiveDeepLinkEvent(ev)));
}
function onSystemDidWakeUp(listener) {
  return connection.disposableOn("systemDidWakeUp", (ev) => listener(new Event(ev)));
}
function openUrl(url) {
  return connection.send({
    event: "openUrl",
    payload: {
      url
    }
  });
}
function getSecrets() {
  requiresVersion(6.9, connection.version, "Secrets");
  requiresSDKVersion(3, "Secrets");
  return new Promise((resolve) => {
    connection.once("didReceiveSecrets", (ev) => resolve(ev.payload.secrets));
    connection.send({
      event: "getSecrets",
      context: connection.registrationParameters.pluginUUID
    });
  });
}

// node_modules/@elgato/streamdeck/dist/plugin/actions/decorators.js
function action(definition) {
  const manifestId = definition.UUID;
  return function(target, context) {
    return class extends target {
      /**
       * The universally-unique value that identifies the action within the manifest.
       */
      manifestId = manifestId;
    };
  };
}

// node_modules/@elgato/streamdeck/dist/plugin/actions/singleton-action.js
var SingletonAction = class {
  /**
   * The universally-unique value that identifies the action within the manifest.
   */
  manifestId;
  /**
   * Gets the visible actions with the `manifestId` that match this instance's.
   * @returns The visible actions.
   */
  get actions() {
    return actionStore.filter((a) => a.manifestId === this.manifestId);
  }
};

// node_modules/@elgato/streamdeck/dist/plugin/index.js
var i18n;
var streamDeck = {
  /**
   * Namespace for event listeners and functionality relating to Stream Deck actions.
   * @returns Actions namespace.
   */
  get actions() {
    return actionService;
  },
  /**
   * Namespace for interacting with Stream Deck devices.
   * @returns Devices namespace.
   */
  get devices() {
    return deviceService;
  },
  /**
   * Internalization provider, responsible for managing localizations and translating resources.
   * @returns Internalization provider.
   */
  get i18n() {
    return i18n ??= new I18nProvider(this.info.application.language, fileSystemLocaleProvider);
  },
  /**
   * Registration and application information provided by Stream Deck during initialization.
   * @returns Registration information.
   */
  get info() {
    return connection.registrationParameters.info;
  },
  /**
   * Logger responsible for capturing log messages.
   * @returns The logger.
   */
  get logger() {
    return logger;
  },
  /**
   * Namespace for Stream Deck profiles.
   * @returns Profiles namespace.
   */
  get profiles() {
    return profiles_exports;
  },
  /**
   * Namespace for persisting settings within Stream Deck.
   * @returns Settings namespace.
   */
  get settings() {
    return settings;
  },
  /**
   * Namespace for interacting with, and receiving events from, the system the plugin is running on.
   * @returns System namespace.
   */
  get system() {
    return system_exports;
  },
  /**
   * Namespace for interacting with UI (property inspector) associated with the plugin.
   * @returns UI namespace.
   */
  get ui() {
    return ui;
  },
  /**
   * Connects the plugin to the Stream Deck.
   * @returns A promise resolved when a connection has been established.
   */
  connect() {
    return connection.connect();
  }
};
var plugin_default = streamDeck;

// src/actions/base-memory-action.ts
var import_child_process2 = require("child_process");
var import_util2 = require("util");

// src/utils/memory-stats.ts
var import_child_process = require("child_process");
var import_util = require("util");
var execFileAsync = (0, import_util.promisify)(import_child_process.execFile);
var PAGE_SIZE = 16384;
async function getVmStat() {
  const { stdout } = await execFileAsync("vm_stat");
  const getValue = (key) => {
    const match = stdout.match(new RegExp(`${key}:\\s+(\\d+)`));
    return match ? parseInt(match[1], 10) : 0;
  };
  return {
    pagesFree: getValue("Pages free"),
    pagesActive: getValue("Pages active"),
    pagesInactive: getValue("Pages inactive"),
    pagesSpeculative: getValue("Pages speculative"),
    pagesWired: getValue("Pages wired down"),
    pagesCompressor: getValue("Pages stored in compressor")
  };
}
async function getPhysicalMemory() {
  const { stdout } = await execFileAsync("sysctl", ["hw.memsize"]);
  const match = stdout.match(/hw\.memsize:\s+(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}
async function getSwapUsage() {
  const { stdout } = await execFileAsync("sysctl", ["vm.swapusage"]);
  const usedMatch = stdout.match(/used\s*=\s*([\d.]+)M/);
  const totalMatch = stdout.match(/total\s*=\s*([\d.]+)M/);
  return {
    used: usedMatch ? parseFloat(usedMatch[1]) / 1024 : 0,
    // Convert MB to GB
    total: totalMatch ? parseFloat(totalMatch[1]) / 1024 : 0
  };
}
function pagesToGB(pages) {
  return pages * PAGE_SIZE / (1024 * 1024 * 1024);
}
async function getMemoryStats() {
  const [vmStat, physicalBytes, swap] = await Promise.all([
    getVmStat(),
    getPhysicalMemory(),
    getSwapUsage()
  ]);
  const physicalMemory = physicalBytes / (1024 * 1024 * 1024);
  const totalPages = physicalBytes / PAGE_SIZE;
  const appMemory = pagesToGB(vmStat.pagesActive);
  const wiredMemory = pagesToGB(vmStat.pagesWired);
  const compressed = pagesToGB(vmStat.pagesCompressor);
  const cachedFiles = pagesToGB(vmStat.pagesInactive + vmStat.pagesSpeculative);
  const freeMemory = pagesToGB(vmStat.pagesFree);
  const memoryUsed = physicalMemory - freeMemory;
  return {
    physicalMemory,
    memoryUsed,
    appMemory,
    wiredMemory,
    compressed,
    cachedFiles,
    swapUsed: swap.used,
    memoryUsedPercent: memoryUsed / physicalMemory * 100,
    appMemoryPercent: vmStat.pagesActive / totalPages * 100,
    swapPercent: swap.total > 0 ? swap.used / swap.total * 100 : 0
  };
}
var GREEN = "#33DD33";
var ORANGE = "#FFAA00";
var RED = "#FF3333";
var BLUE = "#3399FF";
var METRIC_CONFIGS = {
  physical: {
    label: "Physical",
    shortLabel: "RAM",
    getValue: (s) => s.physicalMemory,
    getPercent: () => 100,
    // Always full
    getColor: () => BLUE,
    // Static blue
    showRing: false
  },
  memoryUsed: {
    label: "Memory Used",
    shortLabel: "USED",
    getValue: (s) => s.memoryUsed,
    getPercent: (s) => s.memoryUsedPercent,
    getColor: (_, s) => {
      if (s.memoryUsedPercent > 90) return RED;
      if (s.memoryUsedPercent > 70) return ORANGE;
      return GREEN;
    },
    showRing: true
  },
  appMemory: {
    label: "App Memory",
    shortLabel: "APP",
    getValue: (s) => s.appMemory,
    getPercent: (s) => s.appMemoryPercent,
    getColor: (_, s) => {
      if (s.appMemoryPercent > 75) return RED;
      if (s.appMemoryPercent > 50) return ORANGE;
      return GREEN;
    },
    showRing: true
  },
  wired: {
    label: "Wired Memory",
    shortLabel: "WIRED",
    getValue: (s) => s.wiredMemory,
    getPercent: (s) => s.wiredMemory / s.physicalMemory * 100,
    getColor: (gb) => {
      if (gb > 6) return RED;
      if (gb > 4) return ORANGE;
      return GREEN;
    },
    showRing: true
  },
  compressed: {
    label: "Compressed",
    shortLabel: "COMP",
    getValue: (s) => s.compressed,
    getPercent: (s) => s.compressed / s.physicalMemory * 100,
    getColor: (gb) => {
      if (gb > 8) return RED;
      if (gb > 4) return ORANGE;
      return GREEN;
    },
    showRing: true
  },
  cached: {
    label: "Cached Files",
    shortLabel: "CACHE",
    getValue: (s) => s.cachedFiles,
    getPercent: (s) => s.cachedFiles / s.physicalMemory * 100,
    getColor: () => GREEN,
    // Cached is always good
    showRing: true
  },
  swap: {
    label: "Swap Used",
    shortLabel: "SWAP",
    getValue: (s) => s.swapUsed,
    getPercent: (s) => s.swapPercent,
    getColor: (gb) => {
      if (gb >= 4) return RED;
      if (gb >= 2) return ORANGE;
      return GREEN;
    },
    showRing: true
  }
};

// src/actions/base-memory-action.ts
var execFileAsync2 = (0, import_util2.promisify)(import_child_process2.execFile);
var BaseMemoryAction = class extends SingletonAction {
  intervals = /* @__PURE__ */ new Map();
  logger = plugin_default.logger.createScope("MemoryMonitor");
  async onWillAppear(ev) {
    const actionId = ev.action.id;
    this.logger.info(`${this.metricType} action appeared: ${actionId}`);
    await this.updateDisplay(ev);
    const interval = setInterval(async () => {
      try {
        await this.updateDisplay(ev);
      } catch (error) {
        this.logger.error(`Error updating ${this.metricType} display:`, error);
      }
    }, 2e3);
    this.intervals.set(actionId, interval);
  }
  async onWillDisappear(ev) {
    const actionId = ev.action.id;
    const interval = this.intervals.get(actionId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(actionId);
      this.logger.info(`${this.metricType} polling stopped: ${actionId}`);
    }
  }
  async onKeyDown(_ev) {
    try {
      await execFileAsync2("open", ["-a", "Activity Monitor"]);
    } catch (error) {
      this.logger.error("Error opening Activity Monitor:", error);
    }
  }
  async updateDisplay(ev) {
    const stats = await getMemoryStats();
    const config = METRIC_CONFIGS[this.metricType];
    const valueGB = config.getValue(stats);
    const percent = config.getPercent(stats);
    const color = config.getColor(valueGB, stats);
    const svg = this.generateImage(valueGB, percent, color, config.shortLabel, config.showRing);
    await ev.action.setImage(svg);
  }
  generateImage(valueGB, percent, color, label, showRing) {
    const size = 144;
    const cx = size / 2;
    const cy = size / 2;
    const valueText = valueGB >= 10 ? `${valueGB.toFixed(0)}GB` : valueGB >= 1 ? `${valueGB.toFixed(1)}GB` : `${Math.round(valueGB * 1024)}MB`;
    if (!showRing) {
      const svg2 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
                <rect width="${size}" height="${size}" fill="black"/>
                <text x="${cx}" y="50" text-anchor="middle" fill="#888888" font-size="18" font-weight="bold" font-family="sans-serif">${label}</text>
                <text x="${cx}" y="${cy + 10}" text-anchor="middle" fill="${color}" font-size="28" font-weight="bold" font-family="sans-serif">${valueText}</text>
            </svg>`;
      const base642 = Buffer.from(svg2).toString("base64");
      return `data:image/svg+xml;base64,${base642}`;
    }
    const radius = 54;
    const stroke = 12;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - Math.min(percent, 100) / 100);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
            <rect width="${size}" height="${size}" fill="black"/>
            <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="#333333" stroke-width="${stroke}"/>
            <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-dasharray="${circumference}" stroke-dashoffset="${dashOffset}" stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})"/>
            <text x="${cx}" y="38" text-anchor="middle" fill="#888888" font-size="16" font-weight="bold" font-family="sans-serif">${label}</text>
            <text x="${cx}" y="${cy + 12}" text-anchor="middle" fill="white" font-size="22" font-weight="bold" font-family="sans-serif">${valueText}</text>
        </svg>`;
    const base64 = Buffer.from(svg).toString("base64");
    return `data:image/svg+xml;base64,${base64}`;
  }
};

// src/actions/swap-monitor.ts
var SwapMonitorBase = class extends BaseMemoryAction {
  metricType = "swap";
};
var SwapMonitor = action({ UUID: "com.joshroman.macos-memory.swap" })(
  SwapMonitorBase,
  { kind: "class", name: "SwapMonitor" }
);

// src/actions/memory-used.ts
var MemoryUsedBase = class extends BaseMemoryAction {
  metricType = "memoryUsed";
};
var MemoryUsed = action({ UUID: "com.joshroman.macos-memory.memory-used" })(
  MemoryUsedBase,
  { kind: "class", name: "MemoryUsed" }
);

// src/actions/app-memory.ts
var AppMemoryBase = class extends BaseMemoryAction {
  metricType = "appMemory";
};
var AppMemory = action({ UUID: "com.joshroman.macos-memory.app-memory" })(
  AppMemoryBase,
  { kind: "class", name: "AppMemory" }
);

// src/actions/wired-memory.ts
var WiredMemoryBase = class extends BaseMemoryAction {
  metricType = "wired";
};
var WiredMemory = action({ UUID: "com.joshroman.macos-memory.wired" })(
  WiredMemoryBase,
  { kind: "class", name: "WiredMemory" }
);

// src/actions/compressed-memory.ts
var CompressedMemoryBase = class extends BaseMemoryAction {
  metricType = "compressed";
};
var CompressedMemory = action({ UUID: "com.joshroman.macos-memory.compressed" })(
  CompressedMemoryBase,
  { kind: "class", name: "CompressedMemory" }
);

// src/actions/cached-files.ts
var CachedFilesBase = class extends BaseMemoryAction {
  metricType = "cached";
};
var CachedFiles = action({ UUID: "com.joshroman.macos-memory.cached" })(
  CachedFilesBase,
  { kind: "class", name: "CachedFiles" }
);

// src/actions/physical-memory.ts
var PhysicalMemoryBase = class extends BaseMemoryAction {
  metricType = "physical";
};
var PhysicalMemory = action({ UUID: "com.joshroman.macos-memory.physical" })(
  PhysicalMemoryBase,
  { kind: "class", name: "PhysicalMemory" }
);

// src/actions/memory-selector.ts
var import_child_process3 = require("child_process");
var import_util3 = require("util");
var execFileAsync3 = (0, import_util3.promisify)(import_child_process3.execFile);
var MemorySelectorBase = class extends SingletonAction {
  intervals = /* @__PURE__ */ new Map();
  actionSettings = /* @__PURE__ */ new Map();
  logger = plugin_default.logger.createScope("MemorySelector");
  async onWillAppear(ev) {
    const actionId = ev.action.id;
    const settings2 = ev.payload.settings || {};
    const metricType = settings2.metricType || "swap";
    this.actionSettings.set(actionId, metricType);
    this.logger.info(`Memory selector appeared: ${actionId}, metric: ${metricType}`);
    await this.updateDisplay(ev, metricType);
    const interval = setInterval(async () => {
      try {
        const currentMetric = this.actionSettings.get(actionId) || "swap";
        await this.updateDisplay(ev, currentMetric);
      } catch (error) {
        this.logger.error("Error updating memory selector display:", error);
      }
    }, 2e3);
    this.intervals.set(actionId, interval);
  }
  async onWillDisappear(ev) {
    const actionId = ev.action.id;
    const interval = this.intervals.get(actionId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(actionId);
    }
    this.actionSettings.delete(actionId);
  }
  async onDidReceiveSettings(ev) {
    const actionId = ev.action.id;
    const settings2 = ev.payload.settings || {};
    const metricType = settings2.metricType || "swap";
    this.actionSettings.set(actionId, metricType);
    this.logger.info(`Settings updated for ${actionId}: ${metricType}`);
    await this.updateDisplay(ev, metricType);
  }
  async onKeyDown(_ev) {
    try {
      await execFileAsync3("open", ["-a", "Activity Monitor"]);
    } catch (error) {
      this.logger.error("Error opening Activity Monitor:", error);
    }
  }
  async updateDisplay(ev, metricType) {
    const stats = await getMemoryStats();
    const config = METRIC_CONFIGS[metricType];
    const valueGB = config.getValue(stats);
    const percent = config.getPercent(stats);
    const color = config.getColor(valueGB, stats);
    const svg = this.generateImage(valueGB, percent, color, config.shortLabel, config.showRing);
    await ev.action.setImage(svg);
  }
  generateImage(valueGB, percent, color, label, showRing) {
    const size = 144;
    const cx = size / 2;
    const cy = size / 2;
    const valueText = valueGB >= 10 ? `${valueGB.toFixed(0)}GB` : valueGB >= 1 ? `${valueGB.toFixed(1)}GB` : `${Math.round(valueGB * 1024)}MB`;
    if (!showRing) {
      const svg2 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
                <rect width="${size}" height="${size}" fill="black"/>
                <text x="${cx}" y="50" text-anchor="middle" fill="#888888" font-size="18" font-weight="bold" font-family="sans-serif">${label}</text>
                <text x="${cx}" y="${cy + 10}" text-anchor="middle" fill="${color}" font-size="28" font-weight="bold" font-family="sans-serif">${valueText}</text>
            </svg>`;
      const base642 = Buffer.from(svg2).toString("base64");
      return `data:image/svg+xml;base64,${base642}`;
    }
    const radius = 54;
    const stroke = 12;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - Math.min(percent, 100) / 100);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
            <rect width="${size}" height="${size}" fill="black"/>
            <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="#333333" stroke-width="${stroke}"/>
            <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-dasharray="${circumference}" stroke-dashoffset="${dashOffset}" stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})"/>
            <text x="${cx}" y="38" text-anchor="middle" fill="#888888" font-size="16" font-weight="bold" font-family="sans-serif">${label}</text>
            <text x="${cx}" y="${cy + 12}" text-anchor="middle" fill="white" font-size="22" font-weight="bold" font-family="sans-serif">${valueText}</text>
        </svg>`;
    const base64 = Buffer.from(svg).toString("base64");
    return `data:image/svg+xml;base64,${base64}`;
  }
};
var MemorySelector = action({ UUID: "com.joshroman.macos-memory.custom" })(
  MemorySelectorBase,
  { kind: "class", name: "MemorySelector" }
);

// src/plugin.ts
plugin_default.logger.setLevel("debug");
var logger2 = plugin_default.logger.createScope("Plugin");
logger2.info("macOS Memory plugin starting...");
logger2.info("Registering actions...");
plugin_default.actions.registerAction(new SwapMonitor());
plugin_default.actions.registerAction(new MemoryUsed());
plugin_default.actions.registerAction(new AppMemory());
plugin_default.actions.registerAction(new WiredMemory());
plugin_default.actions.registerAction(new CompressedMemory());
plugin_default.actions.registerAction(new CachedFiles());
plugin_default.actions.registerAction(new PhysicalMemory());
plugin_default.actions.registerAction(new MemorySelector());
logger2.info("All actions registered");
logger2.info("Connecting to Stream Deck...");
plugin_default.connect().then(() => {
  logger2.info("Connected to Stream Deck!");
}).catch((err) => {
  logger2.error("Failed to connect:", err);
});
/*! Bundled license information:

@elgato/schemas/dist/streamdeck/plugins/index.mjs:
  (**!
   * @author Elgato
   * @module elgato/streamdeck
   * @license MIT
   * @copyright Copyright (c) Corsair Memory Inc.
   *)
*/
//# sourceMappingURL=plugin.js.map
