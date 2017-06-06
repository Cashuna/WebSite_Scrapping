/**
 * Created by mqallc on 5/30/17.
 */

//====================================Dependencies=======================
var express = require ("express"), handlebars = require ("express-handlebars");
var parser = require ("body-parser"), mongoose = require ("mongoose");
var cheerio = require ("cheerio"), request = require("request");
var Search = require("./models/searchResults.js"), Note = require("./models/Note.js");
var logger = require("morgan"), fs = require("fs"), PORT = 3000;
var scrapeSite = "http://nodejs-magazine.blogspot.com/search/label/RESTful%20API";

//=======================================functions============================
function getLink (info){
    var array = info.split("(");
    var newArray = array[1].split(")");
    console.log(newArray[0]);
    return newArray[0];
}
//=====================================db connection==========================

// Set mongoose to leverage built in JavaScript ES6 Promises
mongoose.Promise = Promise;
if(process.env.MONGODB_URI){
    mongoose.connect(process.env.MONGODB_URI);
} else{
    mongoose.connect("mongodb://localhost/searchdb");
}

// Initialize Express
var app = express();

// Use morgan and body parser with our app
app.use(logger("dev"));
app.use(parser.urlencoded({
    extended: false
}));

// Make public a static dir
app.use(express.static("public"));

// Database configuration with mongoose
mongoose.connect("mongodb://localhost/searchdb");
var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function(error) {
    console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
    console.log("Mongoose connection successful.");
});


//============================================Routes===================================
app.get("/scrape", function(req, res) {
    // First, we grab the body of the html with request
    request(scrapeSite, function(error, response, html) {
        // Then, we load that into cheerio and save it to $ for a shorthand selector
        var $ = cheerio.load(html);
        // Now, we grab every a tag, and do the following:
        $("div.post-info").each(function(i, element) {
            console.log("This is i: " +i+ " and this is ELEMENT: " +element.length);
            // Save an empty result object
            var result = {};
            var imgPath = $("div.post-thumb").children("a").attr("style");

            // Add the text and href of every link, and save them as properties of the result object
            result.title = $("h2.post-title", this).children("a").text();
            result.link = $("h2.post-title", this).children("a").attr("href");
            result.image = getLink(imgPath);

            //Creating a new entry
            var entry = new Search(result);

            // Saving entry to db
            entry.save(function(err, doc) {
                // Log any errors
                if (err) {
                    console.log(err);
                }
                // Or log the doc
                else {
                    console.log(doc);
                }
            });

        });
    });
    // Tells browser scraping text is finished
    res.send("Scrape Complete");
});

// Get the search scraped from the mongoDB
app.get("/search", function(req, res) {
    // Grab every doc in the Articles array
    Search.find({}, function(error, doc) {
        // Log any errors
        if (error) {
            console.log(error);
        }
        // Or send the doc to the browser as a json object
        else {
            res.json(doc);
        }
    });
});

// Grab an article by it's ObjectId
app.get("/search/:id", function(req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    Search.findOne({ "_id": req.params.id })
    // ..and populate all of the notes associated with it
        .populate("note")
        // now, execute our query
        .exec(function(error, doc) {
            // Log any errors
            if (error) {
                console.log(error);
            }
            // Otherwise, send the doc to the browser as a json object
            else {
                res.json(doc);
            }
        });
});


// Create a new note or replace an existing note
app.post("/search/:id", function(req, res) {
    // Create a new note and pass the req.body to the entry
    var newNote = new Note(req.body);

    // And save the new note the db
    newNote.save(function(error, doc) {
        // Log any errors
        if (error) {
            console.log(error);
        }
        // Otherwise
        else {
            // Use the article id to find and update it's note
            Search.findOneAndUpdate({ "_id": req.params.id }, { "note": doc._id })
            // Execute the above query
                .exec(function(err, doc) {
                    // Log any errors
                    if (err) {
                        console.log(err);
                    }
                    else {
                        // Or send the document to the browser
                        res.send(doc);
                    }
                });
        }
    });
});


// Listen on port
app.listen(PORT, function() {
    console.log("App running on port " +PORT+ ":!");
});