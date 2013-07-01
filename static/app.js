var APP = (function(){
  var my_likes, my_friends;
  var processed_friend_count = 0;
  var tpl;

  function done() {
    console.log("done");
    $("#hint").html("Processed all friends");
  }

  function show_common_likes(friend, likes) {
    var context = {friend: friend, likes_count: likes.length}
    var html    = tpl(context);
    $(html).prependTo("#guides").slideDown();
  }

  function process_friend_likes(friend, response) {
    $("#hint").html("Processing " + processed_friend_count + "/" + my_friends.length + " friends");
    console.log(response);
    var common_likes = [];
    for (var key in response.data) {
      var like = response.data[key];
      if(my_likes[like.id]) {
        common_likes.push(like.id);
      };
    }
    console.log("show_friend_likes: " + processed_friend_count);
    if(common_likes.length > 0) {
      show_common_likes(friend, common_likes);
    }
  }

  function run() {
    if (my_likes == undefined) return;
    if (my_friends == undefined) return;

    var source = $("#tpl").html();
    tpl = Handlebars.compile(source);


    var current_friend = my_friends[processed_friend_count];

    if (current_friend == undefined) done();

    FB.api('/' + current_friend.id + '/likes', function(response) {
      processed_friend_count += 1;
      process_friend_likes(current_friend, response);

      if(processed_friend_count == my_friends.length) {
        done();
      } else {
        setTimeout(run, 10);
      }
    });
  }

  function load_my_likes (response) {
    my_likes = {};
    for (var key in response.data) {
      var like = response.data[key];
      my_likes[like.id] = like;
    }
    run();
  }

  function load_my_friends (response) {
    my_friends = response.data;
    run();
  }

  //API exported
  return {
    init : function() {
      FB.api('/me/likes', function(response) {
        load_my_likes(response);
      });

      FB.api('/me/friends', {limit: 10}, function(response) {
        load_my_friends(response);
      });
    }
  };
})();