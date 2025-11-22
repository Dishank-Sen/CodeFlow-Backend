import mongoose from "mongoose";

const mainTimeline = new mongoose.Schema({
    file: {
        type: String,
        required: true,
    },
    action: {
        type: String,
        required: true,
    },
    oldPath: {
        type: String,
    },
    newPath: {
        type: String,
    },
    timestamp: {
        type: String,
        required: true,
    }
})

export default mainTimeline