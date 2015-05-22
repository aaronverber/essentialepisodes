var fs = Meteor.npmRequire('fs');
var http=Npm.require("http");
var path = Npm.require('path');

var rootPath = path.resolve('.').split('.meteor')[0];

function writeImage(type, fileName, buffer){
  var projectFolder = rootPath;
  var imageFolder = "public/img";
  var imagePath = path.join(projectFolder, imageFolder, type, fileName);
  fs.writeFileSync(imagePath, buffer, 'binary');
}

function getImageData(type, name, url){
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



function getFanartImages(id){
  var apiKey = "e8e54550751d9a8304589c5d166c557d";
  var url = "http://private-anon-bbb7bf2e1-fanarttv.apiary-proxy.com/v3/tv/" + id + "?api_key=" + apiKey;
  http.get(url, function(res){
    var data = "";
    res.on("data", function(chunk) {
      data += chunk;
    });
    res.on("end",function(){
      console.log(data.name);
    })
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
            "banner": "/img/banner/" + result.id + fileExtension
          });
          //console.log("record added");
          var poster = result.poster;
          var type = "banner";
          getImageData(type, result.id + fileExtension, poster);
          Meteor.call("getExtraImages", result.id, "poster");
          Meteor.call("getExtraImages", result.id, "fanart");
        };
      });
      var searchedSeriesIds = _.pluck(seriesSearchResultsParsed, "id");
      return searchedSeriesIds;
      //var searchedSeriesDB = Series.find({tvdbId:{$in: searchedSeriesIds}}).fetch();
      //return searchedSeriesDB;
    } catch(e){
      return false;
    };
  },

  getEpisodeCount: function(id){
    var token = Meteor.call("getAuthToken");
    try{
      var episodeCount = HTTP.call("GET", "https://api-dev.thetvdb.com/series/" + id + "/episodes/summary",{
        headers:{
          "authorization" : "Bearer " + token,
          "accept" : "application/vnd.thetvdb.v1.2.0",
          "accept-language" : "en-US,en;q=0.8"
        }
      });
      var episodeCountParsed = JSON.parse(episodeCount.content).data;
      var totalEpisodes = episodeCountParsed.airedEpisodes;
      //var totalSeasons = episodeCountParsed.airedSeasons;
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

  getEpisodeDetails: function(id, pages){
    console.log("getting episode count for", id);
    var token = Meteor.call("getAuthToken");
    for (i = 0; i < pages; i++){
      try{
        var episodeData = HTTP.call("GET", "https://api-dev.thetvdb.com/series/" + id + "/episodes", {
          params:{
            "page" : (i + 1)
          },
          headers:{
            "authorization" : "Bearer " + token,
            "accept" : "application/vnd.thetvdb.v1.2.0",
            "accept-language" : "en-US,en;q=0.8"
          }
        });
        console.log(episodeData);
        var episodeDataParsed = JSON.parse(episodeData.content).data;
        console.log(episodeDataParsed);
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

  getExtraImages: function(id, type){
    console.log("get extra images");
    var token = Meteor.call("getAuthToken");
    try{
      var extraImages = HTTP.call("GET", "https://api-dev.thetvdb.com/series/" + id + "/images/query",{
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
