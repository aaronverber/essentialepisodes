Meteor.startup(function (){
  Meteor.call("authTVDB", function(err, response){
    console.log("RESPONSE", err, response);
  });
});
