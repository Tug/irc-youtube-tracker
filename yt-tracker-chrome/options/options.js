
// options ---------------------------------------------------------------------
$(function(){

   $('#nickname').val(localStorage['nick'] || "");
   $('#apiURL').val(localStorage['apiURL'] || "");
   
   $('#saveButton').click(function(){
      localStorage['nick'] = $('#nickname').val();
      localStorage['apiURL'] = $('#apiURL').val();
   });

});

