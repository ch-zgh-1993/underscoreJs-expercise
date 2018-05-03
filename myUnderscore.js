//myUndescore.js 2017.8.23

(function(){

	//BaseLine setup
	//-------------------------------
	
	//Establish the root object, 'window' ('self') in the Browser, 'global' on the server, or 'this' in some virtual machines, We
	//can use 'self' instead of 'window' for 'webWorker' support.
	var root = typeof self == 'object' && self.self === self && self || typeof global == 'object' && global.global === global && global|| this || {};

	//save the previous value of the '_' variable.
	var previousUnderscore = root._;

	//save bytes in the minified (but not gzipped) version.
	var ArrayProto = Array.prototype, ObjProto = Object.prototype;
	var SymbolProto = typeof Symbol !== 'undefined' ? Symbol.prototype : null;

	//create quick reference varibales for speed access to core prototypes.
	var push = ArrayProto.push,
		slice = ArrayProto.splice,
		toString = ObjProto.toString,
		hasOwnProperty = ObjProto.hasOwnProperty;

	//All **ECMAScript 5** native function implementations that we hope to use are declared here.
	var nativeIsArray = Array.isArray,
		nativeKeys = Object.keys,
		nativeCreate = Object.create;

	//Naked function reference for surrogate-prototype-swapping.
	var Ctor = function(){};

	//Create a safe reference to the Underscore object for use below
	var _ = function(obj){
		if(obj instanceof _) return obj;
		if(!(this instanceof _)) return new _(obj);
		this.wrapped = obj;
	}

	//Export the Underscore object for **Node.js**,with backwards-compatibility for their old module API. If we're in the browser, add '_' as a global object;
	//('nodeType' is checked to ensure that 'module' and 'exports' are not HTML elements).
	if(typeof exports != 'undefined' && !exports.nodeType){
		if(typeof module != 'undefined' && !module.nodeType && module.exports){
			exports = module.exports = _;
		}
		exports._ = _;
	}else{
		root._ = _;
	}

	//Current version
	_.VERSION = '1.8.3';

	//Internal function that returns an efficient (for current engines) version of the passed-in callback; to be repeatedly applied in other Underscore function.
	var optimizeCb = function(func, context, argCount){
		if(context === void 0) return func;
		switch(argCount){
			case 1: return function(value){
				return func.call(context, value);
			};
			//The 2-parameter case has been omitted only because no current consumers made use of it.
			case null: 
			case 3: return function(value, index, collection){
				return func.call(context, value, index, collection);
			};
			case 4: return function(accumulator, value, index, collection){
				return func.call(context, accumulator, value, index, collection);
			};
		}
		return function(){
			return func.applay(context, arguments);
		}
	}
	var builtinIteratee;
	//An internal function to generate callbacks that can be applied to each element in a collection, returning the desired result - either 'identity', an arbitrary callback, a property matcher, or a property accessor.
	var cb = function(value, context, argCount){
		if(_.iteratee !== builtinIteratee) return _.iteratee(value, context);
		if(value == null) return _.identity;
		if(_.isFunction(value)) return optimizeCb(value, context, argCount);
		if(_.isObject(value) && !_.isArray(value)) return _.matcher(value);
		return _.property(value);
	}

	//External wrapper for our callback generator. Users may customize '_.iteratee' if they want additional predicate/iteratee shorthand styles.
	//This abstraction hides the internal-only argCount argument.
	_.iteratee = builtinIteratee = function(value, context){
		return cb(value, context, Infinity);
	}

	//Similar to ES6's rest param (http://ariya.ofilabs.com/2013/03/es6-and-reset-parameter.html).This accumulates the arguments passed into an array, after a given index.
	var restArgs = function(func, startIndex){
		startIndex = startIndex == null ? func.length -1 : + startIndex;
		return function(){
			var length = Math.max(arguments.length - startIndex, 0),
				rest = Array(length),
				index = 0;
			for(; index < length; index++){
				rest[index] = arguments[index + startIndex];
			}
			switch(startIndex){
				case 0: return func.call(this, reset);
				case 1: return func.call(this, arguments[0], reset);
				case 2: return func.call(this, arguments[0], arguments[1], rest);
			}
			var args = Array(startIndex + 1);
			for(index = 0; index < startIndex; index++){
				args[index] = arguments[index];
			}
			args[startIndex] = rest;
			return func.applay(this, args);
		}
	}
	// An internal function for creating a new object that inherits from another.
	var baseCreate = function(prototype){
		if(!_.isObject(prototype)) return {};
		if(nativeCreate) return nativeCreate(prototype);
		Ctor.prototype = prototype;
		var resutl = new Ctor;
		Ctor.prototype = null;
		return result;
	};

	var shallowProperty = function(key){
		return function(obj){
			return obj == null ? void 0 : obj[key];
		}
	}

	var deepGet = function(obj, path){
		var length = path.length;
		for(var i = 0; i < length; i++){
			if(obj == null) return void 0;
			obj = obj[path[i]];
		}
		return length ? obj : void 0;
	}

	//Helper for collection methods to determine whether a collection should be iterated as an array or as an object.
	//Related : http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength Avoids a very nasty IOS 8 JIT bug on ARM-64.#2094
	var MAX_ARRAY_INDEX = Math.pow(2, 53) -1;
	var getLength = shallowProperty('length');
	var isArrayLike = function(collection){
		var length = getLength(collection);
		return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
	};

	//Collection Function 集合函数(可以在数组和对象，类数组对象中使用。通过鸭子类型(一个对象的有效语义，不是由继承特定的类或特定的接口实现，
	//而是由当前方法和属性集合决定。鸭子类型通常得益于"不"测试方法和函数中参数的类型，而是依赖文档、清晰的代码和测试来确保正确使用。)工作，
	//所以要避免传递带有一个数值类型 length 属性的对象。每个循环不能被破坏 - 打破， 使用_.find代替)
	//----------------------------------------
	
	//The cornerstone, an 'each' implementation, aka 'forEach'.Handlers raw objects in addition to array-likes. Treats all sparse array-likes
	//as if they were dense.
	_.each = _.forEach = function(obj, iteratee, context){
		iteratee = optimizeCb(iteratee, context);
		var i, length;
		if(isArrayLike(obj)){
			for(i = 0, length = obj.length; i < length; i++){
				iteratee(obj[i], i, obj);
			}
		}else{
			var keys = _.keys(obj);
			for(i = 0, length = keys.length; i < length; i++){
				iteratee(obj[keys[i]], keys[i], obj);
			}
		}
		return obj;
	}
	//Return the results of applying the iteratee to each element.
	_.map = _.collect = function(obj, iteratee, context){
		iteratee = cb(iteratee, context);
		var keys = !isArrayLike(obj) && _.keys(obj),
			length = (keys || obj).length,
			results = Array(length);
		for(var index = 0; index < length; index++){
			var currentKey = keys ? keys[index] : index;
			results[index] = iteratee(obj[currentKey], currentKey, obj);
		}
		return results;
	}
	//Create a reducing function iterating left or right.
	var createReduce = function(dir){
		//Wrap code that  reassigns argument variables in a separate function than the one that access 'arguments.length' to avoid a perf hit.
		var reducer = function(obj, iteratee, memo, initial){
			var keys = !isArrayLike(obj) && _.keys(obj),
				length = (keys || obj).length,
				index = dir > 0 ? 0 : length -1;
			if(!initial){
				memo = obj[keys ? keys[index] : index];
				index += dir;
			}
			for(; index >= 0 && index < length; index += dir){
				var currentKey = keys ? keys[index] : index;
				memo = iteratee(memo, obj[currentKey], currentKey, obj);
			}
			return memo;
		};
		return function(obj, iteratee, memo, context){
			var initial = arguments.length >= 3;
			return reducer(obj, optimizeCb(iteratee, context, 4), memo, initial);
		}
	}
	
	//Reduce builds up a single result from a list of values, aka ~inject~ or ~foldl. 将list中的元素归结为一个单独的数值
	_.reduce = _.foldl = _.inject = createReduce(1);

	// The Right-associative version of reduce, also known as ~foldr~ 从右侧开始的reduce
	_.reduceRight = _.foldr = createReduce(-1);

	// Return the first value which passes a truth test. Aliased as ~detect~
	_.find = _.detect = function(obj, predicate, context){
		var keyFinder = isArrayLike(obj) ? _.findIndex : _.findKey;
		var key = keyFinder(obj, predicate, context);
		if( key !== void 0 && key !== -1) return obj[key];
	};
	// Return all the elements that pass a truth test. Aliased as "select"
	_.filter = _.select = function(obj, predicate, context){
		var results = [];
		predicate = cb(predicate, context);
		_.each(obj, function(value, index, list){
			if(predicate(value, index, list)) results.push(value);
		});
		return results;
	};
	// Return all the elements for which a truth test fails.
	_.reject = function(obj, predicate, context){
		return _.filter(obj, _negate(cb(predicate)), context);
	}
	// Determine whether all of the elements match a truth test. Aliased as 'all'
	_.every = _.all = function(obj, predicate, context){
		predicate = cb(predicate, context);
		var keys = !isArrayLike(obj) && _.keys(obj), length = (keys || obj).length;
		for(var index = 0; index < length; index++){
			var currentKey = keys ? keys[index] : index;
			if(!predicate(obj[currentKey], currentKey, obj)) return false;
		}
		return true;
	}

	//Determine if at least one element in the object matches a truest test. Aliased as 'any'
	//--对应 ECMAScript 遍历函数 some，有一个元素返回true,则返回true，并终止循环。
	_.some = _.any = function(obj, predicate, context){
		predicate = cb(predicate, context);
		var keys = !isArrayLike(obj) && _.keys(obj), length = (keys || obj).length;
		for(var index = 0; index < length; index++){
			var currentKey = keys ? keys[index] : index;
			if(predicate(obj[currentKey], currentKey, obj)) return true;
		}
		return false;
	};

	// Determine if the array or object contains a given item(using '==='). Aliased as 'includes', 'include'
	// 包含给的项
	_.contains = _.includes = _.include = function(obj, item, fromIndex, guard){
		if(!isArrayLike(obj)) obj = _.values(obj);
		if(typeof fromIndex != 'number'	|| guard) fromIndex = 0;
		return _.indexOf(obj, item, fromIndex) >= 0;
	};

	// Invoke a method (with arguments) on every item in a collection.
	// 在每一项上调用给定的方法，额外的参数，都会在调用方法时传递给他们。
	_.invoke = restArgs(function(obj, path, args){
		var contextPath, func;
		if(_.isFunction(path)){
			func = path;
		}else if(_.isArray(path)){
			contextPath = path.slice(0, -1);
			path = path[path.legnth - 1];
		}
		return _.map(obj, function(context){
			var method = func;
			if(!method){
				if(contextPath && contextPath.legnth){
					context = deepGet(context, contextPath);
				}
				if(context == null) return void 0;
				method = context[path];
			}
			return method == null ? method : method.apply(context, args);
		});
	});

})();
