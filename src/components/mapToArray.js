
//[helper function] turns a map to an array
function mapToArray(map)
{
	if(!(map instanceof Map)) throw `[mapToArray:5]: Input for mapToArray must be a Map`;
	const theReturnArray = [];
	let mapValueIterator = map.values();
	for(let i = 0; i < map.size; i++)
		theReturnArray.push(mapValueIterator.next().value);
	return theReturnArray;
}

module.exports = mapToArray;