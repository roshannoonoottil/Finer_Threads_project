const productModel = require("../models/productModel")
const categoryModel = require("../models/categoryModel")
const multer = require("multer");


const adminProduct = async (req, res) => {
    try {
      var product = await productModel.find({}).sort({ _id: -1 });
      if (req.session.prodData) {
        product = req.session.prodData;
      }
      res.render("productManagement", { username: req.session.username, product });
      console.log(product.name, +"product console")
      //console.log(req.session.prodData);
    } catch (err) {
      res.send("Error Occurred");
    }
  };


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
          .replace('/admin','../');
      }
      console.log(imagePath);
      const newProd = new productModel({
        name: req.body.prodName,
        category: req.body.category,
        rate: req.body.prodRate,
        description: req.body.prodDesc,
        stock: req.body.quantity,
        image: imagePath,
        hide: 0,
      });
      await newProd.save();
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
  
  














  module.exports ={
    adminProduct,
    addProduct,
    newProductPage
  }