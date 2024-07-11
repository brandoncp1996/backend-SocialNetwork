'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PublicationSchema = Schema({
    text: String,
    file: String,
    create_at: String,
    user: {type: Schema.ObjectId, ref: 'User'} // Esta es la forma de obtener el _id del user que esta guardado en otro modelo

});

module.exports = mongoose.model('Publication', PublicationSchema);