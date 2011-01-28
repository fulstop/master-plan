class MasterPlan < Sinatra::Base

  before do
    @plan = Plan.first_or_create_by_name("MasterPlan")
  end

  get "/" do
    @features = @plan.features.sort_by(&:position)
    erb :index
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
  attribute :importance, Integer
  attribute :target, Date
  attribute :stage, Integer, :default => 0
  attribute :released, Date

end
