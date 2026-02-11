/**
 * Photo Authenticity Service for Greenmark
 * EXTREME STRICT MODE: Rejects anything that isn't a fresh camera photo
 */

import fs from 'fs';
import path from 'path';

/**
 * STRICTEST Photo Authenticity Analysis
 * @param {string} filePath - Path to the image file
 * @returns {Object} - Authenticity analysis result
 */
export const analyzePhotoAuthenticity = async (filePath) => {
    try {
        const buffer = fs.readFileSync(filePath);
        const stats = fs.statSync(filePath);
        const fileSize = stats.size;
        const filename = path.basename(filePath).toLowerCase();

        // Initialize Fail State
        let isAuthentic = false;
        let score = 0;
        let rejectReason = '';
        const issues = [];
        const validations = [];

        // =========================================================
        // 1. EXIF CHECK (MANDATORY)
        // Original camera photos MUST have EXIF data.
        // Downloaded/Screenshots almost NEVER have full EXIF.
        // =========================================================
        const exifData = analyzeExifData(buffer);

        if (!exifData.hasExif) {
            return {
                isAuthentic: false,
                authenticityScore: 0,
                verdict: 'REJECTED_NO_EXIF',
                recommendation: 'Photo rejected: No camera metadata found. Please upload an original photo taken directly with your camera.',
                issues: ['Missing EXIF metadata (typical of downloaded/screenshot images)'],
                validations: []
            };
        }

        validations.push('EXIF Metadata found (Camera Signature)');
        score += 30;

        // =========================================================
        // 2. CAMERA MAKER CHECK
        // Must have Make/Model
        // =========================================================
        // Camera info is helpful but not mandatory for mobile phones
        if (exifData.hasCamera) {
            validations.push(`Camera detected: ${exifData.camera}`);
            score += 20;
        } else {
            // Some mobile cameras don't include make/model in all photos
            issues.push('No camera model info (some mobile cameras omit this)');
            score += 5; // Small bonus for having EXIF even without camera info
        }

        // =========================================================
        // 3. DATE CHECK (The "Google Photo" Killer)
        // File system time is unreliable (shows download time).
        // Must use EXIF DateTimeOriginal.
        // =========================================================
        const now = Date.now();
        let photoDate = null;

        // Try parsing EXIF date (Format: "YYYY:MM:DD HH:MM:SS")
        if (exifData.dateString) {
            // Convert "2023:12:25 12:00:00" to timestamps
            const parts = exifData.dateString.split(/[:\s]/);
            if (parts.length >= 6) {
                photoDate = new Date(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5]).getTime();
            }
        }

        if (!photoDate) {
            // Fallback to file time if EXIF date unparseable
            // Mobile cameras sometimes have incomplete EXIF
            issues.push('Could not verify original capture date from EXIF');
            score += 10; // Don't penalize too much for mobile cameras
        } else {
            const ageInMinutes = (now - photoDate) / (1000 * 60);
            const hour = new Date(photoDate).getHours(); // 0-23

            // EVENING TIME CHECK (6:00 PM to 6:00 AM)
            if (hour >= 18 || hour < 6) {
                issues.push(`🌙 Photo taken at ${new Date(photoDate).toLocaleTimeString()} (Evening/Night). Lighting may be poor.`);
                score -= 10; // Small penalty instead of reject
            }

            if (ageInMinutes < 0) {
                // Future date?! Clock mismatch or spoofing
                issues.push('Photo has invalid future timestamp');
            } else if (ageInMinutes < 60) { // 1 Hour
                score += 30;
                validations.push(`Photo taken recently (${Math.round(ageInMinutes)} mins ago)`);
            } else if (ageInMinutes < 24 * 60) { // 24 Hours
                score += 25;
                validations.push('Photo taken within last 24 hours');
            } else if (ageInMinutes < 7 * 24 * 60) { // 7 Days - RELAXED
                score += 15;
                validations.push('Photo taken within last week');
            } else {
                // OLD PHOTO -> Just warn, don't reject
                score -= 10;
                issues.push(`Photo was taken on ${new Date(photoDate).toLocaleDateString()} (older photos get lower scores)`);
            }
        }

        // =========================================================
        // 4. FILE PROPERTIES CHECK
        // =========================================================

        // Filename Check
        const DOWNLOAD_INDICATORS = ['image', 'photo', 'download', 'whatsapp', 'facebook', 'instagram', 'screenshot'];
        if (DOWNLOAD_INDICATORS.some(i => filename.includes(i))) {
            score -= 20;
            issues.push('Filename suggests social media or download source');
        }

        // Size Check (Camera photos > 1MB usually)
        if (fileSize < 200000) { // < 200KB
            return {
                isAuthentic: false,
                authenticityScore: 20,
                verdict: 'REJECTED_LOW_QUALITY',
                recommendation: 'Photo rejected: Image quality is too low (likely a thumbnail or screenshot).',
                issues: ['File size too small'],
                validations
            };
        } else if (fileSize > 1500000) {
            score += 20;
            validations.push('High resolution source file');
        }

        // =========================================================
        // FINAL VERDICT
        // =========================================================

        // Must have passed mandatory checks + score >= 50 (RELAXED from 70)
        isAuthentic = score >= 50;

        const verdict = isAuthentic ? 'AUTHENTIC' : 'SUSPICIOUS';
        const recommendation = isAuthentic
            ? 'Photo Verified: Original Camera Capture'
            : 'Photo rejected: Does not meet strict originality criteria.';

        console.log(`🔍 Authenticity: ${score}% (${verdict})`);

        return {
            success: true,
            isAuthentic,
            authenticityScore: score,
            verdict,
            recommendation,
            issues,
            validations
        };

    } catch (error) {
        console.error('Auth Error:', error);
        return { isAuthentic: false, authenticityScore: 0, verdict: 'ERROR', issues: [error.message] };
    }
};

/**
 * Helper to parse basic EXIF headers manually
 */
const analyzeExifData = (buffer) => {
    let hasExif = false;
    let hasCamera = false;
    let camera = '';
    let dateString = null;

    try {
        // Quick scan for Exif header
        const exifSig = Buffer.from([0x45, 0x78, 0x69, 0x66, 0x00, 0x00]); // "Exif\0\0"
        const idx = buffer.indexOf(exifSig);

        if (idx !== -1) {
            hasExif = true;
            // Scan nearby for text that looks like Make/Model or Date
            // Limit scan to first 4KB
            const headerChunk = buffer.slice(0, 4096).toString('binary'); // Binary prevents encoding corruption

            // Look for Date: YYYY:MM:DD HH:MM:SS
            const dateMatch = headerChunk.match(/\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2}/);
            if (dateMatch) {
                dateString = dateMatch[0];
            }

            // Look for common makers
            const makers = ['Apple', 'Samsung', 'Google', 'Canon', 'Nikon', 'Sony', 'Xiaomi', 'Oppo', 'Vivo', 'OnePlus'];
            for (const m of makers) {
                if (headerChunk.includes(m)) {
                    hasCamera = true;
                    camera = m;
                    break;
                }
            }
        }
    } catch (e) {
        console.error("Exif parse error", e);
    }

    return { hasExif, hasCamera, camera, dateString };
};

export const quickAuthenticityCheck = analyzePhotoAuthenticity;
export default { analyzePhotoAuthenticity };
