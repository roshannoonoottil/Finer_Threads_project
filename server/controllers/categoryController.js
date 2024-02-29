const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const catMod = require("../models/categoryModel");

const showCategory = async (req, res) => {
  try {
    const listData = await catMod.find({}).sort({ _id: -1 });
    // console.log(listData)
    const categoryFound = req.query.err;
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
    console.log(req.body.category);
    const categoryFound = await catMod.find({
      name: { $regex: new RegExp(req.body.category, "i") },
    });
    console.log(categoryFound);
    if (categoryFound.length > 0) {
      res.redirect("/admin/category?err=Category already exits");
    } else {
      if (req.body.category) {
        const catData = new catMod({
          name: req.body.category,
          list: 0,
        });
        await catData.save();
        res.redirect("/admin/category");
      } else {
        console.log(
          "Error in the edit_category : catgeory is not getting!!! else part"
        );
      }
    }
  } catch (e) {
    console.log("Error in the edit_catergory in admin side : " + e);
  }
};

const categoryEdit = async (req, res) => {
  try {
     console.log(req.body.category)
    const categoryFound = await catMod.find({
      name: { $regex: new RegExp(req.body.category, "i") },
    });
    console.log(req.body.name+" hi1");
    console.log(categoryFound.name+" hi2");
    if (req.body.name === categoryFound.name) {
      res.redirect("/admin/category?err=Category already exits");
    } else {
      await catMod.updateOne(
        { name: req.params.id },
        { $set: { name: req.body.name } }
      );

      // await productDetails.updateMany({ category: req.params.id }, { $set: { category: req.body.name } })
      res.redirect("/admin/category");
    }
  } catch (e) {
    console.log("error in the edit_category of adminController : " + e);
  }
};

const list = async (req, res) => {
  try {
    const name = req.params.id;
    console.log(name);
    const productData = await catMod.findOne({ name: name });
    let val = 1;
    if (productData.list == 1) val = 0;
    await catMod.updateMany({ name: name }, { $set: { list: val } });
    // await productDetails.updateMany({ category: name }, { $set: { list: val } })
    res.redirect(`/admin/category`);
  } catch (e) {
    console.log("catch of list in admin : " + e);
  }
};

module.exports = {
  showCategory,
  addCategory,
  categoryEdit,
  list,
};
