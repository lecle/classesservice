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

        var reqData = { checklist : checklist, className : req.data.params._className, method : req.data.method };

        var deep = function(a, b) {
            return _.isObject(a) && _.isObject(b) ? _.assign(a, b, deep) : b;
        };

        service.send('check', _.assign(reqData, req.data, deep), function(err, response) {

            if(err) {

                return res.error(err);
            }

            setReqFromSession(req.data, response.data.session);
            controller[dest](req.data, res, exports.container);
        });

    }).fail(function(err) {

        res.error(new Error('auth service not found'));
    });
}

function setReqFromSession(reqData, session) {

    reqData.session = session;

    if(session.userid) {

        if(!(session.acl && session.acl.isAllow))
            reqData.query.where._userid = session.userid;

        if(reqData.data)
            reqData.data._userid = session.userid;
    } else if(!session.masterKey){

        reqData.query.where._userid = { '$exists' : false }
    }

    if(session.appid) {

        if(reqData.data)
            reqData.data._appid = session.appid;
    }

    if(process.env.NODE_ENV === 'test') {

        if(!session.masterKey && session.acl && session.acl.dependentRoles) {

            var authName = (reqData.method === 'GET') ? 'read' : 'write';

            if(!reqData.query.where.$or)
                reqData.query.where.$or = [];

            reqData.query.where.$or.push({"ACL" : { '$exists' : false }});

            for(var i= 0, cnt=session.acl.dependentRoles.length; i<cnt; i++) {

                reqData.query.where.$or.push(makeAclQuery(session.acl.dependentRoles[i], authName));
            }
        }
    }
}

function makeAclQuery(name, authName) {

    var queryJson = {};

    queryJson['ACL.' + name + '.' + authName] = true;

    return queryJson;
}

function getRouteDestination(reqData) {

    var dest = '';

    switch(reqData.method) {

        case 'GET' :
            if(reqData.params._className) {

                if(reqData.params._objectId)
                    dest = 'read';
                else {

                    if(reqData.group)
                        dest = 'group';
                    else if(reqData.aggregate)
                        dest = 'aggregate';
                    else
                        dest = 'find';
                }

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
