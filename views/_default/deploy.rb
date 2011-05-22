# app name and svn folder name too
set :application, "<%-project.name%>"

# Environments
task :development do
  role :app, '<%=project.dev_hostip%>' # host
  set :user, '<%-project.dev_ssh_username%>' # ssh user
  set :password, '<%-project.dev_ssh_password%>' # ssh password
  set :port_number, '<%=project.dev_ssh_port%>'
  
  set :account_dir, "<%=project.dev_home_dir%>"
  set :home_dir, "<%=project.dev_www_dir%>"
  
  set :deploy_to, "#{account_dir}/deploy"
  set :deploy_via, :remote_cache

  # SVN rep info
  set :dev_version_path, "<%=project.dev_version_path%>"
  set :scm, :subversion # subversion
  set :scm_user, '<%-cvsDev.username%>' # svn user
  set :scm_password, '<%-cvsDev.password%>' # svn password
  set :scm_url, "<%=cvsDev.url%>/#{dev_version_path}" # path to rep
  set :repository, Proc.new { "--username #{scm_user} --password #{scm_password} #{scm_url}"}
end

task :production do
  role :app, '<%=project.prod_hostip%>' # host
  set :user, '<%-project.prod_ssh_username%>' # ssh user
  set :password, '<%-project.prod_ssh_password%>' # ssh password
  set :port_number, '<%=project.prod_ssh_port%>'
  
  set :account_dir, "<%=project.prod_home_dir%>"
  set :home_dir, "<%=project.prod_www_dir%>"
  
  set :deploy_to, "#{account_dir}/deploy"
  set :deploy_via, :copy
  set :copy_strategy, :export

  # SVN rep info
  set :prod_version_path, "<%=project.prod_version_path%>"
  set :scm, :subversion # subversion
  set :scm_user, '<%-cvsProd.username%>' # svn user
  set :scm_password, '<%-cvsProd.password%>' # svn password
  set :scm_url, "<%=cvsProd.url%>/#{prod_version_path}" # path to rep
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