var Feature = Backbone.Model.extend({
  name: "feature"
});

var FeatureList = Backbone.Collection.extend({
  model: Feature,
  url: '/features'
});

var Features = new FeatureList;
