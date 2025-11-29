// Vercel serverless function entry point
// This file imports the built Express app from dist/index.js
const app = require('../dist/index.js').default || require('../dist/index.js');
module.exports = app;

