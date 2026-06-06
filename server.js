const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const router = require("./app/routes/routes")
const models = require("./app/models/migrations")
const app = express();
const morgan = require("morgan");
const cors = require('cors');

app.use(bodyParser.json());

// Trust the first proxy (e.g. nginx in Contabo) so req.ip resolves the real client IP
// for legal consent audit trail
app.set('trust proxy', 1);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve legal documents (privacy policy, data treatment consent, etc.)
app.use('/legal', express.static(path.join(__dirname, 'legal')));

app.use(morgan("dev"));
app.use(cors());
app.use(function(err,req,res,next){
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

const PORT = process.env.PORT || 3500;

const startServer = async () => {
  try {
    await models.testDB();
  } catch (error) {
    console.error('Error al conectar o migrar la base de datos:', error.message);
    console.error('Reinicia la API cuando MySQL esté disponible o ejecuta: npm run migrate');
  }

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
  });
};

startServer();