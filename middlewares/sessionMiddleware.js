const express = require('express');
const session = require('express-session');

const sessionActiva = express();

sessionActiva.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
}));

module.exports = { sessionActiva }