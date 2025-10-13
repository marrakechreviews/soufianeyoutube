const Template = require('../models/Template');

exports.getTemplates = async (req, res) => {
  try {
    const templates = await Template.find({ user: req.user.id });
    res.json(templates);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.createTemplate = async (req, res) => {
  const { name, description, tags } = req.body;

  try {
    const newTemplate = new Template({
      user: req.user.id,
      name,
      description,
      tags,
    });

    const template = await newTemplate.save();
    res.json(template);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
