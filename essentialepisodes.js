Series = new Mongo.Collection("series");

if (Meteor.isClient) {
  Template.body.helpers({
    series: function(){
      return Series.find({});
    }
  });
}
