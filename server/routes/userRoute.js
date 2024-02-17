const router = require("express").Router();
const userController = require("../controllers/userController.js");
const userCheck = require("../middleware/userMiddleware.js");


router.get("/", userController.index);
router.get("/login", userController.login);
router.get("/signup", userController.signup);
router.post("/signup", userController.verifyOTPS);
router.post("/verifyOTP", userController.authOTP);
router.post("/home", userController.validateUser);

router.get("/home", userCheck.isUser, userController.redirectUser);
router.get("/product/:id", userController.productView);
router.get("/logout", userController.logout);




module.exports = router;
