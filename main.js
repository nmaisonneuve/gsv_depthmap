var redis = require("redis");
var csv = require('csv');
var DepthDecoder = require('./depth_decoder.js');
var image = require('./generate_depth_image.js');
console.log(image);
//set of images to use
set_images = "paris"

// connect to the database storing the Google Street view metadata
client = redis.createClient();
client.on("error", function (err) { console.log("Error " + err); });

// retrieve all the panoIDs of (Paris)
client.smembers("area:"+set_images, function(err1, panoIDs){
  // for only the first 20 ones
  panoIDs.slice(1,20).forEach(function(panoID){
    
    // give the meta data stored in the redis db 
    client.get(panoID, function(err2, meta_data){
        // decode the depth from the metadata
        decode_depthdata(meta_data);
    });
    // quit the redis client
    //client.quit();
  });
});

function decode_depthdata(json_meta_data){
  var data = JSON.parse(json_meta_data);
  var panoID = data.Location.panoId;
 
    if (data.model != undefined) {

    var depth_map_data = data.model.depth_map;

    DepthDecoder.decode(depth_map_data, function(depth_data){
      // generating images 
      image.write_img(depth_data, panoID);
      image.write_plane(depth_data, panoID);
      // OR
      // generating a CSV
      // csv().from.array(depth_data.depth).to.path(__dirname+"/"+panoID+"_depth.csv").end();
    });
  }else{
    console.log("pano "+data.Location.panoId +" doesn't have depth map");
  }
}

function check_number(){
  // Check the number of panorama for Paris in the redis database
client.scard("area:"+set_images ,function(err0, nb ){
  // nb of panorama saved
  console.log(nb + " panoramic images stored for "+set_images);
  });
}

//