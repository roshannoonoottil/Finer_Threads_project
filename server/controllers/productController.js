const productModel = require("../models/productModel");
const categoryModel = require("../models/categoryModel");
const multer = require("multer");

const adminProduct = async (req, res) => {
  try {
    var product = await productModel.find({}).sort({ _id: -1 });
    if (req.session.prodData) {
      product = req.session.prodData;
    }
    res.render("productManagement", {
      username: req.session.username,
      product,
    });
    console.log(product.name, +"product console");
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
        .replace("/admin", "../");
    }
    const { prodName, category, prodDesc, prodRate, quantity} = req.body;
        let data=req.body;
        let amount = 0
        if (data.offer == '') {
            const catdata = await categoryModel.find({ name: category })
            if (catdata[0].offer == '') {
                amount = Number(data.discount)
            } else {
                let sum = Number(data.rate) * Number(catdata[0].offer)
                let value = sum / 100
                amount = Number(data.rate) - value
            }
        } else {
          const catdata = await categoryModel.find({ name: category })
          if (catdata[0].offer == '') {
              amount = Number(data.discount)
          } else {
              if (catdata[0].offer > data.offer) {
                  let sum = Number(data.rate) * Number(catdata[0].offer)
                  let value = sum / 100
                  amount = Number(data.rate) - value
              } else {
                  amount = Number(data.discount)
              }
          }
      }
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
        discountAmount: amount
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
      totalImages
    });
  } catch (err) {
    console.log(err.message);
    return res.redirect("/error?message=error-while-updating-category");
  }
};

const updateProduct = async (req, res) => {
  try {
    console.log(req.files," re uploding files");
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
    const catdata = await categoryModel.find({ name: req.body.newProdCat })
        console.log(catdata,'caaaat data')
        let offerPrice
        if (req.body.offer != '') {
            
            if (req.body.offer > catdata[0].offer) {
                let sum = Number(req.body.newProdRate) * Number(req.body.offer)
                let dis = sum / 100
                offerPrice = Number(req.body.newProdRate) - Math.floor(dis)
                console.log(req.body.offer, 'if')
            } else {
                let sum = Number(req.body.newProdRate) * Number(catdata[0].offer)
                let value = sum / 100
                offerPrice = Number(req.body.newProdRate) - value
            }

        }else {
          if (catdata[0].offer == '') {
              console.log('offer is null')
              offerPrice = Number(req.body.newProdRate)
          } else {
              console.log('offer is not null')
              let sum = Number(req.body.newProdRate) * Number(catdata[0].offer)
              let value = sum / 100
              offerPrice = Number(req.body.newProdRate) - value
              console.log(offerPrice,'offferprice - -- -- --')
          }
      }
      if(offerPrice>0){
        
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
        }
      },
      {
          upsert: true
      })
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



module.exports = {
  adminProduct,
  addProduct,
  newProductPage,
  editProduct,
  updateProduct,
  proBlock
};
