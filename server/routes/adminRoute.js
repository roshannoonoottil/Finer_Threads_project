const router = require("express").Router();      
const adminController = require("../controllers/adminController")
const adminCheck = require("../middleware/adminMiddleware")
const categoryController = require("../controllers/categoryController")
const productController = require("../controllers/productController")
const multer = require("../middleware/multer");  //for image uploading middleware

router.get("/",adminController.adiminLogin);         //GET request to check if user is logged in or not
router.post("/dashboard",adminController.adminDashboard);    //POST request for dashboard page
router.get("/dashboard",adminCheck.isAdmin,adminController.toDashboard);   //redirects to the dashboard page after successful login
router.get("/adminlogout",adminController.adminLogout);      //GET request to log out the user from the account

router.get("/user", adminCheck.isAdmin, adminController.adminShowUsers); // show users 
router.post('/user', adminCheck.isAdmin, adminController.searchUser); // search user
router.get('/block/:username', adminCheck.isAdmin, adminController.block); // block user by username


router.get("/category", adminCheck.isAdmin, categoryController.showCategory);// add category page
router.post("/category", adminCheck.isAdmin, categoryController.addCategory);// add new Category
router.post("/editcat/:id", adminCheck.isAdmin, categoryController.categoryEdit) // category edit
router.get('/list/:id', adminCheck.isAdmin, categoryController.list) //list or unlist category


router.get("/product", adminCheck.isAdmin, productController.adminProduct); // show  products
router.post("/product", adminCheck.isAdmin, multer.array("images", 5), productController.addProduct ); //admin add products
router.get("/addProduct", adminCheck.isAdmin,  productController.newProductPage );  // go to the add product page
router.post("/productEdit/:name", adminCheck.isAdmin, productController.editProduct ); // Edit Product Page
router.post("/productUpdate", adminCheck.isAdmin, productController.updateProduct ); // Update Product
router.get('/proHide/:name' , adminCheck.isAdmin, productController.proBlock ) ; // Hide the product from frontend
  







module.exports = router;
