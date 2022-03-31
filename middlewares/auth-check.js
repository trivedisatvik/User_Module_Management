const jwt = require("jsonwebtoken")


module.exports = (req,res,next)=>{
    try{
        console.log("Authorization headers incoming request");
        const headertoken=req.headers.authorization.split(" ")[1];
        let decoded = jwt.verify(headertoken,"satvik");
        req.userData = decoded
        next();

    }catch{
        return res.status(401).json({
            message:"Auth failed"
        })
    }
}