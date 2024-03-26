const userDetails = require("../models/userModel");
const productDetails = require("../models/productModel");
const catDetails = require("../models/categoryModel");
const userPro = require("../models/userAddressModel");
const cart = require("../models/cartModel");
const wish = require("../models/wishlistModel");
const order = require("../models/orderModel");
const orderid = require("otp-generator");
const puppeteer = require("puppeteer");

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
    });
  } catch (e) {
    console.log("error in the toPayment orderController in user side :" + e);
    // res.redirect("/error")
  }
};

const codPayment = async (req, res) => {
  try {
    const userin = req.session.name;
    console.log(req.session.address);
    console.log(req.body);
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

    let paymentMentod = "COD";
    if (req.query.pay) {
      paymentMentod = "Online"
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

  //   const user = await userDetails.find({ username: req.session.name });
  //   console.log(user[0].wallet,"wallet check");
  //   if(){

  //     let amount = user[0].wallet - price ;
  //   await userDetails.updateOne(
  //     { username: req.session.name },
  //     { $set: { wallet: amount } },
  //     { upsert: true }
  //   );

  // }else{

  //   await userDetails.updateOne(
  //     { username: req.session.name },
  //     { $set: { wallet: 0 } },
  //     { upsert: true }
  //   );

  // }


  } catch (e) {
    console.log(
      "error in the codPayment of orderController in user side : " + e
    );
    // res.redirect("/error")
  }
};

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
        },
      },
      {
        $group: {
          _id: null,
          totalDiscount: { $sum: "$amountPaid" }, // Assuming discount field name is discount
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
        },
      },
      {
        $group: {
          _id: "$product",
          totalOrders: { $sum: 1 },
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
                          <th style="border: 1px solid #000; padding: 8px;">Product</th>
                          <th style="border: 1px solid #000; padding: 8px;">Total Orders</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${Product
                        .map(
                          (item, index) => `
                              <tr>
                                  <td style="border: 1px solid #000; padding: 8px;">${index + 1
                                  }</td>
                                  <td style="border: 1px solid #000; padding: 8px;">${item._id
                                  }</td>
                                  <td style="border: 1px solid #000; padding: 8px;">${item.totalOrders
                                  }</td>
                              </tr>`
                        )
                      }

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
                      ${status
                        .map(
                          (item, index) => `
                              <tr>
                                  <td style="border: 1px solid #000; padding: 8px;">${index + 1
                                  }</td>
                                  <td style="border: 1px solid #000; padding: 8px;">${item._id
                                  }</td>
                                  <td style="border: 1px solid #000; padding: 8px;">${item.count
                                  }</td>
                              </tr>`
                        )
                      }

                  </tbody>
              </table>
          </center>
          <h3>Total Sales Amount: ${totalSales.length > 0 ? totalSales[0].totalAmount : 0}</h3>
          <h3>Total Discount Amount: ${totalDiscount.length > 0 ? totalDiscount[0].totalDiscount : 0}</h3>
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
}


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
  salesReport
};
