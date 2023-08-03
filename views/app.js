require ('dotenv').config ();
const express = require('express');
const app = express();
const http = require('http').createServer(app);
var SocketIOFileUpload = require('socketio-file-upload');
const io = require('socket.io')(http);
var mysql = require('mysql');
var fs = require('fs');
var sha256 = require('js-sha256');
var session = require('cookie-session');
const bodyParser = require('body-parser');
var cron = require('node-cron');
var multer = require('multer');
var cors = require('cors')

app.set('view engine', 'ejs');
app.use(SocketIOFileUpload.router).listen(process.env.PORT || 8080);
app.use(express.static('public'));
app.set('trust proxy', 1);
app.use(session({secret: process.env.SECRET, resave: false,saveUninitialized: true}));
app.use(bodyParser.urlencoded({extended:true}));
// Enable CORS with specific origins
app.use(cors({
  'allowedHeaders': ['sessionId', 'Content-Type'],
  'exposedHeaders': ['sessionId'],
  'origin': '*',
  'methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
  'preflightContinue': false
}));




//------------------Multer Section-------------------//
const storage = multer.diskStorage({ 
  destination: function (req, file, cb) {
    cb(null, __dirname + 'public/uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
 }) 
 const upload = multer({ storage: storage })

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




//------------------History Section-------------------//

var date = new Date();
var task = cron.schedule('0 0  1 */ *',() => {
  
  connection.query("SELECT movie_id,view_count FROM movies", (err, views) => {
    for (let i = 0; i < views.length; i++) {
      var sql = `UPDATE movies SET pre_month_views = ${views[i].view_count} WHERE movie_id = ${views[i].movie_id}`
      connection.query(sql, (err) => {
        if (err) {
          console.log(err);
        }
      })
    }
  })

var sql = `SELECT client_name, client_id, SUM((view_count-pre_month_views) * price_per_view) AS total_bill, SUM(view_count - pre_month_views) AS total_views FROM movies GROUP BY client_name`;
connection.query(sql, (err, result) =>{
  for (let i = 0; i < result.length; i++) {
  sql = `INSERT INTO history(client_id, client_name, total_views, total_bill) VALUES( ${result[i].client_id}, '${result[i].client_name}', ${result[i].total_views}, ${result[i].total_bill})`
  connection.query(sql, (err) =>{
    if (err) {
      console.log("Something went wrong!");
    }
  })
  }
})
  
});

var daily = cron.schedule('0 0  */ * *', () => {
  var date = new Date();
  date = date.toString().slice(0, 15);
  connection.query(`SELECT user_id, sub_end_date FROM user`, (err, result) => {
    for (let i = 0; i < result.length; i++) {
    if (result[i].sub_end_date == date) {
      var sql = `UPDATE user SET sub_plan = "", sub_status = "inactive", sub_purch_date = "", sub_end_date = "" WHERE user_id = ${result[i].user_id}`;
    connection.query(sql);
    }
  }
  })
  
});
daily.start()
task.start()






//------------------Upload Section-------------------//


app.get('/upload', (req, res) => {
  if (!req.session.user) {
    res.redirect("/");
  } else {
    var sql = "SELECT * FROM clients";
    connection.query(sql, (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.render('upload', {trigger:0, result:result});
      }
    })
  }
  
})


var movieName = "";
var imageName = "";
var trailerName = "";
io.sockets.on("connection", function(socket, err){
    
      var uploader = new SocketIOFileUpload();
      uploader.listen(socket);
      uploader.dir = __dirname + "/public/uploads";
      uploader.on("start", function(event){
          if (fs.existsSync(__dirname + "/public/uploads/" + event.file.name)) {
            fs.unlink(__dirname + "/public/uploads/" + event.file.name, function(err){
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
        fs.unlink(__dirname + "/public/uploads/" + event.file[0].name, function(err){
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
  client = client.split("/");
  var price = req.body.price;
  var video = "localhost:3000/file?name=" + movieName;
  var img = "localhost:3000/file?name=" + imageName;
  var trailer = "localhost:3000/file?name=" + trailerName;
  var sql = `SELECT * FROM movies WHERE trailer = "${trailer}"`;
  connection.query(sql , (err, out) => {
    if (out.length > 0) {
      var sql = "SELECT * FROM clients";
    connection.query(sql, (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.render('upload', {trigger:1, result:result});
      }
    })
    } else {
      var sql = `INSERT INTO movies(title,director_name,producer_name,actor_name,client_name,client_id,story,language,file_name,category,price_per_view,thumb_file_name,trailer) VALUES (${title},${director},${producer},${actor},${client[0]},${client[1]},${story},${language},${video},${category},${price},${img},${trailer});`;
      connection.query(sql, (err) => {
        if (err) {
          res.redirect('/');
        } else {
          res.redirect('/view');
        }
      })
    }
    
    })
    
  
    }
    
    
  });


//-----------------clients Section-----------------//

app.get("/newclient", (req, res) => {
  if (!req.session.user) {
    res.redirect("/");
  } else {
    res.render("newclient", {trigger:0});
  }
})

app.post("/newclient", upload.fields([{ name: 'Aadhar', maxCount: 1 }, { name: 'Pan', maxCount: 1 }]), (req, res) => {
  if (!req.session.user) {
    res.redirect("/")
  } else {
  var name = req.body.name;
  var contact = req.body.contact;
  var email = req.body.email;
  var aadhar = req.files.Aadhar[0].destination +"/"+ req.files.Aadhar[0].originalname;
  var pan = req.files.Pan[0].destination +"/"+ req.files.Pan[0].originalname;
  var sql = `INSERT INTO clients(Id, name, client_contact, client_email, aadhar, pan) VALUES ('', '${name}','${contact}','${email}', '${aadhar}', '${pan}')`;
  connection.query(sql, (err) => {
    if (err) throw err;
  })
  res.redirect("clients");
}
})

app.get('/clients', (req, res) => {
  if (!req.session.user) {
    res.redirect("/")
  } else {
    var sql = `SELECT * FROM clients`;
    connection.query(sql, (err, clients) => {
      if (err) {
        res.redirect("/");
      } else{
        var sql = `SELECT * FROM movies`;
        connection.query(sql, (err, movies) => {
          if (err) {
            res.redirect("/");
          } else{
            var sql = `SELECT * FROM history`;
            connection.query(sql, (err, history) => {
              if (err) {
                res.redirect("/");
              } else{
              res.render("clients", {result:clients, movies:movies, history:history});
              }
            })
          }
        })
      }
    })
      
  }
  
});

app.post("/clientMovies", (req, res) => {
  if (!req.session.user) {
    res.redirect("/")
  } else {
    var numrows = 0;
    var clientName = req.body.name;
    connection.query(`SELECT COUNT(*) FROM movies WHERE client_name = "${clientName}";`, (err, result) => {
      if (err) throw err;
      numrows = result[0]["COUNT(*)"];
    })
    var page = req.query.page ? Number(req.query.page) : 1;
    var start = (20 * (page - 1));
    var end = 20;
    var sql = `SELECT * FROM movies WHERE client_name = "${clientName}" LIMIT ${start}, ${end}`;
    connection.query(sql, (err, rows) => {
      if (err) throw err;
      res.render("view", {rows: rows, page: page, start: start, end: end, numrows:numrows}); 
    });
  }
})

app.post("/deleteClient", (req, res) => {
  if (!req.session.user) {
    res.redirect("/")
  } else {
  var clientid = req.body.id;
  var sql = `SELECT * FROM clients WHERE Id = ${clientid}`;
  connection.query(sql, (err, result) => {
    var sql = `INSERT INTO recycle (Id, name, client_contact, client_email, aadhar, pan) VALUES ('${result[0].Id}', '${result[0].name}','${result[0].client_contact}','${result[0].client_email}', '${result[0].aadhar}', '${result[0].pan}')`
    connection.query(sql, (err) => {  
      connection.query(`DELETE FROM clients WHERE Id = ${clientid}`, (err) => {
        if(err){
          res.redirect('/clients');
        }
        res.redirect('/clients');
      })
    });  
  });
  }
});

app.post("/restore", (req, res) => {
  if (!req.session.user) {
    res.redirect("/")
  } else {
  var id = req.body.id;
  var name = req.body.name;
  var contact = req.body.contact;
  var email = req.body.email;
  var aadhar = req.body.aadhar;
  var pan = req.body.pan;
  var sql = `INSERT INTO clients(Id, name, client_contact, client_email, aadhar, pan) VALUES (${id}, '${name}', '${contact}', '${email}', '${aadhar}', '${pan}')`
  connection.query(sql, (err) => {
    connection.query(`DELETE FROM recycle WHERE Id = ${id}`)
  })
  res.redirect("/clients")
}
});

app.post("/editClient", (req, res) => {
  if (!req.session.user) {
    res.redirect("/")
  } else {
  var id = req.body.id;
  var name = req.body.name;
  var contact = req.body.contact;
  var email = req.body.email;
  var client = `UPDATE clients SET name ='${name}',client_contact ='${contact}',client_email ='${email}' WHERE Id = ${id}`;
  connection.query(client, (err) => {
    if (err) {
      res.send("something went wrong!")
    }
  })
  var movies = `UPDATE movies SET client_name ='${name}' WHERE client_id = ${id}`;
  connection.query(movies, (err) => {
    if (err) {
      res.send("something went wrong!")
    }
  })
  var history = `UPDATE history SET client_name ='${name}' WHERE client_id = ${id}`;
  connection.query(history, (err) => {
    if (err) {
      res.send("something went wrong!")
    }
  })
  res.redirect('/clients');
}
})

app.post("/updateAadhar",upload.single("Aadhar"), (req,res) => {
  if (fs.existsSync(req.body.loc)) {
    fs.unlinkSync(req.body.loc)
  }else{
    console.log("File does not exist");
  }
  var sql = `UPDATE clients SET aadhar = "${req.file.destination +"/"+ req.file.originalname}" WHERE Id = ${req.body.id}`
  connection.query(sql, (err) => {
    if (err) {
     res.send("Something went wrong!")
    }
  })

  res.redirect('/clients');
})
app.post("/updatePan",upload.single("Pan"), (req,res) => {
  if (fs.existsSync(req.body.loc)) {
    fs.unlinkSync(req.body.loc)
  }else{
    console.log("File does not exist");
  }
  var sql = `UPDATE clients SET pan = "${req.file.destination +"/"+ req.file.originalname}" WHERE Id = ${req.body.id}`
  connection.query(sql, (err) => {
    if (err) {
      res.send("Something went wrong!")
    }
  })
  
    res.redirect('/clients');
  })



app.post("/aadhar", (req, res) => {
  res.sendFile(__dirname + "/" + req.body.aadhar)
})
app.post("/pan", (req, res) => {
  res.sendFile(__dirname + "/" + req.body.pan)
})

app.get("/recycle", (req,res) => {
  connection.query(`SELECT * FROM recycle`, (err,result) => {
    res.render("recycle", {result:result})
  })
  
})


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
  var price = req.body.price;
  var file = req.body.file;

  var sql = `UPDATE movies SET title='${title}', director_name='${director}', producer_name='${producer}', actor_name='${actor}',client_name='${client}',price_per_view='${price}', story='${story}', language='${language}', category='${category}' WHERE file_name='${file}';`;
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

  if (fs.existsSync("public/" + file)) {
    fs.unlinkSync("public/" + file)
  }else{
    console.log("File does not exist");
  }

  if (fs.existsSync("public/" + img)) {
    fs.unlinkSync("public/" + img)
  }else{
    console.log("File does not exist");
  }

  if (fs.existsSync("public/" + trailer)) {
    fs.unlinkSync("public/" + trailer)
  }else{
    console.log("File does not exist");
  }
  connection.query(sql, (err) =>{
    if (err) {
      res.redirect("/view");
    }
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
    var userCount = 0;
    var clientCount = 0;
    var movieCount = 0;
    var user = `SELECT COUNT(*) FROM user`;
        connection.query(user, (err, row) => {
          userCount = row[0]['COUNT(*)'];
        });
    var client = `SELECT COUNT(*) FROM clients`;
        connection.query(client, (err, row) => {
          clientCount = row[0]['COUNT(*)']; 
        });
    var movie = `SELECT COUNT(*) FROM movies`;
        connection.query(movie, (err, row) => {
          movieCount = row[0]['COUNT(*)']; 
          res.render("dashboard", {userCount:userCount, clientCount:clientCount, movieCount:movieCount});
        });
  }
});


app.get("/logout", (req, res) => {
  req.session.user = 0;
  res.redirect("/");
})

app.post("/login", (req, res) => {
  var id = req.body.loginid;
  var pass = sha256(req.body.password);
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


//------------------------- User------------------------//

app.get("/user", (req, res) => {
  if (!req.session.user) {
    res.redirect("/")
  } else {
        var sql = `SELECT * FROM user`;
        connection.query(sql, (err, rows) => {
          connection.query(`SELECT p_name, dur_month FROM sub_package`, (err, result) => {
            res.render("users", {rows:rows, result:result}); 
          })
        });
  }
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
    if(err){console.log(res.redirect('/user'))};
    res.redirect('/user');
  })
  
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
    if(err){console.log(res.redirect('/user'))};
  })
  res.redirect('/user');
}
})

app.post('/activateUser', (req, res) => {
  if (!req.session.user) {
    res.redirect("/")
  } else {
  var user = req.body.id;
  var duration = req.body.dur;
  var currDate = new Date()
  var nextDate = new Date()
  nextDate.setDate(nextDate.getDate() + parseInt(duration))
  var sql = `UPDATE user SET sub_plan = "${duration + " days"}", sub_status = "active", sub_purch_date = "${currDate.toString().slice(0,15)}", sub_end_date = "${nextDate.toString().slice(0,15)}" WHERE user_id = ${user}`;
  connection.query(sql, (err) => {
    res.redirect("/user");
  })
}
})

app.post('/deactivate', (req, res) => {
  if (!req.session.user) {
    res.redirect("/")
  } else {
    var user = req.body.id
    var sql = `UPDATE user SET sub_plan = "", sub_status = "inactive", sub_purch_date = "", sub_end_date = "" WHERE user_id = ${user}`;
    connection.query(sql, (err) => {
      res.redirect("/user");
    })
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
    if(err){console.log(res.redirect('/user'))};
  })
  res.redirect('/user');
}
})



//-----------------Package Section-----------------//
app.get("/package", (req, res) => {
  if (!req.session.user) {
    res.redirect("/")
  } else {
    connection.query(`SELECT * FROM sub_package`, (err,result) => {
      res.render("package", {result:result})
    })
  
  }
})

app.post("/addPack", (req,res) => {
  if (!req.session.user) {
    res.redirect("/")
  } else {
  var name = req.body.name;
  var price = req.body.price;
  var time = req.body.time;
  connection.query(`INSERT INTO sub_package(id, p_name, price, dur_month) VALUES ('', '${name}', '${price}', '${time}')`)
  res.redirect("/package");
  }
})

app.post("/editPack", (req,res) => {
  if (!req.session.user) {
    res.redirect("/")
  } else {
  var name = req.body.name;
  var price = req.body.price;
  var time = req.body.time;
  var id = req.body.id
  connection.query(`UPDATE sub_package SET p_name = '${name}',price = '${price}',dur_month ='${time}' WHERE id = ${id}`)

  res.redirect("/package");
  }
})
app.post("/deletePack", (req,res) => {
  if (!req.session.user) {
    res.redirect("/")
  } else {
  var id = req.body.id
  connection.query(`DELETE FROM sub_package WHERE id = ${id}`)

  res.redirect("/package");
  }
})

//-----------------movie render-------------//
app.get('/file', (req, res) => {
    var name = req.query.name ? String(req.query.name) : "0";
    console.log(name);
    res.sendFile(name, { root: __dirname + "/public/uploads/"});
  
});

http.listen(process.env.PORT || 3000 , () => {
  console.log(`listening on port 3000`);
});