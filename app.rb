class MasterPlan < Sinatra::Base

  before do
    @plan = Plan.first_or_create_by_name("MasterPlan")
  end

  get "/" do
    @features = @plan.features.sort_by(&:position)
    erb :index
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
    @feature.save
  end

  delete "/features/:id" do
    @feature = @plan.features.destroy(params[:id])
  end

end


class Plan

  include Toy::Store
  store :redis, Redis.new

  attribute :name, String
  index :name

  list :features

end

class Feature

  include Toy::Store
  store :redis, Redis.new

  attribute :name, String
  validates_presence_of :name

  attribute :position, Integer, :default => 0
  attribute :person, String
  attribute :importance, Integer, :default => 3
  attribute :target, String
  attribute :stage, Integer, :default => 0
  attribute :released, Date

end

Feature.include_root_in_json = false
