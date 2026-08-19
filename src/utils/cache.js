const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 60, checkperiod: 30 }); // 60s default TTL
module.exports = cache;