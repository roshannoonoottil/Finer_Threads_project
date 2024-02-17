const router = require("express").Router();      
const adminController = require("../controllers/adminController")
const adminCheck = require("../middleware/adminMiddleware")

router.get("/",adminController.adiminLogin);
router.post("/dashboard",adminController.adminDashboard);
router.get("/dashboard",adminCheck.isAdmin,adminController.toDashboard);
router.get("/adminlogout",adminController.adminLogout)

router.get("/user", adminCheck.isAdmin, adminController.adminShowUsers); // show users 
router.post('/user', adminCheck.isAdmin, adminController.searchUser); // search user
router.get('/block/:username', adminCheck.isAdmin, adminController.block); // block user by username







module.exports = router;
