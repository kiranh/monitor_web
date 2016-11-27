function getTimeData() {
  $("#data-table tr").empty();
  $.getJSON("website_timing.json", function(json) {
    $.each(json, function(key,value) {
      var imageUrl = "<a href='/" + value.name + ".png'> <img src='" + value.name + ".png' width=64 height=64 /> </a>";
      var deleteUrl = "<a href='/delete?name=" + encodeURI(value.name) + "'> Remove </a>";
      var webUrl = "<a href='"  + value.url + "'>" + value.url + "</a>";
      var row = "<tr> <td>" + value.name + "</td>" +
                "<td>" + value.time_taken + "</td>" +
                "<td>" + webUrl + "</td>" +
                "<td>" + imageUrl +  "</td>" +
                "<td>" + "x" + "</td></tr>";
      $("#data-table").append(row);
    });
    setTimeout(getTimeData, 60000);
  });
}

$("button#add_website").on("click", function() {
  var website = $("#inputEmail3").val();
  var name = $("#inputPassword3").val();
  var formData = {"website": website, "name": name};
  $.post("/add", formData);
});

$(document).ready(function() {
  getTimeData();
});
