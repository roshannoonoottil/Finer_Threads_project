const userDetails = require("../models/userModel");
const productDetails = require("../models/productModel");
const catDetails = require("../models/categoryModel");
const userPro = require("../models/userAddressModel");
const cart = require("../models/cartModel");
const wish = require("../models/wishlistModel");
const order = require("../models/orderModel");
const orderid = require("otp-generator");
const puppeteer = require("puppeteer");
const Razorpay = require("razorpay");
const walletModel = require("../models/walletModel");
require("dotenv").config();

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_YOUR_KEY_ID,
  key_secret: process.env.RAZORPAY_YOUR_KEY_SECRET,
});

const proceedtoCheckOut = async (req, res) => {
  try {
    console.log("req.body of the checkout page!!!!");
    // console.log(req.body.status[0])
    console.log("------------------------------------------------");
    const userin = req.session.name;
    const cat = await catDetails.find({ list: 0 });
    const len = await cart.find({ username: userin });
    console.log(len);
    const cartCount = await cart
      .find({ username: req.session.name })
      .countDocuments();
    const wishCount = await wish.find({ username: userin }).countDocuments();
    const userData = await userDetails.find({ username: req.session.name });
    console.log("agshdfhdsa");
    let email = "";
    if (userData) {
      email = userData[0].email;
    }
    const totalValue = await cart.aggregate([
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
    req.session.amountToPay = totalValue[0].sum;
    console.log(totalValue[0].sum);
    let totalPrice = totalValue[0].sum;
    const address = await userPro.find({ username: req.session.name });
    //let totalPrice = req.session.totalCartPrice
    res.render("userCheckOut", {
      userin,
      cat,
      address,
      userData,
      email,
      cartCount,
      wishCount,
      totalPrice,
    });
  } catch (e) {
    console.log(
      "error in the proceedtoCheckOut in orderController in user sdie : " + e
    );
    // res.redirect("/error")
  }
};

const displayaddress = async (req, res) => {
  try {
    console.log(req.body);
    const id = req.body.addressId;
    console.log(id);
    const data = await userPro.findOne({ _id: id });
    console.log(data);
    res.json({ data });
  } catch (e) {
    console.log(
      "error in the displayaddress function in the orderController in user side: " +
        e
    );
    // res.redirect("/error")
  }
};

const toPayment = async (req, res) => {
  try {
    req.session.address = req.body;
    const address = req.body;
    console.log(req.body + "req.session.address");
    console.log(req.body.newAddress);
    const userin = req.session.name;
    const cartCount = await cart
      .find({ username: req.session.name })
      .countDocuments();
    const wishCount = await wish.find({ username: userin }).countDocuments();
    // console.log(req.body)

    //---------------------------------------------------------------
    const catData = await cart.find({ username: req.session.name });
    const catDataCount = await cart
      .find({ username: req.session.name })
      .countDocuments();
    const proData = await productDetails.find({ name: catData.product });
    const userData = await userDetails.find({ username: userin });
    const wallet = await walletModel.findOne({ userId: userData[0]._id });
    console.log(
      wallet,
      "========================================================================"
    );
    console.log(
      userData,
      "///////////////////////////////////////////////////"
    );
    console.log(catDataCount);
    console.log("before type of");
    let totalPrice = 0;

    console.log("if not entered");
    if (catDataCount != 0) {
      console.log("if  entered");
      console.log(catDataCount);
      const totalValue = await cart.aggregate([
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
    res.render("userPayment", {
      userin,
      wishCount,
      cartCount,
      totalPrice,
      catDataCount,
      catData,
      address,
      userData,
      wallet,
    });
  } catch (e) {
    console.log("error in the toPayment orderController in user side :" + e);
    // res.redirect("/error")
  }
};

const codPayment = async (req, res) => {
  try {
    const userin = req.session.name;

    // console.log(req.body,"this is body");
    const cartData = await cart.find({ username: userin });
    const cartCount = await cart
      .find({ username: req.session.name })
      .countDocuments();
    const wishCount = await wish.find({ username: userin }).countDocuments();
    const date = new Date();
    console.log(date);
    if (req.session.address.newAddress) {
      const newAddress = new userPro({
        username: req.session.name,
        fullname: req.session.address.firstname,
        phone: req.session.address.phone,
        address: {
          houseName: req.session.address.housename,
          city: req.session.address.city,
          state: req.session.address.state,
          pincode: req.session.address.pincode,
          country: req.session.address.country,
        },
        primary: 0,
      });

      await newAddress.save();
    }

    const id = orderid.generate(15, {
      digits: true,
      upperCaseAlphabets: true,
      specialChars: false,
      lowerCaseAlphabets: true,
    });
    req.session.order_ID = id;

    let paymentMentod = "COD";
    if (req.query.pay) {
      paymentMentod = "Online";
    }

    for (let i = 0; i < cartData.length; i++) {
      const shippingAddress = new order({
        username: req.session.name,
        orderDate: date,
        orderId: id,
        status: "placed",
        userCacel: 0,
        adminCancel: 0,
        img: cartData[i].image,
        product: cartData[i].product,
        quentity: cartData[i].quentity,
        price: cartData[i].quentity * cartData[i].rate,
        offerPrice: cartData[i].quentity * cartData[i].offerPrice,
        paymentMentod: paymentMentod,
        amountPaid: req.session.amountToPay,
        address: {
          houseName: req.session.address.housename,
          city: req.session.address.city,
          state: req.session.address.state,
          pincode: req.session.address.pincode,
          country: req.session.address.country,
        },
      });

      await shippingAddress.save();
    }

    // update wallet amout if used

    // console.log(date.toDateString())
    const orderData = await order.find({ orderDate: date });
    const data = await order.aggregate([
      { $match: { orderId: id } },
      {
        $group: {
          _id: "null",
          totalPrice: { $sum: "$price" },
          totalQuantity: { $sum: "$quentity" },
        },
      },
    ]);
    console.log(data[0].totalPrice);
    console.log(data);
    let price = req.session.amountToPay;
    let qunatity = data[0].totalQuantity;
    req.session.qunatityy = qunatity;

    console.log(req.session.wallet, "/./././././././././.");
    if (req.session.wallet) {
      const userData = await userDetails.findOne({ username: userin });
      const walletData = await walletModel.findOne({ userId: userData._id });
      console.log(userData, "//////////////-===========-------");
      console.log(walletData, "///////////////////////////////");
      walletTransactions = {
        date: new Date(),
        type: `Debited for Order ${id}`,
        amount: walletData.wallet - req.session.walletAmount,
      };

      

      let updateWallet = await walletModel.updateOne(
        { userId: userData._id },
        {
          // $inc: { wallet: + user.offerPrice },
          $set: { wallet: req.session.walletAmount },
          $push: { walletTransactions: walletTransactions },
        }
      );
    }

    //--------------------------------------------------------------------

    for (let i = 0; i < cartCount; i++) {
      console.log(cartData);
      const updatedProduct = await productDetails.findOneAndUpdate(
          { name: cartData[i].product },
          { $inc: { stock: -cartData[i].quentity } },
          { new: true } // To return the updated document
      );
      console.log('Updated product:', updatedProduct);
  }

    //--------------------------------------------------------------------

    await cart.deleteMany({ username: userin });

    req.session.amountToPay = 0;
    res.render("userOrderPlaced", {
      id,
      date,
      userin,
      wishCount,
      cartCount,
      price,
      qunatity,
    });

  } catch (e) {
    console.log(
      "error in the codPayment of orderController in user side : " + e
    );
    // res.redirect("/error")
  }
};

const razorpayPaymentFailed = async (req, res) => {
  try {
    const userin = req.session.name;
    console.log(req.session.address);
    const cartData = await cart.find({ username: userin });
    const cartCount = await cart
      .find({ username: req.session.name })
      .countDocuments();
    const wishCount = await wish.find({ username: userin }).countDocuments();
    const date = new Date();
    req.session.order_Date = date;
    req.session.wishCount = wishCount;
    req.session.cartCount = cartCount;
    console.log(date);
    if (req.session.address.newAddress) {
      const newAddress = new userPro({
        username: req.session.name,
        fullname: req.session.address.firstname,
        phone: req.session.address.phone,
        address: {
          houseName: req.session.address.housename,
          city: req.session.address.city,
          state: req.session.address.state,
          pincode: req.session.address.pincode,
          country: req.session.address.country,
        },
        primary: 0,
      });

      await newAddress.save();
    }
    const id = orderid.generate(15, {
      digits: true,
      upperCaseAlphabets: true,
      specialChars: false,
      lowerCaseAlphabets: true,
    });
    req.session.order_ID = id;
    let amount = req.session.amountToPay;

    for (let i = 0; i < cartData.length; i++) {
      const shippingAddress = new order({
        username: req.session.name,
        orderDate: date,
        orderId: id,
        status: "Failed",
        userCacel: 0,
        adminCancel: 0,
        img: cartData[i].image,
        product: cartData[i].product,
        quentity: cartData[i].quentity,
        price: cartData[i].quentity * cartData[i].rate,
        offerPrice: cartData[i].quentity * cartData[i].offerPrice,
        paymentMentod: "Online",
        amountPaid: 0,
        address: {
          houseName: req.session.address.housename,
          city: req.session.address.city,
          state: req.session.address.state,
          pincode: req.session.address.pincode,
          country: req.session.address.country,
        },
      });

      await shippingAddress.save();
    }

    res.render("rPayFail", {
      user: req.session.name,
      id,
      date,
      amount,
    });
  } catch (e) {
    console.log(
      "error in the razorpayPaymentFailed of orderController in user side : " +
        e
    );
  }
};

const reRazorpay = async (req, res) => {
  try {
    console.log("reRazorpay invoked");
    console.log(req.body.id);

    const splitValues = req.body.id.split("-");
    let id = splitValues[0];
    let amount = splitValues[1] * 100;
    console.log("Order ID is :", id);
    console.log("Amount is:", amount);
    req.session.orderid_in_repay = id;

    const options = {
      amount: amount,
      currency: "INR",
      receipt: "razorUser@gmail.com",
    };

    razorpayInstance.orders.create(options, (err, order) => {
      console.log(err);
      console.log(order);
      if (!err) {
        res.status(200).send({
          success: true,
          msg: "Order Created",
          order_id: order.id,
          amount: amount,
          key_id: process.env.RAZORPAY_YOUR_KEY_ID,
          product_name: req.body.name,
          description: req.body.description,
          contact: "9633464005",
          name: "FinerThreads",
          email: "info@finerThreadsgmail.com",
        });
      } else {
        res.status(400).send({ success: false, msg: "Something went wrong!" });
      }
    });
  } catch (error) {
    console.log("error happened between reRazorpay in orderController.", error);
  }
};

const orderPlaced = async (req, res) => {
  try {
    const userin = req.session.name;
    console.log("ORderplaced page");

    if (req.query.statuss) {
      console.log("Status passed as query:", req.query.statuss);
      console.log(
        "Order Id kept in session from repay is: ",
        req.session.orderid_in_repay
      );
      req.session.initial_status = "placed";

      await order.updateOne(
        { orderId: req.session.orderid_in_repay },
        { $set: { status: "placed", amountPaid: req.session.amountToPay } }
      );


      for (let i = 0; i < cartCount; i++) {
        console.log(cartData);
        const updatedProduct = await productDetails.findOneAndUpdate(
            { name: cartData[i].product },
            { $inc: { stock: -cartData[i].quentity } },
            { new: true } // To return the updated document
        );
        console.log('Updated product:', updatedProduct);
    }

      await cart.deleteMany({ username: req.session.name });
    }
    let datee = req.session.order_Date;
    const date = new Date(datee);

    res.render("userOrderPlaced", {
      id: req.session.order_ID,
      date,
      userin,
      wishCount: req.session.wishCount,
      cartCount: req.session.cartCount,
      price: req.session.amountToPay,
      qunatity: req.session.qunatityy,
    });
  } catch (error) {
    console.log("Error when orderPlaced in orderController: ", error);
  }
};

// const discard_Online_Payment = async (req, res) => {
//   try {
//     console.log("Discard Razorpay failed transaction");
//     console.log(req.body);
//     console.log(req.session.user_Applied_Coupon);
//   } catch (error) {
//     console.log(
//       "error happened between discard_Online_Payment in orderController.",
//       error
//     );
//   }
// };

const orderData = async (req, res) => {
  try {
    const userin = req.session.name;
    const dataOrder = await order.find({ username: userin }).sort({ _id: -1 });
    // const dataOrderId = await order.distinct('orderId')
    // const dataOrderDate = await order.distinct('orderDate')
    const cartCount = await cart
      .find({ username: req.session.name })
      .countDocuments();
    const wishCount = await wish.find({ username: userin }).countDocuments();
    console.log(dataOrder);
    res.render("userOrderHistory", { dataOrder, userin, wishCount, cartCount });
  } catch (e) {
    console.log("error in the orderData of orderController in user side:" + e);
    res.redirect("/error");
  }
};

const showDetailOrderHistory = async (req, res) => {
  try {
    console.log(req.params.id);
    const userin = req.session.userName;
    const data = await order.find({ orderId: req.params.id });
    const img = await productDetails.findOne({ name: data.product });
    const cartCount = await cart.find({ username: userin }).count();
    //console.log(cartCount)
    console.log(
      data[0],
      "orderdata is notksnfgighasbfj--------------------------------------"
    );
    res.render("userOrderSiglePage", { data, img, userin, cartCount });
  } catch (e) {
    console.log(
      "error in the showDetailOrderHistory in orderController in the userSide : " +
        e
    );
    res.redirect("/error");
  }
};

const orderHistory = async (req, res) => {
  try {
    console.log(req.query.orderId);
    console.log(req.query.product);
    const data = await order.find({
      $and: [{ orderId: req.query.orderId }, { product: req.query.product }],
    });
    const price = await productDetails.find({ name: req.query.product });
    console.log(
      data,
      "=============================================================="
    );
    res.render("userOrderSiglePage", { data, price });
  } catch (e) {
    console.log(
      "error in the ordreHistory in orderController in the user side : " + e
    );
    res.redirect("/error");
  }
};

const cancelPro = async (req, res) => {
  try {
    // await order.updateOne({ orderId: req.params.id }, { adminCancel: 1, status: 'CANCELED' })
   await order.updateOne(
      {
        $and: [{ orderId: req.query.orderId }, { product: req.query.product }],
      },
      {
        $set: { status: "CANCELED", adminCancel: 1 },
      }
    );

    const orderData =  await order.findOne({
      $and:[{ orderId: req.query.orderId }, { product: req.query.product }]
    })

    console.log(orderData.quentity, " stock Data");

    const updatedProduct = await productDetails.findOneAndUpdate(
      { name: req.query.product },
      { $inc: { stock: +orderData.quentity } },
      { new: true } // To return the updated document
  );
  console.log('Updated product:', updatedProduct);

    res.redirect(
      `/historyOrder?orderId=${req.query.orderId}&product=${req.query.product}`
    );
  } catch (e) {
    console.log(
      "error in the cancelPro in orderController in user side : " + e
    );
  }
};

const returnPro = async (req, res) => {
  try {
    await order.updateOne(
      { orderId: req.params.id },
      { status: "Returnde Successfully" }
    );
    res.redirect("/orderhistory");
  } catch (e) {
    console.log(
      "error in thr returnPro in orderController in user side : " + e
    );
    res.redirect("/error");
  }
};

const returnreason = async (req, res) => {
  try {
    console.log(req.body);
    console.log(req.params.id);
    const val = await order.updateOne(
      { orderId: req.params.id, product: req.query.product },
      { returnStatus: 0, returnreason: req.body.reason },
      { upsert: true }
    );
    console.log(val);
    res.redirect(
      `/orderHistoryPage/${req.params.id}?product=${req.query.product}`
    );
  } catch (e) {
    console.log(
      "error in the returnreason in ordercontroller in user side : " + e
    );
    res.redirect("/error");
  }
};

const salesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    // Aggregate to get total sales amount
    const totalSales = await order.aggregate([
      {
        $match: {
          orderDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$price" }, // Assuming total amount field name is totalAmount
        },
      },
    ]);

    // Aggregate to get total discount amount
    const totalDiscount = await order.aggregate([
      {
        $match: {
          orderDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
          status: { $ne: "CANCELED" },
        },
      },
      {
        $group: {
          _id: null,
          totalDiscount: { $sum: "$offerPrice" }, // Assuming discount field name is discount
          price: { $sum: "$price" },
        },
      },
    ]);

    const Product = await order.aggregate([
      {
        $match: {
          orderDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
          status: { $ne: "CANCELED" },
        },
      },
      {
        $group: {
          _id: "$product",
          totalOrders: { $sum: 1 },
          price: { $sum: "$price" },
          Offerprice: { $sum: "$offerPrice" },
        },
      },
    ]);

    const status = await order.aggregate([
      {
        $match: {
          orderDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Sales Report</title>
          <style>
              body {
                  margin-left: 20px;
              }
          </style>
      </head>
      <body>
          <h2 align="center"> Sales Report</h2>
          Start Date: ${startDate}<br>
          End Date: ${endDate}<br>
          <center>
          <h3>Total Sales</h3>
              <table style="border-collapse: collapse;">
                  <thead>
                      <tr>
                          <th style="border: 1px solid #000; padding: 8px;">Sl N0</th>
                          <th style="border: 1px solid #000; padding: 8px;">Product Name</th>
                          <th style="border: 1px solid #000; padding: 8px;">Product price</th>
                          <th style="border: 1px solid #000; padding: 8px;">Product Offer price</th>
                          <th style="border: 1px solid #000; padding: 8px;">Total Orders</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${Product.map(
                        (item, index) => `
                              <tr>
                                  <td style="border: 1px solid #000; padding: 8px;">${
                                    index + 1
                                  }</td>
                                  <td style="border: 1px solid #000; padding: 8px;">${
                                    item._id
                                  }</td>
                                  <td style="border: 1px solid #000; padding: 8px;">${
                                    item.price
                                  }</td>
                                  <td style="border: 1px solid #000; padding: 8px;">${
                                    item.Offerprice
                                  }</td>
                                  <td style="border: 1px solid #000; padding: 8px;">${
                                    item.totalOrders
                                  }</td>
                              </tr>`
                      )}

                  </tbody>
              </table>
          </center>
          <center>
          <h3>Order Status</h3>
              <table style="border-collapse: collapse;">
                  <thead>
                      <tr>
                          <th style="border: 1px solid #000; padding: 8px;">Sl N0</th>
                          <th style="border: 1px solid #000; padding: 8px;">Status</th>
                          <th style="border: 1px solid #000; padding: 8px;">Total Count</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${status.map(
                        (item, index) => `
                              <tr>
                                  <td style="border: 1px solid #000; padding: 8px;">${
                                    index + 1
                                  }</td>
                                  <td style="border: 1px solid #000; padding: 8px;">${
                                    item._id
                                  }</td>
                                  <td style="border: 1px solid #000; padding: 8px;">${
                                    item.count
                                  }</td>
                              </tr>`
                      )}

                  </tbody>
              </table>
          </center>
          <h3>Total Amount: ${
            totalDiscount.length > 0 ? totalDiscount[0].price : 0
          }</h3>
          <h3>Total Discount Amount: ${
            totalDiscount[0].price - totalDiscount[0].totalDiscount
          }</h3>
      </body>
      </html>
  `;

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(htmlContent);

    const pdfBuffer = await page.pdf();

    await browser.close();

    res.setHeader("Content-Length", pdfBuffer.length);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=sales.pdf");
    res.status(200).end(pdfBuffer);
  } catch (err) {
    console.log(err);
    // res.redirect('/admin/errorPage')
  }
};

const invoice = async (req, res) => {
  try {
    console.log(req.query.orderId);
    console.log(req.query.product);

    const orders = await order.find({
      orderId: req.query.orderId,
      product: req.query.product,
    });
    const originalDate = new Date(orders[0].orderDate);
    const formattedDate = originalDate.toLocaleDateString("en-US"); // Adjust the locale as needed

    console.log(formattedDate);
    let amount = 0;
    let discount = 0;
    if (orders[0].amountPaid == orders[0].price) {
      amount = orders[0].price * orders[0].quentity;
      discount = 0;
    } else {
      amount = orders[0].price * orders[0].quentity;
      discount = orders[0].price - orders[0].amountPaid;
    }

    //data

    console.log(orders);
    // copy
    const htmlContent = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice</title>
      <style>
          /! tailwindcss v3.0.12 | MIT License | https://tailwindcss.com/,:after,:before{box-sizing:border-box;border:0 solid #e5e7eb}:after,:before{--tw-content:""}html{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;-o-tab-size:4;tab-size:4;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji}body{margin:0;line-height:inherit}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,pre,samp{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:initial}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}button,input,optgroup,select,textarea{font-family:inherit;font-size:100%;line-height:inherit;color:inherit;margin:0;padding:0}button,select{text-transform:none}[type=button],[type=reset],[type=submit],button{-webkit-appearance:button;background-color:initial;background-image:none}:-moz-focusring{outline:auto}:-moz-ui-invalid{box-shadow:none}progress{vertical-align:initial}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}blockquote,dd,dl,figure,h1,h2,h3,h4,h5,h6,hr,p,pre{margin:0}fieldset{margin:0}fieldset,legend{padding:0}menu,ol,ul{list-style:none;margin:0;padding:0}textarea{resize:vertical}input::-moz-placeholder,textarea::-moz-placeholder{opacity:1;color:#9ca3af}input:-ms-input-placeholder,textarea:-ms-input-placeholder{opacity:1;color:#9ca3af}input::placeholder,textarea::placeholder{opacity:1;color:#9ca3af}[role=button],button{cursor:pointer}:disabled{cursor:default}audio,canvas,embed,iframe,img,object,svg,video{display:block;vertical-align:middle}img,video{max-width:100%;height:auto}[hidden]{display:none},:after,:before{--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness:proximity;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:#3b82f680;--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: }.flex{display:flex}.table{display:table}.table-cell{display:table-cell}.table-header-group{display:table-header-group}.table-row-group{display:table-row-group}.table-row{display:table-row}.hidden{display:none}.w-60{width:15rem}.w-40{width:10rem}.w-full{width:100%}.w-\[12rem\]{width:12rem}.w-9\/12{width:75%}.w-3\/12{width:25%}.w-6\/12{width:50%}.w-2\/12{width:16.666667%}.w-\[10\%\]{width:10%}.flex-1{flex:1 1 0%}.flex-col{flex-direction:column}.items-start{align-items:flex-start}.items-end{align-items:flex-end}.justify-center{justify-content:center}.rounded-l-lg{border-top-left-radius:.5rem;border-bottom-left-radius:.5rem}.rounded-r-lg{border-top-right-radius:.5rem;border-bottom-right-radius:.5rem}.border-x-\[1px\]{border-left-width:1px;border-right-width:1px}.bg-gray-700{--tw-bg-opacity:1;background-color:rgb(55 65 81/var(--tw-bg-opacity))}.p-10{padding:2.5rem}.py-1{padding-top:.25rem;padding-bottom:.25rem}.py-2{padding-top:.5rem;padding-bottom:.5rem}.px-4{padding-left:1rem;padding-right:1rem}.py-6{padding-top:1.5rem;padding-bottom:1.5rem}.pl-4{padding-left:1rem}.pb-20{padding-bottom:5rem}.pb-16{padding-bottom:4rem}.pb-1{padding-bottom:.25rem}.pb-2{padding-bottom:.5rem}.pt-20{padding-top:5rem}.pr-10{padding-right:2.5rem}.pl-24{padding-left:6rem}.pb-6{padding-bottom:1.5rem}.pl-10{padding-left:2.5rem}.text-left{text-align:left}.text-center{text-align:center}.text-right{text-align:right}.text-4xl{font-size:2.25rem;line-height:2.5rem}.text-xl{font-size:1.25rem;line-height:1.75rem}.font-bold{font-weight:700}.font-normal{font-weight:400}.text-gray-500{--tw-text-opacity:1;color:rgb(107 114 128/var(--tw-text-opacity))}.text-white{--tw-text-opacity:1;color:rgb(255 255 255/var(--tw-text-opacity))}.text-gray-400{--tw-text-opacity:1;color:rgb(156 163 175/var(--tw-text-opacity))}.text-black{--tw-text-opacity:1;color:rgb(0 0 0/var(--tw-text-opacity))}
      </style>
  </head>
  <body>
      <div class="p-10">
          <!--Logo and Other info-->
          <div class="flex items-start justify-center">
              <div class="flex-1">
                  <div class="w-60 pb-6">
                      <img class="w-40" src="https://scontent.fblr8-1.fna.fbcdn.net/v/t39.30808-6/436305798_2735457306606689_214745045166516241_n.jpg?_nc_cat=102&ccb=1-7&_nc_sid=5f2048&_nc_ohc=KjsBMjNrUwoAb77bCEc&_nc_ht=scontent.fblr8-1.fna&oh=00_AfCqjx8Y85Z4Y0kpq4nIxnWegR5p83qEw6RdG3S8VwgvLA&oe=6621332B" alt="Logo">
                  </div>
                  
                  <div class="w-60 pl-4 pb-6">
                      <h3 class="font-bold">Finer Threads</h3>
                      <p>HSR Layout</p>
                      <p>Banglore 560102</p>
                  </div>
                  
                  <div class="pl-4 pb-20">
                      <p class="text-gray-500">Billing Address:</p>
                      <h3 class="font-bold">${orders[0].username}</h3>
                      <h5 class="font-bold">${orders[0].address.houseName}, ${
      orders[0].address.city
    }</h5>
                      <h5 class="font-bold">${orders[0].address.state}, ${
      orders[0].address.pincode
    }</h5>
                      <h5 class="font-bold">${orders[0].address.country}</h5>
                  </div>
                  
              </div>
              <div class="flex items-end flex-col">
  
                  <div class="pb-16">
                      <h1 class=" font-normal text-4xl pb-1">Invoice</h1>
                      <br><p class="text-right text-gray-500 text-xl"></p>
                      <p class="text-right text-gray-500 text-xl"># ${
                        orders[0].orderId
                      }</p>
                  </div>
  
                  <div class="flex">
                      <div class="flex flex-col items-end">
                          <p class="text-gray-500 py-1">Date:</p>
                          <p class="text-gray-500 py-1">Payment Method:</p>
                      </div>
                      <div class="flex flex-col items-end w-[12rem] text-right">
                          <p class="py-1">${formattedDate}</p>
                          <p class="py-1 pl-10">${orders[0].paymentMentod}</p>
                      </div>
                  </div>
              </div>
          </div>
          
          <!--Items List-->
          <div class="table w-full">
              <div class=" table-header-group bg-gray-700 text-white ">
                  <div class=" table-row ">
                      <div class=" table-cell w-6/12 text-left py-2 px-4 rounded-l-lg border-x-[1px]">Item</div>
                      <div class=" table-cell w-[10%] text-center border-x-[1px]">Quantity</div>
                      <div class=" table-cell w-2/12 text-center border-x-[1px]">Rate</div>
                      <div class=" table-cell w-2/12 text-center border-x-[1px]">Discount</div>
                      <div class=" table-cell w-2/12 text-center rounded-r-lg border-x-[1px]">Amount</div>
                  </div>
              </div>
  
              <div class="table-row-group">
                  ${getDeliveryItemsHTML(orders)}
              </div>
          </div>
          
          <!--Total Amount-->
          <div class=" pt-20 pr-10 text-right">
              <p class="text-gray-400">Total: <span class="pl-24 text-black font-bold text-xl">₹${
                orders[0].amountPaid
              }</span></p>
          </div>
  
          <!--Notes and Other info-->
          <div class="py-6">
              <p class="text-gray-400 pb-2">Notes:</p>
              <p>Thank you for being a Awesome customer!</p>
          </div>
  
          <div class="">
              <p class="text-gray-400 pb-2">Terms:</p>
              <p>Invoice is Auto generated at the time of delivery,if there is any issue contact provider.</p>
          </div>
      </div>
  </body>
  </html>
  `;

    //table function for inserting dynamic product details into invoice
    function getDeliveryItemsHTML(orders) {
      let data = "";
      for (let order of orders) {
        data += `
      <div class="table-row">
          <div class=" table-cell w-6/12 text-left font-bold py-1 px-4">${
            order.product
          }</div>
          <div class=" table-cell w-[10%] text-center">${order.quentity}</div>
          <div class=" table-cell w-2/12 text-center">₹${order.price}</div>
          <div class=" table-cell w-2/12 text-center">₹${
            order.price - order.amountPaid
          }</div>
          <div class=" table-cell w-2/12 text-center">₹${
            order.price * order.quentity
          }</div>
      </div>
      `;
      }
      return data;
    }

    const browser = await puppeteer.launch({
      // executablePath: '/usr/bin/chromium-browser'
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent);

    const pdfBuffer = await page.pdf();

    await browser.close();

    res.setHeader("Content-Length", pdfBuffer.length);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=invoice.pdf");
    res.status(200).end(pdfBuffer);
    // copy
  } catch (e) {
    console.log("error in the invoice orderController in userside : " + e);
    res.redirect("/error");
  }
};

module.exports = {
  proceedtoCheckOut,
  displayaddress,
  toPayment,
  codPayment,
  orderData,
  orderHistory,
  cancelPro,
  returnPro,
  returnreason,
  showDetailOrderHistory,
  salesReport,
  razorpayPaymentFailed,
  reRazorpay,
  orderPlaced,
  invoice,
};
