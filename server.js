const express = require("express");
const app = express();
app.set("view-engine", "ejs");
require("dotenv").config();
const db = require('./database');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cookieParser = require('cookie-parser')

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser())

app.listen(process.env.PORT, (req, res) => {
  console.log("App is listening on " + process.env.PORT + "...");
});

function authenticateToken(req, res, next) {
  if (!req.cookies.userToken) {
    res.redirect("/login");
  } else if (jwt.verify(req.cookies.userToken, process.env.TOKEN_KEY)) {
    next();
  } else {
    res.redirect("/login");
  }
}

function authorizeRoles(roles) {
  return function (req, res, next) {
    try {
      const decryptedToken = jwt.verify(req.cookies.userToken, process.env.TOKEN_KEY);

      if (roles.includes(decryptedToken.role)) {
        next();
      } else {
        currentToken = "";
        res.status(401).render("login.ejs");
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

  const token = jwt.sign(payload, process.env.TOKEN_KEY);
  res.cookie("userToken", token, { httpOnly: true }).status(200).redirect("/users/" + userID);
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

app.get("/users/:userID", authenticateToken, async (req, res) => {
  try {
    const user = await db.getUserInfo(req.params.userID);
    const decryptedToken = jwt.verify(req.cookies.userToken, process.env.TOKEN_KEY);

    if (req.params.userID !== decryptedToken.userID) {
      return res.sendStatus(401);
    }

    switch (user.role) {
      case "student1":
        res.render("student1.ejs");
        break;
      case "student2":
        res.render("student2.ejs");
        break;
      case "teacher":
        res.render("teacher.ejs");
        break;
      case "admin":
        const users = await db.getAllUsers();
        res.render("admin.ejs", { users });
        break;
      default:
        res.status(404).send("User not found");
        break;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

app.get("/student1", authenticateToken, authorizeRoles(["student1", "admin", "teacher"]), (req, res) => {
  res.render("student1.ejs")
})

app.get("/student2", authenticateToken, authorizeRoles(["student2", "admin", "teacher"]), (req, res) => {
  res.render("student2.ejs")
})