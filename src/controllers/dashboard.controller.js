import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  // ! subscriber count is not working
  const dashboardDetails = await Video.aggregate([
    {
      $match: {
        owner: req.user?._id,
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "owner",
        foreignField: "channel",
        as: "totalSubscribers",
      },
    },
    // {
    //   $unwind: "$totalSubscribers",
    // },

    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likeDetails",
      },
    },

    {
      $project: {
        likeDetailsCount: { $size: "$likeDetails" }, // Count the number of objects in each document's likeDetails array
        // firstTotalSubscribers: { $arrayElemAt: ["$totalSubscribers", 0] },
        // firstDocument: { $first: "$$ROOT" },
        // $first: {
        //   kuchtoha: "$totalSubscribers",
        // },
      },
    },

    {
      $group: {
        _id: null,
        totalVideos: { $sum: 1 }, // count all documents which are filter
        totalViews: { $sum: "$views" }, // sum value of all data in all document where views fields are present
        // totalSubscribers: { $size: "$firstTotalSubscribers" },
        // totalSubscribers: {
        //   $sum: {
        //     $cond: [
        //       { $isArray: "$firstTotalSubscribers" },
        //       { $size: "$firstTotalSubscribers" },
        //       0,
        //     ],
        //   },
        // }, // Count number of objects inside the first document's totalSubscribers array
        // totalSubscribersCount: { $size: "$firstDocument.totalSubscribers" },
        totalLikes: {
          $sum: "$likeDetailsCount",
        },
      },
    },
  ]);
  const getSubscriber = await Subscription.find({
    channel: req.user?._id,
  }).count();
  //   dashboardDetails = {
  //     ...dashboardDetails,
  //     totalSubscribers: getSubscriber,
  //   };
  dashboardDetails[0].totalSubscribers = getSubscriber;
  console.log("hh", dashboardDetails);
  return res.json(
    new ApiResponse(200, dashboardDetails, "dashboad details fetched")
  );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const getAllVideos = await Video.find({ owner: req.user?.id });
  if (!getAllVideos) {
    return res.json(new ApiResponse(404, {}, "videos are not found"));
  }
  return res.json(
    new ApiResponse(200, getAllVideos, "all videos fetched successfully")
  );
});

export { getChannelStats, getChannelVideos };
