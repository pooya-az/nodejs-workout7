var crypto_module = require('crypto');
var path_module = require('path');

module.exports = function(routerVendor, request, response, param, option) {
    var func = {};

    var singupPage = function(type, stats, message) {
        routerVendor.render(path_module.join(__dirname + '/../../resources/views/singup.html'), response, {code: 200}, {
            alert: {
                type: type,
                stats: stats,
                message: message
            }
        });
    };

    var configUsernameDatabase = function(data) {
        var oracleDatabase = option.init.getOracleDatabase();
        oracleDatabase.open.then(function(jdbc) {
            checkExistTable(data, oracleDatabase, jdbc);
        }).fail(function(error) {
            singupPage('danger', '', ['Database connection error!']);
        });
    };

    var checkExistTable = function(data, oracleDatabase, jdbc) {
        var token = '';
        do {
            token = crypto_module.randomBytes(data.foo).toString('hex').substr(data.foo);
        } while(!isNaN(token.substr(0, 1)));
        token = token.toUpperCase();

        oracleDatabase.db.queryResult(jdbc, "select tname from tab where tname = '" + token + "'").then(function(result) {
            if(typeof(result[0].TNAME) != 'undefined') {
                checkExistTable(data, oracleDatabase, jdbc);
            }
        }).fail(function(error) {
            insertUsername(data, oracleDatabase, jdbc, token);
        });
    };

    var insertUsername = function(data, oracleDatabase, jdbc, token) {
        var password = crypto_module.createHash('md5').update(data.password).digest('hex');

        var query = "INSERT INTO MEMBERS (USERNAME, PASSWORD, RAND) VALUES ('" + data.username + "', '" + password + "', '" + token + "')";
        oracleDatabase.db.queryResultUpdate(jdbc, query).then(function (result) {
            createRandomTable(data, oracleDatabase, jdbc, token);
        }).fail(function(error) {
            oracleDatabase.db.closeConn(jdbc);
            if(/unique constraint/gi.test(error.toString())) {
                singupPage('danger', '', ['Your username has been exist!']);
            } else {
                singupPage('danger', '', ['Query execute create user error! (Error code: 1)']);
            }
        });
    };

    var createRandomTable = function(data, oracleDatabase, jdbc, token) {
        var query = "CREATE TABLE " + token + " (USERNAME NVarChar2(20), FOO Number(11), COUNT Number(11))";
        oracleDatabase.db.queryResultUpdate(jdbc, query).then(function(result) {
            singupPage('success', '', ['Username has been created.']);
            insertRandom(data, oracleDatabase, token, 1);
        }).fail(function(error) {
            singupPage('danger', '', ['Query execute create user error! (Error code: 2)']);
        }).done(function() {
            oracleDatabase.db.closeConn(jdbc);
        });
    };

    var insertRandom = function(data, oracleDatabase, token, count) {
        var oracleDatabase = option.init.getOracleDatabase();
        oracleDatabase.open.then(function(jdbc) {
            var query = "INSERT INTO " + token + " (USERNAME, FOO, COUNT) VALUES ('" + data.username +  "', " + data.foo + ", " + count + ")";
            oracleDatabase.db.queryResultUpdate(jdbc, query).then(function(result) {
                if(data.foo == count) {
                    oracleDatabase.db.closeConn(jdbc);
                } else {
                    insertRandom(data, oracleDatabase, token, count++);
                }
            }).fail(function(error) {
            }).done(function() {
                oracleDatabase.db.closeConn(jdbc);
            });
        }).fail(function(error) {
        });
    };

    func.createUser = function() {
        if(typeof(option.post) == 'undefined' || !option.post instanceof Object) {
            singupPage('danger', '', ['Please submit register form.']);
            return;
        }

        var usernamePattern = /^[a-z0-9\_]+$/;
        var numberPattern = /^\d+$/;

        var errors = [];
        if(typeof(option.post.username) == 'undefined') {
            errors.push('Username failed not exist.');
        } else if(option.post.username == '') {
            errors.push('Please enter your username.');
        } else if(option.post.username.length < 3) {
            errors.push('Username must be at least 3 characters.');
        } else if(option.post.username.length > 20) {
            errors.push('Username must be maximum 30 characters.');
        } else if(!usernamePattern.test(option.post.username)) {
            errors.push('Username must be alphabetic character or number or \'_\'.');
        }

        if(typeof(option.post.foo) == 'undefined') {
            errors.push('Foo number failed not exist.');
        } else if(option.post.foo == '') {
            errors.push('Please enter your foo number.');
        } else if(option.post.foo < 3) {
            errors.push('Foo number must be at least 3.');
        } else if(option.post.foo > 10) {
            errors.push('Foo number must be maximum 10.');
        } else if(!numberPattern.test(option.post.foo)) {
            errors.push('Foo number must be numeric character.');
        }

        if(typeof(option.post.password) == 'undefined') {
            errors.push('Password failed not exist.');
        } else if(option.post.password == '') {
            errors.push('Please enter your password.');
        } else if(option.post.password.length < 3) {
            errors.push('Password must be at least 3 characters.');
        }

        if(typeof(option.post.cpassword) == 'undefined') {
            errors.push('Confirm password failed not exist.');
        } else if(option.post.cpassword == '') {
            errors.push('Please enter your confirm password.');
        } else if(option.post.cpassword.length < 3) {
            errors.push('Confirm password must be at least 3 characters.');
        } else if(option.post.password != option.post.cpassword) {
            errors.push('Password and confirm password must be equal.');
        }

        if(errors.length != 0) {
            singupPage('danger', '', errors);
        } else {
            option.post.foo = parseInt(option.post.foo);

            configUsernameDatabase(option.post);
        }
    };
    
    return func;
};