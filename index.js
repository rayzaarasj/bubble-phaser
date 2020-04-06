const express = require("express");
const app = express();
const server = require("http").Server(app);

app.use(express.static(__dirname + "/"));

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/../index.html");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8082;
}
server.listen(port, function() {
  console.log(`Listening on ${server.address().port}`);
});
