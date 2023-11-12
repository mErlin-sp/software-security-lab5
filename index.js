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

app.use(express.static('public'));

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

app.get('/create-user', (req, res) => {

    if (req.session.expiresIn && (req.session.expiresIn - new Date().getTime()) < 10000) {
        res.redirect('/')
        return
    }
    res.render('create-user', {})
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

app.post('/api/create-user', (req, res) => {
    const options = {
        method: 'POST',
        url: 'https://dev-00wdj4huibiu7y8p.us.auth0.com/oauth/token',
        headers: {'content-type': 'application/x-www-form-urlencoded'},
        form: {
            audience: "https://dev-00wdj4huibiu7y8p.us.auth0.com/api/v2/",
            grant_type: "client_credentials",
            client_id: "4aeeF2vTXRHaLVcrvYkZA5u8swvBFzJz",
            client_secret: "IQTr49MvuDUS536QV3xuDO26Aoe74SKAuECXcNGISvCX5pDIemCAVRCYYmkcb6de",
        }
    };

    request(options, function (error, response, body) {
        if (error) {
            console.error(error)
            res.status(500).send(error)
            return;
        }

        body = JSON.parse(body)
        if (body['error']) {
            console.error(body)
            res.status(500).send(body)
            return;
        }

        const {email, name, password} = req.body;
        console.log(`Email: ${email} Name: ${name} Password: ${password}`)
        console.log(`Bearer ${body['access_token']}`)

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Accept", "application/json");
        myHeaders.append("Authorization", `Bearer ${body['access_token']}`);

        const raw = JSON.stringify({
            "email": email,
            "name": name,
            "password": password,
            "connection": "my-connection",
        });

        const requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: raw,
            redirect: 'follow'
        };

        fetch("https://dev-00wdj4huibiu7y8p.us.auth0.com/api/v2/users", requestOptions)
            .then(response => response.text())
            .then(result => {
                console.log(`Create User: ${result}`)

                result = JSON.parse(result)
                if (result['error']) {
                    res.status(500).send(result)
                    return;
                }
                res.status(200).send(result)
            })
            .catch(error => {
                console.error(error)
                res.status(500).send(error)
            });
    });


})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
