/**
 * Credit Calculation Service for Greenmark
 * Calculates eco-coins and carbon credits based on photo uploads and growth
 */

import Upload from '../models/Upload.js';
import Sapling from '../models/Sapling.js';

// Credit calculation constants
const BASE_UPLOAD_COINS = 10;           // Base coins for any valid upload
const GROWTH_BONUS_MULTIPLIER = 0.5;    // Bonus based on growth percentage
const CARBON_RATE_MULTIPLIER = 0.1;     // Based on sapling's carbon_rate
const CONSECUTIVE_BONUS = 5;            // Bonus for consecutive monthly uploads
const AUTHENTICITY_BONUS = 10;          // Bonus for high authenticity score
const FIRST_UPLOAD_BONUS = 20;          // Bonus for first upload of a sapling

// Thresholds
const MIN_AUTHENTICITY_FOR_BONUS = 70;
const MIN_PLANT_CONFIDENCE_FOR_BONUS = 60;

/**
 * Calculate credits for a new photo upload
 * @param {Object} params - Calculation parameters
 * @returns {Object} - Calculated credits and breakdown
 */
export const calculateUploadCredits = async ({
    userId,
    saplingId,
    authenticityScore = 50,
    plantConfidence = 50,
    growthEstimate = 0, // Percentage growth from previous photo
    isFirstUpload = false,
    fraudScore = 0
}) => {
    try {
        // Get sapling info for carbon rate
        const sapling = await Sapling.findOne({ sapling_id: saplingId });
        // Default max annual sequestration for a mature tree (e.g. 20kg), scaled down for saplings
        const maxAnnualCarbon = sapling?.carbon_rate || 20;

        // Get previous verified uploads to determine time delta
        const previousUploads = await Upload.find({
            user_id: userId,
            sapling_id: saplingId,
            verified: true
        }).sort({ upload_date: -1 });

        let daysSinceLast = 0;
        if (previousUploads.length > 0) {
            daysSinceLast = (Date.now() - new Date(previousUploads[0].upload_date).getTime()) / (1000 * 60 * 60 * 24);
        }

        // Initialize credit breakdown
        const breakdown = {
            baseCoins: 0,
            growthBonus: 0,
            carbonBonus: 0,
            authenticityBonus: 0,
            plantConfidenceBonus: 0,
            consecutiveBonus: 0,
            firstUploadBonus: 0,
            fraudPenalty: 0
        };

        // ==========================================
        // 1. MINIMUM TIME CHECK (Physical limit)
        // ==========================================
        // Plants need at least a few days to show growth.
        // Unless it's the very first upload ever.
        if (!isFirstUpload && daysSinceLast < 5) {
            return {
                success: true,
                totalEcoCoins: 0,
                carbonCalculated: 0,
                breakdown,
                message: `Too soon! Plants need time to grow. Last update was ${Math.round(daysSinceLast)} days ago.`,
                details: {
                    reason: 'Time delta too small for growth verification.'
                }
            };
        }

        // ==========================================
        // 2. GROWTH & ADDED BIOMASS CALCULATION
        // ==========================================
        // Logic: 
        // If growthEstimate is low (< 5%), we assume maintenance only, minor credits.
        // If growthEstimate is negligible (< 1%) -> likely same photo or no growth -> 0 credits.

        let validGrowth = false;

        if (isFirstUpload) {
            // First ever photo always gets base establishment points
            validGrowth = true;
            breakdown.baseCoins = 10;
            breakdown.firstUploadBonus = 20;
        } else {
            // Subsequent uploads MUST show growth OR maintenance over time
            if (growthEstimate > 2) {
                validGrowth = true;
                breakdown.baseCoins = 10; // Valid maintenance

                // Growth Bonus
                // e.g. 50% growth -> 25 coins
                breakdown.growthBonus = Math.floor(growthEstimate * 0.5);
            } else {
                // Too little growth to reward significant points
                // Maybe just 5 coins for "checking in" if time passed is > 10 days
                if (daysSinceLast > 10) {
                    breakdown.baseCoins = 5; // Token amount for keeping data alive
                } else {
                    return {
                        success: true,
                        totalEcoCoins: 0,
                        carbonCalculated: 0,
                        breakdown,
                        message: `No significant growth detected (${growthEstimate}%) since last pending update.`,
                        details: { growthEstimate }
                    };
                }
            }
        }

        // ==========================================
        // 3. CARBON CALCULATION (FORMULA)
        // ==========================================
        // Formula: Annual CO2 = Biomass_gain * carbon_fraction * 44/12
        // We approximate Biomass Gain based on Growth Estimate % of the "Annual Potential".
        // If the tree grows 10% of its annual expected size in this month, it sequesters 10% of annual carbon.

        // Capped at 100% growth per period (unlikely but safe)
        const growthFactor = Math.min(growthEstimate, 100) / 100;

        // Time factor: Did this growth happen over 1 month or 1 year?
        // We normalize to monthly chunks roughly.
        // Carbon sequestered THIS PERIOD = Annual_Rate * (DaysPassed / 365) * HealthQuality
        // But the user formula relies on Biomass Gain. We treat growthEstimate as proxy for Biomass Gain.

        let carbonSequestered = 0;
        if (validGrowth) {
            // Simplified implementation of the User's Formula
            // Biomass Gain Proxy = Annual Potential * Growth % 
            const biomassGainProxy = maxAnnualCarbon * growthFactor;

            // Standard Constant multipliers from formula suggestion
            // Carbon Fraction ~ 0.5 usually, but maxAnnualCarbon typically already accounts for this in simplified models.
            // Let's stick to the user's explicit request structure if possible, usually:
            // Delta_CO2 = (Biomass_Gain_kg * 0.5 * 3.67) 
            // We will assume maxAnnualCarbon IS the CO2 Potential.

            // So: CO2 = maxAnnualCarbon * (TimeFraction OR GrowthFraction)
            // Using GrowthFraction as it proves actual sequestration occurred.
            carbonSequestered = biomassGainProxy;

            // Quality Scalar (Q) derived from Authenticity & Confidence
            const qualityQ = (authenticityScore + plantConfidence) / 200; // 0.0 to 1.0

            // Apply K constant (EcoCoin multiplier per kg CO2) ~ e.g. 10 coins per kg
            const K = 10;

            const calculatedCoinsFromCarbon = Math.floor(K * carbonSequestered * qualityQ);
            breakdown.carbonBonus = calculatedCoinsFromCarbon;
        }

        // ==========================================
        // 4. BONUSES & PENALTIES
        // ==========================================

        if (validGrowth) {
            // Authenticity
            if (authenticityScore >= 80) breakdown.authenticityBonus = 5;

            // Fraud Penalty
            if (fraudScore > 20) {
                breakdown.fraudPenalty = -Math.floor(fraudScore * 0.5);
            }
        }

        // Total
        const totalCoins = Math.max(0,
            breakdown.baseCoins +
            breakdown.growthBonus +
            breakdown.carbonBonus +
            breakdown.authenticityBonus +
            breakdown.plantConfidenceBonus +
            breakdown.consecutiveBonus +
            breakdown.firstUploadBonus +
            breakdown.fraudPenalty
        );

        return {
            success: true,
            totalEcoCoins: totalCoins,
            carbonCalculated: parseFloat(carbonSequestered.toFixed(2)),
            breakdown,
            message: generateCreditMessage(totalCoins, breakdown),
            details: {
                saplingName: sapling?.plant_name || 'Unknown',
                carbonRate: maxAnnualCarbon,
                uploadCount: previousUploads.length + 1,
                growthEstimate
            }
        };

    } catch (error) {
        console.error('Credit calculation error:', error.message);
        return {
            success: false,
            error: error.message,
            totalEcoCoins: 0,
            carbonCalculated: 0,
            breakdown: {},
            message: 'Calculation failed.'
        };
    }
};

/**
 * Calculate carbon impact based on time since registration
 * @param {number} carbonRate - kg CO2 per year
 * @param {number} uploadCount - number of previous uploads
 * @returns {number} - Carbon impact in kg
 */
const calculateCarbonImpact = (carbonRate, uploadCount) => {
    // Assume monthly uploads, so each upload represents ~1 month of growth
    // Carbon rate is per year, so divide by 12 for monthly rate
    const monthlyCarbon = carbonRate / 12;

    // Growth factor (young plants absorb more CO2 as they grow)
    const growthFactor = Math.min(1 + (uploadCount * 0.1), 2); // Max 2x multiplier

    return Math.round(monthlyCarbon * growthFactor * 100) / 100;
};

/**
 * Generate a user-friendly message about credits
 */
const generateCreditMessage = (totalCoins, breakdown) => {
    let message = `You earned ${totalCoins} EcoCoins! `;

    const bonuses = [];

    if (breakdown.firstUploadBonus > 0) {
        bonuses.push(`+${breakdown.firstUploadBonus} first upload bonus`);
    }
    if (breakdown.growthBonus > 0) {
        bonuses.push(`+${breakdown.growthBonus} growth bonus`);
    }
    if (breakdown.authenticityBonus > 0) {
        bonuses.push(`+${breakdown.authenticityBonus} authenticity bonus`);
    }
    if (breakdown.consecutiveBonus > 0) {
        bonuses.push(`+${breakdown.consecutiveBonus} consistency bonus`);
    }
    if (breakdown.fraudPenalty < 0) {
        bonuses.push(`${breakdown.fraudPenalty} quality penalty`);
    }

    if (bonuses.length > 0) {
        message += `(${bonuses.join(', ')})`;
    }

    return message;
};

/**
 * Calculate time-based multiplier for returning users
 */
export const getTimeMultiplier = async (userId, saplingId) => {
    const uploads = await Upload.find({
        user_id: userId,
        sapling_id: saplingId,
        verified: true
    }).sort({ upload_date: 1 });

    if (uploads.length === 0) {
        return { multiplier: 1, reason: 'First upload' };
    }

    // Check consistency
    const firstUpload = uploads[0].upload_date;
    const daysSinceFirst = (Date.now() - new Date(firstUpload).getTime()) / (1000 * 60 * 60 * 24);
    const expectedUploads = Math.floor(daysSinceFirst / 30); // Expected monthly uploads
    const actualUploads = uploads.length;

    const consistency = expectedUploads > 0 ? actualUploads / expectedUploads : 1;

    let multiplier = 1;
    let reason = '';

    if (consistency >= 0.9) {
        multiplier = 1.5;
        reason = 'Excellent consistency! 50% bonus';
    } else if (consistency >= 0.7) {
        multiplier = 1.25;
        reason = 'Good consistency! 25% bonus';
    } else if (consistency >= 0.5) {
        multiplier = 1.1;
        reason = 'Fair consistency! 10% bonus';
    } else {
        multiplier = 1;
        reason = 'Standard rate';
    }

    return { multiplier, reason, consistency: Math.round(consistency * 100) };
};

/**
 * Calculate annual rewards summary
 */
export const calculateAnnualSummary = async (userId) => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const uploads = await Upload.find({
        user_id: userId,
        verified: true,
        upload_date: { $gte: oneYearAgo }
    });

    const totalCoins = uploads.reduce((sum, u) => sum + (u.eco_coins_awarded || 0), 0);
    const totalCarbon = uploads.reduce((sum, u) => sum + (u.carbon_calculated || 0), 0);
    const saplingIds = [...new Set(uploads.map(u => u.sapling_id))];

    return {
        totalUploads: uploads.length,
        totalEcoCoins: totalCoins,
        totalCarbonOffset: Math.round(totalCarbon * 100) / 100,
        uniqueSaplings: saplingIds.length,
        averageCoinsPerUpload: uploads.length > 0 ? Math.round(totalCoins / uploads.length) : 0,
        period: 'Last 12 months'
    };
};

export default {
    calculateUploadCredits,
    getTimeMultiplier,
    calculateAnnualSummary
};
