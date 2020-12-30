
// [helper function] makes millisecond time values easier to read
// time values are returned in the form of ...hh:mm:ss:ms
// where ...hh means that it will return minimum two hour digits, but will expand for more than two digits as needed (can be adjusted at line 22,11)
// which can be manipulated as desired, for example removing the millisecond value could be done with 
// (return value).split(':').pop();
// (return value).join(':');

function timeToString(time) {
	function pad(n, z) {
		z = z || 2;
		return ('00' + n).slice(-z);
	}
	let s = time;
	let ms = s % 1000;
	s = (s - ms) / 1000;
	let secs = s % 60;
	s = (s - secs) / 60;
	let mins = s % 60;
	let hrs = (s - mins) / 60;
	let p = Math.floor(Math.log10(hrs)) + 1;
	if(Math.log10(hrs) < 2) {
		p = false;
	}
	return `${pad(hrs, p)}:${pad(mins)}:${pad(secs)}:${ms}`;
}

module.exports = timeToString;