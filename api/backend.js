const serverless = require('serverless-http');
const app = require('../server'); // haalt server.js op uit de root

module.exports = serverless(app);
