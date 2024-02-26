const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");

let nameSearch;
const adiminLogin = (req, res) => {
  try {
    if (req.session.isAdmin) {
      console.log("Active admin");
      res.redirect("/admin/dashboard");
    } else {
      const error = req.query.error;
      console.log("Admin need to login");
      res.render("admin_login", { error });
    }
  } catch (error) {
    console.log("Admin login page error: " + error);
  }
};

const adminDashboard = async (req, res) => {
  try {
    const Name = req.body.username;
    const adminData = await userModel.findOne({ username: Name });
    console.log(adminData);
    if (adminData && adminData.isAdmin == 1) {
      password = await bcrypt.compare(req.body.password, adminData.password);
      if (password) {
        req.session.isAdmin = true;
        req.session.username = req.body.username;
        res.redirect("/admin/dashboard");
      } else {
        res.redirect("/admin?error=Invalid password");
      }
    } else {
      res.redirect("/admin?error=Not authorized");
    }
  } catch (error) {
    console.log("Admin Dashboard error: " + error);
  }
};

const toDashboard = (req, res) => {
  try {
    res.render("dashboard", { username: req.session.username });
    console.log("Admin Dashboard");
  } catch (error) {
    console.log("Dashboard  Error:" + error);
  }
};

const adminLogout = (req, res) => {
  try {
    delete req.session.isAdmin;
    console.log("admin logged outed");
    res.redirect("/admin");
  } catch (error) {
    console.log("Error in Logging out" + error);
  }
};

const adminShowUsers = async (req, res) => {
  try {
    const users = await userModel.find({ isAdmin: 0 }).sort({ username: -1 });
    res.render("user_Management", {
      username: req.session.username,
      users,
      nameSearch,
    });
    console.log("Admin View User");
  } catch (error) {
    console.log("Error while Admin showing user data: " + error);
  }
};

const block = async (req, res) => {
  try {
    const { username } = req.params; // Destructuring req.params
    console.log(username);
    
    const userData = await userModel.findOne({ username }); // Using shorthand property name
    if(userData.status != 1){
    req.session.isUser = false;
    console.log("User logged out + blocked");
    }
    userData.status = !userData.status;
    console.log(userData.status);
    await userData.save();
    
    res.redirect("/admin/user");
  } catch (e) {
    console.log("catch of block in admin : " + e);
  }
};

const searchUser = async (req, res) => {
  try {
    nameSearch = req.body.search;
    const regex = new RegExp(`${nameSearch}`, "i");
    console.log(regex);
    const users = await userModel.find({
      $and: [{ username: { $regex: regex } }, { isAdmin: 0 }],
    });
    res.render("user_Management", {
      username: req.session.username,
      users,
      nameSearch,
    });
  } catch (e) {
    console.log("catch of searchUser in admin : " + e);
  }
};

module.exports = {
  adiminLogin,
  adminDashboard,
  toDashboard,
  adminLogout,
  adminShowUsers,
  block,
  searchUser,
};
