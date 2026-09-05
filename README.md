# VoiceX - Voice & Text Social Media App

A real-time voice and text messaging social media platform built with Node.js, Express, MongoDB, and vanilla JavaScript. Share your thoughts through voice recordings or text posts, connect with other users, and stay updated with notifications.

## 🌟 Features

### 📱 Core Messaging
- **Voice Posts** - Record and share audio messages with preview before posting
- **Text Posts** - Share text-based posts (280 character limit)
- **Mixed Replies** - Reply to posts with either voice or text comments
- **Recording Preview** - Listen to your audio before posting
- **Delete Posts & Comments** - Remove your posts and comments anytime

### 👥 Social Features
- **User Authentication** - Signup/Login with bcrypt password hashing
- **Follow/Unfollow** - Build your network and see posts from followed users
- **Like & Repost** - Interact with community posts
- **Two Feed Views**:
  - **For You** - All posts from entire community
  - **Following** - Posts from users you follow

### 🔔 Notifications
- **Real-time Alerts** - Get notified when someone likes or comments on your post
- **Unread Badge** - See unread notification count at a glance
- **Notification Panel** - Beautiful sliding panel with all notifications
- **Mark as Read** - Click notifications to mark them as read

### 👤 Profile Management
- **User Profile Modal** - Click your avatar to view your profile
- **Profile Stats**:
  - Following count
  - Followers count
  - Total posts count
- **Post History** - View all your voice and text posts with dates

### 🎨 UI/UX
- **Colorful Design**
  - Rainbow animated brand text
  - Gradient FAB button with glow effect
  - Beautiful gradient notification panel
  - Smooth animations and transitions
- **Mobile-First** - Responsive design for all devices
- **Dark Theme** - Easy on the eyes

### 🎙️ Technical Features
- **Audio Support** - WebM format with opus codec, fallback to MP4
- **JWT Authentication** - Secure token-based authentication
- **MongoDB Database** - Persistent data storage
- **Error Handling** - Comprehensive error messages and validation
- **CORS Enabled** - Ready for cross-origin requests

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **Multer** - File upload middleware (for audio files)
- **bcryptjs** - Password hashing
- **jsonwebtoken (JWT)** - Authentication tokens
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variables

### Frontend
- **HTML5** - Markup
- **CSS3** - Styling with gradients and animations
- **Vanilla JavaScript** - No frameworks, pure JS
- **Web Audio API** - Audio recording and playback
- **Fetch API** - HTTP requests

## 📋 Project Structure

```
voicex/
├── server.js              # Express server & API routes
├── public/
│   └── index.html        # Frontend (HTML + CSS + JS)
├── uploads/              # Audio files storage
├── package.json          # Dependencies
└── .env                  # Environment variables
```

## 🚀 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login to account

### Posts
- `GET /api/posts` - Get feed posts
- `POST /api/posts` - Create voice post
- `POST /api/posts/text` - Create text post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Like/unlike post
- `POST /api/posts/:id/repost` - Repost/unrepost
- `POST /api/posts/:id/comments` - Add comment (text or audio)
- `DELETE /api/posts/:postId/comments/:commentIndex` - Delete comment

### Users
- `GET /api/users/me` - Get current user profile
- `GET /api/users/:username/posts` - Get user's posts
- `POST /api/users/:username/follow` - Follow/unfollow user

### Notifications
- `GET /api/notifications` - Get all notifications
- `GET /api/notifications/unread-count` - Get unread count
- `POST /api/notifications/:id/read` - Mark as read

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v14+)
- MongoDB database
- Modern web browser

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/voicex.git
   cd voicex
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   echo "MONGODB_URI=mongodb://your-database-url" > .env
   echo "JWT_SECRET=your-secret-key" >> .env
   echo "PORT=3000" >> .env
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🎯 Usage

1. **Create Account** - Signup with username and password
2. **Choose Mode** - Toggle between Voice (🎙️) and Text (💬) modes
3. **Post Content**:
   - Voice: Hold/tap the FAB button, hear preview, click "Post ✓"
   - Text: Type in input box, press Enter or click send
4. **Interact** - Like, repost, and comment on posts
5. **Follow Users** - Click Follow button to see their posts
6. **View Profile** - Click your avatar to see stats and posts
7. **Manage Content** - Delete unwanted posts/comments
8. **Check Notifications** - Click bell icon to see all updates

## 🔐 Security Features

- Password hashing with bcryptjs
- JWT token authentication
- Secure comment/post deletion (author-only)
- Environment variable protection
- CORS enabled for controlled access

## 📦 Dependencies

```json
{
  "express": "^4.18.2",
  "mongoose": "^7.0.0",
  "multer": "^1.4.5-lts.1",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.0",
  "cors": "^2.8.5",
  "dotenv": "^16.0.3"
}
```

## 🐛 Known Limitations

- Audio uploads are stored locally (for production, use cloud storage like AWS S3)
- Single-server deployment (for scaling, add Redis for sessions)
- No message encryption (add TLS/SSL in production)
- No rate limiting (add express-rate-limit for protection)

## 🚀 Future Enhancements

- [ ] Direct messaging between users
- [ ] Search functionality
- [ ] User tags/mentions
- [ ] Post editing capability
- [ ] User profile customization
- [ ] Share to social media
- [ ] Push notifications
- [ ] Trending topics

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 👨‍💻 Author

VoiceX Developer - Created with ❤️

## 🤝 Contributing

Contributions are welcome! Feel free to:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📞 Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**VoiceX** - *Share your voice, connect with the world* 🎤✨
