const { config } = require("dotenv");
config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const User = require("./models/User");
const bcrypt = require("bcryptjs");
const app = express();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const salt = bcrypt.genSaltSync(10);
const secret = process.env.SECRET;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

mongoose.connect(MONGO_URL).then(() => {
  console.log("listening on port 4000");
  app.listen(4000);
});
