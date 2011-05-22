var hst = require('../models/history.js');
var spawn = require('child_process').spawn;

var instances = [];

function DeployProcess(projectId, actionType, serverType, onDataCallback, onStopCallback){
    var self = this;

    self.process = null;
    self.data = [];
    self.status = 0;

    this.start = function(){
        onDataCallback(actionType + ' [' + serverType + '] started');

        var deployAction = actionType == 'deploy' ? 'deploy' : 'deploy:rollback';

        self.process = spawn('cap', [serverType, deployAction],
            { cwd: __dirname + '/../deploy_templates/' + projectId }
        );

        self.process.stdout.on('data', onDataCallback);
        self.process.stderr.on('data', onDataCallback);

        self.process.on("exit", function(){
            self.status = 1;
            onDataCallback('Disconnected from ' + serverType + ' server');
            onStopCallback();
        });
    }

	this.stop = function(){
	    if (self.process) {
            self.process.kill();
            self.status = 2;
            onStopCallback();
        }
	}
};

exports.start = function(project, serverType, actionType, user, bayeux){
    if (instances[project.id]) return;

    // log to history
    var d = new Date;

    var history = new hst();
    history.project_id = project.id;
    history.user_id = user.id;
    history.status = 0;
    history.date = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
    history.save(function(data){});

    // update last deploy in project
    project.lastdeploy_userid = user.id;
    project.lastdeploy_date = history.date;
    project.status = 0;
    project.save(function(data){ // because we need to wait re-configure recipe
  
    // initialize deployment
    instances[project.id] = new DeployProcess(project.id, actionType, serverType,
        // on data
        function(data){
            data = '' + data;
            bayeux.getClient().publish('/process', data);

            if (!instances[project.id]) return
                instances[project.id].data.push(data);
        },
        // on stop
        function(){
            if (!instances[project.id]) return;
            
            var logsArr = instances[project.id].data;
            var logsStr = '';
            for (var key = 0; key < logsArr.length; key++){
                logsStr += logsArr[key] + '<br/>';
            }

            history.logs = logsStr;
            history.status = instances[project.id].status
            history.save(function(data){});

            project.status = 1;
            project.save(function(data){});

            instances[project.id] = null;
            bayeux.getClient().publish('/stop', 'stop');
        }
    );

    // execute deployment
    instances[project.id].start();

    });
};


exports.stop = function(project){
    if (!instances[project.id]) return;
    instances[project.id].stop();
};