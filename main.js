var redis = require("redis");
var csv = require('csv');
var fs = require('fs');
var DepthDecoder = require('./depth_decoder.js');


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
    client.get(panoID, function(err2, metadata){
        // decode the depth from the metadata
        decode_depthdata(json_meta_data);
    });
    // quit the redis client
    client.quit();
  });
});

function decode_depthdata(json_meta_data){
  var data = JSON.parse(metadata);
  var depth_map_data = data.model.depth_map;
  DepthDecoder.decode(depth_map_data, function(depth_data){
    // generating images 
    write_img(depth_data, panoID);

    // OR
    // generating a CSV
    // csv().from.array(depth_data.depth).to.path(__dirname+"/"+panoID+"_depth.csv").end();
  }
}

function check_number(){
  // Check the number of panorama for Paris in the redis database
client.scard("area:"+set_images ,function(err0, nb ){
  // nb of panorama saved
  console.log(nb + " panoramic images stored for "+set_images);
  });
});
}

//