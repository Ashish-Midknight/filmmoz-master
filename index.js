const express = require('express');
const multer = require('multer');
var mysql = require('mysql');
var fs = require('fs');
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
    else if (file.fieldname == 'trailer') {
      cb(null, __dirname + "/public/uploads/trailer");
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
const uploadData = upload.fields([{name:'vid', maxCount:1}, {name:'img', maxCount:1}, {name:'trailer', maxCount:1}]);




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
    category = category.join();
    var client = req.body.client;
    var cost = req.body.cost;
    var video = "localhost:3000/uploads/movies/" + req.files['vid'][0].filename;
    var img = "localhost:3000/uploads/thumbnails/" + req.files['img'][0].filename;
    var trailer = "localhost:3000/uploads/trailer/" + req.files['trailer'][0].filename;


    var sql = `INSERT INTO movies(title,director_name,producer_name,actor_name,client_name,story,language,file_name,category,cost,thumb_filr_name,trailer) VALUES (?,?,?,?,?,?,?,?,?,?,?,?);`;
    connection.query(sql, [title,director,producer,actor,client,story,language,video,category,cost,img,trailer] ,(err, result) => {
      if (err) throw err;
      console.log("1 record inserted");
    });

    res.redirect('view');
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



//--------------------------edit section------------------------//
app.post('/edit', (req,res) => {

  var title = req.body.title;
  var producer = req.body.producer;
  var director = req.body.director;
  var actor = req.body.actor;
  var story = req.body.story;
  var language = req.body.language;
  var category = req.body.category;
  var client = req.body.client;
  var cost = req.body.cost;
  var file = req.body.file;

  var sql = `UPDATE movies SET title='${title}', director_name='${director}', producer_name='${producer}', actor_name='${actor}',client_name='${client}', story='${story}', language='${language}', category='${category}', cost='${cost}' WHERE file_name='${file}';`;
  connection.query(sql, (err) => {
    console.log(title + " : updated");
  });
  res.redirect('/view');
})



//--------------------------Delete Section---------------------//
app.post("/delete", (req,res) => {
  var file = req.body.file;
  var img = req.body.img;
  var trailer = req.body.trailer;
  var sql = `DELETE FROM movies WHERE file_name="localhost:3000/${file}"`;
  console.log(file);
  console.log(img);
  fs.unlink("public/" + file, function (err) {
    if (err) {res.redirect('view'); console.log(err);};
    console.log('File deleted!');
  });
  fs.unlink("public/" + img, function (err) {
    if (err) {res.redirect('view'); console.log(err);};
    console.log('File deleted!');
  });
  fs.unlink("public/" + trailer, function (err) {
    if (err) {res.redirect('view'); console.log(err);};
    console.log('File deleted!');
  });

  connection.query(sql, (err) =>{
    console.log("Entry deleted");
  }) 
  res.redirect("view");
})




//--------------------------home route-----------------------//
app.get('/', (req, res) => {
  res.render("index");
});
app.listen(3000 , '192.168.1.4',  () => {
  console.log(`listening on port 3000`);
});