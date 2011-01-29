var FeatureView = Backbone.View.extend({

  tagName: "tr",

  render: function() {
    var template = '<td class="name"><span class="feature"><span class="feature-status"></span><span class="feature-name">{{name}}</span></span></td><td class="person">{{person}}</td><td class="importance">{{importance}}</td><td class="target">{{target}}</td><td class="stage stage-0"><img src="/images/stage.png" alt="Current stage"></td><td class="stage stage-1"><img src="/images/stage.png" alt="Current stage"></td><td class="stage stage-2"><img src="/images/stage.png" alt="Current stage"></td><td class="stage stage-3"><img src="/images/stage.png" alt="Current stage"></td><td class="stage stage-4"><img src="/images/stage.png" alt="Current stage"></td><td class="stage stage-5"><img src="/images/stage.png" alt="Current stage"></td><td class="stage stage-6"><img src="/images/stage.png" alt="Current stage"></td>'
    $(this.el).html($.mustache(template, this.model.toJSON()));
    return this;
  }

});
