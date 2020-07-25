const express = require("express");
const Favorite = require("../models/favorite");
const authenticate = require("../authenticate");
const cors = require("./cors");
const { NotExtended } = require("http-errors");
const f = require("session-file-store");

const favoriteRouter = express.Router();

favoriteRouter
  .route("/")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, authenticate.verifyUser, (req, res) => {
    Favorite.find()
      .populate("campsites user")
      .then((favorites) => {
        res.setHeader("Content-Type", "application/json");
        res.status(200).json(favorites);
      })
      .catch((error) => {
        return next(error);
      });
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({ user: req.user._id })
      .then((favorite) => {
        if (!favorite) {
          Favorite.create({ user: req.user._id, campsites: req.body }).then(
            (favorite) => {
              res.status(200).json(favorite);
            }
          );
        }
        req.body.map((fav) => {
          if (!favorite.campsites.includes(fav._id)) {
            favorite.campsites.push(fav);
          }
        });
        favorite.save().then((favorite) => {
          res.status = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(favorite);
        });
      })
      .catch((error) => {
        return next(error);
      });
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.status = 400;
    res.send("put not supported");
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOneAndDelete({ user: req.user._id })
      .then((response) => {
        res.status = 200;
        res.json(response);
      })
      .catch((error) => {
        return next(error);
      });
  });

favoriteRouter
  .route("/:campsiteId")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, authenticate.verifyUser, (req, res) => {})
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({ user: req.user._id })
      .then((favorite) => {
        if (!favorite) {
          Favorite.create({
            user: req.user._id,
            campsites: [{ _id: req.params.campsiteId }],
          }).then((favorite) => {
            res.status = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(favorite);
          });
        } else if (!favorite.campsites.includes(req.params.campsiteId)) {
          favorite.campsites.push(req.params.campsiteId);
          favorite.save().then((favorite) => {
            res.status = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(favorite);
          });
        } else {
          res.send("Campsite already favorited");
        }
      })
      .catch((error) => next(error));
  })
  .put(cors.corsWithOptions, authenticate.verifyUser)
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({ user: req.user._id }).then((favorite) => {
      if (!favorite) {
        res.end("favorite not found");
      }
      const campsites = favorite.campsites.filter(
        (favorite) => !favorite.equals(req.params.campsiteId)
      );
      favorite.campsites = campsites;
      favorite.save().then((favorite) => {
        res.json(favorite);
      });
    });
  });

module.exports = favoriteRouter;
