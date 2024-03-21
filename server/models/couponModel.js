const mongoose = require("mongoose");
require("dotenv").config();
mongoose
  .connect(process.env.MONGO_CONNECTOR)
  .then(() => {
    console.log("Connection established with couponModel");
  })
  .catch((error) => {
    console.log(error);
  });
  
  const couponSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    expiry:{
        type:Date,
        required:true
    },
    discount:{
        type:Number,
        required:true
    },
    minimumAmount:{
        type:Number,
        required:true
    }
    
})

module.exports = mongoose.model('couponDetails',couponSchema)