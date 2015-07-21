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
var longestWordLength = 24;
var maxTextLength = 1024;

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

var reColorMessages = function() {
	var messages = document.getElementsByClassName('msg');
	for(var i = 0; i<messages.length; i++) {
		if(friends[$(messages[i]).find('.username')[0].innerText]) {
			$(messages[i]).addClass('friendMessage');
		} else {
			$(messages[i]).removeClass('friendMessage');
		}
	}
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
		if(entry.text === undefined)
			continue;
		if(entry.text.length > maxTextLength) {
			entry.text = entry.text.substring(0, maxTextLength);
		}
		var str = entry.text.split(" ");
		var longest = 0;
		for (var j = 0; j < str.length; j++) {
			if (longest < str[j].length) {
			    longest = str[j].length;
			}
		}
		if(longest > longestWordLength) {
			$msg.addClass('longMessage');
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
		if(friends[name]) {
			delete friends[name];
		} else {
			friends[name] = true;
		}
		//reset messages so we display them in bold correctly
		reColorMessages();
	});
	//re-populate rooms dropdown
	initRooms();
}


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
    	resetMessages();
	});

};

//-------------
var Message = Backbone.Model.extend({
  initialize: function(entry) {
	if(!gRoomCollection[entry.roomname]) {
		gRoomCollection[entry.roomname] = true;
	}
	var ts = new Date(entry.createdAt);
	if(ts > new Date()) {
		//disallow setting date later than current
		ts = new Date();
	}

	var txt = filterXSS(entry.text) || "";
	if(txt.length > maxTextLength) {
		txt = txt.substring(0, maxTextLength);
	}

  	this.set('username', filterXSS(entry.username) || "");
  	this.set('text', txt);
  	this.set('roomname', filterXSS(entry.roomname) || "");
  	this.set('createdAt', filterXSS(ts.toString()) || "");
  },
  
  defaults: {
  }

});

var MessageView = Backbone.View.extend({
  initialize: function() {
  },
  render: function() {

  	var date = new Date(this.model.get('createdAt'));

    var html = [
      '<div class="msg">',
        '<a class="username">',
          this.model.get('username') + ": ",  
        '</a>',
        '<span class="text">',
            this.model.get('text'),
        '</span>',
        '<br>',
        '<a class="timeStamp">',
          date.toLocaleTimeString(),
        '</a>',
      '</div>'
    ].join('');

		if (gCurrentRoom.length > 0) {
			if (gCurrentRoom !== this.model.get('roomname'))
				return $('');
		}

		this.$el.html(html);
		var $msg = this.$el.find('.msg');

		if(friends[this.model.get('username')]) {
			$msg.addClass('friendMessage');
		} else {
			$msg.removeClass('friendMessage');
		}

		var str = this.model.get('text').split(" ");
		var longest = 0;
		for (var j = 0; j < str.length; j++) {
			if (longest < str[j].length) {
			    longest = str[j].length;
			}
		}
		if(longest > longestWordLength) {
			$msg.addClass('longMessage');
		}

  	return this.$el;
  }
});

var Messages = Backbone.Collection.extend({
  model: Message
});

var MessagesView = Backbone.View.extend({

  initialize: function() {
    //this.model.on('change:votes', this.render, this);
  },

  // Now we must render the collection:
  render: function() {
  	var data = this.model.models;
		var $tempList = $('<div></div>');
		if(!this.$el.html())
			this.$el.html('<div id=messages></div>');
		if(!data[0])
			return this.$el;
		var ts = new Date(data[0].get('createdAt'));
		var startHeight = $(document).height();
		for(var i = 0; (i<data.length)&&(lastMessageTime<ts); i++) {
			var entry = data[i];
			var messageView = new MessageView ({model : entry});
			$tempList.append(messageView.render());
			if(data[i+1]) {
				ts = new Date(data[i+1].get('createdAt'));
			}
		}
		if($tempList.find('.msg').length > 0) {
			if(lastMessageTime > (new Date(0))) {
				$tempList.hide().css('opacity',0.0).prependTo(this.$el.find('#messages')).fadeIn(100).animate({opacity: 2.0});
			} else {
				$tempList.prependTo(this.$el.find('#messages'));
			}
		}
		lastMessageTime = new Date(data[0].get('createdAt'));
		var heightIncrease = $(document).height() - startHeight;
		var scrollPos = $(document).scrollTop();
		//adjust scroll position if we are not at the top of the page
		if((scrollPos>0)&&(heightIncrease>0)) {
			$(document).scrollTop(scrollPos + heightIncrease);
		}
		var that = this;
		//re-attach event handlers
		$('.username').off('click');
		$('.username').on('click', function() {
			var name = $(this).text();
			if(friends[name]) {
				delete friends[name];
			} else {
				friends[name] = true;
			}
			//reset messages so we display them in bold correctly
			that.reColorMessages();
		});
		//re-populate rooms dropdown
		initRooms();

    return this.$el;
  },

  //recolor the messages:
  reColorMessages : function() {
		var messages = this.$el[0].getElementsByClassName('msg');
		for(var i = 0; i<messages.length; i++) {
			if(friends[$(messages[i]).find('.username')[0].innerText]) {
				$(messages[i]).addClass('friendMessage');
			} else {
				$(messages[i]).removeClass('friendMessage');
			}
		}
	}
});

var messages = new Messages();
var messagesView = new MessagesView({model:messages});
var newCallback = function(data) {

	messages.reset();
	for(var i = 0; i < data.results.length; i++){
		var msgModel = new Message(data.results[i]);
		messages.add(msgModel);
	}
	messagesView.render();
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
	});
	$('#main').append(messagesView.render());
});



	getMessage(newCallback);
	setInterval(getMessage.bind(this, newCallback), 500);

var renderedList = $('#messages');









