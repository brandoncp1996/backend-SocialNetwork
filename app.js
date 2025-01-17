// Aqui vamos a trabajar todo lo que tiene que ver con express

'use strict'

var express = require('express');
var bodyParser = require('body-parser')

var app = express();

//cargar rutas
var user_routes = require('./routes/user');
var follow_routes = require('./routes/follow');
var publication_routes = require('./routes/publication');
var message_routes = require('./routes/message');

//middleware

/* NOTA NOTA NOTA NOTA NOTA NOTA NOTA NOTA -- ESTO ES UN METODO QUE SE EJECUTA ANTES DE UN CONTROLADOR */

app.use(bodyParser.urlencoded({extended:false})); // cofiguracion necesaria para bodyparse
app.use(bodyParser.json()); // Esto es lo que me permite convertir la informacion a jSON

// cors

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
 
    next();
});

// rutas

app.use('/api', user_routes);
app.use('/api', follow_routes);
app.use('/api', publication_routes);
app.use('/api', message_routes);


// exportar infomacion del archivo que llega a app
module.exports = app;

