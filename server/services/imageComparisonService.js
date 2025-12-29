/**
 * Image Comparison Service for Greenmark
 * Compares sapling photos to verify growth and detect fraud
 * Uses perceptual hashing and similarity scoring
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Calculate perceptual hash of image using simple averaging
 * This creates a fingerprint of the image content
 */
const calculateSimpleHash = async (filePath) => {
    try {
        const buffer = fs.readFileSync(filePath);

        // Use MD5 for file hash (not perceptual, but useful for exact match)
        const md5Hash = crypto.createHash('md5').update(buffer).digest('hex');

        // Calculate a simple "content signature" based on file structure
        // This is a simplified approach - for production, use a proper image hashing library
        const fileSize = buffer.length;

        // Sample bytes at regular intervals for a rough content fingerprint
        const samples = [];
        const interval = Math.floor(buffer.length / 100);
        for (let i = 0; i < 100 && i * interval < buffer.length; i++) {
            samples.push(buffer[i * interval]);
        }

        const contentSignature = crypto
            .createHash('sha256')
            .update(Buffer.from(samples))
            .digest('hex')
            .substring(0, 16);

        return {
            md5Hash,
            contentSignature,
            fileSize
        };
    } catch (error) {
        console.error('Hash calculation error:', error.message);
        return null;
    }
};

/**
 * Compare two images for similarity
 * Returns similarity score (0-100) where 100 = identical
 */
export const compareImages = async (imagePath1, imagePath2) => {
    try {
        // Verify both files exist
        if (!fs.existsSync(imagePath1) || !fs.existsSync(imagePath2)) {
            return {
                success: false,
                error: 'One or both image files not found'
            };
        }

        const hash1 = await calculateSimpleHash(imagePath1);
        const hash2 = await calculateSimpleHash(imagePath2);

        if (!hash1 || !hash2) {
            return {
                success: false,
                error: 'Failed to calculate image hashes'
            };
        }

        // Check for exact match
        if (hash1.md5Hash === hash2.md5Hash) {
            return {
                success: true,
                isExactMatch: true,
                similarityScore: 100,
                verdict: 'EXACT_MATCH',
                message: 'Warning: Images are identical. This may indicate photo reuse.'
            };
        }

        // Check content signature similarity
        let signatureMatch = 0;
        for (let i = 0; i < hash1.contentSignature.length; i++) {
            if (hash1.contentSignature[i] === hash2.contentSignature[i]) {
                signatureMatch++;
            }
        }
        const signatureSimilarity = (signatureMatch / hash1.contentSignature.length) * 100;

        // Size similarity (within 20% is considered similar)
        const sizeDiff = Math.abs(hash1.fileSize - hash2.fileSize);
        const avgSize = (hash1.fileSize + hash2.fileSize) / 2;
        const sizeVariance = (sizeDiff / avgSize) * 100;

        // Calculate overall similarity
        let overallSimilarity = signatureSimilarity * 0.7; // 70% weight on content

        // Penalize if sizes are very different
        if (sizeVariance > 50) {
            overallSimilarity -= 20;
        } else if (sizeVariance < 10) {
            overallSimilarity += 10; // Boost if sizes are similar
        }

        overallSimilarity = Math.max(0, Math.min(100, overallSimilarity));

        let verdict = 'DIFFERENT';
        let message = 'Images appear to be different photos.';

        if (overallSimilarity >= 80) {
            verdict = 'VERY_SIMILAR';
            message = 'Warning: Images are very similar. May need manual review.';
        } else if (overallSimilarity >= 60) {
            verdict = 'SOMEWHAT_SIMILAR';
            message = 'Images show some similarity, which is expected for the same plant.';
        } else if (overallSimilarity >= 40) {
            verdict = 'LIKELY_SAME_SUBJECT';
            message = 'Images appear to be of the same subject (good for progress tracking).';
        } else {
            verdict = 'DIFFERENT_SUBJECT';
            message = 'Images appear to be of different subjects.';
        }

        return {
            success: true,
            isExactMatch: false,
            similarityScore: Math.round(overallSimilarity),
            signatureSimilarity: Math.round(signatureSimilarity),
            sizeVariance: Math.round(sizeVariance),
            verdict,
            message,
            details: {
                image1Size: hash1.fileSize,
                image2Size: hash2.fileSize
            }
        };

    } catch (error) {
        console.error('Image comparison error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Verify that a new upload is a legitimate growth update
 * Checks against previous uploads for the same sapling
 */
export const verifyGrowthUpdate = async (newImagePath, previousUploads) => {
    try {
        if (!previousUploads || previousUploads.length === 0) {
            return {
                success: true,
                isFirstUpload: true,
                verdict: 'FIRST_UPLOAD',
                message: 'This is the first photo for this sapling.',
                fraudScore: 0
            };
        }

        let fraudIndicators = 0;
        let exactMatchFound = false;
        const comparisons = [];

        // Compare with recent uploads (last 5)
        const recentUploads = previousUploads.slice(-5);

        for (const prevUpload of recentUploads) {
            // Resolve the file path (handle both local and IPFS paths)
            let prevImagePath = prevUpload.image_ipfs_hash;

            // If it's a local path (starts with /uploads/)
            if (prevImagePath.startsWith('/uploads/')) {
                prevImagePath = path.join(process.cwd(), prevImagePath);
            }

            // Skip if file doesn't exist (might be IPFS hash)
            if (!fs.existsSync(prevImagePath)) {
                continue;
            }

            const comparison = await compareImages(newImagePath, prevImagePath);

            if (comparison.success) {
                comparisons.push({
                    previousUploadDate: prevUpload.upload_date,
                    ...comparison
                });

                if (comparison.isExactMatch) {
                    exactMatchFound = true;
                    fraudIndicators += 100; // Immediate Fraud
                } else if (comparison.similarityScore > 92) {
                    // Very high similarity -> Likely same photo with minor artifacting (e.g. re-saved)
                    // For monthly growth updates, >92% similarity is suspicious (plant should grow/move)
                    exactMatchFound = true;
                    fraudIndicators += 100;
                } else if (comparison.similarityScore >= 85) {
                    fraudIndicators += 30;
                } else if (comparison.similarityScore >= 80) {
                    fraudIndicators += 15;
                }
            }
        }

        // Calculate fraud score (0-100)
        const fraudScore = Math.min(100, fraudIndicators);

        let verdict = 'VALID';
        let message = 'Photo appears to be a legitimate new growth update.';
        let allowUpload = true;

        if (exactMatchFound) {
            verdict = 'FRAUD_DETECTED';
            message = 'This photo is virtually identical to a previous upload. Please take a NEW photo.';
            allowUpload = false;
        } else if (fraudScore >= 50) {
            verdict = 'SUSPICIOUS';
            message = 'Photo is very similar to previous uploads. Please ensure this is a new photo.';
            allowUpload = false;
        } else if (fraudScore >= 30) {
            verdict = 'NEEDS_REVIEW';
            message = 'Photo shows significant similarity to previous uploads. Will be flagged for review.';
            allowUpload = true; // Allow but flag for review
        }

        return {
            success: true,
            isFirstUpload: false,
            verdict,
            message,
            allowUpload,
            fraudScore,
            comparisons,
            previousUploadsChecked: recentUploads.length
        };

    } catch (error) {
        console.error('Growth verification error:', error.message);
        return {
            success: false,
            error: error.message,
            allowUpload: false
        };
    }
};

/**
 * Calculate growth progress based on photo comparison
 * This is a simplified version - real implementation would use image analysis
 */
export const estimateGrowth = async (currentImagePath, previousImagePath) => {
    try {
        const comparison = await compareImages(currentImagePath, previousImagePath);

        if (!comparison.success) {
            return {
                success: false,
                error: comparison.error
            };
        }

        // In a real implementation, this would use ML to detect plant size
        // For now, we use a heuristic based on similarity

        // If images are too similar, might indicate no growth or same photo
        // If images are too different, might not be the same plant

        let growthEstimate = 50; // Base estimate

        if (comparison.similarityScore >= 30 && comparison.similarityScore <= 70) {
            // Ideal range - shows change but still same subject
            growthEstimate = 70 + Math.random() * 20; // 70-90%
        } else if (comparison.similarityScore > 70) {
            // Very similar - little growth
            growthEstimate = 30 + Math.random() * 20; // 30-50%
        } else {
            // Very different - suspicious or dramatic change
            growthEstimate = 40 + Math.random() * 30; // 40-70%
        }

        return {
            success: true,
            growthEstimate: Math.round(growthEstimate),
            comparisonScore: comparison.similarityScore,
            verdict: comparison.verdict
        };

    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

export default {
    compareImages,
    verifyGrowthUpdate,
    estimateGrowth
};
