var socket = io();

function scrollToBottom() {
    // Selectors
    var messages = jQuery('#receivedMessages');
    var newMessage = messages.children('li:last-child')
        // Heights
    var clientHeight = messages.prop('clientHeight');
    var scrollTop = messages.prop('scrollTop');
    var scrollHeight = messages.prop('scrollHeight');
    var newMessageHeight = newMessage.innerHeight();
    var lastMessageHeight = newMessage.prev().innerHeight();

    if (clientHeight + scrollTop + newMessageHeight + lastMessageHeight >= scrollHeight) {
        messages.scrollTop(scrollHeight);
    }
}


socket.on("connect", function() {
    console.log("User Connected!");
    var params = jQuery.deparam(window.location.search);
    console.log(params.name);
    socket.emit("join", params, function(err) {
        if (err) {
            alert(err);
            window.location.href = "/";
        } else {
            console.log("No error");
        }
    });
});

socket.on("newMessage", function(message) {
    var formattedTime = moment(message.createdAt).format("h:mm a")
    var template = jQuery("#message_template").html();
    var html = Mustache.render(template, {
        from: message.from,
        text: message.text,
        createdAt: formattedTime
    });

    jQuery("#receivedMessages").append(html);
    scrollToBottom();
});

socket.on("newLocationMessage", function(message) {
    var formattedTime = moment(message.createdAt).format("h:mm a")
    var template = jQuery("#location_template").html();
    var html = Mustache.render(template, {
        from: message.from,
        url: message.url,
        createdAt: formattedTime
    })


    jQuery("#receivedMessages").append(html);
    scrollToBottom();
});

socket.on("disconnect", function() {
    console.log("Disconnected from the server!");
});

socket.on("updateUserList", function(users) {
    var ol = jQuery("<ol></ol>");

    users.forEach(function(user) {
        ol.append(jQuery("<li></li>").text(user));
    });

    jQuery("#users").html(ol);
});

jQuery("#messages-form").on("submit", function(event) {
    event.preventDefault();

    socket.emit("createMessage", {
        text: jQuery("#textfield").val()
    }, function(data) {
        jQuery("#textfield").val("");

    });
});


jQuery("#geolocationButton").on("click", function() {
    if (!navigator.geolocation)
        return alert("Sorry. Your browser doesnot support geolocation fetching!");

    jQuery("#geolocationButton").text("Sending...");

    navigator.geolocation.getCurrentPosition(function(position) {
        jQuery("#geolocationButton").text("Send Location");
        socket.emit("geolocationMessage", {
            lat: position.coords.latitude,
            long: position.coords.longitude
        });
    }, function(error) {
        jQuery("#geolocationButton").reomveattr("disabled");
        alert("Sorry we cannot fetch your location!");
    });
})