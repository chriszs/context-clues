var express = require('express'),
	http = require('http'),
	path = require('path'),
	app = express(),
	io = require('socket.io'),
	neo4j = require('neo4j');

exports.init = function () {

	app.configure(function(){
		app.set('port', 80);
		app.use(express.bodyParser());
		app.use(express.methodOverride());
		app.use(express.static(path.join(__dirname, 'public')));
	});

	var httpServer = http.createServer(app).listen(app.get('port'), function() {
		console.log("Express server listening on port " + app.get('port'));
	});
	
	var index = new Array();
	
	function inIndex(r) {
		if (index[r.id] != undefined)
			return true;
			
		return false;
	}
	
	function addToIndex(r) {
		if (index[r.id] == undefined) {
			index[r.id] = r;
		}
	}
	
	
	app.get('/', function (req, res) {
	  res.sendfile('/public/index.html');
	});

	app.use(express.static('/public'));
	
	io = io.listen(httpServer);
	
	io.set('log level', 1);
	
	var db = new neo4j.GraphDatabase('http://localhost:7474');
	
	io.sockets.on('connection', function (socket) {
		
		var relationshipAdded = function (err,res) {
			if (err) {
				console.log("no rels returned: " + err);
			}
			else {
				for (i in res) {
				//	console.log(res[i]);
					var r = res[i].r[0];
					
					var startgroup = r.start.id;
					var endgroup = r.end.id;
					if (res[i].r.length > 1) {
						r = res[i].r[1];
						endgroup = r.start.id;
					}
					
					if (inIndex(r))
						continue;
						
					addToIndex(r);
					
					var rel = {
						id : r.id,
						start : {
							id : r.start.id,
							title : res[i].n.data.title,
							group: startgroup,
							verified : res[i].n.data.verified
							
						},
						end :  {
							id : r.end.id,
							title : res[i].m.data.title,
							group: endgroup,
							verified : res[i].m.data.verified
						}
					}
					
					// console.log("relationshipAdded");
					
					socket.emit('relationshipAdded', rel);
				}
			}
		}
		
		var title = "";
		
		var interval = setInterval(doQuery,20000);
		
		function doQuery() {
			db.query("start n=node:pages(title = \"" + title + "\") match (n)-[r*1..2]->(m) return n,r,m",{},relationshipAdded);
		}
		
		socket.on('setTitle',function (t) {
			title = t.title;
			
			console.log("querying database for "+title);
			
			index = new Array();
			
			doQuery();
		});
	});
}

var server = exports.init();