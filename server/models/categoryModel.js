const mongoose = require("mongoose");
require("dotenv").config();
mongoose
  .connect(process.env.MONGO_CONNECTOR)
  .then(() => {
    console.log("Connection established with categoryModel");
  })
  .catch((error) => {
    console.log(error);
  });
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  list: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model("categoryDetails", categorySchema);
