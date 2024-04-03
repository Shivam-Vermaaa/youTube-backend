import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Object id is invalid");
  }
  //   const allComments = await Comment.find({ video: videoId });

  const allComments = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videoDetails",
      },
    },
    {
      $unwind: "$videoDetails",
    },

    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
      },
    },
    {
      $unwind: "$ownerDetails",
    },
    {
      $project: {
        comment: "$content",
        videoName: "$videoDetails.title", // if we dont unwind it then videoName : videoDetails.title get inside an array ["shivam verma"]
        OwnerName: "$ownerDetails.fullName",
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, allComments, "all comments fetched successfully")
    );
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  try {
    const { comment } = req.body;
    console.log("comment", videoId, comment);
    const isCommentCreated = await Comment.create({
      content: comment,
      video: videoId,
      owner: req.user?._id,
    });

    if (!isCommentCreated) {
      throw new ApiError(
        400,
        "something went wrong while creation of comments"
      );
    }

    return res.status(201).json(new ApiResponse(201, isCommentCreated, {}));
  } catch (error) {
    throw new ApiError(500, "something went wrong while creation of comment");
  }
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const { comment } = req.body;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Object id is invalid");
  }
  const isCommentExists = await Comment.findById(commentId);
  if (!isCommentExists) {
    throw new ApiError(404, "comment not found");
  }
  isCommentExists.content = comment;
  isCommentExists.save({ validateBeforeSave: false });

  return res.status(200).json(isCommentExists);
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "ObjectId is invalid");
  }
  const isCommentDeleted = await Comment.findByIdAndDelete(commentId);
  if (!isCommentDeleted) {
    return res
      .status(404)
      .json({ message: "comment is already deleted or not found" });
  }

  return res.status(200).json(isCommentDeleted);
});

export { getVideoComments, addComment, updateComment, deleteComment };
