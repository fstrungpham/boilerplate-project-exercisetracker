const express = require("express");
const app = express();
const cors = require("cors");
const ObjectId = require("mongo-objectid");
const dbLocal = require("db-local");
const { Schema } = new dbLocal({ path: "./databases" });

require("dotenv").config();

const User = Schema("User", {
  _id: { type: String, required: true },
  username: String,
});

let Exercise = Schema("Exercise", {
  user_id: { type: String, required: true },
  username: {
    type: String,
    required: true,
  },
  description: String,
  duration: Number,
  date: String,
});

app.use(cors());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/api/users", (req, res) => {
  const users = User.find();
  if (!users) {
    res.send("No users");
  } else {
    res.json(users);
  }
});

app.post("/api/users", (req, res) => {
  console.log(req.body);
  try {
    const id = new ObjectId();
    const user = User.create({
      _id: id.toString(),
      username: req.body.username,
    }).save();
    console.log(user);
    res.json(user);
  } catch (err) {
    console.log(err);
  }
});

app.post("/api/users/:_id/exercises", (req, res) => {
  var userId = req.params._id;
  var description = req.body.description;
  var duration = req.body.duration ? Number.parseInt(req.body.duration) : 0;
  try {
    const user = User.findOne({ _id: userId });
    console.log(user);
    if (!user) {
      res.send("Could not find user");
    } else {
      const exercise = Exercise.create({
        user_id: user._id,
        username: user.username,
        description: description,
        duration: duration,
        date: req.body.date
          ? new Date(req.body.date).toDateString()
          : new Date().toDateString(),
      }).save();

      res.json({
        _id: user._id,
        username: user.username,
        description: exercise.description,
        date: new Date(exercise.date).toDateString(),
      });
    }
  } catch (err) {
    console.log(err);
    res.send("There was an err saving the exercise");
  }
});

app.get("/api/users/:_id/exercises", (req, res) => {
  var userId = req.params._id;
  try {
    const exercise = Exercise.find({ user_id: userId });
    console.log(exercise);
    res.json(exercise);
  } catch (err) {
    console.log(err);
    res.send("There was an err getting the exercise");
  }
});

app.get("/api/users/:_id/logs", (req, res) => {
  const id = req.params._id;
  const from = req.query.from || new Date(0).toISOString().substring(0, 10);
  const to =
    req.query.to || new Date(Date.now()).toISOString().substring(0, 10);
  const limit = Number(req.query.limit) || 0;
  const user = User.findOne({ _id: id });
  if (!user) {
    res.send("Could not find user");
    return;
  }
  let dateObj = {};
  if (to) {
    dateObj["$lte"] = new Date(to);
  }
  if (from) {
    dateObj["$gte"] = new Date(from);
  }
  let filter = {
    user_id: id,
  };
  if (from || to) {
    filter.date = dateObj;
  }

  const exercises = Exercise.find({ user_id: user._id, $limit: +limit ?? 500 });

  const log = exercises.map((e) => ({
    description: e.description,
    duration: e.duration,
    date: e.date.toDateString(),
  }));

  res.json({
    username: user.username,
    count: exercises.length,
    _id: user._id,
  });
});

app.get("/api/users/delete", function (_req, res) {
  try {
    User.remove((user) => true);
    res.json("All users have been deleted!");
  } catch (err) {
    res.json("err:" + err);
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
