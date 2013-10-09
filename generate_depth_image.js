var PNG = require('pngjs').PNG;
var color = require('onecolor');
var fs = require('fs');

module.exports = {
  write_img: function (data, panoID){
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
    console.log("depth map finished.");
  },

  write_plane: function(data, panoID){
    var colors = [];
    console.log(data.planes.length+" planes for "+panoID);
    for (var i = 0; i < data.planes.length; i++){
       //hue = (255.0 * i) / data.planes.length;
        hue = Math.floor(Math.random() * 255);
      colors.push(this.gen_color(hue));
    };

    var png = new PNG({
      width: 512,
      height: 256,
      filterType: -1
    });

    for (var y = 0; y < data.height; y++) {
      for (var x = 0; x < data.width; x++) {
        var idx = (data.width * y + x) << 2;

        plane_idx =  data.indices[y* data.width + x];
        if (plane_idx > 0){
          
          _color = colors[plane_idx];
          //console.log(idx+" "+x+" "+y+" "+plane_idx +  " "+color);
          png.data[idx  ] = _color[0]; // ;
          png.data[idx+1] = _color[1] ; 
          png.data[idx+2] = _color[2] ;
          png.data[idx+3] = 255;   
        }else{
          png.data[idx  ] = 255; // ;
          png.data[idx+1] = 255; 
          png.data[idx+2] = 255;
          png.data[idx+3] = 255;  
        }
      }
    }
    png.pack().pipe(fs.createWriteStream(__dirname + "/"+ panoID+"_plane_v2.png"));
    console.log(data.planes.length+" planes segmentation finished.");
  },

  // generating RBG colors from HUE
  gen_color: function (hue){
    var _color = color("hsl("+hue+", 100%, 75%)");
    return [Math.round(_color.red() * 255), Math.round(_color.green() * 255), Math.round(_color.blue() * 255)]
  }
}