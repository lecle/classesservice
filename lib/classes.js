"use strict";

var _ = require('lodash');

exports.container = null;

exports.init = function(container, callback) {

    exports.container = container;

    container.addListener('request', onRequest);

    callback(null);
};

exports.close = function(callback) {

    callback(null);
};

exports.request = onRequest;


function onRequest(req, res) {

    var controller = require('./controllers/classesController');

    if(req.data.params._query1)
        req.data.params._className = req.data.params._query1;

    if(req.data.params._query2)
        req.data.params._objectId = req.data.params._query2;

    var checklist = ['APIAUTH'];

    var dest = getRouteDestination(req.data);

    if(!dest) {

        return res.error(new Error('ResourceNotFound'))
    }

    if(req.data.params._objectId === 'ACL') {

        checklist.push('MASTERKEY');
    }

    exports.container.getService('AUTH').then(function(service) {

        var reqData = {checklist : checklist};

        var deep = function(a, b) {
            return _.isObject(a) && _.isObject(b) ? _.assign(a, b, deep) : b;
        };

        service.send('check', _.assign(reqData, req.data, deep), function(err, response) {

            if(err) {

                return res.error(err);
            }

            checkAcl(req.data.params._className, response.data.session, req.data.method, function(err, isAllow) {

                setReqFromSession(req.data, response.data.session);

                if(!isAllow)
                    return res.error(403, new Error('Unauthorized'));

                controller[dest](req.data, res, exports.container);
            });
        });

    }).fail(function(err) {

        res.error(new Error('auth service not found'));
    });
}

function checkAcl(className, session, method, callback) {

    if(session.masterKey)
        return callback(null, true);

    exports.container.getService('MONGODB').then(function(service) {

        service.send('findOne', {collectionName : session.appid, query : {where : {_className : '_Acl', name : className}}}, function(err, doc) {

            if(err)
                return callback(err, false);

            if(doc.data) {

                if(doc.data.ACL) {

                    if(doc.data.ACL[session.userid] || doc.data.ACL[session.username] || doc.data.ACL['*']) {

                        var acl = doc.data.ACL[session.userid] || doc.data.ACL[session.username] || doc.data.ACL['*'];

                        if(acl.master) {

                            session.masterKey = 'master';
                            return callback(null, true);
                        }

                        if(method === 'GET' && acl.read)
                            return callback(null, true);

                        if(method !== 'GET' && acl.write)
                            return callback(null, true);

                        return callback(null, false);
                    }
                }
            }

            return callback(null, true);
        });
    }).fail(function(err) {

        return callback(err, false);
    });
}

function setReqFromSession(reqData, session) {

    reqData.session = session;

    if(session.userid) {

        reqData.query.where._userid = session.userid;

        if(reqData.data)
            reqData.data._userid = session.userid;
    } else if(!session.masterKey){

        reqData.query.where._userid = { '$exists' : false }
    }

    if(session.appid) {

        reqData.query.where._appid = session.appid;

        if(reqData.data)
            reqData.data._appid = session.appid;
    }
}

function getRouteDestination(reqData) {

    var dest = '';

    switch(reqData.method) {

        case 'GET' :
            if(reqData.params._className) {

                if(reqData.params._objectId)
                    dest = 'read';
                else
                    dest = 'find';
            } else {

                dest = 'getObjectList';
            }

            break;

        case 'POST' :
            dest = 'create';
            break;

        case 'PUT' :
            dest = 'update';
            break;

        case 'DELETE' :
            dest = 'destroy';
            break;
    }

    if(reqData.params._objectId === 'ACL') {

        dest += 'Acl';
    }

    return dest;
}
