---
description: How to configure and use the IPFS photo verification system for saplings
---

# IPFS Photo Verification System Setup

This workflow explains how to set up and use the IPFS-based photo verification system for sapling tracking.

## Prerequisites
- Node.js installed
- MongoDB running
- Server and client running

## 1. Configure IPFS (Optional but Recommended)

// turbo
1. Open the server `.env` file:
```
server/.env
```

2. Add your Pinata credentials:
   - Go to https://app.pinata.cloud and create a free account
   - Create an API Key with "pinFileToIPFS" permission
   - Copy the credentials:
```env
PINATA_API_KEY=your_api_key
PINATA_SECRET_KEY=your_secret_key
PINATA_JWT=your_jwt_token
```

**Note:** IPFS is optional. Without it, photos are stored locally.

## 2. How Photo Upload Works

When a user uploads a photo, the system performs these checks:

### Step 1: Photo Authenticity Check
- Analyzes EXIF metadata (camera info, GPS, timestamp)
- Checks file size and format
- Detects if photo is original or downloaded
- **Score:** 0-100% (60%+ = authentic)

### Step 2: Plant Recognition
- Analyzes green content in the image
- Checks for natural plant colors
- Validates file properties
- **Score:** 0-100% (50%+ = valid plant)

### Step 3: Fraud Detection
- Compares with previous uploads for the same sapling
- Detects exact matches (duplicate photos)
- Calculates similarity scores
- **Score:** 0-100% (0% = no fraud)

### Step 4: IPFS Upload (if configured)
- Uploads to decentralized storage
- Stores IPFS hash in database
- Falls back to local storage if IPFS unavailable

### Step 5: Credit Calculation
Formula:
```
Total = Base (10) + Growth Bonus + Carbon Bonus + Authenticity Bonus + Consistency Bonus - Fraud Penalty
```

## 3. Initial Photo Upload (At Handover)

When a sapling is given to a user:

// turbo
1. Navigate to: `POST /api/user/upload/initial`
2. Send form data with:
   - `userId`: User's ID
   - `sapling_id`: Sapling ID
   - `image`: Photo file
   - `location`: GPS coordinates (optional)

Example response:
```json
{
  "message": "Initial sapling photo captured successfully! +20 EcoCoins awarded.",
  "upload": {
    "_id": "...",
    "image_url": "https://gateway.pinata.cloud/ipfs/...",
    "ipfs_hash": "Qm..."
  },
  "credits": {
    "ecoCoins": 20,
    "message": "Welcome bonus for registering your sapling!"
  }
}
```

## 4. Monthly Growth Update Upload

After one month, user uploads growth photos:

// turbo
1. Navigate to: `POST /api/user/upload`
2. Send form data with photo
3. System will:
   - Compare with initial photo
   - Verify authenticity
   - Calculate growth
   - Award credits

## 5. Photo Rejection Scenarios

Photos are rejected if:

1. **Not Original** (authenticity < 30%)
   - Downloaded from internet
   - Screenshot
   - Previously edited

2. **Not a Plant** (confidence < 30%)
   - No green content detected
   - Not identifiable as plant

3. **Fraud Detected**
   - Exact match with previous upload
   - Similarity > 90% with recent photos

## 6. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/user/upload` | POST | Upload growth update |
| `/api/user/upload/initial` | POST | Upload initial photo |
| `/api/user/uploads/:uploadId/verification` | GET | Get verification details |
| `/api/user/:userId/uploads` | GET | Get upload history |

## 7. Credit Breakdown

| Type | Amount | Condition |
|------|--------|-----------|
| Base | 10 | Every valid upload |
| First Upload | 20 | First photo for sapling |
| Authenticity | 10 | Score >= 70% |
| Growth | 0-25 | Based on growth % |
| Consistency | 5-60 | Monthly uploads |
| Carbon | 1-5 | Based on plant type |
| Fraud Penalty | -50 to 0 | Based on fraud score |

## 8. Troubleshooting

**Photo rejection issues:**
- Ensure camera flash is off
- Take photo in good natural lighting
- Focus on the plant clearly
- Use original camera app (not edited)

**IPFS not working:**
- Check Pinata credentials
- Verify JWT token is valid
- System will use local storage as fallback

**Low confidence scores:**
- Ensure plant is clearly visible
- Use JPEG format from camera
- Avoid screenshots or downloads
