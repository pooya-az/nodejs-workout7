var http_module = require('http');
var assert_module = require('assert');
var url_module = require('url');

var initVendor = require('./vendor/init')();
var serverVendor = require('./vendor/server')(http_module, assert_module);
var routerVendor = require('./vendor/router')(url_module, assert_module, initVendor);

var router = require('./app/http/router')(routerVendor);

var protocol = 'http';
var hostname = '10.10.10.128';
var port = 3000;

initVendor.oracleCreateDatabase();
initVendor.oracleCursorsDatabase();

serverVendor.run(hostname, port, function(request, response) {
    routerVendor.go(request, response, {
        host: hostname,
        port: port,
        protocol: protocol
    });
});
