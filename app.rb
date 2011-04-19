class MasterPlan < Sinatra::Base
  before do
    @plan = Plan.first_or_create_by_name("MasterPlan")
  end

  get "/" do
    @features = @plan.features.select{|feature|
                  feature.released_at.nil? || feature.released_at > 1.day.ago
                }.sort_by(&:position)
    erb :index
  end

  get "/m" do
    @features = @plan.features.select{|feature|
                  feature.released_at.nil? || feature.released_at > 1.day.ago
                }.sort_by(&:position)
    erb :mobile
  end

  get "/features" do
    @features = @plan.features.select{|feature|
                  feature.released_at.nil? || feature.released_at > 1.day.ago
                }.sort_by(&:position)
    @features.to_json
  end

  post "/features" do
    @feature = @plan.features.create(JSON.parse(request.body.read))
    @feature.to_json
  end

  put "/features" do
    ids = JSON.parse(request.body.read)
    ids.each_with_index do |id, i|
      feature = @plan.features.get(id)
      feature.position = i
      feature.save
    end
  end

  get "/features/:id" do
    @feature = @plan.features.get(params[:id])
    @feature.to_json
  end

  put "/features/:id" do
    @feature = @plan.features.get(params[:id])
    @feature.attributes = JSON.parse(request.body.read)
    if @feature.stage.to_i == 6
      @feature.released_at = Time.now
    else
      @feature.released_at = nil
    end
    @feature.save
  end

  delete "/features/:id" do
    @feature = @plan.features.destroy(params[:id])
  end
end


class MasterPlan
  module Config
    mattr_accessor :settings

    def self.load!
      begin
        config = YAML.load_file("#{File.dirname(__FILE__)}/config/app.yml")[ENV['RACK_ENV'] || "development"]
      rescue Errno::ENOENT
        config = {}
      ensure
        self.settings = config.with_indifferent_access
      end
    end

    def self.[](key)
      settings[key.to_s]
    end
  end

  module Redis
    def self.connection
      @connection ||= ::Redis.connect(:url => MasterPlan::Config[:redis_url])
    end
  end
end

MasterPlan::Config.load!


class Plan
  include Toy::Store
  store :redis, MasterPlan::Redis.connection

  attribute :name, String
  index :name

  list :features
end

class Feature
  include Toy::Store
  store :redis, MasterPlan::Redis.connection

  attribute :name, String
  validates_presence_of :name

  attribute :position, Integer, :default => 0
  attribute :person, String
  attribute :importance, Integer, :default => 3
  attribute :target, String
  attribute :stage, Integer, :default => 0

  attribute :released_at, Time

  attribute :description, String
  attribute :notifications, String
end
Feature.include_root_in_json = false
