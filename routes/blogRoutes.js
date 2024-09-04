const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
let path = require('path');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'images');
  },
  filename: function (req, file, cb) {
    cb(null, uuidv4() + '-' + Date.now() + path.extname(file.originalname));
    console.log("jhbgjh");
  }
});

const fileFilter = (req, file, cb) => {
  const allowedFileTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
}
const upload = multer({ storage, fileFilter });
const {
  createBlog,
  updateBlog,
  getBlogs,
  approveBlog,
  rejectBlog,
  getUserBlogs,
  getBlog,
  deleteBlog,
  getBlogsForAdmin
} = require('../controllers/blogController');
const { protect, admin } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/mine').get(protect, getUserBlogs);
router.route('/pending').get(protect, admin, getBlogsForAdmin);
router.route('/approve/:id').put(protect, admin, approveBlog);
router.route('/reject/:id').put(protect, admin, rejectBlog);
router.route('/:id').get(getBlog).put(protect, upload.single('image'), updateBlog).delete(protect, deleteBlog);
router.route('/').get(getBlogs).post(protect, upload.single('image'), createBlog);


module.exports = router;
