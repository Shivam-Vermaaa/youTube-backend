import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteVideoFromCloudianry,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { deleteImageFromCloudianry } from "../utils/cloudinary.js";
// const fs = require('fs');
import fs from "fs";
import { log } from "console";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy,
    sortType = -1,
    userId,
  } = req.query;
  //TODO: get all videos based on query, sort, pagination
  // here we do not get any userid from client side
  // if someone wants to others and himself get alll video without login
  const sort = { createdAt: sortType };
  const allVideos = await Video.find({ owner: userId || req?.user?._id })
    .skip((page - 1) * limit)
    .limit(limit)
    .sort(sort);
  console.log("all Videos", allVideos);

  return res.status(200).json(allVideos);
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
  // get file from form
  //validate all fields are present
  // check for video file and thumbnail
  // upload them to cloudinary
  // if successfully uploaded then remove from local storage
  // create in mongoDB
  // send response to user

  const videoLocalFilePath = req.files?.videoFile[0]?.path;

  if (!videoLocalFilePath) {
    throw new ApiError(400, "video file is required");
  }

  const videoFilePath = await uploadOnCloudinary(videoLocalFilePath);
  let thumbnailLocalPath; //    = req.files?.thumbnail[0]?.path;
  if (
    req.files &&
    Array.isArray(req.files.thumbnail) &&
    req.files.thumbnail.length > 0
  ) {
    thumbnailLocalPath = req.files.thumbnail[0].path;
    console.log("thumbnail", thumbnailLocalPath);
  }
  console.log("thumbnail", thumbnailLocalPath);
  const thumbnailFilePath = await uploadOnCloudinary(thumbnailLocalPath);
  if (!videoFilePath) {
    throw new ApiError(
      400,
      "Something went wrong while uploading video file on cloudinary"
    );
  }

  // deleteting file from local

  fs.unlink(videoLocalFilePath, (err) => {
    if (err) {
      // Handle specific error if any
      if (err.code === "ENOENT") {
        console.error("File does not exist.");
      } else {
        throw err;
      }
    } else {
      console.log("File deleted!");
    }
  });

  fs.unlink(thumbnailLocalPath, (err) => {
    if (err) {
      if (err.code === "ENOENT") {
        console.error("File does not exist.");
      } else {
        throw err;
      }
    } else {
      console.log("File deleted!");
    }
  });

  const video = await Video.create({
    title,
    description,
    videoFile: videoFilePath?.url,
    thumbnail: thumbnailFilePath?.url || "",
    duration: videoFilePath?.duration,
    owner: req?.user?._id,
  });

  return res.status(201).json({ video });
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  // get video id
  // search video in db

  const video = await Video.findById(new mongoose.Types.ObjectId(videoId));
  // const video = await Video.findById(new mongoose.ObjectId(videoId));
  return res.status(200).json(video);
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  console.log(videoId);
  //TODO: update video details like title, description, thumbnail
  // check user loged in or not
  // if login then it is a authorized user or not
  // if it is a authorized user then search video by id
  // upload video in cloudenary if it uploaded successfully then add in db before adding in db take previous thumbnail path and delted it from clouanary after successfully updated
  // update then value
  // delete from local storage
  // again save that video

  const video = await Video.findById(
    new mongoose.Types.ObjectId(videoId.trim())
  );
  if (!video) {
    return res.status(404).json({ message: "video is not found" });
  }
  const oldThumbnail = video.thumbnail;
  // if (!(video.owner === req.user?._id))             // this gives false we cant direct compare objects
  if (!video.owner.equals(req.user?._id)) {
    return res
      .status(401)
      .json({ message: "you are not authorized to update this video" });
  }
  const newThumbnailLocalFilePath = req.file?.path;

  const updatedThumbnailOnCloudanary = await uploadOnCloudinary(
    newThumbnailLocalFilePath
  );

  const updatedVideoDetails = await Video.findOneAndUpdate(
    { _id: video._id },
    { title, description, thumbnail: updatedThumbnailOnCloudanary.url },
    { upsert: true, new: true }
    // { upsert: true, returnNewDocument: true }
  );
  if (!updatedVideoDetails) {
    return res.status(409).json({ message: "error while updating the value" });
  }
  const deletedThumbnailFile = await deleteImageFromCloudianry(oldThumbnail); // something went wrong we dont get value after deletion

  return res.status(200).json({ updatedVideoDetails });
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  // find that video by id then
  // find that video and thumnail in cloudinary and delete it
  // then delete that video
  // console.log("vid", videoId);

  const video = await Video.findOne({ _id: videoId });
  if (!video) {
    return res.status(404).json({ message: "video is not found " });
  }
  if (!video.owner.equals(req.user._id)) {
    return res
      .status(401)
      .json({ message: "you are not authorized to delete video " });
  }
  const isImageDeletedFromCloudianry = await deleteImageFromCloudianry(
    video.thumbnail
  );
  const isVideoDeletedFromCloudianry = await deleteVideoFromCloudianry(
    video.videoFile
  );
  if (!(isImageDeletedFromCloudianry && isVideoDeletedFromCloudianry)) {
    return res.status(409).json({
      message: "something went wrong while deleting video from cloudinary",
    });
  }
  await Video.deleteOne({ _id: videoId });
  return res.status(200).json({ message: "video has been deleted" });
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const video = await Video.findOne({ _id: videoId, owner: req.user._id });
  if (!video) {
    return res.status(404).json({ message: "video is not found" });
  }
  console.log("video", video);
  video.isPublished = !video.isPublished;
  await video.save({ validateBeforeSave: false });
  console.log("videoafter", video);
  return res.status(200).json({ message: "publish status has been updated" });
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
