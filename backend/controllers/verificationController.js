const cloudinary = require("../config/cloudinary");
const DoctorApplication = require("../models/DoctorApplication");

const saveVerification = async (req, res) => {
  try {
    const {
      specialty,
      yearsInPractice,
      licenseNumber,
      licenseState,
      npiNumber,
      hospitalAffiliation,
      boardCertification,
      professionalBio,
    } = req.body;

    if (!specialty || !licenseNumber || !licenseState || !npiNumber || !hospitalAffiliation) {
      return res.status(400).json({ message: "Please fill in all required fields" });
    }

    if (!/^\d{10}$/.test(npiNumber)) {
      return res.status(400).json({ message: "NPI number must be exactly 10 digits" });
    }

    const application = await DoctorApplication.findOneAndUpdate(
      { email: req.user.email },
      {
        name: req.user.name,
        specialty,
        experience: yearsInPractice,
        licenseNumber,
        licenseState,
        npiNumber,
        hospitalAffiliation,
        boardCertification: boardCertification || "",
        professionalBio: professionalBio || "",
      },
      { returnDocument: "after", upsert: true },
    );

    res.json({
      message: "Professional information saved successfully",
      application,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUploadSignature = async (req, res) => {
  try {
    const timestamp = Math.round(Date.now() / 1000);
    const params = {
      timestamp,
      folder: `doctor-verifications/${req.user._id}`,
      type: "upload",
    };

    const signature = cloudinary.utils.api_sign_request(
      params,
      process.env.CLOUDINARY_API_SECRET,
    );

    res.json({
      timestamp,
      signature,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      folder: `doctor-verifications/${req.user._id}`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getVerificationStatus = async (req, res) => {
  try {
    const application = await DoctorApplication.findOne({ email: req.user.email });
    res.json({ application });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const saveDocument = async (req, res) => {
  try {
    const { url, publicId, documentType } = req.body;

    if (!url || !publicId || !documentType) {
      return res.status(400).json({ message: "Missing required document fields" });
    }

    const validTypes = ["medical_license", "board_certification", "id_proof"];
    if (!validTypes.includes(documentType)) {
      return res.status(400).json({ message: "Invalid document type" });
    }

    const application = await DoctorApplication.findOneAndUpdate(
      { email: req.user.email },
      {
        $push: {
          documents: { url, publicId, documentType },
        },
      },
      { returnDocument: "after" },
    );

    if (!application) {
      return res.status(404).json({ message: "No application found. Please complete step 1 first." });
    }

    res.json({ message: "Document saved", documents: application.documents });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const submitApplication = async (req, res) => {
  try {
    const application = await DoctorApplication.findOne({ email: req.user.email });

    if (!application) {
      return res.status(404).json({ message: "No application found. Please complete step 1 first." });
    }

    const requiredDocs = ["medical_license", "id_proof"];
    const uploadedTypes = application.documents.map((d) => d.documentType);
    const missing = requiredDocs.filter((t) => !uploadedTypes.includes(t));

    if (missing.length > 0) {
      return res.status(400).json({
        message: `Missing required documents: ${missing.join(", ")}`,
      });
    }

    application.status = "pending";
    await application.save();

    res.json({ message: "Application submitted for review", application });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const viewDocument = async (req, res) => {
  try {
    const { publicId } = req.query;

    if (!publicId) {
      return res.status(400).json({ message: "Missing publicId" });
    }

    let resource;
    const attempts = [
      { resource_type: "image", type: "upload" },
      { resource_type: "raw", type: "upload" },
      { resource_type: "image", type: "authenticated" },
      { resource_type: "raw", type: "authenticated" },
    ];

    for (const opts of attempts) {
      try {
        resource = await cloudinary.api.resource(publicId, opts);
        break;
      } catch {}
    }

    if (!resource) {
      return res.status(404).json({ message: "Document not found in Cloudinary" });
    }

    const url = cloudinary.utils.private_download_url(publicId, resource.format, {
      type: resource.type || "upload",
      resource_type: resource.resource_type || "image",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    });

    const response = await fetch(url);
    if (!response.ok) {
      return res.status(502).json({ message: "Failed to fetch document from Cloudinary" });
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";
    res.set("Content-Type", contentType);
    res.set("Content-Disposition", "inline");

    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { saveVerification, getUploadSignature, getVerificationStatus, saveDocument, submitApplication, viewDocument };
