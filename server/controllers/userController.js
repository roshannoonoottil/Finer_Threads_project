const userModel = require("../models/userModel");
const otpSend =require("../middleware/otp")
const bcrypt = require("bcrypt");


 const index =  (req, res) => {
  try{
      if (req.session.isUser){
        res.redirect("/home")
      }else{
      res.render("index");
      console.log("index page");
      }
    } catch (error)
     {
      console.log("Error happened while user login: " + error);
     }

  };
  
  const login = (req, res) => {
    try{
      if (req.session.isUser) 
      {
        res.redirect("/home");
      } else 
      {
        let message = req.session.error || req.session.logout;
        const success = req.query.success;

        res.render("login", { error: message, success });
        console.log("User login");
      }
    } catch{
      console.log("Error while rendering user registration page: " + error);
    }
  };


  const signup = (req, res) => {
    try
    {
      let error = req.query.error;
    res.render("signup",{ error });
    console.log("User signup");
    } catch{
      console.log("Error while rendering user registration page: " + error);
    }
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



const validateUser = async (req, res) => {
  try {
    const name = await req.body.username;
    console.log(name);
    const userProfile = await userModel.findOne({ username: name });
    if (!userProfile) {
      req.session.error = "Not a registered user. Please register first";
      res.redirect("/login");
    } else if (userProfile) {
      const checkPass = await bcrypt.compare(
        req.body.password,
        userProfile.password
      );
      console.log(checkPass);
      if (checkPass) {
        if(userProfile.status==0){
        req.session.isUser = true;
        req.session.name = req.body.username;
        console.log(req.session.isUser);
        res.redirect("/home");
      }else{
        req.session.error="User blocked";
        res.redirect("/login");
      }
      } else {
        req.session.error = "Incorrect password";
        console.log("Incorrect password");
        res.redirect("/login");
      }
    }
  } catch (err) {
    console.log("Error in validating user :" + err);
  }
};

const redirectUser = async (req, res) => {
  try {
    const userName = req.session.name;
    console.log(userName);
    res.render("home");
  } catch (error) {
    console.log("Error while redirection");
  }
};

const logout = (req, res) => {
  try {
    req.session.isUser = false;
    req.session.logout = "You have loged out";
    res.redirect("/login");
    console.log("User loged  out");
  } catch (error) {
    console.log("Error during user signout ", +error);
  }
};

const productView = async (req, res) => {
  try {
    const id = req.params.id;
    console.log("product id is: " + id);
    const category = await categoryModel.find({});
    const productDetails = await productModel.findOne({ _id: id });
    console.log("product category is: " + productDetails);
    const categoryData = await productModel.find({
      $and: [{
         category: productDetails.category },{ _id: { $ne: productDetails._id } },
      ],});
    console.log(
      "Specific category data except the product seen in page :\n" +
        categoryData
    );
    res.render("productPage",{ category,productDetails,available: "In Stock",notAvailable: "Out of Stock",categoryData,});
  } catch (error) {
    console.log("Error while displaying product page " + error);
  }
};





module.exports = 
{ index,
  login,
  signup,
  verifyOTPS,
  authOTP,
  validateUser,
  redirectUser,
  logout,
  productView

}