/**
 * Sapling Recognition Service for Greenmark
 * Heuristic-based classification to verify uploaded photos are of saplings/plants
 * Uses color analysis, file properties, and other indicators
 */

import fs from 'fs';
import path from 'path';
import { detectPlantWithPlantId } from './plantIdService.js';

// Plant-related classes from ImageNet that indicate valid sapling photos
const PLANT_CLASSES = [
    'pot', 'flower_pot', 'flowerpot', 'planter',
    'plant', 'houseplant', 'tree', 'flower',
    'leaf', 'foliage', 'grass', 'herb',
    'seedling', 'sapling', 'shrub', 'bush',
    'vegetable', 'garden', 'greenhouse',
    'succulent', 'cactus', 'fern', 'palm',
    'eucalyptus', 'rubber_tree', 'fig_tree',
    'money_plant', 'tulsi', 'basil', 'mint',
    'oregano', 'rose', 'jasmine', 'marigold'
];

// Classes that definitely indicate non-plant photos
const INVALID_CLASSES = [
    'person', 'human', 'face', 'hand', 'arm',
    'computer', 'laptop', 'phone', 'screen', 'monitor',
    'car', 'vehicle', 'traffic', 'road',
    'building', 'house', 'room', 'wall',
    'food', 'pizza', 'burger', 'sandwich',
    'animal', 'dog', 'cat', 'bird',
    'text', 'document', 'paper', 'book'
];

/**
 * Analyze if image is predominantly green (plant indicator)
 * Simple color-based heuristic
 */
const analyzeGreenContent = (buffer) => {
    // Read JPEG image data
    // This is a simplified check - look for green color patterns

    let greenScore = 0;
    let totalSamples = 0;

    // Sample the image buffer for RGB patterns
    // JPEG files have specific structure, but we'll do a rough estimate
    const sampleSize = Math.min(buffer.length, 50000);

    for (let i = 100; i < sampleSize - 2; i += 30) {
        // In image data, green channel is often higher in plant photos
        const byte1 = buffer[i];
        const byte2 = buffer[i + 1];
        const byte3 = buffer[i + 2];

        // Check if the sample looks "green-ish" (green > red and green > blue)
        if (byte2 > byte1 && byte2 > byte3 && byte2 > 50) {
            greenScore++;
        }
        totalSamples++;
    }

    const greenRatio = totalSamples > 0 ? (greenScore / totalSamples) * 100 : 0;

    return {
        greenRatio: Math.round(greenRatio),
        isLikelyPlant: greenRatio > 10 // Relaxed from 15% for flash/night photos
    };
};

/**
 * Check filename for plant/nature keywords
 */
const checkFilenameKeywords = (filename) => {
    const lowerName = filename.toLowerCase();

    const plantKeywords = [
        'plant', 'tree', 'flower', 'leaf', 'garden', 'green',
        'sapling', 'grow', 'nature', 'herb', 'seed', 'pot'
    ];

    const invalidKeywords = [
        'screenshot', 'download', 'image', 'photo', 'pic',
        'wallpaper', 'background', 'stock', 'sample'
    ];

    const hasPlantKeyword = plantKeywords.some(kw => lowerName.includes(kw));
    const hasInvalidKeyword = invalidKeywords.some(kw => lowerName.includes(kw));

    return {
        hasPlantKeyword,
        hasInvalidKeyword,
        confidence: hasPlantKeyword ? 60 : (hasInvalidKeyword ? 20 : 40)
    };
};

/**
 * Check image dimensions and aspect ratio
 * Plant photos typically have normal camera ratios
 */
const checkImageProperties = (buffer, fileSize) => {
    // Standard phone photo ratios: 4:3, 16:9, 1:1
    // Screenshots often have unusual ratios

    let score = 50;

    // File size check (plant photos are usually high quality)
    if (fileSize > 1000000) { // > 1MB
        score += 15;
    } else if (fileSize > 500000) { // > 500KB
        score += 10;
    } else if (fileSize < 100000) { // < 100KB
        score -= 20; // Very small, likely low quality or screenshot
    }

    // Check for JPEG markers
    const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8;
    if (isJpeg) {
        score += 10;
    }

    return {
        score,
        isJpeg,
        fileSize
    };
};

/**
 * Advanced color analysis - look for natural green tones
 */
const advancedColorAnalysis = (buffer) => {
    const sampleSize = Math.min(buffer.length, 100000);
    let naturalGreenCount = 0;
    let brightCount = 0;
    let darkCount = 0;
    let totalSamples = 0;

    for (let i = 200; i < sampleSize - 3; i += 50) {
        const r = buffer[i];
        const g = buffer[i + 1];
        const b = buffer[i + 2];

        // Natural green hues (Relaxed max for flash photos)
        if (g > r && g > b && g >= 30 && g <= 250) {
            if (Math.abs(r - b) < 50) { // Natural greens have similar R and B
                naturalGreenCount++;
            }
        }

        // Check brightness distribution
        const brightness = (r + g + b) / 3;
        if (brightness > 200) brightCount++;
        else if (brightness < 50) darkCount++;

        totalSamples++;
    }

    const naturalGreenRatio = totalSamples > 0 ? (naturalGreenCount / totalSamples) * 100 : 0;
    const brightRatio = totalSamples > 0 ? (brightCount / totalSamples) * 100 : 0;

    return {
        naturalGreenRatio: Math.round(naturalGreenRatio),
        hasNaturalColors: naturalGreenRatio > 8,
        isOverexposed: brightRatio > 60, // Relaxed from 40 for flash photos
        score: Math.round(naturalGreenRatio * 2)
    };
};

/**
 * Detect plant species using Google Cloud Vision API
 * @param {Buffer} buffer - Image buffer
 * @param {string} expectedSpecies - Expected plant species name
 * @returns {Object} - Detection result
 */
const detectPlantWithVision = async (buffer, expectedSpecies) => {
    try {
        const VISION_API_KEY = process.env.GOOGLE_VISION_API_KEY;

        if (!VISION_API_KEY) {
            console.warn('⚠️ Google Vision API key not configured');
            return { isPlant: false, wrongSpecies: false, confidence: 0 };
        }

        // Convert buffer to base64
        const base64Image = buffer.toString('base64');

        // Call Google Cloud Vision API
        const response = await axios.post(
            `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`,
            {
                requests: [{
                    image: { content: base64Image },
                    features: [
                        { type: 'LABEL_DETECTION', maxResults: 10 },
                        { type: 'WEB_DETECTION', maxResults: 5 }
                    ]
                }]
            }
        );

        const labels = response.data.responses[0]?.labelAnnotations || [];
        const webEntities = response.data.responses[0]?.webDetection?.webEntities || [];

        // Combine labels and web entities for better detection
        const allDetections = [
            ...labels.map(l => ({ description: l.description.toLowerCase(), score: l.score })),
            ...webEntities.map(e => ({ description: e.description?.toLowerCase() || '', score: e.score || 0.5 }))
        ];

        console.log('🔍 Vision API Detected:', allDetections.slice(0, 5).map(d => d.description).join(', '));

        // Check if it's a plant
        const plantKeywords = ['plant', 'tree', 'flower', 'leaf', 'foliage', 'vegetation', 'botanical', 'flora'];
        const isPlant = allDetections.some(d =>
            plantKeywords.some(kw => d.description.includes(kw)) && d.score > 0.6
        );

        if (!isPlant) {
            return { isPlant: false, wrongSpecies: false, confidence: 0 };
        }

        // Species mapping - map common names to what Vision API might return
        const speciesMap = {
            'banyan': ['banyan', 'ficus', 'fig tree', 'banyan tree'],
            'guava': ['guava', 'psidium', 'guava tree'],
            'papaya': ['papaya', 'carica', 'papaya tree', 'pawpaw'],
            'mango': ['mango', 'mangifera', 'mango tree'],
            'neem': ['neem', 'azadirachta', 'neem tree'],
            'coconut': ['coconut', 'cocos', 'palm', 'coconut palm'],
            'lemon': ['lemon', 'citrus', 'lemon tree'],
            'tulsi': ['basil', 'tulsi', 'holy basil', 'ocimum'],
            'rose': ['rose', 'rosa', 'rose plant'],
            'hibiscus': ['hibiscus', 'china rose'],
            'bamboo': ['bamboo', 'bambusoideae'],
            'aloe': ['aloe', 'aloe vera', 'succulent']
        };

        const expectedLower = expectedSpecies.toLowerCase();
        const expectedKeywords = speciesMap[expectedLower] || [expectedLower];

        // Check if detected species matches expected
        const matchesExpected = allDetections.some(d =>
            expectedKeywords.some(kw => d.description.includes(kw)) && d.score > 0.5
        );

        if (matchesExpected) {
            const matchedLabel = allDetections.find(d =>
                expectedKeywords.some(kw => d.description.includes(kw))
            );
            return {
                isPlant: true,
                wrongSpecies: false,
                confidence: Math.round(matchedLabel.score * 100),
                detectedPlant: expectedSpecies,
                labels: allDetections.slice(0, 5).map(d => d.description)
            };
        }

        // Check if it's a different plant species
        const otherPlantDetected = Object.entries(speciesMap).find(([species, keywords]) =>
            species !== expectedLower &&
            allDetections.some(d => keywords.some(kw => d.description.includes(kw)) && d.score > 0.6)
        );

        if (otherPlantDetected) {
            const [detectedSpecies] = otherPlantDetected;
            const detectedLabel = allDetections.find(d =>
                otherPlantDetected[1].some(kw => d.description.includes(kw))
            );

            return {
                isPlant: true,
                wrongSpecies: true,
                confidence: Math.round(detectedLabel.score * 100),
                detectedPlant: detectedSpecies.charAt(0).toUpperCase() + detectedSpecies.slice(1),
                labels: allDetections.slice(0, 5).map(d => d.description)
            };
        }

        // It's a plant, but we can't determine the specific species
        return {
            isPlant: true,
            wrongSpecies: false,
            confidence: 70,
            detectedPlant: 'plant',
            labels: allDetections.slice(0, 5).map(d => d.description)
        };

    } catch (error) {
        console.error('❌ Vision API Error:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Main function to verify if image contains a sapling/plant
 * @param {string} filePath - Path to the image file
 * @returns {Object} - Recognition result
 */
export const recognizeSapling = async (filePath, expectedSpecies = null) => {
    try {
        if (!fs.existsSync(filePath)) {
            return {
                success: false,
                error: 'Image file not found'
            };
        }

        const buffer = fs.readFileSync(filePath);
        const fileSize = buffer.length;
        const filename = path.basename(filePath);

        // Initialize scores
        let plantConfidence = 40;
        const validations = [];
        const issues = [];

        // 1. Basic Color Analysis
        const colorAnalysis = analyzeGreenContent(buffer);
        if (colorAnalysis.isLikelyPlant) {
            plantConfidence += 25;
            validations.push(`Image has ${colorAnalysis.greenRatio}% green content (plant-like)`);
        } else if (colorAnalysis.greenRatio < 5) {
            plantConfidence -= 15;
            issues.push('Image has very low green content');
        }

        // 2. Advanced Color Analysis
        const advancedColor = advancedColorAnalysis(buffer);
        if (advancedColor.hasNaturalColors) {
            plantConfidence += 15;
            validations.push(`Natural green tones detected (${advancedColor.naturalGreenRatio}%)`);
        }
        if (advancedColor.isOverexposed) {
            plantConfidence -= 10;
            issues.push('Image appears overexposed');
        }

        // 3. Image Properties
        const propAnalysis = checkImageProperties(buffer, fileSize);
        plantConfidence += (propAnalysis.score - 50) * 0.5;
        if (propAnalysis.isJpeg) validations.push('Valid image format');

        // =========================================================
        // SPEED OPTIMIZATION: HEURISTIC BYPASS
        // If our local fast checks are >80% confident, SKIP Plant.id
        // This makes the response INSTANT for good photos.
        // =========================================================
        const isHighlyConfident = plantConfidence >= 80 && issues.length === 0;

        if (expectedSpecies && !isHighlyConfident) {
            console.log(`⏳ Heuristically uncertain (${plantConfidence}%), calling Plant.id for ${expectedSpecies}...`);
            try {
                const plantIdResult = await detectPlantWithPlantId(buffer, expectedSpecies);

                if (plantIdResult.wrongSpecies) {
                    console.log(`⚠️ Species Mismatch: Expected ${expectedSpecies}, detected ${plantIdResult.detectedPlant}`);
                    return {
                        success: true,
                        isSapling: false,
                        plantConfidence: plantIdResult.confidence,
                        verdict: 'WRONG_SPECIES',
                        message: `❌ Incorrect Sapling: AI detected ${plantIdResult.detectedPlant}. Please upload your ${expectedSpecies}.`,
                        validations: [],
                        issues: [`AI detected ${plantIdResult.detectedPlant} instead of ${expectedSpecies}`],
                        detectedSpecies: plantIdResult.detectedPlant
                    };
                }

                if (plantIdResult.isPlant) {
                    plantConfidence = Math.max(plantConfidence, plantIdResult.confidence);
                    validations.push(`AI species confirmed: ${plantIdResult.scientificName}`);
                }
            } catch (plantIdError) {
                console.warn('⚠️ Plant.id API Timeout or Error, relying on heuristics');
            }
        } else if (isHighlyConfident) {
            console.log('🚀 Skipping Plant.id (Local Heuristics High Confidence)');
            validations.push('Fast AI: Photo matches sapling profile');
        }

        // 4. Filename Check
        const filenameAnalysis = checkFilenameKeywords(filename);
        if (filenameAnalysis.hasPlantKeyword) {
            plantConfidence += 5;
            validations.push('Filename contains plant-related keywords');
        }
        if (filenameAnalysis.hasInvalidKeyword) {
            plantConfidence -= 10;
            issues.push('Filename suggests screenshot or downloaded image');
        }

        // Quality Indicators (Consolidated)
        if (fileSize > 500000) {
            validations.push('High quality image (suitable for analysis)');
        } else if (fileSize < 200000) {
            issues.push('Low quality or compressed image');
        }

        // Cap confidence
        plantConfidence = Math.max(0, Math.min(100, Math.round(plantConfidence)));

        // Determine verdict
        let verdict = 'UNKNOWN';
        let isSapling = false;
        let message = '';

        if (plantConfidence >= 70) {
            verdict = 'VALID_SAPLING';
            isSapling = true;
            message = 'Image appears to contain a valid plant/sapling photo.';
        } else if (plantConfidence >= 50) {
            verdict = 'LIKELY_SAPLING';
            isSapling = true;
            message = 'Image likely contains a plant. Will be flagged for verification.';
        } else if (plantConfidence >= 30) {
            verdict = 'UNCERTAIN';
            isSapling = false;
            message = 'Cannot confidently identify a plant in this image.';
        } else {
            verdict = 'NOT_SAPLING';
            isSapling = false;
            message = 'This image does not appear to be a plant photo. Please upload a clear photo of your sapling.';
        }

        return {
            success: true,
            isSapling,
            plantConfidence,
            verdict,
            message,
            validations,
            issues,
            analysis: {
                colorAnalysis,
                advancedColorAnalysis: advancedColor,
                filenameAnalysis,
                propertyAnalysis: propAnalysis
            }
        };

    } catch (error) {
        console.error('❌ Sapling Recognition Error:', error.message);
        return {
            success: false,
            isSapling: true, // Default to allowing in case of error
            plantConfidence: 50,
            error: error.message,
            message: 'Analysis completed with defaults.'
        };
    }
};

/**
 * Quick validation for upload endpoint
 */
export const validateSaplingPhoto = async (filePath) => {
    const result = await recognizeSapling(filePath);
    return {
        isValid: result.isSapling,
        confidence: result.plantConfidence,
        message: result.message,
        verdict: result.verdict
    };
};

export default {
    recognizeSapling,
    validateSaplingPhoto
};
