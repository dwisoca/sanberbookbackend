// Firebase
var admin = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const dbFirestore = admin.firestore();
const auth = admin.auth()

// Express
const express = require('express')
const app = express()
const port = 5000
app.use(express.urlencoded({ extended: true }))

// Express Middleware
const isAuthenticated = async (req, res, next) => {
    try {
        const { token } = req.body;
        const decodedToken = await auth.verifyIdToken(token)
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
  };

// GET /categories
app.get('/categories', async (req, res) => {
  res.send('GET REQ Succeed')
});

// GET /categories/:id/books
app.get('/categories/:id/books', async (req, res) => {
  // ...
});

// POST /categories
app.post('/categories', isAuthenticated, async (req, res) => {
    res.send('POST REQ Succeed')
});

// PATCH /categories/:id
app.patch('/categories/:id', isAuthenticated, async (req, res) => {
  // ...
});

// DELETE /categories/:id
app.delete('/categories/:id', isAuthenticated, async (req, res) => {
  // ...
});



app.listen(port, () => {
    console.log(`Server runnig on port ${port}`)
})