var user = require('../models/user.js');
var history = require('../models/history.js');
var project = require('../models/project.js');

module.exports = function Project(app) {

    app.get('/history/:projectId', user.restrict, function(req, res){
        project.getProject(req.params.projectId, function(p){
            if (!p) return res.redirect('/projects');
            history.getHistoryByProject(req.params.projectId, function(rows){
                res.render('history/list', { rows: rows, project: p, history: history});
            });
        });
    });

    app.get('/history/:projectId/detail/:historyId', user.restrict, function(req, res){
        project.getProject(req.params.projectId, function(p){
            if (!p) return res.redirect('/projects');
            history.getHistoryDetailed(req.params.historyId, function(row){
                res.render('history/detail', { row: row, project: p, history: history});
            });
        });
    });
};