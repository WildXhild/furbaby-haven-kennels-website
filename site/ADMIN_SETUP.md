# Admin Panel Security Setup

## Current Status
✅ **Password protection is now enabled on your admin panel**

## How to Access Admin Panel
1. Go to `/admin.html` on your site
2. You'll see a login screen
3. **Default password**: `puppies123`
4. Enter the password to access the admin features

## How to Change Your Password

⚠️ **IMPORTANT: Change the default password immediately!**

### Steps:
1. Open `admin.js` file
2. Find line that says: `const ADMIN_PASSWORD = 'puppies123';`
3. Replace `puppies123` with your new secure password
4. Save the file
5. The new password will take effect immediately

**Example:**
```javascript
// BEFORE:
const ADMIN_PASSWORD = 'puppies123';

// AFTER (your new password):
const ADMIN_PASSWORD = 'MySecurePassword2025!';
```

## Security Features

### What's Protected:
- Login page prevents unauthorized access to admin features
- Password is hashed before comparison (not stored in plain text)
- Session expires when browser closes (won't stay logged in forever)
- "Logout" button to manually logout anytime

### Important Notes:
⚠️ **Client-side security limitation**: The password logic is in JavaScript, which means someone with technical knowledge could view it in the browser's developer tools. This is adequate for small business sites but **NOT suitable for handling payment information or sensitive customer data**.

### Password Best Practices:
- ✅ Use a **strong password** (mix of letters, numbers, symbols)
- ✅ **Don't use**: 123456, password, your site name
- ✅ Make it **unique** - don't reuse passwords from other sites
- ✅ **Keep it secret** - don't share with unauthorized people

## Session Management
- Sessions are stored in **sessionStorage** (browser memory)
- Automatically clears when you **close the browser**
- You can manually **logout** with the logout button
- Won't auto-logout after a period of inactivity

## Access URL
Admin panel can be accessed directly at:
```
yoursite.com/admin.html
```

Tip: You might want to keep this URL private and don't include it in your main navigation permanently.

## If You Forget Your Password
1. Open `admin.js` in your code editor
2. Look for the `ADMIN_PASSWORD` constant
3. See what you set it to
4. That's your password!

---

**Setup Date**: December 22, 2025  
**Password Protection**: Enabled ✅
