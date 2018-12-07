/*
    WebMolKit

    (c) 2010-2017 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

    [PKG=webmolkit]
*/
///<reference path='Vec.ts'/>
var WebMolKit;
(function (WebMolKit) {
    /*
        General purpose functions. Note that these are not in the WebMolKit namespace.
    */
    // string-to-number: control the behaviour when invalid
    function safeInt(str, def) {
        if (def === void 0) { def = 0; }
        var val = parseInt(str);
        return isNaN(val) ? def : val;
    }
    WebMolKit.safeInt = safeInt;
    function safeFloat(str, def) {
        if (def === void 0) { def = 0; }
        var val = parseFloat(str);
        return isNaN(val) ? def : val;
    }
    WebMolKit.safeFloat = safeFloat;
    // creates a new element, with a specific parent (raw or jQuery); returns the child node - the raw DOM element, not the
    // jQuery wrapper
    function newElement(parent, tag, attr) {
        var el = $("<" + tag + ">");
        if (attr)
            el.attr(attr);
        $(parent).append(el);
        return el[0];
    }
    WebMolKit.newElement = newElement;
    // appends child text to the node
    function addText(parent, text) {
        var el = parent instanceof jQuery ? parent[0] : parent;
        //if (parent instanceof jQuery) el = (<JQuery>parent)[0]; else el = <Element>parent;
        //let el:Element = parent instanceof JQuery ? (<JQuery>parent[0]) : <Element>parent;
        el.appendChild(document.createTextNode(text));
    }
    WebMolKit.addText = addText;
    // convenience wrapper
    function setVisible(node, visible) {
        if (visible)
            $(node).show();
        else
            $(node).hide();
    }
    WebMolKit.setVisible = setVisible;
    // convenience function for adding the plural modifier, i.e. "1 thing" vs "N things"
    function plural(count) {
        return count == 1 ? '' : 's';
    }
    WebMolKit.plural = plural;
    // turns a number into a floating point representation with a maximum number of significant figures
    function formatDouble(value, sigfig) {
        if (value == null)
            return '';
        var str = value.toPrecision(sigfig);
        if (str.indexOf('.') > 0)
            while (str.endsWith('0') || str.endsWith('.'))
                str = str.substring(0, str.length - 1);
        return str;
    }
    WebMolKit.formatDouble = formatDouble;
    // turns an HTML-style colour (#RRGGBB) into its numeric equivalent (0xRRGGBB), or null if invalid
    function htmlToRGB(col) {
        if (col == null || col.charAt(0) != '#' || col.length != 7)
            return null;
        return parseInt(col.substring(1), 16);
    }
    WebMolKit.htmlToRGB = htmlToRGB;
    // converts an integer colour (0xTTRRGGBB) to the HTML style; transparency info is stripped out
    function colourCode(col) {
        var hex = (col & 0xFFFFFF).toString(16);
        while (hex.length < 6)
            hex = '0' + hex;
        return '#' + hex;
    }
    WebMolKit.colourCode = colourCode;
    // returns the alpha value for a colour, assuming that it is an integer of the 0xTTRRGGBB format
    function colourAlpha(col) {
        var transp = (col >>> 24) & 0xFF;
        return transp == 0 ? 1 : transp == 0xFF ? 0 : 1 - (transp * (1.0 / 255));
    }
    WebMolKit.colourAlpha = colourAlpha;
    // turns a TRGB integer into the style used by the canvas node
    var ONE_OVER_255 = 1.0 / 255;
    function colourCanvas(col) {
        // simple cases first
        if (col == 0xFFFFFF)
            return 'white';
        if (col == 0x000000)
            return 'black';
        if (col == -1)
            return null; //return 'rgba(0,0,0,0)';
        if (col >= 0 && col <= 0xFFFFFF)
            return colourCode(col);
        // if there's transparency, use the long-winded syntax
        var t = ((col >> 24) & 0xFF) * ONE_OVER_255;
        var r = ((col >> 16) & 0xFF); // * ONE_OVER_255;
        var g = ((col >> 8) & 0xFF); // * ONE_OVER_255;
        var b = (col & 0xFF); // * ONE_OVER_255;
        return 'rgba(' + r + ',' + g + ',' + b + ',' + (1 - t) + ')';
    }
    WebMolKit.colourCanvas = colourCanvas;
    // RGB manipulation: very convenient functions for "smearing" between fractional values
    function blendRGB(fract, rgb1, rgb2, rgb3) {
        fract = Math.max(0, Math.min(1, fract));
        var r1 = ((rgb1 >> 16) & 0xFF) * ONE_OVER_255, g1 = ((rgb1 >> 8) & 0xFF) * ONE_OVER_255, b1 = (rgb1 & 0xFF) * ONE_OVER_255;
        var r2 = ((rgb2 >> 16) & 0xFF) * ONE_OVER_255, g2 = ((rgb2 >> 8) & 0xFF) * ONE_OVER_255, b2 = (rgb2 & 0xFF) * ONE_OVER_255;
        var R, G, B;
        if (rgb3 == null) {
            var f1 = 1 - fract, f2 = fract;
            R = Math.round(0xFF * (f1 * r1 + f2 * r2));
            G = Math.round(0xFF * (f1 * g1 + f2 * g2));
            B = Math.round(0xFF * (f1 * b1 + f2 * b2));
        }
        else {
            var r3 = ((rgb3 >> 16) & 0xFF) * ONE_OVER_255, g3 = ((rgb3 >> 8) & 0xFF) * ONE_OVER_255, b3 = (rgb3 & 0xFF) * ONE_OVER_255;
            if (fract < 0.5) {
                var f2 = fract * 2, f1 = 1 - f2;
                R = Math.round(0xFF * (f1 * r1 + f2 * r2));
                G = Math.round(0xFF * (f1 * g1 + f2 * g2));
                B = Math.round(0xFF * (f1 * b1 + f2 * b2));
            }
            else {
                var f2 = (fract - 0.5) * 2, f1 = 1 - f2;
                R = Math.round(0xFF * (f1 * r2 + f2 * r3));
                G = Math.round(0xFF * (f1 * g2 + f2 * g3));
                B = Math.round(0xFF * (f1 * b2 + f2 * b3));
            }
        }
        return (R << 16) | (G << 8) | B;
    }
    WebMolKit.blendRGB = blendRGB;
    // takes a GMT date formatted as yyyy-mm-dd hh:mm:ss and converts it to the local timezone, and displays it
    // nicely (not including the time)
    /*function formatGMTDateNicely(gmtDate:string)
    {
        if (!gmtDate) return '';
        var regex = /^(\d\d\d\d)-(\d\d)-(\d\d) (\d\d):(\d\d):(\d\d)/;
        var bits:string[] = gmtDate.match(regex);
        if (!bits) return '';
        for (var n = 1; n <= 6; n++) bits[n] = parseFloat(bits[n]);
    
        var date = new goog.date.DateTime(bits[1], bits[2] - 1, bits[3], bits[4], bits[5], bits[6]);
        var offset = new goog.date.Interval(goog.date.Interval.MINUTES, -date.getTimezoneOffset());
        date.add(offset);
    
        var day = date.getDate(), mon = date.getMonth(), year = date.getYear();
        var MONTHS =
        [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
        return day + '-' + MONTHS[mon] + '-' + year;
    }*/
    // goes through all text-node children and splices them together
    function nodeText(node) {
        var ret = '';
        if (!node)
            return;
        node = node.firstChild;
        while (node) {
            if (node.nodeType == 3 || node.nodeType == 4)
                ret += node.nodeValue;
            node = node.nextSibling;
        }
        return ret;
    }
    WebMolKit.nodeText = nodeText;
    // convenience functions to abstract the unreasonably longwinded closures function
    function isDef(v) {
        return !(v === null || typeof v === 'undefined');
    }
    WebMolKit.isDef = isDef;
    function notDef(v) {
        return v === null || typeof v === 'undefined';
    }
    WebMolKit.notDef = notDef;
    // given a particular event, picks out the (x,y) coordinates, and offsets them until they are in the space of the given
    // node container, which must be a parent
    function eventCoords(event, container) {
        var parentOffset = $(container).offset();
        var relX = event.pageX - parentOffset.left;
        var relY = event.pageY - parentOffset.top;
        return [relX, relY];
    }
    WebMolKit.eventCoords = eventCoords;
    // geometry functions
    function norm_xy(dx, dy) {
        return Math.sqrt(dx * dx + dy * dy);
    }
    WebMolKit.norm_xy = norm_xy;
    function norm_xyz(dx, dy, dz) {
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    WebMolKit.norm_xyz = norm_xyz;
    function norm2_xy(dx, dy) {
        return dx * dx + dy * dy;
    }
    WebMolKit.norm2_xy = norm2_xy;
    function norm2_xyz(dx, dy, dz) {
        return dx * dx + dy * dy + dz * dz;
    }
    WebMolKit.norm2_xyz = norm2_xyz;
    // miscellaneous math
    function sqr(v) {
        return v * v;
    }
    WebMolKit.sqr = sqr;
    function invZ(v) { return v == 0 ? 0 : 1.0 / v; }
    WebMolKit.invZ = invZ;
    // returns true if the numbers are effectively equal, assuming float/double precision
    function fltEqual(v1, v2) { return v1 == v2 || Math.abs(v1 - v2) <= 1E-7 * Math.max(v1, v2); }
    WebMolKit.fltEqual = fltEqual;
    function realEqual(v1, v2) { return v1 == v2 || Math.abs(v1 - v2) <= 1E-14 * Math.max(v1, v2); }
    WebMolKit.realEqual = realEqual;
    // returns a random integer between 0 and size-1
    function randomInt(size) {
        if (size <= 1)
            return 0;
        return Math.floor(Math.random() * size);
    }
    WebMolKit.randomInt = randomInt;
    // angle helpers
    WebMolKit.TWOPI = 2 * Math.PI;
    WebMolKit.INV_TWOPI = 1.0 / WebMolKit.TWOPI;
    WebMolKit.DEGRAD = Math.PI / 180;
    WebMolKit.RADDEG = 180 / Math.PI;
    // normalised angle, guaranteed to be -PI <= th < PI
    function angleNorm(th) {
        if (th == -Math.PI)
            return Math.PI;
        if (th < -Math.PI) {
            var mod = Math.ceil((-th - Math.PI) * WebMolKit.INV_TWOPI);
            return th + mod * WebMolKit.TWOPI;
        }
        if (th > Math.PI) {
            var mod = Math.ceil((th - Math.PI) * WebMolKit.INV_TWOPI);
            return th - mod * WebMolKit.TWOPI;
        }
        return th;
    }
    WebMolKit.angleNorm = angleNorm;
    // angular difference, guaranteed to be normalised
    function angleDiff(th1, th2) {
        var theta = angleNorm(th1) - angleNorm(th2);
        return theta - (theta > Math.PI ? WebMolKit.TWOPI : 0) + (theta <= -Math.PI ? WebMolKit.TWOPI : 0);
    }
    WebMolKit.angleDiff = angleDiff;
    // angular difference, which is normalised from 0 <= th < 2 * PI 
    function angleDiffPos(th1, th2) {
        var theta = angleNorm(th1) - angleNorm(th2);
        return theta + (theta < 0 ? WebMolKit.TWOPI : 0);
    }
    WebMolKit.angleDiffPos = angleDiffPos;
    // for an array of angles (in radians), sorts them in order; then, rotates the array around as many times as is necessary
    // so that the difference between the first & last angles is >= than the difference between the first & second
    function sortAngles(theta) {
        if (theta == null || theta.length < 2)
            return theta;
        theta = theta.slice(0);
        for (var n = 0; n < theta.length; n++)
            theta[n] = angleNorm(theta[n]);
        WebMolKit.Vec.sort(theta);
        while (true) {
            var a = theta[theta.length - 1], b = theta[0], c = theta[1];
            if (angleDiff(b, a) <= angleDiff(c, b))
                break;
            for (var n = theta.length - 1; n > 0; n--)
                theta[n] = theta[n - 1];
            theta[0] = a;
        }
        return theta;
    }
    WebMolKit.sortAngles = sortAngles;
    // calculates a list of unique angles (based on the threshold parameter, in radians), and returns it; the returned list of 
    // angles will be sorted in order, as described by sortAngles(..); note that there is no fancy clustering, so a sequence of 
    // angles which are a bit below the threshold is not guaranteed to be stable; there is also a boundary case which bumps the 
    // sort rotation status slightly out of whack
    function uniqueAngles(theta, threshold) {
        theta = sortAngles(theta);
        for (var n = 1; n < theta.length; n++) {
            if (Math.abs(angleDiff(theta[n], theta[n - 1])) <= threshold) {
                theta.splice(n, 1);
                n--;
            }
        }
        return theta;
    }
    WebMolKit.uniqueAngles = uniqueAngles;
    // array bounds
    function minArray(a) {
        if (a == null || a.length == 0)
            return 0;
        var v = a[0];
        for (var n = 1; n < a.length; n++)
            v = Math.min(v, a[n]);
        return v;
    }
    WebMolKit.minArray = minArray;
    function maxArray(a) {
        if (a == null || a.length == 0)
            return 0;
        var v = a[0];
        for (var n = 1; n < a.length; n++)
            v = Math.max(v, a[n]);
        return v;
    }
    WebMolKit.maxArray = maxArray;
    // convenience function: finds a child node by name
    function findNode(parent, name) {
        if (parent == null)
            return null;
        var node = parent.firstChild;
        while (node) {
            if (node.nodeType == Node.ELEMENT_NODE && node.nodeName == name)
                return node;
            node = node.nextSibling;
        }
        return null;
    }
    WebMolKit.findNode = findNode;
    // as above, but returns a list; may be empty
    function findNodes(parent, name) {
        if (parent == null)
            return null;
        var node = parent.firstChild;
        var list = [];
        while (node) {
            if (node.nodeType == Node.ELEMENT_NODE && node.nodeName == name)
                list.push(node);
            node = node.nextSibling;
        }
        return list;
    }
    WebMolKit.findNodes = findNodes;
    // creates a rounded rectangle path using splines
    function pathRoundedRect(x1, y1, x2, y2, rad) {
        var path = new Path2D();
        //path.moveTo(x1 + rad, y1);
        //path.lineTo(x2 - rad, y1);
        path.moveTo(x2 - rad, y1);
        path.quadraticCurveTo(x2, y1, x2, y1 + rad);
        path.lineTo(x2, y2 - rad);
        path.quadraticCurveTo(x2, y2, x2 - rad, y2);
        path.lineTo(x1 + rad, y2);
        path.quadraticCurveTo(x1, y2, x1, y2 - rad);
        path.lineTo(x1, y1 + rad);
        path.quadraticCurveTo(x1, y1, x1 + rad, y1);
        path.closePath();
        return path;
    }
    WebMolKit.pathRoundedRect = pathRoundedRect;
    // convenience functions
    function drawLine(ctx, x1, y1, x2, y2) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
    WebMolKit.drawLine = drawLine;
    // for HTML canvas, approximates the conversion of height to ascent ratio (i.e. pass in ascent * ASCENT_FUDGE to the font height)
    WebMolKit.ASCENT_FUDGE = 1.4;
    function fontSansSerif(ascent) { return ascent * WebMolKit.ASCENT_FUDGE + "px sans-serif"; }
    WebMolKit.fontSansSerif = fontSansSerif;
    // returns the density of pixels, i.e. 1 for a regular screen, 2 for retina, etc.
    function pixelDensity() {
        if ('devicePixelRatio' in window && window.devicePixelRatio > 1)
            return window.devicePixelRatio;
        return 1;
    }
    WebMolKit.pixelDensity = pixelDensity;
    // performs a shallow copy of the object: the top level guarantees new objects, while anything below that may contain
    // duplicate references with potential mutability issues
    function clone(data) {
        if (data == null)
            return null;
        if (Array.isArray(data))
            return data.slice(0);
        if (typeof data != 'object')
            return data;
        var result = {};
        for (var key in data)
            result[key] = data[key];
        return result;
    }
    WebMolKit.clone = clone;
    // performs a deep clone of any kind of object: goes as deep as it has to to make sure everything is immutable; the parameter
    // should not contain functions or host objects
    function deepClone(data) {
        if (data == null)
            return null;
        if (typeof data == 'function')
            return null;
        if (typeof data != 'object')
            return data;
        var result = Array.isArray(data) ? [] : {};
        for (var key in data) {
            var val = data[key];
            result[key] = typeof val === 'object' ? deepClone(val) : val;
        }
        return result;
    }
    WebMolKit.deepClone = deepClone;
    // HTML-to-escape; gets most of the basics
    function escapeHTML(text) {
        if (!text)
            return '';
        var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return text.replace(/[&<>"']/g, function (m) { return map[m]; });
    }
    WebMolKit.escapeHTML = escapeHTML;
    // convenience: make sure a string isn't null
    function orBlank(str) { return str == null ? '' : str; }
    WebMolKit.orBlank = orBlank;
    // abstracts values into an array; this will be obsolete once Object.values() makes it into the typescript mappings
    function dictValues(dict) {
        var list = [];
        for (var key in dict)
            list.push(dict[key]);
        return list;
    }
    WebMolKit.dictValues = dictValues;
    // converts a string (which is stored by JavaScript as UCS2) to UTF8, where each character is guaranteed to be 1 byte
    function toUTF8(str) {
        var data = [], stripe = '';
        var sz = str.length;
        for (var n = 0; n < sz; n++) {
            var charcode = str.charCodeAt(n);
            if (charcode < 0x80)
                stripe += str.charAt(n);
            else if (charcode < 0x800) {
                stripe += String.fromCharCode(0xc0 | (charcode >> 6));
                stripe += String.fromCharCode(0x80 | (charcode & 0x3F));
            }
            else if (charcode < 0xd800 || charcode >= 0xe000) {
                stripe += String.fromCharCode(0xe0 | (charcode >> 12));
                stripe += String.fromCharCode(0x80 | ((charcode >> 6) & 0x3F));
                stripe += String.fromCharCode(0x80 | (charcode & 0x3F));
            }
            else // surrogate pair
             {
                n++;
                charcode = 0x10000 + (((charcode & 0x3FF) << 10) | (str.charCodeAt(n) & 0x3FF));
                stripe += String.fromCharCode(0xf0 | (charcode >> 18));
                stripe += String.fromCharCode(0x80 | ((charcode >> 12) & 0x3F));
                stripe += String.fromCharCode(0x80 | ((charcode >> 6) & 0x3F));
                stripe += String.fromCharCode(0x80 | (charcode & 0x3F));
            }
            if (stripe.length > 100) {
                data.push(stripe);
                stripe = '';
            }
        }
        data.push(stripe);
        return data.join('');
    }
    WebMolKit.toUTF8 = toUTF8;
    // converts a UTF8 string to a regular JavaScript string (which is UCS2-encoded)
    function fromUTF8(str) {
        var data = [], stripe = '';
        var sz = str.length;
        for (var n = 0; n < sz; n++) {
            var value = str.charCodeAt(n);
            if (value < 0x80)
                stripe += str.charAt(n);
            else if (value > 0xBF && value < 0xE0) {
                stripe += String.fromCharCode((value & 0x1F) << 6 | str.charCodeAt(n + 1) & 0x3F);
                n++;
            }
            else if (value > 0xDF && value < 0xF0) {
                str += String.fromCharCode((value & 0x0F) << 12 | (str.charCodeAt(n + 1) & 0x3F) << 6 | str.charCodeAt(n + 2) & 0x3F);
                n += 2;
            }
            else // surrogate pair 
             {
                var charCode = ((value & 0x07) << 18 | (str.charCodeAt(n + 1) & 0x3F) << 12 | (str.charCodeAt(n + 2) & 0x3F) << 6 | str.charCodeAt(n + 3) & 0x3F) - 0x010000;
                stripe += String.fromCharCode(charCode >> 10 | 0xD800, charCode & 0x03FF | 0xDC00);
                n += 3;
            }
            if (stripe.length > 100) {
                data.push(stripe);
                stripe = '';
            }
        }
        data.push(stripe);
        return data.join('');
    }
    WebMolKit.fromUTF8 = fromUTF8;
    /* EOF */ 
})(WebMolKit || (WebMolKit = {}));
