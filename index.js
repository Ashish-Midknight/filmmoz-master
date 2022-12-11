const express = require('express');
const multer = require('multer');
var fs = require('fs');
const bodyParser = require('body-parser');
var mysql = require('mysql');
const app = express();

var connection = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"",
    database : "filmmoz"
}) 
connection.connect(function(err) {
  if(err){
    console.log("Error in the connection")
    console.log(err)
  }
  else{
    console.log(`Database Connected`)
  }
})


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype == 'video/mp4' || 'video/mov' || 'video/wvm' || 'video/flv' || 'video/avi' || 'video/mkv' || 'video/webm' || 'video/x-matroska') {
      cb(null, __dirname + "/uploads/movies");
    }
    
    else if (file.mimetype == 'image/jpg' || 'image/jpeg' || 'image/png' || 'image/gif' || 'image/psd') {
      cb(null, __dirname + "/uploads/thumbnails");
    }
    else{
      cb(null, __dirname + "/uploads");
    }
  },
  filename : (req, file, cb) => {
    console.log(file.mimetype);

    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });
const uploadData = upload.fields([{name:'vid', maxCount:1}, {name:'img', maxCount:1}]);


app.post('/upload', uploadData , (req, res,) => {
    var title = req.body.title;
    var producer = req.body.producer;
    var director = req.body.director;
    var actor = req.body.actor;
    var story = req.body.story;
    var language = req.body.language;
    var category = req.body.category;
    var client = req.body.client;
    var cost = req.body.cost;
    var video = "localhost:3000/uploads/" + req.files['vid'][0].filename;
    var img = "localhost:3000/uploads/" + req.files['img'][0].filename;
    var sql = `INSERT INTO movies(title,director_name,producer_name,actor_name,client_name,story,language,file_name,category,cost,thumb_filr_name) VALUES (?,?,?,?,?,?,?,?,?,?,?);`;
    connection.query(sql, [title,director,producer,actor,client,story,language,video,category,cost,img] ,(err, result) => {
      if (err) throw err;
      console.log("1 record inserted");
    });
    res.send("<h1>Uploaded</h1>")
});


app.get('/', (req, res) => {
  res.sendFile(__dirname + "/index.html");
});
app.listen(3000 ,  () => {
  console.log(`listening on port 3000`)
});