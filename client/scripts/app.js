// YOUR CODE HERE:
var message = {
  username: 'dmitry',
  text: 'asdasd',
  roomname: '111'
};

var friends = {};

var lastMessageTime = new Date(0);
var gCurrentRoom = '';
var gRoomCollection = {};

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

var displayMessage = function(data) {
	var $tempList = $('<div></div>');
	if(!data.results[0])
		return;
	var ts = new Date(data.results[0].createdAt);
	var startHeight = $(document).height();
	for(var i = 0; (i<data.results.length)&&(lastMessageTime<ts); i++) {
		var entry = data.results[i];
		if(!gRoomCollection[entry.roomname]) {
			gRoomCollection[entry.roomname] = true;
		}
		if (gCurrentRoom.length > 0) {
			if (gCurrentRoom !== entry.roomname)
				continue;
		}
		var $msg = $('<div class="msg"></div>');
		if(friends[entry.username]) {
			$msg.addClass('friendMessage');
		} else {
			$msg.removeClass('friendMessage');
		}
		$msg.text(': ' + filterXSS(entry.text));
		if(ts > new Date()) {
			//disallow setting date later than current
			ts = new Date();
			entry.createdAt = ts.toString();
		}
		var $timeStamp = $('<a class="timeStamp">'+filterXSS(ts.toLocaleTimeString())+'</a>');
		$('<br>').appendTo($msg)
		$timeStamp.appendTo($msg);
		$('<a class="username">'+filterXSS(entry.username)+'</a>').prependTo($msg);
		$tempList.append($msg);
		if(data.results[i+1]) {
			ts = new Date(data.results[i+1].createdAt);
		}
	}
	if(lastMessageTime > (new Date(0))) {
		$tempList.hide().css('opacity',0.0).prependTo($('#messages')).fadeIn(100).animate({opacity: 2.0});
	} else {
		$tempList.prependTo($('#messages'));
	}
	lastMessageTime = new Date(data.results[0].createdAt);
	var heightIncrease = $(document).height() - startHeight;
	var scrollPos = $(document).scrollTop();
	//adjust scroll position if we are not at the top of the page
	if((scrollPos>0)&&(heightIncrease>0)) {
		$(document).scrollTop(scrollPos + heightIncrease);
	}
	//re-attach event handlers
	$('.username').off('click');
	$('.username').on('click', function() {
		var name = $(this).text();
		if(frends[name]) {
			delete friends[name];
		} else {
			friends[name] = true;
		}
		//reset messages so we display them in bold correctly
		resetMessages();
	});
	//re-populate rooms dropdown
	initRooms();
}

$(document).ready(function(){
	
	$("#chatl").on('click', function(){
		var newTweet = {};
		newTweet.text = $('#chatler').val();

		var username = window.location.search;
		//"?username=kaven"
		var name = "username=";
		var pos = username.indexOf(name);
		username = username.substring(pos + name.length);
		newTweet.username = username;
		newTweet.roomname = gCurrentRoom;		
		sendMessage(newTweet);

		$('#chatler').val('');	

		setTimeout(getMessage.bind(this,displayMessage), 300);
	});


	getMessage(displayMessage);

   	
});

var resetMessages = function() {
	$("#messages").empty();
	lastMessageTime = new Date(0);
}

var initRooms = function(){
 	var resultArray = [''];
 	for(var k in gRoomCollection) {
 		resultArray.push(k);
 	}
 	$("#chosen-select-room").empty();

	for(var i = 0; i<resultArray.length; i++)
	{
	  var opt = document.createElement("option");
	  opt.value= i;
	  opt.innerHTML = resultArray[i]; // whatever property it has

	  // then append it to the select element
	  $("#chosen-select-room").append(opt);
	}

	$("#chosen-select-room").chosen({allow_single_deselect:true});

	$("#chosen-select-room").on('change', function(ele){
		gCurrentRoom = this.selectedOptions[0].innerHTML;
		resetMessages();
	});

	var noResults = document.getElementsByClassName('no-results');
	for (var i = 0; i < noResults.length; ++i) {
	  var item = noResults[i];
	  if($(item).find('button').length === 0) {
			var button = $("<button class=addRoomButton>Add room</button>");
			$('<br>').appendTo(item);
			button.appendTo(item);
	  }
	}

	$(".addRoomButton").on('click', function() {
		var roomName = $(this).parent().parent().parent().find('.chosen-search').find('input')[0];
		if(roomName == undefined)
			return;
		roomName = filterXSS(roomName.value);
		gCurrentRoom = roomName;
		gRoomCollection[roomName] = true;
		$('#chosen-select-room').append('<option value="'+roomName+'">'+roomName+'</option>');
		$('#chosen-select-room').val(roomName);
    	$('#chosen-select-room').trigger("chosen:updated");
	});

};

setInterval(getMessage.bind(this, displayMessage), 500);

















