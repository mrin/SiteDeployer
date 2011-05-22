var user = require('../models/user.js');
var project = require('../models/project.js');
var deployment = require('../models/deployment.js');

module.exports = function Deploy(app, bayeux) {

    app.get('/deploy/:projectId', user.restrict, function(req, res){
        project.getProject(req.params.projectId, function(p){
            if (!p) return res.redirect('/projects');
            
            return res.render('deployment/view', { project: p });
        });
    });

    app.get('/deployConfig.json', user.restrict, function(req, res){
        var config = {
            port: app.address().port,
            mountPoint: bayeux._options.mount
        };
        res.send(config);
    });

    // deployment process
    app.get('/deploy/:projectId/:type', user.restrict, function(req, res){
        project.getProject(req.params.projectId, function(p){
            if (!p) return res.redirect('/projects');

            switch (req.params.type) {
                case 'startDev':
                    deployment.start(p, 'development', 'deploy', req.session.user, bayeux);
                    break;
                case 'rollbackDev':
                    deployment.start(p, 'development', 'rollback', req.session.user, bayeux);
                    break;
                case 'startProd':
                    deployment.start(p, 'production', 'deploy', req.session.user, bayeux);
                    break;
                case 'rollbackProd':
                    deployment.start(p, 'production', 'rollback', req.session.user, bayeux);
                    break;
                case 'stopDep':
                    deployment.stop(p);
                    break;
                default:
                    return res.redirect('/projects');
            }
            res.send('OK');
        });
    });
};