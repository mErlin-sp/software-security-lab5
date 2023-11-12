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

    try {
        console.log(`Expires in: ${req.session.expiresIn - new Date().getTime()}`)
    } catch (err) {
    }
    if (req.session.expiresIn && (req.session.expiresIn - new Date().getTime()) < 10000) {
        console.log('Refresh Token')
        const options = {
            method: 'POST',
            url: 'https://dev-00wdj4huibiu7y8p.us.auth0.com/oauth/token',
            headers: {'content-type': 'application/x-www-form-urlencoded'},
            form:
                {
                    grant_type: 'refresh_token',
                    client_id: 'bWUNFvT10QJBoWqZn7b4MYAfwMFS8q8C',
                    client_secret: 'IaAds7SUSktrybzfIH0Rp3a8WmwdiGAX5sGq9HU2JV0RUPWw1gR5nCqaWAvw44ug',
                    refresh_token: req.session.refreshToken
                }
        };

        request(options, function (error, response, resBody) {
            if (error) {
                console.error(error)
                res.status(500).send(error)
                return
            }

            resBody = JSON.parse(resBody)
            console.log(`resBody: ${resBody}`)

            if (resBody['error']) {
                res.status(500).send(resBody)
                return
            }

            req.session.accessToken = resBody['access_token']
            req.session.refreshToken = resBody['refresh_token']
            req.session.expiresIn = new Date().getTime() + (parseInt(resBody['expires_in']) * 1000)
            console.log(`Expires in: ${new Date(req.session.expiresIn)}`)
        });
    }
    res.render('index', {login: req.session.login})
})

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
})

app.post('/api/login', (req, res) => {
    const {login, password} = req.body;
    console.log(`Login: ${login} ${password}`)

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

    request(options, function (error, response, resBody) {
        if (error) {
            console.error(error)
            res.status(500).send(error)
            return
        }

        resBody = JSON.parse(resBody)
        console.log(`resBody: ${resBody}`)

        if (resBody['error']) {
            console.error(error)
            res.status(500).send(resBody)
            return;
        }

        req.session.accessToken = resBody['access_token']
        req.session.refreshToken = resBody['refresh_token']
        req.session.expiresIn = new Date().getTime() + (parseInt(resBody['expires_in']) * 1000)
        req.session.login = login;
        console.log(`Expires in: ${new Date(req.session.expiresIn)}`)

        res.json({token: resBody['access_token']});
    });

})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
