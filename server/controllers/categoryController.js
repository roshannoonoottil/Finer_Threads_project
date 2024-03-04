const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const catMod = require("../models/categoryModel");
const productDetails = require('../models/productModel')

const showCategory = async (req, res) => {
  try {
    // Fetching all category data and sorting by _id in descending order
    const listData = await catMod.find({}).sort({ _id: -1 });

    // Extracting any error message from the query parameters
    const categoryFound = req.query.err;

    // Rendering the admin_category view with data
    res.render("admin_category", {
      listData,
      categoryFound,
      username: req.session.username,
    });
  } catch (e) {
    console.log("error in the showCategory in admin side : " + e);
  }
};


const addCategory = async (req, res) => {
  try {
    const { category, offer } = req.body; // Destructuring req.body to get category and offer

    console.log(category + " add category");

    // Finding category by name ignoring case
    const categoryFound = await catMod.find({
      name: { $regex: new RegExp(category, "i") },
    });

    console.log(categoryFound);

    if (categoryFound.length > 0) {
      res.redirect("/admin/category?err=Category already exits");
    } else {
      if (category) {
        // Creating a new category document
        const catData = new catMod({
          name: category,
          list: 0,
          offer: offer,
        });

        // Saving the new category document
        await catData.save();
        res.redirect("/admin/category");
      } else {
        console.log(
          "Error in the edit_category: category is not getting!!! else part"
        );
      }
    }
  } catch (e) {
    console.log("Error in the edit_catergory in admin side: " + e);
  }
};


const list = async (req, res) => {
  try {
    const { id: name } = req.params; // Destructuring req.params to get the id as name
    console.log(name);
    
    // Finding a category by name
    const productData = await catMod.findOne({ name });
    
    let val = 1;
    if (productData.list === 1) {
      val = 0;
    }

    // Updating multiple documents with the same name
    await catMod.updateMany({ name }, { $set: { list: val } });

    // Redirecting to admin category page
    res.redirect(`/admin/category`);
  } catch (e) {
    console.log("catch of list in admin : " + e);
  }
};



const categoryEdit = async (req, res) => {
  try {
      // Retrieve category details from the request body
      const { name, oldname, offer } = req.body;

      // Find category by name ignoring case
      const categoryFound = await catMod.find({ name: { $regex: new RegExp(`^${name}`, 'i') } });

      if ((categoryFound.length == 0) || (categoryFound[0].name == oldname)) {
          // Update category details
          await catMod.updateOne({ name: req.params.id }, { $set: { name, offer } }, { upsert: true });

          // Update product details based on category changes
          const productData = await productDetails.find({ category: req.params.id });
          for (let i = 0; i < productData.length; i++) {
              let discountAmount;

              if (offer !== '') {
                  // Calculate discountAmount based on offer
                  const sum = productData[i].rate * offer;
                  const value = sum / 100;
                  discountAmount = productData[i].rate - value;
              } else {
                  discountAmount = productData[i].rate;
              }

              // Update product details with discountAmount
              await productDetails.updateMany({ name: productData[i].name }, { $set: { discountAmount } }, { upsert: true });
          }

          res.redirect('/admin/category');
      } else {
          res.redirect('/admin/category?err=Category already exists');
      }
  } catch (e) {
      console.log('Error in the edit_category of adminController:', e);
      // res.redirect('/admin/errorPage');
  }
}








module.exports = {
  showCategory,
  addCategory,
  categoryEdit,
  list,
};
