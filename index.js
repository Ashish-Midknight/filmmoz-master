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
    database : ""
})
  
connection.connect(function(err) {
  if(err){
    console.log("Error in the connection")
    console.log(err)
  }
  else{
    console.log(`Database Connected`)
    connection.query(`SHOW DATABASES`, 
    function (err, result) {
      if(err)
        console.log(`Error executing the query - ${err}`)
      else
        console.log("Result: ",result) 
    })
  }
})

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, __dirname + "/uploads");
  },
  filename : (req, file, cb) => {
    console.log(file);
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });

app.get('/', (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.post('/upload', upload.single('file'), (req, res,) => {
    const date = new Date();
    var title = req.body.title;
    var producer = req.body.producer;
    var director = req.body.director;
    var actor = req.body.actor;
    var story = req.body.story;
    var language = req.body.language;
    var category = req.body.category;
    var client = req.body.client;
    var cost = req.body.cost;
    var video = "http://192.168.1.4/uploads/" + req.file.filename;
    var sql = "INSERT INTO movies(title,director_name,producer_name,actor_name,client_name,story,language,file_name,category,cost,date) VALUES ('title','director','producer','actor','client','story','language','video','category','cost','date')";
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log("1 record inserted");
    });
    res.send("<h1>Uploaded</h1>")
});


app.listen(3000, '192.168.1.6' ,  () => {
  console.log(`listening on port 3000`)
});