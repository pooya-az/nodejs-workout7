var q = require("q"),
    util = require('util'),
    http = require('http');
//  sc = require('./serviceConfig.js'),
// validator = require('../../utilities/validator.js').validator;

//jdbc function
function openConn(config) {

    var deferred = q.defer();
    if (!config) {
        console.log('Connection error: No config!');
        deferred.reject('Connection error: No config!');
    }
    else {
        var jdbc = new (require('part-jdbc'));
        jdbc.initialize(config, function (err, res) {
            if (err) {
                console.log(err);
            } else {
                console.log("Connection initialized successfully!");
                jdbc.open(function (err, conn) {
                    if (err) {
                        console.log('Connection error!', err);
                        deferred.reject(err);

                    } else {
                        deferred.resolve(jdbc);
                        console.log("Opened successfully!");
                    }
                });
            }
        });
    }
    return deferred.promise;
}

function closeConn(jdbc) {
    var deferred = q.defer();
    jdbc.close(function (err) {
        if (err) {
            console.log('Error in closing the connection!', err);
            deferred.reject(new Error(err));
        } else {
            console.log("Closed successfully!");
            deferred.resolve();
        }
    });
    return deferred.promise;
}

function queryResult(jdbc, query, passToCallback) {
    var deferred = q.defer();
    var genericQueryHandler = function (err, results) {
        if (err) {
            console.log('Query:', query, err);
            if (passToCallback) {
                deferred.reject(err, passToCallback);
            }
            else {
                deferred.reject(err);
            }
        }
        else {
            if (passToCallback) {
                deferred.resolve({data: results, passToCallback: passToCallback});
            }
            else {
                deferred.resolve(results);
            }
        }
    };
    jdbc.executeQuery(query, genericQueryHandler);
    return deferred.promise;
}

function queryResultUpdate(jdbc, query, passToCallback) {
    var deferred = q.defer();
    var genericQueryHandler = function (err, results) {
        if (err) {
            console.log('Query:', query, err);
            if (passToCallback) {
                deferred.reject(err, passToCallback);
            }
            else {
                deferred.reject(err);
            }
        }
        else {
            if (passToCallback) {
                deferred.resolve({data: results, passToCallback: passToCallback});
            }
            else {
                deferred.resolve(results);
            }
        }
    };
    /*if (query.substr(0, query.indexOf(' ')).toUpperCase() == 'INSERT') {
     deferred.reject('Error: Using update command to execute an insert command is forbidden!');
     }
     else {*/
    jdbc.executeUpdate(query, genericQueryHandler);
    //}
    return deferred.promise;
}

function queryResultInsert(jdbc, query, passToCallback) {
    var deferred = q.defer();
    jdbc.executeUpdate(query,
        function (err, result) {
            if (err) {
                console.log('Query:', query, err);
                if (passToCallback) {
                    deferred.reject(err, passToCallback);
                }
                else {
                    deferred.reject(err);
                }

            }
            else {
                /*var db = query.match(/ [a-zA-Z0-9_]*\./i)[0];
                 db = db.substr(1, db.length-2);*/
                var db = jdbc._config.user;
                query = "select * from " + db + "." + db + "_log";
                jdbc.executeQuery(query, function (err, results) {
                    if (err) {
                        console.log('Query:', query, err);
                        if (passToCallback) {
                            deferred.reject(err, passToCallback);
                        }
                        else {
                            deferred.reject(err);
                        }
                    }
                    else {
                        query = "delete from " + db + "." + db + "_log";
                        jdbc.executeUpdate(query, function (err, result) {
                            if (err) {
                                console.log('Query:', query, err);
                                if (passToCallback) {
                                    deferred.reject(err, passToCallback);
                                }
                                else {
                                    deferred.reject(err);
                                }
                            }
                            else {
                                if (passToCallback) {
                                    deferred.resolve({data: results, passToCallback: passToCallback});
                                }
                                else {
                                    deferred.resolve(results);
                                }
                            }
                        });
                    }
                });
            }
        });
    return deferred.promise;
}
//end jdbc function


//jdbc
exports.openConn = openConn;
exports.closeConn = closeConn;
exports.queryResult = queryResult;
exports.queryResultUpdate = queryResultUpdate;
exports.queryResultInsert = queryResultInsert;