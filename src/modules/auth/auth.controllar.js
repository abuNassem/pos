import { authService } from "./auth.service.js";

const  registerUser=async(req, res)=>{
    try {
       
        const result=await authService.register({data:req.body});
    res.status(201).json({ message: 'User registered successfully' ,insertedId:result.insertId});

    } catch (error) {
        console.error('❌ Error in registerUser');
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}
export default registerUser;