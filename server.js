const express = require("express");
const app = express();
app.set("view-engine", "ejs");
require("dotenv").config();
const db = require('./database');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

let currentToken = "";

app.use(express.urlencoded({ extended: false }));

app.listen(process.env.PORT, (req, res) => {
  console.log("App is listening on " + process.env.PORT + "...");
});

function authenticateToken(req, res, next) {
  if (currentToken === "") {
    res.redirect("/login");
  } else if (jwt.verify(currentToken, process.env.TOKEN_KEY)) {
    next();
    // res.cookie("jwt", token, { httpOnly: true }).status(200).render('start.ejs');
  } else {
    res.redirect("/login")
  }
}

app.get("/", (req, res) => {
  res.redirect("/login");
})

app.get("/login", (req, res) => {
  res.render("login.ejs")
})

app.post("/login", async (req, res) => {
  const { userID, password } = req.body;
  const userExist = await db.userIDExists(userID);
  if (!userExist) {
    return res.render("fail.ejs")
  }

  const userPw = await db.getUserPassword(userID);
  const passwordMatch = await bcrypt.compare(password, userPw);
  if (!passwordMatch) {
    return res.render("fail.ejs")
  }

  currentToken = jwt.sign(userID, process.env.TOKEN_KEY);
  res.render('start.ejs');
});

app.get("/register", (req, res) => {
  res.render("register.ejs")
})

app.post("/register", async (req, res) => {
  if (req.body.userID != "" && req.body.name != "" && req.body.password != "" && req.body.role != "") {
    try {
      await db.registerUser(req.body.userID, req.body.name, req.body.password, req.body.role)
      res.redirect("/");
    } catch (error) {
      console.log("Error registering user:", error);
      res.status(500).send("Error registering user");
    }
  } else {
    res.status(400).send("Invalid username or password");
  }
});

app.get("/admin", authenticateToken, (req, res) => {
  res.render("admin.ejs")
})

app.get("/start", authenticateToken, (req, res) => {
  res.render("start.ejs")
})