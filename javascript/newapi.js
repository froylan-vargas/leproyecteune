/*var searchTerm = 'bitcoin';
var apiKey = '590ee702b8964b46a1b9a8e181518171'
var url = 'https://newsapi.org/v2/everything?';
var limit = 5;

var currentDate = moment(new Date()).format('L');


var query = `${url}q=${searchTerm}&from=${currentDate}&to=${currentDate}&sortBy=popularity&pageSize=${limit}&apiKey=${apiKey}`;
console.log(query);*/

var url = 'http://localhost:4000/tweets?searchTerm=bitcoin';
  
  $.ajax({
    url: url,
    method: 'GET',
    }).then(function(response){
      console.log(response.statuses);
    });