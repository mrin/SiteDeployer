var Client = require('mysql').Client
    ,host = 'localhost'
    ,user = 'root'
    ,password = '[123]'
    ,database = 'sitedeployer';

var client = new Client();
    client.user = user;
    client.password = password;
    client.connect();
    client.query('USE '+ database);

module.exports = client;