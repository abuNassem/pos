

export const searchUser=async(connection, username)=>{
    try {
      const result= await connection.execute(
        `
          SELECT id, username, role
          FROM users
          WHERE username REGEXP  ?
        `,
        [username]
      );    
    return result[0];
    }catch (error) {
        throw error;
    }}