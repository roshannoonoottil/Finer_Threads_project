const userDetails = require("../models/userModel");
const productDetails = require("../models/productModel");
const categoryDetails = require("../models/categoryModel");
const cartDetails = require("../models/cartModel");
const wishDetails = require("../models/wishlistModel");
const session = require("express-session");

const viewWish = async (req, res) => {
  try {
    let page = 1;
    if (req.query.page) {
      page = req.query.page;
    }
    const limit = 4;
    const wishData = await wishDetails
      .find({ username: req.session.name })
      .sort({ _id: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit); //cant use const here as it will render error when a product is searched//

    const count = await wishDetails
      .find({ username: req.session.name })
      .countDocuments(); // counts the total products //
    console.log("PRODUCT COUNT IS :" + count);

    // const wishData = await wishDetails.find({ username: req.session.name })
    const userin = req.session.name;
    const cat = await categoryDetails.find({ list: 1 });
    console.log("view wishlist");
    console.log(wishData);
    res.render("userWishlist", {
      wishData,
      userin,
      cat,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (e) {
    console.log("error in the viewCart in cartController user side : " + e);
    res.redirect("/error")
  }
};

const addtoWishList = async (req, res) => {
  try {
    console.log(req.params.id + " add to wishlist");
    const wishPro = await productDetails.findOne({ name: req.params.id });
    const wishDataFound = await wishDetails.findOne({
      product: req.params.id,
      username: req.session.name,
    });
    console.log(req.session.name);

    if (!wishDataFound) {
      console.log("innn");
      const wishData = new wishDetails({
        username: req.session.name,
        product: wishPro.name,
        image: wishPro.image[0],
        rate: wishPro.rate,
        discountAmount: wishPro.discountAmount,
        offer: wishPro.offer,
        stock: wishPro.stock,
      });
      console.log("asfjgafs");
      console.log("++++++++++");

      await wishData.save();
      console.log("----------------");
    }

    res.redirect("/wishlist");
  } catch (e) {
    console.log("error in the addtoCart in cartController user side : " + e);
    res.redirect("/error")
  }
};

const removeWishlist = async (req, res) => {
  try {
    const proName = req.params.id;
    await wishDetails.deleteOne({
      product: proName,
      username: req.session.name,
    });
    res.redirect("/wishlist");
  } catch (e) {
    console.log(
      "error in the removeWishlist in cartController in user side : " + e
    );
    res.redirect("/error")
  }
};

const viewcart = async (req, res) => {
  try {
    const catData = await cartDetails.find({ username: req.session.name });
    const catDataCount = await cartDetails
      .find({ username: req.session.name })
      .countDocuments();
    let totalPrice = 0;
    if (catDataCount != 0) {
      const totalValue = await cartDetails.aggregate([
        {
          $match: { username: req.session.name },
        },
        {
          $group: {
            _id: "$product",
            totalPrice: { $sum: "$offerPrice" },
            totalQuantity: { $sum: "$quentity" },
          },
        },
        {
          $project: {
            _id: 1,
            amount: {
              $multiply: ["$totalPrice", "$totalQuantity"],
            },
          },
        },
        {
          $group: {
            _id: "",
            sum: {
              $sum: "$amount",
            },
          },
        },
      ]);
      console.log(totalValue[0].sum);
      totalPrice = totalValue[0].sum;
    }
    req.session.totalCartPrice = totalPrice;
    const userin = req.session.name;
    const cat = await categoryDetails.find({ list: 0 });
    res.render("cart", { catData, userin, catDataCount, totalPrice, cat });
  } catch (e) {
    console.log("error in the viewCart in cartController user side : " + e);
    res.redirect("/error")
  }
};

const addToCart = async (req, res) => {
  try {
    console.log("add to cart");
    const cartPro = await productDetails.findOne({ name: req.params.id });
    console.log(cartPro, "cart data");
    const cartData = await cartDetails.findOne({ product: req.params.id });
    if (cartData) {
      let updatedValue = cartData.quentity;
      updatedValue++;
      // if ((updatedValue <= 5) & (updatedValue >= 1)) {
      //   await cartDetails.updateOne(
      //     { product: req.params.id },
      //     { quentity: updatedValue }
      //   );
      // }
    } else {
      const categoryData = new cartDetails({
        username: req.session.name,
        product: cartPro.name,
        image: cartPro.image[0],
        rate: cartPro.rate,
        category : cartPro.category ,
        quentity: 1,
        offerPrice: cartPro.discountAmount,
        offer: cartPro.offer,
      });
      await categoryData.save();
    }

    res.redirect("/cart");
  } catch (e) {
    console.log("error in the addtoCart in cartController user side : " + e);
    res.redirect("/error")
  }
};

const deleteCart = async (req, res) => {
  try {
    console.log(req.params.id);
    await cartDetails.deleteOne({ product: req.params.id });
    res.redirect("/cart");
  } catch (e) {
    console.log(
      "error in the deleteCart in cartController in user side : " + e
    );
    res.redirect("/error")
  }
};

const changeQuantity = async (req, res) => {
  try {
    const userin = req.session.name;

    console.log("-----------------------------------------------", req.body);
    console.log(req.body, "enterd to changeQuantity");
    const data = Object.values(req.body);
    console.log(data[0], "data zero");
    const dataCart1 = await cartDetails.findOne({
      $and: [{ username: userin }, { product: `${data[0]}` }],
    });

    let dataCart = await cartDetails.find({
      $and: [{ username: userin }, { product: `${data[0]}` }],
    });

    console.log(dataCart);
    let quantity = dataCart[0].quentity;

    if (req.body.count == "1") {
      quantity++;
    } else {
      quantity--;
    }

    // const catDataCount = await cartDetails.find({ username: req.session.userName }).countDocuments()

    const product = await productDetails.find({ name: dataCart1.product });
    console.log(product[0].stock, "product stocks", quantity);
    if (product[0].stock >= quantity) {
      console.log("before type of");
      console.log(dataCart1.quentity);
      let q = dataCart1.quentity;
      console.log(q + Number(data[1]), "quantity check 10");
      let val = q + Number(data[1]);
      if ((val <= 5) & (val >= 1)) {
        await cartDetails.updateOne(
          { $and: [{ username: userin }, { product: `${data[0]}` }] },
          { $inc: { quentity: req.body.count } }
        );
        console.log("after cartupater");

        console.log("changeQuantity in cart controller in");
      }
      const totalValue = await cartDetails.aggregate([
        {
          $match: { username: req.session.name },
        },
        {
          $group: {
            _id: "$product",
            totalPrice: { $sum: "$offerPrice" },
            totalQuantity: { $sum: "$quentity" },
          },
        },
        {
          $project: {
            _id: 1,
            amount: {
              $multiply: ["$totalPrice", "$totalQuantity"],
            },
          },
        },
        {
          $group: {
            _id: "",
            sum: {
              $sum: "$amount",
            },
          },
        },
      ]);

      dataCart = await cartDetails.find({
        $and: [{ username: userin }, { product: `${data[0]}` }],
      });

      console.log(dataCart);
      quantity = dataCart[0].quentity;
      console.log(quantity, "quantiity kiittyu");
      let totalPrice = Number(quantity) * Number(data[2]);
      console.log(totalPrice);
      console.log(quantity, "quantity after updation");
      console.log(typeof quantity, "quantity after updation");
      let totalAmount = totalValue[0].sum;

      res.json({ response: true, totalPrice, quantity, totalAmount });

      console.log("stock availbe");
    } else {
      res.json({ response: false });
      console.log("out stock availbe");
    }
  } catch (e) {
    console.log(
      "error in the changeQuantity in cartController in user side: " + e
    );
    res.redirect("/error")
  }
};

module.exports = {
  viewWish,
  addtoWishList,
  removeWishlist,
  viewcart,
  addToCart,
  deleteCart,
  changeQuantity,
};
