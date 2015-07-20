// YOUR CODE HERE:
var message = {
  username: 'dmitry',
  text: 'asdasd',
  roomname: '111'
};

var getMessage = function(callback) {
	$.ajax({
	  // This is the url you should use to communicate with the parse API server.
	  url: 'https://api.parse.com/1/classes/chatterbox',
	  type: 'GET',
	  contentType: 'application/json',
	  success: function (data) {
	    //console.log('chatterbox: Message received');
	   	callback(data);
	  },
	  error: function (data) {
	    // See: https://developer.mozilla.org/en-US/docs/Web/API/console.error
	  //  console.error('chatterbox: Failed to receive message');
	  }
	});

}


var sendMessage = function(data) {
	$.ajax({
	  // This is the url you should use to communicate with the parse API server.
	  url: 'https://api.parse.com/1/classes/chatterbox',
	  type: 'POST',
	  data: JSON.stringify(data),
	  contentType: 'application/json',
	  success: function (data) {
	    console.log('chatterbox: Message sent');
	  },
	  error: function (data) {
	    // See: https://developer.mozilla.org/en-US/docs/Web/API/console.error
	    console.error('chatterbox: Failed to send message');
  	}
	});
}

var geTimeStamp = function(time){
 var year = time.getFullYear();
 var month = time.getMonth()+1;
 var day = time.getDate();
 var hour = time.getHours();
 var minutes = time.getMinutes();
 var seconds = time.getSeconds();
 
 return '' + hour.toString() + 
       ':' + minutes.toString() + 
       ':' + seconds.toString();
};

var displayMessage = function(data) {
	$('#messages').empty();
	for(var i = 0; i<data.results.length; i++) {
		var entry = data.results[i];
		var $msg = $('<div class="msg"></div>');
		$msg.text(': ' + filterXSS(entry.text));
		var timeStamp = new Date(entry.createdAt);
		$('<a class="timeago">'+filterXSS(geTimeStamp(timeStamp))+'</a>').appendTo($msg);
		$('<a class="username">'+filterXSS(entry.username)+'</a>').prependTo($msg);
		$('#messages').append($msg);
		lastMessageIndex = i;
	}

}

$(document).ready(function(){
	
	$("#tweetl").on('click', function(){
		var newTweet = {};
		newTweet.text = $('#tweetler').val();

		var username = window.location.search;
		//"?username=kaven"
		var name = "username=";
		var pos = username.indexOf(name);
		username = username.substring(pos + name.length);
		newTweet.username = username;
		newTweet.roomname = "room1";

		sendMessage(newTweet);

		$('#tweetler').val('');	

		setTimeout(getMessage.bind(this,displayMessage), 300);
	});


});


getMessage(displayMessage);
setInterval(getMessage.bind(this, displayMessage), 500);

















