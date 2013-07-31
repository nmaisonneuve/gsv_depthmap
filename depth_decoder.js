var zlib = require('zlib');
var pack = require('jspack').jspack;
var _ = require('underscore')._;

/*
Nicolas Maisonneuve - 2013
*/
module.exports =  {

  decode: function(googleRawData, callback) {
    var me = this;
    // decompress the data 
    me.decompress(googleRawData, function(raw_data){
      data = me.parse(raw_data);
      // then computing the depth map
      depthMap = me.computeDepthMap(data.header, data.indices, data.planes);
      callback(depthMap);
    });
  },

  /**
  * Decompressing data sent by google
  *  = decoding 64 encoded data + unzipped
  **/
  decompress: function(rawDepthMap, fct){
    // Append '=' in order to make the length of the array a multiple of 4
    while(rawDepthMap.length %4 != 0) rawDepthMap += '=';
    
    // Replace '-' by '+' and '_' by '/'
    rawDepthMap = rawDepthMap.replace(/-/g,'+');
    rawDepthMap = rawDepthMap.replace(/_/g,'/');

    // decode from base64 encodage
    var buffer = new Buffer(rawDepthMap, 'base64');

    // decompression
    zlib.unzip(buffer, function(err, depthMap) {
        if (!err) fct(depthMap);
        else console.log("ERROR: "+err);
    });
  },

  parse: function(raw){
    // handling header
    tmp = pack.Unpack('<BHHHB', raw.slice(0,8), 0);
    var header = {
        headerSize: tmp[0],
        numberPlanes: tmp[1],
        width : tmp[2],
        height : tmp[3],
        offset : tmp[4]
    };

    // reading the depth index
    var indices = _.map(raw.slice(header.offset, header.offset + header.width * header.height), function(x){
        return x ; 
    });

    // reading the planes
    var pos = header.headerSize + indices.length;
    var planes = [];
    for ( var  i = 0 ; i < header.numberPlanes; i++){
        var infos = pack.Unpack('<ffff', raw.slice(pos,pos + 16));
        planes.push({n: [infos[0], infos[1],  infos[2]], d: infos[3]});
        pos += 16
    }

    return {
      header: header,
      indices : indices,
      planes: planes
    };
  },

  computeDepthMap : function(header, indices, planes) {
    var depthMap = null,
        x, y,
        planeIdx,
        phi, theta,
        v = [0, 0, 0],
        w = header.width, h = header.height,
        plane, t, p;
    
    depthMap = new Float32Array(w * h);

    // https://github.com/PaulWagener/Streetview-Explorer/blob/master/src/Panorama.cpp
    for(y = 0; y < h; ++y) {
      for(x = 0; x < w; ++x) {
        planeIdx = indices[y* w + x];
        if (planeIdx > 0) {
          phi = (w - x - 1) / (w - 1) * 2 * Math.PI + Math.PI/2;
          theta = (h - y - 1) / (h - 1) * Math.PI;

          v[0] = Math.sin(theta) * Math.cos(phi);
          v[1] = Math.sin(theta) * Math.sin(phi);
          v[2] = Math.cos(theta);
          plane = planes[planeIdx];
          t = plane.d / (v[0]*plane.n[0] + v[1]*plane.n[1] + v[2]*plane.n[2]);
          v[0] *= t;
          v[1] *= t;
          v[2] *= t;
          depthMap [y * w + (w - x - 1)] = Math.sqrt( v[0]*v[0] + v[1] * v[1] + v[2] * v[2]);
        } else {
          depthMap[y * w + (w - x - 1)] = -1; //9999999999999999999.;
        }
      }
    }

    return {
        width: w,
        height: h,
        depth: depthMap
    };
  }
};