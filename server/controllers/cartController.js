const userDetails = require('../models/userModel')
const productDetails = require('../models/productModel')
const categoryDetails = require('../models/categoryModel')
const cartDetails = require('../models/cartModel')
const wishDetails = require('../models/wishlistModel')
const session = require('express-session');




const viewWish = async (req, res) => {
    try {
        const wishData = await wishDetails.find({ username: req.session.name })
        // const proData = await productDetails.find({name:catData.product})
        const userin = req.session.name
        const cat = await categoryDetails.find({ list: 1 })
        console.log("view wishlist");
        console.log(wishData);
        res.render('userWishlist', { wishData, userin, cat })
    } catch (e) {
        console.log('error in the viewCart in cartController user side : ' + e)
        res.redirect("/error")
    }
}

const addtoWishList = async (req, res) => {
    try {
        console.log(req.params.id+" add to wishlist");
        const wishPro = await productDetails.findOne({ name: req.params.id })
        const wishDataFound = await wishDetails.findOne({ product: req.params.id , username: req.session.name})
        console.log(req.session.name)
        if (!wishDataFound) {
            console.log("innn");
            const wishData = new wishDetails({
                username: req.session.name,
                product: wishPro.name,
                image: wishPro.image[0],
                rate: wishPro.rate,
                discountAmount: wishPro.discountAmount,
                offer: wishPro.offer
            })
            console.log('asfjgafs')
            console.log('++++++++++')

            await wishData.save()
            console.log('----------------')
        }

        res.redirect('/wishlist')
    } catch (e) {
        console.log('error in the addtoCart in cartController user side : ' + e)
        res.redirect("/error")
    }
}

const removeWishlist = async (req, res) => {
    try {
        const proName = req.params.id
        await wishDetails.deleteOne({ product: proName , username: req.session.name })
        res.redirect('/wishlist')
    } catch (e) {
        console.log('error in the removeWishlist in cartController in user side : ' + e)
        res.redirect("/error")
    }
}

const viewcart = async (req,res)=>{
    try {
        const catData = await cartDetails.find({ username: req.session.name })
        const catDataCount = await cartDetails.find({ username: req.session.name }).countDocuments()
        let totalPrice = 0
        if (catDataCount != 0) {
            const totalValue = await cartDetails.aggregate([
                {
                    $match: { username: req.session.name }
                },
                {
                    $group: {
                        _id: '$product',
                        totalPrice: { $sum: '$offerPrice' },
                        totalQuantity: { $sum: '$quentity' }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        amount: {
                            $multiply: ['$totalPrice', '$totalQuantity']
                        }
                    }
                },
                {
                    $group: {
                        _id: '',
                        sum: {
                            $sum: '$amount'
                        }
                    }
                }
            ])
            console.log(totalValue[0].sum)
            totalPrice = totalValue[0].sum
        }
        req.session.totalCartPrice = totalPrice
        const userin = req.session.name
        const cat = await categoryDetails.find({ list: 0 })
        res.render('cart', { catData, userin, catDataCount, totalPrice, cat })
        } catch (e) {
        console.log('error in the viewCart in cartController user side : ' + e)
        //  res.redirect("/error")
        }
    };




   const addToCart =  async (req, res) => {

    try{
        console.log("add to cart");
        const cartPro = await productDetails.findOne({ name: req.params.id })
        console.log(cartPro,"cart data");
        const cartData = await cartDetails.findOne({ product: req.params.id })
        if (cartData) {
            let updatedValue = cartData.quentity
            updatedValue++
            await cartDetails.updateOne({ product: req.params.id }, { quentity: updatedValue })
        } else {
            const categoryData = new cartDetails({
                username: req.session.name,
                product: cartPro.name,
                image: cartPro.image[0],
                rate: cartPro.rate,
                quentity: 1,
                offerPrice:cartPro.discountAmount,
                offer:cartPro.offer
            })
            await categoryData.save()
        }

        res.redirect('/cart')
    } catch (e) {
        console.log('error in the addtoCart in cartController user side : ' + e)
        // res.redirect("/error")
    }

   };
   









module.exports={
    viewWish,
    addtoWishList,
    removeWishlist,
    viewcart,
    addToCart
    
};