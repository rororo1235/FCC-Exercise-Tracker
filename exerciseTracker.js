const mongoose = require("mongoose");
const ShortId = require("shortid");
const BeautifyUnique = require('mongoose-beautiful-unique-validation');


mongoose.set("useFindAndModify", false);
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true});

var exerciseSchema = new mongoose.Schema({
  description : {
    type: String,
    required: true
  },
  duration : {
    type: Number,
    required: true
  },
  date : {
    type : Date,
    required: true,
    default: Date.now
  }
}); 

var userSchema = new mongoose.Schema({
  _id : {
    type : String,
    default : ShortId.generate
  },
  username : {
    type: String,
    required: true, 
    unique: "Username has existed!"
  },
  exercise : [exerciseSchema]
});
userSchema.plugin(BeautifyUnique);

const User = mongoose.model("User", userSchema);

const createUser = (username, done) => {
  const newUser = new User({
    username : username,
    exercise : []
  });
  newUser.save((error, data) => {
    if (error)
      done(error);
    done(null, data);
  })
}

const getUserById = (userId, done) => {
  User.findById(userId, (error, data) => {
    if(error) done(error);
    done(null, data);
  });
}

const addExercise = (userId, description, duration, date, done) => {
  User.findById(userId, (error, data) => {
    if (error) done(error);
    else {
      data.exercise.push({
        description : description, 
        duration : duration, 
        date : date
      });
      data.save((error, data) => {
        if (error) done(error);
        done(null, data);
      })
    }
  })
}

const findUserExercises = (searchInfo, limit = 0, done) => {
  User.find(searchInfo).sort({date :  1}).limit(limit).exec((error, data) => {
    if(error) done(error);
    done(null, data)
  });
}

exports.UserModel = User;
exports.createNewUser = createUser;
exports.getUserByUserId = getUserById;
exports.addExerciseToUser = addExercise;
exports.findUserExercises = findUserExercises;