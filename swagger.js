const swaggerAutogen = require('swagger-autogen')({ openapi: '3.0.0' });

const doc = {
  info: {
    title: 'IDLIX API',
    description: 'REST API that scrapes IDLIX using headless Chromium and JSON upstream APIs.',
    version: '3.0.0',
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Local server'
    }
  ]
};

const outputFile = './swagger_output.json';
// Pointing to the file where routes are mounted to discover routes.
const routes = ['./src/app.js'];

/* NOTE: If you are using the express Router, you must pass in the 'routes' only the 
root file where the route starts, such as index.js, app.js, routes.js, etc ... */

swaggerAutogen(outputFile, routes, doc);
