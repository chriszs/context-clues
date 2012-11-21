
function pageGraph () {
	var forceOn,forceTimer,processTimer,graph,sig,socket,queue;

	function connect() {
		socket = io.connect('http://localhost');
		socket.on('connect',doQuery);
	}
	
	function doQuery() {
		if(window.location.hash) {
			socket.emit('setTitle',{'title':window.location.hash.slice(1)});
		}
		else {
			socket.emit('setTitle',{'title':'Abraham Lincoln'});
		}
	}
	
	function setup() {
		forceOn = false;
		color = "";
		queue = new Array();
	}
	
	function reset() {
		sig.emptyGraph();
		
		setup();
		doQuery();
	}
	
	function init () {
		graph = document.getElementById("graph");
		
		graph.style.width = document.body.clientWidth;
		graph.style.height = document.body.clientHeight;
		
		sig = sigma.init(graph);
		
		sig.drawingProperties({
			defaultLabelColor: '#fff',
			defaultLabelSize: 14,
			labelThreshold: 5
		})
		sig.graphProperties({
			minNodeSize: 0.5,
			maxNodeSize: 5,
			minEdgeSize: 1,
			maxEdgeSize: 5
		});
		
		setup();
		
		processQueue();
	}
	
	function processQueue() {
		if (queue.length > 0) {
			stopForce();
			clearTimeout(forceTimer);
			
			var r;
			for (i in queue) {
				r = queue[i];
				
				addNode(r.start);
				addNode(r.end);
			
				addEdge(r);
			}
			
			queue = new Array();
			
			forceTimer = setTimeout(startForce,100);
		}
	}
	
	function relationshipAdded(r) {
		clearTimeout(processQueue);
		queue.push(r);
		processTimer = setTimeout(processQueue,100);
	}
	
	function startForce() {
		if (!forceOn) {
			sig.startForceAtlas2();
			forceOn = true;
		}
	}
	
	function stopForce() {
		if (forceOn) {
			sig.stopForceAtlas2();
			forceOn = false;
		}
	}
	
	function addNode (n) {
		var color = "rgb(100,100,100)";
		if (n.verified) {
			color = "rgb(150,0,0)";
		}
		try {
			sig.addNode(n.id,{
				'x': Math.random()*10,
				'y': Math.random()*10,
				'size': 1,
				'color': color,
				'label': n.title,
				'cluster':n.group,
			});
		}
		catch (err) {
			sig.iterNodes(function (node,i) {
				if (node.outDegree > 1) {
					node.size = 2;
				}
				else if (node.inDegree > 1) {
					node.size = 1.5;
				}
				
				if (node.color != color) {
					node.color = color;
				}
				
				return node;
			},[n.id]);
		}
	}
	
	function addEdge (r) {
		try {
			sig.addEdge(r.id,r.start.id,r.end.id,{
				'color':'rgb(50,50,50)'
			});
		}
		catch (err) {
			console.log("failed to add edge");
		}
	}
	
	this.init = init;
	this.reset = reset;
	connect();
	socket.on('relationshipAdded', relationshipAdded);

}

var pg = new pageGraph();

window.addEventListener('hashchange', pg.reset, false);

if (document.addEventListener) {
	document.addEventListener('DOMContentLoaded', pg.init, false);
} else {
	window.onload = pg.init;
}
