'use strict';

var utils = require('../../app/utils.js');

module.exports = function(app) {

    app.use(function(req, res, next){
        res.status(404);
        res.send( utils.makeRes(utils.statusTag, 'Not found') );
    });

    app.use(function(err, req, res, next){
        console.error(err.stack);
        res.status(500);
        res.send( utils.makeRes(utils.statusTag, utils.serverErr + ': ' + err) );
    });
}
