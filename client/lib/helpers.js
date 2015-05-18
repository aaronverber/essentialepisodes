Template.body.events({
  "submit form": function(event){
    var searchedSeries = document.getElementById('searchInput').value;
    console.log("Searching", searchedSeries);
    Meteor.call("searchForSeries", searchedSeries, function(err, response){
      Session.set("seriesSearchResults", response);
    });
    return false;
  }
});

Template.body.helpers({
  seriesSearchResults: function(){
    return Session.get("seriesSearchResults");
  }
});
