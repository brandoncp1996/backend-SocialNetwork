'use strict'

var path = require('path');
var fs = require('fs');
var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var Publication = require('../models/publication');
var User = require('../models/user');
var Follow = require('../models/follow');
const publication = require('../models/publication');

//Metodo de prueba

function probando(req, res){
    return res.status(200).send({message: 'Hola desde el controlador de publicaciones'});
}

//Guardar nuevas publicaciones

function savePublication(req,res){
    var params = req.body;

    if(!params.text){
        return res.status(200).send({message: 'debes enviar un texto!!'});
    }

    var publication = new Publication();
    publication.text = params.text;
    publication.file = 'null';
    publication.user = req.user.sub;
    publication.create_at = moment().unix();

    publication.save().then(publicationStored => {
        if(!publicationStored){
            return res.status(404).send({ message: "La publicacion NO ha sido guardada" });
        }
        
        return res.status(200).send({ publication: publicationStored });

    }).catch( err => {
        if (err) {
            return res.status(500).send({ message: "Error al guardar la publicacion" });
        }
    })

}

//Devolver las publicaciones de los usuarios que estoy siguiendo

function getPublications(req, res){
    var page = 1;
    if(req.params.page){
        page = req.params.page;
    }

    var itemsPerPage = 4;

    
    Follow.find({user: req.user.sub}).populate('followed').then(follows => {
        var follows_clean = [];

        follows.forEach((follow) => {
            follows_clean.push(follow.followed);
        });

        //El $in es para buscar dentro de un array, en este caso es follows_clean
        Publication.find({user: {"$in": follows_clean}}).sort('-created_at').populate('user').paginate(page, itemsPerPage)
            .then(publications => {

                //Debemos probar con follows == 0
                if(!publications){
                    //Tener en cuenta despues
                    return res.status(404).send({ message: "No hay publicaciones"});
                }

                total_publications_follows().then( total => {
                    return res.status(200).send({
                        publications,
                        page: page,
                        pages: Math.ceil(total.length/itemsPerPage),
                        total: total.length
                    });
                })


            }).catch( err => {
                if(err){
                    return res.status(500).send({ message: "Error al devolver publicaciones"});
                }
            })

            // Para el total
            async function total_publications_follows(){
                var total = await Publication.find({user: {"$in": follows_clean}});
                return total;
            }
       
    }).catch( err => {
        if (err) {
            return res.status(500).send({ message: "Error al devolver el seguimiento" });
        }
    })
    
}
    
function getPublication(req, res){
    var publicationId = req.params.id;

    Publication.findById(publicationId)
        .then( publication => {

            if(!publication){
                return res.status(404).send({ message: "No existe publicacion"});
            }

            return res.status(200).send({publication});

        }).catch( err => {
        if (err) {
            return res.status(500).send({ message: "Error al devolver la publicacion" });
        }
    })
}

//Borrar publicacionles

function deletePublication(req,res){
    var publicationId = req.params.id;
    
    Publication.find({user: req.user.sub, '_id': publicationId}).deleteOne().then( publicationRemoved => {
 
        console.log(publicationRemoved.deletedCount);

        if(publicationRemoved.deletedCount == 0){
            return res.status(404).send({ message: "No se ha borrado la publicacion"});
        }

        return res.status(200).send({publicationRemoved});

    }).catch( err => {
        if (err) {
            return res.status(500).send({ message: "Error al devolver la publicacion" });
        }
    })
   
}

// Subir archivos de imagen/avatar de usuario

function uploadImage(req, res){
    
    var publicationId = req.params.id;

    if(req.files){
        var file_path = req.files.image.path;
        //console.log(file_path);
        var file_split = file_path.split('\/');
        //console.log(file_split);
        var file_name = file_split[2];
        //console.log(file_name);
        var ext_split = file_name.split('\.');
        //console.log(ext_split);
        var file_ext = ext_split[1];
        //console.log(file_ext);

        if(file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif'){
            
            
            Publication.findOne({'user':req.user.sub, '_id':publicationId}).then( publication => {
                
                console.log(publication);

                if(publication){
                    //Actualizar documento de publicacion
                    Publication.findByIdAndUpdate(publicationId, {file: file_name}, {new:true})   
                        .then( publicationUpdate => {

                            if(!publicationUpdate) {
                                return res.status(404).send({message: 'No se ha podido actualizar el usuario'});
                            }
                
                            return res.status(200).send({user: publicationUpdate});
                        })
                        .catch( err => {
                            if(err) {
                                return res.status(500).send({message: 'Error en la peticion'});
                            }
                        })
                } else {
                    return removeFilesOfUploads(res, file_path, 'No tienes permiso para actualizar esta publicacion')
                }
            }) // Tal vez despues hay que crear un catch____________


        }else{
            return removeFilesOfUploads(res, file_path, 'Extencion no valida')
        }
        
    } else {
        return res.status(200).send({message: 'No se han subido imagenes' });
    }
}

function removeFilesOfUploads(res, file_path, message){
    fs.unlink(file_path, (err) => {    
        return res.status(200).send({message: message});  
    })
}

function getImageFile(req,res){
    //Imagen que pasamos por el url
    var image_file = req.params.imageFile;
    //Localizacion de la imagen dentro de la carpeta
    var path_file = './uploads/publications/' + image_file;

    var fileExists = fs.existsSync(path_file)
    console.log(fileExists);
        if(fileExists){
            res.sendFile(path.resolve(path_file));
        }else{
            res.status(200).send({message: 'No existe la imagen...'});
        }
        
}

module.exports = {
    probando,
    savePublication,
    getPublications,
    getPublication,
    deletePublication,
    uploadImage,
    getImageFile
}


