'use strict';

console.log('Starting TLS server at ' + new Date().toISOString());
process.on('exit', function () {
    console.log('Process exit at ' + new Date().toISOString());
});
require('babel-register');
require('babel-polyfill');

var Promise = require('bluebird');
var sticky = require('socketio-sticky-session');
var cluster = require('cluster');
var pem = Promise.promisifyAll(require('pem'));
var app = require('./app');
var config = require('./config.json');
var spdy = require('spdy');
var socketIo = require('socket.io');
var os = require('os');
var fs = require('fs');

if (process.getuid() === 0) {
    // if we are root
    var port = 443;
} else {
    // we are not root, can only use sockets >1024
    var port = 8443;
}

Promise.coroutine(regeneratorRuntime.mark(function _callee() {
    var credentials, getServer;
    return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
            switch (_context.prev = _context.next) {
                case 0:
                    getServer = function getServer() {
                        var server = spdy.createServer(credentials, app.callback());
                        var io = socketIo.listen(server);

                        io.on('connection', function (socket) {
                            // TODO: do stuff with socket
                        });

                        return server;
                    };

                    // same as an async function; allows use of yield to await promises.
                    /*
                      const keys = yield pem.createCertificateAsync({
                          days: 1,
                          selfSigned: true
                      }); // generate a cert/keypair on the fly
                       const credentials = {
                          key: keys.serviceKey,
                          cert: keys.certificate
                      };
                    */

                    credentials = {
                        key: fs.readFileSync('./privkey.pem'),
                        cert: fs.readFileSync('./fullchain.pem')
                    };


                    if (config.cluster) {
                        sticky({
                            // https://github.com/wzrdtales/socket-io-sticky-session
                            num: os.cpus(), // process count
                            proxy: false }, getServer).listen(port, function () {
                            console.log('Cluster worker ' + (cluster.worker ? cluster.worker.id : '') + ' HTTPS server listening on port ' + port);
                        });
                    } else {
                        getServer().listen(port, function () {
                            console.log('HTTPS server (no cluster) listening on port ' + port);
                        });
                    }

                    if (process.getuid() === 0) {
                        // if we are root
                        // we have opened the sockets, now drop our root privileges
                        process.setgid('nobody');
                        process.setuid('nobody');
                        // Newer node versions allow you to set the effective uid/gid
                        if (process.setegid) {
                            process.setegid('nobody');
                            process.seteuid('nobody');
                        }
                    }

                case 4:
                case 'end':
                    return _context.stop();
            }
        }
    }, _callee, this);
}))();
