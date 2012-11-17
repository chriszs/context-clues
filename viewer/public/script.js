function init () {
	var sig = sigma.init(document.getElementById("graph"));
	var socket = io.connect('http://localhost');
	
	sig.drawingProperties({
		defaultLabelColor: '#fff',
		defaultLabelSize: 14,
		defaultLabelBGColor: '#fff',
		defaultLabelHoverColor: '#000',
		labelThreshold: 1000,
		defaultEdgeType: 'curve'
	})
	sig.graphProperties({
		minNodeSize: 0.5,
		maxNodeSize: 5,
		minEdgeSize: 1,
		maxEdgeSize: 5
	})
	sig.mouseProperties({
		maxRatio: 32
	});
	
	socket.on('nodeAdded', function (n) {
		try {
			sig.addNode(n.id,{
				'x': 1,
				'y': 1,
				'size': 2,
				'label': n.title
			});
			
			console.log("nodeAdded");
		}
		catch (err) {
			// do nothing
		}
	});
	
	var i = 0;
	
	function range(x,a,b,min,max) {
		return ((b-a)*(x - min))/(max - min) + a;
	}
	
	socket.on('relationshipAdded', function (r) {
		
		var color = 'rgb('+Math.round(100)+','+
                      Math.round(range(i,0,700,256,30))+','+
                      Math.round(range(i,0,700,30,256))+')';
		
		
		if (i < 700) {
			try {
				sig.addNode(r.start.id,{
					'x': Math.random(),
					'y': Math.random(),
					'size': 1,
					'color':color,
					'label': r.start.title,
					'cluster':r.start.id
				});
			}
			catch (err) {
				// do nothing
			}
			
			try {
				sig.addNode(r.end.id,{
					'x': Math.random(),
					'y': Math.random(),
					'size': 1,
					'color':color,
					'label': r.end.title,
					'cluster':r.start.id
				});
			}
			catch (err) {
				// do nothing
			}
			
			try {
				sig.addEdge(r.id,r.start.id,r.end.id,{'color':color,'hidden':0});
				// console.log("relationshipAdded");
			}
			catch (err) {
				console.log("failed to add edge");
			}
		}
		else if (i == 701) {
			sig.startForceAtlas2();
		}
		i++;
	});
}

if (document.addEventListener) {
	document.addEventListener('DOMContentLoaded', init, false);
} else {
	window.onload = init;
}
