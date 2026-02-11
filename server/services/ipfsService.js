/**
 * IPFS Service for Greenmark
 * Handles photo uploads to IPFS and retrieval
 * Uses Pinata for IPFS pinning
 */

import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import path from 'path';

// Pinata API configuration (Free tier: 500MB storage, 100MB upload max)
const PINATA_API_KEY = process.env.PINATA_API_KEY || '';
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY || '';
const PINATA_JWT = process.env.PINATA_JWT || '';

const PINATA_BASE_URL = 'https://api.pinata.cloud';
const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

/**
 * Upload a file to IPFS via Pinata
 * @param {string} filePath - Path to the file to upload
 * @param {Object} metadata - Additional metadata for the file
 * @returns {Object} - IPFS hash and gateway URL
 */
export const uploadToIPFS = async (filePath, metadata = {}) => {
    try {
        // Check if JWT is available (preferred method)
        if (!PINATA_JWT && (!PINATA_API_KEY || !PINATA_SECRET_KEY)) {
            console.warn('⚠️ IPFS: No Pinata credentials found. Using local storage fallback.');
            return {
                success: false,
                fallback: true,
                localPath: filePath,
                message: 'IPFS credentials not configured. Using local storage.'
            };
        }

        const formData = new FormData();

        // Read file and append to form
        const fileStream = fs.createReadStream(filePath);
        const fileName = path.basename(filePath);
        formData.append('file', fileStream, fileName);

        // Add metadata for better organization
        const pinataMetadata = JSON.stringify({
            name: metadata.name || fileName,
            keyvalues: {
                user_id: metadata.user_id || 'unknown',
                sapling_id: metadata.sapling_id || 'unknown',
                upload_type: metadata.upload_type || 'growth_update',
                timestamp: new Date().toISOString()
            }
        });
        formData.append('pinataMetadata', pinataMetadata);

        // Pin options
        const pinataOptions = JSON.stringify({
            cidVersion: 1
        });
        formData.append('pinataOptions', pinataOptions);

        // Make request to Pinata
        const headers = {
            ...formData.getHeaders()
        };

        // Use JWT if available, otherwise use API keys
        if (PINATA_JWT) {
            headers['Authorization'] = `Bearer ${PINATA_JWT}`;
        } else {
            headers['pinata_api_key'] = PINATA_API_KEY;
            headers['pinata_secret_api_key'] = PINATA_SECRET_KEY;
        }

        const response = await axios.post(
            `${PINATA_BASE_URL}/pinning/pinFileToIPFS`,
            formData,
            {
                headers,
                maxBodyLength: Infinity,
                timeout: 30000 // 30 second timeout
            }
        );

        const ipfsHash = response.data.IpfsHash;

        console.log(`✅ IPFS Upload Success: ${ipfsHash}`);

        return {
            success: true,
            ipfsHash: ipfsHash,
            gatewayUrl: `${IPFS_GATEWAY}${ipfsHash}`,
            pinataUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
            size: response.data.PinSize,
            timestamp: response.data.Timestamp
        };

    } catch (error) {
        console.error('❌ IPFS Upload Error:', error.response?.data || error.message);
        return {
            success: false,
            fallback: true,
            localPath: filePath,
            error: error.message
        };
    }
};

/**
 * Retrieve file metadata from IPFS via Pinata
 * @param {string} ipfsHash - The IPFS CID/hash
 * @returns {Object} - File metadata
 */
export const getIPFSMetadata = async (ipfsHash) => {
    try {
        if (!PINATA_JWT && (!PINATA_API_KEY || !PINATA_SECRET_KEY)) {
            return { success: false, message: 'IPFS not configured' };
        }

        const headers = {};
        if (PINATA_JWT) {
            headers['Authorization'] = `Bearer ${PINATA_JWT}`;
        } else {
            headers['pinata_api_key'] = PINATA_API_KEY;
            headers['pinata_secret_api_key'] = PINATA_SECRET_KEY;
        }

        const response = await axios.get(
            `${PINATA_BASE_URL}/data/pinList?hashContains=${ipfsHash}`,
            { headers }
        );

        if (response.data.rows && response.data.rows.length > 0) {
            const pin = response.data.rows[0];
            return {
                success: true,
                metadata: pin.metadata,
                date_pinned: pin.date_pinned,
                size: pin.size
            };
        }

        return { success: false, message: 'Hash not found' };
    } catch (error) {
        console.error('❌ IPFS Metadata Error:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Unpin a file from IPFS (for cleanup)
 * @param {string} ipfsHash - The IPFS CID to unpin
 */
export const unpinFromIPFS = async (ipfsHash) => {
    try {
        if (!PINATA_JWT && !PINATA_API_KEY) {
            return { success: false, message: 'IPFS not configured' };
        }

        const headers = {};
        if (PINATA_JWT) {
            headers['Authorization'] = `Bearer ${PINATA_JWT}`;
        } else {
            headers['pinata_api_key'] = PINATA_API_KEY;
            headers['pinata_secret_api_key'] = PINATA_SECRET_KEY;
        }

        await axios.delete(
            `${PINATA_BASE_URL}/pinning/unpin/${ipfsHash}`,
            { headers }
        );

        console.log(`✅ IPFS Unpin Success: ${ipfsHash}`);
        return { success: true };
    } catch (error) {
        console.error('❌ IPFS Unpin Error:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Check if IPFS is configured
 */
export const isIPFSConfigured = () => {
    return !!(PINATA_JWT || (PINATA_API_KEY && PINATA_SECRET_KEY));
};

export default {
    uploadToIPFS,
    getIPFSMetadata,
    unpinFromIPFS,
    isIPFSConfigured,
    IPFS_GATEWAY
};
