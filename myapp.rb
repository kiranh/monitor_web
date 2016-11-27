require 'sinatra/base'
require 'thread'
require 'json'
require 'childprocess'

$shared_queue = Queue.new

Message = Struct.new(:mtype, :murl, :mname)
Thread.abort_on_exception = true

class PhantomJs
  attr_accessor :process, :json_file
  def initialize
    @process = nil
    @json_file = File.expand_path(File.join(File.dirname(__FILE__), "public/website.json"))
  end

  def start_phantom_js
    puts "********** Starting this sthi"
    @process = ChildProcess.build("phantomjs", "--ignore-ssl-errors=true", "load_websites.js")
    @process.io.inherit!
    @process.cwd = File.expand_path(File.join(File.dirname(__FILE__), "public"))
    @process.start
  end

  def start_phantom_thread
    Thread.new do
      start_phantom_js()
      sleep(2)
      loop do
        puts "Looping here"
        sleep(2)
        process_flag = check_for_running_process()
        break unless process_flag
      end
    end
  end

  def check_for_running_process
    if process.alive?
      puts "********** Phantomjs is still running"
      process_incoming_message()
    else
      puts "++++++++++ Phantomjs process has died"
      restart_phantom_js()
    end
  end

  def restart_phantom_js
    process.stop
    sleep(5)
    start_phantom_js
    puts "++++++++++ restarted phantomjs"
    true
  rescue
    puts "==================== Error starting phantomjs =========="
    puts $!.message
    puts $!.backtrace
    false
  end

  def process_incoming_message
    if !$shared_queue.empty?
      message = $shared_queue.pop(true)
      case message.mtype
      when "reload"
        return restart_phantom_js()
      when "stop"
        process.stop
        return false
      when "add"
        puts "********** Received a message here to add"
        process.stop
        add_json_data(message)
        sleep(5)
        start_phantom_js
      when 'remove'
        puts "********** Received a message to remove"
        process.stop
        remove_json_data(message)
        sleep(5)
        start_phantom_js
      end
    end
    true
  end

  def remove_json_data(message)
    old_content = File.read(json_file)
    old_json_content = JSON.load(old_content)
    old_json_content.delete_if { |website| website["name"] == message.mname }
    File.open(json_file, "w") do |fl|
      fl.write(JSON.pretty_generate(old_json_content))
    end
  end

  def add_json_data(message)
    old_content = File.read(json_file)
    old_json_content = JSON.load(old_content)
    puts old_json_content
    old_json_content.push({"url" => message.murl, "name" =>  message.mname})
    File.open(json_file, "w") do |fl|
      fl.write(JSON.pretty_generate(old_json_content))
    end
  end
end


class MyApp < Sinatra::Base
  # start the server if ruby file executed directly
  set :public_folder, File.dirname(__FILE__) + '/public'
  set :static_cache_control, [:no_cache]

  get '/' do
    redirect "/index.html"
  end

  post "/add" do
    website = params['website']
    website_name = params['name']
    puts "Calling add website with #{website} and #{website_name}"
    if (website && !website.empty?) && (website_name && !website_name.empty?)
      puts "Add th message to the queeu"
      $shared_queue.push(Message.new("add", website, website_name))
    end
    "done"
  end

  get "/delete" do
    website_name = params['name']
    if website_name && !website_name.empty?
      puts "Removing website #{website_name}"
      $shared_queue.push(Message.new("remove", "", website_name))
    end
    redirect "/index.html"
  end

  get "/refresh" do
    $shared_queue.push(Message.new("reload", "", ""))
    redirect "/index.html"
  end
end

phantomjs = PhantomJs.new
phantomjs.start_phantom_thread()
