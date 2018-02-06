/* eslint no-param-reassign: ["error", { "props": false }] */

'use strict';

const Hapi = require('hapi');
const Path = require('path');
const Nunjucks = require('nunjucks');
const asyncLib = require('async');
const vision = require('vision');
const hapiAuthCookie = require('hapi-auth-cookie');
const models = require('./models/index.js')
    .load(process.env.DATABASE_URL || process.env.POSTGRES_URL, {
        logging: false,
    });

const controllers = {};
controllers.index = require('./controllers/index.js');
controllers.users = require('./controllers/users.js');
controllers.tasks = require('./controllers/tasks.js');

// Create a server with a host and port
const server = new Hapi.Server();
server.connection({
    host: process.env.HOST || '0.0.0.0',
    port: process.env.PORT || 8000,
});

/**
 * @param  {function} callback - Callback to execute when done
 * @returns {undefined}
 */
function syncModels(callback) {
    // Sync the database then start the server
    models.sequelize.sync()
        .then(() => {
            console.log('Finished syncing models');
            callback();
        })
        .catch((error) => {
            console.error('Error syncing models!');
            console.error(error);
            process.exit(1);
        });
}

/**
 * @param  {function} callback - Callback to execute when done
 * @returns {undefined}
 */
function loadVision(callback) {
    // Configure our views. This is taken directly from
    // https://github.com/hapijs/vision#nunjucks
    server.register(vision, (err) => {
        if (err) {
            throw err;
        }
        server.views({
            engines: {
                html: {
                    compile(src, options) {
                        const template = Nunjucks.compile(src, options.environment);
                        return context => template.render(context);
                    },
                    prepare(options, next) {
                        options.compileOptions.environment = Nunjucks.configure(options.path, {
                            watch: false,
                        });
                        return next();
                    },
                },
            },
            path: Path.join(__dirname, 'views'),
        });
        console.log('Finished registering vision');
        callback();
    });
}

/**
 * @param  {function} callback - Callback to execute when done
 * @returns {undefined}
 */
function loadHapiAuthCookie(callback) {
    // Add our authentication strategy, using hapi-auth-cookie package
    server.register(hapiAuthCookie, (err) => {
        if (err) {
            throw err;
        }

        const host = process.env.HOST;
        let useSecure = false;
        if (host && host.toLowerCase()
            .startsWith('https://')) {
            useSecure = true;
        }
        server.auth.strategy('ourAuthStrategy', 'cookie', {
            password: process.env.COOKIE_SECRET || 'supersecretpasswordsupersecretpassword', // cookie secret
            ttl: 24 * 60 * 60 * 1000, // Set session to 1 day
            isSecure: useSecure, // required for non-https applications
            validateFunc: models.users.validateFunc,
        });

        // Make our models available in all the controllers
        // See https://hapijs.com/api#serverbindcontext
        server.bind({
            models,
        });

        server.auth.default({
            strategy: 'ourAuthStrategy',
            mode: 'try',
        });

        // Add the routes
        server.route({
            method: 'GET',
            path: '/',
            handler: controllers.index.index,
        });

        server.route({
            method: ['POST', 'GET'],
            path: '/users/login',
            handler: controllers.users.login,
        });

        server.route({
            method: 'GET',
            path: '/users/logout',
            handler: controllers.users.logout,
        });

        server.route({
            method: ['GET', 'POST'],
            path: '/users/register',
            handler: controllers.users.register,
        });

        server.route({
            method: ['POST'],
            path: '/tasks/create',
            config: {
                auth: 'ourAuthStrategy',
                handler: controllers.tasks.create,
            },
        });

        server.route({
            method: ['POST'],
            path: '/tasks/delete',
            config: {
                auth: 'ourAuthStrategy',
                handler: controllers.tasks.destroy,
            },
        });

        server.route({
            method: ['POST'],
            path: '/tasks/toggle',
            config: {
                auth: 'ourAuthStrategy',
                handler: controllers.tasks.toggle,
            },
        });
        console.log('Finished registering hapi-auth-cookie');
        callback();
    });
}
/**
 * Start the server
 * @param {function} callback - function to call when done
 * @returns {undefined}
 */
function startServer(callback) {
    server.start((err2) => {
        if (err2) {
            throw err2;
        }
        console.log('Started server at:', server.info.uri);
        callback();
    });
}

// Callbacks FTW. ;(
asyncLib.series([
    syncModels,
    loadVision,
    loadHapiAuthCookie,
    startServer,
]);
