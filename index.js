const express = require('express');
const multer = require('multer');
var mysql = require('mysql');
const bodyParser = require('body-parser');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended:true}));
//--------------------SQL Connection-------------------//
var connection = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"",
    database : "filmmoz"
}) 
connection.connect(function(err) {
  if(err){
    console.log("Error in the connection");
    console.log(err);
  }
  else{
    console.log(`Database Connected`);
  }
})

//----------------------Multer---------------------//
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname == 'vid') {
      cb(null, __dirname + "/public/uploads/movies");
    }
    
    else if (file.fieldname == 'img') {
      cb(null, __dirname + "/public/uploads/thumbnails");
    }
    else{
      cb(null, __dirname + "/uploads");
    }
  },
  filename : (req, file, cb) => {
    console.log(file);
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });
const uploadData = upload.fields([{name:'vid', maxCount:1}, {name:'img', maxCount:1}]);

//------------------Upload Section-------------------//
app.get('/upload', (req,res) => {
  res.render('upload');
})


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
    var video = "localhost:3000/uploads/movies/" + req.files['vid'][0].filename;
    var img = "localhost:3000/uploads/thumbnails/" + req.files['img'][0].filename;
    var size = req.files['vid'][0].size;
    console.log(size);


    var sql = `INSERT INTO movies(title,director_name,producer_name,actor_name,client_name,story,language,file_name,category,cost,thumb_filr_name) VALUES (?,?,?,?,?,?,?,?,?,?,?);`;
    connection.query(sql, [title,director,producer,actor,client,story,language,video,category,cost,img] ,(err, result) => {
      if (err) throw err;
      console.log("1 record inserted");
    });

    res.send('<div><h1>Uploaded</h1> <a href="/">Dashboard</a> </div>');
});




//-----------------View Section-----------------//
let view = 0;
var numrow = 0;
app.get('/view', (req, res) => {
  var sql = `SELECT * FROM movies`;
  var count = `SELECT COUNT(*) FROM movies`;
  connection.query(count, (err, row) => {
    numrow = row[0]['COUNT(*)']; 
  });
  connection.query(sql, (err, rows) => {
    res.render("view", {rows: rows,view: view, numrow: numrow}); 
  });

});

//--------------------------home route-----------------------//
app.get('/', (req, res) => {
  res.render("index");
});
app.listen(3000 , '192.168.1.12',  () => {
  console.log(`listening on port 3000`)
});