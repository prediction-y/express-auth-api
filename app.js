const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const path = require("path");
const app = express();
app.use(express.json());
let db = null;
const port = 3000;
const dbFilePath = path.join(__dirname, "./userData.db");

const connectDbWithServer = async () => {
  try {
    db = await open({
      filename: dbFilePath,
      driver: sqlite3.Database,
    });
    app.listen(port, () => {
      console.log(`Server Started..!`);
    });
  } catch (error) {
    console.log(`Database Connection Failed : ${error.message}`);
  }
};

connectDbWithServer();

app.get("/register", async (req, res) => {
  let getUserQuery = `SELECT * FROM user`;
  let dbResponse = await db.all(getUserQuery);
  res.send(dbResponse);
});

app.post("/register", async (req, res) => {
  const { username, name, password, gender, location } = req.body;
  let checkUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  let checkInDataBase = await db.get(checkUserQuery);
  if (checkInDataBase === undefined) {
    if (password.length < 5) {
      res.status(400);
      res.send(`Password is too short`);
    } else {
      let hashedPassword = await bcrypt.hash(password, 10);
      let createNewUser = `INSERT INTO user (username,name,password,gender,location)
      VALUES ('${username}','${name}','${hashedPassword}','${gender}','${location}')`;
      let insertInDataBase = await db.run(createNewUser);
      res.status(200);
      res.send(`User created successfully`);
    }
  } else {
    res.status(400);
    res.send(`User already exists`);
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  let getUserDetails = `SELECT * FROM user WHERE username = '${username}'`;
  let checkInDb = await db.get(getUserDetails);
  if (checkInDb === undefined) {
    res.status(400);
    res.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      checkInDb.password
    );

    if (isPasswordMatched) {
      res.status(200);
      res.send("Login success!");
    } else {
      res.status(400);
      res.send("Invalid password");
    }
  }
});

app.put("/change-password", async (req, res) => {
  let { username, oldPassword, newPassword } = req.body;
  let getUserDetail = `SELECT * FROM user WHERE username = '${username}'`;
  let dbResponse = await db.get(getUserDetail);
  const isPasswordCheck = await bcrypt.compare(
    oldPassword,
    dbResponse.password
  );
  console.log(isPasswordCheck);
  let oldPasswordHash = await bcrypt.hash(oldPassword, 10);
  if (!isPasswordCheck) {
    res.status(400);
    res.send(`Invalid current password`);
  } else {
    if (newPassword.length < 5) {
      res.status(400);
      res.send(`Password is too short`);
    } else {
      let newPasswordHash = await bcrypt.hash(newPassword, 10);
      let updatePasswordQuery = `UPDATE user SET password = '${newPasswordHash}' WHERE username = '${username}'`;
      let dbResponse = await db.run(updatePasswordQuery);
      res.status(200);
      res.send(`Password updated`);
    }
  }
});

module.exports = app;
