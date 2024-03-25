const mongoose = require("mongoose");
require("dotenv").config();
mongoose
  .connect(process.env.MONGO_CONNECTOR)
  .then(() => {
    console.log("Connection established with cartModel");
  })
  .catch((error) => {
    console.log(error);
  });
const cartSchema = new mongoose.Schema({
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
    required: true,
  },
  quentity: {
    type: Number,
    required: 1,
  },
  offerPrice: {
    type: Number,
  },
  offer: {
    type: Number,
  },
});

module.exports = mongoose.model("cartDetails", cartSchema);
