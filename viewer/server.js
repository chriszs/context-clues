var express = require('express'),
	http = require('http'),
	path = require('path'),
	app = express(),
	io = require('socket.io'),
	events = require('events');

exports.init = function (driver) {

	app.configure(function(){
		app.set('port', 80);
		app.use(express.bodyParser());
		app.use(express.methodOverride());
		app.use(express.static(path.join(__dirname, 'public')));
	});

	var httpServer = http.createServer(app).listen(app.get('port'), function() {
		console.log("Express server listening on port " + app.get('port'));
	});


	app.get('/', function (req, res) {
	  res.sendfile('/public/index.html');
	});

	app.use(express.static('/public'));
	
	io = io.listen(httpServer);
	
	io.sockets.on('connection', function (socket) {
	/*
		var nodeAdded = function (n) {
			var node = {
				id : n.id,
				title : n.data.title
			}
			
			// console.log("nodeAdded");
			
			socket.emit('nodeAdded', node);
		}
		
		driver.on('nodeAdded',nodeAdded);*/
		
		var relationshipAdded = function (r) {
			var rel = {
				id : r.id,
				start : {
					id : r.start.id,
					title : r.start.data.title
				},
				end :  {
					id : r.end.id,
					title : r.end.data.title
				}
			}
			
			// console.log("relationshipAdded");
			
			socket.emit('relationshipAdded', rel);
		}
		
		driver.on('relationshipAdded',relationshipAdded);
	});
}