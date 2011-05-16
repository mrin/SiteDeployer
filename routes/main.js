
module.exports = function Main(app, user) {

    app.get('/', function(req, res){
        if (!req.session.user) {
           res.redirect('/login')
        } else {
            res.redirect('/home');
        }
    });

    app.get('/login', function(req, res){
        res.render('main/login');
    });

    app.post('/login', function(req, res){
        user.authenticate(req.body.username, req.body.password, function(err, user){
            if (user) {
                req.session.regenerate(function(){
                    req.session.user = user;
                    res.redirect('/home');
                });
            } else {
                req.flash('error', 'Authentication failed');
                res.redirect('/login');
            }
        });
    });

    app.get('/logout', function(req, res){
      // destroy the user's session to log them out
      // will be re-created next request
      req.session.destroy(function(){
        res.redirect('/login');
      });
    });

    app.get('/home', user.restrict, function(req, res){
      res.send('Wahoo! restricted area');
    });

};