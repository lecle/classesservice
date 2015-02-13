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

    var checklist = ['APIAUTH', 'SESSION'];

    var dest = getRouteDestination(req.data);

    if(!dest) {

        return res.error(new Error('ResourceNotFound'))
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

            req.data.session = response.data.session;

            controller[dest](req.data, res, exports.container);
        });

    }).fail(function(err) {

        res.error(new Error('auth service not found'));
    });
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

    return dest;
}