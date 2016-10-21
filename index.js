process.dlopen(module, require.resolve('./build/Release/binding.node'));

exports.SIZE_DEFAULT = 6;
exports.SIZE_64 = 6;
exports.SIZE_128 = 7;
exports.SIZE_256 = 8;
exports.SIZE_512 = 9;
exports.SIZE_1K = 10;
exports.SIZE_2K = 11;
exports.SIZE_4K = 12;
exports.SIZE_8K = 13;
exports.SIZE_16K = 14;

_Cache = exports.Cache;
var shared_id_map = new _Cache("__SHARE_ID_MAP", 512 << 10, exports.SIZE_128);
var cg_cache = new _Cache("__CG_CACHE", 512 << 10, exports.SIZE_128);
var uid = 0;
exports.__SHARE_ID_MAP = shared_id_map;
exports.__CG_CACHE = cg_cache;
exports._Cache = _Cache;
exports.Cache = function(name, size, block_size) {
	block_size || (block_size = exports.SIZE_DEFAULT);
	var info = shared_id_map[name];
	if (info) {
		return new _Cache(info.name, size, block_size);
	}
	var cache_key = size + "|" + block_size;
	var cache_list = cg_cache[cache_key];
	if (cache_list && cache_list.length) {
		info = cache_list.pop();
		cg_cache[cache_key] = cache_list;
		// console.log("使用缓存：", info);
		var res = new _Cache(info.name, size, block_size);
	} else {
		info = {
			name: "O_" + uid++,
			size: size,
			block_size: block_size
		}
		res = new _Cache(info.name, size, block_size);
	}
	shared_id_map[name] = info;
	return res;
}
exports.GC = function(name) {
	var info = shared_id_map[name];
	if (info) {
		delete shared_id_map[name];
		var cache_key = info.size + "|" + info.block_size;
		var cache_list = cg_cache[cache_key] || [];
		cache_list.push(info);
		cg_cache[cache_key] = cache_list;
	}
}

if (process.mainModule === module && process.argv[2] === 'release') {
	process.argv.slice(3).forEach(exports.release);
}
