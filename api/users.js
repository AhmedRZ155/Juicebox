// api/users.js
const express = require('express');
const usersRouter = express.Router();
const { getAllUsers, getUserByUsername, createUser, getUserById, updateUser  } = require('../db');
const jwt = require('jsonwebtoken');
const bycrypt = require('bcrypt');
require('dotenv').config();

function requireActiveUser(req, res, next) {
  if (!req.user || !req.user.active) {
    next({
      name: 'MissingActiveUserError',
      message: 'You must be logged in as an active user to perform this action'
    });
  }

  next();
}

function requireUser(req, res, next) {
  if (!req.user) {
    next({
      name: "MissingUserError",
      message: "You must be logged in to perform this action"
    });
  }
  
  next();
}



usersRouter.use((req, res, next) => {
  console.log("A request is being made to /users");

  next(); 
});

usersRouter.get('/', async (req, res) => {
    const users = await getAllUsers();
  
    res.send({
      users
    });
  });

  usersRouter.post('/login', async (req, res, next) => {
    const { username, password } = req.body;
  
    // request must have both
    if (!username || !password) {
      next({
        name: "MissingCredentialsError",
        message: "Please supply both a username and password"
      });
    }
  
    try {
      const user = await getUserByUsername(username);
  
      if (user && await bcrypt.compare(password, user.password)) {
        // create token & return to user
        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET);
        res.send({ message: "you're logged in!", token: token });
      } else {
        next({ 
          name: 'IncorrectCredentialsError', 
          message: 'Username or password is incorrect'
        });
      }
    } catch(error) {
      console.log(error);
      next(error);
    }
  });

  usersRouter.post('/register', async (req, res, next) => {
    const { username, password, name, location } = req.body;
  
    try {
      const _user = await getUserByUsername(username);
  
      if (_user) {
        next({
          name: 'UserExistsError',
          message: 'A user by that username already exists'
        });
      }
  
      const user = await createUser({
        username,
        password,
        name,
        location,
      });
  
      const token = jwt.sign({ 
        id: user.id, 
        username
      }, process.env.JWT_SECRET, {
        expiresIn: '1w'
      });
  
      res.send({ 
        message: "thank you for signing up",
        token 
      });
    } catch ({ name, message }) {
      next({ name, message })
    } 
  });

  usersRouter.delete('/:userId', requireUser, requireActiveUser, async (req, res, next) => {
    try {
      const user = await getUserById(req.params.userId);
  
      if (user) {
        if (req.user && req.user.id === user.id) {
          const updatedUser = await updateUser(user.id, { active: false });
  
          res.send({ user: updatedUser });
        } else {
          next({
            name: 'UnauthorizedUserError',
            message: 'You cannot delete a user that is not you'
          });
        }
      } else {
        next({
          name: 'UserNotFoundError',
          message: 'That user does not exist'
        });
      }
  
    } catch ({ name, message }) {
      next({ name, message });
    }
  });

  usersRouter.patch('/:userId', requireUser, async (req, res, next) => {
    const { active } = req.body;
  
    try {
      const user = await getUserById(req.params.userId);
  
      if (user && req.user.id === user.id) {
        const updatedUser = await updateUser(user.id, { active });
  
        res.send({ user: updatedUser });
      } else {
        next({
          name: 'UnauthorizedUserError',
          message: 'You cannot update a user that is not you'
        });
      }
  
   
    } catch ({ name, message }) {
      next({ name, message });
    }  });

module.exports = usersRouter;