exports.uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }
    // For now, we'll just log the file and return a success message.
    // In the future, this is where we'd save metadata to the database.
    console.log('Uploaded file:', req.file);
    res.json({
      msg: 'File uploaded successfully',
      filePath: req.file.path,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
