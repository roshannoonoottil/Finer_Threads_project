const router = require("express").Router();      
const adminController = require("../controllers/adminController")
const adminCheck = require("../middleware/adminMiddleware")
const categoryController = require("../controllers/categoryController")
const productController = require("../controllers/productController")
const multer = require("../middleware/multer");  //for image uploading middleware

router.get("/",adminController.adiminLogin);
router.post("/dashboard",adminController.adminDashboard);
router.get("/dashboard",adminCheck.isAdmin,adminController.toDashboard);
router.get("/adminlogout",adminController.adminLogout)

router.get("/user", adminCheck.isAdmin, adminController.adminShowUsers); // show users 
router.post('/user', adminCheck.isAdmin, adminController.searchUser); // search user
router.get('/block/:username', adminCheck.isAdmin, adminController.block); // block user by username


router.get("/category", adminCheck.isAdmin, categoryController.showCategory);// add category page
router.post("/category", adminCheck.isAdmin, categoryController.addCategory);// add new Category
router.post("/editcat/:id", adminCheck.isAdmin, categoryController.categoryEdit) // category edit
router.get('/list/:id', adminCheck.isAdmin, categoryController.list) //list or unlist category


router.get("/product", adminCheck.isAdmin, productController.adminProduct); // show  products
router.post("/product", adminCheck.isAdmin, multer.array("images", 5), productController.addProduct );
router.get("/addProduct", adminCheck.isAdmin,  productController.newProductPage );
  







module.exports = router;
