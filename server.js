require('dotenv').config()

const express = require('express');
// const fileUpload = require("express-fileupload")
// const compression = require('compression')
const mongoose = require("mongoose");
const cors = require("cors")
// const userRoutes = require('./routes/user')
// const walletRoutes = require('./routes/wallet')
const path = require("path");

mongoose.set('strictQuery', true);
// express app
const app = express();
//compression
// app.use(compression());
// cors settings
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:4000"],
    credentials: true,
  })
);
// app.use(express.json());
// app.use(fileUpload({
//   useTempFiles: true,
//   tempFileDir: path.join(__dirname, 'tmp'),
//   createParentPath: true,
// }))


// //connect database
mongoose.connect(process.env.MDB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology : true
})
.then(()=> {
    app.listen(process.env.PORT, () => {
        console.log('connected to database successfully and listening on port', process.env.PORT);
    })
})
.catch((err) => console.log(err));


////use static for csss and other files
app.use(express.static('public'))
app.use("/uploads", express.static('./uploads'))

app.get("/", (req, res) => {
  res.sendFile('./views/index.html', {root : __dirname});
});
