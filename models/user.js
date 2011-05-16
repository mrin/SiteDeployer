var DB = require('../utils/db-connection.js');

module.exports = new User();

function User() {

    var self = this;
    self.crypto = require('crypto');
    self.id = 0;
    self.login = '';
    self.password = '';
    self.lastlogin = '';
    self.name = '';
    self.groupId = 0;
    self.salt = 'coolessalt';

    self.authenticate = function(name, pass, fn) {
        DB.query('SELECT * FROM user WHERE login=?', [name], function(err, results, fields){
            if (!results.length){
                return fn(new Error('cannot find user'));
            }
            
            var userObj = results[0];

            if (userObj.password == pass){
                self.fillObject(userObj);
                return fn(null, self);
            } else {
                // Otherwise password is invalid
                fn(new Error('invalid password'));
            }
        });
    };

    self.restrict = function(req, res, next) {
        if (req.session.user) {
            next();
        } else {
            req.flash('error', 'Access denied!');
            res.redirect('/login');
        }
    };

    self.hashPassword = function(pass) {
        return self.crypto.createHash('md5').update(pass + self.salt).digest('hex');
    }

    self.fillObject = function(userObj) {
        self.id = userObj.id;
        self.login = userObj.login;
        self.password = userObj.password;
        self.name = userObj.name;
        self.groupId = userObj.group_id;
        self.lastlogin = userObj.lastlogin;
    }
}