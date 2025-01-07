# Postify

A RESTful API for managing posts and tags with image upload functionality.

## Features

- Post management with image uploads to AWS S3
- Tag management with search functionality
- Pagination and filtering
- Input validation
- Error handling
- API documentation

## Tech Stack

- Node.js
- Express.js
- MongoDB
- AWS S3

## API Documentation

The API provides the following endpoints:

### Health Check
- GET /health - Check server status

### Tags
- GET /api/tags - Get all tags with pagination and search
- POST /api/tags - Create a new tag

### Posts
- GET /api/posts - Get all posts with filtering and pagination
- POST /api/posts - Create a new post with image upload
