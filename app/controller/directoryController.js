var path_module = require('path');
var fs_module = require('fs');
var mime_module = require('mime');

module.exports = function(routerVendor, request, response, param, option) {
    var func = {};

    func.find = function(download) {
        if(typeof(download) == 'undefined') {
            download = false;
        }
        if(!download instanceof Boolean) {
            download = false;
        }

        var result_path = path_module.parse(option.path);
        fs_module.stat('.' + option.path, function(error, stats) {
            var code = 0;
            var uri = '';
            if(error) {
                download = false;
                code = 404;
                uri = path_module.join(__dirname + '/../../resources/views/notFound.html');
            } else {
                if(stats.isFile()) {
                    code = 200;
                    uri = path_module.join(__dirname + '/../../' + option.path);
                } else if(stats.isDirectory()) {
                    fs_module.readdir('.' + option.path, function(error, files) {
                        if(!error) {
                            var dir_list = [];
                            files.forEach(function (value, key) {
                                var info = fs_module.statSync(path_module.normalize('.' + option.path + '/' + value));
                                if(info.isFile()) {
                                    dir_list.push({
                                        name: value,
                                        folder: 0,
                                        size: info.size,
                                        date: info.ctime
                                    });
                                } else if(fs_module.statSync(path_module.normalize('.' + option.path + '/' + value)).isDirectory()) {
                                    dir_list.push({
                                        name: value,
                                        folder: 1,
                                        size: 0,
                                        date: info.ctime
                                    });
                                }
                            });
                        }
                        routerVendor.render(path_module.join(__dirname + '/../../resources/views/dirList.html'), response, {code: 200}, {
                            parent: '.' + option.path,
                            list: JSON.stringify(dir_list)
                        });
                    });
                    return;
                }
            }

            if(download) {
                routerVendor.download(uri, response);
            } else {
                routerVendor.render(uri, response, {code: code});
            }
        });
    };

    return func;
};