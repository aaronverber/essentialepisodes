var fs = Meteor.npmRequire('fs');
var http=Npm.require("http");
var path = Npm.require('path');
var rootPath = path.resolve('.').split('.meteor')[0];

function writeImage(type, fileName, buffer){ // Write the image to a file.
  var projectFolder = rootPath;
  var imageFolder = "public/img";
  var imagePath = path.join(projectFolder, imageFolder, type, fileName);
  console.log(imagePath);
  fs.writeFileSync(imagePath, buffer, 'binary');
}

function getImageData(type, name, url){ // Get the image data from theTVDB.
  url = "http://thetvdb.com/banners/" + url;
  http.get(url, function(resp) {
    var buf = new Buffer("", "binary");
    resp.on('data', function(chunk) {
        buf = Buffer.concat([buf, chunk]);
    });
    resp.on('end', function() {
      writeImage(type, name, buf);
    });
  });
}


Meteor.methods({

  authTVDB: function(){ // Get the API authentication key from theTVDB and store it.
    this.unblock();
    try{
      var result = HTTP.call("POST", "https://api-beta.thetvdb.com/login", {
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

  getAuthToken: function(){ // Get the latest local copy of the authentication key.
    var AuthToken = Authentication.findOne({}, {sort: {$natural: -1}});
    console.log(AuthToken);
    return AuthToken.token;
  },

  searchForSeries: function(searchedSeries){ // Get an array of series IDs, download records if needed.
    var token = Meteor.call("getAuthToken");
    console.log("SEARCH FOR SERIES", token);
    try{
      var seriesSearchResults = HTTP.call("GET", "https://api-beta.thetvdb.com/search/series",{
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
      _.each(seriesSearchResultsParsed, function(result){
        var fileExtension = path.extname(result.poster);
        if(Series.find({"tvdbId": {"$eq": result.id}}).count()>0){
          return;
        } else {
          Series.insert({
            "name": result.seriesName,
            "description": result.overview,
            "tvdbId": result.id,
            "network": result.network,
            "status": result.status,
            "createdAt": new Date(),
            "banner": "/img/banner/" + result.id + fileExtension
          });
          var poster = result.poster;
          var type = "banner";
          getImageData(type, result.id + fileExtension, poster);
          Meteor.call("getExtraImages", result.id, "poster");
          Meteor.call("getExtraImages", result.id, "fanart");
        };
      });
      var searchedSeriesIds = _.pluck(seriesSearchResultsParsed, "id");
      return searchedSeriesIds;
    } catch(e){
      return false;
    };
  },

  updateHitCount: function(seriesArray){ // Add 1 to the series hit count.
    //console.log("updating hit count");
    _.each(seriesArray, function(result){
      console.log("updating", result);
      Series.update(
        {"tvdbId": result},
        {$inc:{hitCount : 1}}
      );
    });
    return false;
  },

  getEpisodeCount: function(id){ // Get number of episodes for a series, set up getEpisodeDetails call.
    var token = Meteor.call("getAuthToken");
    try{
      var episodeCount = HTTP.call("GET", "https://api-beta.thetvdb.com/series/" + id + "/episodes/summary",{
        headers:{
          "authorization" : "Bearer " + token,
          "accept" : "application/vnd.thetvdb.v1.2.0",
          "accept-language" : "en-US,en;q=0.8"
        }
      });
      var episodeCountParsed = JSON.parse(episodeCount.content).data;
      var totalEpisodes = episodeCountParsed.airedEpisodes;
      Series.update({
        "tvdbId": id
      },{
        $set:{
          "epCount" : totalEpisodes
        }
      });
      console.log("Total ", totalEpisodes)
      var pages = Math.ceil(totalEpisodes / 100);
      console.log(pages, "pages");
      Meteor.call("getEpisodeDetails", id, pages);
    } catch(e){
      console.log(e);
      return false;
    };
  },

  getEpisodeDetails: function(id, pages){ // Download episode details and store in DB.
    console.log("getting episode count for", id);
    var token = Meteor.call("getAuthToken");
    for (i = 0; i < pages; i++){
      try{
        var episodeData = HTTP.call("GET", "https://api-beta.thetvdb.com/series/" + id + "/episodes", {
          params:{
            "page" : (i + 1)
          },
          headers:{
            "authorization" : "Bearer " + token,
            "accept-language" : "en-US,en;q=0.8"
          }
        });
        var episodeDataParsed = JSON.parse(episodeData.content).data;
        _.each(episodeDataParsed, function(result){
          Episodes.insert({
            "tvdbId": id,
            "season": parseInt(result.airedSeason),
            "number": parseInt(result.airedEpisodeNumber),
            "name": result.episodeName,
            "description": result.overview
          });
        });
      } catch (e){
        console.log(e);
        return false;
      };
    };
  },

  getExtraImages: function(id, type){ // Gets extra image information and calls getImageData.
    console.log("get extra images");
    var token = Meteor.call("getAuthToken");
    try{
      var extraImages = HTTP.call("GET", "https://api-beta.thetvdb.com/series/" + id + "/images/query",{
        params:{
          "keyType" : type
        },
        headers:{
          "authorization" : "Bearer " + token,
          "accept" : "application/vnd.thetvdb.v1.2.0",
          "accept-language" : "en-US,en;q=0.8"
        }
      });
      var extraImagesParsed = JSON.parse(extraImages.content).data;
      extraImagesParsed.sort(function(a,b){
        return b.ratingsInfo.average - a.ratingsInfo.average;
      });
      console.log(extraImagesParsed);
      var bestImage = extraImagesParsed[0].fileName;
      console.log("best image is", bestImage);
      var fileExtension = path.extname(bestImage);
      if(type == "poster"){
        Series.update({
          "tvdbId": id
        },{
          $set:{
            "poster": "/img/" + type + "/" + id + fileExtension
          }
        });
      } else if (type == "fanart"){
        Series.update({
          "tvdbId": id
        },{
          $set:{
            "fanart": "/img/" + type + "/" + id + fileExtension
          }
        });
      };
      getImageData(type, id + fileExtension, bestImage);
      console.log(bestImage);
    } catch(e){
      console.log(e);
      return false;
    };
  }
});
