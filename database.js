module.exports = { registerUser, getUserPassword, userIDExists, getAllUsers, getUserRole };
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");

const db = new sqlite3.Database("./lab4.db", sqlite3.OPEN_READWRITE, (err) => {
  if (err) return console.error(err.message);

  console.log('Connected to the SQLite database.');
});

function cleanTable(tableName) {
  db.run(`DELETE FROM ${tableName}`);
  console.log(`Table ${tableName} has been cleaned.`);
}

function getAllUsers() {
  const query = "SELECT * FROM Users"
  return new Promise((resolve, reject) => {
    db.all(query, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}

async function getUserPassword(userID) {
  const query = "SELECT password FROM Users WHERE userID=?"
  return new Promise((resolve, reject) => {
    db.all(query, userID, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res[0].password.toString());
      }
    });
  });
}

async function getUserRole(userID) {
  const query = "SELECT role FROM Users WHERE userID=?"
  return new Promise((resolve, reject) => {
    db.all(query, userID, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res[0].role.toString());
      }
    });
  });
}

async function userIDExists(userID) {
  const query = "SELECT COUNT(*) AS count FROM Users WHERE userID=?"
  const [result] = await new Promise((resolve, reject) => {
    db.all(query, userID, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
  return result.count > 0;
}

async function registerUser(userID, name, password, role) {
  const exists = await userIDExists(userID);
  if (exists) {
    throw new Error(`Username '${userID}' already exists`);
  }

  // Insert the new user
  password = await bcrypt.hash(password, 10)
  const query = "INSERT INTO Users (userID, role, name, password) VALUES (?, ?, ?, ?)";
  return new Promise((resolve, reject) => {
    db.run(query, [userID, role, name, password], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}