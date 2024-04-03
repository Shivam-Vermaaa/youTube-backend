import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription
  // if channel is subscribed then unsubscribe the channel
  // if channel is unsubscribe then subscribe the channel
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "invalid channel");
  }
  const isChannelExists = await User.findById(channelId);
  if (!isChannelExists) {
    throw new ApiError(404, "channel not found");
  }
  const isAlreadySubscribed = await Subscription.findOne({
    $and: [{ subscriber: req.user?._id }, { channel: isChannelExists._id }],
  });
  if (isAlreadySubscribed) {
    const unsubscribeTheChannel = await Subscription.findByIdAndDelete(
      isAlreadySubscribed._id
    );
    if (!unsubscribeTheChannel) {
      throw new ApiError(
        400,
        "something went wrong while unsubscribing thi channel"
      );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {},
          "you already had subscribe this channel now you have unsubscribe this channel"
        )
      );
  }

  const subscribeTheChannel = await Subscription.create({
    subscriber: req.user?._id,
    channel: isChannelExists._id,
  });
  if (!subscribeTheChannel) {
    throw new ApiError(
      500,
      "something went wrong while subscribing the channel"
    );
  }
  return res.status(201).json({ message: "you have subscribed this channel" });
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Not a valid channel");
  }
  const isChannelExists = await User.findById(subscriberId);
  if (!isChannelExists) {
    throw new ApiError(404, "channel is not found");
  }
  const subscriber = await Subscription.find({
    channel: subscriberId,
  }).countDocuments();
  console.log("subs", subscriber);
  return res.status(200).json({ message: `no of subscriber ${subscriber}` });
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { channelId } = req.params || req.user?._id;

  const isChannelExists = await User.findById(channelId);
  if (!isChannelExists) {
    throw new ApiError(404, "channel is not found");
  }
  // one way
  // const subscribedChennel = await Subscription.find({
  //   subscriber: channelId,
  // });

  // second way
  const subscribedChennel = await Subscription.aggregate([
    {
      $match: { subscriber: new mongoose.Types.ObjectId(channelId) },
    },

    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "users",
        pipeline: [
          {
            $project: {
              _id: 0,
              email: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    // {
    //   $project: {
    //     channel: 1,
    //     email: 1,
    //   },
    // },
  ]);

  return res.status(200).json(subscribedChennel);
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
