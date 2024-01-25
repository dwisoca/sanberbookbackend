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

// UUID
const UUID = require('uuid-int');
const idGenerator = UUID(1);

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
  let resultCategory = []
  snapshot.forEach(doc => {
    resultCategory.push(doc.data())
  });
  // console.log(result)
  res.send(resultCategory)
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

// GET /categories/:id/books
app.get('/categories/:id/books', async (req, res) => {
  try {
    const categoryId = req.params.id;
    console.log(categoryId)
    // Check if the category exists
    const categoryDoc = await dbFirestore.collection('category').doc(categoryId).get();
    if (!categoryDoc.exists) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Fetch books associated with the category
    const booksSnapshot = await dbFirestore.collection('book').where('category_id', '==', parseInt(categoryId)).get();
    let resultBook = [];

    booksSnapshot.forEach((bookDoc) => {
      console.log(bookDoc.data())
      resultBook.push(bookDoc.data());
    });

    res.send(resultBook);
  } catch (error) {
    console.error('Error fetching books by category', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /books
app.get('/books', async (req, res) => {
  const { title, minYear, maxYear, minPage, maxPage, sortByTitle } = req.query;
  console.log(req.query)
  let bookRef = dbFirestore.collection('book')

  if (minYear){
    bookRef = dbFirestore.collection('book').where('release_year', '>=', parseInt(minYear));
  }
  if (maxYear){
    bookRef = dbFirestore.collection('book').where('release_year', '<=', parseInt(maxYear));
  }
  if (minYear && maxYear){
    bookRef = dbFirestore.collection('book')
    .where('release_year', '>=', parseInt(minYear))
    .where('release_year', '<=', parseInt(maxYear))
  }
  if (minPage){
    bookRef = dbFirestore.collection('book').where('total_page', '>=', parseInt(minPage));
  }
  if (maxPage){
    bookRef = dbFirestore.collection('book').where('total_page', '<=', parseInt(maxPage));
  }
  if (minPage && maxPage){
    bookRef = dbFirestore.collection('book')
    .where('total_page', '>=', parseInt(minPage))
    .where('total_page', '<=', parseInt(maxPage))
  }

  const snapshot = await bookRef.get();
  let resultBook = []
  snapshot.forEach(doc => {
    const item = doc.data()
    if (title){
      if(item.title.toLowerCase().includes(title)){
        resultBook.push(item)
      }
    } else{
      resultBook.push(item)
    }
  });

  if (sortByTitle) {
    const sortOrder = sortByTitle.toLowerCase() === 'desc' ? 'desc' : 'asc';
    resultBook.sort((a, b) => (a.title > b.title ? 1 : -1) * (sortOrder === 'desc' ? -1 : 1));
  }
  // console.log(result)
  res.send(resultBook)
});

// POST /books
app.post('/books', isAuthenticated, async (req, res) => {
  const { bookData } = req.body;
  const data = JSON.parse(bookData)
  await addBook(data)
  res.send('Sukses menambah buku: ' + data.title)
});

// PATCH /categories/:id
app.patch('/books/:id', isAuthenticated, async (req, res) => {
  const { bookData } = req.body;
  const data = JSON.parse(bookData)
  await updateBook(data)
  res.send('Sukses update buku: ' + data.title)
});

// DELETE /books/:id
app.delete('/books/:id', isAuthenticated, async (req, res) => {
  const bookID = req.params.id;

  await deleteBook(bookID)
  res.send('Sukses delete kategori ID: ' + bookID)
});

app.listen(port, () => {
    console.log(`Server runnig on port ${port}`)
})

async function addCategory(categoryName){
  const categoryID = idGenerator.uuid()
  // Write to db
  const targetRef = dbFirestore.collection('category').doc(categoryID.toString());
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

async function addBook(bookData){
  const bookID = idGenerator.uuid()
  const data = {
    // user input
    title: bookData.title,
    description: bookData.description,
    image: bookData.image,
    release_year: bookData.release_year,
    price: bookData.price,
    total_page: bookData.total_page,
    category_id: bookData.category_id,
    // system input
    id: bookID,
    thickness: getThickness(bookData.total_page),
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
  }
  // Write to db
  const targetRef = dbFirestore.collection('book').doc(bookID.toString());
  const res = await targetRef.set(data);
  
}

async function updateBook(bookData){
  const data = {
    // user input
    title: bookData.title,
    description: bookData.description,
    image: bookData.image,
    release_year: bookData.release_year,
    price: bookData.price,
    total_page: bookData.total_page,
    category_id: bookData.category_id,
    // system input
    id: bookData.id,
    thickness: getThickness(bookData.total_page),
    updated_at: FieldValue.serverTimestamp(),
  }
  // Write to db
  const targetRef = dbFirestore.collection('book').doc(bookData.id.toString());
  const res = await targetRef.update(data);
  
}

async function deleteBook(bookID){
  console.log('Delete category ID:', bookID)

  const res = await dbFirestore.collection('book').doc(bookID.toString()).delete();
}

function getThickness(totalPage){
  if (totalPage <= 100) {
    return "tipis";
  } else if (totalPage >= 101 && totalPage <= 200) {
    return "sedang";
  } else {
    return "tebal";
  }
}