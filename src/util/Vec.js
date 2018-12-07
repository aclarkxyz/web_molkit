/*
    WebMolKit

    (c) 2010-2017 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

    [PKG=webmolkit]
*/
var WebMolKit;
(function (WebMolKit) {
    /*
        Functions that operate on arrays, for performing routine tasks.
    */
    var Vec = /** @class */ (function () {
        function Vec() {
        }
        Vec.isBlank = function (arr) { return arr == null || arr.length == 0; };
        Vec.notBlank = function (arr) { return arr != null && arr.length > 0; };
        Vec.safeArray = function (arr) { return arr == null ? [] : arr; };
        Vec.arrayLength = function (arr) { return arr == null ? 0 : arr.length; };
        /*public static arrayNumber(arr:number[]):number[] {return arr == null ? [] : arr;}
        public static arrayString(arr:string[]):string[] {return arr == null ? [] : arr;}
        public static arrayBoolean(arr:boolean[]):boolean[] {return arr == null ? [] : arr;}
        public static arrayAny(arr:any[]):any[] {return arr == null ? [] : arr;}*/
        Vec.anyTrue = function (arr) {
            if (arr == null)
                return false;
            for (var _i = 0, arr_1 = arr; _i < arr_1.length; _i++) {
                var v = arr_1[_i];
                if (v)
                    return true;
            }
            return false;
        };
        Vec.allTrue = function (arr) {
            if (arr == null)
                return true;
            for (var _i = 0, arr_2 = arr; _i < arr_2.length; _i++) {
                var v = arr_2[_i];
                if (!v)
                    return false;
            }
            return true;
        };
        Vec.anyFalse = function (arr) {
            if (arr == null)
                return false;
            for (var _i = 0, arr_3 = arr; _i < arr_3.length; _i++) {
                var v = arr_3[_i];
                if (!v)
                    return true;
            }
            return false;
        };
        Vec.allFalse = function (arr) {
            if (arr == null)
                return true;
            for (var _i = 0, arr_4 = arr; _i < arr_4.length; _i++) {
                var v = arr_4[_i];
                if (v)
                    return false;
            }
            return true;
        };
        Vec.swap = function (arr, idx1, idx2) {
            var v = arr[idx1];
            arr[idx1] = arr[idx2];
            arr[idx2] = v;
        };
        // null-tolerant array concatenation; always returns an array, always at least a shallow copy
        Vec.append = function (arr, item) {
            if (arr == null || arr.length == 0)
                return [item];
            arr = arr.slice(0);
            arr.push(item);
            return arr;
        };
        Vec.prepend = function (arr, item) {
            if (arr == null || arr.length == 0)
                return [item];
            arr = arr.slice(0);
            arr.unshift(item);
            return arr;
        };
        Vec.concat = function (arr1, arr2) {
            if (arr1 == null && arr2 == null)
                return [];
            if (arr1 == null)
                return arr2.slice(0);
            if (arr2 == null)
                return arr1.slice(0);
            return arr1.concat(arr2);
        };
        // array removal, with shallow-copy duplication
        Vec.remove = function (arr, idx) {
            arr = arr.slice(0);
            arr.splice(idx, 1);
            return arr;
        };
        // null-tolerant comparison
        Vec.equals = function (arr1, arr2) {
            if (arr1 == null && arr2 == null)
                return true;
            if (arr1 == null || arr2 == null)
                return false;
            if (arr1.length != arr2.length)
                return false;
            for (var n = 0; n < arr1.length; n++)
                if (arr1[n] != arr2[n])
                    return false;
            return true;
        };
        Vec.equivalent = function (arr1, arr2) {
            var len1 = arr1 == null ? 0 : arr1.length, len2 = arr2 == null ? 0 : arr2.length;
            if (len1 != len2)
                return false;
            for (var n = 0; n < len1; n++)
                if (arr1[n] != arr2[n])
                    return false;
            return true;
        };
        Vec.booleanArray = function (val, sz) {
            var arr = new Array(sz);
            for (var n = sz - 1; n >= 0; n--)
                arr[n] = val;
            return arr;
        };
        Vec.numberArray = function (val, sz) {
            var arr = new Array(sz);
            for (var n = sz - 1; n >= 0; n--)
                arr[n] = val;
            return arr;
        };
        Vec.stringArray = function (val, sz) {
            var arr = new Array(sz);
            for (var n = sz - 1; n >= 0; n--)
                arr[n] = val;
            return arr;
        };
        Vec.anyArray = function (val, sz) {
            var arr = new Array(sz);
            for (var n = sz - 1; n >= 0; n--)
                arr[n] = val;
            return arr;
        };
        Vec.min = function (arr) {
            if (arr == null || arr.length == 0)
                return Number.MAX_VALUE;
            var v = arr[0];
            for (var n = 1; n < arr.length; n++)
                v = Math.min(v, arr[n]);
            return v;
        };
        Vec.max = function (arr) {
            if (arr == null || arr.length == 0)
                return Number.MIN_VALUE;
            var v = arr[0];
            for (var n = 1; n < arr.length; n++)
                v = Math.max(v, arr[n]);
            return v;
        };
        Vec.idxMin = function (arr) {
            if (arr == null || arr.length == 0)
                return -1;
            var idx = 0;
            for (var n = 1; n < arr.length; n++)
                if (arr[n] < arr[idx])
                    idx = n;
            return idx;
        };
        Vec.idxMax = function (arr) {
            if (arr == null || arr.length == 0)
                return -1;
            var idx = 0;
            for (var n = 1; n < arr.length; n++)
                if (arr[n] > arr[idx])
                    idx = n;
            return idx;
        };
        Vec.range = function (arr) {
            if (arr == null || arr.length == 0)
                return 0;
            var lo = arr[0], hi = arr[0];
            for (var n = 1; n < arr.length; n++) {
                if (arr[n] < lo)
                    lo = arr[n];
                if (arr[n] > hi)
                    hi = arr[n];
            }
            return hi - lo;
        };
        Vec.reverse = function (arr) {
            var ret = [];
            for (var n = arr.length - 1; n >= 0; n--)
                ret.push(arr[n]);
            return ret;
        };
        Vec.identity0 = function (sz) {
            var ret = new Array(sz);
            for (var n = 0; n < sz; n++)
                ret[n] = n;
            return ret;
        };
        Vec.identity1 = function (sz) {
            var ret = new Array(sz);
            for (var n = 0; n < sz; n++)
                ret[n] = n + 1;
            return ret;
        };
        Vec.notMask = function (mask) {
            var ret = new Array(mask.length);
            for (var n = mask.length - 1; n >= 0; n--)
                ret[n] = !mask[n];
            return ret;
        };
        Vec.idxGet = function (arr, idx) {
            var ret = [];
            for (var n = 0; n < idx.length; n++)
                ret.push(arr[idx[n]]);
            return ret;
        };
        Vec.maskCount = function (mask) {
            var c = 0;
            for (var n = mask.length - 1; n >= 0; n--)
                if (mask[n])
                    c++;
            return c;
        };
        // converts the mask into indices (0-based)
        Vec.maskIdx = function (mask) {
            var idx = [];
            for (var n = 0; n < mask.length; n++)
                if (mask[n])
                    idx.push(n);
            return idx;
        };
        // converts the index into a mask (0-based index)
        Vec.idxMask = function (idx, sz) {
            var mask = Vec.booleanArray(false, sz);
            for (var _i = 0, idx_1 = idx; _i < idx_1.length; _i++) {
                var n = idx_1[_i];
                mask[n] = true;
            }
            return mask;
        };
        // converts a mask into an index map: if mask[n] is true, then idx[n] is a 0-based index into an equivalent array composed only
        // of entries for which mask is true; for the rest, the value is -1
        Vec.maskMap = function (mask) {
            var ret = [];
            for (var n = 0, pos = 0; n < mask.length; n++)
                ret.push(mask[n] ? pos++ : -1);
            return ret;
        };
        // returns members of an array for which the value of mask is true
        Vec.maskGet = function (arr, mask) {
            var ret = [];
            for (var n = 0, p = 0; n < arr.length; n++)
                if (mask[n])
                    ret.push(arr[n]);
            return ret;
        };
        // return a mask of elements which are equal on both sides (with unit extension on the right)
        Vec.maskEqual = function (arr1, val) {
            var ret = [];
            if (val.constructor === Array) {
                var arr2 = val;
                for (var n = 0; n < arr1.length; n++)
                    ret.push(arr1[n] == arr2[n]);
            }
            else {
                for (var n = 0; n < arr1.length; n++)
                    ret.push(arr1[n] == val);
            }
            return ret;
        };
        Vec.sum = function (arr) {
            if (arr == null || arr.length == 0)
                return 0;
            var t = arr[0];
            for (var n = 1; n < arr.length; n++)
                t += arr[n];
            return t;
        };
        Vec.add = function (arr1, val) {
            var ret = [];
            if (val.constructor === Array) {
                var arr2 = val;
                for (var n = 0; n < arr1.length; n++)
                    ret.push(arr1[n] + arr2[n]);
            }
            else {
                for (var n = 0; n < arr1.length; n++)
                    ret.push(arr1[n] + val);
            }
            return ret;
        };
        Vec.sub = function (arr1, val) {
            var ret = [];
            if (val.constructor === Array) {
                var arr2 = val;
                for (var n = 0; n < arr1.length; n++)
                    ret.push(arr1[n] - arr2[n]);
            }
            else {
                for (var n = 0; n < arr1.length; n++)
                    ret.push(arr1[n] - val);
            }
            return ret;
        };
        Vec.mul = function (arr1, val) {
            var ret = [];
            if (val.constructor === Array) {
                var arr2 = val;
                for (var n = 0; n < arr1.length; n++)
                    ret.push(arr1[n] * arr2[n]);
            }
            else {
                for (var n = 0; n < arr1.length; n++)
                    ret.push(arr1[n] * val);
            }
            return ret;
        };
        Vec.neg = function (arr) {
            var ret = arr.slice(0);
            for (var n = ret.length - 1; n >= 0; n--)
                ret[n] *= -1;
            return ret;
        };
        // bulk direct operations
        Vec.setTo = function (arr, val) { for (var n = arr == null ? -1 : arr.length - 1; n >= 0; n--)
            arr[n] = val; };
        Vec.addTo = function (arr, val) { for (var n = arr == null ? -1 : arr.length - 1; n >= 0; n--)
            arr[n] += val; };
        Vec.mulBy = function (arr, val) { for (var n = arr == null ? -1 : arr.length - 1; n >= 0; n--)
            arr[n] *= val; };
        Vec.addToArray = function (arr, val) { for (var n = arr == null ? -1 : arr.length - 1; n >= 0; n--)
            arr[n] += val[n]; };
        Vec.subFromArray = function (arr, val) { for (var n = arr == null ? -1 : arr.length - 1; n >= 0; n--)
            arr[n] -= val[n]; };
        Vec.mulByArray = function (arr, val) { for (var n = arr == null ? -1 : arr.length - 1; n >= 0; n--)
            arr[n] *= val[n]; };
        Vec.divByArray = function (arr, val) { for (var n = arr == null ? -1 : arr.length - 1; n >= 0; n--)
            arr[n] /= val[n]; };
        Vec.idxSort = function (arr) {
            var idx = new Array(arr.length);
            for (var n = 0; n < arr.length; n++)
                idx[n] = n;
            idx.sort(function (a, b) { return arr[a] < arr[b] ? -1 : arr[a] > arr[b] ? 1 : 0; });
            return idx;
        };
        // for some reason the default sorter has a dubious habit of doing a string comparison; this function is numeric
        Vec.sort = function (arr) {
            arr.sort(function (v1, v2) { return v1 - v2; });
        };
        Vec.sorted = function (arr) {
            arr = arr.slice(0);
            this.sort(arr);
            return arr;
        };
        // uniqueness, in its various permutations
        Vec.uniqueUnstable = function (arr) {
            return Array.from(new Set(arr)); // order is basically random
        };
        Vec.uniqueStable = function (arr) {
            var set = new Set(arr), ret = [];
            for (var _i = 0, arr_5 = arr; _i < arr_5.length; _i++) {
                var v = arr_5[_i];
                if (set.has(v)) {
                    ret.push(v);
                    set["delete"](v);
                }
            }
            return ret; // original order is preserved, with non-first entries removed*/
        };
        Vec.maskUnique = function (arr) {
            var set = new Set(arr), ret = this.booleanArray(false, arr.length);
            for (var n = 0; n < arr.length; n++)
                if (set.has(arr[n])) {
                    ret[n] = true;
                    set["delete"](arr[n]);
                }
            return ret;
        };
        Vec.idxUnique = function (arr) {
            var set = new Set(arr), ret = [];
            for (var n = 0; n < arr.length; n++)
                if (set.has(arr[n])) {
                    ret.push(n);
                    set["delete"](arr[n]);
                }
            return ret; // index of first occurence in original array
        };
        return Vec;
    }());
    WebMolKit.Vec = Vec;
    /*
        Permutation functions, operating explicitly on arrays of consecutive integers.
    */
    var Permutation = /** @class */ (function () {
        function Permutation() {
        }
        // for a set of indices that are assumed to be unique and in the range {0 .. N-1}, returns their parity, i.e.
        // the number of swaps used to permute it from the identity; if the list is sorted, the result is 0
        // NOTE: parityPerms(..) returns the total number of swaps, whereas parity(..) returns either 0 or 1
        Permutation.parityPerms = function (idx) {
            var v = Vec.booleanArray(false, idx.length);
            var p = 0;
            for (var i = idx.length - 1; i >= 0; i--) {
                if (v[i])
                    p++;
                else {
                    var j = i;
                    do {
                        j = idx[j];
                        v[j] = true;
                    } while (j != i);
                }
            }
            return p;
        };
        Permutation.parityIdentity = function (idx) {
            return this.parityPerms(idx) & 1;
        };
        // parity methods that operate on arbitrary integers; returns 0 for an even number of swaps, 1 for odd
        // NOTE: this is rather inefficient for non-tiny arrays; could at least code up some more special cases
        Permutation.parityOrder = function (src) {
            if (src.length <= 1)
                return 0;
            else if (src.length == 2)
                return src[0] < src[1] ? 0 : 1;
            else if (src.length == 3) {
                var p = 1;
                if (src[0] < src[1])
                    p++;
                if (src[0] < src[2])
                    p++;
                if (src[1] < src[2])
                    p++;
                return p & 1;
            }
            else if (src.length == 4) {
                var p = 0;
                if (src[0] < src[1])
                    p++;
                if (src[0] < src[2])
                    p++;
                if (src[0] < src[3])
                    p++;
                if (src[1] < src[2])
                    p++;
                if (src[1] < src[3])
                    p++;
                if (src[2] < src[3])
                    p++;
                return p & 1;
            }
            var idx = [], sorted = src.slice(0);
            sorted.sort();
            for (var n = 0; n < src.length; n++)
                idx.push(sorted.indexOf(src[n]));
            return this.parityIdentity(idx);
        };
        Permutation.smallPermutation = function (sz) {
            if (sz == 1)
                return this.PERM1;
            else if (sz == 2)
                return this.PERM2;
            else if (sz == 3)
                return this.PERM3;
            else if (sz == 4)
                return this.PERM4;
            else
                return null;
        };
        // returns all of the permutations up to a certain size; note that this is slow and scales exponentially: use sparingly
        Permutation.allPermutations = function (sz) {
            if (sz <= this.SMALL_PERMS)
                return this.smallPermutation(sz);
            while (this.PERM_CACHE.length < this.MAX_CACHE - this.SMALL_PERMS)
                this.PERM_CACHE.push(null);
            if (sz < this.MAX_CACHE && this.PERM_CACHE[sz - this.SMALL_PERMS] != null)
                return this.PERM_CACHE[sz - this.SMALL_PERMS];
            var nperms = 1;
            for (var n = 2; n <= sz; n++)
                nperms *= n;
            var perms = [];
            // NOTE: for sure not the fastest way to do it, but it gets the job done; the total number of iterations is actually
            // exponential, rather than factorial
            var idx = Vec.identity0(sz);
            perms.push(idx.slice(0));
            var mask = Vec.booleanArray(false, sz);
            for (var n = 1; n < nperms; n++) {
                nonunique: while (idx[0] < sz) {
                    // increment the "digits"
                    idx[sz - 1]++;
                    for (var i = sz - 1; i > 0; i--) {
                        if (idx[i] < sz)
                            break;
                        idx[i] = 0;
                        idx[i - 1]++;
                    }
                    // skip the loop if digits have any degeneracy
                    Vec.setTo(mask, false);
                    for (var _i = 0, idx_2 = idx; _i < idx_2.length; _i++) {
                        var i = idx_2[_i];
                        if (mask[i])
                            continue nonunique;
                        mask[i] = true;
                    }
                    // this is a new unique combo, so poke it in
                    perms[n] = idx.slice(0);
                    break;
                }
            }
            if (sz < this.MAX_CACHE)
                this.PERM_CACHE[sz - this.SMALL_PERMS] = perms;
            return perms;
        };
        /*
            Small permutations: up to a certain size, it makes sense to just hardcode them.
    
            Note that in each case, the identity permutation is guaranteed to be first. The remaining permutations
            are not guaranteed to be in any particular order.
        */
        Permutation.PERM1 = [[0]];
        Permutation.PERM2 = [[0, 1], [1, 0]];
        Permutation.PERM3 = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
        Permutation.PERM4 = [
            [0, 1, 2, 3], [0, 1, 3, 2], [0, 2, 1, 3], [0, 2, 3, 1], [0, 3, 1, 2], [0, 3, 2, 1],
            [1, 0, 2, 3], [1, 0, 3, 2], [1, 2, 0, 3], [1, 2, 3, 0], [1, 3, 0, 2], [1, 3, 2, 0],
            [2, 0, 1, 3], [2, 0, 3, 1], [2, 1, 0, 3], [2, 1, 3, 0], [2, 3, 0, 1], [2, 3, 1, 0],
            [3, 0, 1, 2], [3, 0, 2, 1], [3, 1, 0, 2], [3, 1, 2, 0], [3, 2, 0, 1], [3, 2, 1, 0]
        ];
        Permutation.SMALL_PERMS = 4;
        // cache: intermediate permutation sizes are cached; note that anything significantly big really should not be used
        Permutation.MAX_CACHE = 8;
        Permutation.PERM_CACHE = [];
        return Permutation;
    }());
    WebMolKit.Permutation = Permutation;
    /* EOF */ 
})(WebMolKit || (WebMolKit = {}));
