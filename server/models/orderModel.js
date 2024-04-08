const mongoose = require("mongoose");
mongoose
  .connect(process.env.MONGO_CONNECTOR)
  .then(() => {
    console.log("Connection established with orderModel");
  })
  .catch((error) => {
    console.log(error);
  });

const orderSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  orderDate: {
    type: Date,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  offerPrice: {
    type: Number,
    required: true,
  },
  orderId: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  paymentMentod: {
    type: String,
    required: true,
  },
  userCacel: {
    type: Number,
    required: true,
  },
  adminCancel: {
    type: Number,
    required: true,
  },
  product: {
    type: String,
    required: true,
  },
  quentity: {
    type: Number,
    required: true,
  },
  img: {
    type: String,
    required: true,
  },
  address: {
    houseName: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    pincode: {
      type: Number,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
  },
  returnreason: {
    type: String,
  },
  cancel: {
    type: String,
  },
  returnStatus: {
    type: Number,
  },
  amountPaid: {
    type: Number,
  },
});

module.exports = mongoose.model("orderDetails", orderSchema);
