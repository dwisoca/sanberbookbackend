// Firebase
const admin = require("firebase-admin");
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const dbFirestore = getFirestore();
const auth = admin.auth()

// Express
const express = require('express')
const app = express()
const cors = require('cors')
const port = 5000
app.use(cors())
app.use(express.urlencoded({ extended: true }))

// Express Middleware
const isAuthenticated = async (req, res, next) => {
    try {
        const { token } = req.body;
        const decodedToken = await auth.verifyIdToken(token)
        next();
    } catch (error) {
        console.log(error)
        return res.status(401).json({ error: 'Unauthorized' });
    }
  };

// GET /categories
app.get('/categories', async (req, res) => {
  const collectionRef = dbFirestore.collection('category')
  const snapshot = await collectionRef.get();
  let result = []
  snapshot.forEach(doc => {
    result.push(doc.data())
  });
  // console.log(result)
  res.send(result)
});

// GET /categories/:id/books
app.get('/categories/:id/books', async (req, res) => {
  // ...
});

// POST /categories
app.post('/categories', isAuthenticated, async (req, res) => {
  const { categoryName } = req.body;
  await addCategory(categoryName)
  res.send('Sukses menambah kategori: ' + categoryName)
});

// PATCH /categories/:id
app.patch('/categories/:id', isAuthenticated, async (req, res) => {
  const { categoryName } = req.body;
  const categoryID = req.params.id;

  await updateCategory(categoryID, categoryName)
  res.send('Sukses update kategori ID: ' + categoryID)
});

// DELETE /categories/:id
app.delete('/categories/:id', isAuthenticated, async (req, res) => {
  const categoryID = req.params.id;

  await deleteCategory(categoryID)
  res.send('Sukses delete kategori ID: ' + categoryID)
});



app.listen(port, () => {
    console.log(`Server runnig on port ${port}`)
})

async function addCategory(categoryName){
  console.log(categoryName)
  // Count collection for ID's
  const collectionRef = dbFirestore.collection('category');
  const snapshot = await collectionRef.count().get();
  const categoryID = (snapshot.data().count + 1).toString()
  // console.log(categoryID);

  // Write to db
  const targetRef = dbFirestore.collection('category').doc(categoryID);
  const res = await targetRef.set({
    id: categoryID,
    name: categoryName,
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
  });
  
}

async function updateCategory(categoryID, categoryName){
  console.log('Update category ID:', categoryID)

  // Write to db
  const targetRef = dbFirestore.collection('category').doc(categoryID.toString());
  const res = await targetRef.update({
    name: categoryName,
    updated_at: FieldValue.serverTimestamp(),
  });
  
}

async function deleteCategory(categoryID){
  console.log('Delete category ID:', categoryID)

  const res = await dbFirestore.collection('category').doc(categoryID.toString()).delete();
  
}