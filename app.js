const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/secrets", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.on("error", function (error) {
  console.error("MongoDB connection error:", error);
});
mongoose.connection.once("open", function () {
  console.log("Connected to MongoDB");
});

// Define Mongoose Schema
const trySchema = new mongoose.Schema({
  email: String,
  password: String,
});

const secret = "thisislittlesecret.";
trySchema.plugin(encrypt, { secret: secret, encryptedFields: ["password"] });

// Define Mongoose Model
const User = mongoose.model("User", trySchema);

// Routes
app.get("/", function (req, res) {
  res.render("home");
});

app.post("/register", async function (req, res) {
  const email = req.body.username;
  const password = req.body.password;

  try {
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      res
        .status(400)
        .send("Email already registered. Please use a different email.");
    } else {
      const newUser = new User({
        email: email,
        password: password,
      });
      await newUser.save();
      res.render("secrets");
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/login", async function (req, res) {
  const username = req.body.username;
  const password = req.body.password;

  try {
    const foundUser = await User.findOne({ email: username });

    if (foundUser) {
      if (foundUser.password === password) {
        res.render("secrets");
      } else {
        res.status(401).send("Invalid password");
      }
    } else {
      res.status(401).send("User not found");
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});

// Start server
const PORT = 4000;
app.listen(PORT, function () {
  console.log(`Server started on port ${PORT}`);
});
