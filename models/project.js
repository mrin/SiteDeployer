var user = require('../models/user.js');
var cvs = require('../models/cvs.js');
var DB = require('../utils/db-connection.js');
var str = require('../utils/string.js');
var ejs = require('ejs');
var fs = require('fs');
var async = require('async');

var deployTemplatePath = __dirname + '/../deploy_templates/';
var defTemplatePath = __dirname + '/../views/_default/';

var Project = exports = module.exports = function Project(){
    this.id = 0;
    this.name = '';
    this.status = 0;
    this.lastdeploy_userid = 0;
    this.lastdeploy_date = null;
    this.group_id = 0;

    this.dev_hostname = '';
    this.dev_hostip = '';
    this.dev_ssh_username = '';
    this.dev_ssh_password = '';
    this.dev_ssh_port= 22;
    this.dev_home_dir = '';
    this.dev_www_dir = '';
    this.dev_version_id = 0;
    this.dev_version_path = '';

    this.prod_hostname = '';
    this.prod_hostip = '';
    this.prod_ssh_username = '';
    this.prod_ssh_password = '';
    this.prod_ssh_port = 22;
    this.prod_home_dir = '';
    this.prod_www_dir = '';
    this.prod_version_id = 0;
    this.prod_version_path = '';
};

/**
 * Save project (insert / update)
 * @param cb
 */
Project.prototype.save = function(cb){
    if (3 >= this.name.length) return false;

    var updateFields = Array();
    for (var fieldName in this) {
        if('id' == fieldName) continue;
        var value = this[fieldName];
        if (null != value && (typeof value == 'number' || typeof value == 'string')) {
            updateFields.push(fieldName + ' = \'' + this[fieldName] + '\'');
        }
    }
    var self = this;
    if (0 == this.id) {
        DB.query('INSERT INTO project SET ' + updateFields.join(','), function(err, results, fields){
            if(err) return cb(false);
            self.id = results.insertId;

            exports.createDeployTemplate(self, function(err){
                if (err) console.log('Deploy template is not created', err);
                cb(results.insertId);
            });

        });
    } else {
        DB.query('UPDATE project SET ' + updateFields.join(',') + 'WHERE id = ' + this.id, function(err, results, fields){
            if(err) return cb(false);

            exports.createDeployTemplate(self, function(err){
                if(err) console.log('Deploy template is not created', err);
                cb(results.affectedRows);
            });
        });
    }
};

/**
 * Remove project
 */
Project.prototype.remove = function() {
    if (0 == this.id) return false;
    DB.query('DELETE FROM project WHERE id=' + this.id);
    exports.removeExistedTemplate(this.id);
};

/**
 * Create a filled copy of Capfile & deploy.rb
 *
 * @param projectObj
 * @param callback cb
 */
exports.createDeployTemplate = function(projectObj, cb) {

    exports.removeExistedTemplate(projectObj.id, function(isSuccess){
        if (!isSuccess) return cb(false);

        // get CVS access for dev & prod env
        async.series([
            function(cb){
                cvs.getCVS(projectObj.dev_version_id, function(cvsObj) {
                    if (!cvsObj) return cb(null, null);
                    return cb(null, cvsObj);
                });
            },
            function(cb){
                cvs.getCVS(projectObj.prod_version_id, function(cvsObj) {
                    if (!cvsObj) return cb(null, null);
                    return cb(null, cvsObj);
                });
            }
        ],

        function(err, cvsData){
            // read default deploy recipe as template
            fs.readFile(defTemplatePath + 'deploy.rb', 'utf8', function(err, data) {
                if (err) return cb(err);

                // fill template
                var filledTemplate = ejs.render(data, {
                    locals: {
                        project: projectObj,
                        cvsDev: !cvsData[0] ? new cvs() : cvsData[0], // given from async.series
                        cvsProd: !cvsData[1] ? new cvs() : cvsData[1]
                    }
                });
                
                var projectTplPath = deployTemplatePath + projectObj.id;

                // create folder for project
                fs.mkdir(projectTplPath, 0755, function(err) {
                    if (err) return cb(err);

                    fs.symlink(defTemplatePath + 'Capfile', projectTplPath + '/Capfile', function(err) {
                        if (err) return cb(err);

                        fs.mkdir(projectTplPath + '/config', 0755, function(err) {
                           if (err) return cb(err);

                            // write filled template
                            fs.writeFile(projectTplPath + '/config/deploy.rb', filledTemplate, function(err) {
                                if (err) return cb(err);
                                return cb(null);
                            });
                        });
                    });
                });
            });
        }
        
        );
    });
};

/**
 * Remove folder with deploy config
 *
 * @param projectId
 * @param cb
 */
exports.removeExistedTemplate = function(projectId, cb) {
    var exec = require('child_process').exec;
    exec("rm -rf " + deployTemplatePath + projectId, function(err, stdout, stderr){
        if (typeof cb == 'function') cb(true);
    });
};

/**
 * Fill project with values
 *
 * @param project
 * @param data
 */
exports.fillObject = function(project, data){
    if (!data) return false;
    for (var fieldName in data) {
        if (undefined == project[fieldName]) continue;
        var value = data[fieldName];
        project[fieldName] = (typeof value == 'string')
                                ? str.replaceHtmlEntites(value.replace(/\+/g, " "))
                                : value;
    }

    return project;
};

/**
 * Get list of all projects
 *
 * @param callback cb
 * @return array of records
 */
exports.getProjects = function(cb){
    DB.query('SELECT p.id, p.name, p.lastdeploy_date, u.login, u.id AS user_id  ' +
            ' FROM project AS p' +
            ' LEFT JOIN user AS u ON u.id = p.lastdeploy_userid' +
            ' ORDER BY lastdeploy_date DESC',
            function(err, results, fields){
                if (!results.length) return cb(false);
                return cb(results);
            });
};

/**
 * Get project by ID
 *
 * @param id
 * @param cb
 */
exports.getProject = function(id, cb){
    DB.query('SELECT * FROM project WHERE id = ' + id,
            function(err, results, fields){
                if (err || !results.length) return cb(false);
                return cb(exports.fillObject(new Project(), results[0]));
            });
};

/**
 * Update RECIPE's where using selected cvs server
 * 
 * @param cvsId
 */
exports.updateDeployTemplates = function(cvsId){
    if (!cvsId) return;

    DB.query('SELECT * FROM project WHERE dev_version_id = ? OR prod_version_id = ?',
            [cvsId, cvsId],
            function(err, results, fields){
                if (!results.length) return;

                for (var key = 0; key < results.length; key++) {
                    var p = exports.fillObject(new Project(), results[key]);
                    exports.createDeployTemplate(p, function(isSuccess){});
                }

                return;
            }
    );
};