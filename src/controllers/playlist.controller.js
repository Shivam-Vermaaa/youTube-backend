import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { loginUser } from "./user.controller.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  //TODO: create playlist
  try {
    if (!req.user?._id) {
      throw new ApiError(401, "Login First for creating playlist");
    }
    const playlistreated = await Playlist.create({
      name,
      description,
      owner: req.user?._id,
    });

    if (!playlistreated) {
      throw new ApiError(
        400,
        "somwthing went wrong while creating of playlist"
      );
    }

    return res
      .status(201)
      .json(new ApiResponse(201, {}, "playlist is created"));
  } catch (error) {
    throw new ApiError(500, "somwthing went wrong while creating of playlist");
  }
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params || req.user?._id;

  //TODO: get user playlists
  try {
    console.log("userid", userId);
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, "invalid object id in playlist controller");
    }
    const playlists = await Playlist.find({ owner: userId });
    return res.status(200).json(new ApiResponse(200, { playlists }, ""));
  } catch (error) {}
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id
  try {
    if (!isValidObjectId(playlistId)) {
      throw new ApiError(400, "object id not invalid");
    }
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      throw new ApiError(404, "playlist is not found");
    }
    return res.status(200).json(new ApiResponse(200, { playlist }, ""));
  } catch (error) {
    throw new ApiError(500, error);
  }
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  try {
    const isPlaylistExists = await Playlist.findById(
      new mongoose.Types.ObjectId(playlistId)
    );

    if (!isPlaylistExists) {
      throw new ApiError(404, "playlist is not found");
    }

    // one way

    const videoInPlaylist = await Playlist.findOne(
      new mongoose.Types.ObjectId(isPlaylistExists._id)
    );
    videoInPlaylist.videos.map((id) => {
      if (id == videoId) {
        return res
          .status(409)
          .json({ message: "this video is present in playlist" });
      }
    });
    // videoAddInPlaylist.videos = [videoId, ...videoAddInPlaylist.videos];
    // videoAddInPlaylist.save({ validateBeforeSave: false });

    // second way

    const videoAddInPlaylist = await Playlist.updateOne(
      {
        _id: playlistId,
      },
      {
        $push: {
          videos: videoId,
        },
      },
      {
        new: true,
      }
    );

    console.log("video added", videoAddInPlaylist);
    return res.status(200).json(videoAddInPlaylist);
  } catch (error) {
    throw error;
  }
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist
  try {
    const isPlaylistExists = await Playlist.findById(playlistId);
    if (!isPlaylistExists) {
      throw new ApiError(404, "playlist is not found");
    }

    const newUpdatedVideosList = isPlaylistExists.videos.filter((id) => {
      if (id == videoId) {
        return;
      }
      return id;
    });
    console.log("newvidoeList", newUpdatedVideosList);
    const updatedVideosList = await Playlist.updateOne(
      { _id: isPlaylistExists?._id },
      { $set: { videos: newUpdatedVideosList } }
    );
    console.log("updtePlaylist", updatedVideosList);
    if (!updatedVideosList.acknowledged == true) {
      throw new ApiError(409, "video is not removed from playlist");
    }
    return res.status(200).json({ message: "video is removed from playlist" });
  } catch (error) {
    throw new ApiError(500, error);
  }
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist
  try {
    const isPlaylistExists = await Playlist.findById(playlistId);
    if (!isPlaylistExists) {
      return res.status(404).json({ message: "playlist is not found" });
    }
    const isPlaylistDeleted = await Playlist.deleteOne({
      _id: isPlaylistExists._id,
    });
    if (!isPlaylistDeleted.acknowledged == true) {
      throw new ApiError(
        500,
        "something went wrong while delting the playlist"
      );
    }
    return res
      .status(200)
      .json(
        new ApiResponse(200, { isPlaylistDeleted }, "playlist is been deleted")
      );
  } catch (error) {
    throw new ApiError(500, "something went wrong while deleting the playlist");
  }
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist

  try {
    if (!isValidObjectId(playlistId)) {
      throw new ApiError(400, "Object is not vaild");
    }
    // one way
    const isPlaylistExists = await Playlist.findById(playlistId);
    if (!isPlaylistExists) {
      throw new ApiError(404, "playList is not found");
    }
    isPlaylistExists.name = name || isPlaylistExists.name;
    isPlaylistExists.description = description || isPlaylistExists.description;
    isPlaylistExists.save({ validateBeforeSave: false });

    // second way
    // const playlist = await Playlist.findByIdAndUpdate(
    //   playlistId,
    //   {
    //     name,
    //     description,
    //   },
    //   { new: true }
    // );

    return res
      .status(200)
      .json(new ApiResponse(200, { isPlaylistExists }, "u"));
  } catch (error) {
    throw new ApiError(500, error);
  }
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
