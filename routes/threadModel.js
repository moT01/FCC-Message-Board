const mongoose = require(`mongoose`);

var Schema = mongoose.Schema;

var threadSchema = new Schema({
  board: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  created_on: {
    type: Date,
    required: true
  },
  bumped_on: {
    type: Date,
    required: true
  },
  reported: {
    type: Boolean,
    required: true,
    default: false
  },
  delete_password: {
    type: String,
    required: true
  },
  replies: [{
    _id: {
      type: String,
      required: true
    },
    text: {
      type: String
    },
    delete_password: {
      type: String,
      require: true
    },
    reported: {
      type: Boolean,
      default: false
    },
    created_on: {
      type: Date,
      required: true
    }
  }]
})

module.exports = mongoose.model(`threadModel`, threadSchema);