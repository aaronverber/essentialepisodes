Meteor.publish("series", function(){
  return Series.find();
});
