const userDetails = require('../models/userModel')
const productDetails = require('../models/productModel')
const catDetails = require('../models/categoryModel')
const userPro = require('../models/userAddressModel')
const cart = require('../models/cartModel')
const wish = require('../models/wishlistModel')
const order = require('../models/orderModel')


const proceedtoCheckOut = async (req, res) => {
    try {
        console.log('req.body of the checkout page!!!!')
        // console.log(req.body.status[0])
        console.log('------------------------------------------------')
        const userin = req.session.name
        const cat = await catDetails.find({ list: 0 })
        const len = await cart.find({ username: userin })
        console.log(len)
        const cartCount = await cart.find({ username: req.session.name }).countDocuments()
        const wishCount = await wish.find({ username: userin }).countDocuments()
        const userData = await userDetails.find({ username: req.session.name })
        console.log('agshdfhdsa')
        let email = ''
        if (userData) {
            email = userData[0].email
        }
        const totalValue = await cart.aggregate([
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
        req.session.amountToPay = totalValue[0].sum
        console.log(totalValue[0].sum)
        let totalPrice = totalValue[0].sum
        const address = await userPro.find({ username: req.session.name })
        //let totalPrice = req.session.totalCartPrice
        res.render('userCheckOut', { userin, cat, address, userData, email, cartCount, wishCount, totalPrice })
    } catch (e) {
        console.log('error in the proceedtoCheckOut in orderController in user sdie : ' + e)
        // res.redirect("/error")
    }
}


const displayaddress = async (req, res) => {
    try {
        console.log(req.body)
        const id = req.body.addressId
        console.log(id)
        const data = await userPro.findOne({ _id: id })
        console.log(data)
        res.json({ data })

    } catch (e) {
        console.log('error in the displayaddress function in the orderController in user side: ' + e)
        // res.redirect("/error")
    }
}



module.exports ={
    proceedtoCheckOut,
    displayaddress
}