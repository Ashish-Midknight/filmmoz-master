require ('dotenv').config ();
const express = require('express');
const multer = require('multer');
var mysql = require('mysql');
var fs = require('fs');
const bodyParser = require('body-parser');
const app = express();
var md5 = require('md5');
var session = require('express-session');

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended:true}));
const progressUpdate = new console.Console(fs.createWriteStream('public/assets/progress.txt'));
app.set('trust proxy', 1);
app.use(session({secret: process.env.SECRET, resave: false,saveUninitialized: true}));


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
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });
const uploadData = upload.fields([{name:'vid', maxCount:1}, {name:'img', maxCount:1}, {name:'trailer', maxCount:1}]);



//------------------Upload Section-------------------//

function progress(req, res, next) {
  let progress = 0;
  var percentage = 0;
  const file_size = req.headers["content-length"];
  req.on("data", (chunk) => {
      progress += chunk.length;
      percentage = (progress / file_size) * 100;
      percentage = Math.floor(percentage);
      console.log(percentage);
  });
   next(); 
}


app.get('/upload', (req, res) => {
  if (!req.session.user) {
    res.redirect("/");
  } else {
    res.render('upload', {trigger:0});
  }
  
})

app.post('/upload', progress, uploadData , (req, res,) => {

  
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

  connection.query(`SELECT * FROM movies WHERE file_name = '${video}'`, (err,result) => {
    if(err) {res.redirect("/");}
    var len = result.length;
    if (len > 0) {
      var trigger = 1;
      res.render('upload', {trigger:1});
    } else {
      var sql = `INSERT INTO movies(title,director_name,producer_name,actor_name,client_name,story,language,file_name,category,thumb_file_name,trailer) VALUES (?,?,?,?,?,?,?,?,?,?,?);`;
  connection.query(sql, [title,director,producer,actor,client,story,language,video,category,img,trailer] ,(err) => {
    if (err) throw err;
  });
  res.redirect('view');
    }
  });
});




//-----------------View Section-----------------//
app.get('/view', (req, res) => {
  if (!req.session.user) {
    res.redirect("/")
  } else {
    var numrows = 0;
    connection.query(`SELECT COUNT(*) FROM movies;`, (err, result) => {
      if (err) throw err;
      numrows = result[0]["COUNT(*)"];
    })
    var page = req.query.page ? Number(req.query.page) : 1;
    var start = (20 * (page - 1));
    var end = 5;
    var sql = `SELECT * FROM movies LIMIT ${start}, ${end}`;
    connection.query(sql, (err, rows) => {
      if (err) throw err;
      res.render("view", {rows: rows, page: page, start: start, end: end, numrows:numrows}); 
    });
  }
  
});


app.post("/search", (req, res) => {
  var name = req.body.search;
  var sql = `SELECT * FROM movies WHERE title LIKE '%${name}%' `;
  connection.query(sql, (err, rows) => {
    if (err) throw err;
    res.render("view", {rows:rows, page: 1, start: 1, end: 2, numrows:1});
  })
  
})


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
  });
  res.redirect('/view');
})



//--------------------------Delete Section---------------------//
app.post("/delete", (req,res) => {
  var id = req.body.id;
  var file = req.body.file;
  var img = req.body.img;
  var trailer = req.body.trailer;
  var sql = `DELETE FROM movies WHERE movie_id="${id}"`;
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



//--------------------------Login-----------------------//
app.get("/", (req,res) => {
  if (!req.session.user) {
    res.render("index");
  } else {
    var userCount = undefined;
        var sql = `SELECT * FROM user`;
        var count = `SELECT COUNT(*) FROM user`;
        connection.query(count, (err, row) => {
          userCount = row['COUNT(*)']; 
        });
        connection.query(sql, (err, rows) => {
          res.render("dashboard", {userCount: userCount, rows:rows}); 
        });
  }
});


app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
})

app.post("/login", (req, res) => {
  var id = req.body.loginid;
  var pass = md5(req.body.password);
  var sql = `SELECT * FROM admin`;
  connection.query(sql, (err, dbop) => {
    if (err) {res.redirect("/");}
    var dbid = dbop[0].userid;
    var dbpass = dbop[0].password;
    if (id == dbid) {
      if (pass == dbpass) {
        req.session.user = id;
        res.redirect("/");
      } else {
        res.redirect("/");
      }
      
    } else {
      res.redirect("/");
    }
  });
  
})



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
  res.redirect('/');
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
  var message = req.body.message;
  var id = req.body.user;
  var sql = `UPDATE user SET notification = "${messsage}" WHERE user_id = ${id}`
  connection.query(sql, (err) => {
    if(err){console.log(err)};
  })
  res.redirect('/');
})



app.listen(3000 , '192.168.1.5',  () => {
  console.log(`listening on port 3000`);
});