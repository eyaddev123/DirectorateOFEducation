//api/index.js
//Entry point for serverless deployment, proxies requests to the main app
const app = require('../src/app');

//Handles incoming requests by passing them to the Express app
module.exports = (req, res) => {
    app(req, res);
};