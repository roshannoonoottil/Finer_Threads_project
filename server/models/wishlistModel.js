const mongoose = require("mongoose");
require("dotenv").config();
mongoose
  .connect(process.env.MONGO_CONNECTOR)
  .then(() => {
    console.log("Connection established with wishlistModel");
  })
  .catch((error) => {
    console.log(error);
  });

const wishSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  product: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  rate: {
    type: Number,
    requrd: true,
  },
  discountAmount: {
    type: Number,
  },
  offer: {
    type: Number,
  },
  stock: {
    type: Number,
    required: true,
    trim: true,
  },
});

module.exports = mongoose.model("wishDetails", wishSchema);
