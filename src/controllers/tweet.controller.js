import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  // get content from req.body
  const { tweet } = req.body;
  const createTweet = await Tweet.create({
    content: tweet,
    owner: req.user._id,
  });

  //! adding a value is not working
  //   await Object.assign(createTweet, { message: "tweet has been created" });
  createTweet.message = "tweet has been created";
  //   createTweet = { ...createTweet, message: "tweet has been created" };
  //   createTweet["message"] = "tweet has been created";
  console.log("tweet", createTweet);
  return res.status(201).json(createTweet);
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  // we get any user's tweet
  // get user's id from params
  // search from tweet table by owner
  const { userId } = req.params;

  const tweet = await Tweet.find({ owner: userId });

  return res.status(200).json(tweet);
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { tweetId } = req.params;
  const { tweet } = req.body;
  const tweetValue = await Tweet.findById(tweetId);
  tweetValue.content = tweet;
  tweetValue.save({ validateBeforeSave: false });
  return res.status(200).json(tweetValue);
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;

  const deletedTweet = await Tweet.findByIdAndDelete(tweetId);
  if (!deletedTweet) {
    return res.status(404).json({ message: "tweet is not found" });
  }
  return res.status(200).json(deletedTweet);
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
