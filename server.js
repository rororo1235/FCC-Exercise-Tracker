const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const router = express.Router();
const cors = require('cors');
const timeout = 10000;
const exerciseTracker = require("./exerciseTracker.js");
const moment = require("moment");
moment().format();
const dateFormart = "YYYY-MM-DD";

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/exercise-track', { useNewUrlParser: true })

app.use(cors())

app.use(bodyParser.urlencoded({
  extended: false
}))
app.use(bodyParser.json())

app.use("/", router);

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

var User = exerciseTracker.UserModel;
var createNewUser = exerciseTracker.createNewUser;
var getUserByUserId = exerciseTracker.getUserByUserId;

router.post("/api/exercise/new-user", (req, res, next) => {
  var t = setTimeout(() => next({ message : "Time Out!" }), timeout);
  createNewUser(req.body.username, (error, data) => {
    clearTimeout(t);
    if(error || !data){ 
      return next(error);
    }
    if(!data) {
      return next({message : "Missing data!"});
    }
    
    getUserByUserId(data._id, (error, user) => {
      if(error || !data){ 
        return next({message : "Failed"});
      }
      return res.json({
        username : user.username,
        userid : user._id
      });
    })
  })
});

var addExerciseToUser = exerciseTracker.addExerciseToUser;
router.post("/api/exercise/add", (req, res, next) => {
  var t = setTimeout(() => next({ message : "Time Out!" }), timeout);
  
  var userId = req.body.userId;
  var description = req.body.description;
  var durationStr = req.body.duration;
  var duration = parseInt(durationStr);
  var dateStr = req.body.date;
  if (!moment(dateStr, dateFormart).isValid()) return next({message : "Date invalid fomart!"});
  if (durationStr != duration) return next({message : "Duration invalid fomart!"});
  var date = new Date(dateStr);
  
  addExerciseToUser(userId, description, duration, date, (error, data) => {
    clearTimeout(t);
    if (error) return next(error);
    if (!data) return next({message : "UserId hasnt existed!"});
    var length = data.exercise.length;
    res.json({
      username : data.username,
      description : data.exercise[length-1].description,
      duration : data.exercise[length-1].duration,
      userId : data._id,
      date : data.exercise[length-1].date,
    });
  })
});

var findUserExercises = exerciseTracker.findUserExercises;
router.get("/api/exercise/log", (req, res, next) => {
  var t = setTimeout(() => next({ message : "Time Out!" }), timeout);
  if (!req.query.userId) return next({message : "User id required!"}); 
  getUserByUserId(req.query.userId, (error, data) => {
    if (error) return next(error);
    if (!data) return next({message : "UserId hasnt existed!"});

    var startDate = null, endDate = null;
    if(req.query.from) {
      if (!moment(req.query.from, dateFormart).isValid()) return next({message : "Date invalid fomart!"});
      startDate = new Date(req.query.from);
    }
    
    if(req.query.to) {
      if (!moment(req.query.to, dateFormart).isValid()) return next({message : "Date invalid fomart!"});
      endDate = new Date(req.query.to);
    }
  
    var limit = req.query.limit ? req.query.limit : 0;
    var logList = [];
    data.exercise.map(e => {
      delete e["_id"];
      var elementDate = new Date(e.date);
      if (elementDate >= startDate && ( endDate ==null || elementDate <= endDate)) logList.push(e);
    })
    if (limit != 0) logList = logList.slice(0,limit);
    
    res.json({
      userId : data._id,
      username : data.username,
      count : logList.length,
      logs: logList
    });
    
  })
});


// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error handler
app.use(function(err, req, res, next) {
  if(err) {
    if(err.message){
      res.status(500).json({
        error : err.message=="Validation failed" ? "Username has existed!" : err.message
      });
    } else
    res.status(500)
      .type('txt')
      .send('SERVER ERROR');
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
