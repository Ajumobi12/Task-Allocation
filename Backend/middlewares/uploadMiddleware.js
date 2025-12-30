const multer = require("multer");

//configuration

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

//file filter

const fileFilter = (req, file, cb) => {     
    const allowedFileTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (allowedFileTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, JPG, and PNG files are allowed."), false);
    }
  };

const upload = multer({ storage, fileFilter });

module.exports = upload;