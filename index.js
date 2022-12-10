const express = require('express');
const multer = require('multer');
const app = express();

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
    res.send("Uploaded")
});


app.listen(process.env.PORT || 3000, () => {
  console.log(`listening on port 3000`)
});





//http://localhost:8080/filmmoz/upload_movie.php?title=" +title+ "&director_name=" +dirname+ "&actor_name=" +actor+ "&producer_name=" +producer+ "&story=" +story+ "&language=" +language+ "&category=" +category+ "&client_name=" +clientname+ "&cost=" +cost+ "&director_name=kiran patil