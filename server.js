let express = require("express");
let mongodb = require("mongodb");
let sanitizeHTML = require("sanitize-html");

let app = express();
let db;

app.use(express.static("public"));

let connectionString =
  "mongodb+srv://dbuser1:Password123@cluster0.wkcvn.mongodb.net/todoapp?retryWrites=true&w=majority";
// connection string will tell mongodb what to connect to...

mongodb.connect(
  connectionString,
  { useNewUrlParser: true, useUnifiedTopology: true },
  function (err, client) {
    // client will have info about the mongodb environment
    // we just connected to...
    db = client.db();
    // This will select mongodb database
    app.listen(process.env.PORT || 3000);
    // You should start listening only after
    // establishing a connection to your db
    // So, start listening after connecting to db
    // Only by this way... you can save your items in the db
  }
);
app.use(express.json());
// This will cause browser-side JS to send
// asynchronous request to node JS server.
app.use(express.urlencoded({ extended: false }));
// This will cause express to automatically add
// submitted form data to the "body" object as properties.
// This body object lives on the "request object" - req.

function passwordProtected(req, res, next) {
  res.set("WWW-Authenticate", 'Basic realm ="Simple To-do App"');
  //   console.log("Our custom function just ran");
  console.log(req.headers.authorization);
  if (req.headers.authorization == "Basic bGVhcm46amF2YXNjcmlwdA==") {
    next();
  } else {
    res.status(401).send("Authentication required");
  }
}

app.use(passwordProtected);

app.get("/", function (req, res) {
  db.collection("items")
    .find()
    .toArray(function (err, items) {
      res.send(`
        <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Simple To-Do App</title>
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.2.1/css/bootstrap.min.css" integrity="sha384-GJzZqFGwb1QTTN6wy59ffF1BuGJpLSa9DkKMp0DgiMDm4iYMj70gZWKYbI706tWS" crossorigin="anonymous">
      </head>
      <body>
        <div class="container">
          <h1 class="display-4 text-center py-1">To-Do App!!</h1> 
          
          <div class="jumbotron p-3 shadow-sm">
            <form id="create-form" action="create-item" method="POST">
              <div class="d-flex align-items-center">
                <input id="create-field" name="item" autofocus autocomplete="off" class="form-control mr-3" type="text" style="flex: 1;">
                <button class="btn btn-primary">Add New Item</button>
              </div>
            </form>
          </div>
          
          <ul id="item-list" class="list-group pb-5">

          </ul>
          
        </div>
        <script>
        let items = ${JSON.stringify(items)}
        </script>
        <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
        <script src="/browser.js"></script>
      </body>
      </html>
        `);
    });
});

app.post("/create-item", function (req, res) {
  //   console.log(req.body.item);
  let safeText = sanitizeHTML(req.body.text, {
    allowedTags: [],
    allowedAttributes: {},
  });
  db.collection("items").insertOne({ text: safeText }, function (err, info) {
    // req.body.item can also be used..
    // req.body.text is coming from axios asynchronously
    res.json(info.ops[0]);
    // This will send a JS object that represents the
    // new mngoDB document that is just created.
    //   console.log(res.info.ops[0]);
    // res.redirect("/");
    // res.send("Thanks for submitting the form");

    // This callback runs "after" the document is inserted into the 'items' collection of the database.
  });
});

app.post("/update-item", function (req, res) {
  let safeText = sanitizeHTML(req.body.text, {
    allowedTags: [],
    allowedAttributes: {},
  });
  db.collection("items").findOneAndUpdate(
    { _id: new mongodb.ObjectId(req.body.id) },
    { $set: { text: safeText } },
    function () {
      res.send("Success");
    }
  );

  //   console.log(req.body.text);
  // This is the data axios request is sending over.
  //   res.send("Success");
});

app.post("/delete-item", function (req, res) {
  db.collection("items").deleteOne(
    { _id: new mongodb.ObjectId(req.body.id) },
    function () {
      res.send("Success");
    }
  );
});

/*
           // ${items
            //   .map(function (item) {
            //     return `<li class="list-group-item list-group-item-action d-flex align-items-center justify-content-between">
            //     <span class="item-text">${item.text}</span>
            //     <div>
            //       <button data-id=${item._id} class="edit-me btn btn-secondary btn-sm mr-1">Edit</button>
            //       <button data-id=${item._id} class="delete-me btn btn-danger btn-sm">Delete</button>
            //     </div>
            //   </li>`;
            //   })
            //   .join("")}
*/
