var fs = require('fs');

//[helper function] save to a JSON file. returns as function to allow easy usage with schedulers
function recordFile(obj, path, encoding = 'utf8')
{
	return function() {
		//var obj = {'hotList': hotList, "res": res}; obj should be formatted as a json, here is an example
		var objJson = JSON.stringify(obj,function(k,v){
			    if(v instanceof Array)
					return JSON.stringify(v);
			    return v;
			},4).replace(/\\/g, '')
				.replace(/\"\[/g, '[')
				.replace(/\]\"/g,']')
				.replace(/\"\{/g, '{')
				.replace(/\}\"/g,'}');
		fs.writeFile(path, objJson, encoding, (err) => {
			if (err) throw err; // Error while writing file
		});
	}
}

module.exports = recordFile;