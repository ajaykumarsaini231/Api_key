
# API Key Authentication System  

## 🌐 Live API  
[**API Link**](https://api-key-mu.vercel.app/)  

## 📌 Description  
This is an authentication system API built using **Node.js**, **Express.js**, and **MongoDB**. It supports user authentication, authorization, and post management with proper middleware validation.  

## ⚙️ Technologies Used  
- **Node.js**  
- **Express.js**  
- **MongoDB** (Mongoose)  
- **JWT (JSON Web Token)**  
- **bcryptjs** (for password hashing)  
- **Joi** (for validation)  
- **Helmet** (for security)  
- **CORS** (for cross-origin requests)  
- **Nodemailer** (for email verification)  
- **Dotenv** (for environment variables)  

## 📦 Installation  
```sh
git clone https://github.com/ajaykumarsaini231/Api_key
cd Api_key
npm install
```

## 🚀 Usage  
1. ## ⚙️ **Environment Variables (.env file)**  
Create a `.env` file in the root directory and add the following:  

```env
PORT=8000
MONGO_URI=your_mongodb_connection_string
Secret_Token=your_jwt_secret
NODE_CODE_SENDING_EMAIL_ADDRESS=your_email@example.com
NODE_CODE_SENDING_EMAIL_ADDRESS_PASSWORD=your_email_password
HMAC_VARIFICATION_CODE_SECRET=your_hmac_secret_key
```

2. **Start the server:**  
   ```sh
   npm start
   ```

## 🛠️ API Endpoints  

### 🔑 Authentication Routes  
| Method | Endpoint | Description |
|--------|---------|-------------|
| POST   | `/signup` | Register a new user |
| POST   | `/signin` | Login user |
| POST   | `/signout` | Logout user (requires authentication) |
| PATCH  | `/sendVarificationCode` | Send email verification code |
| PATCH  | `/varifycode` | Verify email with code |
| PATCH  | `/change-password` | Change password (requires authentication) |
| PATCH  | `/forgot-password-code` | Request password reset code |
| PATCH  | `/forgot-password-code-validation` | Validate reset code |

### 📝 Post Routes  
| Method | Endpoint | Description |
|--------|---------|-------------|
| GET    | `/all-post` | Get all posts |
| GET    | `/single-post` | Get a single post |
| POST   | `/create-post` | Create a new post (requires authentication) |
| PUT    | `/update-post` | Update a post (requires authentication) |

## 📜 License  
This project is **MIT Licensed**.  


