Router.route('/', function(){
  this.layout('homeLayout');
  this.render('searchResults');
  this.render('jumbotron', {to: 'topper'});
});

Router.route('/series/:tvdbId', function(){
  this.layout('seriesLayout');
  this.render('episodeList',{
    data: function(){
      return Series.find({tvdbId: this.params.tvdbId});
    }
  });
  this.render('seriesInfo', {to: 'topper'});
})
