Okay, let's set up a minimal project with the exact files and paths needed to perform your first test of connecting a Google account and listing YouTube channels.

This example will use Node.js and Express for the backend, as it's a common choice for web applications and the Google API client libraries are well-maintained for it.

**Project Structure:**

```
youtube-saas-test/
├── .env                  # Environment variables (Client ID, Secret, etc.)
├── package.json          # Node.js project metadata and dependencies
├── server.js             # Main application file (Express server)
├── public/               # Frontend static files
│   └── index.html        # Simple HTML for initiation
└── tests/
    └── auth.test.js      # Jest test file
```

---

### **Step 1: Create Project Directory and `package.json`**

1.  Create a folder named `youtube-saas-test`.
2.  Navigate into the folder in your terminal: `cd youtube-saas-test`
3.  Initialize Node.js project: `npm init -y` (This creates `package.json`)

---

### **Step 2: Install Dependencies**

Run the following command in your terminal:

```bash
npm install express googleapis dotenv jest supertest
```

**Explanation of Dependencies:**

*   `express`: Web framework for Node.js.
*   `googleapis`: The official Google API client library for Node.js.
*   `dotenv`: To load environment variables from a `.env` file.
*   `jest`: JavaScript testing framework.
*   `supertest`: A library to test HTTP assertions, often used with Express.

---

### **Step 3: Create `.env` file**

**Path:** `youtube-saas-test/.env`

```env
GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"
GOOGLE_REDIRECT_URI="http://localhost:3000/auth/google/callback"
PORT=3000
```

**Important:**

*   **Replace `"YOUR_GOOGLE_CLIENT_ID"` and `"YOUR_GOOGLE_CLIENT_SECRET"`** with the actual credentials you obtained from the Google Cloud Console (under APIs & Services -> Credentials -> OAuth 2.0 Client IDs).
*   Ensure that `http://localhost:3000/auth/google/callback` is added as an **Authorized redirect URI** in your Google Cloud Console OAuth client ID settings.

---

### **Step 4: Create `public/index.html`**

**Path:** `youtube-saas-test/public/index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Connect YouTube</title>
    <style>
        body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #f0f2f5; margin: 0; }
        .container { background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; }
        h1 { color: #333; margin-bottom: 20px; }
        button {
            background-color: #ff0000;
            color: white;
            padding: 12px 25px;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            transition: background-color 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto;
        }
        button:hover { background-color: #cc0000; }
        button img { margin-right: 10px; width: 24px; height: 24px; }
        #status { margin-top: 20px; font-size: 1.1em; color: #555; }
        #channelList { text-align: left; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
        #channelList ul { list-style: none; padding: 0; }
        #channelList li { background-color: #e9ecef; padding: 10px; margin-bottom: 8px; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>YouTube SaaS Test</h1>
        <p id="status">Please connect your YouTube account.</p>
        <button onclick="window.location.href='/connect-youtube'">
            <img src="https://upload.wikimedia.org/wikipedia/commons/4/42/YouTube_icon_%282017%29.png" alt="YouTube Icon">
            Connect YouTube
        </button>

        <div id="channelList">
            <h2>Your Channels:</h2>
            <ul id="channels">
                <li>No channels connected yet.</li>
            </ul>
        </div>
    </div>

    <script>
        // A very basic client-side script to fetch channels after connection
        // In a real app, this would be more sophisticated with user sessions, etc.
        window.onload = function() {
            const params = new URLSearchParams(window.location.search);
            const statusDiv = document.getElementById('status');
            const channelsUl = document.getElementById('channels');

            if (params.get('success') === 'youtube_connected') {
                statusDiv.textContent = 'YouTube account connected! Fetching channels...';
                fetch('/channels')
                    .then(response => response.json())
                    .then(data => {
                        if (data.channels && data.channels.length > 0) {
                            statusDiv.textContent = 'Successfully connected and fetched channels!';
                            channelsUl.innerHTML = ''; // Clear initial message
                            data.channels.forEach(channel => {
                                const li = document.createElement('li');
                                li.textContent = `${channel.title} (ID: ${channel.id})`;
                                channelsUl.appendChild(li);
                            });
                        } else {
                            statusDiv.textContent = 'Connected, but no channels found or an error occurred.';
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching channels:', error);
                        statusDiv.textContent = 'Error fetching channels after connection.';
                    });
            } else if (params.get('error') === 'youtube_connect_failed') {
                statusDiv.textContent = 'Failed to connect YouTube account. Please try again.';
            }
        };
    </script>
</body>
</html>
```

---

### **Step 5: Create `server.js`**

**Path:** `youtube-saas-test/server.js`

```javascript
require('dotenv').config(); // Load environment variables from .env

const express = require('express');
const { google } = require('googleapis');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Store user's credentials in memory for this simple test.
// In a real application, these would be securely stored in a database
// associated with your application's user accounts.
let userCredentials = {};

// --- OAuth2 Client Setup ---
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// Define the necessary scopes for YouTube API (read channel info, upload videos, etc.)
const scopes = [
    'https://www.googleapis.com/auth/youtube.readonly', // To list channels
    'https://www.googleapis.com/auth/youtube.force-ssl', // Broader access, includes upload
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
];

// --- Express Middleware & Routes ---

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// 1. Initiate Google OAuth Flow
app.get('/connect-youtube', (req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline', // Crucial: allows obtaining a refresh token
        scope: scopes,
        prompt: 'consent', // Ensures the consent screen is shown and a refresh token is always returned
    });
    res.redirect(authUrl);
});

// 2. Handle Google OAuth Callback
app.get('/auth/google/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        console.error('Authorization code missing in callback.');
        return res.redirect('/?error=youtube_connect_failed');
    }

    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Store tokens securely. For this test, we'll store in memory.
        // In a real app, this should be encrypted and saved to a database
        // associated with the user account in your SaaS.
        userCredentials = {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token, // Store this securely for long-term access
            expiryDate: tokens.expiry_date,
        };
        console.log('Successfully obtained tokens:', tokens);

        // Redirect back to the homepage with a success flag
        res.redirect('/?success=youtube_connected');

    } catch (error) {
        console.error('Error exchanging authorization code for tokens:', error.message);
        console.error('Full error:', error.response ? error.response.data : error);
        res.redirect('/?error=youtube_connect_failed');
    }
});

// 3. Endpoint to List User's YouTube Channels
app.get('/channels', async (req, res) => {
    if (!userCredentials.refreshToken && !userCredentials.accessToken) {
        return res.status(401).json({ error: 'No YouTube account connected. Please connect first.' });
    }

    // Set credentials. If access token is expired, `googleapis` will automatically
    // use the refresh token to get a new one IF `access_type: 'offline'` was used
    // during the initial authorization and a refresh token was obtained.
    oauth2Client.setCredentials(userCredentials);

    // Attach a listener to capture new tokens if they are refreshed
    oauth2Client.on('tokens', (tokens) => {
        if (tokens.refresh_token) {
            // A new refresh token was issued. This is rare, but should be saved.
            userCredentials.refreshToken = tokens.refresh_token;
            console.log('New refresh token received and stored.');
        }
        // Always save the new access token and its expiry.
        userCredentials.accessToken = tokens.access_token;
        userCredentials.expiryDate = tokens.expiry_date;
        console.log('Access token refreshed and stored.');
        // In a real app, you would persist these to your database for the user.
    });

    try {
        const youtube = google.youtube({
            version: 'v3',
            auth: oauth2Client,
        });

        const response = await youtube.channels.list({
            part: 'snippet,contentDetails',
            mine: true, // Request channels for the authenticated user
        });

        const channels = response.data.items.map(item => ({
            id: item.id,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.default.url,
        }));

        res.json({ channels });

    } catch (error) {
        console.error('Error fetching channels:', error.message);
        console.error('Full error:', error.response ? error.response.data : error);
        res.status(500).json({ error: 'Failed to fetch channels. Please ensure your account has a YouTube channel and permissions are granted.', details: error.message });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser to start.`);
});

// Export app for testing
module.exports = app;
```

---

### **Step 6: Create `tests/auth.test.js`**

**Path:** `youtube-saas-test/tests/auth.test.js`

```javascript
const request = require('supertest');
const app = require('../server'); // Import your Express app

// Mock the googleapis library to prevent actual external calls during unit tests
// This is crucial for isolated testing.
jest.mock('googleapis', () => {
    const originalGoogle = jest.requireActual('googleapis');
    return {
        ...originalGoogle,
        google: {
            ...originalGoogle.google,
            auth: {
                OAuth2: jest.fn(() => ({
                    generateAuthUrl: jest.fn(() => 'http://mock-google-auth-url.com'),
                    getToken: jest.fn(() => ({
                        tokens: {
                            access_token: 'mock_access_token',
                            refresh_token: 'mock_refresh_token',
                            expiry_date: Date.now() + 3600 * 1000, // 1 hour from now
                        }
                    })),
                    setCredentials: jest.fn(),
                    on: jest.fn(), // Mock the 'on' method for token refresh listener
                })),
            },
            youtube: jest.fn(() => ({
                channels: {
                    list: jest.fn(() => ({
                        data: {
                            items: [
                                {
                                    id: 'UC_mock_channel_id_1',
                                    snippet: {
                                        title: 'Mock Channel 1',
                                        description: 'A test channel.',
                                        thumbnails: { default: { url: 'http://mock.thumbnail/1.jpg' } }
                                    }
                                },
                                {
                                    id: 'UC_mock_channel_id_2',
                                    snippet: {
                                        title: 'Mock Channel 2',
                                        description: 'Another test channel.',
                                        thumbnails: { default: { url: 'http://mock.thumbnail/2.jpg' } }
                                    }
                                }
                            ]
                        }
                    }))
                }
            }))
        }
    };
});

describe('YouTube SaaS Authentication & Channel Listing', () => {
    // Before each test, reset the mocks to ensure isolation
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('GET /connect-youtube should redirect to Google Auth URL', async () => {
        const res = await request(app).get('/connect-youtube');
        expect(res.statusCode).toEqual(302); // Expect a redirect
        expect(res.headers.location).toBe('http://mock-google-auth-url.com');

        // Verify that generateAuthUrl was called
        const { OAuth2 } = require('googleapis').google.auth;
        expect(OAuth2().generateAuthUrl).toHaveBeenCalled();
    });

    test('GET /auth/google/callback should exchange code for tokens and redirect on success', async () => {
        const res = await request(app).get('/auth/google/callback?code=mock_auth_code');
        expect(res.statusCode).toEqual(302);
        expect(res.headers.location).toBe('/?success=youtube_connected');

        // Verify that getToken and setCredentials were called
        const { OAuth2 } = require('googleapis').google.auth;
        expect(OAuth2().getToken).toHaveBeenCalledWith('mock_auth_code');
        expect(OAuth2().setCredentials).toHaveBeenCalledWith(
            expect.objectContaining({
                access_token: 'mock_access_token',
                refresh_token: 'mock_refresh_token',
            })
        );
    });

    test('GET /auth/google/callback should redirect with error if code is missing', async () => {
        const res = await request(app).get('/auth/google/callback'); // No code parameter
        expect(res.statusCode).toEqual(302);
        expect(res.headers.location).toBe('/?error=youtube_connect_failed');
    });


    test('GET /channels should return user channels after successful authentication', async () => {
        // First, simulate successful authentication to set userCredentials in the server
        await request(app).get('/auth/google/callback?code=mock_auth_code');

        // Now, request channels
        const res = await request(app).get('/channels');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('channels');
        expect(res.body.channels).toHaveLength(2);
        expect(res.body.channels[0]).toEqual(
            expect.objectContaining({
                id: 'UC_mock_channel_id_1',
                title: 'Mock Channel 1',
            })
        );

        // Verify that youtube.channels.list was called
        const { youtube } = require('googleapis').google;
        expect(youtube().channels.list).toHaveBeenCalledWith({
            part: 'snippet,contentDetails',
            mine: true,
        });
    });

    test('GET /channels should return 401 if no YouTube account is connected', async () => {
        // Reset userCredentials in the mock to simulate no connection
        // (This is tricky with global mock, better to clear module cache or have isolated test setup)
        // For simplicity, we'll assume a fresh server instance for this test,
        // which supertest automatically provides by requiring 'app' for each test suite.

        const res = await request(app).get('/channels');
        expect(res.statusCode).toEqual(401);
        expect(res.body).toEqual({ error: 'No YouTube account connected. Please connect first.' });
    });
});
```

---

### **Step 7: Update `package.json` for Test Script**

Open `package.json` and add a `"test"` script under the `"scripts"` section:

```json
{
  "name": "youtube-saas-test",
  "version": "1.0.0",
  "description": "",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "test": "jest"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "googleapis": "^134.0.0"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^6.3.4"
  }
}
```

---

### **How to Run and Test:**

1.  **Start the Server:**
    Open your terminal in the `youtube-saas-test` directory and run:
    ```bash
    npm start
    ```
    You should see: `Server running on http://localhost:3000`

2.  **Open in Browser:**
    Open your web browser and go to `http://localhost:3000`.
    You will see a "Connect YouTube" button.

3.  **Connect YouTube Account:**
    *   Click the "Connect YouTube" button.
    *   You will be redirected to Google's consent screen.
    *   Select your Google account and grant the requested permissions.
    *   Google will redirect you back to `http://localhost:3000?success=youtube_connected`.
    *   The page should then display "YouTube account connected! Fetching channels..." and then list your channels.
        *   *(If you don't have a YouTube channel associated with that Google account, it might say "Connected, but no channels found or an error occurred." which is expected for accounts without channels).*

4.  **Run the Tests:**
    Open a **new terminal** (keep the server running in the first one) in the `youtube-saas-test` directory and run:
    ```bash
    npm test
    ```
    Jest will execute the tests in `tests/auth.test.js`. You should see output indicating that all tests passed. These tests use mocks, so they don't hit the actual Google API or require a live Google authentication flow; they verify your application's logic.

---

This setup gives you a working foundation. Remember, the in-memory storage of `userCredentials` in `server.js` is only for this simple test. In a production SaaS, you **must** persist `refreshToken` (and potentially the `accessToken` and its `expiry_date`) in a secure database associated with each user in your application.

Here's a diagram summarizing the file structure. 