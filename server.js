/**
 * @ Author: Annurdien Rasyid
 * @ Create Time: 2021-05-29 02:55:16
 * @ Modified by: Annurdien Rasyid
 * @ Modified time: 2021-05-29 19:37:10
 * @ Description: IDLIX API for scrapping movie from IDLIX
 */

/* Module */
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

/* ============ */
const PORT = process.env.PORT || 3000;
const general = require('./src/routes/general.routes');
const movies = require('./src/routes/movie.routes');
const series = require('./src/routes/tv_series.routes');
const genres = require('./src/routes/genre.routes');
const app = express();

/* app */
app.use(cors());
app.use(helmet());
app.use('/api', general);
app.use('/api/movie', movies);
app.use('/api/series', series);
app.use('/api/genre', genres);
app.use(express.static('./public'));

/* Status */
app.use('/api', async (req, res) => {
    res.send({
        status: true,
        message: 'IDLIX Scrapper',
        repo: 'annurdien',
    });
});

app.use('*', async (req, res) => {
    res.status(404).send({ status: false, message: 'api not found' });
});

/* Listener */
app.listen(PORT, async () => {
    console.log('Listening on PORT ' + PORT);
});
