'use strict'

//Conexion con mongodb

var mongoose = require('mongoose');
var app = require('./app'); //llamando a app y no hay que poner el .js porque el lo reconoce
var port = 3800; //Puerto con el que vamos a trabajar

//mongoose.set('useFindAndModify', false);
mongoose.Promise = global.Promise;

    //conexion del servidor
    mongoose.connect('mongodb://localhost:27017/mean-socialNetwork', { useNewUrlParser:true, useUnifiedTopology: true})
            .then(() => {
                console.log("La conexion a la base de datos mean-socialNetwork se ha realizado correctamente");

                // Crear servidor
                app.listen(port, () => {
                    console.log("servidor corriendo en http://localhost:3800");
                })
                
            })
            .catch(err => console.log(err));