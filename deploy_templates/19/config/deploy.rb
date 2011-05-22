# app name and svn folder name too
set :application, "Demo & & & project"

# Environments
task :development do
  role :app, '216.131.96.195' # host
  set :user, 'capifyc' # ssh user
  set :password, 'K1PTfPIdl&v5' # ssh password
  set :port_number, '22'
  
  set :account_dir, "/home/capifyc"
  set :home_dir, "/home/capifyc/public_html"
  
  set :deploy_to, "#{account_dir}/deploy"
  set :deploy_via, :remote_cache

  # SVN rep info
  set :dev_version_path, "encards/"
  set :scm, :subversion # subversion
  set :scm_user, 'fisheye' # svn user
  set :scm_password, 'fisheyeadmin' # svn password
  set :scm_url, "svn://81.25.45.63:3692/#{dev_version_path}" # path to rep
  set :repository, Proc.new { "--username #{scm_user} --password #{scm_password} #{scm_url}"}
end

task :production do
  role :app, '216.131.94.71' # host
  set :user, 'ccccrea' # ssh user
  set :password, 'LHiVof9engPn' # ssh password
  set :port_number, '22'
  
  set :account_dir, "/home/ccccrea"
  set :home_dir, "/home/ccccrea/public_html"
  
  set :deploy_to, "#{account_dir}/deploy"
  set :deploy_via, :copy
  set :copy_strategy, :export

  # SVN rep info
  set :prod_version_path, "encards/"
  set :scm, :subversion # subversion
  set :scm_user, 'fisheye' # svn user
  set :scm_password, 'fisheyeadmin' # svn password
  set :scm_url, "svn://81.25.45.63:3692/#{prod_version_path}" # path to rep
  set :repository, Proc.new { "--username #{scm_user} --password #{scm_password} #{scm_url}"}
end

set :use_sudo, false

# deployment types
#set :deploy_via, :copy - upload svn checkout via SFTP
#set :deploy_via, :remote_cache - require subversion client on server side
#set :deploy_via, :rsync_with_remote_cache - promt password
#set :rsync_options, '-az --delete --exclude=.svn --delete-excluded'

namespace :deploy do
  task :default do
    update
  end
  
  task :finalize_update, :except => { :no_release => true } do
    run "chmod -R g+w #{latest_release}" if fetch(:group_writable, true)
    if fetch(:normalize_asset_timestamps, true)
      stamp = Time.now.utc.strftime("%Y%m%d%H%M.%S")
      asset_paths = %w(css img images js).map { |p| "#{latest_release}/#{p}" }.join(" ")
      run "find #{asset_paths} -exec touch -t #{stamp} {} ';'; true", :env => { "TZ" => "UTC" }
    end
  end

  namespace :rollback do
      task :default do
        revision
        cleanup
      end
  end

end

# after deploy
after 'deploy:symlink', :roles => :app do
run "find #{release_path} -depth -wholename '*/.svn*' -delete"
run "if [ -h #{home_dir} ]; then echo symlink;elif [ -d #{home_dir} ]; then  mv #{home_dir} #{home_dir}_backup;else echo dirnotfound;fi"
run "ln -nfs #{account_dir}/deploy/current #{home_dir}"
end