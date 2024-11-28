const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { z } = require('zod');

// Zod Schema for Query Parameters
const querySchema = z.object({
    latitude: z
        .string()
        .refine((val) => !isNaN(parseFloat(val)), { message: 'Latitude must be a number' })
        .transform((val) => parseFloat(val)),
    longitude: z
        .string()
        .refine((val) => !isNaN(parseFloat(val)), { message: 'Longitude must be a number' })
        .transform((val) => parseFloat(val)),
});

// List Schools API
router.get('/listSchools', async (req, res) => {
    try {
        const validatedQuery = querySchema.parse(req.query); 
        const { latitude, longitude } = validatedQuery;
        const { rows: schools } = await db.query(`SELECT * FROM schools`);

        // distance calculation
        const calculateDistance = (lat1, lon1, lat2, lon2) => {
            const toRad = (deg) => (deg * Math.PI) / 180;
            const R = 6371; //radius in km
            const dLat = toRad(lat2 - lat1);
            const dLon = toRad(lon2 - lon1);
            const a =
                Math.sin(dLat / 2) ** 2 +
                Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        };

        const sortedSchools = schools
            .map((school) => ({
                ...school,
                distance: calculateDistance(latitude, longitude, school.latitude, school.longitude),
            }))
            .sort((a, b) => a.distance - b.distance);

        res.json(sortedSchools);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: error.errors.map((e) => e.message) });
        }
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
