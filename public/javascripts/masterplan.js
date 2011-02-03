var Feature = Backbone.Model.extend();


var FeatureList = Backbone.Collection.extend({

  model: Feature,

  url: '/features',

  nextPosition: function() {
    if (!this.length) return 0;
    return this.last().get('position') + 1;
  },

  comparator: function(feature) {
    return feature.get('position');
  }

});

var Features = new FeatureList;


var FeatureView = Backbone.View.extend({

  initialize: function(){
    _.bindAll(this, 'featureMenu', 'deleteFeature', 'render');
    this.model.bind('change', this.render);
    this.model.view = this;
    this.render();
  },

  events: {
    "click .stage": "setStage",
    "dblclick td:not(.stage)": "edit",
    "dblclick .value": "edit",
    "click .delete": "confirmDelete",
    "keyup :input": "checkKey",
    "blur :input": "finishEdit",
    "keyup .person :input": "upcaseInitials",
    "contextmenu": "featureMenu"
  },

  tagName: "tr",

  render: function(){
    $(this.el).html(ich.feature(this.model.toJSON()));

    $(this.el).removeClass("active").removeClass("released").children(".stage").html("");
    $(this.el).children(".stage:eq("+this.model.get("stage")+")").html('<img src="/images/stage.png" alt="Current stage">');
    if (Number(this.model.get("stage")) == 6) {
      $(this.el).addClass("released");
    } else if (Number(this.model.get("stage")) > 0) {
      $(this.el).addClass("active");
    }

    $(this.el).find(".importance select").val($(this.el).find(".importance .value").text());

    return this;
  },

  setStage: function(e){
    this.model.save({ stage: Number($(e.target).attr("data-stage")) });
  },

  upcaseInitials: function(e){
    $(e.target).val($(e.target).val().toUpperCase());
  },

  edit: function(e){
    if ($(this.el).is(".deleting")) return;
    this.editMode = true;
    if ($(e.target).is(".value")) {
      $(e.target).hide().siblings(".edit").show().children(":input").focus();
    } else {
      $(e.target).children(".value").hide().siblings(".edit").show().children(":input").focus();
    }
    $(this.el).addClass("editing");
  },

  checkKey: function(e){
    if (e.which == 13 || e.which == 27)
      this.finishEdit();
  },

  finishEdit: function(e){
    if (this.editMode == false) {
      return true;
    } else {
      this.editMode = false;
    }
    this.model.save(this.$(":input").serializeObject());
    this.$(".edit").hide().each(function(){
      $(this).siblings(".value").text($(this).children(":input").val()).show();
    });
    $(this.el).removeClass("editing");
  },

  confirmDelete: function(){
    new ConfirmationView({ text: "Are you sure you'd like to delete this feature?", onYes: this.deleteFeature });
  },

  deleteFeature: function(){
    this.model.destroy();
    Features.remove(this.model);
  },

  featureMenu: function(e){
    if (e.metaKey) {
      if (MasterPlan.removeMode) {
        MasterPlan.leaveRemoveMode();
      } else {
        MasterPlan.enterRemoveMode();
      }
      return false;
    }
  }

});

var ConfirmationView = Backbone.View.extend({

  initialize: function(){
    _.bindAll(this, 'keyPressed', 'close', 'render');
    this.render();
  },

  id: "confirm-box",

  events: {
    "click #confirm-yes": "yes",
    "click #confirm-no": "no"
  },

  render: function(){
    $(this.el).html(ich.confirmation({ text: this.options["text"] }));
    $("body").append(this.el);
    $(window).keyup(this.keyPressed);
    $(window).unbind("keyup", MasterPlan.keyPressed);
    return this;
  },

  keyPressed: function(e){
    if (e.which == 13)
      this.yes();
    if (e.which == 27)
      this.no();
  },

  yes: function(){
    this.options["onYes"]();
    this.close();
  },

  no: function(){
    this.close();
  },

  close: function(){
    $(window).unbind("keyup", this.keyPressed);
    $(window).keyup(MasterPlan.keyPressed);
    $(this.el).remove();
  }

});


$(function(){

  var MasterPlanView = Backbone.View.extend({

    el: $("#feature-list"),

    removeMode: false,

    initialize: function(){
      _.bindAll(this, "addOne", "addAll", "removeOne", "render", "keyPressed");

      Features.bind("add", this.addOne);
      Features.bind("remove", this.removeOne);
      Features.bind("change:stage", this.render);

      this.render();

      $(this.el).sortable({
        items: "tbody tr",
        containment: "parent",
        tolerance: "pointer",
        opacity: 0.5,
        handle: ".handle",
        helper: function(e, ui){
          ui.children().each(function(){
            $(this).width($(this).width());
          });
          return ui;
        },
        stop: function(){
          $.ajax({
            url: "/features",
            type: "PUT",
            contentType: "application/json",
            processData: false,
            data: JSON.stringify($(this).sortable("toArray"))
          });
        }
      });

      $(window).keyup(this.keyPressed);
    },

    events: {
      "click #add": "newFeature",
      "click #remove": "enterRemoveMode",
      "click #done": "leaveRemoveMode"
    },

    render: function(){
      this.$("tfoot").html(ich.stats({
        feature_count: Features.models.length,
        stage_0_count: Features.filter(function(feature){ return feature.get("stage") == 0 }).length,
        stage_1_count: Features.filter(function(feature){ return feature.get("stage") == 1 }).length,
        stage_2_count: Features.filter(function(feature){ return feature.get("stage") == 2 }).length,
        stage_3_count: Features.filter(function(feature){ return feature.get("stage") == 3 }).length,
        stage_4_count: Features.filter(function(feature){ return feature.get("stage") == 4 }).length,
        stage_5_count: Features.filter(function(feature){ return feature.get("stage") == 5 }).length,
        stage_6_count: Features.filter(function(feature){ return feature.get("stage") == 6 }).length
      }));
      if (this.removeMode) {
        this.enterRemoveMode();
      } else {
        this.leaveRemoveMode();
      }
    },

    addOne: function(feature){
      var view = new FeatureView({ model: feature, id: feature.get("id") });
      this.$("tbody").append(view.el);
      this.render();
    },

    addAll: function(){
      Features.each(this.addOne);
    },

    removeOne: function(feature) {
      $(feature.view.el).remove();
      this.render();
    },

    newFeature: function(){
      Features.create({ name: "New feature", position: Features.nextPosition() }, {
        success: function(model){
          $(model.view.el).find(".feature .value").trigger("dblclick");
        }
      });
    },

    enterRemoveMode: function(){
      this.removeMode = true;
      this.$("tbody tr").removeClass("editing").addClass("deleting");
      this.$("tfoot .name .icon").hide();
      this.$("tfoot .name a#done").show();
    },

    leaveRemoveMode: function(){
      this.removeMode = false;
      this.$("tbody tr").removeClass("deleting");
      this.$("tfoot .name .icon").show();
      this.$("tfoot .name a#done").hide();
    },

    keyPressed: function(e){
      if (this.removeMode) {
        if (e.which == 69 || e.which == 27) this.leaveRemoveMode();
      } else {
        if (e.which == 69) this.enterRemoveMode();
      }
    }

  });

  window.MasterPlan = new MasterPlanView;

});
