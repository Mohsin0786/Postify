const Post = require('../models/Post');
const Tag = require('../models/Tag');
const createError = require('http-errors');

const logger = require('../utils/logger');

exports.getPosts = async (req, res, next) => {
    try {
        // Define allowed query parameters
        const allowedParams = ['sort', 'page', 'limit', 'keyword', 'tag'];

        // Check for invalid query parameters
        const invalidParams = Object.keys(req.query).filter(
            param => !allowedParams.includes(param)
        );

        if (invalidParams.length > 0) {
            throw createError(400, `Invalid query parameter(s): ${invalidParams.join(', ')}`);
        }

        const {
            sort = 'createdAt',
            page = 1,
            limit = 10,
            keyword,
            tag
        } = req.query;

        // Validate pagination parameters
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        if (isNaN(pageNum) || pageNum < 1) {
            throw createError(400, 'Page must be a positive number');
        }
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
            throw createError(400, 'Limit must be between 1 and 50');
        }

        // Build query filters
        const filters = {};
        const sortOptions = {};

        // Add filters only if they are provided
        if (keyword) {
            filters.$or = [
                { title: new RegExp(keyword, 'i') },
                { desc: new RegExp(keyword, 'i') },
            ];
        }

        if (tag) {
            filters.tags = tag;
        }

        // Handle sort
        if (sort) {
            const allowedSortFields = ['createdAt', 'title', 'desc'];
            if (!allowedSortFields.includes(sort)) {
                throw createError(400, `Invalid sort parameter. Allowed values: ${allowedSortFields.join(', ')}`);
            }
            sortOptions[sort] = -1; // descending order
        } else {
            sortOptions.createdAt = -1; // default sort
        }

        // Get total count for pagination
        const total = await Post.countDocuments(filters);

        // Execute query with or without filters
        const posts = await Post.find(filters)
            .sort(sortOptions)
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .populate('tags','_id name');

        logger.info(`Retrieved posts with filters: ${JSON.stringify(req.query)}`);
        res.status(200).json({
            success: true,
            data: posts,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        logger.error(`Error retrieving posts: ${error.message}`);
        next(error.status ? error : createError(500, error.message));
    }
};

exports.createPost = async (req, res, next) => {
    try {
        const { title, desc } = req.body;
        let tags = req.body.tags || []; // Default to empty array if not provided

        // Validate required fields
        if (!title || !title.trim()) {
            throw createError(400, 'Title is required');
        }

        if (!desc || !desc.trim()) {
            throw createError(400, 'Description is required');
        }

        // Title and description length validation
        if (title.trim().length < 3 || title.trim().length > 100) {
            throw createError(400, 'Title must be between 3 and 100 characters');
        }

        if (desc.trim().length < 10 || desc.trim().length > 5000) {
            throw createError(400, 'Description must be between 10 and 5000 characters');
        }

        // Handle tags parsing and validation
        if (tags) {
            try {
                if (typeof tags === 'string') {
                    tags = JSON.parse(tags);
                }

                // Validate tags is an array
                if (!Array.isArray(tags)) {
                    throw createError(400, 'Tags must be an array');
                }

                // Validate tags array size
                if (tags.length > 10) {
                    throw createError(400, 'Maximum 10 tags allowed per post');
                }

                // Remove duplicate tags
                tags = [...new Set(tags)];

                // Validate each tag ID
                const validTags = await Tag.find({ _id: { $in: tags } });
                if (validTags.length !== tags.length) {
                    throw createError(400, 'One or more tag IDs are invalid');
                }
            } catch (error) {
                logger.error(`Error parsing tags: ${error.message}`);
                throw createError(400, 'Invalid tags format');
            }
        }

        const imageUrl = req.file ? req.file.location : null;

        const newPost = new Post({
            title: title.trim(),
            desc: desc.trim(),
            tags,
            image: imageUrl,
        });

        await newPost.save();
        logger.info(`Post created: ${newPost._id}`);

        const populatedPost = await Post.findById(newPost._id).populate('tags');
        res.status(201).json({ 
            success: true, 
            data: populatedPost,
            message: 'Post created successfully'
        });
    } catch (error) {
        logger.error(`Error creating post: ${error.message}`);
        next(error.status ? error : createError(400, error.message));
    }
};
