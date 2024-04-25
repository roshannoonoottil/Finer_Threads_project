const userModel = require("../models/userModel");
const categoryModel = require("../models/categoryModel");
const productModel = require("../models/productModel");
const userPro = require("../models/userAddressModel");
const otpSend = require("../middleware/otp");
const walletModel = require("../models/walletModel");
const bcrypt = require("bcrypt");

const index = async (req, res) => {
  try {
    if (req.session.isUser) {
      res.redirect("/home");
    } else {
      const category = await categoryModel.find({ list: 1 });
      const product = await productModel.find({}).sort({ _id: 1 });
      res.render("index", { category, product });
      console.log("index page");
    }
  } catch (error) {
    console.log("Error happened while user login: " + error);
  }
};

const login = (req, res) => {
  try {
    if (req.session.isUser) {
      res.redirect("/home");
    } else {
      let message = req.session.error || req.session.logout;
      const success = req.query.success;

      res.render("login", { error: message, success });
      console.log("User login");
    }
  } catch {
    console.log("Error while rendering user registration page: " + error);
  }
};

const signup = (req, res) => {
  try {
    let error = req.query.error;
    res.render("signup", { error });
    console.log("User signup");
  } catch {
    console.log("Error while rendering user registration page: " + error);
  }
};

let OTP;
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
    res.render("otp", { OTP, email });
    console.log("User OTP Page");
  } catch (err) {
    console.log("error in veriy otp" + err);
  }
};

const authOTP = async (req, res) => {
  try {
    console.log(req.body.otp);
    if (req.body.otp === OTP) {
      let bcryptPass = await bcrypt.hash(req.session.userDetails.password, 10);
      // console.log(req.session.userDetails);
      const registeredUser = new userModel({
        username: req.session.userDetails.username,
        password: bcryptPass,
        email: req.session.userDetails.email,
        mobile: req.session.userDetails.mobile,
        isAdmin: 0,
      });
      await registeredUser.save();

      const wallet = new  walletModel({
        userId: registeredUser._id,
        wallet:0,
        walletTransactions:[]
      })
      await wallet.save();

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
        if (userProfile.status == 0) {
          req.session.isUser = true;
          req.session.name = req.body.username;
          console.log(req.session.isUser);
          res.redirect("/home");
        } else {
          req.session.error = "User blocked";
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
    const category = await categoryModel.find({ list: 1 });
    const product = await productModel.find({}).sort({ _id: 1 });
    console.log(userName);
    res.render("home", { category, product, userName });
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

const indexPageCategory = async (req, res) => {
  console.log("category clicked");
  const params = req.params.name;
  console.log(params);
  const product = await productModel.find({ category: params });
  const category = await categoryModel.find({ list: 1 });
  res.render("productCategory", { category, product });
};

const productView = async (req, res) => {
  try {
    const id = req.params.id;
    console.log("product id is: " + id);
    const category = await categoryModel.find({});
    const productDetails = await productModel.findOne({ _id: id });
    console.log("product category is: " + productDetails);
    const categoryData = await productModel.find({
      $and: [
        { category: productDetails.category },
        { _id: { $ne: productDetails._id } },
      ],
    });
    res.render("productPage", {
      category,
      productDetails,
      available: "In Stock",
      notAvailable: "Out of Stock",
      categoryData,
    });
  } catch (error) {
    console.log("Error while displaying product page " + error);
  }
};

const homePageCategory = async (req, res) => {
  console.log("category clicked");
  const params = req.params.name;
  console.log(params);
  const product = await productModel.find({ category: params });
  const category = await categoryModel.find({ list: 1 });
  res.render("userProductCategory", { category, product, searchValue });
};

const userproductView = async (req, res) => {
  try {
    const id = req.params.id;
    console.log("product id is: " + id);
    const category = await categoryModel.find({});
    const productDetails = await productModel.findOne({ _id: id });
    console.log("product category is: " + productDetails);
    const categoryData = await productModel.find({
      $and: [
        { category: productDetails.category },
        { _id: { $ne: productDetails._id } },
      ],
    });
    res.render("userProductPage", {
      category,
      productDetails,
      available: "In Stock",
      notAvailable: "Out of Stock",
      categoryData,
    });
  } catch (error) {
    console.log("Error while displaying product page " + error);
  }
};

const forgotPassword = (req, res) => {
  try {
    res.render("forgotPassword", { error: req.session.noRegisteredEmail });
    console.log("USER IN FORGOT PASSWORD - EMAIL PAGE");
  } catch (error) {
    console.log("Error while redirecting to forgot password page :" + error);
  }
};

const authEmail = async (req, res) => {
  try {
    const email = req.body.email;
    req.session.emailDetail = req.body.email;
    console.log("User entered email: " + email);
    const emailAuth = await userModel.findOne({ email: email });
    console.log("emailAuth is: " + emailAuth);
    if (emailAuth === null) {
      console.log("User entered a non registered email");
      req.session.noRegisteredEmail = "This is not a registered email";
      error = req.session.noRegisteredEmail;
      res.redirect("/forgetPassword");
      //console.log(error);
    } else {
      req.session.USERdata = emailAuth.username;
      //console.log(req.session.USERdata);
      res.redirect("/forgotPassword/getOTP");
    }
  } catch (error) {
    console.log(
      "Error while authenticating email for password reset :" + error
    );
  }
};

let newOTP;
const fpGetOTP = (req, res) => {
  try {
    const fpEmail = req.session.emailDetail;
    fpOTP = req.session.invalidOTP;
    res.render("fpOTP", { fpEmail, fpOTP });
    console.log(
      "sending otp to registered email for password reset: " + fpEmail
    );
    const otpData = otpSend.sendmail(fpEmail);
    console.log(
      "password reset OTP received is:++++++++++++++++++++++++++++++++ " +
        otpData
    );
    newOTP = otpData;
  } catch (error) {
    console.log("Error in getting OTP for password reset :" + error);
  }
};

const fpAuthOTP = (req, res) => {
  try {
    if (req.body.otp === newOTP) {
      // console.log("*********************************************************");
      res.redirect("/changePassword");
    } else {
      fpEmail = req.session.emailDetail;
      console.log(newOTP);
      console.log(req.body.otp);
      req.session.invalidOTP = "Invalid OTP entered";
      fpOTP = req.session.invalidOTP;
      res.render("fpOTP", { fpEmail, fpOTP });
    }
  } catch (error) {
    console.log("Error in authenticating OTP for password change: " + error);
  }
};

const toChangePassword = (req, res) => {
  try {
    res.render("changePassword");
  } catch (error) {
    console.log("Error while redirected to change password :" + error);
  }
};

const updatePassword = async (req, res) => {
  try {
    const a = req.session.USERdata;
    console.log("a is-------->" + a);
    //let newPass = req.body.Password1
    let newPass = await bcrypt.hash(req.body.Password1, 10);
    console.log(newPass);
    await userModel.updateOne({ username: a }, { $set: { password: newPass } });
    req.session.passChange = "Password changed successfully. Login to proceed";
    res.redirect("/login");
  } catch (error) {
    console.log("Error while updating password :" + error);
  }
};

const resendOTP = (req, res) => {
  try {
    //console.log("Hello");
    const email = req.session.emailDetail;
    console.log("Resending OTP to email: " + email);
    const otpRData = otpSend.sendmail(email);
    console.log("otpRData is ++++++" + otpRData);
    newOTP = otpRData;
    console.log(
      "OTP received after 60s is: " + newOTP + " and timestamp is:  " + otpRData
    );
    req.session.otpTimestamp = otpRData[1];
    message = req.session.otpError;
    // res.redirect("/otp");
    console.log("USER RESEND OTP PAGE");
  } catch (error) {
    console.log("Error while resending OTP :" + error);
  }
};

const otp = (req, res) => {
  try {
    res.render("otp", { message });
  } catch (error) {
    console.log(
      "Error while displaying OTP page when wrong OTP entered by user :" + error
    );
  }
};

const regResendOTP = (req, res) => {
  try {
    //console.log("Hello");
    email = req.params.id;
    console.log("Resending OTP to email: " + email);
    const otpReRData = otpSend.sendmail(email);
    console.log("otpRData is ++++++" + otpReRData);
    OTP = otpReRData;
    console.log(
      "OTP received after 60s is: " + OTP + " and timestamp is:  " + otpReRData
    );
    req.session.otpTimestamp = otpReRData[1];
    message = req.session.otpError;
    // res.redirect("/otp");
    console.log("USER RESEND OTP PAGE");
  } catch (error) {
    console.log("Error while resending OTP :" + error);
  }
};

const search = async (req, res) => {
  try {
    let currentPage;
    searchValue = req.body.searchValue;
    console.log("The searched data is: " + req.body.searchValue);
    const category = await categoryModel.find({});
    const product = await productModel.find({
      name: { $regex: new RegExp(searchValue, "i") },
    });
    console.log("searchData value is" + product);
    const noProduct = "No such product available";
    res.render("userProductCategory", {
      category,
      product,
      searchValue,
      noProduct,
    });
  } catch (error) {
    console.log("Error while searching a product by guest: " + error);
  }
};

const shop = async (req, res) => {
  // let page = 1;
  // if (req.query.page) {
  //   page = req.query.page;
  // }
  // const limit = 6;
  // let product = await productModel
  //   .find({})
  //   .sort({ _id: 1 })
  //   .limit(limit * 1)
  //   .skip((page - 1) * limit); //cant use const here as it will render error when a product is searched//

  // const count = await productModel.find({}).countDocuments(); // counts the total products //
  // console.log("PRODUCT COUNT IS :" + count);

  console.log("Shop clicked");
  searchValue = req.body.searchValue;
  const product = await productModel.find({});
  const category = await categoryModel.find({ list: 1 });
  res.render("userProductCategory", {
    category,
    product,
    searchValue,
    // totalPages: Math.ceil(count / limit),
    // currentPage: page,
  });
};

const userAccount = async (req, res) => {
  try {
    console.log(req.params.id);
    const userin = req.session.name;

    const userData = await userPro.findOne({ username: userin, primary: 1 });
    const user = await userModel.findOne({ username: userin });
    const useraddress = await userPro.find({ username: userin, primary: 0 });
    console.log(user);
    const username = userin;
    const cat = await categoryModel.find({ list: 0 });
    res.render("userProfile", {
      userData,
      user,
      userin,
      cat,
      useraddress,
      username,
    });
  } catch (e) {
    console.log(
      "error in the userAccount of userController in user side : " + e
    );
    // res.redirect("/error")
  }
};

const newAddress = async (req, res) => {
  try {
    const userin = req.session.name;
    console.log(userin);
    console.log(req.body);
    const newAddress = new userPro({
      username: userin,
      fullname: req.body.fullname,
      phone: req.body.phone,
      address: {
        houseName: req.body.house,
        city: req.body.city,
        state: req.body.state,
        country: req.body.country,
        pincode: req.body.pincode,
      },
      primary: 0,
    });
    await newAddress.save();
    res.redirect(`/useraccount/${userin}`);
  } catch (e) {
    console.log(
      "error in the newAddress in userController in the user side:" + e
    );
    // res.redirect("/error")
  }
};

const categoryProductSort = async (req, res) => {
  try {
    // const cartProducts = await cartModel.find({ user: req.session.userID });
    // const cartCount = cartProducts[0].item.length;

    const category = await categoryModel.find({ list: 1 });
    const userName = req.session.name;
    // const searchValue = "";
    // const searchData = "";
    const number = req.params.number;
    //console.log(number);
    if (number == 1) {
      let totalPages;
      let currentPage;
      const product = await productModel.find({}).sort({ name: 1 });
      console.log("DATA IF 1 is pressed:" + product);
      const value = "A - Z";
      res.render("userProductCategory", {
        user: userName,
        product,
        searchValue,
        category,
        totalPages,
        currentPage,
      });
    } else if (number == 2) {
      const product = await productModel.find({}).sort({ name: -1 });
      console.log("DATA IF 2 is pressed:" + product);
      res.render("userProductCategory", {
        user: userName,
        product,
        searchValue,
        category,
        totalPages,
        currentPage,
      });
    } else if (number == 3) {
      const product = await productModel.find({}).sort({ discountAmount: 1 });
      console.log("DATA IF 3 is pressed:" + product);
      res.render("userProductCategory", {
        user: userName,
        product,
        searchValue,
        category,
        totalPages,
        currentPage,
      });
    } else if (number == 4) {
      const product = await productModel.find({}).sort({ discountAmount: -1 });
      console.log("DATA IF 4 is pressed:" + product);
      res.render("userProductCategory", {
        user: userName,
        product,
        searchValue,
        category,
        totalPages,
        currentPage,
      });
    }
  } catch (error) {
    console.log("Error happened while accessing categoryProductSort: " + error);
  }
};


const wallet = async (req, res) => {
  try {
    console.log("user entered wallet");
    var page = 1;
    if (req.query.page) {
      page = req.query.page;
    }
    const limit = 5;

    const userName = req.session.name;
    const userData = await userModel.findOne({ username: userName });
    const wallet =  await walletModel.findOne({ userId: userData._id})
    const walletData = await walletModel.aggregate([
      {
        $match: {
          userId: userData._id,
        },
      },
      {
        $unwind: "$walletTransactions",
      },

      {
        $sort: {
          "walletTransactions.date": -1,
        },
      },
      {
        $project: {
          wallet: 1,
          walletTransactions: 1,
          _id: 0,
        },
      },
    ]);

    console.log("walletData is::", walletData);
    const length = walletData.length;
    console.log("length is :", length);
    console.log("------------------------------->>>>");
    const totalPages = Math.ceil(length / limit);
    // console.log("TYPEOF ...............................",typeof(walletData[0].wallet));
    // console.log(walletData[0].wallet, " wallectttttttttttt" );
    res.render("wallet", {
      user: userName,
      userData,
      walletData,
      totalPages,
      currentPage: page,
      wallet
    });
  } catch (error) {
    console.log("Error while displaying wallet ", error);
  }
};


module.exports = {
  index,
  login,
  signup,
  verifyOTPS,
  authOTP,
  validateUser,
  redirectUser,
  logout,
  indexPageCategory,
  productView,
  homePageCategory,
  userproductView,
  forgotPassword,
  authEmail,
  fpGetOTP,
  fpAuthOTP,
  toChangePassword,
  updatePassword,
  resendOTP,
  otp,
  regResendOTP,
  shop,
  search,
  userAccount,
  newAddress,
  categoryProductSort,
  wallet
};
