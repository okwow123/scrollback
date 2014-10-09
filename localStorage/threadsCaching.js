/* global libsb, currentState */

module.exports = function (cacheOp) {
	libsb.on('getThreads', function (query, next) {
		if (query.hasOwnProperty('q')) { // search queries should always be served from the server.
			return next();
		}
		var key = cacheOp.generateLSKey(query.to, 'threads');
		if (!cacheOp.cache.hasOwnProperty(key)) {
			cacheOp.loadArrayCache(key);
		}
		if (!cacheOp.cache[key].d.length) {
			return next();
		}

		if (query.time === null && currentState.connectionStatus) {
			// query.time is null, have to decide how LS will handle this.
			return next();
		}
		if (!currentState.connectionStatus) query.partials = true;

		var results = cacheOp.cache[key].get('startTime', query);

		if (!results || !results.length) {
			return next();
		} else {
			query.results = results;
			query.resultSource = 'localStorage';
			return next();
		}
	}, 200); // runs before the socket

	libsb.on('getThreads', function (query, next) {
		if (!query.results || query.resultSource === 'localStorage') {
			return next();
		}
		var results = query.results.slice(0); // copy by value
		if (results && results.length > 0) {
			// merge results to cache
			if (query.before) {
				if (results.length === query.before) {
					results.unshift({
						type: 'result-start',
						startTime: results[0].startTime,
						endtype: 'limit'
					});
				}
				results.push({
					type: 'result-end',
					endtype: 'time',
					startTime: query.time
				});
			} else if (query.after) {
				if (results.length === query.after) {
					results.push({
						type: 'result-end',
						startTime: results[results.length - 1].startTime,
						endtype: 'limit'
					});
				}
				results.unshift({
					type: 'result-start',
					endtype: 'time',
					startTime: query.time
				});
			}
			var lskey = cacheOp.generateLSKey(query.to, 'threads');
			if (!cacheOp.cache.hasOwnProperty(lskey)) {
				cacheOp.loadArrayCache(lskey);
			}
			cacheOp.cache[lskey].put('startTime', results);
			cacheOp.saveCache(lskey);
		}
		next();
	}, 8); // runs after socket 	
};