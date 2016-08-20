var path_module = require('path');

module.exports = function(routerVendor) {
    routerVendor.assets('/public/assets');

    routerVendor.get('/', function(request, response, param, option) {
        response.write('Hello Word!');
        response.end();
    });

    routerVendor.get('/test/:id', function(request, response, param, option) {
        console.log(4);
        response.end();
    });

    routerVendor.get('/*', function(request, response, param, option) {
        if(routerVendor.match(option, 'access')) {
            var directoryController = require('../controller/directoryController')(routerVendor, request, response, param, option);
            directoryController.find();
        } else {
            routerVendor.render(path_module.join(__dirname + '/../../resources/views/notAccess.html'), response, {code: 403});
        }
    }).access('/public');

    routerVendor.get('/public/static-files/*', function(request, response, param, option) {
        if(routerVendor.match(option, 'access') && !routerVendor.match(option, 'login')) {
            var directoryController = require('../controller/directoryController')(routerVendor, request, response, param, option);
            directoryController.find();
        } else if(routerVendor.match(option, 'login')) {
            routerVendor.render(path_module.join(__dirname + '/../../resources/views/notLogin' + (option.path.substr(-1, 1) == '/' ? 'Directory' : 'File') + '.html'), response, {code: 440});
        } else {
            routerVendor.render(path_module.join(__dirname + '/../../resources/views/notAccess.html'), response, {code: 403});
        }
    }).access('/public/static-files/public').access('/public/static-files/after-login').login('/public/static-files/after-login');

    routerVendor.get('/public/static-files/*/*', function(request, response, param, option) {
        if(routerVendor.match(option, 'login')) {
            routerVendor.render(path_module.join(__dirname + '/../../resources/views/notLogin' + (option.path.substr(-1, 1) == '/' ? 'Directory' : 'File') + '.html'), response, {code: 440});
        } else {
            var directoryController = require('../controller/directoryController')(routerVendor, request, response, param, option);
            directoryController.find();
        }
    }).login('/public/static-files/after-login');

    routerVendor.get('/public/static-files/*/*/*', function(request, response, param, option) {
        if(routerVendor.match(option, 'login')) {
            routerVendor.render(path_module.join(__dirname + '/../../resources/views/notLogin' + (option.path.substr(-1, 1) == '/' ? 'Directory' : 'File') + '.html'), response, {code: 440});
        } else {
            var directoryController = require('../controller/directoryController')(routerVendor, request, response, param, option);
            directoryController.find(true);
        }
    }).login('/public/static-files/after-login');

    routerVendor.get('/singup', function(request, response, param, option) {
        routerVendor.render(path_module.join(__dirname + '/../../resources/views/singup.html'), response, {code: 200}, {
            alert: {
                type: 'danger',
                stats: ' hide',
                message: []
            }
        });
    });

    routerVendor.post('/singup', function(request, response, param, option) {
        var userController = require('../controller/userController')(routerVendor, request, response, param, option);
        userController.createUser();
    });
};

