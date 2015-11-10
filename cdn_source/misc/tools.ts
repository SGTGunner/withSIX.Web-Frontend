// TODO: For array enumerable functions etc use defineProperty from https://github.com/paulmillr/es6-shim/blob/master/es6-shim.js

interface String {
    endsWithIgnoreCase: (suffix) => boolean;
    startsWithIgnoreCase: (prefix) => boolean;
    containsIgnoreCase: (needle) => boolean;
    equalsIgnoreCase: (needle) => boolean;
    indexOfIgnoreCase: (needle) => number;
    toUpperCaseFirst: () => string;
    toLowerCaseFirst: () => string;
    sluggify: () => string;
    toShortId: () => string;
    sluggifyEntityName: () => string;
    format: (args: any[]) => string;
}

interface IContainerObjects {
    eventBus: MyApp.IEventBus;
    toastr: MyApp.Toastr;
    login;
    enableBasket;
    restoreBasket;
    navigate;
    openCreateCollectionDialog;
}

interface IW6Cheat {
    w6: W6;
    w6Urls: W6Urls;
    isClient: boolean;
    aureliaReady: boolean;
    container;
    containerObjects: IContainerObjects;
    libraryParent;
    collection;
    redirected: boolean;
}
interface Window {
    w6Cheat: IW6Cheat;
    prerenderReady: boolean;
}

window.w6Cheat = <IW6Cheat>{
    containerObjects: <IContainerObjects> {},
    isClient: window.six_client != null
};

declare var UUIDjs;

String.prototype.indexOfIgnoreCase = function(prefix) {
    return this.toLowerCase().indexOf(prefix.toLowerCase());
};

/*
String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};
*/

/*
String.prototype.startsWith = function(prefix) {
    return this.indexOf(prefix) == 0;
};
*/

String.prototype.endsWithIgnoreCase = function(suffix) {
    return this.indexOfIgnoreCase(suffix, this.length - suffix.length) !== -1;
};

String.prototype.startsWithIgnoreCase = function(prefix) {
    return this.indexOfIgnoreCase(prefix) == 0;
};

String.prototype.toUpperCaseFirst = function() {
    return this.split(" ").map(i => i[0].toUpperCase() + i.substring(1)).join(" ");
};
String.prototype.toLowerCaseFirst = function() {
    return this.split(" ").map(i => i[0].toLowerCase() + i.substring(1)).join(" ");
};

String.prototype.containsIgnoreCase = function(prefix) {
    return this.indexOfIgnoreCase(prefix) > -1;
};

String.prototype.equalsIgnoreCase = function(prefix) {
    return this.toLowerCase() == prefix.toLowerCase();
};

String.prototype.toShortId = function () {
    return Tools.toShortId(this);
};

String.prototype.sluggify = function() {
    return Tools.sluggify(this);
};
String.prototype.sluggifyEntityName = function() {
    return Tools.sluggifyEntityName(this);
};
String.prototype.format = function() {
    var s = this,
        i = arguments.length;

    while (i--) {
        s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
    }
    return s;
};

module Tools {
    var hexList = '0123456789abcdef';
    var b64List = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    declare var escape;

    function jwtHelperInt($window) {

      this.urlBase64Decode = function(str) {
        var output = str.replace(/-/g, '+').replace(/_/g, '/');
        switch (output.length % 4) {
          case 0: { break; }
          case 2: { output += '=='; break; }
          case 3: { output += '='; break; }
          default: {
            throw 'Illegal base64url string!';
          }
        }
        return decodeURIComponent(escape(atob(output))); //polyfill https://github.com/davidchambers/Base64.js
      }


      this.decodeToken = function(token) {
        var parts = token.split('.');

        if (parts.length !== 3) {
          throw new Error('JWT must have 3 parts');
        }

        var decoded = this.urlBase64Decode(parts[1]);
        if (!decoded) {
          throw new Error('Cannot decode the token');
        }

        return angular.fromJson(decoded);
      }

      this.getTokenExpirationDate = function(token) {
        var decoded = this.decodeToken(token);

        if(typeof decoded.exp === "undefined") {
          return null;
        }

        var d = new Date(0); // The 0 here is the key, which sets the date to the epoch
        d.setUTCSeconds(decoded.exp);

        return d;
      };

      this.isTokenExpired = function(token, offsetSeconds) {
        var d = this.getTokenExpirationDate(token);
        offsetSeconds = offsetSeconds || 0;
        if (d === null) {
          return false;
        }

        // Token expired?
        return !(d.valueOf() > (new Date().valueOf() + (offsetSeconds * 1000)));
      };
    }
    var jwtHelper = new jwtHelperInt(Window);

    export function isTokenExpired(token) {
      try {
        return jwtHelper.isTokenExpired(token);
      } catch (err) {
        Tk.Debug.error("Error validating token " + err);
        return true;
      }
    }

    export function uriHasProtocol(uri: string) {
        return uri.startsWith("http://") || uri.startsWith("https://") || uri.startsWith("//");
    }

    export function encodeQueryData(data) {
        var ret = [];
        for (var d in data)
            ret.push(encodeURIComponent(d) + "=" + encodeURIComponent(data[d]));
        return ret.join("&");
    }

    export function joinUri(parts: string[]): string { return parts.join("/"); }

    const supportsDescriptors = true;
    export function defineProperty(object, name, value, force) {
        if (!force && name in object) { return; }
        if (supportsDescriptors) {
            Object.defineProperty(object, name, {
                configurable: true,
                enumerable: false,
                writable: true,
                value: value
            });
        } else {
            object[name] = value;
        }
    };

    // Define configurable, writable and non-enumerable props
    // if they don’t exist.
    export function defineProperties(object, map) {
        Object.keys(map).forEach(name => {
            var method = map[name];
            defineProperty(object, name, method, false);
        });
    };


    export function toShortId(id: string): string {
        return base64ToShort(guidToBase64(id, true));
    }

    export function fromShortId(shortId: string): string {
        try {
            return base64ToGuid(shortToBase64(shortId), true);
        } catch (err) {
            throw new Tk.InvalidShortIdException(shortId + " is not a valid ShortID");
        }
    }

    export function removeEl<T>(ary: T[], el: T) {
      var idx = ary.indexOf(el);
      if (idx > -1) ary.splice(idx, 1);
    }

    export function handleOverrides(opts, overrideOpts) {
        return $.extend(opts, overrideOpts);
    }

    export function mergeInto(obj1, obj2, allowed: string[]) {
        var e = allowed.asEnumerable();
        for (let attrname in obj1) {
            if (e.contains(attrname))
                obj2[attrname] = obj1[attrname];
        }
    }

    // Does not work minified, of course
    export function getClassName(obj: Object) {
        var funcNameRegex = /function (.{1,})\(/;
        var results = (funcNameRegex).exec((obj).constructor.toString());
        return (results && results.length > 1) ? results[1] : "";
    };

    export function mergeIntoRemovePrefix(obj1, obj2, prefix: string, allowed: string[]) {
        let e = allowed.asEnumerable();
        for (var attrname in obj1) {
            var newAttrName = attrname;
            if (prefix != undefined)
                newAttrName = attrname.replace(new RegExp("^" + prefix), '');
            if (newAttrName.endsWith("[]"))
                newAttrName = newAttrName.substring(0, newAttrName.length - 2);

            if (e.contains(newAttrName))
                obj2[newAttrName] = obj1[attrname];
        }
    }

    export function mergeIntoWithFix(obj1, obj2, prefix: string, postfix: string, allowed: string[]) {
        let e = allowed.asEnumerable();
        for (var attrname in obj1) {
            if (!e.contains(attrname))
                continue;

            var newAttrName = attrname;
            if (prefix != undefined)
                newAttrName = prefix + newAttrName;
            if (postfix != undefined)
                newAttrName = newAttrName + postfix;

            var val = obj1[attrname];
            if (Array.isArray(val))
                newAttrName += "[]";

            obj2[newAttrName] = val;
        }
    }

    export function mergeObjsInto(objs: Array<Object>, obj2) {
        for (var i in objs) {
            var obj = objs[i];
            for (var attrname in obj)
                obj2[attrname] = obj[attrname];
        }
    }

    // Convert GUID string to Base-64 in Javascript
    // by Mark Seecof, 2012-03-31

    // GUID string with four dashes is always MSB first,
    // but base-64 GUID's vary by target-system endian-ness.
    // Little-endian systems are far more common.  Set le==true
    // when target system is little-endian (e.g., x86 machine).
    //
    function guidToBase64(g, le) {
        var s = g.replace(/[^0-9a-f]/ig, '').toLowerCase();
        if (s.length != 32) return '';
        if (le)
            s = s.slice(6, 8) + s.slice(4, 6) + s.slice(2, 4) + s.slice(0, 2) +
                s.slice(10, 12) + s.slice(8, 10) +
                s.slice(14, 16) + s.slice(12, 14) +
                s.slice(16);
        s += '0';

        var a, p, q;
        var r = '';
        var i = 0;
        while (i < 33) {
            a = (hexList.indexOf(s.charAt(i++)) << 8) |
            (hexList.indexOf(s.charAt(i++)) << 4) |
            (hexList.indexOf(s.charAt(i++)));

            p = a >> 6;
            q = a & 63;

            r += b64List.charAt(p) + b64List.charAt(q);
        }
        r += '==';

        return r;
    } // guid_to_base64()

    function base64ToGuid(g, le) {
        var s = UUIDjs.fromBinary(atob(g)).toString();
        if (le) {
            s = s.replace(/[^0-9a-f]/ig, '').toLowerCase();
            s = s.slice(6, 8) + s.slice(4, 6) + s.slice(2, 4) + s.slice(0, 2) + "-" +
                s.slice(10, 12) + s.slice(8, 10) + "-" +
                s.slice(14, 16) + s.slice(12, 14) + "-" + s.slice(16, 20) + "-" + s.slice(20);
        }
        return s;
    }

    function base64ToShort(base64) {
        return base64.substring(0, 22).replace(/\//g, "_").replace(/\+/g, "-");
    }

    function shortToBase64(shortBase64) {
        return shortBase64.substring(0, 22).replace(/_/g, "/").replace(/\-/g, "+") + "==";
    }

    export class KeyCodes {
        public static enter = 13;
    }

    var r = new RegExp("[^A-Za-z0-9-]+", "g");
    var r2 = new RegExp("^[-]+");
    var r3 = new RegExp("[-]+$");

    // TODO: This is not as good as the C# version we use!
    export function sluggify(str: string) {
        return sluggifyEntityName(str.toLowerCase());
    }

    export function sluggifyEntityName(str: string) {
        str = str.replace(r, match => {
                switch (match) {
                case "'":
                {
                    return "";
                }
                case "+":
                {
                    return "plus";
                }
                default:
                {
                    return "-";
                }
                }
            })
            .trim();
        str = str.replace(r2, "");
        str = str.replace(r3, "");
        return str;
    }
}
