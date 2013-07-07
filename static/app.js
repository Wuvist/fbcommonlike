var APP = (function(){
  var my_likes, my_friends, likes = {}, top_friends = [];
  var processed_friend_count = 0;
  var tpl, top_friend_tpl;

  function done() {
    $("#hint").html("Done");
  }

  function get_like_score(common_like_count, friend_like_count) {
    var score = common_like_count + common_like_count / (friend_like_count + Object.keys(my_likes).length);
    return score;
  }

  function show_top_friends(friend, common_likes_count) {
    top_friends.sort(function(a, b){
        if(a.score > b.score)return -1;
        if(a.score < b.score)return 1;
        return 0;
    });

    top_friends = top_friends.slice(0, 5);
    var top_friends_ids = {};

    for (var key in top_friends) {
      var obj = top_friends[key];
      top_friends_ids[obj.friend_id] = key;
    }
    
    $("#top_friends li").each(function(){
      if(top_friends_ids[this.id] == undefined) {
        $(this).slideUp("fast", function(){
          $(this).remove();
        })
      }
    });
    
    var new_friend_pos = top_friends_ids[friend.id];
    if (new_friend_pos != undefined) {
      new_friend_pos = parseInt(new_friend_pos) + 1;
      var context = {
        username: $("#username").val(),
        friend: friend, 
        common_likes_count: common_likes_count
      }
      var html = top_friend_tpl(context);
      
      if($("#top_friends li:nth-child(" + new_friend_pos + ")")[0]) {
        $(html).insertBefore("#top_friends li:nth-child(" + new_friend_pos + ")").slideDown();  
      } else {
        $(html).appendTo("#top_friends").slideDown();  
      }
    }
  }

  function show_common_likes(friend, likes) {
    var context = {friend: friend, common_likes_count: likes.length, common_likes: likes}
    var html = tpl(context);
    $(html).prependTo("#guides").slideDown();
  }

  function process_friend_likes(friend, response) {
    $("#hint").html(Math.floor(processed_friend_count  / my_friends.length * 100) + "%");

    var common_likes = [];

    for (var key in response.data) {
      var like = response.data[key];
      if(my_likes[like.id]) {
        common_likes.push(like);
      };
    }
    
    if(common_likes.length > 0) {
      show_common_likes(friend, common_likes);

      var friend_like_count = response.data.length;
      var friend_score = get_like_score(common_likes.length, friend_like_count);
      top_friends.push({friend_id: friend.id, score: friend_score});
      show_top_friends(friend, common_likes.length);
    }
  }

  function run() {
    if (my_likes == undefined) return;
    if (my_friends == undefined) return;

    var source = $("#tpl").html();
    tpl = Handlebars.compile(source);
    top_friend_tpl = Handlebars.compile($("#top_friend_tpl").html());


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

      FB.api('/me/friends', {limit: 100}, function(response) {
        load_my_friends(response);
      });
    }
  };
})();