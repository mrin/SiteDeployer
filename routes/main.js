var user = require('../models/user.js');

module.exports = function Main(app) {

    app.get('/', function(req, res){
        if (!req.session.user) {
            res.redirect('/login')
        } else {
            res.redirect('/projects');
        }
    });

    app.get('/login', function(req, res){
        res.render('main/login', {layout:'layout_login'});
    });

    app.post('/login', function(req, res){
        user.authenticate(req.body.username, req.body.password, function(err, user){
            if (user) {
                req.session.regenerate(function(){
                    req.session.user = user;
                    res.redirect('/projects');
                });
            } else {
                req.flash('error', 'Authentication failed');
                res.redirect('/login');
            }
        });
    });

    app.get('/logout', function(req, res){
      req.session.destroy(function(){
        res.redirect('/login');
      });
    });
};