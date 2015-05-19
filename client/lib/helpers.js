Template.jumbotron.events({
  "submit form": function(event){
    var searchedSeries = document.getElementById('searchInput').value;
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
