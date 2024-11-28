const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { z } = require('zod');

// Zod Schema
const schoolSchema = z.object({
    name: z.string().nonempty('Name is required'),
    address: z.string().nonempty('Address is required'),
    latitude: z.number().min(-90, 'Latitude must be between -90 and 90').max(90),
    longitude: z.number().min(-180, 'Longitude must be between -180 and 180').max(180),
});

// Add School API
router.post('/addSchool', async (req, res) => {
    try {
        const validatedData = schoolSchema.parse(req.body); // Validate request body

        const { name, address, latitude, longitude } = validatedData;

        const result = await db.query(
            `INSERT INTO schools (name, address, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING id`,
            [name, address, latitude, longitude]
        );
        res.status(201).json({ message: 'School added successfully', schoolId: result.rows[0].id });
    } catch (error) {
        if (error instanceof z.ZodError) {
            // Return validation errors from Zod
            return res.status(400).json({ errors: error.errors.map((e) => e.message) });
        }
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
