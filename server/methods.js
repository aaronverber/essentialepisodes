function getSeriesPoster(seriesPoster){
  console.log("Series Poster", seriesPoster.poster);
}


Meteor.methods({

  authTVDB: function(){
    this.unblock();
    try{
      var result = HTTP.call("POST", "https://api-dev.thetvdb.com/login", {
        data: {
          "apikey": "E6247B9FBD3BC9A5",
          "username": "averber",
          "userpass": "Kirk102810Picard"
        },
        headers: {
          "Content-Type" : "application/json"
        }
      });
      console.log(result.data);
      Authentication.insert({token: result.data.token, createdAt: new Date()});
      return true;
    } catch(e){
      console.log("ERROR", e);
      return false;
    }
  },

  getAuthToken: function(){
    var AuthToken = Authentication.findOne({}, {sort: {$natural: -1}});
    console.log(AuthToken);
    return AuthToken.token;
  },

  searchForSeries: function(searchedSeries){
    var token = Meteor.call("getAuthToken");
    console.log("SEARCH FOR SERIES", token);
    try{
      var seriesSearchResults = HTTP.call("GET", "https://api-dev.thetvdb.com/search/series",{
        params:{
          "name": searchedSeries
        },
        headers:{
          "authorization" : "Bearer " + token,
          "accept" : "application/vnd.thetvdb.v1.2.0",
          "accept-language" : "en-US,en;q=0.8"
        }
      });
      var seriesSearchResultsParsed = JSON.parse(seriesSearchResults.content).data;
      console.log(seriesSearchResultsParsed);
      _.each(seriesSearchResultsParsed, function(result){
        getSeriesPoster(result);
      });
      return seriesSearchResultsParsed;
    } catch(e){
      console.log("ERROR", e);
      return false;
    };
  }
});
