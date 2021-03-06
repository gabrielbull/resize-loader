var gm = require('gm').subClass({ imageMagick: true });
var path = require('path');
var PNG = require('pngjs').PNG;

function resizeImage(content, size, ext, callback) {
  size = parseInt(size);
  gm(content)
    .resize(size)
    .toBuffer(ext, function (err, buffer) {
      if (ext === 'png') {
        buffer = PNG.sync.write(PNG.sync.read(buffer));
      }
      callback(err, buffer);
    });
}

function parseQuery(query) {
  return {
    size: parseInt(query.replace(/^\?/, ''))
  };
}

module.exports = function(content) {
  var callback = this.async();
  this.cacheable && this.cacheable();
  this.addDependency(this.resourcePath);
  var options = parseQuery(this.query);

  //modified to fix a bug on windows, where the file variable is populated with the entire absolute path
  var parsedPath = path.parse(this.resourcePath);
  var ext = parsedPath.ext.slice(1);

  resizeImage(content, options.size, ext, function (err, buf) {
    if (err) throw err;
    callback(null, buf);
  });
};

module.exports.raw = true;
module.exports.pitch = function(remainingRequest) {
  if (remainingRequest.indexOf('!') !== -1) {
    var loader = this.loaders[this.loaderIndex];
    var remaining = remainingRequest.split('!');
    var r = remaining.slice(0, remaining.length - 1)
      .concat([
        loader.path + loader.query,
        remaining.pop()
      ])
      .join('!');
    return 'module.exports = require(' + JSON.stringify('-!' + r) + ');';
  }
};
