var path_module = require('path');
var fs_module = require('fs');

var dbiVendor = require('./dbInterface.js');

var config = {
    libpath: path_module.join(__dirname + '/../ojdbc6_g.jar'),
    drivername: 'oracle.jdbc.driver.OracleDriver',
    // url: 'jdbc:oracle:thin:@192.168.1.53:1522:orcl1',
    url : 'jdbc:oracle:thin:@10.10.10.128:1521:xe',
    // optionally
    user: 'woods',
    password: '31134'
};

module.exports = function() {
    var func = {};

    func.oracleCreateDatabase = function() {
        dbiVendor.openConn(config).then(function(jdbc) {
            dbiVendor.queryResult(jdbc, "select tname from tab where tname = 'MEMBERS'").then(function(result) {
                if(typeof(result[0].TNAME) != 'undefined') {
                    dbiVendor.closeConn(jdbc);
                }
            }).fail(function(error) {
                fs_module.readFile(path_module.join(__dirname + '/../resources/databases/members.sql'), function(error, data) {
                    if(!error) {
                        dbiVendor.queryResultUpdate(jdbc, data.toString().replace(/(\r\n|\n|\r)/gm," ").replace(/\s+/g, ' ')).then(function (result) {
                        }).fail(function(error) {
                        }).done(function() {
                            dbiVendor.closeConn(jdbc);
                        });
                    }
                });
            });
        }).fail(function(error) {
            console.log('db error!');
        });
    };

    func.oracleCursorsDatabase = function() {
        // dbiVendor.openConn(config).then(function(jdbc) {
        //     dbiVendor.queryResultUpdate(jdbc, "ALTER SYSTEM SET open_cursors = 65535 SCOPE=BOTH").then(function (result) {
        //     }).fail(function(error) {
        //     }).done(function() {
        //         dbiVendor.closeConn(jdbc);
        //     });
        // }).fail(function(error) {
        //     console.log('db error!');
        // });
    };

    func.getOracleDatabase = function() {
        return {
            db: dbiVendor,
            open: dbiVendor.openConn(config)
        };
    };

    return func;
};