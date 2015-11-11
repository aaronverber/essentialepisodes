Meteor.publish("series", function(){
  return Series.find();
});

Meteor.publish("episodes", function(){
  return Episodes.find();
});

Meteor.publish("users", function(){
  return Meteor.users.find({},{fields:{profile:1}})
});