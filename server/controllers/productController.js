const productModel = require("../models/productModel");
const categoryModel = require("../models/categoryModel");
const couponModel = require("../models/couponModel");
const userDetails = require("../models/userModel");
const cart = require("../models/cartModel");
const Razorpay = require("razorpay");
const multer = require("multer");
require("dotenv").config();

let productSearch
const adminProduct = async (req, res) => {
  try {
    let page = 1;
    const limit = 3;
    let product = await productModel
      .find({})
      .sort({ _id: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit); //cant use const here as it will render error when a product is searched//
      const count = await productModel.find({}).countDocuments(); // counts the total products //
    res.render("productManagement", {
      username: req.session.username,
      product,
      productSearch,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
    console.log(product.name, +"product console");
  } catch (err) {
    res.send("Error Occurred");
  }
};

const searchProduct = async(req,res)=>{
  try {
    let totalPages
  productSearch = req.body.psearch;
  const regex = new RegExp(`${productSearch}`, "i");
  console.log(regex);
  const product = await productModel.find({
    $and: [{ name: { $regex: regex } }],
    });

    res.render("productManagement", {
      username: req.session.username,
      product,
      productSearch,
      totalPages
    });
  } catch (e) {
    console.log("catch of searchUser in admin : " + e);
  }

}



const addProduct = async (req, res) => {
  try {
    console.log(req.body);
    console.log(req.files);
    const imageData = req.files;
    let imagePath = [];
    for (let i = 0; i < imageData.length; i++) {
      imagePath[i] = imageData[i].path
        .replace(/\\/g, "/")
        .replace("public", "")
        .replace("/admin", "../");
    }
    const { prodName, category, prodDesc, prodRate, quantity } = req.body;
    const product = await productModel.find({name: prodName});
   
    let data = req.body;
    console.log(data.offer, "  data............");
    let amount = 0;
    if (data.offer == "") {
      const catdata = await categoryModel.find({ name: category });
      if (catdata[0].offer == "") {
        amount = Number(data.discount);
      } else {
        let sum = Number(data.prodRate) * Number(catdata[0].offer);
        let value = sum / 100;
        amount = Number(data.prodRate) - value;
      }
    } else {
      const catdata = await categoryModel.find({ name: category });
      if (catdata[0].offer == "") {
        amount = Number(data.discount);
      } else {
        if (catdata[0].offer > data.offer) {
          let sum = Number(data.prodRate) * Number(catdata[0].offer);
          let value = sum / 100;
          amount = Number(data.prodRate) - value;
        } else {
          amount = Number(data.discount);
        }
      }
    }
    if(!product.name)
    {
    console.log(amount," offer amound");
    const newProd = new productModel({
      name: prodName,
      category: category,
      description: prodDesc,
      rate: prodRate,
      stock: quantity,
      list: 0,
      hide: 0,
      image: imagePath,
      offer: data.offer,
      discountAmount: amount,
    });

    await newProd.save();
  }
    return res.redirect(`/admin/product`);
  } catch (err) {
    console.log("error while adding product to the DB: " + err);
  }
};

const newProductPage = async (req, res) => {
  const category = await categoryModel.find({}).sort({ name: 1 });
  try {
    console.log("category details: " + category);
    res.render("adminProductAdd", { username: req.session.username, category });
    console.log("ADMIN WILL ADD PRODUCT");
  } catch (err) {
    console.log("Error while redirecting the page to add product: " + err);
  }
};

const editProduct = async (req, res) => {
  try {
    const category = await categoryModel.find({}).sort({ name: 1 });
    const oldName = req.body.oldName;
    const oldCategory = req.body.oldCategory;
    const oldRate = req.body.oldRate;
    const oldStock = req.body.oldStock;
    const oldDesc = req.body.oldDesc;
    const oldOffer = req.body.oldOffer;

    const allOldData = await productModel.findOne({ name: oldName });
    totalImages = allOldData.image.length;
    console.log(req.body);
    console.log("ADMIN: PRODUCT EDIT");
    res.render("adminProductEdit", {
      username: req.session.username,
      oldName,
      oldCategory,
      oldRate,
      oldStock,
      oldDesc,
      category,
      oldOffer,
      allOldData,
      totalImages,
    });
  } catch (err) {
    console.log(err.message);
    return res.redirect("/error?message=error-while-updating-category");
  }
};

const updateProduct = async (req, res) => {
  try {
    console.log(req.files, " re uploding files");
    for (let i in req.files) {
      console.log(parseInt(`${i}`));
      let index = parseInt(`${i}`);
      console.log("pro img update");
      let newImagePath = req.files[i][0].path
        .replace(/\\/g, "/")
        .replace("public", "")
        .replace("/admin", "../");
      console.log(newImagePath);
      await productModel.updateOne(
        { name: req.body.oldProdName },
        {
          $set: { [`image.${index}`]: newImagePath },
        }
      );
    }

    console.log(req.body);
    const catdata = await categoryModel.find({ name: req.body.newProdCat });
    console.log(catdata, "caaaat data");
    let offerPrice;
    if (req.body.offer != "") {
      if (req.body.offer > catdata[0].offer) {
        let sum = Number(req.body.newProdRate) * Number(req.body.offer);
        let dis = sum / 100;
        offerPrice = Number(req.body.newProdRate) - Math.floor(dis);
        console.log(req.body.offer, "if");
      } else {
        let sum = Number(req.body.newProdRate) * Number(catdata[0].offer);
        let value = sum / 100;
        offerPrice = Number(req.body.newProdRate) - value;
      }
    } else {
      if (catdata[0].offer == "") {
        console.log("offer is null");
        offerPrice = Number(req.body.newProdRate);
      } else {
        console.log("offer is not null");
        let sum = Number(req.body.newProdRate) * Number(catdata[0].offer);
        let value = sum / 100;
        offerPrice = Number(req.body.newProdRate) - value;
        console.log(offerPrice, "offferprice - -- -- --");
      }
    }
    if (offerPrice > 0) {
      console.log(req.body);
      if (req.body) {
        await productModel.updateOne(
          { name: req.body.oldProdName },
          {
            $set: {
              name: req.body.newProdName,
              category: req.body.newProdCat,
              rate: req.body.newProdRate,
              description: req.body.newProdDesc,
              stock: req.body.newProStock,
              discountAmount: offerPrice,
              offer: req.body.offer,
            },
          },
          {
            upsert: true,
          }
        );
      }
    }
    console.log("PRODUCT UPDATED");
    return res.redirect("/admin/product");
  } catch (err) {
    console.log(err.message);
    // return res.redirect("/admin/error?message=error-while-updating-category");
  }
};

const proBlock = async (req, res) => {
  try {
    const name = req.params.name;
    console.log(name);
    const proData = await productModel.findOne({ name: name });
    let val = 1;
    if (proData.hide == 1) val = 0;
    await productModel.updateOne({ name: name }, { $set: { hide: val } });
    res.redirect(`/admin/product`);
  } catch (e) {
    console.log("catch of block in admin : " + e);
  }
};

const couponCheck = async (req, res) => {
  try {
    const couponFound = await couponModel.findOne({ name: req.body.coupon });
    console.log(couponFound, " coupon founded");
    const couponUsed = await userDetails.findOne({
      username: req.session.name,
      coupon: { $in: `${req.body.coupon}` },
    });
    console.log(couponUsed, "coupon in");
    if (!couponUsed) {
      if (couponFound) {
        console.log("coupon found");
        console.log(req.body.amount, ">=", couponFound.minimumAmount);
        if (req.body.amount >= couponFound.minimumAmount) {
          console.log("coupon amound >= min amount");

          if (couponFound.expiry - new Date() >= 0) {
            const username = req.session.name;
            const data = await userDetails.updateOne(
              { username: username },
              { $push: { coupon: couponFound.name } }
            );
            let discount = couponFound.discount;
            req.session.amountToPay = req.session.amountToPay - discount;
            let amount = req.session.amountToPay;
            console.log(amount, "amount amount");
            console.log(req.session.amountToPay);
            req.session.coupon = req.body.coupon;
            //req.session.coupon = discount
            res.json({ success: true, amount, discount });
          } else {
            let msg = "In valid Coupon Code";
            res.json({ success: false, msg });
          }
        } else {
          let msg = `Minimum amount to purcahse : ${couponFound.minimumAmount}`;
          res.json({ success: false, msg });
        }
      } else {
        let msg = "In valid Coupon Code";
        res.json({ success: false, msg });
      }
    } else {
      let msg = "You have already used";
      res.json({ success: false, msg });
    }
  } catch (e) {
    console.log(
      "error in the couponCheck in userside in couponController.js:",
      e
    );
    // res.redirect("/error")
  }
};

const removeCoupon = async (req, res) => {
  try {
    console.log(req.body);
    const couponFound = await couponModel.findOne({ name: req.body.coupon });
    const username = req.session.name;
    const data = await userDetails.updateOne(
      { username: username },
      { $pull: { coupon: couponFound.name } }
    );
    req.session.coupon = false;
    req.session.amountToPay = req.session.amountToPay + couponFound.discount;
    let amount = req.session.amountToPay;
    res.json({ success: true, amount });
  } catch (e) {
    console.log(
      "error in the removeCoupon in the couponController in user side : " + e
    );
    res.redirect("/error");
  }
};

let instance = new Razorpay({
  key_id: process.env.RAZORPAY_YOUR_KEY_ID,
  key_secret: process.env.RAZORPAY_YOUR_KEY_SECRET,
});

const createOrder = async (req, res) => {
  console.log("user online payment");
  console.log("body:", req.body);
  try {
    console.log("1");
    const userData = await cart.find({ username: req.body.username });
    console.log("2");
    console.log("3");
    console.log(req.body);
    let amount = req.session.amountToPay;
    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: "razorUser@gmail.com",
    };
    console.log("4");

    instance.orders.create(options, (err, order) => {
      console.log("6");
      console.log(err);
      console.log(order);
      if (!err) {
        console.log("5");

        res.status(200).send({
          success: true,
          msg: "Order Created",
          order_id: order.id,
          amount: req.session.amountToPay,
          key_id: process.env.RAZORPAY_YOUR_KEY_ID,
          product_name: req.body.name,
        });
        console.log("100");
      } else {
        console.log("london");
        res.status(400).send({ success: false, msg: "Something went wrong!" });
      }
    });
  } catch (error) {
    console.log(error.message);
    // res.redirect("/error")
  }
};

const applyWallet = async (req, res) => {
  try {
    console.log(
      req.body,
      "=============================================================="
    );
    const userData = await userDetails.findOne({ username: req.session.name });
    console.log(userData.wallet);
    let amount = Math.max(1, req.session.amountToPay - userData.wallet);
    let wallet = Math.max(0, userData.wallet - req.session.amountToPay);
    req.session.amountToPay = amount;
    req.session.wallet = wallet;
    req.session.reducedWallet = userData.wallet - wallet;
    res.json({ success: true, amount, wallet });
  } catch (e) {
    console.log(
      "error in the applyWallet in the couponController in user side : " + e
    );
  }
};

const removeWallet = (req, res) => {
  try {
    req.session.wallet = false;
    let wallet = req.session.wallet + req.session.reducedWallet;
    let amount = req.session.amountToPay + req.session.reducedWallet;
    req.session.amountToPay = amount;
    res.json({ success: true, amount, wallet });
  } catch (e) {
    console.log("error in the removeWallet in couponControler in userside");
  }
};

module.exports = {
  adminProduct,
  addProduct,
  newProductPage,
  editProduct,
  updateProduct,
  proBlock,
  couponCheck,
  removeCoupon,
  createOrder,
  applyWallet,
  removeWallet,
  searchProduct
};
