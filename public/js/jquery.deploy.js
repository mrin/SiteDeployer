function DeploymentProcess(){
    var self = this;
    self.client = {};

    this.init = function(){
        $('[rel=dev_deploy_btn]').click(function(){
            if (confirm('Are u sure to start deploy on DEVELOPMENT server ?')){
                self.startDevDeploy();
                self.hideStartButtons();
            }
            return false;
        });
        $('[rel=dev_rollback_btn]').click(function(){
            if (confirm('Are u sure to ROLLBACK on DEVELOPMENT server ?')){
                self.startDevRollback();
                self.hideStartButtons();
            }
            return false;
        });
        $('[rel=prod_deploy_btn]').click(function(){
            if (confirm('Are u sure to start deploy on PRODUCTION server ?')){
                self.startProdDeploy();
                self.hideStartButtons();
            }
            return false;
        });
        $('[rel=prod_rollback_btn]').click(function(){
            if (confirm('Are u sure to ROLLBACK on PRODUCTION server ?')){
                self.startProdRollback();
                self.hideStartButtons();
            }
            return false;
        });
        $('[rel=stop_btn]').click(function(){
            self.stopDeployment();
            return false;
        });

        this.setupBayeuxHandlers();
    };

    this.setupBayeuxHandlers = function(){
        $.getJSON("/deployConfig.json", function(config){
            self.client = new Faye.Client('http://' + window.location.hostname + ':' + config.port + config.mountPoint, {
                timeout: 120
            });

            self.client.subscribe('/process', self.pushInProcessWindow);
            self.client.subscribe('/stop', self.hideStopButton);
        });
    };

    this.startDevDeploy = function(){
        $.getJSON(location.pathname + '/startDev');
    };

    this.startDevRollback = function(){
        $.getJSON(location.pathname + '/rollbackDev');
    };

    this.startProdDeploy = function(){
        $.getJSON(location.pathname + '/startProd');
    };

    this.startProdRollback = function(){
        $.getJSON(location.pathname + '/rollbackProd');
    };

    this.stopDeployment = function(){
        $.getJSON(location.pathname + '/stopDep');
    };

    this.pushInProcessWindow = function(msg){
        $('#process_area').append("-> " + msg + "<br/>");
    };

    this.hideStartButtons = function(){
        $('[rel=start_btns]').hide();
        $('[rel=stop_btns]').show();
    };

    this.hideStopButton = function(msg){
        $('[rel=stop_btns]').hide();
    }

    this.init();
};

var deploymentProcess;
jQuery(function(){
    deploymentProcess = new DeploymentProcess();
});