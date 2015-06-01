Router.route('/', function(){
  this.layout('homeLayout');
  this.render('searchResults');
  this.render('jumbotron', {to: 'topper'});
});

Router.route('/series/:tvdbId', {
  action: function(){
    this.layout('seriesLayout');
    this.render('episodeList',{
      data: function(){
        var episodes = Episodes.find({tvdbId: parseInt(this.params.tvdbId)}, {sort: {season: 1, number: 1}}).fetch();
        var seasons = _.groupBy(episodes, 'season');
        //console.log("seasons", seasons);
        var seasonEpisodes = _.map(_.keys(seasons), function(season){
          return {episodes: seasons[season], season: season};
        });
        //console.log("seasonEpisodes", seasonEpisodes);
        return {seasons: seasonEpisodes};
      }
    });
    this.render('seriesInfo',{
      to: 'topper',
      data: function(){
        var series = Series.find({tvdbId: parseInt(this.params.tvdbId)});
        return {series: series};
      }
    });
    this.render('seasonTabs',{
      to: 'tabpanel',
      data: function(){
        var data = Episodes.find({$and: [{"tvdbId": parseInt(this.params.tvdbId)}, {"season": {$gt: 0}}]}).fetch();
        var distinctData = _.uniq(data, false, function(d) {return d.season});
        var seasons = _.pluck(distinctData, "season");
        console.log("unsorted", seasons, typeof(seasons[0]));
        seasons.sort(function(a, b){
          return a - b;
        });
        console.log("sorted", seasons);
        Session.set("seasonArray", seasons);
        return {seasons: seasons};
      }
    });
  }
});
