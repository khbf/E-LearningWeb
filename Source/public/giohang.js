$(document).ready(() =>{
  $('.btn, .add-to-cart').on('click', addToCard);
})

function addToCard (){
  var id = $(this).data("id");
  var quantity = 1;
  $.ajax({
    url: '/cart',
    type: 'POST',
    data:{id,quantity},
    success: function(result){
      $('#cart-badge').html(result.totalQuantity);
    }
  })
}