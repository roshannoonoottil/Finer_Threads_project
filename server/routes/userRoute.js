const router = require("express").Router();
const userController = require("../controllers/userController.js");
const userCheck = require("../middleware/userMiddleware.js");
const cartController=require("../controllers/cartController.js")
const profileController = require("../controllers/profileController.js")

router.get("/", userController.index);
router.get("/login", userController.login);
router.get("/signup", userController.signup);
router.post("/signup", userController.verifyOTPS);
router.post("/verifyOTP", userController.authOTP);
router.post("/home", userController.validateUser);

router.get("/home", userCheck.isUser, userController.redirectUser);
router.get("/logout", userController.logout);
router.get("/index/:name", userController.indexPageCategory);
router.get("/product/:id", userController.productView);
router.get("/home/:name", userCheck.isUser, userController.homePageCategory);
router.get("/userproduct/:id", userCheck.isUser, userController.userproductView);
router.get("/forgetPassword", userController.forgotPassword);
router.post("/authEmail", userController.authEmail);
router.get("/forgotPassword/getOTP", userController.fpGetOTP);
router.post("/forgotPassword/authOTP", userController.fpAuthOTP);
router.get("/changePassword", userController.toChangePassword);
router.post("/updatePassword", userController.updatePassword);
router.get("/resendOTP", userController.resendOTP);
router.get("/otp", userController.otp);
router.get("/shop",  userController.shop)
router.post("/search", userController.search);
;
router.get('/wishlist', userCheck.isUser, cartController.viewWish);
router.get('/wishlist/:id', userCheck.isUser, cartController.addtoWishList);
router.get('/deletewishlist/:id', userCheck.isUser, cartController.removeWishlist);
// add to cart functionality
router.get('/cart', userCheck.isUser, cartController.viewcart);
router.get('/addToCart/:id', userCheck.isUser, cartController.addToCart);
router.get('/deleteItemCart/:id', userCheck.isUser, cartController.deleteCart)
router.post('/change-quentity', userCheck.isUser, cartController.changeQuantity)

router.get('/useraccount/:id', userCheck.isUser, userController.userAccount)
router.get('/userchangePassword', userCheck.isUser, profileController.changePass)
router.post('/userchangePassword', userCheck.isUser, profileController.change)
router.get('/add-address', userCheck.isUser, profileController.profile)


router.post('/add-address', userCheck.isUser, profileController.addAddress)
router.post('/newAddress', userCheck.isUser, userController.newAddress)
router.get('/newAddressEdit', userCheck.isUser, profileController.newAddressEdit)
router.post('/newAddressEdit', userCheck.isUser, profileController.newEditAddress)
router.get('/removeAddress', userCheck.isUser, profileController.removeAddress)

router.get('/update-profile', userCheck.isUser, profileController.updateProfile)
router.post('/update-profile', userCheck.isUser, profileController.updateProfileData)



module.exports = router;
