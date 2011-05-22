var user = require('../models/user.js');
var DB = require('../utils/db-connection.js');
var str = require('../utils/string.js');
var async = require('async');

var cvsTypes = [
    {id:1, name:'GIT'},
    {id:2, name:'SVN'}
    ];

var CVS = exports = module.exports = function CVS(){
    this.id = 0;
    this.type = 0;
    this.name = '';

    this.url = '';
    this.username = '';
    this.password = '';
};

/**
 * Save CVS (insert / update)
 * @param cb
 */
CVS.prototype.save = function(cb){
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
        DB.query('INSERT INTO versions SET ' + updateFields.join(','), function(err, results, fields){
                    cb(results.insertId);
                    });
    } else {
        DB.query('UPDATE versions SET ' + updateFields.join(',') +
                  'WHERE id = ' + this.id,
                  function(err, results, fields){
                    cb(results.affectedRows);
                  });
    }
};

/**
 * Remove CVS info
 */
CVS.prototype.remove = function(){
    if (0 == this.id) return false;
     DB.query('DELETE FROM versions WHERE id=' + this.id);
};

exports.getTypes = function() {
    return cvsTypes;
};

exports.getTypeName = function(type) {
    for(var i = 0; i < cvsTypes.length; i++)
        if (type == cvsTypes[i].id) return cvsTypes[i].name;
};

/**
 * Fill CVS with values
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
                                ? str.replaceHtmlEntites(value.replace(/\+/g, " "))
                                : value;
    }
    return obj;
};

/**
 * Get list of all CVS accounts
 *
 * @param callback cb
 * @return array of records
 */
exports.getCVSs = function(cb){
    DB.query('SELECT * FROM versions ORDER BY id',
            function(err, results, fields){
                if (!results.length) return cb(false);
                return cb(results);
            });
};

/**
 * Get cvs account by ID
 *
 * @param id
 * @param cb
 */
exports.getCVS = function(id, cb){
    if (!id) return cb(false);
    DB.query('SELECT * FROM versions WHERE id = ' + id,
            function(err, results, fields){
                if (!results.length) return cb(false);
                return cb(exports.fillObject(new CVS(), results[0]));
            });
};