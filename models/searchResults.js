/**
 * Created by mqallc on 6/5/17.
 */
// Require mongoose
var mongoose = require("mongoose");
// Create Schema class
var Schema = mongoose.Schema;

// Create article schema
var searchSchema = new Schema({
    // title is a required string
    title: {
        type: String,
        trim: true,
        required: true
    },
    // link is a required string
     link: {
        type: String,
         required: true
     },
    // grabs text of the images
     image: [{
        type: String,
         required: false
     }],
    // This only saves one note's ObjectId, ref refers to the Note model
    note: [{
        type: Schema.Types.ObjectId,
        ref: "Note"
    }]
});

// Create the Article model with the ArticleSchema
var Search = mongoose.model("Search", searchSchema);

// Export the model
module.exports = Search;


