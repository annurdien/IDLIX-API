'use strict';

require('dotenv').config();

const createApp  = require('./src/app');
const { PORT }   = require('./src/config/env');

const app = createApp();

app.listen(PORT, () => {
  console.log(`Listening on PORT ${PORT}`);
});
