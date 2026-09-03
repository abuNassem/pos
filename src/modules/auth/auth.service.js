import authRepository from './auth.repositry.js';
import bcrypt from 'bcrypt';
 const register =async({data})=>{
try{

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const userData = { ...data, password_hash: hashedPassword };

   
    // userData.recovery_code_hash = hashedRecoveryCode;

    // return result = await authRepository.createUser(userData);  هذ الكود خاطي بسبب استعمال مساوى  و اسم متغير  دون  تعريف المتغير بواسطة const
    return  await authRepository.createUser(userData);


}catch(err){
    throw new Error(`Error in register service: ${err.message}`);
}
}

export const authService = {
    register
}