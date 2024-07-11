'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Esquema para crear los usuarios en base a ella
var UserSchema = Schema({
    name: String,
    surname: String,
    nick: String,
    email: String,
    password: String,
    role: String,
    image: String
});

module.exports = mongoose.model('User', UserSchema); // Asi escriba el nombre del modulo con mayuscula 'User' en la base de datos se guardara con minuscula

