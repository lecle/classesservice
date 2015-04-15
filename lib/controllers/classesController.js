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

    if(process.env.NODE_ENV !== 'test' && !req.params._objectId)
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

        var group = {
            key : ['_className'],
            cond : {},
            initial : {"count":0},
            reduce : "function (obj, prev) { prev.count++; }"
        };

        service.send('group', {collectionName : req.session.appid, group : group}, function(err, docs) {

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

        if(!req.group.cond)
            req.group.cond = {};

        req.group.cond._className = req.params._className;

        if(req.query.where._userid)
            req.group.cond._userid = req.query.where._userid;

        service.send('group', {collectionName : req.session.appid, group : req.group}, function(err, docs) {

            if(err)
                return res.error(err);

            res.send(200, {results: docs.data});
        });
    }).fail(function(err) {

        res.error(err);
    });
};

exports.aggregate = function(req, res, container) {

    if(!Array.isArray(req.aggregate))
        res.error(new Error('[aggregate] type error'));

    container.getService('MONGODB').then(function(service) {

        function setDefaultMatch(match) {

            match._className = req.params._className;

            if(req.query.where._userid)
                match._userid = req.query.where._userid;
        }

        var hasMatch = false;

        for(var i= 0, cnt=req.aggregate.length; i<cnt; i++) {

            if(req.aggregate[i].$match) {

                setDefaultMatch(req.aggregate[i].$match);
                hasMatch = true;
            }
        }

        if(!hasMatch) {

            var match = {};
            setDefaultMatch(match);

            req.aggregate.push(match);
        }

        service.send('aggregate', {collectionName : req.session.appid, aggregate : req.aggregate}, function(err, docs) {

            if(err)
                return res.error(err);

            res.send(200, {results: docs.data});
        });
    }).fail(function(err) {

        res.error(err);
    });
};
