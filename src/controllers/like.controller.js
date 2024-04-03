import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
  try {
    if (!isValidObjectId(videoId)) {
      throw new ApiError(400, "Object is invalid");
    }
    const isVideoExists = await Video.findById(videoId);
    if (!isVideoExists) {
      throw new ApiError(404, "video is not found");
    }
    const isVideoAlreadyLiked = await Like.findOne({ video: videoId });
    if (isVideoAlreadyLiked) {
      const videoDisliked = await Like.deleteOne({
        _id: isVideoAlreadyLiked._id,
      });
      if (!videoDisliked.acknowledged == true) {
        throw new ApiError(400, "something went wrong while disliking");
      }
      console.log("video disliked", videoDisliked);
      return res
        .status(200)
        .json(new ApiResponse(200, "Video disliked successfully"));
    }
    const isVideoLiked = await Like.create({
      video: videoId,
      likedBy: req.user?._id,
    });

    if (!isVideoLiked) {
      throw new ApiError(400, "something went wrong while liking");
    }

    return res
      .status(201)
      .json(new ApiResponse(201, { isVideoLiked }, "video liked successfully"));
  } catch (error) {
    throw new ApiError(500, "something went wrong while liking");
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Object id is invalid");
  }
  const isCommentAlreadyLiked = await Like.findOne({ comment: commentId });
  if (isCommentAlreadyLiked) {
    const commentDeleted = await Like.deleteOne({ comment: commentId });
    if (!commentDeleted.acknowledged == true) {
      throw new ApiError(400, "something went wrong while disliking");
    }

    return res
      .status(200)
      .json(
        ApiResponse(200, { commentDeleted }, "comment disliking successfully")
      );
  }

  const commentCreated = await Like.create({
    comment: commentId,
    likedBy: req.user?._id,
  });

  if (!commentCreated) {
    throw new ApiError(400, "something went wrong while creating comment");
  }
  return res
    .status(201)
    .json(new ApiResponse(201, {}, "comment created successfully"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Object id is invalid");
  }

  const isTweetAlreadyLiked = await Like.findOne({ tweet: tweetId });
  if (isTweetAlreadyLiked) {
    const dislikeTweet = await Like.deleteOne({ tweet: tweetId });
    if (!dislikeTweet.acknowledged == true) {
      throw new ApiError(400, "something went wrong while disliking tweet");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, { dislikeTweet }, "tweet dislike successfully")
      );
  }

  const likeTweet = await Like.create({
    tweet: tweetId,
    likedBy: req.user?._id,
  });
  if (!likeTweet) {
    throw new ApiError(400, "something went wrong while liking tweet");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, {}, "tweet like successfully"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  // ! here we use aggrigation pipeline

  //   const likedVideos = await Like.find(
  //     { type: "video" }, // if you put it last then it wouldn't work
  //     { likedBy: req.user?._id }
  //   );

  //   const likedVideos = await Like.aggregate([
  //     {
  //       //   $match: { $and: [{ type: "video" }, { likedBy: req.user?._id }] },
  //       $match: {
  //         $and: [{ video: { $exists: true } }, { likedBy: req.user?._id }],
  //       },
  //     },
  //     { video: 1, _id: 0 },
  //   ]);

  const likedVideos = await Like.aggregate([
    // Match documents where video field exists and likedBy field contains the specified user ID
    {
      $match: {
        video: { $exists: true },
        likedBy: req.user?._id,
      },
    },
    // Lookup to get the details of the video
    {
      $lookup: {
        from: "videos", // Assuming your videos are stored in a collection named "videos"
        localField: "video",
        foreignField: "_id",
        as: "videoDetails",
      },
    },
    // Unwind the array produced by the lookup
    {
      $unwind: "$videoDetails",
    },
    // Lookup to get the details of the owner/user
    {
      $lookup: {
        from: "users", // Assuming your users are stored in a collection named "users"
        localField: "videoDetails.owner",
        foreignField: "_id",
        as: "ownerDetails",
      },
    },
    // Unwind the array produced by the second lookup
    {
      $unwind: "$ownerDetails",
    },
    // Project to include only the desired fields in the final result
    {
      $project: {
        videoName: "$videoDetails.title",
        ownerName: "$ownerDetails.fullName",
      },
    },
  ]);

  if (!likedVideos) {
    throw new ApiError(400, "something went wrong while geting liked videos");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { likedVideos }, "liked videos get successfully")
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
