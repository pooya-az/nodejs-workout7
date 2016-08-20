var extend_module = require('extend');
var path_module = require('path');
var mime_module = require('mime');
var fs_module = require('fs');
var url_module = require('url');
var query_module = require('querystring');

module.exports = function(url, assert, init) {
    var routeUrl = [],
        param = {},
        current = -1,
        assetsDirectory = '',
        domainInfo = {},
        func = {};

    var _createRoute = function(route, method, func) {
        var routeValue = route.split('/');
        if(routeValue[0] == '') {
            routeValue.splice(0, 1);
        }
        if(routeValue[routeValue.length - 1] == '') {
            routeValue.splice(-1);
        }

        var routeOption = {
            url: route,
            method: method,
            path: routeValue,
            param: [],
            func: func,
            option: {}
        };

        routeValue.forEach(function(value, key) {
            if(value.substr(0, 1) == ':') {
                if(routeOption.param.indexOf(value.substr(1)) == -1) {
                    routeOption.param.push(value.substr(1));
                } else {
                    assert(false, `Duplicate variable '${value.substr(1)}' in '${route}' route.\r\n`);
                }
            }
        });

        routeUrl.push(routeOption);
    };

    func.get = function(route, func) {
        _createRoute(route, 'get', func);

        return this;
    };

    func.post = function(route, func) {
        _createRoute(route, 'post', func);

        return this;
    };

    func.go = function(request, response, domain) {
        domainInfo = domain;
        var find = '';
        var method = request.method.toLowerCase();
        var pathname = url.parse(request.url).pathname;

        var routeValue = pathname.split('/');
        if(routeValue[0] == '') {
            routeValue.splice(0, 1);
        }
        if(routeValue[routeValue.length - 1] == '') {
            routeValue.splice(-1);
        }

        if(assetsDirectory != '' && pathname.indexOf(assetsDirectory) == 0) {
            this.render(path_module.join(__dirname + '/../' + pathname), response);
            return;
        }

        routeUrl.forEach(function(value, key) {
            if(value.path.length == routeValue.length && method == value.method) {
                var check = 0;
                value.path.forEach(function(value, key) {
                    if(value.substr(0, 1) == ':') {
                        if(routeValue[key] == value) {
                            assert(false, `Can't use ':' in url parametr.\r\n`);
                        } else {
                            check++;
                            param[value.substr(1)] = routeValue[key];
                        }
                    } else if(value == '*') {
                        if(routeValue[key] == '*') {
                            assert(false, `Can't use '*' in url parametr.\r\n`);
                        } else {
                            check++;
                        }
                    } else if(value == routeValue[key]) {
                        check++;
                    }
                });
            }
            if(value.path.length == check) {
                current = key;
                find = value;
                return;
            }
        });

        if(find != '') {
            var userPath = [];
            find.path.forEach(function(value, key) {
                if(value == '*') {
                    userPath.push(routeValue[key]);
                }
            });

            extend_module(find.option, {
                init: init,
                domain: domain,
                path: pathname,
                param: userPath,
                method: method,
                query: query_module.parse(url_module.parse(request.url).query),
                callback: find.func
            });

            if(method == 'post') {
                var post = '';
                request.on('data', function(chunk) {
                    post += chunk.toString();
                });

                request.on('end', function() {
                    extend_module(find.option, {post: query_module.parse(post)});
                    find.func(request, response, param, find.option);
                });
            } else {
                find.func(request, response, param, find.option);
            }
        } else {
            //assert(false, 'Can\'t find url in route.' + '\r\n\t\t ' + 'Please fix this url => ' + pathname + '\r\n\r\n');
            response.writeHead(404, {'Content-Type': 'text/html'});
            response.write('<h1>Sorry, the page you are looking for could not be found.</h1><p style="color: #991f21">Can\'t find url in route.' + '\r\n\t\t ' + 'Please fix this url => ' + pathname + '\r\n\r\n</p>');
            response.end();
        }
    };

    func.render = function(uri, response, sendHeader, data) {
        if(typeof(data) == 'undefined') {
            data = sendHeader;
            sendHeader = {};
        }
        if(!data instanceof Object) {
            data = {};
        }
        if(!sendHeader instanceof Object) {
            sendHeader = {};
        }

        var defaultHeader = {
            code : 200,
            header: {'Content-Type': 'text/html'}
        };
        var type = mime_module.lookup(uri);
        var renderHeader = extend_module({}, defaultHeader, sendHeader);

        if(type == 'text/html') {
            fs_module.readFile(uri, function(error, read) {
                if(!error) {
                    var domain = domainInfo.protocol + '://';
                    if(domainInfo.port == 80) {
                        domain += domainInfo.host;
                    } else {
                        domain += domainInfo.host + ':' + domainInfo.port;
                    }
                    extend_module(data, {domain: domain});

                    read = read.toString('utf8');
                    var renderError = '';
                    try {
                        read.match(/\{\@([a-zA-Z0-9\_\.\,\|]+)\}/g).forEach(function(value) {
                            var valueVar = value.substr(2, value.length - 3).split('|');
                            var dataVar = data;

                            valueVar[0].split('.').forEach(function(value) {
                                dataVar = dataVar[value];
                            });

                            if(typeof(valueVar[1]) != 'undefined') {
                                var tempVar = '';
                                var splitVar = valueVar[1].split(',');
                                switch(splitVar[0]) {
                                    case 'repeat':
                                        for(var j = 0; j < dataVar.length; j++) {
                                            tempVar += '<' + splitVar[1] + '>' + dataVar[j] + '</' + splitVar[1] + '>';
                                        }
                                        break;
                                }
                                dataVar = tempVar;
                            }

                            if(typeof(dataVar) == 'undefined') {
                                renderError = value;
                                return;
                            } else {
                                read = read.replace(/\|/g, '@').replace(new RegExp(value.replace(/\|/g, '@'), 'g'), dataVar);
                            }
                        });
                    } catch(ex) {}
                    
                    if(renderError != '') {
                        response.writeHead(500, {'Content-Type': 'text/html'});
                        response.write('<h1>Sorry, The server has encountered a situation it doesn\'t know how to handle.</h1><p style="color: #991f21">Can\'t find var "' + renderError + '" in page.' + '\r\n\t\t ' + 'Please fix this var in => ' + uri + '\r\n\r\n</p>');
                        response.end();
                    } else {
                        response.writeHead(200, {'Content-Type': 'text/html'});
                        response.write(read);
                        response.end();
                    }
                } else {
                    throw error;
                }
            });
            // } else if(type.match(/image\//gi)) {
            //     response.writeHeader(200, {'Content-Type': type});
            //     fs_module.createReadStream(uri).pipe(response);
        } else {
            response.writeHead(200, {'Content-Type': type});
            fs_module.createReadStream(uri).on('error', function(error) {
                var file = path_module.parse(uri);
                response.writeHead(404, {'Content-Type': 'text/html'});
                response.write('<h1>Sorry, the page you are looking for could not be found.</h1><p style="color: #991f21">Can\'t find \'' + file.base + '\' file in directory.\r\n\r\n</p>');
                response.end();
            }).pipe(response);
        }
    };

    func.assets = function(directory) {
        assetsDirectory = directory;
    };

    func.download = function(uri, response) {
        var type = mime_module.lookup(uri);
        var file = path_module.parse(uri);
        fs_module.readFile(uri, function(error, read) {
            if(!error) {
                response.writeHead(200, {
                    'Content-Type': type,
                    'Content-Disposition': 'attachment; filename=' + file.base,
                    'Content-Length': read.length
                });
                response.write(read);
                response.end();
            } else {
                throw error;
            }
        });
    };

    var _checkDir = function(dir) {
        var path = ['./'];
        var deep = [0];
        var routeValue = dir.split('/');

        if(routeValue[0] == '') {
            routeValue.splice(0, 1);
        }
        if(routeValue[routeValue.length - 1] == '') {
            routeValue.splice(-1);
        }

        /*if(route.param.length != 0) {
         assert(false, `Can't use parametr whit begin start ':' in readdir.\r\n`);
         }*/

        routeValue.forEach(function(value, key) {
            if(value != '*') {
                for(var i = 0; i < path.length; i++) {
                    path[i] += value + '/';
                    deep[i] += 1;
                }
            } else {
                for(var i = 0; i < path.length; i++) {
                    if(deep[i] != key + 1 && fs_module.existsSync(path[i])) {
                        var files = fs_module.readdirSync(path[i]);
                        for(var j = 0; j < files.length; j++) {
                            if(fs_module.statSync(path[i] + files[j]).isDirectory()) {
                                path.push(path[i] + files[j] + '/');
                                deep.push(deep[i] + 1);
                            }
                        }
                    }
                }
            }
            path.forEach(function(value, key) {
                if(!fs_module.existsSync(value)) {
                    path.splice(key, 1);
                    deep.splice(key, 1);
                }
            });
        });

        var tempPath = [];
        deep.forEach(function(value, key) {
            if(value == routeValue.length) {
                tempPath.push(path[key]);
            }
        });
        path = tempPath;

        path = path.sort();
        var uniquePath = path.filter(function(value, key, self) {
            return self.indexOf(value) == key;
        });

        return uniquePath;
    }

    func.login = function(login) {
        if(typeof(login) == 'undefined') {
            return;
        }

        path = _checkDir(login);
        var route = routeUrl[routeUrl.length - 1];
        if(route.option.loginPath instanceof Object) {
            extend_module(route.option, {accessPath: route.option.loginPath.concat(path)});
        } else {
            extend_module(route.option, {loginPath: path});
        }

        return this;
    }

    func.access = function(access) {
        if(typeof(access) == 'undefined') {
            return;
        }

        path = _checkDir(access);
        var route = routeUrl[routeUrl.length - 1];
        if(route.option.accessPath instanceof Object) {
            extend_module(route.option, {accessPath: route.option.accessPath.concat(path)});
        } else {
            extend_module(route.option, {accessPath: path});
        }

        return this;
    };

    func.match = function(option, key) {
        var match = false;
        var dir = [];
        switch(key) {
            case 'login':
                path = option.loginPath;
                break;
            case 'access':
                path = option.accessPath;
                break;
            default:
                return;
        }
        path.forEach(function(value, key) {
            var tempPath = option.path.substr(-1) == '/' ? option.path.substr(0, option.path.length - 1) : option.path;
            if(tempPath.match(new RegExp(value.substr(1, value.length - 2), 'g'))) {
                match = true;
            }
        });

        return match;
    };

    return func;
};