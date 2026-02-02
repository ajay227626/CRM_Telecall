const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'df0bzg4la',
    api_key: process.env.CLOUDINARY_API_KEY || '392779829153234',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'NaQH-gD93vdpkaEosZBqmkWttik'
});

module.exports = cloudinary;
