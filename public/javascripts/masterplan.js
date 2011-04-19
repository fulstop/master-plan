var Feature = Backbone.Model.extend();


var FeatureList = Backbone.Collection.extend({

  model: Feature,

  url: '/features',

  nextPosition: function() {
    if (!this.length) return 0;
    return this.last().get('position') + 1;
  },

  updateSelection: function(feature){
    if (!feature) return;
    this.selection = feature;
    $("tr").removeClass("selected");
    $(feature.view.el).addClass("selected");
  },

  selection: null,

  comparator: function(feature) {
    return feature.get('position');
  }

});

var Features = new FeatureList;


var FeatureView = Backbone.View.extend({

  initialize: function(){
    _.bindAll(this, 'checkKey', 'featureMenu', 'deleteFeature', 'render');
    this.model.bind('change', this.render);
    this.model.view = this;
    this.render();
  },

  events: {
    "click .stage": "setStage",
    "dblclick td:not(.stage)": "edit",
    "dblclick .value": "edit",
    "click .delete": "confirmDelete",
    "blur :input": "finishEdit",
    "keyup .person :input": "upcaseInitials",
    "contextmenu": "featureMenu",
    "click .info": "editInfo"
  },

  tagName: "tr",

  render: function(){
    $(this.el).html(ich.feature(this.model.toJSON()));

    $(this.el).removeClass("active testing finished released").children(".stage").html("");
    $(this.el).children(".stage:eq("+this.model.get("stage")+")").html('<img src="/images/stage.png" alt="Current stage">');
    switch (Number(this.model.get("stage"))) {
      case 1: $(this.el).addClass("active"); break;
      case 2: $(this.el).addClass("testing"); break;
      case 3: $(this.el).addClass("testing"); break;
      case 4: $(this.el).addClass("finished"); break;
      case 5: $(this.el).addClass("finished"); break;
      case 6: $(this.el).addClass("released"); break;
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
    MasterPlan.editMode = true;
    $(window).keydown(this.checkKey);
    if ($(e.target).is(".value")) {
      $(e.target).hide().siblings(".edit").show().children(":input").focus();
    } else {
      $(e.target).children(".value").hide().siblings(".edit").show().children(":input").focus();
    }
    $(this.el).addClass("editing");
  },

  editInfo: function(e){
    new InfoView({ feature: this.model });
  },

  checkKey: function(e){
    if (e.which == 13 || e.which == 27) {
      this.finishEdit();
    }
  },

  finishEdit: function(){
    if (MasterPlan.editMode) {
      MasterPlan.editMode = false;
    } else {
      return true;
    }
    this.model.save(this.$(":input").serializeObject());
    this.$(".edit").hide().each(function(){
      $(this).siblings(".value").text($(this).children(":input").val()).show();
    });
    $(this.el).removeClass("editing");
    $(window).unbind("keydown", this.checkKey);
  },

  confirmDelete: function(){
    new ConfirmationView({ text: "Are you sure you'd like to delete this feature?", onYes: this.deleteFeature });
  },

  deleteFeature: function(){
    MasterPlan.moveSelectionDown();
    this.model.destroy();
    Features.remove(this.model);
    MasterPlan.leaveRemoveMode();
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
    $(window).keydown(this.keyPressed);
    $(window).unbind("keydown", MasterPlan.keyPressed);
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
    $(window).unbind("keydown", this.keyPressed);
    $(window).keydown(MasterPlan.keyPressed);
    $(this.el).remove();
  }

});

var InfoView = Backbone.View.extend({

  initialize: function(){
    _.bindAll(this, 'keyPressed', 'close', 'render');
    this.render();
  },

  id: "info-box",

  events: {
    "click #info-done": "done",
    "click #info-cancel": "close"
  },

  render: function(){
    $(this.el).html(ich.info({
      description: this.options["feature"].get("description"),
      notifications: this.options["feature"].get("notifications")
    }));
    $("body").append(this.el);
    $(window).keydown(this.keyPressed);
    $(window).unbind("keydown", MasterPlan.keyPressed);
    return this;
  },

  keyPressed: function(e){
    if (e.which == 27)
      this.close();
  },

  done: function(){
    this.options["feature"].save(this.$(":input").serializeObject());
    this.close();
  },

  close: function(){
    $(window).unbind("keydown", this.keyPressed);
    $(window).keydown(MasterPlan.keyPressed);
    $(this.el).remove();
  }

});



$(function(){

  var MasterPlanView = Backbone.View.extend({

    el: $("#feature-list"),

    removeMode: false,
    editMode: false,

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

      $(window).keydown(this.keyPressed);
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
          if (Features.length == 1) Features.updateSelection(Features.first());
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

    moveSelectionUp: function(){
      index = Features.models.indexOf(Features.selection);
      if (index <= 0) {
        index = Features.length - 1;
      } else {
        index -= 1;
      }
      Features.updateSelection(Features.at(index));
    },

    moveSelectionDown: function(){
      index = Features.indexOf(Features.selection);
      if (index >= Features.length - 1) {
        index = 0;
      } else {
        index += 1;
      }
      Features.updateSelection(Features.at(index));
    },

    keyPressed: function(e){
      if (!this.editMode) {
        if (e.which == 75 || e.which == 188) { this.moveSelectionUp(); }                                 // k or ,
        if (e.which == 74 || e.which == 190) { this.moveSelectionDown(); }                               // j or .
      }
      if (this.removeMode) {
        if (e.which == 27) { this.leaveRemoveMode(); }                                                   // esc
        if (e.which == 88 || e.which == 13) { Features.selection.view.confirmDelete(); }                 // x or enter
      } else if (!this.editMode) {
        if (e.which == 88) { this.enterRemoveMode(); }                                                   // x
        if (e.which == 13) { $(Features.selection.view.el).find(".value").first().trigger("dblclick"); } // enter
        if (e.which == 78) { this.newFeature(); }                                                        // n
      }
    }

  });

  window.MasterPlan = new MasterPlanView;

});
