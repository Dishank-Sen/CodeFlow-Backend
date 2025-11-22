import mongoose from "mongoose";
import History from "./history.push.models.ts"
import MainTimeline from "./mainTimeline.push.models.ts"

const repoSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true
    },
    repoName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ""
    },
    remoteUrl: {
        type: String,
        required: true
    },
    visibility: {
        type: String,
        required: true
    },
    history: [History],
    mainTimeline: [MainTimeline]
}, { timestamps: true });

export default mongoose.model("Repo", repoSchema);