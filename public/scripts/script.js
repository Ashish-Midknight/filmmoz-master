document.addEventListener("DOMContentLoaded", function(){
                
    // Initialize instances:
    var socket = io("192.168.1.7:3000");
    var movie = new SocketIOFileUpload(socket);
    var image = new SocketIOFileUpload(socket);
    var trailer = new SocketIOFileUpload(socket);
    // Configure the three ways that SocketIOFileUpload can read files:
    movie.listenOnSubmit(document.getElementById("submit"), document.getElementById("upload_movie"));
    image.listenOnSubmit(document.getElementById("submit"), document.getElementById("img"));
    trailer.listenOnSubmit(document.getElementById("submit"), document.getElementById("trailer"));


    movie.addEventListener("start", function(event){
      event.file.meta.movie = event.file.name;
    });
    image.addEventListener("start", function(event){
      event.file.meta.image = event.file.name;
    });
    trailer.addEventListener("start", function(event){
      event.file.meta.trailer = event.file.name;
    });

    movie.addEventListener("progress", function(event){
      document.getElementById("submit").setAttribute("disabled", "disabled");
      var percent = event.bytesLoaded / event.file.size * 100;
      document.getElementById("bar0").style["width"] = percent + "%";

    });
    image.addEventListener("progress", function(event){
      var percent = event.bytesLoaded / event.file.size * 100;
      document.getElementById("bar1").style["width"] = percent + "%";
    });
    trailer.addEventListener("progress", function(event){
      var percent = event.bytesLoaded / event.file.size * 100;
      document.getElementById("bar2").style["width"] = percent + "%";
    });

    movie.addEventListener("complete", function(event){
      document.getElementById("bar0").style["background-color"] = "green";
      document.getElementById("form-submit").click();
    });
    image.addEventListener("complete", function(event){
      document.getElementById("bar1").style["background-color"] = "green";
    });
    trailer.addEventListener("complete", function(event){
      document.getElementById("bar2").style["background-color"] = "green";
    });

    var submitBtn = document.getElementById("submit");
    var title = document.getElementById("title");
    var producer = document.getElementById("producer");
    var director = document.getElementById("director");
    var actor = document.getElementById("actor");
    var story = document.getElementById("story");
    var language = document.getElementById("language");
    var client = document.getElementById("client");
    var selectMovie =  document.getElementById("upload_movie");
    var img =  document.getElementById("img");
    var trail =  document.getElementById("trailer");
    var price =  document.getElementById("price");

    const checkEnableButton = () => {
      submitBtn.disabled = !(title.value && producer.value && director.value && actor.value && story.value && client.value && selectMovie.value 
        && img.value && trail.value && language.value && price.value !== 'Choose')
    }

    title.addEventListener('change', checkEnableButton);
    producer.addEventListener('change', checkEnableButton);
    director.addEventListener('change', checkEnableButton);
    actor.addEventListener('change', checkEnableButton);
    story.addEventListener('change', checkEnableButton);
    language.addEventListener('change', checkEnableButton);
    client.addEventListener('change', checkEnableButton);
    selectMovie.addEventListener('change', checkEnableButton);
    img.addEventListener('change', checkEnableButton);
    trail.addEventListener('change', checkEnableButton);
    price.addEventListener('change', checkEnableButton);
}, false);