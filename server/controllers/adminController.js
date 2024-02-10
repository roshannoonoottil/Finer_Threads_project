const userModel = require("../models/userModel")
const bcrypt = require("bcrypt");


const adiminLogin = (req,res) =>
{
try{
        if(req.session.isAdmin) 
        {
            console.log("Active admin");
            res.redirect("/admin/dashboard");
        }
        else
        {
            const error = req.query.error;
            console.log("Admin need to login");
            res.render("admin_login", { error });
        }
        } 
        catch (error) 
        {
            console.log("Admin login page error: " + error);
    }
};

const adminDashboard = async (req, res) => {
    try {
      const Name = req.body.username;
      const adminData = await userModel.findOne({ username: Name });
      console.log(adminData);
      if (adminData && adminData.isAdmin == 1) {
        password = await bcrypt.compare(req.body.password, adminData.password);
        if (password) {
          req.session.isAdmin = true;
          req.session.username = req.body.username;
          res.redirect("/admin/dashboard");
        } else {
          res.redirect("/admin?error=Invalid password");
        }
      } else {
        res.redirect("/admin?error=Not authorized");
      }
    } catch (error) {
      console.log("Admin Dashboard error: " + error);
    }
  };

  const toDashboard =(req,res)=>{
    try{
        res.render("dashboard", {username : req.session.username});
        console.log("Admin Dashboard")
    }
    catch(error)
    {
        console.log("Dashboard  Error:"+error);
    }
  };


  const adminLogout =(req,res)=> {
    try {
        delete req.session.isAdmin;
        console.log("admin logged outed");
        res.redirect('/admin')
    } catch (error) {
        console.log("Error in Logging out" + error);
    }
};











module.exports = {
    adiminLogin,
    adminDashboard,
    toDashboard,
    adminLogout
};