var redis = require("redis");
var csv = require('csv');
var fs = require('fs');
var PNG = require('pngjs').PNG;
var color = require('onecolor');
var DepthDecoder = require('./depth_decoder.js');


client = redis.createClient();
 
client.on("error", function (err) {
    console.log("Error " + err);
});

// reading redis database
client.scard("area:paris",function(err0, nb ){
	
	// nb of panorama saved
	console.log(nb);

	client.smembers("area:paris", function(err1, panoIDs){

		// for each panorama  (debugging: only the first ones, 1 to 5)
		panoIDs.slice(1,20).forEach(function(panoID){

			client.get(panoID, function(err2, metadata){

			 	var data = JSON.parse(metadata);
			 	var depth_map_data = data.model.depth_map;
			 	DepthDecoder.decode(depth_map_data, function(raw){
			 		write_img(raw, panoID);
			 		//csv().from.array(data_csv).to.path(__dirname+"/"+panoID+"_depth.csv").end();
			 	}); 
			});
		})
	});
});

function write_pane(data, panoID){
		var colors = new Array();
	for (var i = 0; i < data.numDepths; i++){
		 hue = (255.0 * i) / data.numDepths;
		//hue = Math.floor(Math.random() * 255);
		//console.log(hue);
		colors.push(gen_color(hue));
	}
}

function write_img(data,panoID){
	var png = new PNG({
    width: 512,
    height: 256,
    filterType: -1
	});

	for (var y = 0; y < data.height; y++) {
    for (var x = 0; x < data.width; x++) {
    	var idx = (data.width * y + x) << 2;
    	var c = Math.min(data.depth[y * data.width + x] / 50.0 * 255, 255);
    	png.data[idx  ] = c ;
      png.data[idx+1] = c ;	
      png.data[idx+2] = c ;
    	png.data[idx+3] = 255;    
    }
  }
	png.pack().pipe(fs.createWriteStream(__dirname + "/"+ panoID+"_depth.png"));
	console.log("finished.");
}

function gen_color(hue){
	var _color = color("hsl("+hue+", 100%, 75%)")
	return [_color.red() * 255, _color.green() * 255, _color.blue() * 255]
}

// array extension to debug 
Array.prototype.getUnique = function(){
   var u = {}, a = [];
   for(var i = 0, l = this.length; i < l; ++i){
      if(u.hasOwnProperty(this[i])) {
         continue;
      }
      a.push(this[i]);
      u[this[i]] = 1;
   }
   return a;
}

//client.quit();