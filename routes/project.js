var user = require('../models/user.js');
var project = require('../models/project.js');
var cvs = require('../models/cvs.js');

module.exports = function Project(app) {

    app.get('/projects', user.restrict, function(req, res){
        project.getProjects(function(rows){
            res.render('project/list', { projects: rows });
        });
    });

    app.get('/project/add', user.restrict, function(req, res){
        cvs.getCVSs(function(cvs_rows){
            res.render('project/add_form', {
                project: req.session.projectForm ? req.session.projectForm : new project(),
                cvsRows: cvs_rows
            });
        });
    });

    app.post('/project/add', user.restrict, function(req, res){
        var p = project.fillObject(new project(), req.body.project);
        
        if (3 > p.name.length){
            req.session.projectForm = p;
            req.flash('error', 'Please fill the Project Name');
            return res.redirect('/project/add');
        }

        p.save(function(insertId){
            if (!insertId) {
                req.flash('error', 'DB error');
                return res.redirect('/project/add');
            }
            res.redirect('/projects');
        });
    });

    app.get('/project/edit/:id', user.restrict, function(req, res){
        cvs.getCVSs(function(cvs_rows){
            project.getProject(req.params.id, function(p){
                if (!p) return res.redirect('/projects');
                res.render('project/edit_form', { project: p, cvsRows:cvs_rows });
            });
        });
    });

    app.post('/project/edit/:id', user.restrict, function(req, res){
        project.getProject(req.params.id, function(p){
            if (!p) return res.redirect('/projects');

            p = project.fillObject(p, req.body.project);
            p.save(function(isSuccess){
                if (isSuccess) {
                    req.flash('info', 'Project information has been successfully saved!');
                } else {
                    req.flash('error', 'DB error');
                }

                res.redirect('/project/edit/' + p.id);
            });

        });
    });

    app.get('/project/delete/:id', user.restrict, function(req, res){
        project.getProject(req.params.id, function(p){
            if (!p) return res.redirect('/projects');
            p.remove();
            res.redirect('/projects');
        });
    });

};