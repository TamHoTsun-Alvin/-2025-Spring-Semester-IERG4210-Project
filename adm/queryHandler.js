//This will be the nodejs server to handle the queries from the client and send the response back, designated port on apache rev proxy would be 6600

//Importing libs and instance creation

const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs') //just realized I cant keep a terminal live forever, eror logging is necessary for future reference
const crypto = require('crypto'); 
const webapp = express();
const port = 6600;
const stripe = require('stripe')('sk_test_51RImWgIeuS6oLuC9a5qkA1l2ibfL8H3zd7VshAWQtm9HoWU5UQx925AOEeJxbeGGPSKuICURXtO3eC64NKZJFRaa00GPfyGsqa'); 
const eps = 'whsec_8gfuBN2e1UnMCuu62qUDS56emYCZQhuQ'; //webhook

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

const verstappen = new sqlite3.Database('dbinstance/sessions.db', (err) => { //sessions DB Connection
    if(err){ 
        conAppender("DB Error, Here is what it says before it went on a strike:" + err.message);
    } else {
        conAppender("sessions Database Connected, Begin serving queries");
    }
});

webapp.use((req, res, next) => {
    const nonce = crypto.randomBytes(32).toString('hex');
    res.locals.nonce = nonce;
    
    const csp = [
        "default-src 'self'",
        "base-uri 'self'",
        "form-action 'self' https://checkout.stripe.com",
        "object-src 'none'",
        `script-src 'self' https://static.xx.fbcdn.net https://connect.facebook.net https://www.facebook.net www.facebook.com https://*.fbcdn.net https://js.stripe.com https://*.google-analytics.com https://*.googletagmanager.com 'nonce-${nonce}'`,
        `style-src 'self'  https://static.xx.fbcdn.net https://checkout.stripe.com https://*.facebook.com https://*.fbcdn.net 'nonce-${nonce}'`,
        "connect-src 'self' https://static.xx.fbcdn.net https://api.stripe.com https://checkout.stripe.com https://*.facebook.com https://*.fbcdn.net https://*.google-analytics.com data:",
        "img-src 'self' https://static.xx.fbcdn.net https://*.stripe.com https://*.facebook.com https://*.fbcdn.net data:",
        "frame-src 'self' https://static.xx.fbcdn.net https://js.stripe.com https://checkout.stripe.com www.facebook.com",
        "child-src 'none'",
        "frame-ancestors 'none'",
        "worker-src 'none'"
      ].join('; ');
      
      res.setHeader('Content-Security-Policy', csp);
      next();
});

function decrypt(enc, key){
    const spliter = enc.split(':');
    if (spliter.length !== 2){
        throw new Error('DEC_ivf')
    }
    const initVector = Buffer.from(spliter[0], 'hex');
    const content = spliter[1];
    const decipher = crypto.createDecipheriv(algorithm, key, initVector);
    let decrypted = decipher.update(content, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

function dec2(et){
    const intermediate = decrypt(et, kp);
    return decrypt(intermediate, ks);
}

//APIs: getCat, getAll, getByCat, getOne(ID), postAdd, updatePut, rmDelete
async function validate(req, res, next) {
    const token = req.cookies.token;
    if (!token) return res.redirect('/index.html');
  
    try {
      const decryptedToken = dec2(token);
      const { sessionID, sN, username } = JSON.parse(decryptedToken);
      const sessionRow = await new Promise((resolve, reject) => {
        verstappen.get(
          'SELECT expired, sess FROM sessions WHERE sid = ?', 
          [sessionID],
          (err, row) => (err ? reject(err) : resolve(row))
        );
      });
  
      if (!sessionRow) {
        conAppender('Session not found in database');
        res.clearCookie('token');
        return res.redirect('/index.html');
      }
  
      if (sessionRow.expired < Date.now()) {
        conAppender('Session expired');
        res.clearCookie('token');
        return res.redirect('/index.html');
      }

      let sessData;
      try {
        sessData = JSON.parse(sessionRow.sess);
      } catch (e) {
        conAppender('Failed to parse session data: ' + e.message);
        throw new Error('Invalid session data format');
      }

      if (sessData.sessionNumber !== sN) {
        conAppender(`Session number mismatch: 
          Token sN: ${sN} vs DB sN: ${sessData.sessionNumber}`);
        res.clearCookie('token');
        return res.redirect('/index.html');
      }
  
      const userRow = await new Promise((resolve, reject) => {
        db.get(
          'SELECT entity, isA FROM userac WHERE entity = ?',
          [username],
          (err, row) => (err ? reject(err) : resolve(row))
        );
      });
  
      if (!userRow) {
        conAppender('User not found in userac');
        res.clearCookie('token');
        return res.redirect('/index.html');
      }
        if (userRow[0].isA !== 1) {
            conAppender('User is not an admin');
            return res.redirect('/index.html');
        }
      req.username = username;
      req.sessionNumber = sN;
      
      conAppender(`Validation passed for ${username} dudududu Max Verstappen` );
      next();
    } catch (error) {
      conAppender(`Validation failed: ${error.message} ohhhhhhh Fernado Alonso` );
      res.clearCookie('token');
      return res.redirect('/index.html');
    }
  }


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

webapp.post('/api/products', validate, (req, res) => { //postAdd
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

webapp.put('/api/products/:id', validate, (req, res) => { //updatePut
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

webapp.delete('/api/products/:id', validate, (req, res) => { //rmDelete
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

async function validateCheckout(req, res, next) { //why do we even allow guest to checkout?
    const token = req.cookies.token;
    req.user = { username: 'guest', isGuest: true }; // Default guest user
    if (!token) return next(); // Proceed as guest
    try {
        const decryptedToken = dec2(token);
        const { sessionID, sN, username } = JSON.parse(decryptedToken);
        const sessionRow = await new Promise((resolve, reject) => {
            verstappen.get(
                'SELECT expired, sess FROM sessions WHERE sid = ?',
                [sessionID],
                (err, row) => (err ? reject(err) : resolve(row))
            );
        });
        if (!sessionRow || sessionRow.expired < Date.now()) {
            res.clearCookie('token');
            return next(); // Fallback to guest
        }
        const userRow = await new Promise((resolve, reject) => {
            db.get(
                'SELECT entity FROM userac WHERE entity = ?',
                [username],
                (err, row) => (err ? reject(err) : resolve(row))
            );
        });
        if (!userRow) {
            res.clearCookie('token');
            return next(); // Fallback to guest
        }
        req.user = {
            username: username,
            isGuest: false,
            sessionID: sessionID
        };
        next();
    } catch (error) {
        res.clearCookie('token');
        next(); // Fallback to guest on any error
    }
}

/*async function validateCartItems(cartItems) {
    try {
      const validatedItems = await Promise.all(
        cartItems.map(async (item) => {
          // Structure Discompliance
          if (!item.pid || !item.qty) {
            throw new Error('Invalid cart item structure');
          }
  
          // Qty Impossible
          if (!Number.isInteger(item.qty) || item.qty <= 0) {
            throw new Error(`Invalid quantity for product ${item.pid}`);
          }
          const product = await new Promise((resolve, reject) => {
            db.get(
              'SELECT pid, name, price FROM products WHERE pid = ?',
              [item.pid],
              (err, row) => {
                if (err) reject(err);
                else if (!row) reject(new Error(`Product ${item.pid} not found`));
                else resolve(row);
              }
            );
          });
  
          // Altered Price
          if (product.price !== item.price) {
            throw new Error(`Price mismatch for product ${item.name} (PID: ${item.pid})`);
          }
  
          return {
            pid: product.pid,
            name: product.name,
            price: product.price,
            qty: item.qty
          };
        })
      );
  
      return validatedItems;
    } catch (error) {
      conAppender(`Cart validation failed: ${error.message}`);
      throw new Error(`Cart validation failed: ${error.message}`);
    }
  }
    */
/*webapp.post('/api/create-payment-intent', async (req, res) => {
    try {
        const { amount, currency, orderID } = req.body;
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount), 
            currency: currency.toLowerCase(),
            metadata: { orderID }
        });
        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
*/
webapp.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { items, user } = req.body;
        
        const validatedItems = await Promise.all(items.map(async item => {
            const product = await new Promise((resolve, reject) => {
                db.get('SELECT pid, price FROM products WHERE pid = ?', [item.pid], 
                    (err, row) => err ? reject(err) : resolve(row));
            });

            if(!product) throw new Error(`Product ${item.pid} not found`);
            if(product.price !== item.price) throw new Error(`Price changed for ${item.name}`);
            
            return {
                price_data: {
                    currency: 'hkd',
                    product_data: { name: item.name },
                    unit_amount: item.price * 100,
                },
                quantity: item.qty
            };
        }));

        const order = await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO orders (user, total, status) 
                 VALUES (?, ?, ?)`,
                [user, validatedItems.reduce((sum, item) => sum + (item.price_data.unit_amount * item.quantity), 0), 'pending'],
                function(err) {
                    if(err) return reject(err);
                    resolve({ orderID: this.lastID });
                }
            );
        });

        await Promise.all(items.map(item => 
            new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO order_items 
                     (orderID, pid, name, price, quantity) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [order.orderID, item.pid, item.name, item.price, item.qty],
                    (err) => err ? reject(err) : resolve()
                );
            })
        ));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'alipay'],
            line_items: validatedItems,
            mode: 'payment',
            success_url: `https://s30.ierg4210.ie.cuhk.edu.hk/success.html`,
            cancel_url: `https://s30.ierg4210.ie.cuhk.edu.hk/cancel.html`,
            metadata: { orderID: order.orderID }
        });

        res.json({ sessionId: session.id });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

webapp.post('/stripe-webhook', 
  bodyParser.raw({type: 'application/json'}),
  (req, res) => {
    const sig = req.headers['stripe-signature'];

    try {
      const event = stripe.webhooks.constructEvent(req.body, sig, eps);

      if(event.type === 'checkout.session.completed') {
        const session = event.data.object;
        conAppender(`Webhook event received: ${event.type}`);
        db.run(`UPDATE orders SET status='paid' WHERE stripe_payment_id=?`,
          [session.payment_intent], (err) => {
            if(err) console.error('Webhook DB Error:', err);
            conAppender(`Payment received/DBE for order ID: ${session.metadata.orderID}`);
          });
          conAppender(`$$$$: ${event.type}`);
      }

      res.json({received: true});
    } catch (err) {
      res.status(400).send(`Webhook Error: ${err.message}`);
      conAppender(`Webhook Error: ${err.message}`);
    }
  }
);

initiation(port);
