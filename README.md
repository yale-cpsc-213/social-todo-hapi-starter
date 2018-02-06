# Hapi + Sequelize starter code for social todo homework

This is some starter code for the social todo homework. You can
inspect the `package.json` file to see what libraries we are using
here. The most important are [Hapi](https://hapijs.com) and
[Sequelize](http://docs.sequelizejs.com/en/v3/).

## Getting started

You will need a Node environment and npm.
Clone the code, `cd` into the
code's directory and then download your dependencies with
`npm install`. This will populate your `node_modules` directory
with everything I used to complete the homework. Of course, you are
free to add and remove dependencies as you like for your solution.

## A Caveat

The Hapi web application framework made major changes to the
API between versions 16 and 17. Their documentation online is
all 16 still as far as I can tell, so we kept this code pinned
as 16.

## What I did for you

I did the models and all the code needed to hold everything together. After
I finished the homework, I replaced my controllers and views with dummy code.
_You do not have to use the same controllers and views as me_. You can use
any functions, routes, and views that get the job done. For that matter, you
are free to alter the models. This code is only to help you---you don't need
to use it.

## Running the code

This code needs a few environment variables in order to run: `DATABASE_URL` and
`PORT`. You can also specify `HOST`. The `server.js` file, which is the entry
point, is the only file that reads variables from the environment.

When I completed the homework, my environment variables looked like this.
```
DATABASE_URL=sqlite:///Users/kljensen/src/cpsc213/assignments/kljensen-social-todo/tmp/foo.db
PORT=8000
```

You will need an SQL database supported by Sequelize: sqlite, mysql, and
postgresql are fine choices.

Having set your environment variables and started your database (if need be),
you can then run the code like

`npm start`

which will start it with nodemon, as shown in the `package.json` file.

## Other tools

This code has some tests for the models. You can run those like

`npm test`

You can run tests that contain "collab" in the test description as follows

`npm test -- -g collab`

The tests should show you how the models work. Sequelize models are a bit
more complicated that MongoDB/Mongoose models.
