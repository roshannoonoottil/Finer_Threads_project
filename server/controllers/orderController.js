const userDetails = require('../models/userModel')
const productDetails = require('../models/productModel')
const catDetails = require('../models/categoryModel')
const userPro = require('../models/userAddressModel')
const cart = require('../models/cartModel')
const wish = require('../models/wishlistModel')
const order = require('../models/orderModel')
const orderid = require('otp-generator')


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


const toPayment = async (req, res) => {
    try {
        req.session.address = req.body
        const address = req.body
        console.log(req.body + "req.session.address")
        console.log(req.body.newAddress)
        const userin = req.session.name
        const cartCount = await cart.find({ username: req.session.name }).countDocuments()
        const wishCount = await wish.find({ username: userin }).countDocuments()
        // console.log(req.body)

        //---------------------------------------------------------------
        const catData = await cart.find({ username: req.session.name })
        const catDataCount = await cart.find({ username: req.session.name }).countDocuments()
        const proData = await productDetails.find({ name: catData.product })
        const userData = await userDetails.find({ username: userin })
        console.log(catDataCount)
        console.log('before type of')
        let totalPrice = 0

        console.log('if not entered')
        if (catDataCount != 0) {
            console.log('if  entered')
            console.log(catDataCount)
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
            console.log(totalValue[0].sum)
            totalPrice = totalValue[0].sum
        }
        res.render('userPayment', { userin, wishCount, cartCount, totalPrice, catDataCount, catData, address, userData })
    } catch (e) {
        console.log('error in the toPayment orderController in user side :' + e)
        // res.redirect("/error")
    }
}


const codPayment = async (req, res) => {
    try {
        const userin = req.session.name
        console.log(req.session.address)
        console.log(req.body)
        const cartData = await cart.find({ username: userin })
        const cartCount = await cart.find({ username: req.session.name }).countDocuments()
        const wishCount = await wish.find({ username: userin }).countDocuments()
        const date = new Date()
        console.log(date)
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
                    country: req.session.address.country
                },
                primary: 0,
            })

            await newAddress.save()
        }
        const id = orderid.generate(15, {
            digits: true,
            upperCaseAlphabets: true,
            specialChars: false,
            lowerCaseAlphabets: true
        });
        let paymentMentod = "COD"

        for (let i = 0; i < cartData.length; i++) {

            const shippingAddress = new order({
                username: req.session.name,
                orderDate: date,
                orderId: id,
                status: 'placed',
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
                    country: req.session.address.country
                }

            })

            await shippingAddress.save()
        }
        // console.log(date.toDateString())
        const orderData = await order.find({ orderDate: date })
        const data = await order.aggregate([
            { $match: { orderId: id } },
            { $group: { _id: 'null', totalPrice: { $sum: '$price' }, totalQuantity: { $sum: '$quentity' } } }
        ])
        console.log(data[0].totalPrice)
        console.log(data)
        let price = req.session.amountToPay
        let qunatity = data[0].totalQuantity
        await cart.deleteMany({ username: userin })
        req.session.amountToPay = 0
        res.render('userOrderPlaced', { id, date, userin, wishCount, cartCount, price, qunatity })
    } catch (e) {
        console.log('error in the codPayment of orderController in user side : ' + e)
        // res.redirect("/error")
    }
}


const orderData = async (req, res) => {
    try {
        const userin = req.session.name
        const dataOrder = await order.find({ username: userin }).sort({ _id: -1 })
        // const dataOrderId = await order.distinct('orderId')
        // const dataOrderDate = await order.distinct('orderDate')
        const cartCount = await cart.find({ username: req.session.name }).countDocuments()
        const wishCount = await wish.find({ username: userin }).countDocuments()
        console.log(dataOrder)
        res.render('userOrderHistory', { dataOrder, userin, wishCount, cartCount })
    } catch (e) {
        console.log('error in the orderData of orderController in user side:' + e)
        res.redirect("/error")
    }
}


const showDetailOrderHistory = async (req, res) => {
    try {
        console.log(req.params.id)
        const userin = req.session.userName
        const data = await order.find({ orderId: req.params.id })
        const img = await productDetails.findOne({ name: data.product })
        const cartCount = await cart.find({ username: userin }).count()
        //console.log(cartCount)
        console.log(data[0], 'orderdata is notksnfgighasbfj--------------------------------------')
        res.render('userOrderSiglePage', { data, img, userin, cartCount })

    } catch (e) {
        console.log('error in the showDetailOrderHistory in orderController in the userSide : ' + e)
        res.redirect("/error")
    }
}

const orderHistory = async (req, res) => {
    try {
        console.log(req.query.orderId)
        console.log(req.query.product)
        const data = await order.find({ $and: [{ orderId: req.query.orderId }, { product: req.query.product }] })
        const price = await productDetails.find({ name: req.query.product })
        console.log(data, '==============================================================')
        res.render('userOrderSiglePage', { data, price })
    } catch (e) {
        console.log('error in the ordreHistory in orderController in the user side : ' + e)
        res.redirect("/error")
    }
}

const cancelPro = async (req, res) => {
    try {
        // await order.updateOne({ orderId: req.params.id }, { adminCancel: 1, status: 'CANCELED' })
        await order.updateOne({
            $and:
                [
                    { orderId: req.query.orderId },
                    { product: req.query.product }
                ]
        },
            {
                $set: { status: 'CANCELED', adminCancel: 1 }
            })
        res.redirect(`/historyOrder?orderId=${req.query.orderId}&product=${req.query.product}`)
    } catch (e) {
        console.log('error in the cancelPro in orderController in user side : ' + e)
    }
}

const returnPro = async (req, res) => {
    try {
        await order.updateOne({ orderId: req.params.id }, { status: 'Returnde Successfully' })
        res.redirect('/orderhistory')
    } catch (e) {
        console.log('error in thr returnPro in orderController in user side : ' + e)
        res.redirect("/error")
    }
}

const returnreason = async (req, res) => {
    try {
        console.log(req.body)
        console.log(req.params.id)
        const val = await order.updateOne({ orderId: req.params.id, product: req.query.product }, { returnStatus: 0, returnreason: req.body.reason }, { upsert: true })
        console.log(val)
        res.redirect(`/orderHistoryPage/${req.params.id}?product=${req.query.product}`)
    } catch (e) {
        console.log('error in the returnreason in ordercontroller in user side : ' + e)
        res.redirect("/error")

    }
}

module.exports ={
    proceedtoCheckOut,
    displayaddress,
    toPayment,
    codPayment,
    orderData,
    orderHistory,
    cancelPro,
    returnPro,
    returnreason,
    showDetailOrderHistory

}