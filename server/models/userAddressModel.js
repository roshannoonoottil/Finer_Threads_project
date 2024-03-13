const mongoose = require("mongoose");
mongoose
  .connect(process.env.MONGO_CONNECTOR)
  .then(() => {
    console.log("Connection established with userAddressModel");
  })
  .catch((error) => {
    console.log(error);
  });

  const userAddressSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true
    },
    fullname:{
        type:String,
        required:true
    },
    phone:{
        type:Number,
        required:true
    },
    address:{
        houseName:{
            type:String,
            required:true
        },
        city:{
            type:String,
            required:true
        },
        state:{
            type:String,
            required:true
        },
        pincode:{
            type:Number,
            required:true
        },
        country:{
            type:String,
            required:true
        }
    },
    primary:{
        type:Number,
        required:true
    }
})

module.exports = mongoose.model('userAddress',userAddressSchema)