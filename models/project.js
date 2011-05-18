var user = require('../models/user.js');
var DB = require('../utils/db-connection.js');

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
    this.dev_home_dir = '';
    this.dev_www_dir = '';
    this.dev_version_id = '';
    this.dev_version_path = '';

    this.prod_hostname = '';
    this.prod_hostip = '';
    this.prod_ssh_username = '';
    this.prod_ssh_password = '';
    this.prod_home_dir = '';
    this.prod_www_dir = '';
    this.prod_version_id = '';
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

    if (0 == this.id) {
        DB.query('INSERT INTO project SET ' + updateFields.join(','), function(err, results, fields){
                    console.log(err,results,fields);
                    cb(results.insertId);
                    });
    } else {
        DB.query('UPDATE project SET ' + updateFields.join(',') +
                  'WHERE id = ' + this.id,
                  function(err, results, fields){
                     cb(results.affectedRows);
                  });
    }
};

/**
 * Remove project
 */
Project.prototype.remove = function() {
    if (0 == this.id) return false;
    DB.query('DELETE FROM project WHERE id=' + this.id);
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
                                ? unescape(value.replace(/\+/g, " "))
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
                if (!results.length) return cb(false);
                return cb(exports.fillObject(new Project(), results[0]));
            });
};