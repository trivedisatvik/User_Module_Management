const mongoose = require("mongoose");
const feedbackSchema = mongoose.Schema({
    userId:String,
    userName:String,
    userEmail:String,
    userMessage:String,
    
    createdAt:Date,
    
})

module.exports= mongoose.model("feedback",feedbackSchema)