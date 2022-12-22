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
    console.log(file.originalname);
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
    var category = [req.body.category];
    category = category.join();
    var client = req.body.client;
    var video = "localhost:3000/uploads/movies/" + req.files['vid'][0].filename;
    var img = "localhost:3000/uploads/thumbnails/" + req.files['img'][0].filename;
    var trailer = "localhost:3000/uploads/trailer/" + req.files['trailer'][0].filename;


    var sql = `INSERT INTO movies(title,director_name,producer_name,actor_name,client_name,story,language,file_name,category,thumb_file_name,trailer) VALUES (?,?,?,?,?,?,?,?,?,?,?);`;
    connection.query(sql, [title,director,producer,actor,client,story,language,video,category,img,trailer] ,(err, result) => {
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
  var file = req.body.file;

  var sql = `UPDATE movies SET title='${title}', director_name='${director}', producer_name='${producer}', actor_name='${actor}',client_name='${client}', story='${story}', language='${language}', category='${category}' WHERE file_name='${file}';`;
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
  console.log(trailer);
  var sql = `DELETE FROM movies WHERE file_name="localhost:3000/${file}"`;
  fs.unlink("public/" + file, function (err) {
    if (err) {res.redirect('view');};
  });
  fs.unlink("public/" + img, function (err) {
    if (err) {res.redirect('view');};
  });
  fs.unlink("public/" + trailer, function (err) {
    if (err) {res.redirect('view');};
  });

  connection.query(sql, (err) =>{
    console.log("Entry deleted");
  }) 
  res.redirect("/view");
})




//--------------------------Dashboard-----------------------//
app.get('/', (req, res) => {
  var userCount = undefined;
  var sql = `SELECT * FROM user`;
  var count = `SELECT COUNT(*) FROM user`;
  connection.query(count, (err, row) => {
    userCount = row[0]['COUNT(*)']; 
  });
  connection.query(sql, (err, rows) => {
    res.render("index", {userCount: userCount, rows:rows}); 
  });
});

//-------------------------Block User------------------------//
app.post('/blockUser', (req, res) => {
  var id = req.body.user;
  var status = req.body.status;
  if (status == 1) {
    var sql = `UPDATE user SET block_status= 0 WHERE user_id = ${id}`
  } else {
    var sql = `UPDATE user SET block_status= 1 WHERE user_id = ${id}`
  }
  connection.query(sql, (err) => {
    if(err){console.log(err)};
  })
  res.redirect('/')
})

//-------------------------Delete User------------------------//
app.post('/deleteUser', (req, res) => {
  var id = req.body.user;
    var sql = `DELETE FROM user WHERE user_id = ${id}`
  connection.query(sql, (err) => {
    if(err){console.log(err)};
  })
  res.redirect('/')
})
app.post('/blockUser', (req, res) => {
  var id = req.body.user;
  var status = req.body.status;
  if (status == 1) {
    var sql = `UPDATE user SET block_status= 0 WHERE user_id = ${id}`
  } else {
    var sql = `UPDATE user SET block_status= 1 WHERE user_id = ${id}`
  }
  connection.query(sql, (err) => {
    if(err){console.log(err)};
  })
  res.redirect('/')
})
app.post('/notify', (req,res) => {
  console.log("notification");
})



app.listen(3000 , '192.168.1.4',  () => {
  console.log(`listening on port 3000`);
});