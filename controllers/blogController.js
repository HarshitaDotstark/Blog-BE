const Blog = require('../models/Blog');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const createBlog = async (req, res) => {
  const { title, content, status, author } = req.body;
  const image = req.file.filename;

  try {
    const blog = new Blog({
      title,
      image: image,
      content,
      status,
      author: author,
    });

    const savedBlog = await blog.save();
    res.status(201).json(savedBlog);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create blog' });
  }
};


const updateBlog = async (req, res) => {
  const { title, content, status } = req.body;
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    if (blog.author.toString() !== req.user.id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const newImage = req.file?.filename;

    // Remove the old image if a new image is uploaded and an old image exists
    if (newImage && blog.image) {
      const oldImagePath = path.join(__dirname, '../images', blog.image);
      if (fs.existsSync(oldImagePath)) {
        fs.unlink(oldImagePath, (err) => {
          if (err) {
            console.error('Error deleting old image:', err);
          }
        });
      } else {
        console.error('Old image file does not exist, skipping deletion.');
      }
    }

    blog.title = title || blog.title;
    blog.content = content || blog.content;
    blog.status = status || blog.status;
    blog.image = newImage || blog.image;

    const updatedBlog = await blog.save();
    res.json(updatedBlog);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const getBlog = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid blog ID' });
    }

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.json(blog);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteBlog = async (req, res) => {
  try {
    console.log("hello6");

    const blog = await Blog.findById(req.params.id);
    console.log(blog);

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    if (blog.image) {
      const oldImagePath = path.join(__dirname, '../images', blog.image);

      if (fs.existsSync(oldImagePath)) {
        fs.unlink(oldImagePath, (err) => {
          if (err) {
            console.error('Error deleting old image:', err);
          }
        });
      } else {
        console.error('Old image file does not exist, skipping deletion.');
      }
    }
    await blog.deleteOne();
    res.json({ message: 'Blog removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

const getBlogs = async (req, res) => {
  const blogs = await Blog.find({ status: 'published' })
    .sort({ createdAt: -1 });;

  res.json(blogs);
};

const getBlogsForApproval = async (req, res) => {
  const blogs = await Blog.find({ status: 'pending' });
  console.log(blogs, "blogs");

  res.json(blogs);
};

const getBlogsForAdmin = async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate('author', 'name email type') 
      .sort({ createdAt: -1 }); 

    const filteredBlogs = blogs.filter(blog => {
      // Show all blogs if status is not 'draft' or if the author is an admin
      return blog.status !== 'draft' || blog.author.type === 1;
    });

    res.json(filteredBlogs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const approveBlog = async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  if (blog) {
    blog.status = 'published';
    await blog.save();
    res.json({ message: 'Blog approved' });
  } else {
    res.status(404).json({ message: 'Blog not found' });
  }
};

const rejectBlog = async (req, res) => {
  const { rejectionReason } = req.body;

  const blog = await Blog.findById(req.params.id);
  if (blog) {
    blog.status = 'rejected';
    blog.rejectionReason = rejectionReason || 'No reason provided';

    const updatedBlog = await blog.save();
    res.json(updatedBlog);
  } else {
    res.status(404).json({ message: 'Blog not found' });
  }
};


const getUserBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ author: req.user.id });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createBlog,
  updateBlog,
  getBlogs,
  getBlogsForApproval,
  approveBlog,
  rejectBlog,
  getUserBlogs,
  getBlog,
  deleteBlog,
  getBlogsForAdmin
};
