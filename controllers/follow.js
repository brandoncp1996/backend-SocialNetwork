'use strict'

//Librerias necesarias

// var path = require('path');
// var fs = require('fs');

//Pagination
var mongoosePaginate = require('mongoose-pagination');
//const { PaginationParameters } = require('mongoose-paginate-v2');

//Cargar modelos

var User = require('../models/user');
var Follow = require('../models/follow');
const follow = require('../models/follow');

function saveFollow(req,res){

    var params = req.body;
    //Crear el objeto de follow
    var follow = new Follow();
    follow.user = req.user.sub;
    follow.followed = params.followed;


    // Sin repeticion de FOLLOW
    
    Follow.find({'user':req.user.sub, 'followed':params.followed})
        .then((follows) => {
            if(follows != 0){
                return res.status(200).send({message: "Cuenta previamente seguida"});
            }

        follow.save()
            .then((followStored) => {
                if(!followStored){
                    return res
                        .status(404)
                        .send({ message: "El seguimiento no se ha guardado"});
                }else{
                return res.status(200).send({follow: followStored});
                }
            })
        })
        .catch((err) => {
            if(err) return res
                .status(500)
                .send({ message: "Error al guardar el seguimiento"});
        })

    /* -- FORMA EN QUE FUNCIONA SIN CORREGIR LOS REPETIDOS --
    follow.save()
        .then((followStored) => {
            if(!followStored){
                return res
                    .status(404)
                    .send({ message: "El seguimiento no se ha guardado"});
            }else{
            return res.status(200).send({follow: followStored});
            }
        })
        .catch((err) => {
            if(err) return res
                .status(500)
                .send({ message: "Error al guardar el seguimiento"});
        })
    */    

}

function deleteFollow(req,res){

    var userId = req.user.sub;
    var followId = req.params.id;

    Follow.find({'user':userId, 'followed':followId}).deleteOne()
        .then(() => {
            return res.status(200).send({ message: "El follow se ha eliminado"});
        })
        .catch(err=>{
            if(err) {
                return res.status(500).send({ message: "Error al guardar el seguimiento"});
            }
        })
    
}

function getFollowingUsers(req,res){
    var userId = req.user.sub;

    if(req.params.id && req.params.page){
        userId = req.params.id;
    }

    var page = 1;

    if(req.params.page){
        page = req.params.page;
    }else{
        page = req.params.id;
    }

    var itemsPerPage = 3;


    Follow.find({user: userId}).populate({path: 'followed'}).paginate(page, itemsPerPage)
        .then((follows) => {

            if(follows == 0){
                //Tener en cuenta despues
                return res.status(404).send({ message: "No estas siguiendo ningun usuario o la pagina esta vacia"});
            }
            /* //--Funciona sin asincrono
            return res.status(200).send({ 
                //total: total,
                //pages: Math.ceil(total/itemsPerPage),
                follows: follows
            });
            */

            total_follows_DataBase().then( value => {
                return res.status(200).send({ 
                    
                    follows: follows,
                    total: value.total + " Follows en general",
                    pages: Math.ceil(value.total/itemsPerPage)
                });
            })

        })
        .catch( err => {
            if(err){
                return res.status(500).send({ message: "Error en el servidor"});
            }
        })
}

    // Funcion Asincrona para hallar el total

    async function total_follows_DataBase(){
        
        var total = await Follow.find().then(total => {
            return total.length;
        })

        return{
            total: total
        }
    };


//Sacar los usuarios que nos siguen a nosotros

function getFollowedUsers(req,res){
    var userId = req.user.sub;

    if(req.params.id && req.params.page){
        userId = req.params.id;
    }

    var page = 1;

    if(req.params.page){
        page = req.params.page;
    }else{
        page = req.params.id;
    }

    var itemsPerPage = 4;

    //Muy inportante aqui que en el populate tanto el user como el followed esten para que en el postman pueda ver el ususrio que sigue como el seguido
    Follow.find({followed: userId}).populate('user' /*followed*/).paginate(page, itemsPerPage)
        .then((follows) => {

            if(follows == 0){
                //Tener en cuenta despues
                return res.status(404).send({ message: "No te sigue ningun usuario o la pagina esta vacia"});
            }
            
            return res.status(200).send({ 
                //total: total,
                //pages: Math.ceil(total/itemsPerPage),
                follows
            });

        })
        .catch( err => {
            if(err){
                return res.status(500).send({ message: "Error en el servidor"});
            }
        })
}


//Devolver listados de usuarios -- sie por el url le paso al final true voy a obtener los que me siguen a mi
function getMyFollows(req, res){

    var userId = req.user.sub;

    var find = Follow.find({user: userId});
    
    if(req.params.followed){
        find = Follow.find({followed: userId});
    }

    find.populate('user followed')
        .then((follows) => {

            if(follows == 0){
                //Tener en cuenta despues
                return res.status(404).send({ message: "la pagina esta vacia"});
            }
            
            return res.status(200).send({ follows });

        })
        .catch( err => {
            if(err){
                return res.status(500).send({ message: "Error en el servidor"});
            }
        });

}


module.exports = {
    saveFollow,
    deleteFollow,
    getFollowingUsers,
    getFollowedUsers,
    getMyFollows
}