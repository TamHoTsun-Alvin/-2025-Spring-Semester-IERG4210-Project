//This will be the nodejs server to handle the login part, designated revProx = 11680

//Importing libs and instance creation

const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const rateLimit = require('express-rate-limit');
const fs = require('fs') //just realized I cant keep a terminal live forever, eror logging is necessary for future reference
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const { dir } = require('console');
const bcrypt = require('bcrypt');


const webapp = express();
const port = 11680;
const secretkey = '31f#$6412asA6F@@+V%$66sdx5v1:k53vx'
const pepper = 'fw51fq34t665q:#@r15'
const salt = 'rga><GRAWSD$:@$R+AD<?><LASFdefk'

const kp = crypto.scryptSync(pepper, 'i6emk-6xsc#', 32);
const ks = crypto.scryptSync(salt, 'q659skVXSt50800%', 32);

const algorithm = 'aes-256-cbc';

const lim = rateLimit({ // considering in disabling respective user as well, but thats for later concern
    max: 3000,
    windowMs: 10 * 60 * 1000, // 3 per 10 minute, change to 3 per week in production
    message: "Too Many request, please try again later, or dont come back and grab a big-belly Burger",
    statusCode: 429,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip 
});

const critLim = rateLimit({
    max: 1000,
    windowMs: 900 * 60 * 1000, // Multiple Entries returned, immediate full blocking
    message: "Too Many request, please try again later and maybe grab some big-belly burger",
    statusCode: 429,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip 
});

function conAppender(msg) {
    const dt = new Date().toISOString();
    const fmsg = `[${dt}]: ${msg}\n`;

    fs.appendFile("lg_log.txt", fmsg, (err) => {
        if(err){
            console.log('Error in writing to log:', err);
        }   

    });
    console.log(fmsg);
}

function encrypt(pt, key){
    const initVector = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, initVector);
    let enc = cipher.update(pt, 'utf8', 'hex');
    enc += cipher.final('hex');
    return initVector.toString('hex') + ':' + enc;
}

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
          'SELECT entity FROM userac WHERE entity = ?',
          [username],
          (err, row) => (err ? reject(err) : resolve(row))
        );
      });
  
      if (!userRow) {
        conAppender('User not found in userac');
        res.clearCookie('token');
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
function enc2(pt){
    const intermediate = encrypt(pt, ks);
    return encrypt(intermediate, kp);
}

function dec2(et){
    const intermediate = decrypt(et, kp);
    return decrypt(intermediate, ks);
}

webapp.use(bodyParser.json()); //IO middleware parsing
webapp.use(cookieParser(secretkey));
webapp.use(lim);
webapp.use(critLim);
webapp.use(express.json());
webapp.use(express.urlencoded({extended: true}));

webapp.use((req, res, next) => {
    const nonce = crypto.randomBytes(32).toString('hex');
    res.locals.nonce = nonce;
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}'`,
      `style-src 'self' 'nonce-${nonce}'`,
      "object-src 'none'",
      "base-uri 'self'",
      "frame-src 'none'"
    ].join('; ');
    res.setHeader('Content-Security-Policy', csp);
    next();
  });

webapp.use(session({
    store: new SQLiteStore({
      db: 'sessions.db',
      dir: 'dbinstance',
      ttl: 86400,
      schema: {
        tableName: 'sessions',
        columnNames: {
          session_id: 'sid',      
          expires: 'expired',     
          data: 'sess'            
        }
      }
    }),
    secret: secretkey,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,
        maxAge: 86400000
    }
  }));



function initiation(port) { //Server Initiating: Provides very limited counter (only to port conflict, maybe add more counter in later stage)
    webapp.listen(port, () => {
        conAppender("Login Server is up at:" + port);
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

const db = new sqlite3.Database('dbinstance/lgif.db', (err) => { //DB Connection
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


webapp.post('/authv1/lgi/', (req, res) => {   
    db.all(
      'SELECT entity , pw FROM userac WHERE entity = ?',
      [req.body.entity],
      (err, row) => {
        conAppender(`Login attempt for ${req.body.entity}`);
        if (err) {
          conAppender(`DB Error: ${err.message}`);
          return res.status(500).json({ msg: "Server error" });
        }

        if (row.length > 1) {
            critLim(req, res, () => {
                conAppender(`Multiple entries returned`);
            })
        }
  
        const fail = () => {
          const msg = "login failed";
          res.send(msg);
        };
  
        if (!row) {
          conAppender(`Login attempt for non-existent user: ${req.body.entity}`);
          return fail();
        }
  
        bcrypt.compare(req.body.pw, row[0].pw , (err, result) => {
          if (err) {
            conAppender(`Failed login for ${req.body.entity}`);
	    conAppender(`${req.body.pw} / ${row[0].pw}`);
	    conAppender(err);
            rateLimit(req, res, () => {});
            return fail();
          }

          if(!result) {
            conAppender(`Wrong password for ${req.body.entity}`);
            return fail();
          }
  
          const sN = Date.now();
          req.session.sessionNumber = sN;
          req.session.username = row[0].entity;
  
          const payload = {
            sessionID: req.sessionID,
            username: row[0].entity,
            sN: sN
          };
          const token = enc2(JSON.stringify(payload));
  
          res.cookie('token', token, {
            maxAge: 86400000,
            httpOnly: true,
            secure: true
          });
  
          res.json({ 
            msg: "Login Successful",
            sN,
            uname: row[0].entity
          });
        });
      }
    );
  });

webapp.get('/authv1/test/', validate, (req, res) => {
    res.send(`Validation test passed`);
});

webapp.get('/authv1/logout/', (req, res)=> {
    req.session.destroy(err => {
        if(err){
            conAppender('LogoutError', err);
            return res.status(500);
        }
    })
    res.clearCookie('connect.sid');
    res.clearCookie('token');
    return res.send('Logout sucessful');
});


initiation(port);