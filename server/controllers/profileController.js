const userModel = require("../models/userModel");
const categoryModel = require("../models/categoryModel");
const productModel = require("../models/productModel");
const address  = require('../models/userAddressModel')
const wish  = require("../models/wishlistModel")
const cart = require("../models/cartModel")
const session = require('express-session');
const bcrypt = require('bcrypt')
require('dotenv').config();


const changePass = async (req, res) => {
    try {

        const userin = req.session.name
        const val = req.query.val
        const cat = await categoryModel.find({ list: 0 })
        const userData = await userModel.findOne({ username: userin })
        //const otpData = sndmail.sendmail(userData.email)
        const cartCount = await cart.find({ username: req.session.name }).countDocuments()
        const wishCount = await wish.find({ username: userin }).countDocuments()
        // otpData.then((val) => {
        //     console.log(val)
        //     otp = val[0]
        // })
        //console.log(otp)
        const error = req.query.error 
        res.render('userChangePass', { userin, val, cat, cartCount, wishCount,error })
    } catch (e) {
        console.log('error in the userChangePass in userController in user side : ' + e)
        // res.redirect("/error")
    }
}



const change = async (req,res)=>{
    try{
        console.log(req.body);
        const userin = req.session.name
        const userData = await userModel.findOne({username:req.session.name})
        const compare = await bcrypt.compare(req.body.password,userData.password)
        console.log(compare , userData)
        console.log('change function called')
        if(compare){
            const hashedpass = await bcrypt.hash(req.body.newpassword, 10)
            await userModel.updateOne({ username: userin }, { $set: { password: hashedpass } })
            await req.session.destroy()
            res.redirect('/')
        }else{
            res.redirect('/changePassword?error=Enter your correct password')
        }
        

    }catch(e){
        console.log('error in the change in userController in user side : ' + e)
        // res.redirect("/error")
    }
}


const profile = async (req, res) => {
    try {
        const userin = req.session.name
        const id = req.query.userid
        const userProfile = await address.findOne({ _id: id })
        const cartCount = await cart.find({ username: req.session.name }).countDocuments()
        const wishCount = await wish.find({ username: userin }).countDocuments()
        res.render('userAddress', { cartCount, wishCount, userin,userProfile })
    } catch (e) {
        console.log('error in the profile in userProfileController in the user side : ' + e)
        res.redirect("/error")
    }
}


const addAddress = async (req, res) => {
    try {
        console.log(req.session.name)
        const username = req.session.name

        console.log(req.body)
        const addressData = new address({
            username: req.session.name,
            fullname: req.body.username,
            phone: req.body.phone,

            address: {
                houseName: req.body.house,
                city: req.body.city,
                state: req.body.state,
                pincode: req.body.pin,
                country: req.body.country
            },
            primary: 1
        })

        await addressData.save()
        res.redirect(`/useraccount/${{ username }}`)
    } catch (e) {
        console.log('error in the addAddress in userProfileController in user side : ' + e)
        // res.redirect("/error")
    }
}


const newAddressEdit = async (req, res) => {
    try {
        const userin = req.session.name
        console.log(req.query.userid," haiiiii");
        const id = req.query.userid
        console.log(id," heyyy");
        const userProfile = await address.findOne({ _id: id })
        const cartCount = await cart.find({ username: req.session.name }).countDocuments()
        const wishCount = await wish.find({ username: userin }).countDocuments()
        res.render('userAddressNew', { cartCount, wishCount, userin, userProfile })
    } catch (e) {
        console.log('error in the profile in userProfileController in the user side : ' + e)
        // res.redirect("/error")
    }
}



const newEditAddress = async (req, res) => {
    try {
        console.log(req.query.userid)
        const userin = req.session.name
        console.log(req.body," body")
        const data = await address.findOne({ _id: req.query.userid })
        await address.updateOne({ _id: req.query.userid }, {
            address: {
                houseName: req.body.houseName,
                city: req.body.city,
                state: req.body.state,
                country: req.body.country,
                pincode: req.body.pincode
            },
            fullname: req.body.fullName,
            phone: req.body.phone,
  
        })
        console.log(data)
        res.redirect(`/useraccount/${userin}`)
    } catch (e) {
        console.log('error in the newAddress in userProfileController in user side:' + e)
        // res.redirect("/error")
    }
  }
  

  const removeAddress = async(req,res)=>{
    try{
        const userin = req.session.name
        await address.deleteOne({_id:req.query.userid})
        res.redirect(`/useraccount/${userin}`)
    }catch(e){
        console.log('error in the removeAddress in userProfileController in user side : '+e)
        // res.redirect("/error")
    }
}



module.exports={
    changePass,
    change,
    profile,
    addAddress,
    newEditAddress,
    newAddressEdit,
    removeAddress
}