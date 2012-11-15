var neo4j = require('neo4j');
var txtwiki = require('../txtwiki.js/txtwiki.js');
var xml = require('xml-object-stream');
var fs = require('fs');
var wpage = require('./wikiPage.js');

var readStream = fs.createReadStream('./data/enwiki-latest-pages-articles.xml');
var parser = xml.parse(readStream);

var i = 0;
var start = (new Date).getTime();
var diff = 0;

var db = new neo4j.GraphDatabase('http://localhost:7474');

parser.each('page',function (page) {
	
	if (page.ns.$text == "0") {
		
		// console.log(page.title.$text);
		
		/*
		if (page.title.$text == "Budapest") {
			console.log(page.revision.text.$text);
			parser.pause();
		}*/
		
		var p = new wpage.wikiPage(db,page.title.$text);
		p.setVerified(true);
		
		txtwiki.on("link",p.addLink);
		txtwiki.parseWikitext(page.revision.text.$text);
		txtwiki.off("link",p.addLink);
		
		p.save();
	}
	
	if (i%2000 == 0 && i != 0) {
		diff = (new Date).getTime() - start;
		console.log("\nprocessed "+i+" articles in "+diff+"ms");
		var times = txtwiki.getTimes();
		for (func in times) {
			var percent = 0;
			if (times[func] > 0)
				percent = Math.round((times[func]/diff)*100);
			console.log(func+"() took "+times[func]+"ms ("+percent+"%)");
		}
		console.log("4 million articles in "+(Math.round(((((4000000/i)*(diff/1000))/60)/60)*100)/100)+" hours");
		// txtwiki.resetTimes();
		// start = (new Date).getTime();
	}
	
	i++;
});