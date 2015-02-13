"use strict";

exports.create = function createUsers(req, res, container) {

    var data = req.data;

    // PK 체크
    container.getService('MONGODB').then(function(service) {

        data._className = req.params._className;

        service.send('insert', {collectionName : req.session.appid, data : data}, function(err, doc) {

            if(err)
                return res.error(err);

            res.send(201, {
                createdAt : doc.data.createdAt,
                objectId : doc.data.objectId
            });
        });
    }).fail(function(err) {

        res.error(err);
    });
};

exports.read = function(req, res, container) {

    container.getService('MONGODB').then(function(service) {

        service.send('findOne', {collectionName : req.session.appid, query : {where : {_className : req.params._className, objectId : req.params._objectId}}}, function(err, doc) {

            if(err)
                return res.error(err);

            delete doc.data.password;
            delete doc.data.sessionToken;

            res.send(200, doc.data);
        });
    }).fail(function(err) {

        res.error(err);
    });
};

exports.update = function(req, res, container) {

    var data = req.data;

    if(!data)
        return res.error(new Error('RequestBodyNotFound'));

    container.getService('MONGODB').then(function(service) {

        service.send('update', {collectionName : req.session.appid, query : {where : {_className : req.params._className, objectId : req.params._objectId}}, data : data}, function(err, doc) {

            if(err) {

                if(err.code === 10147)
                    return new Error(404, 'ResourceNotFound');

                return res.error(err);
            }

            res.send(200, {
                updatedAt : doc.data.updatedAt
            });

        });
    }).fail(function(err) {

        res.error(err);
    });
};

exports.find = function(req, res, container) {

    container.getService('MONGODB').then(function (service) {

        req.query.where._className = req.params._className;

        service.send('find', {collectionName : req.session.appid, query: req.query}, function (err, docs) {

            if (err)
                return res.error(err);

            for(var i= 0, cnt= docs.length; i<cnt; i++) {

                delete docs[i].password;
                delete docs[i].sessionToken;
            }

            if (typeof(docs.data) === 'number') {

                res.send(200, {results: [], count: docs.data});
            } else {

                res.send(200, {results: docs.data});
            }
        });
    }).fail(function (err) {

        res.error(err);
    });
};

exports.destroy = function(req, res, container) {

    container.getService('MONGODB').then(function(service) {

        service.send('remove', {collectionName : req.session.appid, query : {where : {_className : req.params._className, objectId : req.params._objectId}}}, function(err, doc) {

            if(err)
                return res.error(err);

            res.send(200, {});
        });
    }).fail(function(err) {

        res.error(err);
    });
};

exports.getObjectList = function(req, res, container) {

    container.getService('MONGODB').then(function(service) {

        service.send('group', {collectionName : req.session.appid, keys : ['_className'], query : {}}, function(err, docs) {

            if(err)
                return res.error(err);

            res.send(200, {results: docs.data});
        });
    }).fail(function(err) {

        res.error(err);
    });

};