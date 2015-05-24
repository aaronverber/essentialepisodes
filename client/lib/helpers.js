Template.jumbotron.events({
  "submit form": function(event){
    var searchedSeries = event.target.text.value;
    console.log("Searching", searchedSeries);
    Meteor.call("searchForSeries", searchedSeries, function(err, response){
      Session.set("seriesSearchResults", response);
      console.log(response);
    });
    return false;
  }
});

Template.searchResults.helpers({
  seriesSearchResults: function(){
    var stuff = Session.get("seriesSearchResults");
    console.log("stuff", stuff);
    return Series.find({tvdbId:{$in: stuff}});
  }
});

Template.searchResults.events({
  "click .series-list-item" : function(event){
    var series = $(event.currentTarget).data("id");
    if(Episodes.find({tvdbId: series}).count()>0){
      console.log("got em already");
    } else{
      Meteor.call("getEpisodeCount", series);
    }
    console.log(series, event.currentTarget);
    Session.set("selectedSeries", series);
    Router.go('/series/' + series);
  }
});

Template.backgroundImage.helpers({
  setBackground: function(){
    Session.get("selectedSeries");
    var relatedSeries = Series.find({tvdbId: seriesNum});
    console.log("backImg", relatedSeries);
    return relatedSeries;
  }
});