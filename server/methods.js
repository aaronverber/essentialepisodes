var fs = Meteor.npmRequire('fs');
var http=Npm.require("http");
var path = Npm.require('path');

function writeImage(fileName, buffer){
  fs.writeFileSync('/home/aaron/dev/essentialepisodes/public/img/banner/' + fileName, buffer, 'binary');
}

function getImageData(name, url){
  console.log("URL", url)
  url = "http://thetvdb.com/banners/" + url;
  http.get(url, function(resp) {
    var buf = new Buffer("", "binary");
    resp.on('data', function(chunk) {
        buf = Buffer.concat([buf, chunk]);
    });
    resp.on('end', function() {
      writeImage(name, buf);
    });
  });
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
    //console.log("SEARCH FOR SERIES", token);
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
      //console.log(seriesSearchResultsParsed);
      _.each(seriesSearchResultsParsed, function(result){
        var fileExtension = path.extname(result.poster);
        if(Series.find({"tvdbId": {"$eq": result.id}}).count()>0){
          //console.log("record exists");
          return;
        } else {
          Series.insert({
            "name": result.seriesName,
            "description": result.overview,
            "tvdbId": result.id,
            "network": result.network,
            "status": result.status,
            "createdAt": new Date(),
            "poster": "/img/banner/" + result.id + fileExtension
          });
          //console.log("record added");
          var poster = result.poster;
          getImageData(result.id + fileExtension, poster);
        }
      });
      var searchedSeriesIds = _.pluck(seriesSearchResultsParsed, "id");
      //console.log(searchedSeriesIds);
      var searchedSeriesDB = Series.find({tvdbId:{$in: searchedSeriesIds}}).fetch();
      //console.log(searchedSeriesDB);
      return searchedSeriesDB;
    } catch(e){
      //console.log("ERROR", e);
      return false;
    };
  }
});