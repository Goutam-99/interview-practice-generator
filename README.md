# Interview Practice Generator 🎯

An AI-powered web application that generates personalized interview questions and answers based on your resume.

## ✨ Features

- 📄 Upload PDF resume
- 🤖 AI-generated interview questions (10 questions with detailed answers)
- 💾 Download questions as text file
- 🎨 Clean and modern UI
- 🔄 Automatic retry logic with multiple AI models
- 🚀 Fast and responsive

## 🛠️ Tech Stack

### Frontend
- React.js
- Tailwind CSS
- Lucide React Icons

### Backend
- Node.js + Express
- Google Gemini API
- pdf-parse (PDF text extraction)
- Multer (file upload handling)

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Google Gemini API Key (free from [Google AI Studio](https://aistudio.google.com/app/apikey))

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Goutam-99/interview-practice-generator.git
cd interview-practice-generator
```

### 2. Backend Setup
```bash
# Navigate to backend folder
cd interview-prep-backend

# Install dependencies
npm install

# Create .env file
# Add your Gemini API key:
# GEMINI_API_KEY=your_api_key_here

# Start backend server
npm start
```

Backend will run on `http://localhost:5000`

### 3. Frontend Setup

Open a new terminal:
```bash
# Navigate to frontend folder
cd interview-prep-app

# Install dependencies
npm install

# Start frontend
npm start
```

Frontend will open automatically at `http://localhost:3000`

## 📖 Usage

1. **Upload Resume**: Click on the upload area and select your PDF resume
2. **Generate Questions**: Click the "Generate Interview Questions" button
3. **Review**: Read through the 10 AI-generated questions with detailed answers
4. **Download**: Click the download button to save questions for offline practice

## 📁 Project Structure
```
interview-practice-generator/
├── interview-prep-backend/      # Backend API
│   ├── server.js               # Main server file
│   ├── .env                    # Environment variables (not in repo)
│   ├── .gitignore
│   └── package.json
│
├── interview-prep-app/          # Frontend React app
│   ├── public/
│   ├── src/
│   │   └── App.js              # Main React component
│   ├── .gitignore
│   └── package.json
│
└── README.md
```

## 🔐 Environment Variables

Create a `.env` file in the `interview-prep-backend` folder:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
```

## 🎨 Screenshots

*Add screenshots here later*

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 👤 Author

**Goutam Mahana**
- GitHub: [@Goutam-99](https://github.com/Goutam-99)
- Email: goutammahana99@gmail.com

## 🙏 Acknowledgments

- Google Gemini API for AI-powered question generation
- React community for excellent documentation
- All contributors and users of this project

## 📞 Support

If you have any questions or run into issues, please open an issue on GitHub.

---

⭐ If you find this project helpful, please give it a star!