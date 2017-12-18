//myUndescore.js 2017.8.23

(function(){

	//BaseLine setup
	//-------------------------------
	
	//Establish the root object, 'window' ('self') in the Browser, 'global' on the server, or 'this' in some virtual machines, We
	//can use 'self' instead of 'window' for 'webWorker' support.
	var root = typeof self == 'object' && self.self === self && self || typeof global == 'object' && global.global === global && global|| this || {};
    
    
}();
