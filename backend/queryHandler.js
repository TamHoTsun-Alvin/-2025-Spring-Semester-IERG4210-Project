//This will be the nodejs server to handle the queries from the client and send the response back, designated port on apache rev proxy would be 6600

//Importing libs and instance creation

const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs') //just realized I cant keep a terminal live forever, eror logging is necessary for future reference

const webapp = express();
const port = 6600;

function conAppender(msg) {
    const dt = new Date().toISOString();
    const fmsg = `[${dt}]: ${msg}\n`;

    fs.appendFile("aclog.txt", fmsg, (err) => {
        if(err){
            console.log('Error in writing to log:', err);
        }   

    });
    console.log(fmsg);
}

webapp.use(bodyParser.json()); //IO middleware parsing

function initiation(port) { //Server Initiating: Provides very limited counter (only to port conflict, maybe add more counter in later stage)
    webapp.listen(port, () => {
        conAppender("Server is up and running on port: " + port);
    })
    .on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            conAppender('Port is already in use, increment in progress until success');
            port = port + 1;
            initiation(port);
        } else {
            conAppender("Server Error:" + err);
        }
    });
};

const db = new sqlite3.Database('dbinstance/webproject.db', (err) => { //DB Connection
    if(err){ 
        conAppender("DB Error, Here is what it says before it went on a strike:" + err.message);
    } else {
        conAppender("Database Connected, Begin serving queries");
    }
});

//APIs: getCat, getAll, getByCat, getOne(ID), postAdd, updatePut, rmDelete
webapp.get('/api/categories', (req, res) => { //getCat
    db.all("SELECT * FROM categories", (err, rows) => {
        if(err){
            res.status(500).send("The server decided to watch some netflix and stopped serving");
            conAppender("Category Request Error:" + err);
            return;
        }
        else {
            res.json({"categories": rows});
            console.log('Categories Responded Sucessfully');
            conAppender("Categories Responded Sucessfully");
        }
    });
});

webapp.get('/api/categories/:id', (req, res) => { //getCat(ID)
    db.all("SELECT name FROM categories WHERE catid = ?",[req.params.id], (err, rows) => {
        if(err){
            res.status(500).send("The server decided to watch some pirated films and stopped serving");
            conAppender("Category Name Request Error:" + err);
            return;
        }
        else {
            res.json({"categories": rows});
            console.log('Categories Name Responded Sucessfully');
            conAppender("Categories Name Responded Sucessfully");
        }
    });
});

webapp.get('/api/products', (req, res) => { //getALL
    db.all("SELECT * FROM products", (err, rows) => {
        if(err){
            res.status(500).send("The server decided to watch some hulu and stopped serving");
            conAppender("Products Request Error:" + err);
        }
        else {
            res.json({"products": rows});
            console.log('Products Responded Sucessfully');
            conAppender("Products Responded Sucessfully");
        }
    });
});

webapp.get('/api/cat/products/:catid', (req, res) => { //getByCat
    db.all("SELECT * FROM products WHERE catid = ?", [req.params.catid], (err, rows) => {
        if(err){
            res.status(500).send("The server decided to watch some hbo and stopped serving");
            conAppender("Category Products Request Error:" + err);
        }
        else {
            res.json({"products": rows});
            console.log('Category Products Responded Sucessfully');
            conAppender("Category Products Responded Sucessfully");
        }
    });
});

webapp.get('/api/products/:id', (req, res) => { //getOne(ID)
    db.get("SELECT * FROM products WHERE pid = ?", [req.params.id], (err, row) => {
        if(err){
            res.status(500).send("The server decided to watch some prime and stopped serving");
            conAppender("Specific Categories Request Error:" + err);
            return;
        }
        else {
            res.json({"product": row});
            console.log('Specific Categories Responded(ID Search) Sucessfully');
            conAppender("Specific Categories Responded(ID Search) Sucessfully");
        }
    });
});

webapp.post('/api/products', (req, res) => { //postAdd
    db.run("INSERT INTO products (pid, catid, name, price, des) VALUES (?, ?, ?, ?, ?)", 
        [req.body.pid, req.body.catid, req.body.name, req.body.price, req.body.des],
        function(err) {//for accessing "this" instance
            if(err){
                res.status(500).send("The server decided to watch some disney and stopped serving");
                conAppender("Insertion Error:" + err);
                return;
            }
            else {
                res.json({"msg": "Operation Sucessful w/ ID = ", "pid": this.lastID});
                console.log('Insertion Processed Sucessfully');
                conAppender("Insertion Processed Sucessfully");
            }
        });
});

webapp.put('/api/products/:id', (req, res) => { //updatePut
    db.run("UPDATE products SET pid = ?, catid = ?, name = ?, price = ?, des = ? WHERE id = ?", 
        [req.body.pid, req.body.catid, req.body.name, req.body.price, req.body.des, req.params.id],
        function(err) {
            if(err){
                res.status(500).send("The server decided to watch some appleTV and stopped serving");
                conAppender("Update Error:" + err);
                return;
            }
            else {
                res.json({"msg": "Operation Sucessful w/ Info: ", "cg": this.changes});
                conAppender("Update Processed Sucessfully" + this.changes);
            }
        });
});

webapp.delete('/api/products/:id', (req, res) => { //rmDelete
    db.run("DELETE FROM products WHERE pid = ?", [req.params.id], 
        function(err) {
        if(err){
            res.status(500).send("The server decided to watch some youtube and stopped serving");
            conAppender("Deletion Error:" + err);
            return;
        }
        else {
            res.json({"msg": "Operation Sucessful w/ Info: ", "cg": this.changes});
            conAppender("Deletion Processed Sucessfully" + this.changes);
        }
    });
});

initiation(port);