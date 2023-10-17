const express = require("express");
const app = express();
const mongoose = require("mongoose");
app.use(express.json());
app.use(express.urlencoded({ extends: true }));
const port = 8081;

mongoose
  .connect("mongodb://localhost:27017/employee")
  .then(() => {
    console.log("Database Connected Successfully");
  })
  .catch((e: any) => console.log(e));

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
