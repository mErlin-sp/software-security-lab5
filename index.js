const uuid = require('uuid');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const port = 3000;
const request = require("request");

const app = express();

app.use(session({
    secret: 'some-secret',
    resave: false,
    saveUninitialized: true
}))

app.set('view engine', 'pug')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get('/', (req, res) => {
    res.render('index', {username: req.session.username})
})

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
})

app.post('/api/login', (req, res) => {
    const {login, password} = req.body;
    console.log(login + '  ' + password)

    const options = {
        method: 'POST',
        url: 'https://dev-00wdj4huibiu7y8p.us.auth0.com/oauth/token',
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
        },
        form: {
            grant_type: 'password',
            username: login,
            password: password,
            scope: 'offline_access',
            client_id: 'bWUNFvT10QJBoWqZn7b4MYAfwMFS8q8C',
            client_secret: 'IaAds7SUSktrybzfIH0Rp3a8WmwdiGAX5sGq9HU2JV0RUPWw1gR5nCqaWAvw44ug',
        }
    };

    request(options, function (error, response, body) {
        if (error) {
            console.log('error')
            res.status(501).send(error)
        } else {
            body = JSON.parse(body)
            console.log(body)

            if (body['error']) {
                console.log('error')
                res.status(501).send(body)
            } else {
                req.session.accessToken = body['access_token']
                req.session.username = login;
                req.session.login = login;

                res.json({token: body['access_token']});
            }
        }


    });

})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
