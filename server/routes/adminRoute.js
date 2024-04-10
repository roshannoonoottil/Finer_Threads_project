const router = require("express").Router();      
const adminController = require("../controllers/adminController")
const adminCheck = require("../middleware/adminMiddleware")
const categoryController = require("../controllers/categoryController")
const productController = require("../controllers/productController")
const orderController = require("../controllers/orderController")
const multer = require("../middleware/multer");  //for image uploading middleware

router.get("/",adminController.adiminLogin);         //GET request to check if user is logged in or not
router.post("/dashboard",adminController.adminDashboard);    //POST request for dashboard page
router.get("/dashboard",adminCheck.isAdmin,adminController.toDashboard);   //redirects to the dashboard page after successful login
router.get('/chart-data', adminCheck.isAdmin, adminController.chartData)
router.get('/chart-data-month', adminCheck.isAdmin, adminController.chartDataMonth)
router.get('/chart-data-year', adminCheck.isAdmin, adminController.chartDataYear)
router.get('/report' , adminCheck.isAdmin, adminController.reportPage )
router.post('/salesReport', adminCheck.isAdmin, orderController.salesReport);    // GET sales report by date range

router.get("/adminlogout",adminController.adminLogout);      //GET request to log out the user from the account

router.get("/user", adminCheck.isAdmin, adminController.adminShowUsers); // show users 
router.post('/userS', adminCheck.isAdmin, adminController.searchUser); // search user
router.get('/block/:username', adminCheck.isAdmin, adminController.block); // block user by username


router.get("/category", adminCheck.isAdmin, categoryController.showCategory);// add category page
router.post("/category", adminCheck.isAdmin, categoryController.addCategory);// add new Category
router.post("/editcat/:id", adminCheck.isAdmin, categoryController.categoryEdit) // category edit
router.get('/list/:id', adminCheck.isAdmin, categoryController.list) //list or unlist category


router.get("/product", adminCheck.isAdmin, productController.adminProduct); // show  products
router.post("/proSearch", adminCheck.isAdmin, productController.searchProduct)
router.post("/product", adminCheck.isAdmin, multer.array("images", 4), productController.addProduct ); //admin add products
router.get("/addProduct", adminCheck.isAdmin,  productController.newProductPage );  // go to the add product page
router.post("/productEdit/:name", adminCheck.isAdmin, productController.editProduct ); // Edit Product Page
router.post("/productUpdate", adminCheck.isAdmin, multer.fields([
    { name: "0Image", maxCount: 1 },
    { name: "1Image", maxCount: 1 },
    { name: "2Image", maxCount: 1 },
    { name: "3Image", maxCount: 1 },
    { name: "4Image", maxCount: 1 },
  ]), productController.updateProduct ); // Update Product
router.get('/proHide/:name' , adminCheck.isAdmin, productController.proBlock ) ; // Hide the product from frontend

router.get('/oders', adminCheck.isAdmin, adminController.oders);   // Offers page
router.post('/updatestatus', adminCheck.isAdmin, adminController.updateOrderStatus)
router.get('/orderDetails',adminCheck.isAdmin, adminController.details)
router.post('/oders', adminCheck.isAdmin, adminController.searchOrder)
router.get('/deleteOrder', adminCheck.isAdmin, adminController.deleteOrder)
router.get('/returnsuccess',adminCheck.isAdmin, adminController.returnDetails)
router.get('/returnFail',adminCheck.isAdmin, adminController.returnFail)

router.get('/coupon', adminCheck.isAdmin, adminController.coupon)
router.post('/coupon', adminCheck.isAdmin, adminController.addCoupon)
router.get('/removeCoupon', adminCheck.isAdmin, adminController.removeCoupon)
router.post('/editCoupon', adminCheck.isAdmin, adminController.editCoupon)


  







module.exports = router;
