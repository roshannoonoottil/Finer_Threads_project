const isUser = (req, res, next) => {
    try {
      if (req.session.isUser) {
        next();
      } else {
        res.redirect("/login");
      }
    } catch (err) {
      console.log("user controller isUser " + err);
    }
  };
  
  module.exports = { isUser };