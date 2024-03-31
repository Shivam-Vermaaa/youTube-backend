import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { extractPublicId } from "cloudinary-build-url";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// upload alll foles on cloudanary
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // file has been uploaded successfull
    //console.log("file is uploaded on cloudinary ", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation got failed
    return null;
  }
};

// delete images from cloudanry
const deleteImageFromCloudianry = async (imagePath) => {
  try {
    const publicId = extractPublicId(imagePath);

    // promise
    return cloudinary.uploader.destroy(publicId).then((result) => {
      if (result.result == "ok") {
        return true; // something went wrong we can't get return value    || // this return goes to line number 35 and then that return goes to calling function
      } else {
        return false;
      }
      // return result;
    });
  } catch (error) {
    return error;
  }
};

const deleteVideoFromCloudianry = async (videoFilePath) => {
  try {
    const publicId = extractPublicId(videoFilePath);
    // const response = await cloudinary.api.delete_resources_by_prefix(publicId, {
    //   resource_type: "video",
    //   type: "authenticated",
    // });
    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: "video",
      invalidate: true,
    });
    // if we use promise using .then then retrun got some issue
    if (response.result == "ok") {
      return true;
    } else {
      return false;
    }
    return true;
  } catch (error) {
    console.log("error", error);
  }
};

export {
  uploadOnCloudinary,
  deleteImageFromCloudianry,
  deleteVideoFromCloudianry,
};
