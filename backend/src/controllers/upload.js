exports.uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }
    res.json({
      msg: 'File uploaded successfully',
      filePath: req.file.path,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
