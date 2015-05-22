Router.route('/', function(){
  this.layout('homeLayout');
  this.render('searchResults');
  this.render('jumbotron', {to: 'topper'});
});

Router.route('/series/:tvdbId', function(){
  this.layout('seriesLayout');
  this.render('episodeList',{
    data: function(){
      var episodes = Episodes.find({tvdbId: parseInt(this.params.tvdbId)}, {sort: {season: 1, number: 1}});
      console.log("episodes", episodes, this.params.tvdbId);
      return {episodes: episodes};
    }
  });
  this.render('seriesInfo',{
    to: 'topper',
    data: function(){
      var series = Series.find({tvdbId: parseInt(this.params.tvdbId)});
      console.log("series", series);
      return {series: series};
    }
  });
});
