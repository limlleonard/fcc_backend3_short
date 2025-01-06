require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
var bodyParser = require("body-parser");
const dns = require('dns');
const url = require('url');

// Basic Configuration
const port = process.env.PORT || 3000;
app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// In-memory database to store URLs
const urlDatabase = {};
let counter = 1;

// Helper function to validate URLs using dns.lookup
function isValidUrl(inputUrl, callback) {
    try {
        const parsedUrl = new url.URL(inputUrl);
        dns.lookup(parsedUrl.hostname, (err) => {
            callback(!err);
        });
    } catch (e) {
        console.log(e);
        callback(false);
    }
}

// POST endpoint to shorten URLs
app.post('/api/shorturl', (req, res) => {
    const originalUrl = req.body.url;
    // Validate the URL using dns.lookup
    isValidUrl(originalUrl, (isValid) => {
        if (!isValid) {
            return res.json({ error: 'invalid url' });
        }
        // Check if the URL already exists in the database
        let shortUrl = Object.keys(urlDatabase).find(
            key => urlDatabase[key] === originalUrl
        );
        if (!shortUrl) {
            shortUrl = counter++;
            urlDatabase[shortUrl] = originalUrl;
        }
        res.json({
            original_url: originalUrl,
            short_url: shortUrl
        });
    });
});

// GET endpoint to redirect to the original URL
app.get('/api/shorturl/:short_url', (req, res) => {
    const shortUrl = req.params.short_url;
    const originalUrl = urlDatabase[shortUrl];
    if (!originalUrl) {
        return res.json({ error: 'No short URL found for the given input' });
    }
    res.redirect(originalUrl);
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
