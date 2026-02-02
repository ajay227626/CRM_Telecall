const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const auth = require('../middleware/auth'); // Assuming there is an auth middleware

// Get all notifications for the current user
router.get('/', auth, async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user.id })
            .sort({ createdAt: -1 });
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a notification (for testing or internal use)
router.post('/', auth, async (req, res) => {
    const { type, title, message, metadata } = req.body;
    try {
        const notification = new Notification({
            user: req.user.id,
            type,
            title,
            message,
            metadata
        });
        const newNotification = await notification.save();
        res.status(201).json(newNotification);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Mark a specific notification as read
router.put('/:id/read', auth, async (req, res) => {
    try {
        const notification = await Notification.findOne({ _id: req.params.id, user: req.user.id });
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        notification.read = true;
        await notification.save();
        res.json(notification);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Mark all notifications as read
router.put('/read-all', auth, async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user.id, read: false },
            { $set: { read: true } }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete a notification
router.delete('/:id', auth, async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        res.json({ message: 'Notification deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
