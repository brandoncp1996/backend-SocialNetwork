'use strict'

var moment = require('moment');

//Paginacion
var mongoosePaginate = require('mongoose-pagination');

//Modelos que necesito 
var User = require('../models/user');
var Follow = require('../models/follow');
var Message = require('../models/message');
const message = require('../models/message');

function probando (req, res){
    console.log(req.body);
    res.status(200).send({
        message: 'Hola que tal desde los mensajes pribados'
    });
}

function saveMessage (req, res){
    var params = req.body;

    if(!params.text || !params.receiver){
        return res.status(200).send({ message: "Envia los datos necesarios"});
    }

    var message = new Message();
    message.emitter = req.user.sub;
    message.receiver = params.receiver;
    message.text = params.text;
    message.create_at = moment().unix();
    message.viewed = 'false';

    message.save().then( messageStored => {
    
        if (!messageStored) {     
            return res
                .status(404)
                .send({ message: "Error al enviar el mensaje" });
        } else {
            return res.status(200).send({ message: messageStored});
        }

    }).catch((err) => {
        if(err) return res
                        .status(500)
                        .send({ message: "Error en la peticion"});
    })

}

function getReceivedMessages(req, res){
    var userId = req.user.sub;

    var page = 1;

    if(req.params.page){
        page = req.params.page;
    }

    var itemsPerPage = 4;

    //Message.find({receiver: userId}).pupulate('emitter').paginate(page, itemsPerPage)


    //NOTA: Tener en cuenta el segundo parametro que se puede utilizar en el populate para mostrar solo los campos deseados (se hace con select)
    Message.find({receiver: userId}).populate({path: 'emitter', select: '_id name surname nick image'}).paginate(page, itemsPerPage)
        .then( messages => {

            if(messages.length == 0) return res.status(404).send({message: 'No hay usuarios disponibles'});
            /*
            return res.status(200).send({
                //total: total,
                //pages: Math.ceil(total/itemsPerPage),
                messages
            })
            */

            getTotal(userId).then( value => {
                return res.status(200).send({
                    messages,
                    total: value.total,
                    pages: Math.ceil(value.total/itemsPerPage)
                });
            });


        }).catch((err) => {

            if(err) {
                return res.status(500).send({message: 'Error en la peticion'});
            }

        });
}

    // Funcion asincrona para obtener el total

    async function getTotal(userId){
        var total = await Message.find({receiver: userId}).then(total => {
            return total.length;
        })

        return{
            total: total
        }

    }

//Obtener los mensajes emitidos

function getEmittedMessages(req, res){
    var userId = req.user.sub;

    var page = 1;

    if(req.params.page){
        page = req.params.page;
    }

    var itemsPerPage = 4;

    //Message.find({receiver: userId}).pupulate('emitter').paginate(page, itemsPerPage)


    //NOTA: Tener en cuenta el segundo parametro que se puede utilizar en el populate para mostrar solo los campos deseados (se hace con select)
    Message.find({emitter: userId}).populate({path: 'emitter receiver', select: '_id name surname nick image'}).paginate(page, itemsPerPage)
        .then( messages => {

            if(messages.length == 0) return res.status(404).send({message: 'No hay usuarios disponibles'});
            /*
            return res.status(200).send({
                //total: total,
                //pages: Math.ceil(total/itemsPerPage),
                messages
            })
            */

            getTotal(userId).then( value => {
                return res.status(200).send({
                    messages,
                    total: value.total,
                    pages: Math.ceil(value.total/itemsPerPage)
                });
            });


        }).catch((err) => {

            if(err) {
                return res.status(500).send({message: 'Error en la peticion'});
            }

        });
}

    // Funcion asincrona para obtener el total

    async function getTotal(userId){
        var total = await Message.find({emitter: userId}).then(total => {
            return total.length;
        })

        return{
            total: total
        }

    }

function getUnviewedMessages(req, res){
    var userId = req.user.sub;

    Message.countDocuments({receiver: userId, viewed: 'false'}).then( count => {
        return res.status(200).send({
            'unviewed': count
        })
    }).catch((err) => {
        if(err) {
            return res.status(500).send({message: 'Error en la peticion'});
        }
    });
}

function setViewedMessages(req,res){
    var userId = req.user.sub;

    //UpdateMany || UpdateOne ----- Tener en cuenta
    Message.updateMany({receiver: userId, viewed: 'false'}, {viewed:'true'}, {'multi': true})
        .then( messagesUpdated => {
            console.log(messagesUpdated);
            return res.status(200).send({
                messages: messagesUpdated
               
            })
        }).catch((err) => {
        if(err) {
            return res.status(500).send({message: 'Error en la peticion'});
            }
        });
}

module.exports = {
    probando,
    saveMessage,
    getReceivedMessages,
    getEmittedMessages,
    getUnviewedMessages,
    setViewedMessages
};