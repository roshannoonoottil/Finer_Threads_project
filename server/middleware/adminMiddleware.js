const isAdmin = (req, res, next) => {
    try {
      if (req.session.isAdmin) {
        console.log('req.session.isAdmin')
        next();
      } else {
        console.log('not req session')
        res.redirect("/admin");
      }
    } catch (error) {
      console.log("Admin controller isAdmin " + error);
    }
  };
  
  module.exports = { isAdmin };