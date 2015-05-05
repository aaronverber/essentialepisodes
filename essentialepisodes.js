Series = new Mongo.Collection("series");

if (Meteor.isClient) {
  Template.body.helpers({
    series: function(){
      return Series.find({});
    }
  });

  Meteor.call("authTVDB", function(err, response){
    console.log("RESPONSE", err, response);
  });
}

if(Meteor.isServer){
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
          console.log("RESULT", result);
        return true;
      } catch(e){
        console.log("ERROR", e);
        return false;
      }
    }
  });
}
