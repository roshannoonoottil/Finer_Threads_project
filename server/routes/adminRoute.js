const router = require("express").Router();      
const adminController = require("../controllers/adminController")
const adminCheck = require("../middleware/adminMiddleware")

router.get("/",adminController.adiminLogin);
router.post("/dashboard",adminController.adminDashboard);
router.get("/dashboard",adminController.toDashboard,adminCheck.isAdmin);
router.get("/adminlogout",adminController.adminLogout)







module.exports = router;
