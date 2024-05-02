const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const ObjectId = require("mongo-objectid");
const dbLocal = require("db-local");
const { Schema } = new dbLocal({ path: "./databases" });

require("dotenv").config();

const User = Schema("User", {
  _id: { type: String, required: true },
  username: String,
});

let Exercise = Schema("Exercise", {
  userId: { type: String, required: true },
  username: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: {
    type: Date,
  },
});

app.use(cors());
app.use(express.static("public"));
//app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: "false" }));
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
  console.log(userId);
  console.log(description);
  try {
    const inputData = {
      userId: userId,
      username: "none user",
      description: description,
      duration: duration,
      date: req.body.date
        ? new Date(req.body.date).toDateString()
        : new Date().toDateString(),
    };

    const user = User.findOne({ _id: userId });
    console.log(user);
    if (user) {
      inputData["userId"] = user._id;
      inputData["username"] = user.username;
      const exercise = Exercise.create({
        userId: user._id,
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
        duration: exercise.duration,
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
    const exercise = Exercise.find({ userId: userId });
    console.log(exercise);
    res.json(exercise);
  } catch (err) {
    console.log(err);
    res.send("There was an err getting the exercise");
  }
});

app.get("/api/users/:_id/logs", (req, res) => {
  try {
    const id = req.params._id;

    const user = User.findOne({ _id: id });
    if (!user) {
      res.send("Could not find user");
      return;
    }

    let exercises = Exercise.find({
      userId: user._id,
    });

    if (Boolean(req.query.from || req.query.to)) {
      const from = req.query.from
        ? req.query.from
        : new Date(0).toISOString().substring(0, 10);
      const to = req.query.to
        ? req.query.to
        : new Date(Date.now()).toISOString().substring(0, 10);

      console.log(`Filter from: ${from}, to: ${to}`);
      exercises = exercises.filter(
        (user) =>
          new Date(user.date) >= new Date(from) &&
          new Date(user.date) <= new Date(to),
      );
    }

    let subarr = exercises;
    //const exercises = Exercise.find({
    //  userId: user._id,
    //  date: {
    //    $lte: new Date(to),
    //    $gte: new Date(from),
    //  },
    //  $limit: limit,
    //});

    console.log(`Filter rs1:`);
    console.log(subarr);
    if (Boolean(req.query.limit)) {
      subarr = exercises.splice(0, Math.ceil(Number(req.query.limit)));
    }
    console.log(`Filter rs2:`);
    console.log(subarr);

    let log = [];
    if (subarr && subarr.length > 0) {
      subarr.forEach((item, index) => {
        log.push({
          description: item.description,
          duration: item.duration,
          date: new Date(item.date).toDateString(),
        });
      });
    }

    console.log(`Filter log:`);
    console.log(log);
    res.json({
      username: user.username,
      count: subarr ? subarr.length : 0,
      _id: user._id,
      log: log,
    });
  } catch (err) {
    console.log(err);
    res.send("There was an err getting the logs");
  }
});

app.get("/api/users/delete", function (_req, res) {
  try {
    User.remove((user) => true);
    res.json("All users have been deleted!");
  } catch (err) {
    res.json("err:" + err);
  }
});

app.get("/api/exercises/delete", function (_req, res) {
  try {
    Exercise.remove((exercise) => true);
    res.json("All exercises have been deleted!");
  } catch (err) {
    res.json("err:" + err);
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
