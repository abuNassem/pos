import db from "../../config/db.js";
import bcrypt from "bcryptjs";
class AuthRepository {
  
  /**
   * 1️⃣ إنشاء مستخدم جديد
   * @param {Object} userData - بيانات المستخدم {email, password, name, phone}
   * @returns {Promise<Object>} - النتيجة والـ ID
   */
  async createUser(userData) {
    try {
     // ======================================================
// النسخة الأصلية — احتفظ بها مؤقتًا كمرجع
// ======================================================

// const query = ` 
//     INSERT INTO users (
//         email,
//         password_hash,
//         username,
//         created_at,
//         date_of_birth,
//         national_id_hash,
//         recovery_code_hash,
//         is_active,
//         created_by
//     ) 
//     VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?) 
// `;

// const [result] = await db.execute(query, [
//     userData.email,
//     userData.password_hash,
//     userData.username,
//     userData.date_of_birth,
//     userData.national_id_hash,
//     userData.recovery_code_hash,
//     userData.is_active,
//     userData.created_by
// ]);


// ======================================================
// النسخة التجريبية — الحقول التي نرسلها حاليًا
// ======================================================

const query = `
    INSERT INTO users (
        username,
        password_hash,
        role
    )
    VALUES (?, ?, ?)
`;

const [result] = await db.execute(query, [
    userData.username,
    userData.password_hash,
    userData.role
]);
console.log("result:", result);
return result;
    } catch (error) {
      console.error('خطأ في إنشاء المستخدم:', error.message);
      throw error;
    }
  }

  /**
   * 2️⃣ البحث عن مستخدم بواسطة البريد الإلكتروني
   * @param {string} email - البريد الإلكتروني
   * @returns {Promise<Object|null>} - بيانات المستخدم أو null
   */
  async getUserByEmail(email) {
    try {
      const query = `SELECT * FROM users WHERE email = ?`;
      const [rows] = await db.execute(query, [email]);
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('خطأ في البحث عن المستخدم:', error.message);
      throw error;
    }
  }

  /**
   * 3️⃣ البحث عن مستخدم بواسطة الـ ID
   * @param {number} userId - معرف المستخدم
   * @returns {Promise<Object|null>} - بيانات المستخدم أو null
   */
  async getUserById(userId) {
    try {
      const query = `SELECT id, email, name, phone, role, is_active, created_at FROM users WHERE id = ?`;
      const [rows] = await db.execute(query, [userId]);
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('خطأ في البحث عن المستخدم بـ ID:', error.message);
      throw error;
    }
  }

  /**
   * 4️⃣ التحقق من بيانات المستخدم عند تسجيل الدخول
   * @param {string} email - البريد الإلكتروني
   * @param {string} password - كلمة المرور
   * @returns {Promise<Object|null>} - بيانات المستخدم أو null
   */
  async verifyUser(email, password) {
    try {
      const user = await this.getUserByEmail(email);
      
      if (!user) {
        return null;
      }
      
      // التحقق من كلمة المرور
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return null;
      }
      
      // تسجيل آخر محاولة تسجيل دخول
      await this.updateLastLogin(user.id);
      
      return user;
    } catch (error) {
      console.error('خطأ في التحقق من المستخدم:', error.message);
      throw error;
    }
  }

  /**
   * 5️⃣ تحديث كلمة المرور
   * @param {number} userId - معرف المستخدم
   * @param {string} newPassword - كلمة المرور الجديدة
   * @returns {Promise<Object>} - النتيجة
   */
  async updatePassword(userId, newPassword) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      const query = `UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?`;
      const [result] = await db.execute(query, [hashedPassword, userId]);
      
      if (result.affectedRows === 0) {
        throw new Error('المستخدم غير موجود');
      }
      
      return {
        success: true,
        message: 'تم تحديث كلمة المرور بنجاح'
      };
    } catch (error) {
      console.error('خطأ في تحديث كلمة المرور:', error.message);
      throw error;
    }
  }

  /**
   * 6️⃣ تحديث بيانات المستخدم
   * @param {number} userId - معرف المستخدم
   * @param {Object} updateData - البيانات المراد تحديثها
   * @returns {Promise<Object>} - النتيجة
   */
  async updateUserProfile(userId, updateData) {
    try {
      const { name, phone, email } = updateData;
      
      // التحقق من عدم استخدام البريد الإلكتروني من قبل مستخدم آخر
      if (email) {
        const existingUser = await this.getUserByEmail(email);
        if (existingUser && existingUser.id !== userId) {
          throw new Error('البريد الإلكتروني مستخدم بالفعل');
        }
      }
      
      const query = `
        UPDATE users 
        SET name = COALESCE(?, name), 
            email = COALESCE(?, email), 
            phone = COALESCE(?, phone),
            updated_at = NOW() 
        WHERE id = ?
      `;
      
      const [result] = await db.execute(query, [name || null, email || null, phone || null, userId]);
      
      if (result.affectedRows === 0) {
        throw new Error('المستخدم غير موجود');
      }
      
      return {
        success: true,
        message: 'تم تحديث البيانات بنجاح'
      };
    } catch (error) {
      console.error('خطأ في تحديث بيانات المستخدم:', error.message);
      throw error;
    }
  }

  /**
   * 7️⃣ تحديث آخر وقت تسجيل دخول
   * @param {number} userId - معرف المستخدم
   * @returns {Promise<void>}
   */
  async updateLastLogin(userId) {
    try {
      const query = `UPDATE users SET last_login = NOW() WHERE id = ?`;
      await db.execute(query, [userId]);
    } catch (error) {
      console.error('خطأ في تحديث آخر تسجيل دخول:', error.message);
    }
  }

  /**
   * 8️⃣ حذف مستخدم
   * @param {number} userId - معرف المستخدم
   * @returns {Promise<Object>} - النتيجة
   */
  async deleteUser(userId) {
    try {
      const query = `DELETE FROM users WHERE id = ?`;
      const [result] = await db.execute(query, [userId]);
      
      if (result.affectedRows === 0) {
        throw new Error('المستخدم غير موجود');
      }
      
      return {
        success: true,
        message: 'تم حذف المستخدم بنجاح'
      };
    } catch (error) {
      console.error('خطأ في حذف المستخدم:', error.message);
      throw error;
    }
  }

  /**
   * 9️⃣ تفعيل/تعطيل حساب المستخدم
   * @param {number} userId - معرف المستخدم
   * @param {boolean} isActive - تفعيل أم تعطيل
   * @returns {Promise<Object>} - النتيجة
   */
  async toggleUserStatus(userId, isActive) {
    try {
      const query = `UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?`;
      const [result] = await db.execute(query, [isActive ? 1 : 0, userId]);
      
      if (result.affectedRows === 0) {
        throw new Error('المستخدم غير موجود');
      }
      
      return {
        success: true,
        message: isActive ? 'تم تفعيل الحساب' : 'تم تعطيل الحساب'
      };
    } catch (error) {
      console.error('خطأ في تغيير حالة المستخدم:', error.message);
      throw error;
    }
  }

  /**
   * 🔟 الحصول على جميع المستخدمين
   * @param {number} limit - عدد النتائج
   * @param {number} offset - البداية
   * @returns {Promise<Array>} - قائمة المستخدمين
   */
  async getAllUsers(limit = 10, offset = 0) {
    try {
      const query = `
        SELECT id, email, name, phone, role, is_active, created_at, last_login 
        FROM users 
        LIMIT ? OFFSET ?
      `;
      const [rows] = await db.execute(query, [limit, offset]);
      
      return rows;
    } catch (error) {
      console.error('خطأ في الحصول على المستخدمين:', error.message);
      throw error;
    }
  }

  /**
   * 1️⃣1️⃣ البحث عن مستخدمين
   * @param {string} searchTerm - مصطلح البحث
   * @returns {Promise<Array>} - قائمة النتائج
   */
  async searchUsers(searchTerm) {
    try {
      const query = `
        SELECT id, email, name, phone, role, is_active 
        FROM users 
        WHERE email LIKE ? OR name LIKE ? OR phone LIKE ?
      `;
      const searchPattern = `%${searchTerm}%`;
      const [rows] = await db.execute(query, [searchPattern, searchPattern, searchPattern]);
      
      return rows;
    } catch (error) {
      console.error('خطأ في البحث عن المستخدمين:', error.message);
      throw error;
    }
  }

  /**
   * 1️⃣2️⃣ عد المستخدمين
   * @returns {Promise<number>} - عدد المستخدمين
   */
  async countUsers() {
    try {
      const query = `SELECT COUNT(*) as count FROM users`;
      const [rows] = await db.execute(query);
      
      return rows[0].count;
    } catch (error) {
      console.error('خطأ في عد المستخدمين:', error.message);
      throw error;
    }
  }

  /**
   * 1️⃣3️⃣ التحقق من وجود مستخدم
   * @param {string} email - البريد الإلكتروني
   * @returns {Promise<boolean>} - موجود أم لا
   */
  async userExists(email) {
    try {
      const user = await this.getUserByEmail(email);
      return user !== null;
    } catch (error) {
      console.error('خطأ في التحقق من وجود المستخدم:', error.message);
      throw error;
    }
  }

  /**
   * 1️⃣4️⃣ حفظ رمز استعادة كلمة المرور
   * @param {number} userId - معرف المستخدم
   * @param {string} resetToken - رمز الاستعادة
   * @param {number} expiresIn - مدة الصلاحية بالدقائق
   * @returns {Promise<Object>} - النتيجة
   */
  async savePasswordResetToken(userId, resetToken, expiresIn = 30) {
    try {
      const expiresAt = new Date(Date.now() + expiresIn * 60000);
      
      const query = `
        INSERT INTO password_resets (user_id, token, expires_at) 
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE token = ?, expires_at = ?
      `;
      
      await db.execute(query, [userId, resetToken, expiresAt, resetToken, expiresAt]);
      
      return {
        success: true,
        message: 'تم حفظ رمز الاستعادة'
      };
    } catch (error) {
      console.error('خطأ في حفظ رمز الاستعادة:', error.message);
      throw error;
    }
  }

  /**
   * 1️⃣5️⃣ التحقق من رمز استعادة كلمة المرور
   * @param {string} resetToken - رمز الاستعادة
   * @returns {Promise<Object|null>} - بيانات الاستعادة أو null
   */
  async verifyPasswordResetToken(resetToken) {
    try {
      const query = `
        SELECT user_id, token, expires_at 
        FROM password_resets 
        WHERE token = ? AND expires_at > NOW()
      `;
      
      const [rows] = await db.execute(query, [resetToken]);
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('خطأ في التحقق من رمز الاستعادة:', error.message);
      throw error;
    }
  }

  /**
   * 1️⃣6️⃣ حذف رمز استعادة كلمة المرور
   * @param {string} resetToken - رمز الاستعادة
   * @returns {Promise<Object>} - النتيجة
   */
  async deletePasswordResetToken(resetToken) {
    try {
      const query = `DELETE FROM password_resets WHERE token = ?`;
      await db.execute(query, [resetToken]);
      
      return {
        success: true,
        message: 'تم حذف رمز الاستعادة'
      };
    } catch (error) {
      console.error('خطأ في حذف رمز الاستعادة:', error.message);
      throw error;
    }
  }

  /**
   * 1️⃣7️⃣ حفظ رمز التحقق من البريد الإلكتروني
   * @param {number} userId - معرف المستخدم
   * @param {string} verificationToken - رمز التحقق
   * @returns {Promise<Object>} - النتيجة
   */
  async saveEmailVerificationToken(userId, verificationToken) {
    try {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60000); // 24 ساعة
      
      const query = `
        INSERT INTO email_verifications (user_id, token, expires_at) 
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE token = ?, expires_at = ?
      `;
      
      await db.execute(query, [userId, verificationToken, expiresAt, verificationToken, expiresAt]);
      
      return {
        success: true,
        message: 'تم حفظ رمز التحقق'
      };
    } catch (error) {
      console.error('خطأ في حفظ رمز التحقق:', error.message);
      throw error;
    }
  }

  /**
   * 1️⃣8️⃣ التحقق من رمز البريد الإلكتروني
   * @param {string} verificationToken - رمز التحقق
   * @returns {Promise<Object|null>} - بيانات التحقق أو null
   */
  async verifyEmailToken(verificationToken) {
    try {
      const query = `
        SELECT user_id, token, is_verified 
        FROM email_verifications 
        WHERE token = ? AND expires_at > NOW()
      `;
      
      const [rows] = await db.execute(query, [verificationToken]);
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('خطأ في التحقق من رمز البريد:', error.message);
      throw error;
    }
  }

  /**
   * 1️⃣9️⃣ تأكيد التحقق من البريد الإلكتروني
   * @param {number} userId - معرف المستخدم
   * @returns {Promise<Object>} - النتيجة
   */
  async confirmEmailVerification(userId) {
    try {
      const query = `
        UPDATE email_verifications 
        SET is_verified = 1, verified_at = NOW() 
        WHERE user_id = ?
      `;
      
      await db.execute(query, [userId]);
      
      // تحديث حالة المستخدم
      const updateUserQuery = `UPDATE users SET email_verified = 1 WHERE id = ?`;
      await db.execute(updateUserQuery, [userId]);
      
      return {
        success: true,
        message: 'تم تأكيد البريد الإلكتروني'
      };
    } catch (error) {
      console.error('خطأ في تأكيد البريد الإلكتروني:', error.message);
      throw error;
    }
  }

  /**
   * 2️⃣0️⃣ حفظ جلسة تسجيل الدخول
   * @param {number} userId - معرف المستخدم
   * @param {string} token - رمز الجلسة
   * @param {string} ipAddress - عنوان IP
   * @param {string} userAgent - بيانات المتصفح
   * @returns {Promise<Object>} - النتيجة
   */
  async saveLoginSession(userId, token, ipAddress, userAgent) {
    try {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60000); // 7 أيام
      
      const query = `
        INSERT INTO login_sessions (user_id, token, ip_address, user_agent, expires_at)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      const [result] = await db.execute(query, [userId, token, ipAddress, userAgent, expiresAt]);
      
      return {
        success: true,
        sessionId: result.insertId
      };
    } catch (error) {
      console.error('خطأ في حفظ جلسة الدخول:', error.message);
      throw error;
    }
  }

  /**
   * 2️⃣1️⃣ التحقق من جلسة تسجيل الدخول
   * @param {string} token - رمز الجلسة
   * @returns {Promise<Object|null>} - بيانات الجلسة أو null
   */
  async verifyLoginSession(token) {
    try {
      const query = `
        SELECT id, user_id, token, expires_at 
        FROM login_sessions 
        WHERE token = ? AND expires_at > NOW() AND is_active = 1
      `;
      
      const [rows] = await db.execute(query, [token]);
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('خطأ في التحقق من جلسة الدخول:', error.message);
      throw error;
    }
  }

  /**
   * 2️⃣2️⃣ تسجيل الخروج
   * @param {string} token - رمز الجلسة
   * @returns {Promise<Object>} - النتيجة
   */
  async logout(token) {
    try {
      const query = `
        UPDATE login_sessions 
        SET is_active = 0, logged_out_at = NOW() 
        WHERE token = ?
      `;
      
      await db.execute(query, [token]);
      
      return {
        success: true,
        message: 'تم تسجيل الخروج بنجاح'
      };
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error.message);
      throw error;
    }
  }

  /**
   * 2️⃣3️⃣ تحديث دور المستخدم
   * @param {number} userId - معرف المستخدم
   * @param {string} role - الدور الجديد
   * @returns {Promise<Object>} - النتيجة
   */
  async updateUserRole(userId, role) {
    try {
      const validRoles = ['user', 'admin', 'moderator'];
      
      if (!validRoles.includes(role)) {
        throw new Error('دور غير صالح');
      }
      
      const query = `UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?`;
      const [result] = await db.execute(query, [role, userId]);
      
      if (result.affectedRows === 0) {
        throw new Error('المستخدم غير موجود');
      }
      
      return {
        success: true,
        message: 'تم تحديث الدور بنجاح'
      };
    } catch (error) {
      console.error('خطأ في تحديث دور المستخدم:', error.message);
      throw error;
    }
  }

  /**
   * 2️⃣4️⃣ تسجيل محاولة فاشلة للدخول
   * @param {string} email - البريد الإلكتروني
   * @param {string} ipAddress - عنوان IP
   * @returns {Promise<Object>} - النتيجة
   */
  async logFailedLoginAttempt(email, ipAddress) {
    try {
      const query = `
        INSERT INTO failed_login_attempts (email, ip_address, attempted_at)
        VALUES (?, ?, NOW())
      `;
      
      await db.execute(query, [email, ipAddress]);
      
      return {
        success: true,
        message: 'تم تسجيل محاولة فاشلة'
      };
    } catch (error) {
      console.error('خطأ في تسجيل محاولة الدخول الفاشلة:', error.message);
      throw error;
    }
  }

  /**
   * 2️⃣5️⃣ الحصول على عدد محاولات الدخول الفاشلة
   * @param {string} email - البريد الإلكتروني
   * @param {number} minutesAgo - عدد الدقائق
   * @returns {Promise<number>} - عدد المحاولات الفاشلة
   */
  async getFailedLoginAttempts(email, minutesAgo = 30) {
    try {
      const query = `
        SELECT COUNT(*) as attempts 
        FROM failed_login_attempts 
        WHERE email = ? AND attempted_at > DATE_SUB(NOW(), INTERVAL ? MINUTE)
      `;
      
      const [rows] = await db.execute(query, [email, minutesAgo]);
      
      return rows[0].attempts;
    } catch (error) {
      console.error('خطأ في الحصول على محاولات الدخول الفاشلة:', error.message);
      throw error;
    }
  }

  /**
   * 2️⃣6️⃣ مسح محاولات الدخول الفاشلة
   * @param {string} email - البريد الإلكتروني
   * @returns {Promise<Object>} - النتيجة
   */
  async clearFailedLoginAttempts(email) {
    try {
      const query = `DELETE FROM failed_login_attempts WHERE email = ?`;
      await db.execute(query, [email]);
      
      return {
        success: true,
        message: 'تم مسح محاولات الدخول الفاشلة'
      };
    } catch (error) {
      console.error('خطأ في مسح محاولات الدخول:', error.message);
      throw error;
    }
  }
}

const authReposotry = new AuthRepository();

export default authReposotry;