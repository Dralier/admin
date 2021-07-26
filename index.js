const express = require("express");
const nunjucks = require("nunjucks");
const app = express();
const nomDB = "project_admin";

session = require("express-session");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname + "/public"));
const MongoClient = require("mongodb").MongoClient;
const MONGO_URL = "mongodb://localhost:27017/" + nomDB;
app.use(
    session({
        secret:
            process.env.SECRETSESSION || "contraseña-hyper-mega-archi-secreta",
        name: "sessionId",
        proxy: true,
        resave: true,
        saveUninitialized: true,
        cookie: { maxAge: 60 * 10000 },
    })
);

nunjucks.configure("views", {
    autoescape: true,
    express: app,
});

const isLoggedIn = function (req, res, next) {
    if (!req.session.user) {
        res.redirect("/login");
    } else {
        return next();
    }
};

app.get("/", isLoggedIn, function (req, res) {
    const user = req.session
        ? req.session.user.nombre + " " + req.session.user.apellido
        : "";

    MongoClient.connect(
        MONGO_URL,
        { useUnifiedTopology: true },
        async (err, db) => {
            const dbo = db.db(nomDB);

            const items = dbo.collection("libros").find(
                !req.query.searchValue ? {} : {
                    $or:[
                        {isbn:{$in:[req.query.searchValue]}},
                        {titulo:{$in:[req.query.searchValue]}},
                    ]
                }
            );
            const libros = await items.toArray();
            console.log(libros);

            res.status(200).render("home.html", { user, libros });
        }
    );
});
app.get("/libros", isLoggedIn, function (req, res) {
    res.status(200).render("libros.html");
});

app.get("/agregar_libro", isLoggedIn, function (req, res) {
    res.render("agregar_libro.html");
});

app.post("/agregar_libro", isLoggedIn, async function (req, res) {
    let _db;
    let client;
    try{
        client = await MongoClient.connect(MONGO_URL, { useUnifiedTopology: true });
        _db = client.db("project_admin");

        const resp = await _db.collection("libros").insertOne(req.body);
        console.log("reg inserted", resp);
        res.status(200).redirect("/");

    }   catch (error) {
            console.log("error", error);
            res.status(400).render("agregar_libro.html",{
                mensaje:"Error de Base de Datos"
            });
    }   finally{
            client.close();
    }
});
// app.post("/agregar_libro", isLoggedIn, function (req, res) {
//     MongoClient.connect(MONGO_URL, { useUnifiedTopology: true }, (err, db) => {
//         const dbo = db.db(nomDB);
//         console.log(req.body);
//         dbo.collection("libros").insertOne(
//             {
//                 isbn: req.body.isbn,
//                 titulo: req.body.titulo,
//                 autor: req.body.autor,
//                 year: req.body.year,
//                 pais: req.body.pais,
//                 editorial: req.body.editorial,
//             },
//             function (err, res1) {
//                 console.log("err", err);
//                 if (err) {
//                     res.status(400).render("agregar_libro.html", {
//                         mensaje: "Error de Base de Datos",
//                     });
//                 } else {
//                     res.status(200).redirect("/");
//                 }
//             }
//         );
//     });
// });

app.get("/login", function (req, res) {
    res.status(200).render("login.html");
});

app.post("/authenticate", function (req, res) {
    if (!req.body.user || !req.body.pass) {
        res.status(400).render("error.html", {
            code: 400,
            msg: "No se recibieron credenciales.",
        });
        return;
    }

    MongoClient.connect(MONGO_URL, { useUnifiedTopology: true }, (err, db) => {
        const dbo = db.db(nomDB);
        
        dbo.collection("users").findOne(
            { username: req.body.user.toLowerCase() },
            function (err, user) {
                if (
                    !user ||
                    (user && user.password.trim() !== req.body.pass.trim())
                ) {
                    res.status(401).render("error.html", {
                        code: 401,
                        msg: "Credenciales invalidas.",
                    });
                    return;
                }
                req.session.user = user;
                res.redirect("/");
            }
        );
    });
});

app.get("/logout", function (req, res) {
    req.session.destroy();
    res.redirect("/");
});

app.listen(8080);
