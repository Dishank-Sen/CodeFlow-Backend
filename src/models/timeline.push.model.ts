import mongoose from "mongoose"
import historySchema from "./history.push.models.ts"

const timelineSchema = new mongoose.Schema({
    ownerName: {
        type: String,
        required: true
    },
    repoName: {
        type: String,
        required: true
    },
    history: [historySchema]
})

export default mongoose.model("Timeline", timelineSchema)