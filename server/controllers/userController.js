const userModel = require("../models/userModel");
const otpSend =require("../middleware/otp")
const bcrypt = require("bcrypt");


 const index =  (req, res) => {
    res.render("index");
    console.log("index page");

  };
  
  const login = (req, res) => {
    res.render("login");
    console.log("User login");
  };

  const signup = (req, res) => {
    res.render("signup");
    console.log("User signup");
  };
  
var OTP;
const verifyOTPS = (req, res) => {
  try {
    console.log(req.body);
    req.session.userDetails = req.body;
    const email = req.body.email;
    console.log("sending otp");
    const otpData = otpSend.sendmail(email);
    console.log(otpData);
    OTP = otpData;
    console.log("OTP received is: " + otpData);
    res.render("otp");
    console.log("User OTP Page");
  } catch (err) {
    console.log("error in veriy otp" + err);
  }
};

const authOTP = async (req, res) => {
  try {
    console.log(req.body.otp);
    if (req.body.otp === OTP) {
      var bcryptPass = await bcrypt.hash(req.session.userDetails.password, 10);
      // console.log(req.session.userDetails);
      const registeredUser = new userModel({
        username: req.session.userDetails.username,
        password: bcryptPass,
        email: req.session.userDetails.email,
        mobile: req.session.userDetails.mobile,
        isAdmin: 0,
      });
      await registeredUser.save();
      res.redirect("/login");
    } else {
      res.render("otp", { message: "Invalid OTP entered" });
    }
    console.log("otp check");
  } catch (err) {
    console.log("Error while authenticating OTP: " + err);
  }
};




module.exports = 
{ index,
  login,
  signup,
  verifyOTPS,
  authOTP
}