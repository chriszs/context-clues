exports.wikiPage = function (db,title) {
	// console.log("new "+title);
	var links = new Array();
	var verified = false;
	var callback = function (n) {
		//	console.log("called empty function");
	};
	var node = null;
	var me = this;
	
	this.save = function (c) {
	//	console.log("save "+title);
		if (typeof c == "function") {
			callback = c;
		}
		db.getIndexedNode("pages","title",title,me.setupNode);
	}
	
	this.setVerified = function (v) {
		verified = v;
	}
	
	this.relationSaved = function (err,result) {
		console.log("relationSaved "+title);
		if (err) {
			console.log("problem saving relation");
		}
	}
	
	this.saveRelation = function (n) {
		// console.log(node.id + "->" + n.id);
		node.createRelationshipTo(n,"link",{},me.relationSaved);
	}
	
	this.saveLinks = function () {
	//	console.log("saveLinks "+title);
		for (i in links) {
			links[i].save(me.saveRelation);
		}
	}
	
	this.nodeSaved = function (err,n) {
	//	console.log("nodeSaved "+title);
		if (err) {
			console.log("problem saving node:" + err);
		}
		else {
			// console.log(n);
			node = n;
			callback(n);
			// console.log("save links called");
			// console.log(this);
			me.saveLinks();
		}
	}
	
	this.setupNode = function (err, n) {
		// console.log("setupNode "+title);
		
		if (err || n == null) {
			n = db.createNode({"title":title,"verified":verified});
			
			n.save(me.nodeSaved);
		}
		else {
			// console.log(n);
			node = n;
			callback(n);
			// console.log("save links called");
			// console.log(this);
			saveLinks();
		}
	}
	
	this.addLink = function (page,text) {
		// console.log("addLink "+title);
		
		var parts = page.split(":");
		if (parts.length == 1 ) {
			// console.log(title+"=>"+page);
			var p = new exports.wikiPage(db,page);
			links.push(p);
		}
	}
}