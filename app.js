const express = require("express");
var http = require("http");
const app = express();
const userRouter = require("../api/routes/user.js");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config();



const cors = require("cors");
app.use(cors());
mongoose.connect(process.env.DB_URL,{
    useNewUrlParser:true,
    
    useUnifiedTopology:true
}).then(
    ()=>console.log("Mongodb is successfully connected")
).catch(
    (err)=>console.log(err)
)



//configuring body parser(accepts key value from request and parses)
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
//configuring morgan(logger)
app.use(morgan("dev"));



app.get("/",(req,res,next)=>{
    res.json({message:"This works, thankyou"})
    next();
});
app.use("/users",userRouter);

const PORT=process.env.PORT;
const server = http.createServer(app);
server.listen(PORT,()=>{
    console.log(`server running on port ${PORT}`);
});


module.exports = app;