# Orbitra Itinerary Generator 🌍

![MERN Stack](https://img.shields.io/badge/MERN-Stack-blue)
![License](https://img.shields.io/badge/License-MIT-green)

A full-stack MERN application that allows users to upload travel documents (PDFs and images) and leverages AI (Google Gemini) to automatically generate comprehensive travel itineraries. Built for the Orbitra Technologies assignment.

---

## 🚀 Live Demo
- **Frontend (Vercel):** *[Coming Soon]*
- **Backend (Render):** *[Coming Soon]*

*(Note: Since the backend is deployed on Render's free tier, the first request might take 50 seconds to wake up the server).*

---

## ✨ Features
- **JWT Authentication:** Secure user registration and login.
- **AWS S3 File Upload:** Upload travel confirmation PDFs or images, stored securely in AWS S3.
- **AI Text Extraction:** Extracts text from PDFs and images using Groq Vision (Llama) and `pdf-parse`.
- **Smart Itinerary Generation:** Generates a structured itinerary based on the uploaded data using Groq API (Llama-3).
- **MongoDB Storage:** Saves all generated itineraries to the user's history using MongoDB Atlas.
- **Shareable Links & WhatsApp:** Generates a unique, publicly accessible link, complete with a WhatsApp one-click share button.
- **Export to PDF:** Download any itinerary as a cleanly formatted PDF document.
- **QR Code Generation:** Scannable QR code for easy mobile sharing.
- **Responsive UI:** Modern, clean, and fully responsive user interface built with React.

---

## 📸 Screenshots

| Dashboard | Upload Document |
| :---: | :---: |
| *(Add screenshot here)* | *(Add screenshot here)* |
| **Itinerary Detail** | **Share View & QR Code** |
| *(Add screenshot here)* | *(Add screenshot here)* |

---

## 🛠️ Tech Stack

### Frontend
- React.js 18
- React Router v6
- Axios
- React Dropzone
- React Hot Toast
- Lucide React (Icons)
- QRCode React

### Backend
- Node.js (v22)
- Express.js (v4)
- MongoDB Atlas & Mongoose
- JSON Web Token (JWT)
- Multer & AWS S3 (`@aws-sdk/client-s3`)
- Groq AI (Llama 3.3 Versatile & Llama 4 Vision)
- pdf-parse (v1.1.1)

---

## ⚙️ Environment Variables

To run this project, you will need to add the following environment variables to your `.env` file in the `server` directory.

`PORT=5000`
`MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/orbitra`
`JWT_SECRET=your_jwt_secret_key`
`JWT_EXPIRE=7d`
`GROQ_API_KEY=your_groq_api_key`
`NODE_ENV=development`
`CLIENT_URL=http://localhost:3000`
`AWS_ACCESS_KEY_ID=your_aws_access_key`
`AWS_SECRET_ACCESS_KEY=your_aws_secret_key`
`AWS_REGION=your_aws_region`
`AWS_S3_BUCKET_NAME=your_bucket_name`

For the `client` directory (Create React App), create a `.env` file:
`REACT_APP_API_URL=http://localhost:5000`

---

## 💻 Local Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/orbitra-itinerary.git
   cd orbitra-itinerary
   ```

2. **Install Backend Dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Start the Development Servers**

   Open a terminal for the backend:
   ```bash
   cd server
   npm run dev
   ```

   Open a terminal for the frontend:
   ```bash
   cd client
   npm start
   ```

5. **Access the Application**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📡 Deployment Instructions

- **Backend:** Deployed on Render. Make sure to set all the Environment Variables in the Render dashboard.
- **Frontend:** Deployed on Vercel. Set the `REACT_APP_API_URL` to your Render backend URL.
- **Database:** MongoDB Atlas is used for production storage.

---

## 👨‍💻 Author
- Your Name
- GitHub: [@your-username](https://github.com/your-username)
