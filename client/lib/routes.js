Router.route('/', function(){
  this.layout('homeLayout');
  this.render('searchResults');
  this.render('jumbotron', {to: 'topper'});
});
