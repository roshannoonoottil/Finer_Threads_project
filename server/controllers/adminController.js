const userModel = require("../models/userModel");
const orderData = require('../models/orderModel')
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


const oders = async (req, res) => {
  try {
    const dataOrder = await orderData.find({}).sort({ '_id': -1 }).limit(5)
    console.log(dataOrder)
    let current = 0
    let displayprev = 0
    let displaynxt = 1
    res.render('adminOders', { dataOrder, current, displayprev, displaynxt, username: req.session.username })
  } catch (e) {

      console.log('error in the orders in the adminController in the admin side : ' + e)
  }
}

const updateOrderStatus = async (req, res) => {
  try {
      console.log('status update')
      console.log(req.params.id)
      console.log(req.body.status)
      await orderData.updateOne(
          {
              $and: [{ orderId: req.query.orderId },
              { product: req.query.product }]
          },
          { $set: { status: req.body.status } }
      )


      res.redirect('/admin/oders')
  } catch (e) {
      console.log('error in the updateOrderStatus in orderController in admin side: ' + e)
  }
}


const searchOrder = async (req, res) => {
  try {
      let search = req.body.search
      console.log(search)
      const regex = new RegExp(`${search}`, 'i')
      const dataOrder = await orderData.find({ product: { $regex: regex } })
      res.render('adminOders', { dataOrder, username: req.session.username})
  } catch (e) {
      console.log('error in the searchOrder in orderController in admin side : ' + e)
  }
}

const details = async (req, res) => {
  try {
      console.log(req.query.orderId)
      console.log(req.query.product)
      const data = await orderData.findOne({ $and: [{ orderId: req.query.orderId }, { product: req.query.product }] })
      // const img = await productDetails.findOne({ name: data.product })
      console.log(data)
      console.log('==================================================================')
      // console.log(img.imagePath[0])
      console.log('aidhgsai')
      res.render('admin_order_details', { data, username: req.session.username })
  } catch (e) {
      console.log('error in the details in orderController in adminSide : ' + e)
  }
}



const deleteOrder = async (req, res) => {
  try {
      await orderData.updateOne({ $and: [{ orderId: req.query.orderId }, { product: req.query.product }] }, { $set: { adminCancell: 1, status: 'CANCELED' } })
      res.redirect('/admin/oders')
  } catch (e) {
      console.log('error in the deleteOrder in orderController in admin controller : ' + e)
  }
}

module.exports = {
  adiminLogin,
  adminDashboard,
  toDashboard,
  adminLogout,
  adminShowUsers,
  block,
  searchUser,
  oders,
  updateOrderStatus,
  details,
  searchOrder,
  deleteOrder
};
