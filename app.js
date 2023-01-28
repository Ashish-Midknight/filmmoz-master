require ('dotenv').config ();
const express = require('express');
const app = express();
const SocketServer = require('ws').Server;
const http = require('http').createServer(app);
var SocketIOFileUpload = require('socketio-file-upload');
const io = require('socket.io')(http);
var mysql = require('mysql');
var fs = require('fs');
var md5 = require('md5');
var session = require('express-session');
const bodyParser = require('body-parser');

app.set('view engine', 'ejs');
app.use(SocketIOFileUpload.router).listen(80);
app.use(express.static('public'));
app.set('trust proxy', 1);
app.use(session({secret: process.env.SECRET, resave: false,saveUninitialized: true}));
const server = app.listen(8000, () => console.log(`Listening on 8000`));
const wss = new SocketServer({ server });
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



//------------------Upload Section-------------------//


app.get('/upload', (req, res) => {
  if (!req.session.user) {
    res.redirect("/");
  } else {
    res.render('upload', {trigger:0});
  }
  
})


var movieName = "";
var imageName = "";
var trailerName = "";
io.sockets.on("connection", function(socket, err){
    
      var uploader = new SocketIOFileUpload();
      uploader.listen(socket);
      uploader.on("start", function(event){
        console.log(event);
        if (event.file.id == 0) {
          uploader.dir = __dirname + "/public/uploads/movies";
        } else if (event.file.id == 1) {
          uploader.dir = __dirname + "/public/uploads/thumbnails";
        }else if (event.file.id == 2) {
          uploader.dir = __dirname + "/public/uploads/trailer";
        } else{
          uploader.dir = __dirname + "/public/uploads";
        }
          if (fs.existsSync(__dirname + "/public/uploads/movies/" + event.file.name)) {
            fs.unlink(__dirname + "/public/uploads/movies/" + event.file.name, function(err){
              if (err) {
                console.log(err);
              }
            });
          };
          if (fs.existsSync(__dirname + "/public/uploads/thumbnails/" + event.file.name)) {
            fs.unlink(__dirname + "/public/uploads/thumbnails/" + event.file.name, function(err){
              if (err) {
                console.log(err);
              }
            });
          };
          if (fs.existsSync(__dirname + "/public/uploads/trailer/" + event.file.name)) {
            fs.unlink(__dirname + "/public/uploads/trailer/" + event.file.name, function(err){
              if (err) {
                console.log(err);
              }
            });
          };

      });

      uploader.on("saved", function(event){
            if(event.file.meta.movie != undefined) {
              movieName = event.file.meta.movie;
            }
            if(event.file.meta.image != undefined) {
              imageName = event.file.meta.image;
            }
            if(event.file.meta.trailer != undefined) {
              trailerName = event.file.meta.trailer;
            }
          });

          
      uploader.on("error", function(event){
        fs.unlink(__dirname + "/public/uploads/movies/" + event.file.name, function(err){
          if (err) {console.log(err);}
        });
        console.log("Error from uploader", event);
      });
    });


app.post('/upload', (req, res,) => {
  if (!req.session.user) {
    res.redirect("/")
  } else {
  var title = req.body.title;
  var producer = req.body.producer;
  var director = req.body.director;
  var actor = req.body.actor;
  var story = req.body.story;
  var language = req.body.language;
  var category = [req.body.category];
  category = category.join();
  var client = req.body.client;
  var video = "localhost:3000/uploads/movies/" + movieName;
  var img = "localhost:3000/uploads/thumbnails/" + imageName;
  var trailer = "localhost:3000/uploads/trailer/" + trailerName;
  var sql = `SELECT * FROM movies WHERE trailer = "${trailer}"`;
  connection.query(sql , (err, result) => {
    if (result.length > 0) {
      res.render("upload", {trigger:1})
    } else {
      var sql = `INSERT INTO movies(title,director_name,producer_name,actor_name,client_name,story,language,file_name,category,thumb_file_name,trailer) VALUES (?,?,?,?,?,?,?,?,?,?,?);`;
      connection.query(sql, [title,director,producer,actor,client,story,language,video,category,img,trailer] ,(err) => {
        if (err) throw err;
      });
      res.redirect('view');
    }
  })
}
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
    var end = 20;
    var sql = `SELECT * FROM movies LIMIT ${start}, ${end}`;
    connection.query(sql, (err, rows) => {
      if (err) throw err;
      res.render("view", {rows: rows, page: page, start: start, end: end, numrows:numrows}); 
    });
  }
  
});


app.post("/search", (req, res) => {
  if (!req.session.user) {
    res.redirect("/")
  } else {
  var name = req.body.search;
  var sql = `SELECT * FROM movies WHERE title LIKE '%${name}%' `;
  connection.query(sql, (err, rows) => {
    if (err) throw err;
    res.render("view", {rows:rows, page: 1, start: 1, end: 2, numrows:1});
  })
}
})


//--------------------------edit section------------------------//
app.post('/edit', (req,res) => {
  if (!req.session.user) {
    res.redirect("/")
  } else {
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
}
})



//--------------------------Delete Section---------------------//
app.post("/delete", (req,res) => {
  if (!req.session.user) {
    res.redirect("/")
  } else {
  var id = req.body.id;
  var file = req.body.file;
  var img = req.body.img;
  var trailer = req.body.trailer;
  var sql = `DELETE FROM movies WHERE movie_id="${id}"`;

  if (fs.existsSync("/public/" + file)) {
    fs.unlink("/public/" + file, (err) => {
      if (err) {
          console.error(err);
      } else {
          console.log(`File ${filePath} has been deleted.`);
      }
    });
    } else {
      console.log(`File ${file} does not exist.`);
    }
  if (fs.existsSync("/public/" + img)) {
    fs.unlink("/public/" + img, (err) => {
      if (err) {
          console.error(err);
      } else {
          console.log(`File ${filePath} has been deleted.`);
      }
    });
    } else {
      console.log(`File ${img} does not exist.`);
    }
  if (fs.existsSync("/public/" + trailer)) {
    fs.unlink("/public/" + trailer, (err) => {
      if (err) {
          console.error(err);
      } else {
          console.log(`File ${trailer} has been deleted.`);
      }
     });
    } else {
      console.log(`File ${trailer} does not exist.`);
    }

  connection.query(sql, (err) =>{
    console.log("Entry deleted");
  }) 
  res.redirect("/view");
}
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
  if (!req.session.user) {
    res.redirect("/")
  } else {
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
  res.redirect('/');
}
})

//-------------------------Delete User------------------------//
app.post('/deleteUser', (req, res) => {
  if (!req.session.user) {
    res.redirect("/")
  } else {
  var id = req.body.user;
    var sql = `DELETE FROM user WHERE user_id = ${id}`
  connection.query(sql, (err) => {
    if(err){console.log(err)};
  })
  res.redirect('/');
}
})


app.post('/notify', (req,res) => {
  if (!req.session.user) {
    res.redirect("/")
  } else {
  var message = req.body.message;
  var id = req.body.user;
  var sql = `UPDATE user SET notification = "${message}" WHERE user_id = ${id}`
  connection.query(sql, (err) => {
    if(err){console.log(err)};
  })
  res.redirect('/');
}
})



http.listen(3000 , '192.168.1.7',  () => {
  console.log(`listening on port 3000`);
});