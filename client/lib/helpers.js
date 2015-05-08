Template.body.events({
  "click .btn.search-series": function(event){
    var searchedSeries = document.getElementById('searchInput').value;
    console.log("Searching", searchedSeries);
    Meteor.call("searchForSeries", searchedSeries, function(err, response){
      Session.set("seriesSearchResults", response);
    });
  }
});

Template.body.helpers({
  seriesSearchResults: function(){
    var results = Session.get("seriesSearchResults");
    var data = JSON.parse(results.content).data;
    console.log("SERIES SEARCH RESULTS",data);
    return data;
  }
});
