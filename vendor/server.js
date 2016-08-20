module.exports = function(http, assert) {
    var func = {};

    func.run = function(hostname, port, handler) {
        http.createServer(function(request, response) {
            //response.statusCode = 200;
            //response.setHeader('Content-Type', 'text/plain');

            handler(request, response);

            //response.end();
        })
        .listen(port, hostname, function() {
            console.log(`Server running at http://${hostname}:${port}/`);
        });
    };

    return func;
};