const userModel = require("../models/userModel");
const orderData = require("../models/orderModel");
const couponModel = require("../models/couponModel");
const productDetails = require("../models/productModel");
const wallet = require("../models/walletModel");
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
    res.redirect("/error");
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
    res.redirect("/error");
  }
};

const toDashboard = async (req, res) => {
  try {
    const userCount = await userModel.find({ isAdmin: 0 }).count();
    const productCount = await productDetails.find({}).count();
    const orders = await orderData.distinct("orderId");
    const orderStatusP = await orderData.aggregate([
      { $match: { status: "placed" } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const orderStatusC = await orderData.aggregate([
      { $match: { status: "CANCELED" } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const orderStatusD = await orderData.aggregate([
      { $match: { status: "Delivered Successfully" } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const orderStatusO = await orderData.aggregate([
      { $match: { status: "Out for delivery" } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const totalSales = await orderData.aggregate([
      { $match: { status: { $ne: "CANCELED" } } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$offerPrice" },
        },
      },
    ]);
    console.log("-------------------------------------------------------");

    const mostSellingProduct = await orderData.aggregate([
      { $match: { status: { $ne: "CANCELED" } } },
      {
        $group: {
          _id: "$product",
          totalOrders: { $sum: 1 },
        },
      },
      {
        $sort: { totalOrders: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    const mostSellingCategory = await orderData.aggregate([
      { $match: { status: { $ne: "CANCELED" } } },
      {
        $group: {
          _id: "$category",
          totalOrders: { $sum: 1 },
        },
      },
      {
        $sort: { totalOrders: -1 },
      },
      {
        $limit: 2,
      },
    ]);

    console.log("Most selling product:", mostSellingProduct);

    let codPay = await orderData.find({}).count();
    const online = await orderData.find({ paymentMentod: "Online" }).count();
    console.log(online);
    codPay = codPay - online;
    console.log(codPay);
    const orderCount = orders.length;

    let total = Math.floor(totalSales[0].totalAmount);

    res.render("dashboard", {
      userCount,
      productCount,
      orderCount,
      orderStatusP,
      orderStatusC,
      orderStatusD,
      orderStatusO,
      codPay,
      online,
      username: req.session.username,
      totalSales,
      mostSellingProduct,
      mostSellingCategory,
      total,
    });
  } catch (e) {
    console.log("error in the dashbord of admin controller :" + e);
    res.redirect("/error");
  }
};

const adminLogout = (req, res) => {
  try {
    delete req.session.isAdmin;
    console.log("admin logged outed");
    res.redirect("/admin");
  } catch (error) {
    console.log("Error in Logging out" + error);
    res.redirect("/error");
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
    res.redirect("/error");
  }
};

const block = async (req, res) => {
  try {
    const { username } = req.params; // Destructuring req.params
    console.log(username);

    const userData = await userModel.findOne({ username }); // Using shorthand property name
    if (userData.status != 1) {
      req.session.isUser = false;
      console.log("User logged out + blocked");
    }
    userData.status = !userData.status;
    console.log(userData.status);
    await userData.save();

    res.redirect("/admin/user");
  } catch (e) {
    console.log("catch of block in admin : " + e);
    res.redirect("/error");
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
    res.redirect("/error");
  }
};

const oders = async (req, res) => {
  try {
    let page = 1;
    if (req.query.page) {
      page = req.query.page;
    }
    const limit = 5;
    let dataOrder = await orderData
      .find({})
      .sort({ _id: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit); //cant use const here as it will render error when a product is searched//

    const count = await orderData.find({}).countDocuments(); // counts the total products //
    console.log("PRODUCT COUNT IS :" + count);
    res.render("adminOders", {
      dataOrder,
      username: req.session.username,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (e) {
    console.log(
      "error in the orders in the adminController in the admin side : " + e
    );
    res.redirect("/error");
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    console.log("status update");
    console.log(req.params.id);
    console.log(req.body.status);
    await orderData.updateOne(
      {
        $and: [{ orderId: req.query.orderId }, { product: req.query.product }],
      },
      { $set: { status: req.body.status } }
    );

    res.redirect("/admin/oders");
  } catch (e) {
    console.log(
      "error in the updateOrderStatus in orderController in admin side: " + e
    );
    res.redirect("/error");
  }
};

const searchOrder = async (req, res) => {
  try {
    let totalPages;
    let search = req.body.search;
    console.log(search);
    const regex = new RegExp(`${search}`, "i");
    const dataOrder = await orderData.find({ product: { $regex: regex } });
    res.render("adminOders", {
      dataOrder,
      username: req.session.username,
      totalPages,
    });
  } catch (e) {
    console.log(
      "error in the searchOrder in orderController in admin side : " + e
    );
    res.redirect("/error");
  }
};

const details = async (req, res) => {
  try {
    console.log(req.query.orderId);
    console.log(req.query.product);
    const data = await orderData.findOne({
      $and: [{ orderId: req.query.orderId }, { product: req.query.product }],
    });
    // const img = await productDetails.findOne({ name: data.product })
    console.log(data);
    console.log(
      "=================================================================="
    );
    // console.log(img.imagePath[0])
    console.log("aidhgsai");
    res.render("admin_order_details", { data, username: req.session.username });
  } catch (e) {
    console.log("error in the details in orderController in adminSide : " + e);
    res.redirect("/error");
  }
};

const deleteOrder = async (req, res) => {
  try {
    await orderData.updateOne(
      {
        $and: [{ orderId: req.query.orderId }, { product: req.query.product }],
      },
      { $set: { adminCancell: 1, status: "CANCELED" } }
    );
    res.redirect("/admin/oders");
  } catch (e) {
    console.log(
      "error in the deleteOrder in orderController in admin controller : " + e
    );
    res.redirect("/error");
  }
};

const returnDetails = async (req, res) => {
  try {
    console.log(req.query);
    await orderData.updateOne(
      { orderId: req.query.id, product: req.query.product },
      { returnStatus: 1, status: "Product Returned" }
    );

    const user = await orderData.findOne({
      orderId: req.query.id,
      product: req.query.product,
    });

    console.log(user, "return details");
    let amount = user.price * user.quentity;
    console.log(amount);
    // to update the wallet amount
    const userData = await userModel.findOne({ username: user.username });
    console.log(userData);
    const userWallet = await wallet.findOne({ userId: userData._id });
    if (userWallet) {
      walletTransactions = {
        date: new Date(),
        type: `Credited for cancelling ${req.query.id}`,
        amount: user.offerPrice,
      };

      let updateWallet = await wallet.updateOne(
        { userId: userData._id },
        {
          $inc: { wallet: +user.offerPrice },
          $push: { walletTransactions: walletTransactions },
        }
      );
      console.log("userWallet is not empty");
    } else {
      walletTransactions = [
        {
          date: new Date(),
          type: `Credited for cancelling ${req.query.id}`,
          amount: user.offerPrice,
          // amount: productPrice[0].products.product_rate,
        },
      ];
      let newUserWallet = new wallet({
        userId: userData._id,
        wallet: user.offerPrice,
        walletTransactions: walletTransactions,
      });

      await newUserWallet.save();

      console.log("userWallet is empty");
    }

    const userWallet1 = await wallet.findOne({ userId: userData._id });
    console.log(userWallet1, "////////////////////////////");

    const updatedProduct = await productDetails.findOneAndUpdate(
      { name: req.query.product },
      { $inc: { stock: +user.quentity } },
      { new: true } // To return the updated document
    );
    console.log("Updated product:", updatedProduct);

    res.redirect(
      `/admin/orderDetails?orderId=${req.query.id}&product=${req.query.product}`
    );
  } catch (e) {
    console.log(
      "error in the returnDetails in the ordetrController in the admin side : " +
        e
    );
    res.redirect("/error");
  }
};

const returnFail = async (req, res) => {
  try {
    console.log(req.query, "retuen failed");
    await orderData.updateOne(
      { orderId: req.query.id, product: req.query.product },
      { returnStatus: 2 }
    );
    res.redirect(
      `/admin/orderDetails?orderId=${req.query.id}&product=${req.query.product}`
    );
  } catch (e) {
    console.log(
      "error in the returnFail of orderController in admin side : " + e
    );
    res.redirect("/error");
  }
};

const coupon = async (req, res) => {
  try {
    const couponData = await couponModel.find({});
    const couponFound = req.query.found;
    console.log(couponData);
    res.render("adminCoupon", {
      couponData,
      couponFound,
      username: req.session.username,
    });
  } catch (e) {
    console.log("error in the coupon controller in admin side :" + e);
    res.redirect("/error");
  }
};

const addCoupon = async (req, res) => {
  try {
    console.log(req.body);
    const couponFound = await couponModel.find({ name: req.body.coupon });
    console.log(couponFound);
    console.log(
      typeof req.body.discount,
      "--------",
      typeof req.body.minAmount
    );
    let discount = Number(req.body.discount);
    let minAmount = Number(req.body.minAmount);
    console.log(typeof discount, "=======", typeof minAmount);
    if (discount < minAmount) {
      if (couponFound.length == 0) {
        const newCoupon = new couponModel({
          name: req.body.coupon,
          expiry: new Date(req.body.expiry),
          discount: req.body.discount,
          minimumAmount: req.body.minAmount,
        });
        await newCoupon.save();
        res.redirect("/admin/coupon?found= Coupon Added Successfully");
      } else {
        res.redirect("/admin/coupon?found=This Coupon Already Exist");
      }
    } else {
      res.redirect(
        "/admin/coupon?found=Discount amount should be less than minimum amount"
      );
    }
  } catch (e) {
    console.log(
      "error in the addCoupon in couponController in admin side: " + e
    );
    res.redirect("/error");
  }
};

const removeCoupon = async (req, res) => {
  try {
    await couponModel.deleteOne({ name: req.query.name });
    res.redirect("/admin/coupon?found=Coupon Removed");
  } catch (e) {
    console.log(
      "error in the removeCoupon in couponController in admin side:" + e
    );
    res.redirect("/error");
  }
};

const editCoupon = async (req, res) => {
  try {
    console.log(req.query.name, "req.query.name");
    console.log(req.body, "coupon edit");
    const couponFounde = await couponModel.findOne({ name: req.body.coupon });
    console.log(couponFounde);
    let discount = Number(req.body.discount);
    let minAmount = Number(req.body.minAmount);
    if (discount < minAmount) {
      if (!couponFounde || req.body.oldcoupon == couponFounde.name) {
        console.log("coupon found");
        await couponModel.updateOne(
          { name: req.query.name },
          {
            name: req.body.coupon,
            expiry: new Date(req.body.expiry),
            discount: req.body.discount,
            minimumAmount: req.body.minAmount,
          }
        );
        res.redirect("/admin/coupon?found= Coupon updated successful");
      } else {
        console.log("notfound");
        res.redirect(
          "/admin/coupon?found=Coupon Found, try different coupon code"
        );
      }
    } else {
      res.redirect(
        "/admin/coupon?found=Discount amount should be less than minimum amount"
      );
    }
  } catch (e) {
    console.log(
      "error in the editCoupon in couponController in admin side : " + e
    );
    res.redirect("/error");
  }
};

const chartData = async (req, res) => {
  try {
    console.log("chart data");
    const Aggregation = await orderData.aggregate([
      {
        $match: {
          orderDate: { $exists: true },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$orderDate" },
            month: { $month: "$orderDate" },
            day: { $dayOfMonth: "$orderDate" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.day": 1,
        },
      },
    ]);
    res.json(Aggregation);
  } catch (error) {
    console.error(error);
    res.redirect("/error");
  }
};

const chartDataMonth = async (req, res) => {
  try {
    console.log("/chart-data month");
    const Aggregation = await orderData.aggregate([
      {
        $match: {
          orderDate: { $exists: true },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$orderDate" },
            month: { $month: "$orderDate" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]);
    res.json(Aggregation);
  } catch (error) {
    res.redirect("/error");
  }
};

const chartDataYear = async (req, res) => {
  try {
    console.log("/chart-data calle");
    const Aggregation = await orderData.aggregate([
      {
        $match: {
          orderDate: { $exists: true },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$orderDate" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
        },
      },
    ]);
    res.json(Aggregation);
  } catch (error) {
    console.error(error);
    res.redirect("/error");
  }
};

const reportPage = async (req, res) => {
  const ordersCount = await orderData
    .find({ status: { $ne: "CANCELED" } })
    .count();
  const totalSales = await orderData.aggregate([
    { $match: { status: { $ne: "CANCELED" } } },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$price" },
        totalDiscountAmount: { $sum: "$offerPrice" },
      },
    },
  ]);

  const Product = await orderData.aggregate([
    {
      $match: { status: { $ne: "CANCELED" } },
    },
    {
      $group: {
        _id: "$product",
        totalOrders: { $sum: 1 },
        imageUrl: { $first: "$img" },
        price: { $sum: "$price" },
        Offerprice: { $sum: "$offerPrice" },
      },
    },
  ]);

  console.log(
    totalSales[0].totalAmount,
    totalSales[0].totalDiscountAmount,
    "report"
  );

  res.render("reportPage", {
    username: req.session.username,
    totalSales,
    Product,
    ordersCount,
  });
};

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
  deleteOrder,
  returnDetails,
  returnFail,
  coupon,
  addCoupon,
  removeCoupon,
  editCoupon,
  chartData,
  chartDataMonth,
  chartDataYear,
  reportPage,
};
