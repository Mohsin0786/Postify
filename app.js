require("dotenv").config();
const express = require('express');
const postRoutes = require('./routes/posts');
const tagRoutes = require('./routes/tags');
const createError = require('http-errors');
const logger = require('./utils/logger');
const { mongoConnect } = require("./utils/db");


const app = express();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));
app.get('/', (req, res) => {
    res.send('Server is Healthy!!!!');
});

app.use('/api/posts', postRoutes);
app.use('/api/tags', tagRoutes);

// Error Handling Middleware
app.use((req, res, next) => {
    next(createError(404, 'Resource not found'));
});

app.use((err, req, res, next) => {
    logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
});

mongoConnect(); //Mongo connection

module.exports = app;