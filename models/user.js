const mongoose = require("mongoose");
const userSchema = mongoose.Schema({
   
    first_name:{
        type:String,
        required:true
    },
    last_name:String,
    email:{
        type:String,
        required:true,
        unique:true,
        match:/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/

    },
    password:{
        type:String,
        required:true
    },
    phoneNo:{
        type:String,
        default:""
    },
    Address:{
        type:String,
        default:""
    },
    DOB:{
        type:String,
        default:""
    },
    Nationality:{
        type:String,
        default:""
    },
    Gender:{
        type:String,
        default:""
    },
    accessLevel:{
        type:String,
        default:"User"
    },
    // orders:[{type:mongoose.Schema.Types.ObjectId,ref:"Order"}],
    verified:Boolean

})

module.exports= mongoose.model("User",userSchema);