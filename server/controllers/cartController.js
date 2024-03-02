const userDetails = require('../models/userModel')
const productDetails = require('../models/productModel')
const cartDetails = require('../models/categoryModel')
const wishDetails = require('../models/wishlistModel')
const session = require('express-session');




const viewWish = async (req, res) => {
    try {
        const wishData = await wishDetails.find({ username: req.session.name })
        // const proData = await productDetails.find({name:catData.product})
        const userin = req.session.name
        const cat = await cartDetails.find({ list: 1 })
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
                price: wishPro.rate
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













module.exports={
    viewWish,
    addtoWishList,
    removeWishlist
    
};