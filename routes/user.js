const express = require("express")
const router = express.Router();
const {create_user,get_all_users,get_single_user,delete_single_user,update_user,user_login,verify_user_acc,password_reset_request,reset_password,reset_html_form,create_feedback,change_password_new,check_password} = require("../controllers/user.js");


const checkAuth = require("../middlewares/auth-check.js")
router.post("/",create_user);
router.get("/verify/:userId/:uniqueString",verify_user_acc);
router.get("/",get_all_users);
router.post("/feedback/:userId",create_feedback)
router.post("/changepwd/:userId",change_password_new)
router.post("/requestPasswordReset",password_reset_request);
router.post("/resetPassword",reset_password)
//get single user
router.get("/:userId",checkAuth,get_single_user);
router.delete("/:userId",delete_single_user);
router.patch("/:userId",update_user)
router.post("/login",user_login)
router.post("/checkpwd/:userId",check_password)

module.exports = router;