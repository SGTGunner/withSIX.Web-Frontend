var config = require('../../../bower.json');

var deps = [];
for (var i in config.dependencies) {
   var e = config.dependencies[i];
   var isRemote = (e.indexOf("http") != -1) || (e.indexOf("git") != -1);
	deps.push((isRemote ? i+"=" : "") + "bower:" + (isRemote ? e : i));
}

console.log(deps);

var exec = require('child_process').exec;
exec('jspm install ' + deps.join(" "), function callback(error, stdout, stderr){
    // result
console.log("Error: ", error);
console.log("Out: ", stdout);
console.log("Err: ", stderr);
});

for (var i in config.dependencies) {
   var e = config.dependencies[i];
   console.log("import '" + i + "';")
}
