$(function(){

  $("#feature-list").sortable({
    items: "tbody tr",
    containment: "parent",
    tolerance: "pointer",
    opacity: 0.5,
    helper: function(e, ui){
      ui.children().each(function(){
        $(this).width($(this).width());
      });
      return ui;
    }
  });

  // Initialize models
  $("tbody tr").each(function(){
    Features.add(new Feature({ id: $(this).attr('data-id') }));
  });

  // Switching stages
  $("tbody tr .stage").click(function(){
    $(this).siblings(".stage").html("")
    $(this).html('<img src="/images/stage.png" alt="Current stage">')
  });

});
