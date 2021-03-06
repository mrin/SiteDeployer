/**
 * Module dependencies.
 */

require.paths.unshift(__dirname + '/vendor');
require.paths.unshift(__dirname + '/vendor/express/support');

var express = require('express')
   ,messages = require('express-messages')
   ,faye = require('faye');

var app = module.exports = express.createServer();

var bayeux = new faye.NodeAdapter({
    mount: '/faye',
    timeout: 45
});

// Configuration

app.set('views', __dirname + '/views');
app.register('.html', require('ejs'));
app.set('view engine', 'html');

app.configure(function(){
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'your secret here' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

// Example 500 page
app.error(function(err, req, res){
    res.render('500');
});

// Example 404 page via simple Connect middleware
app.use(function(req, res){
    res.render('404', {request: req});
});

app.dynamicHelpers({
    messages: messages
  , base: function(){
    // return the app's mount-point
    // so that urls can adjust. For example
    // if you run this example /post/add works
    // however if you run the mounting example
    // it adjusts to /blog/post/add
    return '/' == app.route ? '' : app.route;
  }
});

// Routes
require('./routes/main.js')(app);
require('./routes/project.js')(app);
require('./routes/cvs.js')(app);
require('./routes/history.js')(app);
require('./routes/deploy.js')(app, bayeux);

// Only listen on $ node app.js
if (!module.parent) {
    bayeux.attach(app);
    app.listen(3002);
    console.log("Express server listening on port %d", app.address().port);
}
