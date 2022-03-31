const User = require("../models/user.js");
const UserVerification = require("../models/UserVerification.js")
const PasswordReset = require("../models/PasswordReset.js")
const feedback = require("../models/feedback.js")
const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");
const jsonwebtoken = require("jsonwebtoken");
const CONSTANTS = require("../utils/constants.js")
const nodemailer = require("nodemailer")
const {v4:uuidv4} = require("uuid");
require("dotenv").config();
let transporter = nodemailer.createTransport({
    service:CONSTANTS.EMAIL_PROVIDER,
    auth:{
        user:process.env.AUTH_EMAIL,
        pass:process.env.AUTH_PASS,         
    }
})

//testing transporter

const create_user = (req,res,next)=>{
    
    // users.push(req.body);
    // res.json({message:"This is coming from api/routes/user.js but through post"});
    User.find({
        email:req.body.email
    }).exec()
    .then(user=>{
        console.log("This is the user");
        console.log(user);

        if(user.length>=1){
            return res.json({
                status:'failed',
                message:"Email Id already registered"
            });
        }else{
            //creating a hash salting and hashing the incoming password
            bcryptjs.hash(req.body.password,10,(err,hash)=>{
                if(err){
                    return res.status(500).json({
                        error:err
                    })
                }
                else{
                    const user = new User({
                        
                        first_name: req.body.first_name,
                        last_name: req.body.last_name,
                        email: req.body.email,
                        password: hash,
                        accessLevel: req.body.accessLevel,
                        
                        verified:false,
                    })
                    user.save()
                    .then(result=>{
                       sendVerificationEmail(result,res);
                       return res.json({
                        status:'success',
                        message:"Verification mail sent successfully, kindly verify to login!!!"
                    });
                       
                       
                    })
        
                }
            })


                }
            })

    .catch(err=>{
        console.log(err);
        res.status(500).json({
            error:err
        })
    })    
};
const sendVerificationEmail=({_id,email},res)=>{

    const currenturl = "http://localhost:7000/";
    const uniqueString = uuidv4() + _id;

    const mailOptions = {
        from:"usermanagementsatvik@gmail.com",
        to : email,
        subject:"Verify your email",
        html:`<p>Verify your Email Address to complete the signup and login into your account</p><p>This link<b> expires in 1hr</b></p>
        <p>Press <a href=${currenturl+"users/verify/"+_id+"/"+uniqueString}>here</a> to proceed</p> `,

    }
    //hash the unique string
    const saltRounds =10;
    bcryptjs 
    .hash(uniqueString,saltRounds)
    .then((hashedUniqueString)=>{
        //create a new user verification record
        const newVerification = new UserVerification({
            userId:_id,
            uniqueString:hashedUniqueString,
            createdAt:Date.now(),
            expiresAt:Date.now()+ 3600000,
        });
        newVerification.save()
        .then(()=>{
            transporter.sendMail(mailOptions)
            .then(()=>{
                //email sent and verification record has been saved
               console.log("1")
            })
            .catch(err=>{
               return res.status(500).json({
                    merror:"Verification email Falied",
                    error:err
                })
            })
        })
        .catch(err=>{
            res.status(500).json({
                merror:"There has been an error",
                error:err
            })
        })
    
        


    })
    .catch(err=>{
        res.status(500).json({
            merror:"There has been an error",
            error:err
        })
    })






}
const verify_user_acc = (req,res)=>{
    let {userId,uniqueString} = req.params;

    UserVerification.find({userId:userId}).exec()
    .then((result)=>{
        if(result.length>0){
            //user verification record exist so we proceed
            const {expiresAt}=result[0];
            const hashedUniqueString = result[0].uniqueString;
            //checking for expiry of link
            if(expiresAt<Date.now()){
                // record has expired 
                UserVerification.deleteOne({userId}).exec()
                .then(result=>{
                    User.deleteOne({_id:userId}).exec()
                    .then(()=>{
                      return  res.json({
                            status:'failed',
                          
                            message:"Link has expired,Please Signup again"
                        })

                    })
                    .catch(err=>{
                        res.status(500).json({
                            merror:"There has been an error6",
                            error:err
                        })
                    })
                })
                .catch(err=>{
                    res.status(500).json({
                        merror:"There has been an error5",
                        error:err
                    })
                })
            }
        
        else{
            //valid record exist so we validate the user string
            //first compare the hashed unique string
            bcryptjs.compare(uniqueString,hashedUniqueString)
            .then(result=>{
                if(result){
                    //string match
                    User.updateOne({_id:userId},{verified:true})
                    .then(
                        ()=>{
                            UserVerification.deleteOne({userId})
                            .then(
                                ()=>{
                                  return  res.redirect("http://localhost:3000/emailsuccess")
                                }
                            )
                            .catch(err=>{
                                res.status(500).json({
                                    merror:"There has been an error4",
                                    error:err
                                })
                            })
                        }

                    )
                    .catch(err=>{
                        res.status(500).json({
                            merror:"There has been an error3",
                            error:err
                        })
                    })

                }
                else{
                    //existing record but incorrect verification details
                }
            })
            .catch(err=>{
                res.status(500).json({
                    merror:"There has been an error2",
                    error:err
                })
            })
            
        }
    }
        else{
            //user verification record doesn't exsist that means account already verified or user didn't signup
           

        }
    }


    )
    .catch(err=>{
        res.status(500).json({
            merror:"There has been an error1",
            error:err
        })
    })





}
const get_all_users = (req,res,next)=>{
    User.find()
    .select("orders first_name")
    .populate("orders","OrderName Address UserName")
    .exec()
    .then((users)=>{
        const responseObject={

            count:users.length,
            message:"Got all users successfully",
            users:users.map(user=>{
                return{
                    user,
                    request:{
                        type:"GET",
                        url:`http://localhost:7000/users/${user._id}`,
                    },
                    order:user.order,
                   
                }
            })

        }
        
        res.status(200).json(responseObject)
    })
    .catch(
        err=>console.log(err)
    )

}
const get_single_user=(req,res,next)=>{
let userId=req.params.userId;


User.find({
    _id:userId
}).exec()
.then(
    user=>{
        if(user.length>=1){
        res.status(200).json({
            message:"The api ran successfully",
            userId,
            user,

        })
        console.log("this is the found user");
        console.log(user);
    }
}

)
.catch(err=>{
    res.status(500).json({
        merror:"There has been an error",
        error:err
    })
})





}
const delete_single_user = (req,res,next)=>{
    let userId = req.params.userId
    User.remove({
        _id:userId
    })
    .exec()
    .then(
        result=>(
            res.status(200).json({
                status:"success",
                message:"User successfully removed"
            })

            

        )
    )
    .catch(err=>{
        res.status(500).json({
            merror:"There has been an error",
            error:err
        })
    })
   

}
const update_user=(req,res,next)=>{
    const userId = req.params.userId
    const updateOps={}

    for(const [key, value] of Object.entries(req.body)){
        updateOps[key] = value
    }
    

    User.update({_id:userId},{$set:updateOps})
    .exec()
    .then(successResult=>{
        
        res.status(200).json({
            message:"User Updated successfully"
        })
    })
    .catch(err=>{
        res.status(500).json({
            merror:"There has been an error",
            error:err
        })
    })



    

   


}
const user_login=(req,res,next)=>{
    User.find({
        email:req.body.email.toLowerCase()
    })
    .exec()
    .then(user=>{
        if(user.length<1){
            return res.json({
                status:'failed',
                message:"Invalid Email Or Password"
            })
        }
        if(!user[0].verified){
            res.json({
                status:"failed",
                message:"Email hasn't been verified yet, Check your inbox!!!"
            })
        }
        else{
        bcryptjs.compare(req.body.password,user[0].password,(err,result)=>{
            // if(err){
            
            //   return res.status(401).json({
            //         message:"Auth failed"
            //     })
            // }
                if(result){
                    //generate jwt token here
                    

                   const token = jsonwebtoken.sign(
                        {
                            email:user[0].email,
                            accessLevel:user[0].accessLevel
                        },
                        "satvik",
                        {
                            expiresIn:"1h"
                        }
                    )








                    return res.status(200).json({
                        message:"Login Successfull",
                        token,
                        user
                        
                    })
                }
                else{
                    return res.json({
                        status:'failed',
                        message:"Invalid Email or Password",
                    })
                }

        })}
    })
    .catch(err=>{
        res.status(500).json({
            merror:"There has been an error",
            error:err
        })
    })
}

//Password Reset
const password_reset_request = (req,res,next)=>{
const {email,redirectUrl}=req.body;
User.find({email})
.exec()
.then((data)=>{
    if(data.length){
        //check if user is verified
        if(!data[0].verified){
            res.json({
                status:"failed",
            message:"Email hasn't been verified yet check your inbox",
            })
        }
        else{
            //now if user is verified
            sendResetEmail(data[0],redirectUrl,res);
            res.json({
                status:"success",
            message:"Password reset instructions sent to you email, kindly check your inbox",
            })
        }


    }
    else{
        res.json({
            status:"failed",
            message:"Invalid Email Address",
        })
    }
})
.catch(err=>{
    res.status(500).json({
        merror:"There has been an error",
        error:err
    })
})



}
//send password reset email
const sendResetEmail = ({_id, email},redirectUrl,res)=>{
    const resetString = uuidv4() + _id;
    PasswordReset.deleteMany({userId:_id}).exec()
    .then(result=>{
        //reset record deleted ,now send email to reset
        const mailOptions = {
            from:"usermanagementsatvik@gmail.com",
            to : email,
            subject:"Password Reset",
            html:`<p>We heard that you lost your password</p><p>Don't worry, use this link to reset it</p><p>This link<b> expires in 10 minutes</b></p>
            <p>Press <a href=${redirectUrl+"/"+_id+"/"+resetString}>here</a> to proceed</p> `,
    
        }
        const saltRounds = 10;
        bcryptjs.hash(resetString,saltRounds)
        .then(hashedResetString=>{
            //set new record in password reset collection
            const newPasswordReset= new PasswordReset({
                userId:_id,
                resetString:hashedResetString,
                createdAt:Date.now(),
                expiresAt:Date.now()+600000,
            });
            newPasswordReset.save()
            .then(()=>{
                transporter.sendMail(mailOptions)
                .then(()=>{
                   console.log("Sent Successfully");
                })
                .catch(err=>{
                    res.status(500).json({
                        merror:"There has been an error",
                        error:err
                    })
                })
            })
            .catch(err=>{
                res.status(500).json({
                    merror:"There has been an error",
                    error:err
                })
            })
            
        })
        .catch(err=>{
            res.status(500).json({
                merror:"There has been an error",
                error:err
            })
        })

    })
    .catch(err=>{
        res.status(500).json({
            merror:"There has been an error",
            error:err
        })
    })
    
}
const reset_password=(req,res,next)=>{
    let {userId,resetString,newPassword} = req.body;
    PasswordReset.find({userId}).exec()
    .then(result=>{
        if(result.length>0){
            const {expiresAt}  = result[0];
            const hashedResetString = result[0].resetString;
            if(expiresAt<Date.now()){
                PasswordReset.deleteOne({userId})
                .then(
                    res.json({
                        status:"failed",
                        message:"Password reset link has expired",
                    })
                )
                .catch(err=>{
                    res.status(500).json({
                        merror:"There has been an error",
                        error:err
                    })
                })
            }
            else{
                //Link hasn't expired so we validate the hashedreset string from url to stored db
                bcryptjs.compare(resetString,hashedResetString)
                .then(
                    (result)=>{
                        if(result){
                            //string matched ,hash password again and update in user db
                            const saltRounds=10;
                            bcryptjs.hash(newPassword,saltRounds)
                            .then(hashedNewPassword=>{
                                //now update pwd
                                User.updateOne({_id:userId},{password:hashedNewPassword})
                                .then(()=>{
                                    //update complete and now we delete record of password reset module
                                    PasswordReset.deleteOne({userId})
                                    .then(()=>{
                                      return  res.json({
                                            status:"Success",
                                        message:"Password Reset Successfully",
                                    })
                                        

                                    })
                                    .catch(err=>{
                                        res.status(500).json({
                                            merror:"There has been an error",
                                            error:err
                                        })
                                    })

                                })
                                .catch(err=>{
                                    res.status(500).json({
                                        merror:"There has been an error",
                                        error:err
                                    })
                                })
                            })
                            .catch(err=>{
                                res.status(500).json({
                                    merror:"There has been an error",
                                    error:err
                                })
                            })

                        }
                        else{
                            res.json({
                                status:"failed",
                                message:"Comparision failed of unique reset string"
                            })
                        }
                    }
                )
                .catch(err=>{
                    res.status(500).json({
                        merror:"There has been an error",
                        error:err
                    })
                })
            }

        }
        else{
            res.json({
                statust:"FAILED",
                message:"Password reset request not found",
            })
        }

    }
    
    )
    .catch(err=>{
        res.status(500).json({
            merror:"There has been an error",
            error:err
        })
    })


}
const create_feedback =(req,res)=>{
    const userrId = req.params.userId;
    const Feedback = new feedback({
        userId:userrId,
        userName:req.body.userName,
        userEmail:req.body.userEmail,
        userMessage:req.body.userMessage,
        createdAt:Date.now()


    })
    Feedback.save()
    .then(result=>{
        return res.json({
            status:'success',
            message:"Feedback Submitted Successfully"
        })
            
        

    })
    .catch(err=>{
        res.status(500).json({
            merror:"There has been an error",
            error:err
        })
    })



}
const change_password_new =(req,res,next)=>{
    const userId = req.params.userId;
    const oldpwd = req.body.oldpwd;
    const newpwd = req.body.password
    console.log(userId)
   
    User.find({_id:userId})
    .exec()
    .then(user=>{
        if(user.length>0){
            bcryptjs.compare(oldpwd,user[0].password,(err,result)=>{
                if(result){
                    const saltRounds=10;
                            bcryptjs.hash(newpwd,saltRounds)
                            .then(hasheddNewPassword=>{
                                
                                //now update pwd
                                User.updateOne({_id:userId},{$set:{password:hasheddNewPassword}})
                                .then((barath)=>{
                                   console.log(barath)
                                   console.log(userId)
                                   return  res.json({
                                    status:"Success",
                                message:`Password Reset Successfully`,
                                
                            })

                                })
                                .catch(err=>{
                                    res.status(500).json({
                                        merror:"There has been an error",
                                        error:err
                                    })
                                })
                            })
                            .catch(err=>{
                                res.status(500).json({
                                    merror:"There has been an error",
                                    error:err
                                })
                            })


                }
                else{
                    return res.json({
                        status:'failed',
                        message:"Invalid Password",
                    })
                }

        }
            )}

        })
    .catch(err=>{
        res.status(500).json({
            merror:"There has been an error",
            error:err
        })
    })


}
const check_password = (req,res,next)=>{
    const userId = req.params.userId
    const pwdd = req.body.oldpwd
    User.find({userId})
    .exec()
    .then(user=>{
        if(user.length>0){
            bcryptjs.compare(pwdd,user[0].password,(err,result)=>{
                if(result){
                    return res.json({
                        status:'success',
                        message:"Correct Password",
                    })
                }
                else{
                    return res.json({
                        status:'failed',
                        message:"Wrong Password",
                    })
                }

            })
        }
    })
    .catch(err=>{
        res.status(500).json({
            merror:"There has been an error",
            error:err
        })
    })

}
module.exports = {create_user,get_all_users,get_single_user,delete_single_user,update_user,user_login,verify_user_acc,password_reset_request,reset_password,create_feedback,change_password_new,check_password};