"use strict";

exports.create = function(req, res, container) {

    var data = req.data;

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

        var query = {
            where : {
                _className : req.params._className,
                objectId : req.params._objectId
            }
        };

        if(req.query.where._userid)
            query.where._userid = req.query.where._userid;

        service.send('update', {collectionName : req.session.appid, query : query, data : data}, function(err, doc) {

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

    if(!req.params._objectId)
        return res.error(new Error('Object ID is required'));

    var query = {
        where : {
            _className : req.params._className,
            objectId : req.params._objectId
        }
    };

    if(req.query.where._userid)
        query.where._userid = req.query.where._userid;

    container.getService('MONGODB').then(function(service) {

        service.send('remove', {collectionName : req.session.appid, query : query}, function(err, doc) {

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

exports.createAcl = function(req, res, container) {

    var data = req.data;

    container.getService('MONGODB').then(function(service) {

        service.send('findOne', {collectionName : req.session.appid, query : {where : {_className : '_Acl', name : req.params._className}}}, function(err, doc) {

            if (err)
                return res.error(err);

            data._className = '_Acl';

            if (doc.data) {

                service.send('update', {collectionName : req.session.appid, query : {where : {_className : '_Acl', name : req.params._className}}, data : data}, function(err, doc) {

                    if(err) {

                        if(err.code === 10147)
                            return new Error(404, 'ResourceNotFound');

                        return res.error(err);
                    }

                    res.send(200, {
                        updatedAt : doc.data.updatedAt
                    });

                });
            } else {

                data.level = 'class';
                data.name = req.params._className;

                service.send('insert', {collectionName: req.session.appid, data: data}, function (err, doc) {

                    if (err)
                        return res.error(err);

                    res.send(201, {
                        createdAt: doc.data.createdAt,
                        objectId: doc.data.objectId
                    });
                });
            }

        });
    }).fail(function(err) {

        res.error(err);
    });
};

exports.readAcl = function(req, res, container) {

    container.getService('MONGODB').then(function(service) {

        service.send('findOne', {collectionName : req.session.appid, query : {where : {_className : '_Acl', name : req.params._className}}}, function(err, doc) {

            if(err)
                return res.error(err);

            res.send(200, doc.data);
        });
    }).fail(function(err) {

        res.error(err);
    });
};

exports.updateAcl = function(req, res, container) {

    var data = req.data;

    if(!data)
        return res.error(new Error('RequestBodyNotFound'));

    container.getService('MONGODB').then(function(service) {

        service.send('update', {collectionName : req.session.appid, query : {where : {_className : '_Acl', name : req.params._className}}, data : data}, function(err, doc) {

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

exports.destroyAcl = function(req, res, container) {

    container.getService('MONGODB').then(function(service) {

        service.send('remove', {collectionName : req.session.appid, query : {where : {_className : '_Acl', name : req.params._className}}}, function(err, doc) {

            if(err)
                return res.error(err);

            res.send(200, {});
        });
    }).fail(function(err) {

        res.error(err);
    });
};


exports.group = function(req, res, container) {

    container.getService('MONGODB').then(function(service) {

        var keys = [];
        var condition = {};

        if(req.group.keys)
            keys = req.group.keys;

        if(req.group.condition)
            condition = req.group.condition;

        service.send('group', {collectionName : req.session.appid, keys : keys, query : condition}, function(err, docs) {

            if(err)
                return res.error(err);

            res.send(200, {results: docs.data});
        });
    }).fail(function(err) {

        res.error(err);
    });
};

exports.aggregate = function(req, res, container) {

    container.getService('MONGODB').then(function(service) {

        service.send('aggregate', {collectionName : req.session.appid, query : req.aggregate}, function(err, docs) {

            if(err)
                return res.error(err);

            res.send(200, {results: docs.data});
        });
    }).fail(function(err) {

        res.error(err);
    });
};
