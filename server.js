require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- SCHEMAS ---
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    following: [{ type: String }],
    followers: [{ type: String }]
});
const User = mongoose.model('User', UserSchema);

const NotificationSchema = new mongoose.Schema({
    recipient: { type: String, required: true },
    actor: { type: String, required: true },
    type: { type: String, enum: ['like', 'comment', 'follow'], required: true },
    postId: { type: String },
    message: { type: String },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});
const Notification = mongoose.model('Notification', NotificationSchema);

const PostSchema = new mongoose.Schema({
    author: { type: String, required: true },
    text: { type: String },
    audioUrl: { type: String },
    createdAt: { type: Date, default: Date.now },
    likes: [{ type: String }], // Array of usernames who liked it
    reposts: [{ type: String }], // Array of usernames who re-voiced
    comments: [{
        author: String,
        text: String,
        audioUrl: String,
        createdAt: { type: Date, default: Date.now }
    }]
});
const Post = mongoose.model('Post', PostSchema);

// --- AUTH MIDDLEWARE ---
const authenticate = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Please log in' });
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        res.status(400).json({ error: 'Invalid token' });
    }
};

// --- ROUTES: AUTH ---
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (await User.findOne({ username })) return res.status(400).json({ error: 'Handle taken' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ username, password: hashedPassword });
        const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET);
        res.json({ token, username: user.username });
    } catch {
        res.status(500).json({ error: 'Signup failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET);
        res.json({ token, username: user.username });
    } catch {
        res.status(500).json({ error: 'Login failed' });
    }
});

// --- AUDIO UPLOAD CONFIG ---
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, 'uploads/'),
        filename: (req, file, cb) => cb(null, `voice-${Date.now()}.webm`)
    })
});

// --- ROUTES: POSTS & FEED ---
app.get('/api/posts', async (req, res) => {
    const type = req.query.type || 'foryou';
    const currentUser = req.query.user;

    if (type === 'following' && currentUser) {
        const user = await User.findOne({ username: currentUser });
        if (user) {
            const posts = await Post.find({
                $or: [
                    { author: { $in: user.following } },
                    { reposts: { $in: user.following } }
                ]
            }).sort({ createdAt: -1 });
            return res.json(posts);
        }
    }
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
});

app.post('/api/posts', authenticate, upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Audio required' });
        const post = await Post.create({ 
            author: req.user.username, 
            audioUrl: `/uploads/${req.file.filename}` 
        });
        res.json(post);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// Text-only posts
app.post('/api/posts/text', authenticate, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || !text.trim()) return res.status(400).json({ error: 'Text is required' });
        const post = await Post.create({ 
            author: req.user.username, 
            text: text.trim()
        });
        res.json(post);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// --- ROUTES: INTERACTIONS ---
app.post('/api/posts/:id/like', authenticate, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        
        const index = post.likes.indexOf(req.user.username);
        if (index === -1) {
            post.likes.push(req.user.username);
            // Create notification only if liking, not unliking
            if (post.author !== req.user.username) {
                await Notification.create({
                    recipient: post.author,
                    actor: req.user.username,
                    type: 'like',
                    postId: post._id,
                    message: `${req.user.username} liked your post`
                });
            }
        } else {
            post.likes.splice(index, 1);
        }
        
        await post.save();
        res.json({ liked: index === -1, count: post.likes.length });
    } catch (err) {
        res.status(500).json({ error: 'Failed to like post' });
    }
});

app.post('/api/posts/:id/repost', authenticate, async (req, res) => {
    const post = await Post.findById(req.params.id);
    const index = post.reposts.indexOf(req.user.username);
    
    if (index === -1) post.reposts.push(req.user.username);
    else post.reposts.splice(index, 1);
    
    await post.save();
    res.json({ reposted: index === -1, count: post.reposts.length });
});

app.post('/api/posts/:id/comments', authenticate, upload.single('audio'), async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        
        const { text } = req.body;
        
        // Support both text and audio comments
        if (text && text.trim()) {
            // Text comment
            post.comments.push({ author: req.user.username, text: text.trim() });
        } else if (req.file) {
            // Audio comment
            post.comments.push({ author: req.user.username, audioUrl: `/uploads/${req.file.filename}` });
        } else {
            return res.status(400).json({ error: 'Text or audio required' });
        }
        
        // Create notification only if commenter is not the post author
        if (post.author !== req.user.username) {
            await Notification.create({
                recipient: post.author,
                actor: req.user.username,
                type: 'comment',
                postId: post._id,
                message: `${req.user.username} commented on your post`
            });
        }
        
        await post.save();
        res.json(post);
    } catch (err) {
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

// Delete a post
app.delete('/api/posts/:id', authenticate, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        
        // Only author can delete their post
        if (post.author !== req.user.username) {
            return res.status(403).json({ error: 'Cannot delete someone else\'s post' });
        }
        
        await Post.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Post deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

// Delete a comment
app.delete('/api/posts/:postId/comments/:commentIndex', authenticate, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        
        const commentIndex = parseInt(req.params.commentIndex);
        if (commentIndex < 0 || commentIndex >= post.comments.length) {
            return res.status(400).json({ error: 'Comment not found' });
        }
        
        const comment = post.comments[commentIndex];
        // Only comment author can delete their comment
        if (comment.author !== req.user.username) {
            return res.status(403).json({ error: 'Cannot delete someone else\'s comment' });
        }
        
        post.comments.splice(commentIndex, 1);
        await post.save();
        res.json({ success: true, message: 'Comment deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete comment' });
    }
});

// --- ROUTES: USERS ---
app.post('/api/users/:username/follow', authenticate, async (req, res) => {
    const targetUsername = req.params.username;
    if (targetUsername === req.user.username) return res.status(400).json({ error: "Cannot follow yourself" });

    const targetUser = await User.findOne({ username: targetUsername });
    const currentUser = await User.findOne({ username: req.user.username });

    const isFollowing = currentUser.following.includes(targetUsername);
    if (isFollowing) {
        currentUser.following = currentUser.following.filter(u => u !== targetUsername);
        targetUser.followers = targetUser.followers.filter(u => u !== req.user.username);
    } else {
        currentUser.following.push(targetUsername);
        targetUser.followers.push(req.user.username);
    }

    await currentUser.save();
    await targetUser.save();
    res.json({ following: !isFollowing });
});

app.get('/api/users/me', authenticate, async (req, res) => {
    const user = await User.findOne({ username: req.user.username });
    res.json({ username: user.username, following: user.following, followers: user.followers });
});

// Get posts for a specific user
app.get('/api/users/:username/posts', authenticate, async (req, res) => {
    try {
        const posts = await Post.find({ author: req.params.username }).sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user posts' });
    }
});

// --- ROUTES: NOTIFICATIONS ---
app.get('/api/notifications', authenticate, async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user.username })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

app.get('/api/notifications/unread-count', authenticate, async (req, res) => {
    try {
        const count = await Notification.countDocuments({ recipient: req.user.username, read: false });
        res.json({ unreadCount: count });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get count' });
    }
});

app.post('/api/notifications/:id/read', authenticate, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (notification && notification.recipient === req.user.username) {
            notification.read = true;
            await notification.save();
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to mark as read' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 VoiceX running on http://localhost:${PORT}`));