/**
 * Plant.id API Integration for Plant Species Detection
 * FREE TIER: 100 requests/day, no credit card required!
 * Better for plant detection than Google Vision
 */

import axios from 'axios';

/**
 * Detect plant species using Plant.id API
 * @param {Buffer} buffer - Image buffer
 * @param {string} expectedSpecies - Expected plant species name
 * @returns {Object} - Detection result
 */
export const detectPlantWithPlantId = async (buffer, expectedSpecies) => {
    try {
        const PLANT_ID_API_KEY = process.env.PLANT_ID_API_KEY;

        if (!PLANT_ID_API_KEY) {
            console.warn('⚠️ Plant.id API key not configured');
            return { isPlant: false, wrongSpecies: false, confidence: 0 };
        }

        // Convert buffer to base64
        const base64Image = buffer.toString('base64');

        console.log('🌿 Calling Plant.id API...');

        // Call Plant.id API
        const response = await axios.post(
            'https://api.plant.id/v2/identify',
            {
                images: [`data:image/jpeg;base64,${base64Image}`],
                modifiers: ['similar_images'],
                plant_details: ['common_names', 'taxonomy']
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Api-Key': PLANT_ID_API_KEY
                },
                timeout: 30000 // 30 second timeout
            }
        );

        const result = response.data;

        if (!result.suggestions || result.suggestions.length === 0) {
            console.log('❌ No plant detected');
            return { isPlant: false, wrongSpecies: false, confidence: 0 };
        }

        // Get top suggestion
        const topSuggestion = result.suggestions[0];
        const confidence = Math.round(topSuggestion.probability * 100);
        const scientificName = topSuggestion.plant_name.toLowerCase();
        const commonNames = topSuggestion.plant_details?.common_names || [];

        console.log(`🔍 Plant.id Detected: ${topSuggestion.plant_name} (${confidence}%)`);
        console.log(`   Common names:`, commonNames.slice(0, 3).join(', '));

        // Check if it's actually a plant
        const isPlant = topSuggestion.probability > 0.3; // 30% threshold

        if (!isPlant) {
            return { isPlant: false, wrongSpecies: false, confidence };
        }

        // Species mapping - map your saplings to scientific/common names
        const speciesMap = {
            'banyan': ['ficus benghalensis', 'banyan', 'ficus', 'indian banyan'],
            'guava': ['psidium guajava', 'guava', 'common guava'],
            'papaya': ['carica papaya', 'papaya', 'pawpaw'],
            'mango': ['mangifera indica', 'mango', 'common mango'],
            'neem': ['azadirachta indica', 'neem', 'indian lilac'],
            'coconut': ['cocos nucifera', 'coconut', 'coconut palm'],
            'lemon': ['citrus limon', 'lemon', 'citrus'],
            'tulsi': ['ocimum tenuiflorum', 'holy basil', 'tulsi', 'sacred basil'],
            'rose': ['rosa', 'rose'],
            'hibiscus': ['hibiscus', 'china rose'],
            'bamboo': ['bambusa', 'bambusoideae', 'bamboo'],
            'aloe': ['aloe vera', 'aloe', 'medicinal aloe']
        };

        const expectedLower = expectedSpecies.toLowerCase();
        const expectedKeywords = speciesMap[expectedLower] || [expectedLower];

        // Check if detected species matches expected
        const allNames = [scientificName, ...commonNames.map(n => n.toLowerCase())];
        const matchesExpected = allNames.some(name =>
            expectedKeywords.some(kw => name.includes(kw) || kw.includes(name))
        );

        if (matchesExpected) {
            return {
                isPlant: true,
                wrongSpecies: false,
                confidence,
                detectedPlant: expectedSpecies,
                scientificName: topSuggestion.plant_name,
                commonNames: commonNames.slice(0, 3)
            };
        }

        // Check if it's a different plant species we know about
        const otherPlantDetected = Object.entries(speciesMap).find(([species, keywords]) =>
            species !== expectedLower &&
            allNames.some(name => keywords.some(kw => name.includes(kw) || kw.includes(name)))
        );

        if (otherPlantDetected) {
            const [detectedSpecies] = otherPlantDetected;

            return {
                isPlant: true,
                wrongSpecies: true,
                confidence,
                detectedPlant: detectedSpecies.charAt(0).toUpperCase() + detectedSpecies.slice(1),
                scientificName: topSuggestion.plant_name,
                commonNames: commonNames.slice(0, 3)
            };
        }

        // It's a plant, but we can't determine if it's the right species
        // Be lenient and allow it
        return {
            isPlant: true,
            wrongSpecies: false,
            confidence,
            detectedPlant: topSuggestion.plant_name,
            scientificName: topSuggestion.plant_name,
            commonNames: commonNames.slice(0, 3)
        };

    } catch (error) {
        console.error('❌ Plant.id API Error:', error.response?.data || error.message);
        throw error;
    }
};

export default { detectPlantWithPlantId };
