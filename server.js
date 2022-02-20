const express = require("express");
const bodyParser = require("body-parser");
const router = require("./app/routes/routes")
const models = require("./app/models/migrations")
const app = express();
const morgan = require("morgan");
const cors = require('cors');

app.use(bodyParser.json());


app.use(morgan("dev"));
app.use(cors());
app.use(function(err,req,res,nex){
  if(err.code ==="LIMIT_FILE_TYPES"){
    res.status(422).json({error:"Solo se permiten archivos de tipo imagen"})
    return
  }
})
router(app);

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to all in one api." });
});

models.testDB();


// set port, listen for requests
const PORT = process.env.PORT || 3500;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});