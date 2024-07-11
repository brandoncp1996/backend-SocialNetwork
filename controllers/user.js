'use strict'
//Libreria necesaria para encriptar las contrasenas
var bcrypt = require('bcrypt-nodejs');

//Libreria Mongoose paginate - esto es para paginar los usuarios 
var mongoosePaginate = require('mongoose-pagination')

//Es necesario el modulo de user para poder tomar la informacion
var User = require('../models/user');
var Follow = require('../models/follow');
var Publication = require('../models/publication');
//Generador de tockens
var jwt = require('../services/jwt');

//Libreria file-sistem de nodeJS que nos permite trabajar con archivos
var fs = require('fs');
var path = require('path');




//Hacer los pedidos api PERO aqui no se condiguran las rutas, eso se hace en user.js/routes

//Metodos de prueba
function home(req, res){
    res.status(200).send({
        message: 'Hola mundo'
    });
};

function pruebas (req, res){
    console.log(req.body);
    res.status(200).send({
        message: 'Accion de pruebas en el servidor de Node.js'
    });
}

//Metodo para crear nuevo usuario

function saveUser (req,res) {
    var params = req.body; //Los datos que nos lleguen por post "es lo que llena el usuario" lo vamos a guardar en la variable params
    var user = new User();
    
    if(params.name && params.surname && params.nick && params.email && params.password ){
        user.name = params.name;
        user.surname = params.surname;
        user.nick = params.nick;
        user.password = params.password; /* -- no los vamos a hacer asi porque es mejor encriptarlo*/
        user.email = params.email;
        user.role = 'ROLE_USER';
        user.image = null;

        //Control de usuarios duplicados

        User.find({ $or:
                            [
                                {email: user.email.toLowerCase()},
                                {nick: user.nick.toLowerCase()}
                            ]
        }).catch((err) => {
            if(err) return res
                            .status(500)
                            .send({ message: "Error en la peticion de usuarios"});
        }).then((users) => {
            if(users && users.length >= 1){
                return res.status(200).send({ message: "El usuario que intentas registrar ya existe!!"});
            }else{

                    //ENCRIPTADO -- hash es el metodo de bcrypt && guardado de datos
        
                    bcrypt.hash(params.password, null, null, (err, hash) => {
                        user.password = hash;
                        //DIRIA YO QUE ES LA FORMA CORRECTA PERO EL ORDEN DE victor FUNCIONA
                        /*
                        user.save().then((userStored) => {
                
                            return res.status(200).send({user: userStored})
                            
                        })
                        .catch((error) => {
                            if (!userStored)
                            return res
                                .status(404)
                                .send({ message: "No se ha registrado el usuario" });
                    
                            if (error)
                            return res
                                .status(500)
                                .send({ error: "Error al guardar el usuario" });
                        });
                        */

                        //Orden como en el curso se hace  
                        user.save()
                        .catch((error) => {
                            if (!userStored)
                            return res
                                .status(404)
                                .send({ message: "No se ha registrado el usuario" });
                    
                            if (error)
                            return res
                                .status(500)
                                .send({ error: "Error al guardar el usuario" });
                        })
                        .then((userStored) => {
                
                            return res.status(200).send({user: userStored})
                            
                        })
                    });    
            }
        });

    } else {
        res.status(200).send({
            message: 'Envia todos los campos necesarios!!'
        });
    }
};

//Logear los usuarios

function loginUser(req, res) {

    const params = req.body;
    const email = params.email;
    const password = params.password;
    
    //console.log(bcrypt.compare(password, user.password));
    
    User.findOne({ email: email })
        .then((user) => {
            if (!user) {     
                return res
                    .status(404)
                    .send({ message: "El usuario no se ha podido identificar " });
            } else {
                //Devolver una promesa de la comparación de contraseñas
                bcrypt.compare(password, user.password, (err, response) => {
                    if (response) {
                        //estos if son para hacer los tokens que encriptan la informacion
                        if(params.gettoken){
                            //generar y devolver token
                            return res.status(200).send({
                                token: jwt.createToken(user)
                            });

                        } else {
                            //El user undefined sirve para que no se muestre en el res
                            user.password = undefined;
                            return res
                                .status(200)
                                .send({user});
                        }
                        
                    }  else {
                        return res
                            .status(404)
                            .send({ message: "La contrasena no es valida!!"});
                    }
                }) 
            }
        })  
        .catch((err) => {
            if (err){
                return res.status(500).send({ message: "Error en la petición" });
            }
        });

};

// Conseguir datos de un usuario

function getUser(req, res) {
    //NOTA: cuando nos llegan datos por la url utilizamos params y cuando nos llegan datos por el post y el put utilizamos body
    var userId = req.params.id;

    User.findById(userId)
        .then((user)=>{

            if(!user) return res.status(404).send({message: 'El usuario no existe'});
            /* // -- Forma de hacerlo solo con then
            Follow.findOne({'user':req.user.sub, 'followed':userId})
                .then(follow => {
                    return res.status(200).send({user, follow});
                })
                .catch((err) => {
                    if(err) {
                        return res.status(500).send({message: 'Error en la peticion'});
                    }       
                })  
            */
                
            //Forma de hacerlo asincrono

            followThisUser(req.user.sub, userId).then( value => {
                user.password = undefined; // Para no mostrar contrasena
                return res.status(200).send({
                    user, 
                    following: value.following,
                    followed: value.followed
                });
            });

        })
        .catch((err) => {

            if(err) {
                return res.status(500).send({message: 'Error en la peticion'});
            }

        })
}

    // -- MANERA asincrona

    async function followThisUser(identity_user_id, user_id){
        
        var following = await Follow.findOne({'user':identity_user_id, 'followed':user_id})
        .then(follow => {
            return follow;
        })
        .catch((err) => {
            if(err) {
                return handleError(err);
            }       
        });
        
        var followed = await Follow.findOne({'user':user_id, 'followed':identity_user_id})
        .then(follow => {
            return follow;
        })
        .catch((err) => {
            if(err) {
                return handleError(err);
            }       
        });

        return {
            following: following,
            followed: followed
        }
    }

// Devolver un listado de usuarios paginados

// NOTA - no esta terminado del todo porque no se hasta ahora como poder enviar el total de los usuarios

function getUsers(req, res) {
    var identity_user_id = req.user.sub;

    var page = 1;
    if(req.params.page){
        page = req.params.page;
    }

    var itemsPerPage = 4;

    User.find().sort('_id').paginate(page, itemsPerPage)

        .then((users) => {

            if(users.length == 0) return res.status(404).send({message: 'No hay usuarios disponibles'});
            /* //--Como funciona sin async
            return res.status(200).send({
                users
                //total: total
                //pages: Math.ceil(total/itemsPerPage)

            });
            */
            
            followUserIds(identity_user_id)
                .then( value => {
                    return res.status(200).send({
                        users,
                        users_following: value.following,
                        users_follow_me: value.followed,
                        total: value.total,
                        pages: Math.ceil(value.total/itemsPerPage)
                    });
                });

        })
        .catch((err) => {

            if(err) {
                return res.status(500).send({message: 'Error en la peticion'});
            }

        });

}

    // Funcion asincrona para devolver los ID´s y tambien los que nos siguen

    async function followUserIds(user_id){
        var following = await Follow.find({'user': user_id}).select({'_id':0, '__v':0, 'user':0})
            .then((follows) => {
                var follows_clean = [];

                follows.forEach((follow) => {
                    follows_clean.push(follow.followed);
                });

                return follows_clean;
            });

        var followed = await Follow.find({'followed': user_id}).select({'_id':0, '__v':0, 'followed':0})
        .then((follows) => {
            var follows_clean = [];

            follows.forEach((follow) => {
                follows_clean.push(follow.user);
            });

            return follows_clean;
        });

        var total = await User.find().then(total => {
            return total.length;
        })

        console.log(total);

        return{
            following: following,
            followed: followed,
            total: total
        }
    };


// Devolver contadores y estadisticas

function getCounters(req, res){
    
    var userId = req.user.sub;
    if(req.params.id){
        userId = req.params.id;  
    }

    getCountFollow(userId).then( value => {
        return res.status(200).send({value});
    })

}

    async function getCountFollow(user_id){
        //El .count() es para saber la cantidad algo, en este caso la cantidad de usuarios que yo sigo
        var following = await Follow.countDocuments({'user':user_id}).then(count => {
            return count;
        }).catch(err => {
            if(err) return handleError(err);
        })

        //Cantidad de usuarios que me siguen
        var followed = await Follow.countDocuments({"followed":user_id}).then(count => {
            return count;
        }).catch(err => {
            if(err) return handleError(err);
        });

        // prueba ___________
        var publications = await Publication.countDocuments({'user':user_id}).then(count => {
            return count;
        }).catch(err => {
            if(err) return handleError(err);
        })

        return {
            following: following,
            followed: followed,
            publications: publications
        }

    }


// Edicion de datos de usuario -- nota: el usuario no 

function updateUser(req, res) {

    var userId = req.params.id;
    //aqui esta la informacion modificada
    var update = req.body;

    //Borrar propiedad password
    delete update.password;

    if(userId != req.user.sub){
        return res.status(500).send({message: 'No tienes permiso para actualizar los datos del usuario'});
    }    

    User.findByIdAndUpdate(userId, update, {new: true})
        .then( userUpdate => {

            if(!userUpdate) {
                return res.status(404).send({message: 'No se ha podido actualizar el usuario'});
            }

            return res.status(200).send({user: userUpdate});
        })
        .catch( err => {
            if(err) {
                return res.status(500).send({message: 'Error en la peticion'});
            }
        })
}

// Subir archivos de imagen/avatar de usuario

function uploadImage(req, res){
    
    var userId = req.params.id;

    if(req.files){
        var file_path = req.files.image.path;
        console.log(file_path);
        var file_split = file_path.split('\/');
        console.log(file_split);
        var file_name = file_split[2];
        console.log(file_name);
        var ext_split = file_name.split('\.');
        console.log(ext_split);
        var file_ext = ext_split[1];
        console.log(file_ext);
        
        if(userId != req.user.sub){
            return res.status(500).send({message: 'No tienes permiso para actualizar los datos del usuario'});
            // -- con la primera opcion no tengo que actualizar la pagina -- con el return si funciona
            //return removeFilesOfUploads(res, file_path, 'No tienes permiso para actualizar los datos del usuario');
        }  

        if(file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif'){
            
            //Actualizar documento de usuario logueado
            User.findByIdAndUpdate(userId, {image: file_name}, {new:true})   
                .then( userUpdate => {

                    if(!userUpdate) {
                        return res.status(404).send({message: 'No se ha podido actualizar el usuario'});
                    }
        
                    return res.status(200).send({user: userUpdate});
                })
                .catch( err => {
                    if(err) {
                        return res.status(500).send({message: 'Error en la peticion'});
                    }
                })

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
    var path_file = './uploads/users/' + image_file;

    var fileExists = fs.existsSync(path_file)
    console.log(fileExists);
        if(fileExists){
            res.sendFile(path.resolve(path_file));
        }else{
            res.status(200).send({message: 'No existe la imagen...'});
        }
        
}


//Esportar las funciones en forma de objeto para poder utilizarlas despues
module.exports = {
    home,
    pruebas,
    saveUser,
    loginUser,
    getUser,
    getUsers,
    getCounters,
    updateUser,
    uploadImage,
    getImageFile
};