const mongoose = require("mongoose");

mongoose
  .connect(process.env.MONGO_CONNECTOR)
  .then(() => {
    console.log("Connection established with categoryModel");
  })
  .catch((error) => {
    console.log(error.message);
  });

const categoryData = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    required: true,
  },

  hide: {
    type: Number,
    required: true,
  },
});

const catData = mongoose.model("category", categoryData);
module.exports = catData;