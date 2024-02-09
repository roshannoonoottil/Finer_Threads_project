//importing librery
const express = require('express')
const session = require('express-session');
const bodyParser = require('body-parser');
const path =  require("path");
const ejs = require("ejs")



const app = express()
app.use(bodyParser.json());
app.use(express.urlencoded({extended:true}))

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));


app.use((req, res, next) => {
    res.header("Cache-Control", "private,no-cache,no-store, must-revalidate");
    res.header("Expires", "-1");
    res.header("Pragma", "no-cache");
    next();
  });
  

app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, "public/user")));

app.set("views",[
    path.join(__dirname,"./views/userView"),
    path.join(__dirname,"./views/adminView")


])


const userRouter = require('./server/routes/userRoute')
const adminRouter = require('./server/routes/adminRoute')

app.use('/',userRouter)
app.use('/admin',adminRouter)



app.listen(4000,()=>console.log('Server started at port:4000'))