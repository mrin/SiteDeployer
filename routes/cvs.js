var user = require('../models/user.js');
var cvs = require('../models/cvs.js');
var project = require('../models/project.js');

module.exports = function CVS(app) {

    app.get('/cvs', user.restrict, function(req, res){
        cvs.getCVSs(function(rows){
            res.render('cvs/list', { cvs: rows, cvsObj: cvs });
        });
    });

    app.get('/cvs/add', user.restrict, function(req, res){
        res.render('cvs/add_form', {
            cvs: req.session.cvsForm ? req.session.cvsForm : new cvs(),
            types: cvs.getTypes() });
    });

    app.post('/cvs/add', user.restrict, function(req, res){
        var c = cvs.fillObject(new cvs(), req.body.cvs);
        
        if (3 > c.name.length){
            req.session.cvsForm = c;
            req.flash('error', 'Please fill the CVS title');
            return res.redirect('/cvs/add');
        }

        c.save(function(insertId){
            if (!insertId) {
                req.flash('error', 'DB error');
                return res.redirect('/cvs/add');
            }
            req.session.cvsForm = null;
            res.redirect('/cvs');
        });
    });

    app.get('/cvs/edit/:id', user.restrict, function(req, res){
        cvs.getCVS(req.params.id, function(c){
            if (!c) return res.redirect('/cvs');
            res.render('cvs/edit_form', { cvs: c, types: cvs.getTypes() });
        });
    });

    app.post('/cvs/edit/:id', user.restrict, function(req, res){
        cvs.getCVS(req.params.id, function(c){
            if (!c) return res.redirect('/cvs');

            c = cvs.fillObject(c, req.body.cvs);
            c.save(function(isSuccess){
                if (isSuccess) {
                    project.updateDeployTemplates(req.params.id);
                    req.flash('info', 'CVS information has been successfully saved!');
                } else {
                    req.flash('error', 'DB error');
                }

                res.redirect('/cvs/edit/' + c.id);
            });

        });
    });

    app.get('/cvs/delete/:id', user.restrict, function(req, res){
        cvs.getCVS(req.params.id, function(c){
            if (!c) return res.redirect('/cvs');
            c.remove();
            res.redirect('/cvs');
        });
    });

};