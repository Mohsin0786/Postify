const Tag = require('../models/Tag');
const createError = require('http-errors');
const logger = require('../utils/logger');

// Create a new tag
exports.createTag = async (req, res, next) => {
    try {
        const { name } = req.body;

        // Validation checks
        if (!name) {
            throw createError(400, 'Tag name is required');
        }

        if (typeof name !== 'string') {
            throw createError(400, 'Tag name must be a string');
        }

        // Trim and validate length
        const trimmedName = name.trim();
        if (trimmedName.length < 2) {
            throw createError(400, 'Tag name must be at least 2 characters long');
        }
        if (trimmedName.length > 30) {
            throw createError(400, 'Tag name cannot exceed 30 characters');
        }

        // Check if tag already exists (case insensitive)
        const existingTag = await Tag.findOne({
            name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
        });
        if (existingTag) {
            throw createError(409, `Tag with  name ${trimmedName} already exists`);
        }

        const newTag = new Tag({ name: trimmedName });
        await newTag.save();
        
        const tagResponse = {
            _id: newTag._id,
            name: newTag.name
        };

        logger.info(`Tag created: ${newTag._id}`);
        res.status(201).json({ success: true, data: tagResponse });
    } catch (error) {
        logger.error(`Error creating tag: ${error.message}`);
        if (error.code === 11000) { // MongoDB duplicate key error
            next(createError(409, 'Tag with this name already exists'));
        } else {
            next(error.status ? error : createError(500, error.message));
        }
    }
};

// Get all tags
exports.getTags = async (req, res, next) => {
    try {
        // Define allowed query parameters
        const allowedParams = ['page', 'limit', 'search'];

        // Check for invalid query parameters
        const invalidParams = Object.keys(req.query).filter(
            param => !allowedParams.includes(param)
        );

        if (invalidParams.length > 0) {
            throw createError(400, `Invalid query parameter(s): ${invalidParams.join(', ')}`);
        }

        const {
            page = 1,
            limit = 10,
            search
        } = req.query;

        // Validate pagination parameters
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        if (isNaN(pageNum) || pageNum < 1) {
            throw createError(400, 'Page must be a positive number');
        }
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            throw createError(400, 'Limit must be between 1 and 100');
        }

        // Build query filters
        const filters = {}

        // Add filters only if they are provided
        if (search) {
            filters.name = { $regex: search, $options: 'i' };
        }

       
        // Get total count for pagination
        const total = await Tag.countDocuments(filters);

        // Execute query with or without filters
        const tags = await Tag.find(filters)
            .select('_id name')
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum);

        logger.info(`Retrieved tags with filters: ${JSON.stringify(req.query)}`);
        res.status(200).json({
            success: true,
            data: tags,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        logger.error(`Error retrieving tags: ${error.message}`);
        next(error.status ? error : createError(500, error.message));
    }
};
