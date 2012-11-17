var events = require("events");

var emitter = new events.EventEmitter();
var queue = new Array();
var currentp = null;

exports.getWorking = function () {
	var count = 0;
	for (i in queue) {
		count++;
	}
	return count;
}

exports.on = function (event, listener) {
	emitter.on(event, listener);
}

var handleProcessed = function (p) {
	if (currentp == p) {
		currentp = queue.shift();
		currentp.start();
	}
}

exports.on("processed",handleProcessed);

exports.wikiPage = function (db,title) {
	var links = new Array();
	var verified = false;
	var callback = function (n) {
	};
	var node = null;
	var me = this;
	var relationsLeft = 0;
	
	this.getTitle = function () {
		return title;
	}
	
	this.setVerified = function (v) {
		verified = v;
	}
	
	this.addLink = function (page,text) {
		var parts = page.split(":");
		if (parts.length == 1 ) {
			var p = new exports.wikiPage(db,page);
			links.push(p);
		}
	}
	
	this.queue = function () {
		if (verified && currentp == null) {
			currentp = me;
			me.save(callback);
		}
		else if (verified) {
			queue.push(this);
		}
	}
	
	this.save = function (c) {
		if (typeof c == "function") {
			callback = c;
		}
		me.start();
	}
	
	this.start = function () {
		db.getIndexedNode("pages","title",title,me.retrieveNode);
	}
	
	this.retrieveNode = function (err, n) {
		if (err || n == null) {
			n = db.createNode({"title":title,"verified":verified});
			
			n.save(me.nodeSaved);
		}
		else {
			emitter.emit("nodeAdded",n);
			node = n;
			callback(n);
			me.saveLinks();
			me.updateNode();
		}
	}
	
	this.nodeSaved = function (err,n) {
		if (err) {
			console.log("problem saving node:" + err);
		}
		else {
			// console.log("created "+n.data.title);
			emitter.emit("nodeAdded",n);
			node = n;
			n.index("pages","title",title,me.nodeIndexed);
		}
	}
	
	this.nodeIndexed = function (err,result) {
		if (err) {
			console.log("problem saving node:" + err);
		}
		else {
			me.saveLinks();
			callback(node);
		}
	}
	
	this.saveLinks = function () {
		relationsLeft = links.length;
		for (i in links) {
			links[i].save(me.saveRelation);
		}
		if (links.length == 0) {
			emitter.emit("processed",me);
		}
	}
	
	this.saveRelation = function (n) {
		node.createRelationshipTo(n,"link",{},me.relationSaved);
	}
	
	this.relationSaved = function (err,r) {
		if (err) {
			console.log("problem saving relation:"+err);
		}
		else {
			// console.log(r.start.data.title + "->" + r.end.data.title);
			emitter.emit("relationshipAdded",r);
		}
		relationsLeft--;
		if (relationsLeft == 0) {
			emitter.emit("processed",me);
		}
	}
	
	this.updateNode = function () {
		if (verified && !node.data.verified) {
			node.data.verified = true;
			node.save(me.nodeUpdated);
		}
	}
	
	this.nodeUpdated = function (err,result) {
		if (err) {
			console.log("problem saving node:" + err);
		}
	}
}