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
  } else {
    res.redirect("/login")
  }
}

function authorizeRoles(roles) {
  return function (req, res, next) {
    try {
      const decryptedToken = jwt.verify(currentToken, process.env.TOKEN_KEY);

      if (roles.includes(decryptedToken.role)) {
        next();
      } else {
        console.log("You dont have access to this page.")
        currentToken = "";
        res.redirect("/login");
      }
    } catch (error) {
      console.log(error);
    }
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

  const role = await db.getUserRole(userID);

  const payload = {
    userID: userID,
    role: role
  }

  currentToken = jwt.sign(payload, process.env.TOKEN_KEY);
  res.redirect("/start");
  //res.render('start.ejs');
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

app.get("/start", authenticateToken, (req, res) => {
  res.render("start.ejs")
})

app.get("/admin", authenticateToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.render("admin.ejs", { users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/teacher", authenticateToken, authorizeRoles(["admin", "teacher"]), (req, res) => {
  res.render("teacher.ejs")
})