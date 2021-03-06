var user = require('../models/user.js');
var DB = require('../utils/db-connection.js');

var statuses = [
    {id:0, name:'In progress'},
    {id:1, name:'Complete'},
    {id:2, name:'Error'}
    ];

var History = exports = module.exports = function History(){
    this.id = 0;
    this.project_id = 0;
    this.user_id = 0;
    this.status = 0;

    this.date = null;
    this.revision = '';
    this.logs = '';
};

/**
 * Save History (insert / update)
 * @param cb
 */
History.prototype.save = function(cb){
    var self = this;
    if (0 == this.id) {
        DB.query('INSERT INTO project_history SET project_id = ?, user_id= ?, status = ?, date = ?, revision = ?, logs= ?',
                [this.project_id, this.user_id, this.status, this.date, this.revision, this.logs],
                function(err, results, fields){
                    cb(results.insertId);
                    self.id = results.insertId;
                }
        );
    } else {
        DB.query('UPDATE project_history SET project_id = ?, user_id= ?, status = ?, date = ?, revision = ?, logs= ? WHERE id = ?',
                     [this.project_id, this.user_id, this.status, this.date, this.revision, this.logs, this.id],
                  function(err, results, fields){
                  if (err) {
                      console.log('History is not updated', err);
                      return cb(false);
                  }
                  else
                     cb(results.affectedRows);
        });
    }
};

exports.getStatusName = function(type) {
    for(var i = 0; i < statuses.length; i++)
        if (type == statuses[i].id) return statuses[i].name;
};

/**
 * Fill History with values
 *
 * @param object
 * @param data
 */
exports.fillObject = function(obj, data){
    if (!data) return false;
    for (var fieldName in data) {
        if (undefined == obj[fieldName]) continue;
        var value = data[fieldName];
        obj[fieldName] = (typeof value == 'string')
                                ? unescape(value.replace(/\+/g, " "))
                                : value;
    }
    return obj;
};

/**
 * Get list of history by Project ID
 * 
 * @param projectId
 * @param cb
 */
exports.getHistoryByProject = function(projectId, cb){
    DB.query('SELECT ph.*, u.login' +
            ' FROM project_history AS ph' +
            ' LEFT JOIN user AS u ON u.id = ph.user_id ' +
            ' WHERE ph.project_id = ' + projectId +
            ' ORDER BY ph.id DESC',
            function(err, results, fields){
                if (!results.length) return cb(false);
                return cb(results);
            });
};

/**
 * Get detailed history
 *
 * @param historyId
 * @param cb
 */
exports.getHistoryDetailed = function(historyId, cb){
    DB.query('SELECT ph.*, u.login' +
            ' FROM project_history AS ph' +
            ' LEFT JOIN user AS u ON u.id = ph.user_id ' +
            ' WHERE ph.id = ' + historyId,
            function(err, results, fields){
                if (!results.length) return cb(false);
                return cb(results[0]);
            });
};